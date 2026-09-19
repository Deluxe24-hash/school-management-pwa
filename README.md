# School Management Portal

A production-ready Progressive Web Application (PWA) for managing school operations including students, teachers, parents, academics, attendance, results, fees, and communication.

## Features

- **Multi-role Access Control**: SUPER_ADMIN, ADMIN, PRINCIPAL, HEAD_TEACHER, TEACHER, ACCOUNTANT, STUDENT, PARENT
- **Academic Session Management**: Create and manage multiple academic years with terms
- **Student Management**: Admissions, enrollment, transfers, promotions, withdrawals
- **Teacher Management**: Profiles, subject assignments, class assignments
- **Attendance System**: Daily, monthly, and term-based tracking
- **Results & Grading**: CA/Exam entry, automatic grade calculation, report cards
- **Fee Management**: Tuition, levies, online payment integration (Paystack/Flutterwave ready)
- **Assignments**: Create, submit, and grade assignments
- **Announcements**: Targeted notifications by role and class
- **PWA**: Installable, offline-capable, responsive design
- **Dark Mode**: Full light/dark theme support
- **Audit Logging**: Complete audit trail for all actions

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication + bcrypt
- Zod Validation
- Winston Logging
- Helmet Security Headers
- Rate Limiting

### Frontend
- React 18 + TypeScript
- Vite (PWA Plugin)
- Tailwind CSS
- TanStack Query
- Zustand State Management
- React Router DOM
- Recharts (Charts)
- Lucide React (Icons)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Demo Data
Running `npx prisma db seed` populates a full demo school ("Sunrise Model College") with real sample data across every role — students, parents, teachers, classes, assignments, fees, results, and report cards — so the app doesn't look empty on first login.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Super Admin | `admin@school.com` | `Admin@123` | Full access |
| Form Teacher | `ifeoma.nwachukwu@school.com` | `Teacher@123` | Homeroom teacher of JSS 1A |
| Subject Teacher | `tunde.bakare@school.com` | `Teacher@123` | Teaches Math & Physics in SS 1 |
| Parent | `parent1@school.com` | `Parent@123` | Linked to a JSS 1A student |
| Student | `student1@school.com` | `Student@123` | JSS 1A |

**⚠️ Before selling or deploying:** run the seed against a fresh/demo database only — never your live production database, since it will create or upsert a `SchoolSetting` record named "Sunrise Model College" and inject demo students/parents/teachers. For a marketplace listing or client handoff, provision a separate Neon branch or database for demo purposes.

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, POST /auth/register, GET /auth/me |
| Students | CRUD + /students/:id/promote |
| Teachers | CRUD + /teachers/assign-subject |
| Classes | CRUD + /classes/arms |
| Subjects | CRUD |
| Sessions | CRUD + /sessions/:id/set-current + /sessions/terms/:id |
| Attendance | GET /attendance, POST /attendance/mark, GET /attendance/stats |
| Results | GET /results, POST /results/enter, POST /results/lock, POST /results/process |
| Fees | GET /fees, POST /fees, GET /fees/student/:id |
| Payments | GET /payments, POST /payments, POST /payments/:id/verify |
| Assignments | CRUD + /assignments/submit + /assignments/grade |
| Announcements | CRUD |
| Settings | GET /settings, PUT /settings |
| Reports | GET /reports/dashboard, GET /reports/student/:id, GET /reports/class-performance |

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

### Build Backend
```bash
cd backend
npm run build
npm start
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/school_management
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## License
This is commercially licensed software — see [LICENSE.md](./LICENSE.md). It is not open source: you may deploy and customize it for a licensed site, but you may not resell or redistribute the source code itself.
