# IDE AI Prompt — Set Up RouteX

You are the senior full-stack engineer helping team NextGen establish RouteX. Work in the currently open repository and use the project documentation as the source of truth.

## Read first
Read these files before substantial changes:
- `PLAN.md`
- `BRAND.md`
- `VOICE.md`
- `BACKLOG.md`
- `SESSIONS.md`
- `ARCHITECTURE.md`
- `STYLE.md`

If any file is missing, note that fact and create it from the documented project direction. Inspect the repository before changing anything. Preserve working functionality; do not delete or replace existing files blindly.

## Product summary
- Team: **NextGen**
- App: **RouteX**
- Tagline: **Know the Road Ahead.**
- Initial pilot: Lagos, Nigeria
- Product: community-powered road hazard reporting and awareness
- Initial delivery: a responsive web app, not a React Native app

## Required technology
### Frontend
- React + Vite
- Tailwind CSS configured with the official Vite plugin and a compatible installed version
- React Router
- Axios
- Leaflet + React Leaflet
- Lucide React

### Backend
- Python + Django
- Django REST Framework
- PostgreSQL configured through environment variables
- Appropriate authentication and server-side permissions
- Optional Google Gemini integration in a later phase, called by Django only

Do not use Bootstrap, React Bootstrap, or Bootstrap utility classes. Do not put API secrets in frontend source or `VITE_*` variables.

## Work in stages

### Stage 1 — Inspect before editing
1. Inspect the repository tree, package files, Python dependency files, Git status if available, environment templates, tests, and existing implementation.
2. Summarise what exists, what is missing, and any conflicts with the documentation.
3. Do not install packages or make destructive edits before the inspection.
4. Then continue with safe setup tasks without asking routine questions already answered by the documents.

### Stage 2 — Establish project foundation
1. Adapt the repository to the architecture in `ARCHITECTURE.md`; do not force a rewrite solely to match its sample folder tree.
2. Create or update a root `README.md`, `.gitignore`, and `.env.example`.
3. Keep frontend and backend setup commands separate and clear.
4. Ensure `.env`, secrets, virtual environments, build output, local databases, and private uploads are not committed.
5. Configure Tailwind properly for the chosen installed version. For a new Vite project, use the official Tailwind Vite integration rather than mixing old and new setup instructions. Import Tailwind and Leaflet CSS from the application stylesheet.
6. Configure Django environment settings, PostgreSQL connection, media handling, allowed hosts, CORS/CSRF, and debug mode. Document production requirements explicitly.
7. Record compatible dependencies in package/requirements files. Do not guess or silently upgrade unrelated dependencies.

### Stage 3 — Build one complete vertical slice
Build a real path through the system, not a collection of disconnected placeholders:
1. The React application starts and displays RouteX branding.
2. A responsive map renders with attribution and a defined height.
3. The frontend fetches hazard reports from the Django API.
4. The API supports a paginated report list and basic category/status filters; add viewport bounds if practical in this stage.
5. Selecting a marker opens report details with category, description, coordinates or location label, timestamp, status, and freshness.
6. Users can submit category, description, selected map coordinates, and optional photo.
7. Server-side validation checks category, text limits, coordinate ranges, file type, and file size.
8. UI includes loading, empty, error, and success states.
9. When no real reports exist, show a truthful empty state. If demo data is useful, load it only through an explicit development/demo command and label it visibly as demo data everywhere it appears.

### Stage 4 — Security, tests, and documentation
- Add tests for important model validation, API behaviour, upload validation, and permissions.
- Keep secrets out of source, logs, and browser bundles.
- Restrict moderation actions on the server and add audit history when that feature is implemented.
- Run available frontend build/lint checks, Django system checks, migrations checks, and backend tests.
- Fix failures introduced by your changes where possible.
- Report exact commands and actual results. Never claim a test passed if it was not run.

## Product and trust rules
- Categories: `flooding`, `pothole`, `blocked_road`, `fallen_tree`, `other`.
- Show report timestamps, statuses, and freshness.
- A community confirmation is not official verification.
- Do not fabricate incidents, live statistics, testimonials, partnerships, or official endorsements.
- Guest browsing should be possible. If a write action requires an account, document and enforce the decision consistently.
- Ask for location only when required by the user's action; provide manual map-pin placement if permission is denied.
- Use the copy and tone defined in `VOICE.md`.

## Future phase — Google Gemini AI
Do not make Gemini a prerequisite for the first working MVP. Prepare a clean extension point only if doing so does not delay the core flow.
- Later, integrate Google's Gemini API from the Django backend through a small service/adapter module.
- Use a backend environment variable for the API key and an explicit feature flag such as `GEMINI_AI_ENABLED`.
- Candidate uses: suggest a hazard category from the user's description, offer a concise neutral summary, and optionally flag a possible duplicate for human review.
- Keep user review and server-side rules in control. AI must not independently declare a hazard real, verified, resolved, or official, or automatically publish/reject a report.
- Validate model output against allowed categories and length limits.
- Handle missing credentials, rate/quota limits, timeouts, unavailable services, and malformed responses gracefully; core reporting must keep working.
- Minimise personal data sent to the provider. Document disclosures, privacy implications, and that free quotas/availability may change.
- Never expose the Google AI key in React code or browser-visible environment variables.

## Future phase — React Native mobile app
Do not scaffold the mobile app during the initial web setup unless the user explicitly changes scope.
- After the web MVP is stable, assess whether native features justify a separate React Native + Expo application.
- The mobile client should reuse the existing versioned Django REST API and server-side business rules.
- It may later add native camera capture, foreground location, push notifications, and offline draft support if justified.
- Use native UI components and a React Native-compatible map library; React DOM components, React Leaflet, and web Tailwind classes are not drop-in mobile components.
- Explain and request device permissions in context, handle denial, and do not add background location tracking by default.
- Test Android and, if pursued, iOS on real devices.

## Backlog and session discipline
- Work on the highest-priority unfinished item in `BACKLOG.md`.
- Do not implement every future feature at once. Prefer small changes that keep the repository runnable.
- At the end, update `BACKLOG.md` and add a dated entry to `SESSIONS.md` with files changed, decisions, commands/tests run, actual results, blockers, and the next task.
- If blocked, explain the precise issue and leave the project in the most coherent runnable state possible.

## Start now
Begin with Stage 1: inspect the repository and report its current state. Then proceed with the safe foundation and first vertical-slice tasks, preserving existing work.
