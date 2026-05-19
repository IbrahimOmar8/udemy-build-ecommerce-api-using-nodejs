const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');

const Note = require('../models/noteModel');
const Lecture = require('../models/lectureModel');
const Enrollment = require('../models/enrollmentModel');

// @desc    List my notes for a lecture
// @route   GET /api/v1/lectures/:lectureId/notes
exports.listLectureNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    student: req.user._id,
    lecture: req.params.lectureId,
  }).sort('timestampSeconds');
  res.status(200).json({ results: notes.length, data: notes });
});

// @desc    Create note
// @route   POST /api/v1/lectures/:lectureId/notes
exports.createNote = asyncHandler(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.lectureId);
  if (!lecture) return next(new ApiError('Lecture not found', 404));
  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: lecture.course,
  });
  if (!enrolled) return next(new ApiError('You must be enrolled', 403));
  const note = await Note.create({
    student: req.user._id,
    lecture: lecture._id,
    course: lecture.course,
    timestampSeconds: req.body.timestampSeconds,
    text: req.body.text,
  });
  res.status(201).json({ data: note });
});

// @desc    Update note
// @route   PUT /api/v1/notes/:id
exports.updateNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findOne({
    _id: req.params.id,
    student: req.user._id,
  });
  if (!note) return next(new ApiError('Note not found', 404));
  if (req.body.text !== undefined) note.text = req.body.text;
  if (req.body.timestampSeconds !== undefined)
    note.timestampSeconds = req.body.timestampSeconds;
  await note.save();
  res.status(200).json({ data: note });
});

// @desc    Delete note
// @route   DELETE /api/v1/notes/:id
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    student: req.user._id,
  });
  if (!note) return next(new ApiError('Note not found', 404));
  res.status(204).send();
});
