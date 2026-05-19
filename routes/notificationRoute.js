const express = require('express');
const authService = require('../services/authService');

const {
  myNotifications,
  markAsRead,
  markAllAsRead,
  unreadCount,
} = require('../services/notificationService');

const router = express.Router();

router.use(authService.protect);

router.get('/', myNotifications);
router.get('/unread-count', unreadCount);
router.post('/read-all', markAllAsRead);
router.post('/:id/read', markAsRead);

module.exports = router;
