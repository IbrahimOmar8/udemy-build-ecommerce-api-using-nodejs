const express = require('express');
const authService = require('../services/authService');

const {
  listInstructors,
  getInstructor,
  updateMyInstructorProfile,
  dashboard,
  myCourses,
  myStudents,
  myEarnings,
  approveInstructor,
  uploadInstructorImage,
  processInstructorImage,
} = require('../services/instructorService');

const router = express.Router();

router.get('/', listInstructors);
router.get('/:id', getInstructor);

router.use(authService.protect);

router.put(
  '/me/profile',
  authService.allowedTo('instructor'),
  uploadInstructorImage,
  processInstructorImage,
  updateMyInstructorProfile
);
router.get('/me/dashboard', authService.allowedTo('instructor'), dashboard);
router.get('/me/courses', authService.allowedTo('instructor'), myCourses);
router.get('/me/students', authService.allowedTo('instructor'), myStudents);
router.get('/me/earnings', authService.allowedTo('instructor'), myEarnings);

router.post('/:id/approve', authService.allowedTo('admin'), approveInstructor);

module.exports = router;
