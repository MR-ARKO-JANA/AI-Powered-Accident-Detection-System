# UI/UX Design Document
## AI-Powered Accident Detection System

---

## 1. Design Principles

1. **Clarity under pressure** — this is an emergency-response tool; critical info (location, severity, time) must be visible within 2 seconds of landing on any screen.
2. **Status-first color coding** — severity and system status use consistent color semantics everywhere (see design system below).
3. **Minimal clicks to action** — from alert to "confirm/dispatch" should take no more than 2 clicks.
4. **Real-time by default** — no manual refresh; live data pushes to the UI automatically.
5. **Accessible & responsive** — usable on desktop (control room) and tablet/mobile (field responders).

---

## 2. Information Architecture / Sitemap

```
/ (Login)
/dashboard                     - Overview: active alerts, KPIs, recent accidents
/live-feed                      - Live camera grid + detection overlay
/accidents                      - Accident reports list (filterable)
/accidents/:id                  - Accident detail (map, evidence, alert status, feedback)
/map                             - City-wide map view (accidents, hospitals, police)
/analytics                      - Heatmaps, trend charts, response-time KPIs
/admin/users                     - User & role management
/admin/cameras                   - Camera/zone management
/admin/emergency-contacts        - Emergency contact management
/admin/audit-logs                - Audit log viewer
/settings                        - Profile, notification preferences, theme
```

---

## 3. Design System

### Colors (semantic)
| Purpose | Color | Usage |
|---|---|---|
| Critical / Severe | `#DC2626` (red-600) | Severe accident badges, urgent alert banners |
| Warning / Moderate | `#F59E0B` (amber-500) | Moderate severity, "needs review" states |
| Info / Minor | `#FBBF24` (amber-300) → `#3B82F6` (blue-500) for informational | Minor severity, general notices |
| Success / Resolved | `#16A34A` (green-600) | Confirmed-resolved, alert delivered |
| Neutral background | `#0F172A` (dark slate) / `#F8FAFC` (light) | Base backgrounds for dark/light mode |
| Accent / Brand | `#2563EB` (blue-600) | Primary buttons, links, active nav state |

### Typography
- **Primary font:** Inter or system-ui sans-serif — highly legible at small sizes for data-dense screens.
- **Headings:** Semi-bold, larger scale for scanability in a control-room context.
- **Monospace:** Used for timestamps, coordinates, and IDs (e.g., JetBrains Mono).

### Components (reusable)
- `Navbar` — top nav with live connection-status indicator (green dot = WebSocket connected).
- `AccidentCard` — compact card: severity badge, thumbnail, location, time-ago, "View" CTA.
- `SeverityBadge` — colored pill (Minor/Moderate/Severe).
- `AlertBanner` — full-width, dismissible, top-of-screen banner for new live incidents.
- `CameraFeed` — video tile with bounding-box/heatmap overlay when accident detected.
- `MapPanel` — embedded map with accident, hospital, police markers (clustered).
- `StatCard` — KPI tile for dashboard/analytics (e.g., "Avg. Alert Latency: 6.2s").
- `Toast/NotificationPop` *(new)* — top-right transient toast for background events (non-blocking).

---

## 4. Page-by-Page Design

### 4.1 Login Page
- Centered card, brand logo, email/username + password fields.
- "Remember me" and role-aware redirect after login (Admin → Dashboard, Responder → Live Feed).

### 4.2 Dashboard (Home)
- Top row: `StatCard`s — Active Incidents, Today's Accidents, Avg. Alert Latency, System Uptime.
- Middle: Live `AlertBanner` area — most recent unconfirmed incidents, pulsing indicator for "new."
- Bottom: Recent `AccidentCard` grid (last 10), each clickable to detail view.

### 4.3 Live Feed
- Grid of `CameraFeed` tiles (2x2 / 3x3 responsive grid depending on camera count).
- Each tile shows camera name/zone, live status dot, and flashes red border on detection.
- Click a tile to expand to full-screen single view.

### 4.4 Accident Reports (List)
- Filter bar: date range, severity, zone/camera, status (Needs Review / Confirmed / False Positive).
- Table/card toggle view. Each row: thumbnail, time, location, severity badge, alert status icon.

### 4.5 Accident Detail
- Left: evidence viewer (image/clip playback).
- Right: metadata panel — timestamp, GPS coordinates + mini-map, severity, camera source.
- Alert Status section: delivery ticks for SMS/Email/WebSocket (sent/delivered/failed) — *(new)*.
- Action bar: "Confirm Incident," "Mark False Positive," "Escalate to Police/Hospital," "Add Note."

### 4.6 Map View
- Full-screen map: accident markers (color = severity), hospital markers (blue cross icon), police markers (badge icon).
- Cluster markers when zoomed out; click marker for a summary popover.
- Toggle layers: Accidents / Hospitals / Police / Heatmap *(new)*.

### 4.7 Analytics *(new)*
- Line chart: accidents over time (daily/weekly/monthly toggle).
- Heatmap: accident density by zone/time-of-day.
- Bar chart: average alert latency and false-positive rate trend.
- Exportable report (CSV/PDF) for city authorities.

### 4.8 Admin Panel
- **Users & Roles** — table with role dropdown (Super Admin / Zone Admin / Responder / Viewer), invite new user flow.
- **Cameras/Zones** — add/edit camera with RTSP URL/zone assignment, live status indicator.
- **Emergency Contacts** — CRUD list linked to users/vehicles/locations.
- **Audit Logs** — searchable, timestamped table of all sensitive actions.

### 4.9 Settings
- Profile info, password change, notification channel preferences (SMS/Email/Push), theme toggle (Light/Dark) *(new)*, language preference *(new)*.

---

## 5. Interaction & Feedback Patterns

- **New accident detected:** red `AlertBanner` slides in from top + toast + subtle audio chime (togglable) — designed to grab attention without being alarming.
- **Alert dispatched successfully:** green checkmark animation next to each channel (SMS/Email) in real time as delivery webhooks confirm.
- **Loading states:** skeleton loaders for cards/tables (never a blank white screen — this is a monitoring tool, blank screens read as "system down").
- **Error states:** if the AI service or WebSocket connection drops, a persistent (non-dismissible) banner reads "Live detection paused — reconnecting…" with a retry indicator.

---

## 6. Accessibility & Responsiveness

- Color is never the only signal — severity badges always paired with text label and icon (colorblind-safe).
- Minimum contrast ratio 4.5:1 for all text; dark mode uses true dark slate rather than pure black to reduce eye strain in control-room night shifts.
- Fully responsive: 3-column grid → 1-column stack below 768px; Live Feed grid becomes swipeable carousel on mobile.
- Keyboard navigable; all interactive elements have visible focus states.

---

## 7. Wireframe Sketch (Dashboard — text representation)

```
--------------------------------------------------------------
| Logo   Dashboard  Live Feed  Reports  Map  Analytics  Admin | [🟢 Live] [👤]
--------------------------------------------------------------
| [Active Incidents: 2] [Today: 14] [Avg Latency: 6.2s] [Uptime: 99.7%] |
--------------------------------------------------------------
| 🔴 NEW: Severe accident detected — Zone 3, Camera 7   [View] |
--------------------------------------------------------------
| Recent Accidents                                             |
| [Card] [Card] [Card] [Card]                                  |
| [Card] [Card] [Card] [Card]                                  |
--------------------------------------------------------------
```
