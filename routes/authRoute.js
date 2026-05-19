const express = require('express');
const {
  registerValidator,
  loginValidator,
  resetPasswordValidator,
} = require('../utils/validators/authValidator');

const authService = require('../services/authService');

const router = express.Router();

router.post('/register', registerValidator, authService.register);
router.post('/login', loginValidator, authService.login);
router.post('/refresh-token', authService.refreshToken);
router.post('/logout', authService.protect, authService.logout);

router.post('/forgot-password', authService.forgotPassword);
router.post('/verify-reset-code', authService.verifyPassResetCode);
router.put('/reset-password', resetPasswordValidator, authService.resetPassword);

router.post('/send-verify-email', authService.protect, authService.sendVerifyEmail);
router.post('/verify-email', authService.protect, authService.verifyEmail);

router.get('/me', authService.protect, (req, res) => {
  res.status(200).json({ data: req.user });
});

module.exports = router;
