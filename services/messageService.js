const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { Conversation, Message } = require('../models/messageModel');
const User = require('../models/userModel');
const { emitToUser } = require('../config/socket');
const { createNotification } = require('./notificationService');

const sortIds = (a, b) => (a.toString() < b.toString() ? [a, b] : [b, a]);

const findOrCreateConversation = async (userA, userB) => {
  const [p1, p2] = sortIds(userA, userB);
  let conv = await Conversation.findOne({
    participants: { $all: [p1, p2], $size: 2 },
  });
  if (!conv) {
    conv = await Conversation.create({ participants: [p1, p2] });
  }
  return conv;
};

// @desc    My conversations
// @route   GET /api/v1/messages/conversations
// @access  Private
exports.myConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'name profileImg role')
    .sort('-lastMessageAt')
    .limit(100);
  const shaped = conversations.map((c) => ({
    _id: c._id,
    other: c.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    ),
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
    unreadCount: c.unreadCount?.get(req.user._id.toString()) || 0,
  }));
  res.status(200).json({ results: shaped.length, data: shaped });
});

// @desc    Get conversation messages
// @route   GET /api/v1/messages/conversations/:id
// @access  Private
exports.conversationMessages = asyncHandler(async (req, res, next) => {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) return next(new ApiError('Conversation not found', 404));
  if (
    !conv.participants.some((p) => p.toString() === req.user._id.toString())
  ) {
    return next(new ApiError('Not authorized', 403));
  }

  const messages = await Message.find({ conversation: conv._id })
    .sort('createdAt')
    .limit(200);

  // Mark as read
  await Message.updateMany(
    { conversation: conv._id, recipient: req.user._id, readAt: null },
    { readAt: new Date() }
  );
  conv.unreadCount.set(req.user._id.toString(), 0);
  await conv.save();

  res.status(200).json({ results: messages.length, data: messages });
});

// @desc    Send a message (creates conversation if needed)
// @route   POST /api/v1/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { recipientId, body } = req.body;
  if (!recipientId || !body) {
    return next(new ApiError('recipientId and body are required', 400));
  }
  if (recipientId === req.user._id.toString()) {
    return next(new ApiError('Cannot message yourself', 400));
  }
  const recipient = await User.findById(recipientId);
  if (!recipient) return next(new ApiError('Recipient not found', 404));

  const conv = await findOrCreateConversation(req.user._id, recipientId);
  const message = await Message.create({
    conversation: conv._id,
    sender: req.user._id,
    recipient: recipientId,
    body,
  });

  conv.lastMessage = body.length > 80 ? `${body.slice(0, 80)}…` : body;
  conv.lastMessageAt = new Date();
  const currentUnread =
    conv.unreadCount.get(recipientId.toString()) || 0;
  conv.unreadCount.set(recipientId.toString(), currentUnread + 1);
  await conv.save();

  emitToUser(recipientId.toString(), 'message:new', {
    conversationId: conv._id,
    message,
    senderName: req.user.name,
  });

  await createNotification({
    recipient: recipientId,
    type: 'system',
    title: `New message from ${req.user.name}`,
    body: conv.lastMessage,
    data: { conversationId: conv._id },
  });

  res.status(201).json({ data: { conversationId: conv._id, message } });
});

// @desc    Total unread message count
// @route   GET /api/v1/messages/unread-count
// @access  Private
exports.unreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  }).select('unreadCount');
  const total = conversations.reduce(
    (acc, c) => acc + (c.unreadCount?.get(req.user._id.toString()) || 0),
    0
  );
  res.status(200).json({ count: total });
});
