const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    lecture: { type: mongoose.Schema.ObjectId, ref: 'Lecture', required: true, index: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    timestampSeconds: { type: Number, default: 0 },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
