const express = require('express');
const authService = require('../services/authService');

const {
  listBundles,
  getBundle,
  createBundle,
  updateBundle,
  deleteBundle,
  addBundleToCart,
} = require('../services/bundleService');

const router = express.Router();

router.get('/', listBundles);
router.get('/:idOrSlug', getBundle);

router.use(authService.protect);
router.post(
  '/cart',
  authService.allowedTo('student'),
  addBundleToCart
);

router.use(authService.allowedTo('admin'));
router.post('/', createBundle);
router.put('/:id', updateBundle);
router.delete('/:id', deleteBundle);

module.exports = router;
