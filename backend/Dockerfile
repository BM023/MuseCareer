FROM node:20-alpine AS base
WORKDIR /app

COPY backend/package*.json ./ 
RUN npm ci --production
COPY backend/ ./
EXPOSE 8080
CMD ["node", "server.js"]
