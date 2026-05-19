const express = require('express');
const authService = require('../services/authService');
const {
  updateSection,
  deleteSection,
  verifySectionOwnership,
} = require('../services/sectionService');
const {
  updateSectionValidator,
} = require('../utils/validators/sectionValidator');

const router = express.Router();

router.put(
  '/:id',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  verifySectionOwnership,
  updateSectionValidator,
  updateSection
);
router.delete(
  '/:id',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  verifySectionOwnership,
  deleteSection
);

module.exports = router;
