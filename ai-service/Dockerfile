# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and TensorFlow
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# Copy the rest of the code
COPY . .

# Expose port 5001
EXPOSE 5001

# Command to run the application with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--threads", "4", "--timeout", "120", "app:app"]
