const express = require('express');
const authService = require('../services/authService');

const {
  myEnrollments,
  unenroll,
} = require('../services/enrollmentService');
const { issueCertificate } = require('../services/certificateService');

const router = express.Router();

router.use(authService.protect);

router.get('/me', myEnrollments);
router.delete('/:id', unenroll);

module.exports = router;
