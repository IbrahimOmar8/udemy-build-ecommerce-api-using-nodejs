const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    pricePaid: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentId: { type: mongoose.Schema.ObjectId, ref: 'Payment' },

    completedLectures: [{ type: mongoose.Schema.ObjectId, ref: 'Lecture' }],
    lastLecture: { type: mongoose.Schema.ObjectId, ref: 'Lecture' },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },

    completedAt: Date,
    certificateIssued: { type: Boolean, default: false },
    certificate: { type: mongoose.Schema.ObjectId, ref: 'Certificate' },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
