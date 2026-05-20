const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const { emitToUser } = require('../config/socket');
const { sendPushMessages } = require('../utils/expoPush');

// @desc    Helper to create notifications (used internally)
// Persists, broadcasts via Socket.io, and sends a mobile push if the
// recipient has registered push tokens.
exports.createNotification = async ({ recipient, type, title, body, data }) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    body,
    data,
  });
  emitToUser(recipient.toString(), 'notification:new', notification);

  // Mobile push (fire-and-forget)
  User.findById(recipient)
    .select('pushTokens')
    .then((user) => {
      if (!user?.pushTokens?.length) return null;
      const tokens = user.pushTokens.map((t) => t.token);
      return sendPushMessages(tokens, {
        title,
        body,
        data: { type, ...(data || {}) },
      });
    })
    .catch((err) => {
      console.error('[notify] push failed:', err.message);
    });

  return notification;
};

// @desc    List my notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.myNotifications = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;
  const list = await Notification.find(filter).sort('-createdAt').limit(100);
  res.status(200).json({ results: list.length, data: list });
});

// @desc    Mark a notification as read
// @route   POST /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const n = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });
  if (!n) return next(new ApiError('Notification not found', 404));
  n.isRead = true;
  n.readAt = new Date();
  await n.save();
  res.status(200).json({ data: n });
});

// @desc    Mark all as read
// @route   POST /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json({ status: 'success' });
});

// @desc    Unread count
// @route   GET /api/v1/notifications/unread-count
// @access  Private
exports.unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });
  res.status(200).json({ count });
});
