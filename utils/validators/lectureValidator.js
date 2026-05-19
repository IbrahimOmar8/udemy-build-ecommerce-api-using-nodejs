const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createLectureValidator = [
  check('title').notEmpty().isLength({ min: 2, max: 200 }),
  check('type').optional().isIn(['video', 'article', 'quiz', 'assignment']),
  check('order').optional().isInt({ min: 0 }),
  validatorMiddleware,
];

exports.updateLectureValidator = [
  check('id').isMongoId(),
  body('title').optional().isLength({ min: 2, max: 200 }),
  body('type').optional().isIn(['video', 'article', 'quiz', 'assignment']),
  validatorMiddleware,
];
