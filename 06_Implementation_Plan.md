# Implementation Plan
## AI-Powered Accident Detection System

This plan extends your original 2-week sprint into a full **4-phase, ~6-week plan** — the first 2 weeks deliver your original MVP scope; the following phases layer in the advanced features (feedback loop, RBAC, real-time alerts, analytics, edge mode, CI/CD).

---

## Phase 0: Foundations (Day 0)
- [ ] Create root repo `AI-Accident-Detection-System`, initialize Git, set up `.gitignore`.
- [ ] Set up project management board (e.g., GitHub Projects/Trello) mirroring this plan's tasks.
- [ ] Provision accounts: MongoDB Atlas, Twilio (trial), SMTP/SendGrid, Google Maps API key, S3/Cloudinary, Render/Netlify/Railway.

---

## Phase 1: MVP Core (Weeks 1–2) — *original scope, refined*

### Week 1 — AI Engine & Data Layer
| Day | Task |
|---|---|
| 1 | Repo/folder structure setup; download/curate accident vs. non-accident dataset |
| 2 | Build `detect_accident.py` — frame extraction from sample videos |
| 3 | Build `image_preprocessing.py`; write & run `train_model.py`; export `accident_model.h5` |
| 4 | Build `app.py` (Flask) exposing `POST /detect` + `GET /health`; test with Postman |
| 5 | Initialize Node backend, connect MongoDB Atlas, define Mongoose schemas (`User`, `Accident`, `Location`, `EmergencyContact`) |
| 6 | Implement JWT auth (`authController.js`, `authMiddleware.js`) and core Express routes |
| 7 | Build `aiService.js` bridge — Node calls Flask `/detect`, persists result to MongoDB |

### Week 2 — Interface, Alerts, Deployment
| Day | Task |
|---|---|
| 8 | Scaffold React app (Vite), install Axios/Router/Tailwind, build `AuthContext` |
| 9 | Build `Navbar`, `Login`, `CameraFeed` components |
| 10 | Build Accident Reports page, Admin Panel shell, integrate map view (Leaflet/Google Maps) |
| 11 | Implement `alertController.js` — Twilio SMS + Nodemailer email dispatch |
| 12 | End-to-end test: simulate video → detection → alert → dashboard update |
| 13 | Write Dockerfiles for all 3 services; validate with `docker-compose up --build` |
| 14 | Push to GitHub; deploy AI→Railway, Backend→Render, Frontend→Netlify; smoke-test production |

**Phase 1 Exit Criteria:** A simulated accident video triggers detection → DB record → SMS/Email → visible in dashboard, fully containerized and deployed.

---

## Phase 2: Reliability & Real-Time Features (Weeks 3–4)

| Task | Details |
|---|---|
| Severity classification | Extend model/training to output Minor/Moderate/Severe, not just binary |
| WebSocket layer | Add Socket.IO to backend; emit `accident:new`; subscribe in React dashboard |
| Alert delivery tracking | Add `AlertLog` collection; Twilio/SMTP status webhooks; UI delivery ticks |
| Nearest facility lookup | Integrate Google Maps Distance Matrix API; seed `Location` collection with hospitals/police |
| RBAC | Add role field & middleware guards (`super_admin`, `zone_admin`, `responder`, `viewer`) |
| Feedback loop UI | "Confirm / False Positive" actions on Accident Detail page → `Feedback` collection |
| Evidence storage | Wire S3/Cloudinary upload for accident snapshots/clips; signed URL retrieval |
| Rate limiting & hardening | Add `helmet`, `express-rate-limit`, input validation (Joi) on all routes |

**Phase 2 Exit Criteria:** Real-time dashboard updates without refresh; alert delivery is trackable; false positives can be labeled and stored.

---

## Phase 3: Analytics, Admin Tooling & Audit (Week 5)

| Task | Details |
|---|---|
| Analytics dashboard | Build `/analytics` page — accidents-over-time chart, heatmap, avg. latency KPI |
| Camera/zone management | Admin CRUD for `Camera` collection; live status indicator per camera |
| Audit logging | Middleware to write `AuditLog` entries on sensitive actions (role changes, confirmations) |
| Multilingual alert templates | Externalize SMS/Email copy into locale files; select by contact's language preference |
| Dark mode & accessibility pass | Tailwind dark theme, contrast/keyboard-nav audit |

**Phase 3 Exit Criteria:** Admins have full operational visibility (analytics, camera health, audit trail) beyond raw incident logging.

---

## Phase 4: Scale, Edge & DevOps Maturity (Week 6)

| Task | Details |
|---|---|
| Model retraining pipeline | Script to export `Feedback`-labeled data, retrain/fine-tune model periodically |
| Edge deployment mode | Convert model to TensorFlow Lite; deploy on Raspberry Pi/Jetson Nano for offline-capable camera nodes |
| Offline sync | Local queue on edge devices; sync detections to backend once connectivity restored |
| CI/CD pipeline | GitHub Actions: lint → unit test → build Docker images → deploy on merge to `main` |
| Monitoring | Prometheus/Grafana or hosted uptime monitor across all 3 services; alert on `/health` failures |
| Load & failure testing | Simulate burst of simultaneous detections; verify alert queueing and no dropped incidents |

**Phase 4 Exit Criteria:** System is production-hardened — automated deploys, observability, resilient to intermittent connectivity, and has a defined path to continuously improve model accuracy.

---

## Testing Strategy (cross-phase)

| Layer | Approach |
|---|---|
| AI Model | Hold-out validation set; track precision/recall/F1 per severity class each retrain |
| Backend | Unit tests (Jest) for controllers/services; integration tests for `/detect`→alert flow |
| Frontend | Component tests (React Testing Library); Cypress E2E for login→dashboard→accident-detail flow |
| Alerts | Use Twilio/SMTP sandbox modes in CI to avoid real sends during automated tests |
| Load | k6 or Artillery script simulating concurrent `/detect` calls to validate latency targets |

---

## Deployment Checklist

- [ ] All secrets in platform environment variables (never committed).
- [ ] HTTPS enforced on all public endpoints.
- [ ] MongoDB Atlas IP allowlist / VPC peering configured.
- [ ] Health checks (`/health`) wired into hosting platform's uptime monitor.
- [ ] Backups scheduled (MongoDB Atlas automated backup).
- [ ] Rollback plan documented (previous Docker image tag retained per service).
- [ ] Runbook for "AI service down" and "Alert channel down" scenarios shared with on-call admins.

---

## Suggested Team Roles (if working with a team)

| Role | Responsibility |
|---|---|
| ML Engineer | Dataset curation, model training/retraining, TFLite conversion |
| Backend Engineer | Express APIs, MongoDB schemas, alert/webhook integrations, security |
| Frontend Engineer | React dashboard, real-time UX, map/analytics visualizations |
| DevOps | Docker, CI/CD, monitoring, cloud deployment |
| Product/QA | Requirements tracking, E2E testing, UAT with sample "city admin" scenarios |
