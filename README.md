# E-Learning Platform API

A full-featured REST API for an online learning platform built with Node.js, Express, and MongoDB. Instructors create and manage courses (sections, lectures, videos, quizzes, assignments), students enroll, track progress, take exams, complete activities, and earn certificates.

This repository hosts the **Backend** of the platform. Two companion frontends are planned (see Roadmap below):
- Web frontend (Next.js)
- Mobile app (React Native + Expo)

---

## Features

### Authentication & Users
- Self-registration as `student` or `instructor`, admin-managed admin accounts
- Email + password login with bcrypt
- Access token + refresh token (multi-device sessions)
- Forgot password / reset password / email verification flows
- Profile management with image upload (Sharp resizing)

### Instructors
- Public instructor profiles (`/api/v1/instructors`, `/api/v1/instructors/:id`)
- Editable instructor profile (`headline`, `bio`, `expertise`, social links)
- Dashboard with aggregated stats: total courses, students, revenue, ratings
- Earnings breakdown by month
- Student management across all owned courses
- Admin approval workflow for new instructors

### Courses
- Full CRUD with rich metadata (title, subtitle, description, level, language, tags, learning outcomes, requirements, audience, SEO)
- Thumbnail + promo video upload
- Lifecycle: `draft` → `pending_review` → `published` / `rejected` / `archived`
- Status-aware listing (drafts hidden from non-owners)
- Search by keyword, filter by category/level/price, pagination, sort

### Curriculum
- **Sections**: ordered grouping of lectures
- **Lectures**: type = `video` | `article` | `quiz` | `assignment`
  - Video upload (multipart, size limit configurable)
  - Multiple attachments per lecture (PDF, ZIP, docs, ...)
  - Preview lectures (no enrollment required)
  - Captions, duration tracking
- Drag-and-drop reordering endpoints for both sections and lectures

### Enrollments & Progress
- Free enrollment + paid enrollment via Stripe Checkout
- Per-lecture completion tracking with auto progress %
- Resume where you left off (`lastLecture`)
- Course completion → certificate generation

### Quizzes & Exams
- Multiple-choice (single / multi-select), true/false, text answers
- Per-question points, passing score, time limit, max attempts
- Attempt records with auto-grading and review

### Assignments
- File-based + text submissions
- Due dates with late-submission policy
- Instructor grading with score + feedback
- Return-for-revision workflow

### Certificates
- Auto-generated upon 100% course completion
- Unique serial number, SVG output (PDF generation can be plugged in)
- Public verification endpoint by serial

### Q&A / Discussion
- Questions tied to course (optionally to a lecture)
- Threaded answers with instructor flag
- Upvote questions, resolve flag

### Notes
- Student notes pinned to lecture timestamps

### Notifications
- In-app notifications with type, read/unread state, unread count

### Cart / Wishlist / Coupons / Payments
- Cart with multi-course checkout
- Wishlist (favorites)
- Coupons: percent or fixed discount, course-specific or global, max uses, expiry
- Stripe Checkout integration + webhook for fulfillment
- Free checkout when coupon brings total to zero
- Payment history per user

### Reviews
- 1-5 star ratings with title + comment
- Only enrolled students can review
- Auto-aggregated `ratingsAverage` and `ratingsQuantity` on the course

### Infrastructure
- Pluggable storage abstraction (`utils/storage`) with three providers shipped: **local**, **S3**, **Cloudinary** — swap via the `STORAGE_PROVIDER` env var, no service code touched
- **Swagger / OpenAPI** docs at `/api/docs` (spec at `/api/docs.json`)
- **Socket.io** for live notifications and Q&A replies (rooms per user / per course)
- **Redis** cache layer (`middlewares/cacheMiddleware.cacheResponse`) — falls back to no-op when `REDIS_URL` is unset
- **BullMQ** queues with workers for email and certificate generation; falls back to inline execution when Redis is missing so the app keeps working in dev
- Centralized error handling with `ApiError`
- API features helper (filter, sort, search, paginate, field limiting)
- Rate limiting, HPP protection, CORS, compression
- Health check at `/api/v1/health`
- Jest + Supertest test suite with in-memory MongoDB (`npm test`)

---

## Tech Stack

- **Runtime**: Node.js 16+ (Node 18 supported)
- **Framework**: Express 4
- **DB**: MongoDB via Mongoose 6
- **Auth**: JWT (access + refresh)
- **Validation**: express-validator
- **Uploads**: multer + sharp; pluggable storage (local / AWS S3 / Cloudinary)
- **Payments**: Stripe Checkout
- **Email**: nodemailer
- **Realtime**: Socket.io
- **Cache + Queues**: Redis + BullMQ
- **Docs**: swagger-jsdoc + swagger-ui-express (OpenAPI 3)
- **Tests**: Jest + Supertest + mongodb-memory-server

---

## Project Structure

