const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const storage = require('../utils/storage');
const Certificate = require('../models/certificateModel');
const Enrollment = require('../models/enrollmentModel');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const { generateSerial, generateSvg } = require('../utils/certificateGenerator');

// @desc    Issue (or fetch) certificate for completed course
// @route   POST /api/v1/courses/:courseId/certificate
// @access  Private/Student
exports.issueCertificate = asyncHandler(async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (!enrollment) return next(new ApiError('Not enrolled', 404));
  if (enrollment.progressPercent < 100) {
    return next(new ApiError('Course not completed yet', 400));
  }

  if (enrollment.certificate) {
    const existing = await Certificate.findById(enrollment.certificate);
    if (existing) return res.status(200).json({ data: existing });
  }

  const course = await Course.findById(enrollment.course);
  const instructor = await User.findById(course.instructor._id || course.instructor);

  const serial = generateSerial();
  const issuedAt = new Date();
  const svg = generateSvg({
    studentName: req.user.name,
    courseTitle: course.title,
    instructorName: instructor.name,
    serial,
    issuedAt,
  });
  const filename = `${serial}.svg`;
  await storage.save(Buffer.from(svg, 'utf-8'), {
    folder: 'certificates',
    filename,
  });

  const certificate = await Certificate.create({
    student: req.user._id,
    course: course._id,
    enrollment: enrollment._id,
    serial,
    issuedAt,
    filename,
    fileUrl: `${process.env.BASE_URL || ''}/certificates/${filename}`,
    verifyUrl: `${process.env.BASE_URL || ''}/api/v1/certificates/verify/${serial}`,
  });

  enrollment.certificateIssued = true;
  enrollment.certificate = certificate._id;
  await enrollment.save();

  res.status(201).json({ data: certificate });
});

// @desc    My certificates
// @route   GET /api/v1/certificates/me
exports.myCertificates = asyncHandler(async (req, res) => {
  const certs = await Certificate.find({ student: req.user._id })
    .populate('course', 'title slug thumbnail')
    .sort('-issuedAt');
  res.status(200).json({ results: certs.length, data: certs });
});

// @desc    Public verify certificate by serial
// @route   GET /api/v1/certificates/verify/:serial
exports.verifyCertificate = asyncHandler(async (req, res, next) => {
  const cert = await Certificate.findOne({ serial: req.params.serial })
    .populate('student', 'name')
    .populate('course', 'title');
  if (!cert) return next(new ApiError('Certificate not found', 404));
  res.status(200).json({
    valid: true,
    data: {
      serial: cert.serial,
      studentName: cert.student.name,
      courseTitle: cert.course.title,
      issuedAt: cert.issuedAt,
    },
  });
});
