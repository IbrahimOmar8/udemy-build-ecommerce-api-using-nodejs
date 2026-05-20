FROM node:18-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "server.js"]
