const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Bookmark = require('../models/bookmarkModel');
const Lecture = require('../models/lectureModel');
const Enrollment = require('../models/enrollmentModel');

// @desc    My bookmarks for a course
// @route   GET /api/v1/courses/:courseId/bookmarks
exports.listMyCourseBookmarks = asyncHandler(async (req, res) => {
  const list = await Bookmark.find({
    student: req.user._id,
    course: req.params.courseId,
  })
    .populate('lecture', 'title')
    .sort('createdAt');
  res.status(200).json({ results: list.length, data: list });
});

// @desc    Add a bookmark
// @route   POST /api/v1/lectures/:lectureId/bookmarks
// @access  Private/Student (enrolled)
exports.createBookmark = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) return next(new ApiError('Lecture not found', 404));
  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: lecture.course,
  });
  if (!enrolled) return next(new ApiError('You must be enrolled', 403));

  const bookmark = await Bookmark.create({
    student: req.user._id,
    lecture: lecture._id,
    course: lecture.course,
    timestampSeconds: req.body.timestampSeconds || 0,
    label: req.body.label,
  });
  res.status(201).json({ data: bookmark });
});

// @desc    Delete bookmark
// @route   DELETE /api/v1/bookmarks/:id
exports.deleteBookmark = asyncHandler(async (req, res, next) => {
  const bookmark = await Bookmark.findOneAndDelete({
    _id: req.params.id,
    student: req.user._id,
  });
  if (!bookmark) return next(new ApiError('Bookmark not found', 404));
  res.status(204).send();
});
