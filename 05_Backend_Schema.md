# Backend Schema Document
## AI-Powered Accident Detection System (MongoDB / Mongoose)

---

## 1. Collections Overview

| Collection | Purpose |
|---|---|
| `Users` | Auth + role-based access |
| `Cameras` | Camera/zone registry *(new)* |
| `Accidents` | Core incident records |
| `Locations` | Hospitals/police stations directory |
| `EmergencyContacts` | Contacts to notify per user/vehicle |
| `AlertLogs` | Delivery status of each alert channel *(new)* |
| `Feedback` | Human labels for retraining *(new)* |
| `AuditLogs` | Immutable action trail *(new)* |

---

## 2. Schema Definitions

### 2.1 `User`
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "zone_admin", "responder", "viewer"],
    default: "viewer"
  },
  assignedZones: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camera" }], // for zone_admin scoping
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
```

### 2.2 `Camera` *(new)*
```javascript
const CameraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  zone: { type: String, required: true },
  streamUrl: { type: String }, // RTSP/HLS url, or null for simulated/upload-only
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ["online", "offline", "maintenance"], default: "offline" },
  edgeMode: { type: Boolean, default: false }, // true if running local TFLite inference
  createdAt: { type: Date, default: Date.now }
});
```

### 2.3 `Accident`
```javascript
const AccidentSchema = new mongoose.Schema({
  camera: { type: mongoose.Schema.Types.ObjectId, ref: "Camera", required: true },
  detectedAt: { type: Date, required: true, default: Date.now },
  confidence: { type: Number, required: true }, // 0.0 - 1.0
  severity: { type: String, enum: ["minor", "moderate", "severe"], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  evidence: {
    imageUrl: { type: String },
    clipUrl: { type: String } // short video clip in S3/Cloudinary
  },
  status: {
    type: String,
    enum: ["needs_review", "confirmed", "false_positive", "resolved"],
    default: "needs_review"
  },
  nearestHospital: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  nearestPolice: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewNote: { type: String },
  createdAt: { type: Date, default: Date.now }
});

AccidentSchema.index({ detectedAt: -1 });
AccidentSchema.index({ "location.lat": 1, "location.lng": 1 });
AccidentSchema.index({ status: 1, severity: 1 });
```

### 2.4 `Location` (Hospitals & Police Stations)
```javascript
const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["hospital", "police"], required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  contactNumber: { type: String, required: true },
  address: { type: String }
});

LocationSchema.index({ type: 1 });
```

### 2.5 `EmergencyContact`
```javascript
const EmergencyContactSchema = new mongoose.Schema({
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  relation: { type: String }, // e.g., "Family", "Fleet Manager"
  vehiclePlate: { type: String }, // optional, for future license-plate matching
  createdAt: { type: Date, default: Date.now }
});
```

### 2.6 `AlertLog` *(new)*
```javascript
const AlertLogSchema = new mongoose.Schema({
  accident: { type: mongoose.Schema.Types.ObjectId, ref: "Accident", required: true },
  channel: { type: String, enum: ["sms", "email", "websocket", "voice_call"], required: true },
  recipient: { type: String, required: true }, // phone/email/socket-room id
  status: { type: String, enum: ["queued", "sent", "delivered", "failed"], default: "queued" },
  providerResponse: { type: mongoose.Schema.Types.Mixed }, // raw Twilio/SMTP response for debugging
  attempt: { type: Number, default: 1 },
  sentAt: { type: Date, default: Date.now }
});

AlertLogSchema.index({ accident: 1 });
```

### 2.7 `Feedback` *(new — retraining pipeline)*
```javascript
const FeedbackSchema = new mongoose.Schema({
  accident: { type: mongoose.Schema.Types.ObjectId, ref: "Accident", required: true },
  labeledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, enum: ["true_positive", "false_positive"], required: true },
  notes: { type: String },
  usedInTrainingBatch: { type: String, default: null }, // batch ID once consumed for retraining
  createdAt: { type: Date, default: Date.now }
});
```

### 2.8 `AuditLog` *(new)*
```javascript
const AuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // e.g., "ACCIDENT_CONFIRMED", "USER_ROLE_CHANGED"
  targetType: { type: String }, // e.g., "Accident", "User", "Camera"
  targetId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });
```

---

## 3. Entity Relationship Summary

```
User ---(assignedZones)---> Camera
Camera ---(1:N)---> Accident
Accident ---(N:1)---> Location (nearestHospital)
Accident ---(N:1)---> Location (nearestPolice)
Accident ---(1:N)---> AlertLog
Accident ---(1:N)---> Feedback
User ---(1:N)---> AuditLog (as actor)
EmergencyContact ---(N:1, optional)---> User (linkedUser)
```

---

## 4. Indexing Strategy

- `Accident.detectedAt` (descending) — fast recent-accidents queries for dashboard.
- `Accident.location` (2dsphere recommended if using GeoJSON instead of flat lat/lng) — enables `$geoNear` queries for "nearest hospital/police" and map clustering.
- `Accident.status + severity` (compound) — fast filtering for reports page.
- `AlertLog.accident` — fast lookup of all alert attempts for a given incident.
- `AuditLog.createdAt` (descending) — chronological audit browsing.

> **Recommendation:** Convert `location`/`coordinates` fields to GeoJSON `Point` type (`{ type: "Point", coordinates: [lng, lat] }`) with a `2dsphere` index to unlock native MongoDB geospatial queries (`$near`, `$geoWithin`) for the "nearest facility" and map-clustering features.

---

## 5. Data Retention & Lifecycle

- `Accident.evidence` media: lifecycle rule to move to cold storage after 90 days, delete after regulatory retention period (configurable per deployment region).
- `AlertLog` and `AuditLog`: retained indefinitely (or per compliance policy) as they are small, append-only, and valuable for audits/disputes.
- `Feedback`: retained until consumed by a retraining batch, then archived with `usedInTrainingBatch` set for traceability.
