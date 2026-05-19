const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Get my wishlist
// @route   GET /api/v1/wishlist
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'title slug thumbnail price discountPrice ratingsAverage ratingsQuantity instructor',
  });
  res.status(200).json({ results: user.wishlist.length, data: user.wishlist });
});

// @desc    Add course to wishlist
// @route   POST /api/v1/wishlist
exports.addToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: req.body.courseId } },
    { new: true }
  );
  res.status(200).json({ data: user.wishlist });
});

// @desc    Remove from wishlist
// @route   DELETE /api/v1/wishlist/:courseId
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: req.params.courseId } },
    { new: true }
  );
  res.status(200).json({ data: user.wishlist });
});
