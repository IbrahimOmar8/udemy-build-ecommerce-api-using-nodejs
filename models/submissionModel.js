const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    text: String,
    attachments: [
      {
        name: String,
        filename: String,
        url: String,
      },
    ],
    submittedAt: { type: Date, default: Date.now },
    isLate: { type: Boolean, default: false },

    // Grading
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned'],
      default: 'submitted',
    },
    score: Number,
    feedback: String,
    gradedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    gradedAt: Date,
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
