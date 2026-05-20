const asyncHandler = require('express-async-handler');
const stripeLib = require('stripe');

const ApiError = require('../utils/apiError');
const Cart = require('../models/cartModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const Payment = require('../models/paymentModel');
const Coupon = require('../models/couponModel');
const User = require('../models/userModel');

const stripe = process.env.STRIPE_SECRET
  ? stripeLib(process.env.STRIPE_SECRET)
  : null;

const grantEnrollments = async ({ user, items, payment }) => {
  const newEnrollments = [];
  for (const item of items) {
    const exists = await Enrollment.findOne({
      student: user._id,
      course: item.course,
    });
    if (exists) continue;
    const enr = await Enrollment.create({
      student: user._id,
      course: item.course,
      pricePaid: item.price,
      paymentId: payment._id,
    });
    newEnrollments.push(enr);
    await Course.findByIdAndUpdate(item.course, {
      $inc: { enrollmentsCount: 1 },
    });
  }
  await User.findByIdAndUpdate(user._id, {
    $inc: { enrolledCount: newEnrollments.length },
  });
  return newEnrollments;
};

// @desc    Create Stripe checkout session for current cart
// @route   POST /api/v1/payments/checkout
// @access  Private/Student
exports.checkout = asyncHandler(async (req, res, next) => {
  if (!stripe) return next(new ApiError('Payment provider not configured', 500));

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.course'
  );
  if (!cart || cart.items.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  const payment = await Payment.create({
    user: req.user._id,
    items: cart.items.map((i) => ({
      course: i.course._id,
      price: i.price,
      title: i.course.title,
    })),
    totalAmount: cart.totalAfterDiscount || cart.totalPrice,
    coupon: cart.coupon,
    discountAmount: cart.totalPrice - (cart.totalAfterDiscount || cart.totalPrice),
    paymentMethod: 'stripe',
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: req.user.email,
    success_url: `${process.env.FRONTEND_URL || ''}/payment-success?id=${payment._id}`,
    cancel_url: `${process.env.FRONTEND_URL || ''}/cart`,
    metadata: { paymentId: payment._id.toString(), userId: req.user._id.toString() },
    line_items: cart.items.map((i) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.course.title },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: 1,
    })),
  });

  payment.stripeSessionId = session.id;
  await payment.save();
  res.status(200).json({ url: session.url, paymentId: payment._id });
});

// @desc    Free checkout (price = 0 after coupon)
// @route   POST /api/v1/payments/free-checkout
// @access  Private/Student
exports.freeCheckout = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.course');
  if (!cart || cart.items.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }
  const total = cart.totalAfterDiscount;
  if (total > 0) {
    return next(new ApiError('Cart total is not zero', 400));
  }
  const payment = await Payment.create({
    user: req.user._id,
    items: cart.items.map((i) => ({
      course: i.course._id,
      price: i.price,
      title: i.course.title,
    })),
    totalAmount: 0,
    coupon: cart.coupon,
    discountAmount: cart.totalPrice,
    paymentMethod: 'free',
    paymentStatus: 'paid',
    paidAt: new Date(),
  });
  await grantEnrollments({ user: req.user, items: payment.items, payment });
  if (cart.coupon) {
    await Coupon.findByIdAndUpdate(cart.coupon, { $inc: { usedCount: 1 } });
  }
  cart.items = [];
  cart.coupon = null;
  cart.totalPrice = 0;
  cart.totalAfterDiscount = 0;
  await cart.save();
  res.status(200).json({ data: payment });
});

// @desc    Stripe webhook
// @access  Public (signed)
exports.webhookCheckout = asyncHandler(async (req, res) => {
  if (!stripe) return res.status(200).send();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata && session.metadata.paymentId;
    if (paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment && payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.paidAt = new Date();
        payment.transactionId = session.payment_intent;
        await payment.save();
        const user = await User.findById(payment.user);
        await grantEnrollments({ user, items: payment.items, payment });
        if (payment.coupon) {
          await Coupon.findByIdAndUpdate(payment.coupon, {
            $inc: { usedCount: 1 },
          });
        }
        await Cart.findOneAndUpdate(
          { user: payment.user },
          { items: [], coupon: null, totalPrice: 0, totalAfterDiscount: 0 }
        );
      }
    }
  }

  res.status(200).json({ received: true });
});

