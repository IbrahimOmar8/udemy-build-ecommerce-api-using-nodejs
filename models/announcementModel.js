const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    instructor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.pre(/^find/, function (next) {
  this.populate({ path: 'instructor', select: 'name profileImg' });
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);
