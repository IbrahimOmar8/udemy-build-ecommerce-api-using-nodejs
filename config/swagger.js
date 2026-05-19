const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'E-Learning Platform API',
      version: '1.0.0',
      description:
        'REST API for the e-learning platform. Covers auth, courses, curriculum, enrollments, quizzes, assignments, certificates, Q&A, payments, and more.',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:8000',
        description: 'Current environment',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'fail' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer' },
            limit: { type: 'integer' },
            numberOfPages: { type: 'integer' },
            totalDocuments: { type: 'integer' },
            next: { type: 'integer' },
            prev: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: {
              type: 'string',
              enum: ['student', 'instructor', 'admin'],
            },
            profileImg: { type: 'string' },
            emailVerified: { type: 'boolean' },
            instructorProfile: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                bio: { type: 'string' },
                ratingsAverage: { type: 'number' },
                totalStudents: { type: 'integer' },
                approved: { type: 'boolean' },
              },
            },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            subtitle: { type: 'string' },
            description: { type: 'string' },
            instructor: { type: 'string' },
            category: { type: 'string' },
            level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced', 'all'],
            },
            language: { type: 'string' },
            price: { type: 'number' },
            discountPrice: { type: 'number' },
            isFree: { type: 'boolean' },
            thumbnail: { type: 'string' },
            promoVideo: { type: 'string' },
            status: {
              type: 'string',
              enum: [
                'draft',
                'pending_review',
                'published',
                'archived',
                'rejected',
              ],
            },
            totalLectures: { type: 'integer' },
            totalSections: { type: 'integer' },
            totalDurationSeconds: { type: 'integer' },
            ratingsAverage: { type: 'number' },
            ratingsQuantity: { type: 'integer' },
            enrollmentsCount: { type: 'integer' },
            tags: {
              type: 'array',
              items: { type: 'string' },
            },
            learningOutcomes: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
        Section: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            course: { type: 'string' },
            order: { type: 'integer' },
            totalLectures: { type: 'integer' },
          },
        },
        Lecture: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            section: { type: 'string' },
            course: { type: 'string' },
            type: {
              type: 'string',
              enum: ['video', 'article', 'quiz', 'assignment'],
            },
            videoUrl: { type: 'string' },
            article: { type: 'string' },
            durationSeconds: { type: 'integer' },
            isPreview: { type: 'boolean' },
            order: { type: 'integer' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            course: { type: 'string' },
            progressPercent: { type: 'integer' },
            completedAt: { type: 'string', format: 'date-time' },
            certificateIssued: { type: 'boolean' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Categories' },
      { name: 'Courses' },
      { name: 'Curriculum' },
      { name: 'Enrollments' },
      { name: 'Quizzes' },
      { name: 'Assignments' },
      { name: 'Certificates' },
      { name: 'Q&A' },
      { name: 'Notes' },
      { name: 'Reviews' },
      { name: 'Cart' },
      { name: 'Wishlist' },
      { name: 'Coupons' },
      { name: 'Payments' },
      { name: 'Notifications' },
      { name: 'Instructors' },
    ],
  },
  apis: ['./routes/*.js', './docs/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

const mountSwagger = (app) => {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'E-Learning API Docs',
    })
  );
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = mountSwagger;
