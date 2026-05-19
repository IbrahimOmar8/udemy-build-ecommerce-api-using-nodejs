const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Section title required'],
      trim: true,
      maxlength: 120,
    },
    description: String,
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: [true, 'Section must belong to a course'],
      index: true,
    },
    order: { type: Number, default: 0, index: true },
    totalLectures: { type: Number, default: 0 },
    totalDurationSeconds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sectionSchema.virtual('lectures', {
  ref: 'Lecture',
  foreignField: 'section',
  localField: '_id',
  options: { sort: { order: 1 } },
});

module.exports = mongoose.model('Section', sectionSchema);
