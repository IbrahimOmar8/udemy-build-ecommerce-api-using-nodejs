const express = require('express');
const authService = require('../services/authService');

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  setCreator,
} = require('../services/couponService');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('admin', 'instructor'));

router.route('/').get(getCoupons).post(setCreator, createCoupon);
router.route('/:id').get(getCoupon).put(updateCoupon).delete(deleteCoupon);

module.exports = router;
