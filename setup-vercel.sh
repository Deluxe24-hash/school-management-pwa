#!/bin/bash
set -e

echo "=========================================="
echo "School Portal - Vercel Setup Script"
echo "=========================================="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting."; exit 1; }

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Step 1: Login to Vercel"
echo "------------------------"
vercel login

echo ""
echo "Step 2: Setup Backend"
echo "---------------------"
cd backend

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created backend/.env from example"
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Deploying backend..."
vercel --prod

echo ""
echo "Backend deployed! Copy the URL above."
echo ""
read -p "Paste your backend URL (e.g., https://your-backend.vercel.app): " BACKEND_URL

cd ..

echo ""
echo "Step 3: Setup Frontend"
echo "----------------------"
cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Creating production env..."
echo "VITE_API_URL=$BACKEND_URL/api/v1" > .env.production

echo "Deploying frontend..."
vercel --prod

cd ..

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Add these environment variables to your BACKEND project:"
echo "   - DATABASE_URL (your PostgreSQL connection string)"
echo "   - JWT_SECRET (generate a strong random string)"
echo "   - JWT_EXPIRES_IN=7d"
echo "   - NODE_ENV=production"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npx prisma migrate deploy"
echo ""
echo "4. Seed the database:"
echo "   cd backend && npx prisma db seed"
echo ""
echo "5. Default login: admin@school.com / Admin@123"
echo ""
