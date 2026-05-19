const express = require('express');

const {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  verifySectionOwnership,
} = require('../services/sectionService');

const {
  createSectionValidator,
  updateSectionValidator,
} = require('../utils/validators/sectionValidator');

const { verifyCourseOwnership } = require('../services/courseService');
const authService = require('../services/authService');
const lectureRoute = require('./lectureRoute');

const router = express.Router({ mergeParams: true });

// Nested: sections -> lectures
router.use('/:sectionId/lectures', lectureRoute);

router
  .route('/')
  .get(listSections)
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    (req, res, next) => {
      req.params.id = req.params.courseId;
      next();
    },
    verifyCourseOwnership,
    createSectionValidator,
    createSection
  );

router.put(
  '/reorder',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  (req, res, next) => {
    req.params.id = req.params.courseId;
    next();
  },
  verifyCourseOwnership,
  reorderSections
);

router
  .route('/:id')
  .put(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifySectionOwnership,
    updateSectionValidator,
    updateSection
  )
  .delete(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifySectionOwnership,
    deleteSection
  );

module.exports = router;
