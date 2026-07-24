# Product Requirement Document (PRD)
## AI-Powered Accident Detection System

**Version:** 1.0
**Status:** Draft for Development
**Owner:** Project Lead

---

## 1. Executive Summary

The AI-Powered Accident Detection System is a real-time monitoring platform that uses computer vision to detect road accidents from CCTV/camera feeds and automatically triggers emergency response workflows — alerting hospitals, police, and emergency contacts within seconds of an incident. The goal is to shrink the "golden hour" response gap that costs lives in road traffic accidents.

---

## 2. Problem Statement

Road accidents are frequently detected late — often only after a bystander calls emergency services. This delay:
- Increases fatality risk (the "golden hour" principle).
- Leaves accident scenes without location/severity context for responders.
- Provides no structured data trail for city traffic authorities.

There is no widely deployed, low-cost, camera-based system that autonomously detects an accident, classifies its severity, and notifies the right people/services immediately without human intervention.

---

## 3. Goals & Objectives

| Goal | Description |
|---|---|
| Real-time detection | Detect accidents from live/recorded video within 2–3 seconds of occurrence |
| Automated alerting | Notify emergency contacts, hospitals, and police without manual triggering |
| Actionable dashboard | Give admins/authorities a live operational view of incidents and history |
| Data-driven improvement | Capture feedback on false positives/negatives to retrain and improve the model over time |
| Scalable architecture | Support multiple camera feeds/locations via a microservices design |

---

## 4. Target Users / Personas

1. **City Traffic Control Admin** – monitors live feeds, reviews flagged incidents, manages cameras and zones.
2. **Emergency Responder (Hospital/Police dispatcher)** – receives alerts with location, severity, and media evidence.
3. **Registered Emergency Contact** – a citizen linked to a vehicle/location who receives SMS/email if an accident involves them.
4. **System Super Admin** – manages users, roles, camera onboarding, and system health.

---

## 5. Scope

### In Scope (MVP)
- Video/frame-based accident detection using a CNN model.
- REST API bridge between AI service and backend.
- User authentication (JWT) with role-based access (Admin, Responder, Viewer).
- Accident logging with location, timestamp, severity, and snapshot.
- Automated Email (Nodemailer) + SMS (Twilio) alerts.
- Dashboard: live feed view, accident reports, map view, admin panel.
- Dockerized microservices with cloud deployment.

### Out of Scope (MVP) — Candidate for Phase 2
- Native mobile apps (iOS/Android) — web-responsive only for MVP.
- Direct integration with government emergency dispatch systems (108/911) — stubbed/mocked initially.
- License plate recognition and vehicle identification.

---

## 6. Functional Requirements

### 6.1 AI Detection Module
- FR1: System shall ingest video frames from a live/simulated camera feed.
- FR2: System shall preprocess frames (resize, normalize) before inference.
- FR3: System shall classify each frame/sequence as Accident / No Accident.
- FR4: System shall output a **severity score** (Minor / Moderate / Severe) — *(new)*.
- FR5: System shall expose detection via a `POST /detect` REST endpoint returning JSON.

### 6.2 Backend & Data
- FR6: System shall authenticate users via JWT-based login.
- FR7: System shall persist every detected accident with metadata (time, location, severity, image/clip reference).
- FR8: System shall expose CRUD-style APIs for accidents, users, locations, and emergency contacts.
- FR9: System shall enforce role-based access control (Admin / Responder / Viewer) — *(new)*.
- FR10: System shall log every alert dispatch attempt and its delivery status — *(new)*.

### 6.3 Alerting
- FR11: On accident detection above a configurable severity threshold, system shall send Email + SMS to relevant emergency contacts, and to the nearest hospital/police station on record.
- FR12: System shall support alert retry/fallback if the first channel fails (e.g., SMS fails → fallback to voice call/email) — *(new)*.
- FR13: System shall push a real-time in-dashboard notification via WebSocket the instant an accident is logged — *(new)*.

### 6.4 Frontend Dashboard
- FR14: System shall show a live camera feed view with an overlay indicator when an accident is flagged.
- FR15: System shall display an accident report list, filterable by date, location, and severity.
- FR16: System shall show accident locations on a map along with nearby hospitals and police stations.
- FR17: System shall provide an Admin Panel for managing cameras, users, and system configuration.
- FR18: System shall provide an analytics dashboard (accident heatmaps, time-of-day trends, response time metrics) — *(new)*.

