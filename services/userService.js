const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const bcrypt = require('bcryptjs');

const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const storage = require('../utils/storage');
const createToken = require('../utils/createToken');
const User = require('../models/userModel');

exports.uploadUserImage = uploadSingleImage('profileImg');

exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;
  const buffer = await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();
  await storage.save(buffer, { folder: 'users', filename });
  req.body.profileImg = filename;
  next();
});

exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUser = factory.createOne(User);

exports.updateUser = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: req.body.slug,
      phone: req.body.phone,
      email: req.body.email,
      profileImg: req.body.profileImg,
      role: req.body.role,
      active: req.body.active,
    },
    { new: true }
  );
  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );
  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

exports.deleteUser = factory.deleteOne(User);

exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

exports.updateLoggedUserPassword = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
      refreshTokens: [],
    },
    { new: true }
  );
  const accessToken = createToken(user._id);
  res.status(200).json({ data: user, accessToken });
});

exports.updateLoggedUserData = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    preferredLanguage: req.body.preferredLanguage,
    timezone: req.body.timezone,
  };
  if (req.body.profileImg) updates.profileImg = req.body.profileImg;
  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  });
  res.status(200).json({ data: updatedUser });
});

exports.deleteLoggedUserData = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: 'success' });
});

// @desc    Register a push notification token for current user
// @route   POST /api/v1/users/me/push-token
// @access  Private
exports.registerPushToken = asyncHandler(async (req, res, next) => {
  const { token, platform } = req.body;
  if (!token) return next(new ApiError('token is required', 400));

  await User.updateOne(
    { _id: req.user._id },
    { $pull: { pushTokens: { token } } }
  );
  await User.updateOne(
    { _id: req.user._id },
    {
      $push: {
        pushTokens: {
          token,
          platform: platform || 'android',
          createdAt: new Date(),
        },
      },
    }
  );
  res.status(200).json({ status: 'success' });
});

// @desc    Unregister a push token (e.g. on logout)
// @route   DELETE /api/v1/users/me/push-token
// @access  Private
exports.unregisterPushToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  if (!token) return next(new ApiError('token is required', 400));
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { pushTokens: { token } } }
  );
  res.status(204).send();
});
