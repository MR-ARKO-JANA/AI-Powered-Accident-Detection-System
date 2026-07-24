# Technical Requirement Document (TRD)
## AI-Powered Accident Detection System

**Version:** 1.0

---

## 1. System Architecture Overview

```
[Camera / CCTV / Video Upload]
            |
            v
[AI Service - Python/Flask/OpenCV/TensorFlow]
   - Frame extraction & preprocessing
   - CNN inference (accident / severity classification)
            |
            v  (POST /detect result JSON)
[Backend - Node.js/Express/MongoDB]
   - Auth (JWT) & RBAC
   - Persist Accident/Location/Contact records
   - Trigger Alert Service (Email/SMS/WebSocket)
   - Evidence storage (S3/Cloudinary)
            |
     -------|--------------------------
     |                               |
     v                               v
[MongoDB Atlas]              [Alert Channels: Twilio SMS, Nodemailer Email,
  Users / Accidents /         WebSocket push, Maps/Geo lookup]
  Locations / Contacts /
  Cameras / AuditLogs
            |
            v
[React Frontend Dashboard]
   - Live Feed, Reports, Map View, Admin Panel, Analytics
            |
            v
[End Users: Admin, Responder, Emergency Contact]
```

**Deployment topology:** 3 independently deployable microservices (AI, Backend, Frontend), orchestrated locally via Docker Compose, deployed to Railway (AI), Render (Backend), Netlify (Frontend), with MongoDB Atlas as the managed database.

---

## 2. Technology Stack

### 2.1 AI & Computer Vision Service
| Component | Technology | Notes |
|---|---|---|
| Language | Python 3.10+ | |
| CV Library | OpenCV | Frame extraction, preprocessing |
| ML Framework | TensorFlow / Keras | CNN training & inference |
| Lightweight inference *(new)* | TensorFlow Lite | For edge deployment mode |
| API Framework | Flask | Serves `/detect` endpoint |
| Serving *(new)* | Gunicorn + Flask | Production WSGI server instead of Flask dev server |
| Data handling | NumPy, Pandas | |

### 2.2 Backend Service
| Component | Technology | Notes |
|---|---|---|
| Runtime | Node.js 20+ | |
| Framework | Express.js | |
| Database | MongoDB (Mongoose ODM) | |
| Auth | JSON Web Tokens (JWT), bcrypt | |
| Real-time *(new)* | Socket.IO / WebSocket | Live dashboard push notifications |
| File/Media storage *(new)* | AWS S3 or Cloudinary SDK | Accident evidence clips/images |
| Alerts | Nodemailer (Email), Twilio (SMS) | |
| Maps/Geo *(new)* | Google Maps Distance Matrix / Places API | Nearest hospital/police lookup |
| Validation | Joi / express-validator | Request payload validation |
| Security *(new)* | helmet, express-rate-limit, cors | Hardened HTTP headers, brute-force protection |
| Logging *(new)* | Winston / Morgan | Structured logs for audit and debugging |

### 2.3 Frontend
| Component | Technology | Notes |
|---|---|---|
| Library | React.js (Vite) | |
| Routing | React Router DOM | |
| HTTP Client | Axios | |
| State/Auth | React Context API | AuthContext for session state |
| Real-time *(new)* | socket.io-client | Subscribes to live accident events |
| Maps UI *(new)* | Leaflet.js / Google Maps JS SDK | Map view rendering |
| Charts *(new)* | Recharts / Chart.js | Analytics dashboard visualizations |
| Styling | Tailwind CSS | Utility-first styling, dark mode support |

### 2.4 DevOps & Infrastructure
| Component | Technology | Notes |
|---|---|---|
| Containerization | Docker, Docker Compose | One Dockerfile per service |
| CI/CD *(new)* | GitHub Actions | Lint → test → build → deploy pipeline |
| Monitoring *(new)* | Prometheus + Grafana, or hosted (e.g., Better Uptime) | Service health & latency dashboards |
| Hosting | Render (Backend), Netlify (Frontend), Railway (AI) | |
| Secrets Management | `.env` files (local), platform secret stores (prod) | |
| Version Control | Git + GitHub | |