### 6.5 Feedback Loop *(new)*
- FR19: Admins/responders shall be able to mark a detected accident as a **false positive** or confirm as **true positive**.
- FR20: Labeled feedback shall be stored and exportable to retrain/improve the CNN model periodically.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Detection inference latency ≤ 1.5s per frame batch on target hardware |
| Availability | Core alerting pipeline should target 99.5% uptime |
| Scalability | Architecture must support horizontal scaling of the AI service independently of backend/frontend |
| Security | JWT auth, hashed passwords (bcrypt), HTTPS everywhere, rate-limited public endpoints |
| Reliability | Alert dispatch must have retry logic; no accident event should be silently dropped |
| Data Retention | Accident evidence (images/clips) retained per configurable policy (e.g., 90 days) with archival to cold storage |
| Auditability | All admin actions and alert dispatches are logged and traceable |
| Portability | All services containerized; deployable to any Docker-compatible host |

---

## 8. Advanced / New Features (Beyond Original Scope)

These are recommended additions to differentiate this from a basic academic project and push it toward an "industry-grade" system:

1. **Severity Classification** — not just accident/no-accident, but Minor/Moderate/Severe, driving different alert urgency and responder dispatch.
2. **Real-Time WebSocket Alerts** — push live updates to the dashboard instantly instead of polling.
3. **Nearest Emergency Service Routing** — use geolocation + Maps Distance Matrix API to auto-identify and alert the closest hospital and police station.
4. **Evidence Clip Storage** — auto-save a short video clip (not just a frame) to S3/Cloudinary as evidence, linked to the accident record.
5. **False-Positive Feedback Loop & Model Retraining Pipeline** — human-in-the-loop labeling to continuously improve model accuracy.
6. **Edge Deployment Mode** — TensorFlow Lite–optimized model variant for running on low-power edge devices (Raspberry Pi/Jetson Nano) at camera sites with intermittent connectivity, syncing when back online.
7. **Multi-Camera & Multi-Zone Management** — admin can onboard/manage many camera feeds across multiple city zones from one dashboard.
8. **Role-Based Access Control (RBAC)** — Super Admin, Zone Admin, Responder, Viewer roles with scoped permissions.
9. **Audit Logs** — immutable log of every login, config change, and alert action for compliance.
10. **Analytics & Heatmaps** — visualize accident-prone zones, peak times, and average response time trends.
11. **Multilingual Alert Templates** — SMS/Email alerts localized to the region's primary language(s).
12. **Offline-First PWA for Field Responders** — installable web app that queues actions when responders have poor connectivity.
13. **CI/CD Pipeline** — automated build/test/deploy via GitHub Actions across all three services.
14. **Monitoring & Observability** — Prometheus + Grafana dashboards for service health, detection throughput, and alert latency.

---

## 9. Success Metrics (KPIs)

| Metric | Target |
|---|---|
| Detection accuracy (F1 score) | ≥ 90% on validation dataset |
| False positive rate | < 5% |
| End-to-end alert latency (detection → SMS/email sent) | < 10 seconds |
| Dashboard real-time update latency | < 2 seconds |
| System uptime | ≥ 99.5% monthly |

---

## 10. Assumptions & Constraints

- Camera feeds are accessible either as live RTSP streams or simulated via uploaded video files for MVP/demo purposes.
- Twilio and email provider accounts (with trial/sandbox credentials) are available for alert testing.
- Hosting is on free/low-tier cloud services (Render, Netlify, Railway) for MVP, which may introduce cold-start latency.
- Dataset for training (accident vs. non-accident clips) is either publicly sourced (e.g., Kaggle) or synthetically augmented.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Low-quality/small training dataset → poor model accuracy | Use data augmentation, transfer learning (e.g., pre-trained CNN backbone) |
| Free-tier hosting cold starts delay alerts | Add health-check pings / consider paid tier for production |
| False positives causing alert fatigue | Severity thresholding + human confirmation step before escalation to police/hospital |
| SMS/Email provider rate limits or costs | Use fallback channels and batch/queue alerts responsibly |

---

## 12. Release Phases

- **Phase 1 (MVP):** Core detection → alert → dashboard pipeline (FR1–FR18 minus advanced items).
- **Phase 2:** Feedback loop, retraining pipeline, RBAC, audit logs, analytics dashboard.
- **Phase 3:** Edge deployment, offline-first responder app, multilingual alerts, CI/CD & observability stack.
