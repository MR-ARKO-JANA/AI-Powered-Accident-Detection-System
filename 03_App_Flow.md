# App Flow Document
## AI-Powered Accident Detection System

---

## 1. High-Level System Flow

```
Camera/Video Feed
   → AI Service (frame extraction + preprocessing)
   → CNN Inference (accident? severity?)
   → Flask /detect response
   → Node.js Backend receives result
   → Save Accident record in MongoDB
   → Geo-lookup nearest hospital/police (Maps API)
   → Trigger Alert Service:
        → Email (Nodemailer)
        → SMS (Twilio)
        → WebSocket push to dashboard
   → React Dashboard updates in real time
   → Admin/Responder reviews, confirms/rejects, dispatches
   → Feedback stored → periodic model retraining
```

---

## 2. End-to-End Accident Detection & Alert Flow (Sequence)

1. **Frame Capture** — Camera feed (or simulated video) sends frames to the AI service at a fixed interval (e.g., every 0.5s).
2. **Preprocessing** — Frame is resized/normalized (`image_preprocessing.py`).
3. **Inference** — CNN model (`accident_model.h5`) classifies the frame/sequence.
4. **Result** — AI service returns `{accident_detected, confidence, severity}` via `POST /detect`.
5. **Backend Ingestion** — `aiService.js` in the Node backend receives this result.
6. **Threshold Check** — If `accident_detected = true` and `confidence` exceeds the configured threshold:
   a. Create an `Accident` document in MongoDB (time, location, severity, camera ID, snapshot/clip reference).
   b. Look up nearest hospital & police station via `/api/locations/nearby`.
   c. Trigger `alertController.js`:
      - Send SMS via Twilio to emergency contacts + nearest police/hospital.
      - Send Email via Nodemailer with severity + location + evidence link.
      - Emit WebSocket event `accident:new` to all connected dashboard clients.
7. **Dashboard Update** — React dashboard's `CameraFeed`/`Dashboard` components receive the WebSocket event and show a live alert banner + update the `AccidentCard` list without a page refresh.
8. **Human Review** — Admin/Responder opens the accident detail, watches the evidence clip, and either:
   - Confirms the incident (escalates / marks resolved), or
   - Flags it as a **false positive** *(new)* — this label is stored for model retraining.
9. **Audit Trail** — Every step (detection, alert dispatch, review action) is logged to the `AuditLogs` collection *(new)*.

---

## 3. User Flow — Admin / Responder

```
Login (JWT) 
   → Dashboard (overview: active alerts, recent accidents, system health)
       → Live Feed page (watch camera streams, manual "flag" override)
       → Accident Reports page (filter by date/severity/location)
           → Accident Detail (map pin, evidence clip, alert delivery status)
               → Mark as Confirmed / False Positive
       → Map View (accident clusters, nearby hospitals/police overlay)
       → Analytics page (heatmap, trends, response-time KPIs)
       → Admin Panel (only Admin/Super Admin roles)
           → Manage Users & Roles
           → Manage Cameras/Zones
           → Manage Emergency Contacts
           → View Audit Logs
   → Logout
```

---

## 4. User Flow — Registered Emergency Contact

```
Receives SMS/Email alert
   → Clicks link to accident location (public, read-only map view)
   → Sees severity + nearest hospital/police already notified
   → (Optional) Calls hospital/police directly from the alert message
```

---

## 5. Edge Case Flows

| Scenario | Flow |
|---|---|
| **No accident detected** | AI service returns `accident_detected: false`; no record created, no alert sent; frame discarded (or sampled for periodic model health checks). |
| **Low-confidence detection** | Below alert threshold but above a "review" threshold → logged as a "Needs Review" accident, dashboard notified but no SMS/Email sent yet, awaiting human confirmation. |
| **False positive flagged** | Admin marks it false positive → record retained with `label: false_positive` for retraining dataset; any alerts already sent are marked "retracted" and a follow-up correction notice may be sent. |
| **Camera/AI service offline** *(new)* | Backend health check detects AI service down → dashboard shows "Detection Paused" banner; if edge mode is enabled, local edge device buffers detections and syncs once connectivity returns. |
| **Alert delivery failure** *(new)* | Twilio/SMTP failure → retry with exponential backoff (e.g., 3 attempts) → if still failing, escalate via alternate channel (voice call API or secondary contact) and log the failure in `AlertLogs`. |
| **Duplicate detection (same incident, multiple frames)** | Backend deduplicates using a short time+location window so one incident doesn't trigger repeated alert spam. |

---

## 6. Data Flow Between Services

```
[Camera] --frames--> [AI Service]
[AI Service] --JSON result--> [Backend]
[Backend] --write--> [MongoDB]
[Backend] --media--> [S3/Cloudinary]
[Backend] --SMS--> [Twilio]
[Backend] --Email--> [SMTP/Nodemailer]
[Backend] --WebSocket--> [Frontend]
[Backend] --geo query--> [Google Maps API]
[Frontend] --REST calls (Axios)--> [Backend]
```
