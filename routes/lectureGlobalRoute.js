const express = require('express');
const authService = require('../services/authService');
const multer = require('multer');

const {
  getLecture,
  updateLecture,
  deleteLecture,
  processLectureUploads,
  verifyLectureOwnership,
} = require('../services/lectureService');

const router = express.Router();

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_VIDEO_SIZE_MB || 500) * 1024 * 1024 },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'attachments', maxCount: 10 },
]);

const flattenFiles = (req, res, next) => {
  if (req.files && req.files.video && req.files.video[0]) {
    req.file = req.files.video[0];
  }
  req.files = (req.files && req.files.attachments) || [];
  next();
};

router.get('/:id', authService.optionalAuth, getLecture);
router.put(
  '/:id',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  verifyLectureOwnership,
  mediaUpload,
  flattenFiles,
  processLectureUploads,
  updateLecture
);
router.delete(
  '/:id',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  verifyLectureOwnership,
  deleteLecture
);

module.exports = router;
