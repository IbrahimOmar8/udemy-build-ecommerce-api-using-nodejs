const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const ApiError = require('../utils/apiError');
const storage = require('../utils/storage');
const { uploadSingleVideo } = require('../middlewares/uploadVideoMiddleware');
const { uploadMultipleFiles } = require('../middlewares/uploadFileMiddleware');

const Lecture = require('../models/lectureModel');
const Section = require('../models/sectionModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const { recalcCourseStats } = require('./courseService');

exports.uploadVideo = uploadSingleVideo('video');
exports.uploadAttachments = uploadMultipleFiles('attachments', 10);

exports.processLectureUploads = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.mp4';
    const filename = `lecture-${uuidv4()}-${Date.now()}${ext}`;
    await storage.save(req.file.buffer, {
      folder: 'lectures/videos',
      filename,
    });
    req.body.videoFilename = filename;
  }
  if (req.files && req.files.length) {
    const attachments = [];
    for (const f of req.files) {
      const filename = `att-${uuidv4()}-${Date.now()}${path.extname(f.originalname)}`;
      await storage.save(f.buffer, {
        folder: 'lectures/attachments',
        filename,
      });
      attachments.push({
        name: f.originalname,
        filename,
        size: f.size,
        mimeType: f.mimetype,
      });
    }
    req.body.attachments = attachments;
  }
  next();
});

// @desc    List lectures of a section
// @route   GET /api/v1/sections/:sectionId/lectures
// @access  Public
exports.listLectures = asyncHandler(async (req, res) => {
  const lectures = await Lecture.find({ section: req.params.sectionId }).sort(
    'order'
  );
  res.status(200).json({ results: lectures.length, data: lectures });
});

// @desc    Get single lecture (requires enrollment or preview)
// @route   GET /api/v1/lectures/:id
// @access  Private (mostly)
exports.getLecture = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new ApiError('Lecture not found', 404));

  if (lecture.isPreview) {
    return res.status(200).json({ data: lecture });
  }

  if (!req.user) return next(new ApiError('Please login', 401));

  if (req.user.role === 'admin') {
    return res.status(200).json({ data: lecture });
  }

  // Owner / co-instructor
  const course = await Course.findById(lecture.course);
  if (course.instructor._id.toString() === req.user._id.toString()) {
    return res.status(200).json({ data: lecture });
  }

  // Enrolled student
  const enr = await Enrollment.findOne({
    student: req.user._id,
    course: lecture.course,
  });
  if (!enr) {
    return next(new ApiError('You must enroll in this course to view lectures', 403));
  }
  res.status(200).json({ data: lecture });
});

// @desc    Create lecture in a section
// @route   POST /api/v1/sections/:sectionId/lectures
// @access  Private/Owner|Admin
exports.createLecture = asyncHandler(async (req, res, next) => {
  const section = await Section.findById(req.params.sectionId);
  if (!section) return next(new ApiError('Section not found', 404));

  const count = await Lecture.countDocuments({ section: section._id });
  const lecture = await Lecture.create({
    title: req.body.title,
    description: req.body.description,
    section: section._id,
    course: section.course,
    order: typeof req.body.order === 'number' ? req.body.order : count,
    type: req.body.type || 'video',
    videoFilename: req.body.videoFilename,
    durationSeconds: Number(req.body.durationSeconds) || 0,
    article: req.body.article,
    quiz: req.body.quiz,
    assignment: req.body.assignment,
    attachments: req.body.attachments || [],
    isPreview: req.body.isPreview === 'true' || req.body.isPreview === true,
  });

  await recalcCourseStats(section.course);
  res.status(201).json({ data: lecture });
});

// @desc    Update lecture
// @route   PUT /api/v1/lectures/:id
// @access  Private/Owner|Admin
exports.updateLecture = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new ApiError('Lecture not found', 404));

  const updates = ['title', 'description', 'order', 'type', 'article', 'isPreview', 'durationSeconds', 'quiz', 'assignment'];
  updates.forEach((k) => {
    if (req.body[k] !== undefined) lecture[k] = req.body[k];
  });
  if (req.body.videoFilename) lecture.videoFilename = req.body.videoFilename;
  if (req.body.attachments) lecture.attachments = req.body.attachments;
  await lecture.save();
  await recalcCourseStats(lecture.course);
  res.status(200).json({ data: lecture });
});

// @desc    Delete lecture
// @route   DELETE /api/v1/lectures/:id
// @access  Private/Owner|Admin
exports.deleteLecture = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new ApiError('Lecture not found', 404));
  if (lecture.videoFilename) {
    await storage.remove(lecture.videoFilename, { folder: 'lectures/videos' }).catch(() => {});
  }
  for (const att of lecture.attachments || []) {
    if (att.filename) {
      await storage.remove(att.filename, { folder: 'lectures/attachments' }).catch(() => {});
    }
  }
  const courseId = lecture.course;
  await lecture.deleteOne();
  await recalcCourseStats(courseId);
  res.status(204).send();
});

// @desc    Reorder lectures in a section
// @route   PUT /api/v1/sections/:sectionId/lectures/reorder
// @access  Private/Owner|Admin
exports.reorderLectures = asyncHandler(async (req, res, next) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return next(new ApiError('order array required', 400));
  await Promise.all(
    order.map((item) =>
      Lecture.findByIdAndUpdate(item.id, { order: item.order })
    )
  );
  res.status(200).json({ status: 'success' });
});

exports.verifyLectureOwnership = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return next(new ApiError('Lecture not found', 404));
  const course = await Course.findById(lecture.course);
  if (
    course.instructor._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  req.lecture = lecture;
  req.course = course;
  next();
});
