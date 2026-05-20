const express = require('express');
const authService = require('../services/authService');
const { verifyCourseOwnership } = require('../services/courseService');

const {
  listCourseAnnouncements,
  createAnnouncement,
} = require('../services/announcementService');

const router = express.Router({ mergeParams: true });

// Nested under /courses/:courseId/announcements
router
  .route('/')
  .get(authService.optionalAuth, listCourseAnnouncements)
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    (req, res, next) => {
      req.params.id = req.params.courseId;
      next();
    },
    verifyCourseOwnership,
    createAnnouncement
  );

module.exports = router;
