const express = require('express');
const authService = require('../services/authService');

const {
  checkout,
  freeCheckout,
  myPayments,
  requestRefund,
  refundEligibility,
} = require('../services/paymentService');

const router = express.Router();

router.use(authService.protect);

router.post('/checkout', authService.allowedTo('student'), checkout);
router.post('/free-checkout', authService.allowedTo('student'), freeCheckout);
router.get('/me', myPayments);

// 30-day money-back guarantee
router.post('/refund', authService.allowedTo('student'), requestRefund);
router.get(
  '/refund-eligibility/:enrollmentId',
  authService.allowedTo('student'),
  refundEligibility
);

module.exports = router;
