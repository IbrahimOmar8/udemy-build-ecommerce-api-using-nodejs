const express = require('express');
const authService = require('../services/authService');

const {
  issueCertificate,
  myCertificates,
  verifyCertificate,
} = require('../services/certificateService');

const router = express.Router();

router.get('/verify/:serial', verifyCertificate);
router.get('/me', authService.protect, myCertificates);
router.post(
  '/courses/:courseId/issue',
  authService.protect,
  authService.allowedTo('student'),
  issueCertificate
);

module.exports = router;
