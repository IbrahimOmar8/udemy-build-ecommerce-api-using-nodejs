const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createSectionValidator = [
  check('title').notEmpty().isLength({ min: 2, max: 120 }),
  check('order').optional().isInt({ min: 0 }),
  validatorMiddleware,
];

exports.updateSectionValidator = [
  check('id').isMongoId(),
  body('title').optional().isLength({ min: 2, max: 120 }),
  body('order').optional().isInt({ min: 0 }),
  validatorMiddleware,
];
