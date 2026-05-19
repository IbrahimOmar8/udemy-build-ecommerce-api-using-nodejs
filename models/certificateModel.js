const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.ObjectId, ref: 'Course', required: true },
    enrollment: { type: mongoose.Schema.ObjectId, ref: 'Enrollment' },
    serial: { type: String, unique: true, required: true, index: true },
    issuedAt: { type: Date, default: Date.now },
    fileUrl: String,
    filename: String,
    verifyUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
