# RouteX — Project Architecture

## 1. Architecture goals
Keep the MVP easy to run, safe to extend, and focused on a working reporting flow. Separate the web client, API, and database. Keep optional services such as Gemini outside the critical path.

## 2. High-level architecture

```text
Current MVP
Browser / Mobile Web
  React + Vite + Tailwind CSS
  React Router + Axios
  React Leaflet + configured map tiles
            | HTTPS / JSON / multipart uploads
            v
Django REST Framework API
  Authentication + permissions
  Hazard reporting + confirmations + flags
  Moderation + audit history
  Optional Google Gemini adapter (server-side only)
            | ORM
            v
PostgreSQL + configured media storage

Future mobile client
React Native + Expo  -----> same versioned Django REST API
```

The browser can request map tiles from a configured provider. Follow the selected provider's attribution, caching, and usage policy. Do not assume public OpenStreetMap tile servers are an unlimited production tile service.

## 3. Suggested repository structure

```text
routex/
├── PLAN.md
├── BRAND.md
├── VOICE.md
├── BACKLOG.md
├── SESSIONS.md
├── ARCHITECTURE.md
├── STYLE.md
├── IDE_SETUP_PROMPT.md
├── README.md
├── .gitignore
├── .env.example
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── app/router.jsx
│       ├── pages/
│       ├── components/layout/
│       ├── components/map/
│       ├── components/hazards/
│       ├── components/forms/
│       ├── components/feedback/
│       ├── features/auth/
│       ├── features/hazards/
│       ├── features/moderation/
│       ├── services/apiClient.js
│       ├── hooks/
│       └── index.css
└── backend/
    ├── manage.py
    ├── requirements.txt
    ├── config/
    │   ├── settings.py
    │   ├── urls.py
    │   └── asgi.py
    └── apps/
        ├── accounts/
        ├── hazards/
        ├── moderation/
        └── common/
```

Adapt this layout to the real repository. Do not generate duplicate folders or rewrite a working layout just to match this example exactly. A separate `mobile/` directory should be introduced only in the future React Native phase.

## 4. Main domain entities
- **User/Profile:** identity, display name, and role. Enforce roles on the server.
- **HazardReport:** category, description, coordinates, created/updated timestamps, status, reporter, and optional location label.
- **HazardPhoto/Evidence:** file reference and upload metadata associated with a report.
- **Confirmation:** user, report, confirmation type, and timestamp; use constraints to prevent duplicate votes where appropriate.
- **Flag:** report, reporter, reason, status, and timestamps.
- **ModerationAction:** moderator, report, action, reason, timestamp, and audit details.

Suggested categories: `flooding`, `pothole`, `blocked_road`, `fallen_tree`, `other`. Suggested statuses: `reported`, `under_review`, `community_confirmed`, `resolved`, `rejected`. Define status transitions and the actual confirmation threshold before describing a report as community-confirmed in production.

## 5. API design
Use a versioned prefix such as `/api/v1/`.

Suggested endpoints:
- `GET /hazards/` — paginated list with category, status, time, and viewport filters.
- `GET /hazards/{id}/` — report details.
- `POST /hazards/` — create a report; support multipart form data for a photo.
- `POST /hazards/{id}/confirm/` — confirm current presence.
- `POST /hazards/{id}/flags/` — flag a report for review.
- `GET /me/reports/` — current user's reports.
- `POST /auth/...` — selected authentication endpoints.
- `GET /moderation/queue/` — moderator-only queue.
- `POST /moderation/{id}/action/` — moderator-only action with reason and audit event.
- `POST /ai/suggest/` — optional Gemini-powered suggestion, if/when enabled.

Use DRF serializers, pagination, permission classes, throttling where appropriate, and consistent error responses. Never expose stack traces or secret values to clients.

## 6. Map behaviour
- Request reports for the current visible map bounds; debounce viewport changes and ignore stale responses.
- Add marker clustering if the amount of data makes it useful.
- Use distinctive category icons and text, not colour alone.
- Details should show timestamp, freshness, status, and confirmation context.
- If geolocation is denied or unavailable, let the user set a pin manually.
- Mark seeded data visibly as demo data across map, cards, and detail views.
- Preserve required tile attribution and comply with the provider's usage policy.

## 7. Security and privacy
- Keep Django secret keys, database credentials, storage credentials, and Gemini API keys in backend environment variables or a suitable secret manager.
- Never expose secret credentials in frontend bundles, `VITE_*` variables, Git, or logs.
- Restrict CORS to known origins in production and configure CSRF/secure cookies as required by the chosen auth design.
- Validate coordinates, text sizes, categories, file types, file sizes, and permissions on the server.
- Protect moderation actions with role checks and audit history.
- Apply sensible throttling to reporting, confirmation, flagging, and AI endpoints.
- Request location only when needed. Do not add background tracking to the MVP.
- Define access and retention rules for photos and reporter data before public launch.

## 8. Future phase: Google Gemini AI
- Call Google Gemini from the Django backend through a small adapter/service module.
- Gate it with an environment setting such as `GEMINI_AI_ENABLED`; core app behaviour must continue when disabled.
- Possible uses: suggested hazard category, a concise neutral summary, and a hint that a new report may duplicate an existing report.
- Validate the response against allowed categories and output length limits. Treat model output as untrusted.
- Require users to review suggestions before submission. Moderators and documented business rules control status changes.
- Never let the model alone label a hazard true, verified, resolved, or official.
- Handle missing key, provider timeout, rate/quota limits, malformed output, and unavailable service gracefully.
- Minimise personal information sent to the model. Document data handling, user disclosure, limits, and quota/cost assumptions.

## 9. Future phase: React Native + Expo
- Create a separate mobile client only after validating the responsive web MVP and identifying a native-specific need.
- Reuse the same versioned Django API, authentication rules, response contracts, and domain logic. Do not copy backend business rules into the app as the source of truth.
- Reuse brand tokens and terminology, but create native UI components rather than trying to reuse web DOM/Tailwind components directly.
- Evaluate a React Native map library, camera/photo capture, foreground location, push notifications, and offline draft handling.
- Request each device permission in context, explain its purpose, and handle denial gracefully. Do not introduce background location tracking without a separate justified requirement.
- Document Android setup first if that is the pilot priority, then assess iOS requirements. Verify both on real devices.

## 10. Operations and environments
- Provide `.env.example` placeholders only, never real credentials.
- Use PostgreSQL through environment-based settings and document local development setup.
- Include migrations, useful test fixtures, and a deliberate demo-data command if needed.
- Configure production debug mode, allowed hosts, HTTPS, secure cookies, static/media storage, logging, backups, CORS, and CSRF explicitly.
- Document frontend and backend commands separately and record tests actually executed.
