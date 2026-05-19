const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');
const Course = require('../models/courseModel');
const { recalcCourseStats } = require('./courseService');

// @desc    List sections of a course
// @route   GET /api/v1/courses/:courseId/sections
// @access  Public (if course is published) else Private
exports.listSections = asyncHandler(async (req, res) => {
  const sections = await Section.find({ course: req.params.courseId })
    .sort('order')
    .populate({
      path: 'lectures',
      select: 'title type durationSeconds order isPreview',
    });
  res.status(200).json({ results: sections.length, data: sections });
});

// @desc    Create section
// @route   POST /api/v1/courses/:courseId/sections
// @access  Private/Owner|Admin
exports.createSection = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));

  const count = await Section.countDocuments({ course: course._id });
  const section = await Section.create({
    title: req.body.title,
    description: req.body.description,
    course: course._id,
    order: typeof req.body.order === 'number' ? req.body.order : count,
  });
  await recalcCourseStats(course._id);
  res.status(201).json({ data: section });
});

// @desc    Update section
// @route   PUT /api/v1/sections/:id
// @access  Private/Owner|Admin
exports.updateSection = asyncHandler(async (req, res, next) => {
  const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!section) return next(new ApiError('Section not found', 404));
  res.status(200).json({ data: section });
});

// @desc    Delete section (and its lectures)
// @route   DELETE /api/v1/sections/:id
// @access  Private/Owner|Admin
exports.deleteSection = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.id);
  if (!section) return next(new ApiError('Section not found', 404));
  await Lecture.deleteMany({ section: section._id });
  await section.deleteOne();
  await recalcCourseStats(section.course);
  res.status(204).send();
});

// @desc    Reorder sections in a course
// @route   PUT /api/v1/courses/:courseId/sections/reorder
// @access  Private/Owner|Admin
exports.reorderSections = asyncHandler(async (req, res, next) => {
  const { order } = req.body; // [{id, order}]
  if (!Array.isArray(order)) return next(new ApiError('order array required', 400));
  await Promise.all(
    order.map((item) =>
      Section.findByIdAndUpdate(item.id, { order: item.order })
    )
  );
  res.status(200).json({ status: 'success' });
});

// Ownership check via section -> course
exports.verifySectionOwnership = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.id);
  if (!section) return next(new ApiError('Section not found', 404));
  const course = await Course.findById(section.course);
  if (
    course.instructor._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  req.section = section;
  req.course = course;
  next();
});
