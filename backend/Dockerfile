# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Copy package files and install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --production

# Copy source files from builder
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/config ./config
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/Server.js ./Server.js

# Ensure uploads directory exists
RUN mkdir -p uploads/accidents

# Expose port 5000
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]
