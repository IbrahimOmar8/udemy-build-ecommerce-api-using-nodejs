const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const Enrollment = require('../models/enrollmentModel');
const Course = require('../models/courseModel');
const Lecture = require('../models/lectureModel');
const User = require('../models/userModel');
const Streak = require('../models/streakModel');

// @desc    Enroll in a free course directly (paid courses go through paymentService)
// @route   POST /api/v1/courses/:courseId/enroll
// @access  Private/Student
exports.enrollInCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));
  if (course.status !== 'published') {
    return next(new ApiError('Course not available', 400));
  }

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (existing) return next(new ApiError('You are already enrolled', 400));

  if (!course.isFree && course.price > 0) {
    return next(new ApiError('This course requires payment', 402));
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: course._id,
    pricePaid: 0,
  });

  await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentsCount: 1 } });
  await User.findByIdAndUpdate(req.user._id, { $inc: { enrolledCount: 1 } });
  await User.findByIdAndUpdate(course.instructor._id || course.instructor, {
    $inc: { 'instructorProfile.totalStudents': 1 },
  });

  res.status(201).json({ data: enrollment });
});

// @desc    Get my enrolled courses
// @route   GET /api/v1/enrollments/me
// @access  Private/Student
exports.myEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course')
    .sort('-createdAt');
  res.status(200).json({ results: enrollments.length, data: enrollments });
});

// @desc    Mark lecture as completed (progress tracking)
// @route   POST /api/v1/courses/:courseId/progress
// @access  Private/Student
exports.markLectureCompleted = asyncHandler(async (req, res, next) => {
  const { lectureId } = req.body;
  if (!lectureId) return next(new ApiError('lectureId required', 400));

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (!enrollment) return next(new ApiError('You are not enrolled', 403));

  const lecture = await Lecture.findById(lectureId);
  if (!lecture || lecture.course.toString() !== req.params.courseId) {
    return next(new ApiError('Invalid lecture for this course', 400));
  }

  if (!enrollment.completedLectures.some((id) => id.toString() === lectureId)) {
    enrollment.completedLectures.push(lectureId);
  }
  enrollment.lastLecture = lectureId;

  // Recalculate progress
  const totalLectures = await Lecture.countDocuments({
    course: req.params.courseId,
  });
  const completedCount = enrollment.completedLectures.length;
  enrollment.progressPercent = totalLectures
    ? Math.min(100, Math.round((completedCount / totalLectures) * 100))
    : 0;

  if (enrollment.progressPercent === 100 && !enrollment.completedAt) {
    enrollment.completedAt = Date.now();
  }

  await enrollment.save();
  await updateStreak(req.user._id, lecture.durationSeconds || 0);
  res.status(200).json({ data: enrollment });
});

const updateStreak = async (userId, durationSeconds) => {
  const minutes = Math.max(1, Math.round((durationSeconds || 60) / 60));
  const now = new Date();
  const sameDay = (a, b) =>
    a && b &&
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();
  const isYesterday = (last) => {
    if (!last) return false;
    const oneDay = 86400_000;
    const u = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Math.floor((u(now) - u(last)) / oneDay) === 1;
  };
  let s = await Streak.findOne({ user: userId });
  if (!s) {
    s = new Streak({ user: userId, currentStreak: 1, longestStreak: 1, totalDaysActive: 1, minutesToday: minutes, minutesAllTime: minutes, lastActivityDate: now });
  } else if (sameDay(s.lastActivityDate, now)) {
    s.minutesToday += minutes;
    s.minutesAllTime += minutes;
  } else if (isYesterday(s.lastActivityDate)) {
    s.currentStreak += 1;
    s.totalDaysActive += 1;
    s.minutesToday = minutes;
    s.minutesAllTime += minutes;
    s.lastActivityDate = now;
  } else {
    s.currentStreak = 1;
    s.totalDaysActive += 1;
    s.minutesToday = minutes;
    s.minutesAllTime += minutes;
    s.lastActivityDate = now;
  }
  s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
  await s.save();
};

// @desc    Get course progress for current student
// @route   GET /api/v1/courses/:courseId/progress
// @access  Private/Student
exports.getMyProgress = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).populate('completedLectures', 'title');
  if (!enrollment) return next(new ApiError('Not enrolled', 404));
  res.status(200).json({ data: enrollment });
});

// @desc    List students enrolled in a course (instructor/admin)
// @route   GET /api/v1/courses/:courseId/students
// @access  Private/Owner|Admin
exports.listCourseStudents = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ course: req.params.courseId })
    .populate('student', 'name email profileImg')
    .sort('-createdAt');
  res.status(200).json({ results: enrollments.length, data: enrollments });
});

// @desc    Unenroll (revoke access)
// @route   DELETE /api/v1/enrollments/:id
// @access  Private/Self or Admin
exports.unenroll = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return next(new ApiError('Enrollment not found', 404));
  if (
    enrollment.student.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  await enrollment.deleteOne();
  await Course.findByIdAndUpdate(enrollment.course, {
    $inc: { enrollmentsCount: -1 },
  });
  res.status(204).send();
});
