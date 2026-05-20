const asyncHandler = require('express-async-handler');
const slugify = require('slugify');

const ApiError = require('../utils/apiError');
const Bundle = require('../models/bundleModel');
const Course = require('../models/courseModel');
const Cart = require('../models/cartModel');
const Enrollment = require('../models/enrollmentModel');
const Payment = require('../models/paymentModel');
const User = require('../models/userModel');

// @desc    List active bundles
// @route   GET /api/v1/bundles
// @access  Public
exports.listBundles = asyncHandler(async (req, res) => {
  const bundles = await Bundle.find({ isActive: true })
    .populate('courses', 'title slug thumbnail price ratingsAverage')
    .sort('-createdAt');
  res.status(200).json({ results: bundles.length, data: bundles });
});

// @desc    Get a bundle
// @route   GET /api/v1/bundles/:idOrSlug
// @access  Public
exports.getBundle = asyncHandler(async (req, res, next) => {
  const idOrSlug = req.params.idOrSlug;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const bundle = await Bundle.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).populate('courses');
  if (!bundle) return next(new ApiError('Bundle not found', 404));
  res.status(200).json({ data: bundle });
});

// @desc    Admin create bundle
// @route   POST /api/v1/bundles
exports.createBundle = asyncHandler(async (req, res) => {
  if (!req.body.slug && req.body.title) {
    req.body.slug = `${slugify(req.body.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  req.body.createdBy = req.user._id;
  const bundle = await Bundle.create(req.body);
  res.status(201).json({ data: bundle });
});

// @desc    Admin update bundle
// @route   PUT /api/v1/bundles/:id
exports.updateBundle = asyncHandler(async (req, res, next) => {
  const bundle = await Bundle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!bundle) return next(new ApiError('Bundle not found', 404));
  res.status(200).json({ data: bundle });
});

// @desc    Admin delete bundle
// @route   DELETE /api/v1/bundles/:id
exports.deleteBundle = asyncHandler(async (req, res, next) => {
  const bundle = await Bundle.findByIdAndDelete(req.params.id);
  if (!bundle) return next(new ApiError('Bundle not found', 404));
  res.status(204).send();
});

// @desc    Add bundle to cart (expands into its courses)
// @route   POST /api/v1/cart/bundle
// @access  Private/Student
exports.addBundleToCart = asyncHandler(async (req, res, next) => {
  const { bundleId } = req.body;
  const bundle = await Bundle.findById(bundleId).populate('courses');
  if (!bundle || !bundle.isActive) return next(new ApiError('Bundle not available', 404));

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  // Use bundle price split evenly across courses
  const totalCourses = bundle.courses.length || 1;
  const finalPrice = bundle.discountPrice || bundle.price;
  const pricePerCourse = finalPrice / totalCourses;

  for (const course of bundle.courses) {
    const enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });
    if (enrolled) continue;
    if (cart.items.some((i) => i.course.toString() === course._id.toString())) continue;
    cart.items.push({ course: course._id, price: pricePerCourse });
  }
  cart.totalPrice = cart.items.reduce((s, i) => s + i.price, 0);
  cart.totalAfterDiscount = cart.totalPrice;
  await cart.save();
  res.status(200).json({ data: cart, addedFromBundle: bundle.title });
});
