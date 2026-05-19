const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const User = require('../../models/userModel');

exports.createUserValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name required')
    .isLength({ min: 3 })
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email')
    .notEmpty()
    .isEmail()
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) return Promise.reject(new Error('E-mail already in use'));
      })
    ),
  check('password')
    .notEmpty()
    .isLength({ min: 6 }),
  check('role').optional().isIn(['student', 'instructor', 'admin']),
  validatorMiddleware,
];

exports.getUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id'),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check('id').isMongoId().withMessage('Invalid user id'),
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email').optional().isEmail(),
  check('role').optional().isIn(['student', 'instructor', 'admin']),
  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check('id').isMongoId(),
  body('currentPassword').notEmpty(),
  body('password').notEmpty().isLength({ min: 6 }),
  body('passwordConfirm')
    .notEmpty()
    .custom((val, { req }) => {
      if (val !== req.body.password) throw new Error('Password confirmation does not match');
      return true;
    }),
  body('password').custom(async (val, { req }) => {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) throw new Error('User not found');
    const ok = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!ok) throw new Error('Incorrect current password');
    return true;
  }),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check('id').isMongoId(),
  validatorMiddleware,
];

exports.updateLoggedUserValidator = [
  body('name')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('email').optional().isEmail(),
  validatorMiddleware,
];