---

## 3. API Specification

### 3.1 AI Service (Flask)

**POST `/detect`**
- Request: `multipart/form-data` — video frame(s) or short clip.
- Response:
```json
{
  "accident_detected": true,
  "confidence": 0.94,
  "severity": "severe",
  "frame_timestamp": "2026-07-24T10:32:11Z"
}
```

**GET `/health`** *(new)* — service liveness probe for monitoring/orchestration.

### 3.2 Backend Service (Express)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | User login, returns JWT |
| POST | `/api/auth/register` | Admin only | Create new user account |
| POST | `/api/detect` | Authenticated | Forwards frame to AI service, persists result |
| GET | `/api/accidents` | Authenticated | List accidents (filter by date/location/severity) |
| GET | `/api/accidents/:id` | Authenticated | Accident detail incl. evidence link |
| PATCH | `/api/accidents/:id/feedback` *(new)* | Responder/Admin | Mark true/false positive for retraining |
| POST | `/api/alert` | Internal/Authenticated | Dispatch email/SMS/WebSocket alert |
| GET | `/api/alerts/:accidentId/status` *(new)* | Authenticated | Delivery status of dispatched alerts |
| GET | `/api/locations/nearby` *(new)* | Authenticated | Nearest hospital/police for a coordinate |
| CRUD | `/api/cameras` *(new)* | Admin | Manage camera/zone registrations |
| CRUD | `/api/emergency-contacts` | Authenticated | Manage contacts linked to users/vehicles |
| GET | `/api/analytics/summary` *(new)* | Admin | Aggregated KPIs for dashboard charts |
| GET | `/api/audit-logs` *(new)* | Super Admin | Immutable action log |
| WS | `/ws/accidents` *(new)* | Authenticated | Real-time push channel for new accident events |

---

## 4. Third-Party Integrations

| Service | Purpose | Notes |
|---|---|---|
| Twilio | SMS alerts | Use Twilio's error-callback webhook to track delivery status |
| Nodemailer (SMTP/SendGrid) | Email alerts | Use a transactional provider for production reliability |
| Google Maps API | Geolocation, nearest facility lookup, map rendering | Distance Matrix + Places API |
| AWS S3 / Cloudinary | Evidence media storage | Signed URLs for secure, time-limited access |
| MongoDB Atlas | Managed database | Automated backups, replica sets for HA |

---

## 5. Non-Functional / Infrastructure Requirements

- **Scalability:** AI service should be stateless and horizontally scalable behind a load balancer; heavy inference workloads can be queued (e.g., Redis + BullMQ) rather than processed synchronously — *(new, recommended for production)*.
- **Security:** All inter-service traffic over HTTPS; secrets never committed to source control; JWT short expiry + refresh tokens; input validation on all endpoints; rate limiting on `/detect` and `/auth` routes.
- **Performance targets:** `/detect` inference < 1.5s; end-to-end alert dispatch < 10s; dashboard WebSocket push < 2s.
- **Observability:** Structured JSON logs from all services; `/health` endpoints on every service for uptime monitoring; error tracking (e.g., Sentry) — *(new)*.
- **Data Backup:** Daily automated MongoDB Atlas backups; evidence media lifecycle policy (archive after 90 days).

---

## 6. Environment Configuration (`.env` variables — illustrative)

**AI Service**
```
MODEL_PATH=./model/accident_model.h5
FLASK_ENV=production
PORT=5000
```

**Backend**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=***
JWT_EXPIRY=1h
TWILIO_SID=***
TWILIO_AUTH_TOKEN=***
TWILIO_FROM_NUMBER=***
SMTP_HOST=***
SMTP_USER=***
SMTP_PASS=***
AI_SERVICE_URL=https://ai-service.example.com
GOOGLE_MAPS_API_KEY=***
AWS_S3_BUCKET=***
PORT=4000
```

**Frontend**
```
VITE_API_BASE_URL=https://backend.example.com/api
VITE_WS_URL=wss://backend.example.com
VITE_GOOGLE_MAPS_KEY=***
```
