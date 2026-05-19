const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const Qna = require('../models/qnaModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const { emitToCourse, emitToUser } = require('../config/socket');
const { createNotification } = require('./notificationService');

// @desc    List Q&A for a course
// @route   GET /api/v1/courses/:courseId/qna
exports.listCourseQna = asyncHandler(async (req, res) => {
  const filter = { course: req.params.courseId };
  if (req.query.lecture) filter.lecture = req.query.lecture;
  const items = await Qna.find(filter).sort('-createdAt');
  res.status(200).json({ results: items.length, data: items });
});

// @desc    Ask a new question
// @route   POST /api/v1/courses/:courseId/qna
// @access  Private/Enrolled
exports.askQuestion = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  const isInstructor =
    course.instructor._id.toString() === req.user._id.toString();
  if (!enrolled && !isInstructor && req.user.role !== 'admin') {
    return next(new ApiError('You must enroll to ask questions', 403));
  }

  const q = await Qna.create({
    title: req.body.title,
    body: req.body.body,
    course: course._id,
    lecture: req.body.lecture,
    user: req.user._id,
  });
  res.status(201).json({ data: q });
});

// @desc    Get single Q&A
// @route   GET /api/v1/qna/:id
exports.getQna = asyncHandler(async (req, res, next) => {
  const q = await Qna.findById(req.params.id).populate(
    'answers.user',
    'name profileImg role'
  );
  if (!q) return next(new ApiError('Question not found', 404));
  res.status(200).json({ data: q });
});

// @desc    Reply / answer
// @route   POST /api/v1/qna/:id/answers
// @access  Private
exports.addAnswer = asyncHandler(async (req, res, next) => {
  const q = await Qna.findById(req.params.id);
  if (!q) return next(new ApiError('Question not found', 404));

  const course = await Course.findById(q.course);
  const isInstructor =
    course.instructor._id.toString() === req.user._id.toString();

  q.answers.push({
    user: req.user._id,
    text: req.body.text,
    isInstructor,
  });
  if (isInstructor) q.isResolved = true;
  await q.save();

  emitToCourse(q.course.toString(), 'qna:answer', {
    qnaId: q._id,
    answer: q.answers[q.answers.length - 1],
  });

  if (q.user.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: q.user,
      type: 'qna_reply',
      title: 'New reply to your question',
      body: q.title,
      data: { qnaId: q._id, courseId: q.course },
    });
  }

  res.status(201).json({ data: q });
});

// @desc    Upvote a question
// @route   POST /api/v1/qna/:id/upvote
// @access  Private
exports.upvoteQna = asyncHandler(async (req, res, next) => {
  const q = await Qna.findById(req.params.id);
  if (!q) return next(new ApiError('Question not found', 404));
  const already = q.upvoters.some(
    (u) => u.toString() === req.user._id.toString()
  );
  if (already) {
    q.upvoters = q.upvoters.filter(
      (u) => u.toString() !== req.user._id.toString()
    );
    q.upvotes = Math.max(0, q.upvotes - 1);
  } else {
    q.upvoters.push(req.user._id);
    q.upvotes += 1;
  }
  await q.save();
  res.status(200).json({ data: { upvotes: q.upvotes } });
});

// @desc    Delete question (owner or admin)
// @route   DELETE /api/v1/qna/:id
exports.deleteQna = asyncHandler(async (req, res, next) => {
  const q = await Qna.findById(req.params.id);
  if (!q) return next(new ApiError('Not found', 404));
  if (
    q.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return next(new ApiError('Not authorized', 403));
  }
  await q.deleteOne();
  res.status(204).send();
});
