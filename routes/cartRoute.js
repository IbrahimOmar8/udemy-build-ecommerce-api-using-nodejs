const express = require('express');
const authService = require('../services/authService');

const {
  getMyCart,
  addToCart,
  removeFromCart,
  clearCart,
  applyCoupon,
} = require('../services/cartService');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('student'));

router.route('/').get(getMyCart).post(addToCart).delete(clearCart);
router.post('/apply-coupon', applyCoupon);
router.delete('/:courseId', removeFromCart);

module.exports = router;
