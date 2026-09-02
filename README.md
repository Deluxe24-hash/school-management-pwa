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

### Default Login
- Email: `admin@school.com`
- Password: `Admin@123`

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
MIT
