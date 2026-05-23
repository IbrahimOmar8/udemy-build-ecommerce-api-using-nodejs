const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const ai = require('../utils/ai/anthropic');
const Course = require('../models/courseModel');

// @desc    AI feature availability + active model
// @route   GET /api/v1/ai/status
exports.status = asyncHandler(async (req, res) => {
  res.status(200).json({
    configured: ai.isConfigured(),
    model: ai.isConfigured() ? ai.model : null,
  });
});

const guardConfigured = (next) => {
  if (!ai.isConfigured()) {
    next(new ApiError('AI features are not configured on this server', 503));
    return false;
  }
  return true;
};

// @desc    Draft a compelling course description from a title + brief
// @route   POST /api/v1/ai/course/description
// @access  Private/Instructor|Admin
exports.draftDescription = asyncHandler(async (req, res, next) => {
  if (!guardConfigured(next)) return;
  const { title, brief, level = 'all', language = 'en' } = req.body;
  if (!title) return next(new ApiError('title is required', 400));

  const system =
    'You write course marketing copy for an e-learning platform. ' +
    'Output should be engaging, specific, and grounded in concrete outcomes. ' +
    'Avoid hype, generic adjectives, and fluff. Use plain prose, not bullet points.';

  const user = `Write a compelling 120-180 word course description.

Course title: ${title}
${brief ? `Brief: ${brief}\n` : ''}Audience level: ${level}
Language: ${language}

Write 2 short paragraphs. First paragraph: what the learner will be able to do
after the course (concrete capabilities, not promises). Second paragraph: why
this matters and what makes the course practical. No headings, no markdown, no
emojis, no "in this course we will...".`;

  const { text, usage } = await ai.generate({
    system,
    user,
    maxTokens: 1024,
    effort: 'medium',
  });
  res.status(200).json({ data: { description: text, usage } });
});

// @desc    Generate "What you'll learn" outcomes
// @route   POST /api/v1/ai/course/outcomes
exports.generateOutcomes = asyncHandler(async (req, res, next) => {
  if (!guardConfigured(next)) return;
  const { title, description, level = 'all' } = req.body;
  if (!title) return next(new ApiError('title is required', 400));

  const system =
    'You design learning outcomes. Each outcome is a single concrete capability ' +
    'the learner will have after the course. Start with an action verb. Be specific.';

  const user = `For the course below, write 5 to 8 concrete learning outcomes.

Title: ${title}
${description ? `Description: ${description}\n` : ''}Level: ${level}

Return ONLY a JSON array of strings, no commentary. Example:
["Build a REST API with Express and MongoDB", "Implement JWT-based authentication", ...]

Each outcome must:
- Start with an action verb (Build, Implement, Design, Deploy, Analyze, ...)
- Reference a concrete artifact or technique
- Be specific enough to assess (no "understand", "learn about", "be familiar with")
- Be one short line, no period needed`;

  const { parsed, text, usage } = await ai.generate({
    system,
    user,
    maxTokens: 1024,
    effort: 'medium',
    json: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 10,
    },
  });
  res.status(200).json({
    data: { outcomes: parsed || extractList(text), usage },
  });
});

// @desc    Generate requirements / prerequisites
// @route   POST /api/v1/ai/course/requirements
exports.generateRequirements = asyncHandler(async (req, res, next) => {
  if (!guardConfigured(next)) return;
  const { title, description, level = 'all' } = req.body;
  if (!title) return next(new ApiError('title is required', 400));

  const user = `List 3 to 5 prerequisites for the course below.

Title: ${title}
${description ? `Description: ${description}\n` : ''}Level: ${level}

Return ONLY a JSON array of strings. Each one must be a specific prior skill,
tool, or knowledge ("Basic JavaScript familiarity", "A computer with Node.js
installed", not "Some programming experience"). For beginner-level courses,
keep prerequisites light or say "No prior experience needed".`;

  const { parsed, text, usage } = await ai.generate({
    system: 'You write short, honest prerequisite lists for online courses.',
    user,
    maxTokens: 512,
    effort: 'low',
    json: { type: 'array', items: { type: 'string' } },
  });
  res.status(200).json({
    data: { requirements: parsed || extractList(text), usage },
  });
});

// @desc    Suggest a section outline (sections + lectures) for a course
// @route   POST /api/v1/ai/course/outline
exports.generateOutline = asyncHandler(async (req, res, next) => {
  if (!guardConfigured(next)) return;
  const { title, description, level = 'all', totalHours = 4 } = req.body;
  if (!title) return next(new ApiError('title is required', 400));

  const system =
    'You design course curricula. Curricula should be progressive (each section ' +
    'depends on the prior one), practical (lectures map to concrete activities), ' +
    'and right-sized for the requested length.';

  const user = `Design a curriculum outline for the course below.

Title: ${title}
${description ? `Description: ${description}\n` : ''}Level: ${level}
Target length: ${totalHours} hours of video

Return ONLY JSON with this shape:
{
  "sections": [
    {
      "title": "...",
      "description": "1 sentence describing the section",
      "lectures": [
        { "title": "...", "estimatedMinutes": 8 },
        ...
      ]
    }
  ]
}

Produce 4 to 8 sections, each with 3 to 7 lectures. Sum of estimatedMinutes
should be close to ${totalHours * 60}. Don't include intro/outro fluff unless
they teach something concrete.`;

  const { parsed, text, usage } = await ai.generate({
    system,
    user,
    maxTokens: 2048,
    effort: 'high',
    json: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              lectures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    estimatedMinutes: { type: 'integer' },
                  },
                  required: ['title'],
                  additionalProperties: false,
                },
              },
            },
            required: ['title', 'lectures'],
            additionalProperties: false,
          },
        },
      },
      required: ['sections'],
      additionalProperties: false,
    },
  });

  res
    .status(200)
    .json({ data: { ...(parsed || tryParse(text) || { sections: [] }), usage } });
});

// @desc    Draft an announcement for a course
// @route   POST /api/v1/ai/course/announcement
exports.draftAnnouncement = asyncHandler(async (req, res, next) => {
  if (!guardConfigured(next)) return;
  const { courseId, topic } = req.body;
  if (!courseId || !topic)
    return next(new ApiError('courseId and topic are required', 400));

  const course = await Course.findById(courseId).select('title subtitle');
  if (!course) return next(new ApiError('Course not found', 404));

  const { text, usage } = await ai.generate({
    system:
      'You write short course announcements for an e-learning platform. ' +
      'Tone: warm, direct, helpful. No emojis. No hype.',
    user: `Write a 60-100 word announcement for students of "${course.title}".

Topic: ${topic}

Output JSON: {"title": "...", "body": "..."}
- title: <= 80 characters, no trailing period
- body: 1-2 short paragraphs, plain text`,
    maxTokens: 512,
    effort: 'low',
    json: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['title', 'body'],
      additionalProperties: false,
    },
  });

  const parsed = tryParse(text);
  res
    .status(200)
    .json({ data: parsed || { title: topic, body: text }, usage });
});

const tryParse = (s) => {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : s);
  } catch (e) {
    return null;
  }
};

const extractList = (s) => {
  const arr = tryParse(s);
  if (Array.isArray(arr)) return arr;
  return s
    .split(/\n+/)
    .map((l) => l.replace(/^[\-\*\d\.\s]+/, '').trim())
    .filter(Boolean);
};
