const express = require('express');

const {
  listLectures,
  getLecture,
  createLecture,
  updateLecture,
  deleteLecture,
  reorderLectures,
  uploadVideo,
  uploadAttachments,
  processLectureUploads,
  verifyLectureOwnership,
} = require('../services/lectureService');

const {
  createLectureValidator,
  updateLectureValidator,
} = require('../utils/validators/lectureValidator');

const noteRoute = require('./noteRoute');
const { verifySectionOwnership } = require('../services/sectionService');
const authService = require('../services/authService');
const multer = require('multer');
const ApiError = require('../utils/apiError');

const router = express.Router({ mergeParams: true });

// notes nested under lectures
router.use('/:lectureId/notes', noteRoute);

// Accept either video or attachments[] in one multipart request
const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_VIDEO_SIZE_MB || 500) * 1024 * 1024,
  },
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

router
  .route('/')
  .get(listLectures)
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    (req, res, next) => {
      req.params.id = req.params.sectionId;
      next();
    },
    verifySectionOwnership,
    mediaUpload,
    flattenFiles,
    processLectureUploads,
    createLectureValidator,
    createLecture
  );

router.put(
  '/reorder',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  (req, res, next) => {
    req.params.id = req.params.sectionId;
    next();
  },
  verifySectionOwnership,
  reorderLectures
);

router
  .route('/:id')
  .get(authService.optionalAuth, getLecture)
  .put(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifyLectureOwnership,
    mediaUpload,
    flattenFiles,
    processLectureUploads,
    updateLectureValidator,
    updateLecture
  )
  .delete(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifyLectureOwnership,
    deleteLecture
  );

module.exports = router;
