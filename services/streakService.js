const asyncHandler = require('express-async-handler');
const Streak = require('../models/streakModel');

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
};

const isYesterday = (last, now) => {
  if (!last) return false;
  const oneDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((utcDate(now) - utcDate(last)) / oneDay);
  return diff === 1;
};

const utcDate = (d) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

// @desc    Record learning activity (minutes since last ping)
// @route   POST /api/v1/streak/ping
// @access  Private
exports.ping = asyncHandler(async (req, res) => {
  const minutes = Math.max(0, Math.min(60, Number(req.body.minutes) || 0));
  const now = new Date();
  let streak = await Streak.findOne({ user: req.user._id });
  if (!streak) {
    streak = await Streak.create({
      user: req.user._id,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: now,
      totalDaysActive: 1,
      minutesToday: minutes,
      minutesAllTime: minutes,
    });
    return res.status(200).json({ data: streak });
  }

  const last = streak.lastActivityDate;
  if (sameDay(last, now)) {
    streak.minutesToday += minutes;
  } else if (isYesterday(last, now)) {
    streak.currentStreak += 1;
    streak.totalDaysActive += 1;
    streak.minutesToday = minutes;
  } else {
    streak.currentStreak = 1;
    streak.totalDaysActive += 1;
    streak.minutesToday = minutes;
  }
  streak.minutesAllTime += minutes;
  streak.lastActivityDate = now;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  await streak.save();
  res.status(200).json({ data: streak });
});

// @desc    My streak summary
// @route   GET /api/v1/streak/me
// @access  Private
exports.myStreak = asyncHandler(async (req, res) => {
  let streak = await Streak.findOne({ user: req.user._id });
  if (!streak) {
    streak = await Streak.create({ user: req.user._id });
  } else if (
    streak.lastActivityDate &&
    !sameDay(streak.lastActivityDate, new Date()) &&
    !isYesterday(streak.lastActivityDate, new Date())
  ) {
    // Reset current streak if the user broke it before this request
    streak.currentStreak = 0;
    streak.minutesToday = 0;
    await streak.save();
  }
  res.status(200).json({ data: streak });
});
