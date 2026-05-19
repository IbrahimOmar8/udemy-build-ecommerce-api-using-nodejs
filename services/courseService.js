const slugify = require('slugify');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');
const storage = require('../utils/storage');

const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');
const Enrollment = require('../models/enrollmentModel');

exports.uploadCourseMedia = uploadMixOfImages([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'promoVideo', maxCount: 1 },
]);

exports.processCourseMedia = asyncHandler(async (req, res, next) => {
  if (req.files && req.files.thumbnail) {
    const filename = `course-thumb-${uuidv4()}-${Date.now()}.jpeg`;
    const buffer = await sharp(req.files.thumbnail[0].buffer)
      .resize(1200, 675, { fit: 'cover' })
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toBuffer();
    await storage.save(buffer, { folder: 'courses', filename });
    req.body.thumbnail = filename;
  }
  if (req.files && req.files.promoVideo) {
    const filename = `course-promo-${uuidv4()}-${Date.now()}`;
    await storage.save(req.files.promoVideo[0].buffer, {
      folder: 'courses',
      filename,
    });
    req.body.promoVideo = filename;
  }
  next();
});

// Inject instructor from authenticated user
exports.setInstructor = (req, res, next) => {
  if (!req.body.instructor) req.body.instructor = req.user._id;
  next();
};

// Auto generate slug if not provided
exports.generateSlug = (req, res, next) => {
  if (req.body.title && !req.body.slug) {
    req.body.slug = `${slugify(req.body.title, { lower: true, strict: true })}-${Date.now().toString(36)}`;
  }
  next();
};

// Filter: only published unless owner/admin
exports.publicFilter = (req, res, next) => {
  req.filterObj = req.filterObj || {};
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
    req.filterObj.status = 'published';
  } else if (req.query.mine === 'true' && req.user.role === 'instructor') {
    req.filterObj.instructor = req.user._id;
  } else if (req.user.role !== 'admin') {
    req.filterObj.$or = [{ status: 'published' }, { instructor: req.user._id }];
  }
  next();
};

// @desc    Get all courses (with filters/search)
// @route   GET /api/v1/courses
// @access  Public
exports.getCourses = factory.getAll(Course, 'Course');

// @desc    Get single course by id or slug, includes sections + lectures
// @route   GET /api/v1/courses/:idOrSlug
// @access  Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const course = await Course.findOne(query).populate({
    path: 'sections',
    options: { sort: { order: 1 } },
    populate: {
      path: 'lectures',
      select: 'title type durationSeconds order isPreview',
    },
  });

  if (!course) return next(new ApiError(`No course found`, 404));

  // Hide drafts from public
  if (
    course.status !== 'published' &&
    (!req.user ||
      (req.user.role !== 'admin' &&
        course.instructor._id.toString() !== req.user._id.toString()))
  ) {
    return next(new ApiError('Course not available', 404));
  }

  // Check enrollment for current user (if any)
  let isEnrolled = false;
  if (req.user) {
    const enr = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });
    isEnrolled = !!enr;
  }

  res.status(200).json({ data: course, isEnrolled });
});

// @desc    Create course (instructor)
// @route   POST /api/v1/courses
// @access  Private/Instructor
exports.createCourse = factory.createOne(Course);

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private/Owner|Admin
exports.updateCourse = factory.updateOne(Course);

// @desc    Delete course
// @route   DELETE /api/v1/courses/:id
// @access  Private/Owner|Admin
exports.deleteCourse = factory.deleteOne(Course);

// Ownership check (used as middleware after :id param)
exports.verifyCourseOwnership = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError('Course not found', 404));
  const isOwner = course.instructor._id.toString() === req.user._id.toString();
  const isCoInstructor = (course.coInstructors || []).some(
    (id) => id.toString() === req.user._id.toString()
  );
  if (!isOwner && !isCoInstructor && req.user.role !== 'admin') {
    return next(new ApiError('Not authorized to manage this course', 403));
  }
  req.course = course;
  next();
});

// @desc    Publish course (submit for review or publish directly if approved)
// @route   POST /api/v1/courses/:id/publish
// @access  Private/Owner|Admin
exports.publishCourse = asyncHandler(async (req, res, next) => {
  const course = req.course;
  // Require minimum content
  const sectionsCount = await Section.countDocuments({ course: course._id });
  const lecturesCount = await Lecture.countDocuments({ course: course._id });
  if (sectionsCount === 0 || lecturesCount === 0) {
    return next(new ApiError('Course needs at least one section and one lecture', 400));
  }
  course.status = req.user.role === 'admin' ? 'published' : 'pending_review';
  if (course.status === 'published') course.publishedAt = Date.now();
  await course.save();
  res.status(200).json({ data: course });
});

// @desc    Admin approve/reject course
// @route   POST /api/v1/courses/:id/review-decision
// @access  Private/Admin
exports.reviewDecision = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new ApiError('Course not found', 404));
  const decision = req.body.decision;
  if (decision === 'approve') {
    course.status = 'published';
    course.publishedAt = Date.now();
  } else if (decision === 'reject') {
    course.status = 'rejected';
  } else {
    return next(new ApiError('Invalid decision (approve|reject)', 400));
  }
  await course.save();
  res.status(200).json({ data: course });
});

// @desc    Recalculate course aggregates (sections/lectures count, total duration)
exports.recalcCourseStats = async (courseId) => {
  const [sectionsCount, lectures] = await Promise.all([
    Section.countDocuments({ course: courseId }),
    Lecture.find({ course: courseId }, 'durationSeconds'),
  ]);
  const totalLectures = lectures.length;
  const totalDuration = lectures.reduce(
    (sum, l) => sum + (l.durationSeconds || 0),
    0
  );
  await Course.findByIdAndUpdate(courseId, {
    totalSections: sectionsCount,
    totalLectures,
    totalDurationSeconds: totalDuration,
  });
};
