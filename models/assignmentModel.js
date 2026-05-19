const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: mongoose.Schema.ObjectId, ref: 'Lecture' },
    maxScore: { type: Number, default: 100 },
    dueDate: Date,
    instructions: String,
    attachments: [
      {
        name: String,
        filename: String,
        url: String,
      },
    ],
    allowLateSubmission: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
