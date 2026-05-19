const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const Quiz = require('../models/quizModel');
const QuizAttempt = require('../models/quizAttemptModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');

// @desc    List quizzes for a course
// @route   GET /api/v1/courses/:courseId/quizzes
// @access  Private/Enrolled|Owner
exports.listCourseQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.courseId }).select(
    '-questions.options.isCorrect -questions.correctText -questions.explanation'
  );
  res.status(200).json({ results: quizzes.length, data: quizzes });
});

// @desc    Get quiz (without answers if student)
// @route   GET /api/v1/quizzes/:id
// @access  Private
exports.getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const isOwner = await isCourseOwner(quiz.course, req.user);
  if (!isOwner) {
    // Strip correct answers
    const sanitized = quiz.toObject();
    sanitized.questions = sanitized.questions.map((q) => ({
      ...q,
      options: (q.options || []).map((o) => ({ _id: o._id, text: o.text })),
      correctText: undefined,
      explanation: undefined,
    }));
    return res.status(200).json({ data: sanitized });
  }
  res.status(200).json({ data: quiz });
});

// @desc    Create quiz (instructor)
// @route   POST /api/v1/courses/:courseId/quizzes
// @access  Private/Owner|Admin
exports.createQuiz = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new ApiError('Course not found', 404));
  const quiz = await Quiz.create({
    ...req.body,
    course: course._id,
  });
  res.status(201).json({ data: quiz });
});

// @desc    Update quiz
// @route   PUT /api/v1/quizzes/:id
// @access  Private/Owner|Admin
exports.updateQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!quiz) return next(new ApiError('Quiz not found', 404));
  res.status(200).json({ data: quiz });
});

// @desc    Delete quiz
// @route   DELETE /api/v1/quizzes/:id
// @access  Private/Owner|Admin
exports.deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));
  res.status(204).send();
});

// @desc    Start a quiz attempt
// @route   POST /api/v1/quizzes/:id/attempt
// @access  Private/Student (enrolled)
exports.startAttempt = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: quiz.course,
  });
  if (!enrolled) return next(new ApiError('You must be enrolled', 403));

  if (quiz.maxAttempts > 0) {
    const used = await QuizAttempt.countDocuments({
      student: req.user._id,
      quiz: quiz._id,
    });
    if (used >= quiz.maxAttempts) {
      return next(new ApiError('Maximum attempts reached', 400));
    }
  }

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: req.user._id,
    course: quiz.course,
    maxScore: quiz.questions.reduce((s, q) => s + (q.points || 1), 0),
  });
  res.status(201).json({ data: attempt });
});

// @desc    Submit a quiz attempt
// @route   POST /api/v1/quizzes/:id/submit
// @access  Private/Student
exports.submitAttempt = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return next(new ApiError('Quiz not found', 404));

  const { attemptId, answers } = req.body;
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt || attempt.student.toString() !== req.user._id.toString()) {
    return next(new ApiError('Invalid attempt', 400));
  }
  if (attempt.submittedAt) return next(new ApiError('Attempt already submitted', 400));

  let score = 0;
  let maxScore = 0;
  const graded = [];

  for (const q of quiz.questions) {
    maxScore += q.points || 1;
    const provided = (answers || []).find(
      (a) => String(a.question) === String(q._id)
    );
    let correct = false;
    if (!provided) {
      graded.push({ question: q._id, isCorrect: false, pointsAwarded: 0 });
      continue;
    }
    if (q.type === 'text') {
      correct =
        provided.textAnswer &&
        q.correctText &&
        provided.textAnswer.trim().toLowerCase() ===
          q.correctText.trim().toLowerCase();
    } else {
      const correctIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => String(o._id));
      const selectedIds = (provided.selectedOptions || []).map(String);
      correct =
        correctIds.length === selectedIds.length &&
        correctIds.every((id) => selectedIds.includes(id));
    }
    const points = correct ? q.points || 1 : 0;
    score += points;
    graded.push({
      question: q._id,
      selectedOptions: provided.selectedOptions || [],
      textAnswer: provided.textAnswer,
      isCorrect: correct,
      pointsAwarded: points,
    });
  }

  attempt.answers = graded;
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
  attempt.passed = attempt.percent >= quiz.passingScorePercent;
  attempt.submittedAt = new Date();
  attempt.durationSeconds = Math.round(
    (attempt.submittedAt - attempt.startedAt) / 1000
  );
  await attempt.save();

  const response = quiz.showAnswersAfter
    ? attempt
    : {
        ...attempt.toObject(),
        answers: attempt.answers.map((a) => ({
          question: a.question,
          isCorrect: a.isCorrect,
          pointsAwarded: a.pointsAwarded,
        })),
      };
  res.status(200).json({ data: response });
});

// @desc    Get my attempts for a quiz
// @route   GET /api/v1/quizzes/:id/my-attempts
// @access  Private/Student
exports.myAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    quiz: req.params.id,
    student: req.user._id,
  }).sort('-createdAt');
  res.status(200).json({ results: attempts.length, data: attempts });
});

async function isCourseOwner(courseId, user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const course = await Course.findById(courseId);
  if (!course) return false;
  return course.instructor._id.toString() === user._id.toString();
}
