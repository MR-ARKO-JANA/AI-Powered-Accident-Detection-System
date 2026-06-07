# Use official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Set build arguments for React environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_AI_SERVICE_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_AI_SERVICE_URL=$REACT_APP_AI_SERVICE_URL

# Build the React production static files
RUN npm run build

# Install a simple server to host static files
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Command to serve the application on the dynamic port assigned by Cloud Run
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
