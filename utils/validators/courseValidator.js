const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.getCoursesValidator = [
  check('page').optional().isInt({ min: 1 }),
  check('limit').optional().isInt({ min: 1, max: 100 }),
  validatorMiddleware,
];

exports.getCourseValidator = [
  check('id').optional().isMongoId(),
  validatorMiddleware,
];

exports.createCourseValidator = [
  check('title')
    .notEmpty()
    .withMessage('Title required')
    .isLength({ min: 4, max: 120 }),
  check('description').notEmpty().withMessage('Description required'),
  check('category').isMongoId().withMessage('Valid category id required'),
  check('price').optional().isFloat({ min: 0 }),
  check('discountPrice').optional().isFloat({ min: 0 }),
  check('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'all']),
  validatorMiddleware,
];

exports.updateCourseValidator = [
  check('id').isMongoId(),
  body('title').optional().isLength({ min: 4, max: 120 }),
  body('price').optional().isFloat({ min: 0 }),
  body('discountPrice').optional().isFloat({ min: 0 }),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced', 'all']),
  validatorMiddleware,
];
