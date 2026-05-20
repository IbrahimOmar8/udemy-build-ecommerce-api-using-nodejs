const asyncHandler = require('express-async-handler');
const stripeLib = require('stripe');

const ApiError = require('../utils/apiError');
const { Plan, Subscription } = require('../models/subscriptionModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const User = require('../models/userModel');

const stripe = process.env.STRIPE_SECRET ? stripeLib(process.env.STRIPE_SECRET) : null;

// @desc    List public plans
// @route   GET /api/v1/plans
// @access  Public
exports.listPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort('pricePerMonth');
  res.status(200).json({ results: plans.length, data: plans });
});

// @desc    Admin create plan
// @route   POST /api/v1/plans
// @access  Private/Admin
exports.createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create(req.body);
  res.status(201).json({ data: plan });
});

// @desc    Admin update plan
// @route   PUT /api/v1/plans/:id
// @access  Private/Admin
exports.updatePlan = asyncHandler(async (req, res, next) => {
  const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!plan) return next(new ApiError('Plan not found', 404));
  res.status(200).json({ data: plan });
});

// @desc    Admin delete plan
// @route   DELETE /api/v1/plans/:id
exports.deletePlan = asyncHandler(async (req, res, next) => {
  const plan = await Plan.findByIdAndDelete(req.params.id);
  if (!plan) return next(new ApiError('Plan not found', 404));
  res.status(204).send();
});

// @desc    Start a subscription via Stripe Checkout (recurring)
// @route   POST /api/v1/subscriptions/checkout
// @access  Private/Student
exports.subscribe = asyncHandler(async (req, res, next) => {
  if (!stripe) return next(new ApiError('Payments not configured', 500));
  const { planId, billingCycle = 'monthly' } = req.body;
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) return next(new ApiError('Plan not available', 404));

  const existing = await Subscription.findOne({
    user: req.user._id,
    status: 'active',
  });
  if (existing) return next(new ApiError('You already have an active subscription', 400));

  const priceId =
    billingCycle === 'yearly'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;
  if (!priceId) {
    return next(new ApiError('This billing cycle is not configured for the plan', 400));
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: req.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL || ''}/subscription/success`,
    cancel_url: `${process.env.FRONTEND_URL || ''}/plans`,
    metadata: {
      userId: req.user._id.toString(),
      planId: plan._id.toString(),
      billingCycle,
    },
  });
  res.status(200).json({ url: session.url });
});

// @desc    Activate a subscription on the user's behalf without Stripe (admin / manual)
// @route   POST /api/v1/subscriptions/activate
// @access  Private/Admin or self in trial mode
exports.manualActivate = asyncHandler(async (req, res, next) => {
  const { planId, billingCycle = 'monthly' } = req.body;
  const plan = await Plan.findById(planId);
  if (!plan) return next(new ApiError('Plan not found', 404));

  const months = billingCycle === 'yearly' ? 12 : 1;
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + months);

  const userId = req.body.userId && req.user.role === 'admin' ? req.body.userId : req.user._id;
  await Subscription.deleteOne({ user: userId, status: 'active' });
  const subscription = await Subscription.create({
    user: userId,
    plan: plan._id,
    billingCycle,
    status: 'active',
    currentPeriodEnd: periodEnd,
  });
  res.status(201).json({ data: subscription });
});

// @desc    My active subscription
// @route   GET /api/v1/subscriptions/me
exports.mySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active',
  });
  res.status(200).json({ data: subscription });
});

// @desc    Cancel my subscription (at period end)
// @route   POST /api/v1/subscriptions/cancel
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active',
  });
  if (!subscription) return next(new ApiError('No active subscription', 404));

  if (stripe && subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }
  subscription.cancelAtPeriodEnd = true;
  subscription.cancelledAt = new Date();
  await subscription.save();
  res.status(200).json({ data: subscription });
});

// @desc    Enroll in a course using an active subscription (no charge)
// @route   POST /api/v1/subscriptions/enroll
// @access  Private/Student with active subscription
exports.enrollWithSubscription = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;
  const subscription = await Subscription.findOne({
    user: req.user._id,
    status: 'active',
  });
  if (!subscription) {
    return next(new ApiError('Active subscription required', 402));
  }
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
    return next(new ApiError('Subscription expired', 402));
  }

  const course = await Course.findById(courseId);
  if (!course || course.status !== 'published') {
    return next(new ApiError('Course not available', 404));
  }
  if (subscription.plan.catalogAccess === 'curated') {
    const allowed = (subscription.plan.curatedCourses || []).some(
      (c) => c.toString() === course._id.toString()
    );
    if (!allowed) {
      return next(new ApiError('Course not included in your subscription', 403));
    }
  }

  const exists = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (exists) return next(new ApiError('Already enrolled', 400));

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: course._id,
    pricePaid: 0,
  });
  await Course.findByIdAndUpdate(course._id, {
    $inc: { enrollmentsCount: 1 },
  });
  await User.findByIdAndUpdate(req.user._id, { $inc: { enrolledCount: 1 } });
  res.status(201).json({ data: enrollment });
});
