const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const sendEmail = require('../utils/sendEmail');
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} = require('../utils/createToken');

const User = require('../models/userModel');

const issueTokens = (user) => ({
  accessToken: createAccessToken(user._id),
  refreshToken: createRefreshToken(user._id),
});

// @desc    Register
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Only allow student/instructor self-registration; admin requires existing admin
  const allowedRole = role === 'instructor' ? 'instructor' : 'student';

  const user = await User.create({
    name,
    email,
    password,
    role: allowedRole,
  });

  if (allowedRole === 'instructor') {
    user.instructorProfile = user.instructorProfile || {};
    user.instructorProfile.approved = false;
    await user.save();
  }

  const { accessToken, refreshToken } = issueTokens(user);

  user.refreshTokens.push({
    token: refreshToken,
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await user.save();

  delete user._doc.password;
  delete user._doc.refreshTokens;

  res.status(201).json({ data: user, accessToken, refreshToken });
});

// @desc    Login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError('Incorrect email or password', 401));
  }

  if (!user.active) {
    return next(new ApiError('Account is deactivated', 403));
  }

  const { accessToken, refreshToken } = issueTokens(user);

  user.refreshTokens.push({
    token: refreshToken,
    userAgent: req.headers['user-agent'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  // Trim old refresh tokens to keep last 5
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  delete user._doc.password;
  delete user._doc.refreshTokens;

  res.status(200).json({ data: user, accessToken, refreshToken });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return next(new ApiError('Refresh token required', 400));

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return next(new ApiError('Invalid refresh token', 401));
  }

  const user = await User.findById(decoded.userId);
  if (!user) return next(new ApiError('User no longer exists', 401));

  const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);
  if (!tokenExists) return next(new ApiError('Refresh token revoked', 401));

  const accessToken = createAccessToken(user._id);
  res.status(200).json({ accessToken });
});

// @desc    Logout
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (req.user && refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );
    await req.user.save();
  }
  res.status(200).json({ status: 'success' });
});

// @desc    Auth middleware - protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new ApiError('You are not logged in, please login first', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new ApiError('The user belonging to this token no longer exists', 401));
  }

  if (!currentUser.active) {
    return next(new ApiError('Account is deactivated', 403));
  }

  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passChangedTimestamp > decoded.iat) {
      return next(new ApiError('User recently changed password, please login again', 401));
    }
  }

  req.user = currentUser;
  next();
});

// @desc    Role-based authorization
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('You are not allowed to access this route', 403));
    }
    next();
  });

// @desc    Optional auth - sets req.user if token valid, otherwise continues
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId);
    if (user && user.active) req.user = user;
  } catch (e) {
    // ignore
  }
  next();
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with email ${req.body.email}`, 404));
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;
  await user.save();

  const message = `Hi ${user.name},\nWe received a request to reset your password.\nReset code: ${resetCode}\nThis code is valid for 10 minutes.\nIf you did not request this, please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 min)',
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError('There was an error sending the email', 500));
  }

  res.status(200).json({ status: 'success', message: 'Reset code sent to email' });
});

// @desc    Verify reset code
// @route   POST /api/v1/auth/verify-reset-code
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new ApiError('Reset code invalid or expired', 400));

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({ status: 'success' });
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError(`There is no user with email ${req.body.email}`, 404));
  }
  if (!user.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  user.refreshTokens = []; // revoke all sessions
  await user.save();

  const accessToken = createAccessToken(user._id);
  res.status(200).json({ accessToken });
});

// @desc    Send email verification code
// @route   POST /api/v1/auth/send-verify-email
// @access  Private
exports.sendVerifyEmail = asyncHandler(async (req, res, next) => {
  const user = req.user;
  if (user.emailVerified) {
    return res.status(200).json({ status: 'success', message: 'Already verified' });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailVerifyCode = crypto.createHash('sha256').update(code).digest('hex');
  user.emailVerifyExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your email',
      message: `Your verification code is: ${code}\nValid for 60 minutes.`,
    });
  } catch (err) {
    return next(new ApiError('Could not send verification email', 500));
  }

  res.status(200).json({ status: 'success', message: 'Verification code sent' });
});

// @desc    Verify email with code
// @route   POST /api/v1/auth/verify-email
// @access  Private
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashed = crypto.createHash('sha256').update(req.body.code).digest('hex');
  if (
    req.user.emailVerifyCode !== hashed ||
    req.user.emailVerifyExpires < Date.now()
  ) {
    return next(new ApiError('Invalid or expired verification code', 400));
  }
  req.user.emailVerified = true;
  req.user.emailVerifyCode = undefined;
  req.user.emailVerifyExpires = undefined;
  await req.user.save();
  res.status(200).json({ status: 'success', message: 'Email verified' });
});
