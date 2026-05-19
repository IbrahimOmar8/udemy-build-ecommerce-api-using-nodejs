const { startWorker } = require('../config/queue');
const storage = require('../utils/storage');
const Certificate = require('../models/certificateModel');
const Enrollment = require('../models/enrollmentModel');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const {
  generateSerial,
  generateSvg,
} = require('../utils/certificateGenerator');

/**
 * Background certificate generation. Useful if we later move to heavier PDF
 * rendering (puppeteer, pdfkit) that we don't want blocking the request.
 */
const start = () => {
  const worker = startWorker('certificate', async (job) => {
    const { enrollmentId } = job.data;
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.certificateIssued) return;

    const [course, student] = await Promise.all([
      Course.findById(enrollment.course),
      User.findById(enrollment.student),
    ]);
    const instructor = await User.findById(
      course.instructor._id || course.instructor
    );

    const serial = generateSerial();
    const issuedAt = new Date();
    const svg = generateSvg({
      studentName: student.name,
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
      student: student._id,
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
  });
  if (worker) {
    console.log('[certificate-worker] started');
  }
};

module.exports = { start };
