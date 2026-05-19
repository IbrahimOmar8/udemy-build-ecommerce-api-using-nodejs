const slugify = require('slugify');
const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.registerValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name required')
    .isLength({ min: 3 })
    .withMessage('Too short name')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address')
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) return Promise.reject(new Error('E-mail already in use'));
      })
    ),
  check('password')
    .notEmpty()
    .withMessage('Password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((password, { req }) => {
      if (req.body.passwordConfirm && password !== req.body.passwordConfirm) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  check('role')
    .optional()
    .isIn(['student', 'instructor'])
    .withMessage('Role must be student or instructor for self-registration'),
  validatorMiddleware,
];

exports.loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email required')
    .isEmail()
    .withMessage('Invalid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password required'),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check('email').isEmail().withMessage('Invalid email'),
  check('newPassword')
    .notEmpty()
    .withMessage('New password required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validatorMiddleware,
];
