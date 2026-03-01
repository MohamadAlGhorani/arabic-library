# Stage 1: Build the React client
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine

WORKDIR /app

# Copy server files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/

# Copy built client from stage 1
COPY --from=client-build /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p /app/server/uploads

# Expose port (Back4app uses PORT env variable)
EXPOSE 5000

WORKDIR /app/server
CMD ["node", "index.js"]
