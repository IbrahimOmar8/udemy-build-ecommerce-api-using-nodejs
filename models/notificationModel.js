const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'enrollment',
        'new_lecture',
        'qna_reply',
        'assignment_due',
        'assignment_graded',
        'course_announcement',
        'review_received',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: String,
    data: mongoose.Schema.Types.Mixed,
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
