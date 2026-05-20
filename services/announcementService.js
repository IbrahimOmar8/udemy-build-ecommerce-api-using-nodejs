const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Announcement = require('../models/announcementModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const { createNotification } = require('./notificationService');

// @desc    List announcements for a course
// @route   GET /api/v1/courses/:courseId/announcements
exports.listCourseAnnouncements = asyncHandler(async (req, res) => {
  const list = await Announcement.find({ course: req.params.courseId })
    .sort('-pinned -createdAt')
    .limit(50);
  res.status(200).json({ results: list.length, data: list });
});

// @desc    Create announcement (instructor only). Notifies all enrolled students.
// @route   POST /api/v1/courses/:courseId/announcements
// @access  Private/Owner|Admin
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));

  const announcement = await Announcement.create({
    course: course._id,
    instructor: req.user._id,
    title: req.body.title,
    body: req.body.body,
    pinned: !!req.body.pinned,
  });

  // Fan-out notifications to enrolled students
  const enrollments = await Enrollment.find({ course: course._id }).select('student');
  await Promise.all(
    enrollments.map((e) =>
      createNotification({
        recipient: e.student,
        type: 'course_announcement',
        title: `New announcement: ${course.title}`,
        body: announcement.title,
        data: { courseId: course._id, announcementId: announcement._id },
      })
    )
  );

  res.status(201).json({ data: announcement });
});

// @desc    Delete announcement
// @route   DELETE /api/v1/announcements/:id
// @access  Private/Owner|Admin
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) return next(new ApiError('Announcement not found', 404));

  const course = await Course.findById(a.course);
  if (
    course.instructor._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  await a.deleteOne();
  res.status(204).send();
});

// @desc    Toggle pinned
// @route   PATCH /api/v1/announcements/:id/pin
// @access  Private/Owner|Admin
exports.togglePin = asyncHandler(async (req, res, next) => {
  const a = await Announcement.findById(req.params.id);
  if (!a) return next(new ApiError('Announcement not found', 404));
  const course = await Course.findById(a.course);
  if (
    course.instructor._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  a.pinned = !a.pinned;
  await a.save();
  res.status(200).json({ data: a });
});
