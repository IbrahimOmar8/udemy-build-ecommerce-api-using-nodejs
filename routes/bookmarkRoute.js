const express = require('express');
const authService = require('../services/authService');

const {
  listMyCourseBookmarks,
  createBookmark,
  deleteBookmark,
} = require('../services/bookmarkService');

// Mounted twice:
//  - /api/v1/courses/:courseId/bookmarks (list mine)
//  - /api/v1/lectures/:lectureId/bookmarks (create)
//  - /api/v1/bookmarks/:id (delete)

exports.courseBookmarkRouter = (() => {
  const r = express.Router({ mergeParams: true });
  r.use(authService.protect);
  r.get('/', listMyCourseBookmarks);
  return r;
})();

exports.lectureBookmarkRouter = (() => {
  const r = express.Router({ mergeParams: true });
  r.use(authService.protect);
  r.post('/', createBookmark);
  return r;
})();

exports.bookmarkGlobalRouter = (() => {
  const r = express.Router();
  r.use(authService.protect);
  r.delete('/:id', deleteBookmark);
  return r;
})();
