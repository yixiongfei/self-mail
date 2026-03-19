FROM node:22-alpine

# Prisma requires OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY src ./src
COPY tsconfig.json ./
RUN npm run build

# Create data directory for SQLite + credentials
RUN mkdir -p data

EXPOSE 3001
# Expose OAuth callback port for first-time authorization
EXPOSE 3002

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db execute --file prisma/migrations/migrate_categories.sql --schema prisma/schema.prisma 2>/dev/null || true && node dist/index.js"]
