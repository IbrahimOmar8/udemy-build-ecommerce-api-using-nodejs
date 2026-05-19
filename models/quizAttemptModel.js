const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.ObjectId, ref: 'Quiz', required: true, index: true },
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    answers: [
      {
        question: { type: mongoose.Schema.ObjectId, required: true },
        selectedOptions: [mongoose.Schema.ObjectId],
        textAnswer: String,
        isCorrect: Boolean,
        pointsAwarded: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    durationSeconds: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
