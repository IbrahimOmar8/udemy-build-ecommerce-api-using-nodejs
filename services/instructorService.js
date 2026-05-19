const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const ApiError = require('../utils/apiError');
const storage = require('../utils/storage');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');

const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const Payment = require('../models/paymentModel');
const Review = require('../models/reviewModel');

exports.uploadInstructorImage = uploadSingleImage('profileImg');

exports.processInstructorImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `instructor-${uuidv4()}-${Date.now()}.jpeg`;
  const buffer = await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();
  await storage.save(buffer, { folder: 'users', filename });
  req.body.profileImg = filename;
  next();
});

// @desc    List public instructors
// @route   GET /api/v1/instructors
// @access  Public
exports.listInstructors = asyncHandler(async (req, res) => {
  const instructors = await User.find({
    role: 'instructor',
    active: true,
    'instructorProfile.approved': true,
  }).select('name profileImg slug instructorProfile');
  res.status(200).json({ results: instructors.length, data: instructors });
});

// @desc    Get public instructor profile + their courses
// @route   GET /api/v1/instructors/:id
// @access  Public
exports.getInstructor = asyncHandler(async (req, res, next) => {
  const instructor = await User.findOne({
    _id: req.params.id,
    role: 'instructor',
  }).select('name profileImg coverImg instructorProfile createdAt');
  if (!instructor) return next(new ApiError('Instructor not found', 404));
  const courses = await Course.find({
    instructor: instructor._id,
    status: 'published',
  }).select('title slug thumbnail price ratingsAverage ratingsQuantity enrollmentsCount');
  res.status(200).json({ data: { instructor, courses } });
});

// @desc    Update my instructor profile
// @route   PUT /api/v1/instructors/me/profile
// @access  Private/Instructor
exports.updateMyInstructorProfile = asyncHandler(async (req, res) => {
  const profileFields = [
    'headline',
    'bio',
    'expertise',
    'website',
    'socials',
    'payoutEmail',
  ];
  const update = {};
  profileFields.forEach((f) => {
    if (req.body[f] !== undefined) update[`instructorProfile.${f}`] = req.body[f];
  });
  const baseFields = ['name', 'phone', 'profileImg', 'coverImg'];
  baseFields.forEach((f) => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });
  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
  });
  res.status(200).json({ data: user });
});

// @desc    Instructor dashboard - aggregated stats
// @route   GET /api/v1/instructors/me/dashboard
// @access  Private/Instructor
exports.dashboard = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const [courses, totalCourses, publishedCourses, studentsCount, payments, reviews] =
    await Promise.all([
      Course.find({ instructor: instructorId })
        .select('title status enrollmentsCount ratingsAverage ratingsQuantity totalLectures')
        .sort('-createdAt')
        .limit(20),
      Course.countDocuments({ instructor: instructorId }),
      Course.countDocuments({ instructor: instructorId, status: 'published' }),
      Enrollment.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        { $match: { 'course.instructor': instructorId } },
        { $group: { _id: '$student' } },
        { $count: 'students' },
      ]),
      Payment.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'courses',
            localField: 'items.course',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        { $match: { 'course.instructor': instructorId } },
        { $group: { _id: null, revenue: { $sum: '$items.price' } } },
      ]),
      Review.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        { $match: { 'course.instructor': instructorId } },
        {
          $group: {
            _id: null,
            avg: { $avg: '$ratings' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  res.status(200).json({
    data: {
      totalCourses,
      publishedCourses,
      totalStudents: studentsCount[0] ? studentsCount[0].students : 0,
      totalRevenue: payments[0] ? payments[0].revenue : 0,
      averageRating: reviews[0] ? reviews[0].avg : 0,
      totalReviews: reviews[0] ? reviews[0].count : 0,
      recentCourses: courses,
    },
  });
});

// @desc    My courses (instructor)
// @route   GET /api/v1/instructors/me/courses
// @access  Private/Instructor
exports.myCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id }).sort('-createdAt');
  res.status(200).json({ results: courses.length, data: courses });
});

// @desc    My students (across all my courses)
// @route   GET /api/v1/instructors/me/students
// @access  Private/Instructor
exports.myStudents = asyncHandler(async (req, res) => {
  const courseIds = await Course.find({ instructor: req.user._id }).distinct('_id');
  const enrollments = await Enrollment.find({ course: { $in: courseIds } })
    .populate('student', 'name email profileImg')
    .populate('course', 'title slug')
    .sort('-createdAt');
  res.status(200).json({ results: enrollments.length, data: enrollments });
});

// @desc    My earnings
// @route   GET /api/v1/instructors/me/earnings
// @access  Private/Instructor
exports.myEarnings = asyncHandler(async (req, res) => {
  const result = await Payment.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'courses',
        localField: 'items.course',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    { $match: { 'course.instructor': req.user._id } },
    {
      $group: {
        _id: {
          year: { $year: '$paidAt' },
          month: { $month: '$paidAt' },
        },
        revenue: { $sum: '$items.price' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
  ]);
  res.status(200).json({ data: result });
});

// @desc    Admin: approve instructor
// @route   POST /api/v1/instructors/:id/approve
// @access  Private/Admin
exports.approveInstructor = asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'instructor' },
    { 'instructorProfile.approved': true },
    { new: true }
  );
  if (!user) return next(new ApiError('Instructor not found', 404));
  res.status(200).json({ data: user });
});
