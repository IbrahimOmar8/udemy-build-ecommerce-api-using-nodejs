const express = require('express');
const authService = require('../services/authService');

const {
  checkout,
  freeCheckout,
  myPayments,
} = require('../services/paymentService');

const router = express.Router();

router.use(authService.protect);

router.post('/checkout', authService.allowedTo('student'), checkout);
router.post('/free-checkout', authService.allowedTo('student'), freeCheckout);
router.get('/me', myPayments);

module.exports = router;
