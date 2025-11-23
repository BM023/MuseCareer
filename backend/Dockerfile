# backend/Dockerfile - production image for Node backend (uses your existing server.js)
FROM node:20-alpine AS base
WORKDIR /app

# copy package files first for better caching
COPY backend/package*.json ./ 
# install production deps
RUN npm ci --production

# copy source
COPY backend/ ./

EXPOSE 8080
CMD ["node", "server.js"]
