const express = require('express');
const authService = require('../services/authService');

const {
  listCourseAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignment,
  submitAssignment,
  listSubmissions,
  gradeSubmission,
  mySubmission,
  uploadAssignmentFiles,
  uploadSubmissionFiles,
  processAssignmentFiles,
  processSubmissionFiles,
} = require('../services/assignmentService');

const { verifyCourseOwnership } = require('../services/courseService');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authService.protect, listCourseAssignments)
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    (req, res, next) => {
      req.params.id = req.params.courseId;
      next();
    },
    verifyCourseOwnership,
    uploadAssignmentFiles,
    processAssignmentFiles,
    createAssignment
  );

router
  .route('/:id')
  .get(authService.protect, getAssignment)
  .put(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    uploadAssignmentFiles,
    processAssignmentFiles,
    updateAssignment
  )
  .delete(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    deleteAssignment
  );

router.post(
  '/:id/submit',
  authService.protect,
  authService.allowedTo('student'),
  uploadSubmissionFiles,
  processSubmissionFiles,
  submitAssignment
);

router.get(
  '/:id/submissions',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  listSubmissions
);

router.get(
  '/:id/my-submission',
  authService.protect,
  authService.allowedTo('student'),
  mySubmission
);

router.post(
  '/submissions/:id/grade',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  gradeSubmission
);

module.exports = router;
