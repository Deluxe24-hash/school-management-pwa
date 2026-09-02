# Vercel Deployment Guide

## Easiest Method: Run the Setup Script

```bash
cd school-management-pwa
./setup-vercel.sh
```

This script will:
1. Install Vercel CLI
2. Login to Vercel
3. Deploy the backend
4. Deploy the frontend
5. Guide you through database setup

## Manual Method

### Prerequisites
- Node.js 18+
- A Vercel account (free at vercel.com)
- A PostgreSQL database (Vercel Postgres, Supabase, Neon, or Railway)

### Step 1: Deploy Backend
```bash
cd backend
npm install
npx prisma generate
vercel --prod
```

### Step 2: Add Environment Variables (Vercel Dashboard)
Go to your backend project in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Strong random string | `your-super-secret-key-12345` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Your frontend URL | `https://your-frontend.vercel.app` |

### Step 3: Run Database Migrations
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Step 4: Deploy Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=https://your-backend.vercel.app/api/v1" > .env.production
npm run build
vercel --prod
```

### Step 5: Connect Frontend to Backend
In your frontend Vercel project, add:
- `VITE_API_URL` → `https://your-backend.vercel.app/api/v1`

## Database Options

### Option A: Vercel Postgres (Easiest)
1. Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to your backend project
3. Vercel auto-adds `POSTGRES_URL` — use that as `DATABASE_URL`

### Option B: Supabase (Free Tier)
1. Go to supabase.com → New Project
2. Settings → Database → Connection String
3. Copy the URI and paste into Vercel env vars

### Option C: Neon (Free Tier)
1. Go to neon.tech → Create Project
2. Copy connection string
3. Paste into Vercel env vars

## Default Login
After seeding:
- **Email:** `admin@school.com`
- **Password:** `Admin@123`

## Custom Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., `school.yourdomain.com`)
3. Update DNS records as instructed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Add your frontend URL to `FRONTEND_URL` env var |
| Database connection failed | Check if database allows external connections |
| Build fails | Ensure `npx prisma generate` runs before build |
| 404 on API routes | Check `vercel.json` routing config |

## Auto-Deploy with GitHub

1. Push this repo to GitHub
2. Connect GitHub repo to Vercel
3. Add the secrets in GitHub → Settings → Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_BACKEND_PROJECT_ID`
   - `VERCEL_FRONTEND_PROJECT_ID`
   - `BACKEND_URL`
4. Every push to `main` will auto-deploy
