# LearnHub Web

Next.js 14 frontend for the e-learning platform.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling
- **TanStack Query** for server state
- **Zustand** for client state (auth)
- **React Hook Form** for forms
- **Axios** with auto access-token refresh

## Run

```bash
cp .env.local.example .env.local      # then edit values
npm install
npm run dev                            # http://localhost:3000
```

The backend must be running at `NEXT_PUBLIC_API_URL`. By default it points to `http://localhost:8000/api/v1`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (hero, categories, top courses) |
| `/courses` | Catalog with filters (level, category, sort), keyword search, pagination |
| `/courses/[slug]` | Course details, curriculum preview, reviews, enroll / add-to-cart |
| `/learn/[courseId]` | Player + curriculum sidebar, progress tracking, mark-complete |
| `/cart` | Cart, coupon application, Stripe checkout (or free checkout) |
| `/login`, `/register` | Auth flow with student / instructor toggle |
| `/dashboard` | Student dashboard: my courses, progress, certificates count |
| `/certificates` | List of issued certificates with verify links |
| `/profile` | Edit name / email / phone |
| `/instructor` | Instructor dashboard: stats, course list |
| `/instructor/courses/new` | Create a new draft course |
| `/instructor/courses/[id]/edit` | Course builder: sections, lectures, video upload, publish |

## Project structure

```
web/
├── app/                  Next.js App Router
├── components/
│   ├── ui/               Button, Input, Textarea primitives
│   ├── layout/           Header, Footer
│   ├── course/           CourseCard, CourseGrid
│   └── player/           VideoPlayer
├── lib/
│   ├── api.ts            Axios client + auto refresh
│   ├── queries.ts        TanStack Query endpoints
│   └── utils.ts          cn, formatPrice, formatDuration
├── store/
│   └── useAuthStore.ts   Zustand auth store (persisted)
└── types/index.ts        Shared TS types
```

## Notes

- Token storage uses `localStorage` (`el_access_token`, `el_refresh_token`). The axios interceptor refreshes the access token automatically on 401, and clears tokens on a failed refresh.
- All paid checkout flows redirect to Stripe Checkout; the backend Stripe webhook completes enrollment on the API side.
