const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isInstructor: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    upvoters: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const qnaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true, index: true },
    lecture: { type: mongoose.Schema.ObjectId, ref: 'Lecture' },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
    upvotes: { type: Number, default: 0 },
    upvoters: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

qnaSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name profileImg role' });
  next();
});

module.exports = mongoose.model('Qna', qnaSchema);