```
.
├── config/
│   └── database.js
├── middlewares/
│   ├── errorMiddleware.js
│   ├── uploadImageMiddleware.js
│   ├── uploadVideoMiddleware.js
│   ├── uploadFileMiddleware.js
│   └── validatorMiddleware.js
├── models/
│   ├── userModel.js
│   ├── categoryModel.js
│   ├── courseModel.js
│   ├── sectionModel.js
│   ├── lectureModel.js
│   ├── enrollmentModel.js
│   ├── quizModel.js
│   ├── quizAttemptModel.js
│   ├── assignmentModel.js
│   ├── submissionModel.js
│   ├── certificateModel.js
│   ├── qnaModel.js
│   ├── noteModel.js
│   ├── notificationModel.js
│   ├── cartModel.js
│   ├── couponModel.js
│   ├── paymentModel.js
│   └── reviewModel.js
├── routes/
│   ├── index.js
│   ├── authRoute.js
│   ├── userRoute.js
│   ├── categoryRoute.js
│   ├── courseRoute.js
│   ├── sectionRoute.js / sectionGlobalRoute.js
│   ├── lectureRoute.js / lectureGlobalRoute.js
│   ├── enrollmentRoute.js / myEnrollmentRoute.js
│   ├── quizRoute.js
│   ├── assignmentRoute.js
│   ├── certificateRoute.js
│   ├── qnaRoute.js / qnaGlobalRoute.js
│   ├── notificationRoute.js
│   ├── instructorRoute.js
│   ├── reviewRoute.js
│   ├── cartRoute.js
│   ├── wishlistRoute.js
│   ├── couponRoute.js
│   ├── paymentRoute.js
│   ├── noteRoute.js / noteGlobalRoute.js
├── services/
│   ├── authService.js
│   ├── userService.js
│   ├── categoryService.js
│   ├── courseService.js
│   ├── sectionService.js
│   ├── lectureService.js
│   ├── enrollmentService.js
│   ├── quizService.js
│   ├── assignmentService.js
│   ├── certificateService.js
│   ├── qnaService.js
│   ├── notificationService.js
│   ├── instructorService.js
│   ├── reviewService.js
│   ├── cartService.js
│   ├── wishlistService.js
│   ├── couponService.js
│   ├── paymentService.js
│   ├── noteService.js
│   └── handlersFactory.js
├── utils/
│   ├── apiError.js
│   ├── apiFeatures.js
│   ├── createToken.js
│   ├── sendEmail.js
│   ├── certificateGenerator.js
│   └── storage/
│       ├── index.js
│       ├── localProvider.js
│       ├── s3Provider.js
│       └── cloudinaryProvider.js
├── workers/
│   ├── emailWorker.js
│   └── certificateWorker.js
├── tests/
│   ├── setup.js
│   ├── auth.test.js
│   ├── course.test.js
│   └── health.test.js
├── docs/
│   └── openapi-paths.yaml
├── config/
│   ├── database.js
│   ├── swagger.js
│   ├── socket.js
│   ├── redis.js
│   └── queue.js
├── uploads/        (gitignored runtime media)
├── app.js          (express app factory; used by server.js and tests)
├── server.js       (HTTP listener + workers + Socket.io)
└── package.json
```

---

## Setup

### Prerequisites
- Node.js 16+ (or 18+)
- MongoDB 5+
- (Optional) Stripe account for paid courses
- (Optional) SMTP credentials for email

### Installation

```bash
npm install
```

### Environment

Create a `config.env` file in the project root:

```env
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:8000

DB_URI=mongodb://127.0.0.1:27017/elearning

JWT_SECRET_KEY=replace-me-with-long-random-string
JWT_EXPIRE_TIME=15m
JWT_REFRESH_SECRET_KEY=replace-me-with-another-long-random-string
JWT_REFRESH_EXPIRE_TIME=30d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

# Storage (local | s3 | cloudinary)
STORAGE_PROVIDER=local
MAX_VIDEO_SIZE_MB=500
MAX_FILE_SIZE_MB=50

# S3 (when STORAGE_PROVIDER=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_S3_PUBLIC_URL=

# Cloudinary (when STORAGE_PROVIDER=cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payments
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:3000

# Redis (optional — enables cache + workers + queues)
REDIS_URL=

# Rate limiting
RATE_LIMIT_MAX=200

# Set to "false" to skip in-process workers
RUN_WORKERS=true
```

A ready-to-copy template lives at `config.env.example`.

### Running

```bash
npm run start:dev   # dev with nodemon
npm start           # production
npm test            # run jest test suite (in-memory MongoDB)
```

The API mounts everything under `/api/v1/*`. Interactive docs are at `/api/docs`.

---

## API Overview

