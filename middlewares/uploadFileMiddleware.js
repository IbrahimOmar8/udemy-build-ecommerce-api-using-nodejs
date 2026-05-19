const multer = require('multer');
const ApiError = require('../utils/apiError');

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
];

const fileMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(`Unsupported file type: ${file.mimetype}`, 400), false);
    }
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

exports.uploadSingleFile = (fieldName) => fileMulter.single(fieldName);
exports.uploadMultipleFiles = (fieldName, maxCount = 10) =>
  fileMulter.array(fieldName, maxCount);
