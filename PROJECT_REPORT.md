# 📊 Project Report: AI-Powered Accident Detection System (APADS)

## 1. Executive Summary
The **AI-Powered Accident Detection System (APADS)** is a cutting-edge, full-stack solution designed to detect vehicular accidents in real-time using computer vision. By leveraging deep learning, the system can automatically identify high-risk incidents from traffic camera feeds and immediately notify emergency services and administrators, significantly reducing response times.

---

## 2. System Architecture
The system follows a microservices-inspired architecture composed of three primary layers:

### A. Frontend (React)
- **Role**: User Interface and Data Visualization.
- **Key Features**:
  - Real-time HUD (Head-Up Display) Camera Feed.
  - Interactive Dashboard with statistics.
  - Live WebSocket alerts with audio buzzer.
  - Admin panel for managing emergency contacts.
- **Visuals**: Modern, dark-themed interface with cyber-aesthetic elements (scanlines, glowing borders).

### B. AI Service (Python/Flask/TensorFlow/Celery)
- **Role**: Intelligent Video Analytics & Asynchronous Task Processing.
- **Engine**: Convolutional Neural Network (CNN) based on MobileNet/Inception for image classification.
- **Key Features**:
  - Real-time frame processing via `/detect` endpoint.
  - High-sensitivity detection (configurable thresholds).
  - **Asynchronous Task Queueing**: Celery & Redis integration for offloading image processing, OCR, and cloud uploading.
  - **Offline Resilience**: Integrated SQLite database for queuing alerts when the network is unstable.
  - **Recovery Daemon**: Background thread that automatically flushes queued alerts once connectivity is restored.

### C. Backend (Node.js/Express)
- **Role**: Data Management, Security, and Real-time Coordination.
- **Key Features**:
  - **Database**: MongoDB for persistent storage of accident logs and user data.
  - **Real-time Engine**: Socket.io for instantaneous broadcasting of alerts to all connected clients.
  - **Security**: JWT-based authentication for admin/dashboard access and HTTP security hardening (Helmet).
  - **Notification**: Automated reporting pipeline via Mailer and Twilio SMS.

---

## 3. Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Socket.io-client, Axios, CSS Modules (Custom HUD Styles) |
| **AI Service** | Python, Flask, TensorFlow/Keras, OpenCV, Celery, Redis, EasyOCR, SQLite3 |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Socket.io, Nodemailer, Twilio SDK |
| **Mobile** | Kotlin, Gradle (Native Android application for first responders) |
| **DevOps** | Docker, Docker-Compose (Cloud & Edge profiles), Celery Worker |

---

## 4. Key Features & Innovations

### 🛡️ High Reliability & Fault Tolerance
- **Store-and-Forward**: If the backend server goes down, detections are saved locally in an SQLite database and automatically uploaded when the connection returns.
- **MongoDB Auto-Reconnection**: Reconnection handling and database state change listeners in the Express server to prevent backend crashes.
- **Lazy-Initialized Twilio**: Checks environment variables on the fly to avoid crashing when SMS credentials are not fully configured.

### ⚡ Sub-Second Latency & Optimization
- **Asynchronous Processing**: Celery tasks handle LPR and image uploading off the main thread.
- **Nodemailer Transporter Pooling**: Transporter reuse reduces TCP overhead for email dispatches.
- **Database Indexing**: Compound indexes on `SosAlert` and `Accident` schemas (specifically for `camId` and `createdAt`) accelerate dashboard queries and API pagination.
- **WebSockets**: Raw WebSocket emitters emit alerts to dashboard clients under 500ms.

### 🔒 Enterprise-Grade Security
- **Security Headers**: Helmet middleware configured globally to prevent cross-site scripting (XSS) and clickjacking.
- **Upload Restrictions**: Strict file type validation and a 10MB size limit on the upload route.
- **API Hardening**: Input validation and pagination on all critical routes (Accidents, SOS Alert History, and Emergency Contacts).
- **Graceful Shutdown**: Node server catches termination signals to clean up database connections and active sockets.

---

## 5. Deployment & Ops

The project is designed to be highly portable with three Docker configurations:
1. **Standard (`docker-compose.yml`)**: For local development, including health checks, restart policies, and Celery tasks.
2. **Edge (`docker-compose.edge.yml`)**: Optimized for running on low-power devices near the camera source.
3. **Cloud (`docker-compose.cloud.yml`)**: Designed for deployment to AWS/GCP/Azure.

---

## 6. Completed Milestones & Roadmap
- [x] **SMS Notifications**: Integrated Twilio SMS alerts for high-severity accidents with lazy load safety mechanisms.
- [x] **Multi-camera support**: Track and filter incidents using specific `camId` properties, optimized via database indexing.
- [x] **Mobile Companion App**: Kotlin-based companion application for first responders to receive instant updates on the go.
- [x] **License Plate Recognition (LPR)**: Integrated EasyOCR reader inside celery tasks to automatically scan license plates of involved vehicles.
- [x] **Security & Stability Hardening**: Integrated Helmet, input validation, strict file upload whitelists, database reconnection hooks, and graceful server shutdowns.

---
**Created by**: Antigravity AI Assistant
**Date**: June 6, 2026
