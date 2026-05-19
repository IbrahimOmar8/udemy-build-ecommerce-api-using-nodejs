const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const ApiError = require('../utils/apiError');
const storage = require('../utils/storage');
const { uploadMultipleFiles } = require('../middlewares/uploadFileMiddleware');

const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');

exports.uploadAssignmentFiles = uploadMultipleFiles('attachments', 10);
exports.uploadSubmissionFiles = uploadMultipleFiles('attachments', 10);

const persistFiles = async (files, folder) => {
  if (!files || !files.length) return [];
  const saved = [];
  for (const f of files) {
    const filename = `${uuidv4()}-${Date.now()}${path.extname(f.originalname)}`;
    await storage.save(f.buffer, { folder, filename });
    saved.push({
      name: f.originalname,
      filename,
      url: `${process.env.BASE_URL || ''}/${folder}/${filename}`,
    });
  }
  return saved;
};

exports.processAssignmentFiles = asyncHandler(async (req, res, next) => {
  req.body.attachments = await persistFiles(req.files, 'assignments');
  next();
});

exports.processSubmissionFiles = asyncHandler(async (req, res, next) => {
  req.body.attachments = await persistFiles(req.files, 'submissions');
  next();
});

// @desc    List course assignments
// @route   GET /api/v1/courses/:courseId/assignments
exports.listCourseAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ course: req.params.courseId });
  res.status(200).json({ results: assignments.length, data: assignments });
});

// @desc    Create assignment
// @route   POST /api/v1/courses/:courseId/assignments
// @access  Private/Owner|Admin
exports.createAssignment = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));
  const assignment = await Assignment.create({
    ...req.body,
    course: course._id,
  });
  res.status(201).json({ data: assignment });
});

// @desc    Update assignment
// @route   PUT /api/v1/assignments/:id
// @access  Private/Owner|Admin
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!assignment) return next(new ApiError('Assignment not found', 404));
  res.status(200).json({ data: assignment });
});

// @desc    Delete assignment
// @route   DELETE /api/v1/assignments/:id
// @access  Private/Owner|Admin
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const a = await Assignment.findByIdAndDelete(req.params.id);
  if (!a) return next(new ApiError('Assignment not found', 404));
  await Submission.deleteMany({ assignment: a._id });
  res.status(204).send();
});

// @desc    Get assignment
// @route   GET /api/v1/assignments/:id
exports.getAssignment = asyncHandler(async (req, res, next) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return next(new ApiError('Assignment not found', 404));
  res.status(200).json({ data: a });
});

// @desc    Submit assignment
// @route   POST /api/v1/assignments/:id/submit
// @access  Private/Student (enrolled)
exports.submitAssignment = asyncHandler(async (req, res, next) => {
  const a = await Assignment.findById(req.params.id);
  if (!a) return next(new ApiError('Assignment not found', 404));

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: a.course,
  });
  if (!enrolled) return next(new ApiError('You must be enrolled', 403));

  const isLate = a.dueDate && new Date() > a.dueDate;
  if (isLate && !a.allowLateSubmission) {
    return next(new ApiError('Late submission not allowed', 400));
  }

  const existing = await Submission.findOne({
    assignment: a._id,
    student: req.user._id,
  });

  if (existing && existing.status !== 'returned') {
    return next(new ApiError('You already submitted this assignment', 400));
  }

  const submission = existing || new Submission({
    assignment: a._id,
    student: req.user._id,
    course: a.course,
  });
  submission.text = req.body.text;
  submission.attachments = req.body.attachments || [];
  submission.isLate = !!isLate;
  submission.status = 'submitted';
  submission.submittedAt = new Date();
  await submission.save();
  res.status(201).json({ data: submission });
});

// @desc    List submissions for an assignment (instructor)
// @route   GET /api/v1/assignments/:id/submissions
// @access  Private/Owner|Admin
exports.listSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assignment: req.params.id })
    .populate('student', 'name email profileImg')
    .sort('-submittedAt');
  res.status(200).json({ results: submissions.length, data: submissions });
});

// @desc    Grade a submission
// @route   POST /api/v1/submissions/:id/grade
// @access  Private/Owner|Admin
exports.gradeSubmission = asyncHandler(async (req, res, next) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) return next(new ApiError('Submission not found', 404));
  submission.score = req.body.score;
  submission.feedback = req.body.feedback;
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();
  submission.status = req.body.returnForRevision ? 'returned' : 'graded';
  await submission.save();
  res.status(200).json({ data: submission });
});

// @desc    Get my submission for an assignment
// @route   GET /api/v1/assignments/:id/my-submission
exports.mySubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findOne({
    assignment: req.params.id,
    student: req.user._id,
  });
  res.status(200).json({ data: submission });
});