| Group | Endpoint |
|---|---|
| Auth | `POST /api/v1/auth/register`, `POST /login`, `POST /refresh-token`, `POST /logout`, `POST /forgot-password`, `PUT /reset-password`, `POST /verify-email`, `GET /me` |
| Users | `GET/PUT/DELETE /api/v1/users/me`, admin CRUD on `/api/v1/users` |
| Categories | `GET /api/v1/categories`, admin CRUD |
| Courses | `GET/POST /api/v1/courses`, `GET/PUT/DELETE /:id`, `POST /:id/publish`, `POST /:id/review-decision` |
| Curriculum | `GET/POST /api/v1/courses/:courseId/sections`, `GET/POST /api/v1/sections/:sectionId/lectures`, global `/api/v1/sections/:id`, `/api/v1/lectures/:id`, reorder endpoints |
| Enrollments | `POST /api/v1/courses/:courseId/enroll`, `POST/GET /:courseId/progress`, `GET /api/v1/enrollments/me`, `GET /api/v1/courses/:courseId/students` |
| Quizzes | nested under `/api/v1/courses/:courseId/quizzes`, plus `/:id/attempt`, `/:id/submit`, `/:id/my-attempts` |
| Assignments | nested under `/api/v1/courses/:courseId/assignments`, plus `/:id/submit`, `/:id/submissions`, `/api/v1/submissions/:id/grade` |
| Certificates | `POST /api/v1/certificates/courses/:courseId/issue`, `GET /me`, `GET /verify/:serial` |
| Q&A | nested under `/api/v1/courses/:courseId/qna`, plus `/api/v1/qna/:id`, `/answers`, `/upvote` |
| Notes | `GET/POST /api/v1/lectures/:lectureId/notes`, `PUT/DELETE /api/v1/notes/:id` |
| Reviews | nested under `/api/v1/courses/:courseId/reviews` |
| Instructors | `GET /api/v1/instructors`, `GET /:id`, `PUT /me/profile`, `GET /me/dashboard`, `/me/courses`, `/me/students`, `/me/earnings`, admin `POST /:id/approve` |
| Cart | `GET/POST/DELETE /api/v1/cart`, `POST /apply-coupon`, `DELETE /:courseId` |
| Wishlist | `GET/POST /api/v1/wishlist`, `DELETE /:courseId` |
| Coupons | admin/instructor `/api/v1/coupons` |
| Payments | `POST /api/v1/payments/checkout`, `POST /free-checkout`, `GET /me`, webhook `/api/v1/payments/webhook` |
| Notifications | `GET /api/v1/notifications`, `/unread-count`, `POST /read-all`, `/:id/read` |
| Health | `GET /api/v1/health` |

All authenticated routes expect `Authorization: Bearer <accessToken>` header.

---

## Storage Abstraction

Uploads (images, videos, attachments, certificates) flow through `utils/storage`. Three providers ship by default:
- `local` — writes to `uploads/<folder>/<filename>` and serves files via Express static middleware
- `s3` — AWS S3 via `@aws-sdk/client-s3`
- `cloudinary` — Cloudinary (auto-detects resource type: image / video / raw)

Switch providers by setting `STORAGE_PROVIDER=local|s3|cloudinary`. Service code never references a specific provider.

---

## Realtime, Cache, Queues

- **Socket.io** is mounted alongside Express on the same port (`/socket.io`). Authenticate the handshake with `auth.token = "<accessToken>"`. After connecting, the client joins:
  - `user:<userId>` automatically when authenticated, receives `notification:new` events
  - `course:<courseId>` after emitting `course:join` (e.g. while viewing a course page), receives `qna:answer` events
- **Cache**: `middlewares/cacheMiddleware.cacheResponse(ttlSeconds)` is applied to the `GET /courses` listing. Set `REDIS_URL` to activate; otherwise the middleware is a no-op.
- **Queues**: `email` and `certificate` queues are powered by **BullMQ** and consumed by the workers in `workers/`. When Redis is not available, the helper falls back to inline execution so behavior stays identical from the caller's perspective.

---

## API Docs

Once the server is running, browse to:
- **Swagger UI**: `http://localhost:8000/api/docs`
- **Raw OpenAPI**: `http://localhost:8000/api/docs.json`

Path coverage lives in `docs/openapi-paths.yaml` and is picked up automatically.

---

## Tests

```bash
npm test
```

Tests use Jest + Supertest with an in-memory MongoDB (`mongodb-memory-server`). The Express app factory in `app.js` lets tests instantiate the API without binding a port or starting workers.

Coverage so far: auth flow (register, login, refresh, me, protected routes), course lifecycle (create, role guards, publish gate, enroll restrictions), and health checks. Add more tests under `tests/*.test.js`.

---

## Roadmap

The Backend in this repo is **Phase 1**. Two more deliverables are planned:

### Web Frontend (separate project)
- Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- Pages: Landing, Course catalog, Course details, Learn (video player with sidebar), Student/Instructor/Admin dashboards, Cart, Checkout, Profile
- Course builder with drag-and-drop sections/lectures
- Multi-language (Arabic + English, RTL support) via `next-intl`
- TanStack Query, Zustand, React Hook Form + Zod, Video.js / Mux Player

### Mobile App (separate project)
- React Native + Expo (iOS, Android, optional Web)
- Expo Router, NativeWind, TanStack Query
- Offline downloads (`expo-file-system`), Picture-in-Picture, Push notifications (`expo-notifications`)
- Cast support (Chromecast / AirPlay) for video lectures

### Backend hardening (next iterations on this repo)
- Swagger / OpenAPI documentation
- Redis caching + session blacklist
- Bull/BullMQ job queues (transcoding, email, certificate PDFs)
- Socket.io for live notifications and Q&A
- S3 / Cloudinary storage provider implementations
- Test suite (Jest + Supertest)

---

## License

ISC
