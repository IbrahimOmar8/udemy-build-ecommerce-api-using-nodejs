const multer = require('multer');
const ApiError = require('../utils/apiError');

const VIDEO_MIME_PREFIXES = ['video/'];
const MAX_VIDEO_SIZE = Number(process.env.MAX_VIDEO_SIZE_MB || 500) * 1024 * 1024;

const videoMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ok = VIDEO_MIME_PREFIXES.some((p) => file.mimetype.startsWith(p));
    if (ok) cb(null, true);
    else cb(new ApiError('Only video files are allowed', 400), false);
  },
  limits: { fileSize: MAX_VIDEO_SIZE },
});

exports.uploadSingleVideo = (fieldName) => videoMulter.single(fieldName);