// @desc    My payment history
// @route   GET /api/v1/payments/me
exports.myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('items.course', 'title slug thumbnail');
  res.status(200).json({ results: payments.length, data: payments });
});

// 30-day refund window (Udemy-style money-back guarantee)
const REFUND_WINDOW_DAYS = Number(process.env.REFUND_WINDOW_DAYS || 30);
const REFUND_PROGRESS_CAP = Number(process.env.REFUND_PROGRESS_CAP || 30);

// @desc    Request a refund for one enrolled course (within 30 days, low watch time)
// @route   POST /api/v1/payments/refund
// @access  Private/Student
exports.requestRefund = asyncHandler(async (req, res, next) => {
  const { enrollmentId, reason } = req.body;
  if (!enrollmentId) return next(new ApiError('enrollmentId is required', 400));

  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    student: req.user._id,
  });
  if (!enrollment) return next(new ApiError('Enrollment not found', 404));

  // Check refund window
  const ageDays = (Date.now() - enrollment.createdAt) / (1000 * 60 * 60 * 24);
  if (ageDays > REFUND_WINDOW_DAYS) {
    return next(
      new ApiError(
        `Refund window expired (${REFUND_WINDOW_DAYS}-day money-back guarantee)`,
        400
      )
    );
  }
  if (enrollment.progressPercent > REFUND_PROGRESS_CAP) {
    return next(
      new ApiError(
        `Refunds are only available when you've watched less than ${REFUND_PROGRESS_CAP}% of the course`,
        400
      )
    );
  }
  if (enrollment.pricePaid <= 0) {
    return next(new ApiError('This was a free enrollment — nothing to refund', 400));
  }

  const payment = enrollment.paymentId
    ? await Payment.findById(enrollment.paymentId)
    : null;

  // Issue Stripe refund when applicable
  if (payment && payment.paymentMethod === 'stripe' && stripe && payment.transactionId) {
    try {
      await stripe.refunds.create({
        payment_intent: payment.transactionId,
        amount: Math.round(enrollment.pricePaid * 100),
      });
    } catch (err) {
      return next(new ApiError(`Stripe refund failed: ${err.message}`, 500));
    }
  }

  // Update payment record
  if (payment) {
    payment.refundAmount = (payment.refundAmount || 0) + enrollment.pricePaid;
    payment.refundedCourses = payment.refundedCourses || [];
    payment.refundedCourses.push(enrollment.course);
    payment.refundReason = reason || payment.refundReason;
    payment.refundedAt = new Date();
    if (payment.refundAmount >= payment.totalAmount) {
      payment.paymentStatus = 'refunded';
    }
    await payment.save();
  }

  // Remove enrollment + decrement counters
  await enrollment.deleteOne();
  await Course.findByIdAndUpdate(enrollment.course, {
    $inc: { enrollmentsCount: -1 },
  });
  await User.findByIdAndUpdate(req.user._id, { $inc: { enrolledCount: -1 } });

  res.status(200).json({
    status: 'success',
    refundAmount: enrollment.pricePaid,
    message: 'Refund processed. You will see the amount returned within 5-10 business days.',
  });
});

// @desc    Check if a refund is eligible (used to enable/disable the UI button)
// @route   GET /api/v1/payments/refund-eligibility/:enrollmentId
// @access  Private/Student
exports.refundEligibility = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.enrollmentId,
    student: req.user._id,
  });
  if (!enrollment) return next(new ApiError('Enrollment not found', 404));

  const ageDays = (Date.now() - enrollment.createdAt) / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, REFUND_WINDOW_DAYS - ageDays);
  const eligible =
    ageDays <= REFUND_WINDOW_DAYS &&
    enrollment.progressPercent <= REFUND_PROGRESS_CAP &&
    enrollment.pricePaid > 0;

  res.status(200).json({
    eligible,
    daysLeft: Math.ceil(daysLeft),
    progressPercent: enrollment.progressPercent,
    pricePaid: enrollment.pricePaid,
    reason: !eligible
      ? enrollment.pricePaid <= 0
        ? 'Free enrollment'
        : ageDays > REFUND_WINDOW_DAYS
          ? 'Refund window expired'
          : 'Watched more than 30%'
      : null,
  });
});
