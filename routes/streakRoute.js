const express = require('express');
const authService = require('../services/authService');
const { ping, myStreak } = require('../services/streakService');

const router = express.Router();

router.use(authService.protect);
router.post('/ping', ping);
router.get('/me', myStreak);

module.exports = router;
