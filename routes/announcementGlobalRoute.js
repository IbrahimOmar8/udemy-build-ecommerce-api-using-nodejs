const express = require('express');
const authService = require('../services/authService');
const {
  deleteAnnouncement,
  togglePin,
} = require('../services/announcementService');

const router = express.Router();

router.use(authService.protect);
router.delete('/:id', authService.allowedTo('instructor', 'admin'), deleteAnnouncement);
router.patch('/:id/pin', authService.allowedTo('instructor', 'admin'), togglePin);

module.exports = router;
