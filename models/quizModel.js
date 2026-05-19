const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ['single', 'multiple', 'true_false', 'text'],
      default: 'single',
    },
    options: [
      {
        text: String,
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctText: String,
    explanation: String,
    points: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: mongoose.Schema.ObjectId, ref: 'Lecture' },
    questions: [questionSchema],
    timeLimitMinutes: { type: Number, default: 0 },
    passingScorePercent: { type: Number, default: 60, min: 0, max: 100 },
    maxAttempts: { type: Number, default: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    showAnswersAfter: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
