const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: String,
    lastMessageAt: Date,
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    body: { type: String, required: true, maxlength: 4000 },
    readAt: Date,
  },
  { timestamps: true }
);

exports.Conversation = mongoose.model('Conversation', conversationSchema);
exports.Message = mongoose.model('Message', messageSchema);
