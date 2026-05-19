const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const Cart = require('../models/cartModel');
const Course = require('../models/courseModel');
const Coupon = require('../models/couponModel');
const Enrollment = require('../models/enrollmentModel');

const calcTotal = (cart) => {
  cart.totalPrice = cart.items.reduce((s, i) => s + (i.price || 0), 0);
  cart.totalAfterDiscount = cart.totalPrice;
};

// @desc    Get my cart
// @route   GET /api/v1/cart
exports.getMyCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.course',
    'title slug thumbnail price discountPrice instructor'
  );
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.status(200).json({ data: cart });
});

// @desc    Add course to cart
// @route   POST /api/v1/cart
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return next(new ApiError('Course not found', 404));
  if (course.status !== 'published') {
    return next(new ApiError('Course not available', 400));
  }

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (enrolled) return next(new ApiError('Already enrolled', 400));

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  if (cart.items.some((i) => i.course.toString() === courseId)) {
    return next(new ApiError('Course already in cart', 400));
  }

  const price = course.discountPrice && course.discountPrice > 0
    ? course.discountPrice
    : course.price;
  cart.items.push({ course: course._id, price });
  calcTotal(cart);
  await cart.save();
  res.status(200).json({ data: cart });
});

// @desc    Remove course from cart
// @route   DELETE /api/v1/cart/:courseId
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new ApiError('Cart empty', 404));
  cart.items = cart.items.filter(
    (i) => i.course.toString() !== req.params.courseId
  );
  calcTotal(cart);
  await cart.save();
  res.status(200).json({ data: cart });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], coupon: null, totalPrice: 0, totalAfterDiscount: 0 }
  );
  res.status(204).send();
});

// @desc    Apply coupon
// @route   POST /api/v1/cart/apply-coupon
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expireAt: { $gt: new Date() },
  });
  if (!coupon) return next(new ApiError('Invalid or expired coupon', 400));
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return next(new ApiError('Coupon usage limit reached', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return next(new ApiError('Cart is empty', 400));
  }

  let discountable = cart.totalPrice;
  if (coupon.appliesTo === 'specific') {
    discountable = cart.items
      .filter((i) =>
        coupon.courses.map((c) => c.toString()).includes(i.course.toString())
      )
      .reduce((s, i) => s + i.price, 0);
  }
  const discount =
    coupon.discountType === 'percent'
      ? (discountable * coupon.discountValue) / 100
      : Math.min(coupon.discountValue, discountable);

  cart.coupon = coupon._id;
  cart.totalAfterDiscount = Math.max(0, cart.totalPrice - discount);
  await cart.save();
  res.status(200).json({ data: cart, discount });
});
