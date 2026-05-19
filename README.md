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
- Pluggable storage abstraction (`utils/storage`) — currently `local`, can be swapped to S3 / Cloudinary without touching service code
- Centralized error handling with `ApiError`
- API features helper (filter, sort, search, paginate, field limiting)
- Rate limiting, HPP protection, CORS, compression
- Health check at `/api/v1/health`

---

## Tech Stack

- **Runtime**: Node.js 16+ (Node 18 supported)
- **Framework**: Express 4
- **DB**: MongoDB via Mongoose 6
- **Auth**: JWT (access + refresh)
- **Validation**: express-validator
- **Uploads**: multer + sharp
- **Payments**: Stripe
- **Email**: nodemailer

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
│       └── localProvider.js
├── uploads/        (gitignored runtime media)
├── server.js
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

# Storage
STORAGE_PROVIDER=local
MAX_VIDEO_SIZE_MB=500
MAX_FILE_SIZE_MB=50

# Payments
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:3000

# Rate limiting
RATE_LIMIT_MAX=200
```

### Running

```bash
npm run start:dev   # dev with nodemon
npm start           # production
```

The API mounts everything under `/api/v1/*`.

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

Uploads (images, videos, attachments, certificates) flow through `utils/storage`. The `local` provider writes to `uploads/<folder>/<filename>` and serves files statically. To migrate to S3 or Cloudinary later, drop a new provider into `utils/storage/`, register it in `utils/storage/index.js`, and set `STORAGE_PROVIDER=s3` — no service code needs to change.

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
