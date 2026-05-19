const express = require('express');
const authService = require('../services/authService');

const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../services/wishlistService');

const router = express.Router();

router.use(authService.protect, authService.allowedTo('student'));

router.route('/').get(getMyWishlist).post(addToWishlist);
router.delete('/:courseId', removeFromWishlist);

module.exports = router;
