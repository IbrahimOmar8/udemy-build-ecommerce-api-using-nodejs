const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: Date,
    totalDaysActive: { type: Number, default: 0 },
    minutesToday: { type: Number, default: 0 },
    minutesAllTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Streak', streakSchema);
