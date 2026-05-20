const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lecture: {
      type: mongoose.Schema.ObjectId,
      ref: 'Lecture',
      required: true,
      index: true,
    },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    timestampSeconds: { type: Number, default: 0 },
    label: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
