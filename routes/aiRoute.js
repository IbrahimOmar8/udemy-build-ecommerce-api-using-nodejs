const express = require('express');
const authService = require('../services/authService');

const {
  status,
  draftDescription,
  generateOutcomes,
  generateRequirements,
  generateOutline,
  draftAnnouncement,
} = require('../services/aiService');

const router = express.Router();

router.get('/status', status);

router.use(authService.protect, authService.allowedTo('instructor', 'admin'));

router.post('/course/description', draftDescription);
router.post('/course/outcomes', generateOutcomes);
router.post('/course/requirements', generateRequirements);
router.post('/course/outline', generateOutline);
router.post('/course/announcement', draftAnnouncement);

module.exports = router;
