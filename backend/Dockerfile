# Multi-stage Dockerfile for backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all deps (including dev) for build
COPY package*.json ./
RUN npm ci

# Copy source, build, and generate prisma client
COPY . .
RUN npm run build
RUN npx prisma generate

# Final runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only package files and install production deps to keep image smaller
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and generated prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 5000
CMD ["node", "dist/server.js"]
