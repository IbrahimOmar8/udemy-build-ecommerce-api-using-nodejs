const express = require('express');
const authService = require('../services/authService');

const {
  myConversations,
  conversationMessages,
  sendMessage,
  unreadCount,
} = require('../services/messageService');

const router = express.Router();

router.use(authService.protect);

router.get('/conversations', myConversations);
router.get('/conversations/:id', conversationMessages);
router.get('/unread-count', unreadCount);
router.post('/', sendMessage);

module.exports = router;
