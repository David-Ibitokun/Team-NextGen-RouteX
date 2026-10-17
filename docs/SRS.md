# RouteX — Software Requirements Specification (SRS)

**Document status:** Baseline specification for implementation  
**Product:** RouteX  
**Team:** NextGen  
**Tagline:** Know the Road Ahead.  
**Initial pilot area:** Lagos, Nigeria  
**Version:** 1.0  
**Last updated:** 17 October 2026

> This document defines what RouteX should do, which requirements belong in the first working release, and which belong in later releases. It is the product-level requirements source of truth. If implementation details change, update this document and the relevant architecture/backlog documents rather than silently dropping requirements.

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification describes the functional, non-functional, data, integration, security, usability, and operational requirements for RouteX. It is intended for the product team, developers, IDE coding agents, testers, designers, and future maintainers.

The objective is to prevent important functionality from being forgotten while keeping the first release achievable. Requirements are assigned a priority and release phase so that a coding agent does not try to build every future capability before the core workflow works.

### 1.2 Product scope

RouteX is a responsive, community-powered road-hazard reporting and awareness web application. It allows people to browse available hazard reports on a map, submit reports with a location and optional photograph, review report details, and contribute confirmations or flags. Authorised moderators can review potentially inaccurate, duplicate, abusive, or stale content.

The initial pilot focuses on Lagos, Nigeria. The application must be designed so that additional cities can be supported later without changing the fundamental report model.

RouteX provides information to help people make better-informed decisions. It does not guarantee that a road is safe, does not replace official traffic or emergency information, and does not independently certify that a community report is true.

### 1.3 Product goals

1. Make it easy to discover and report road hazards.
2. Show where a report was made, when it was made, its current status, and how recently it was confirmed.
3. Keep community reporting useful through confirmations, flags, moderation, and freshness rules.
4. Make the service usable on mobile browsers without requiring an app installation.
5. Establish a stable Django API that can later support Google Gemini assistance and a React Native mobile client.
6. Use a maintainable and affordable stack with free/open-source tools where appropriate.

### 1.4 Success criteria

The MVP is considered functionally successful when a user can:

- Open the public landing page and understand what RouteX does.
- Browse the interactive Lagos map and see hazard reports returned by the backend.
- Filter reports and inspect a marker's details.
- Register, sign in, restore a session after refreshing the browser, and sign out.
- Create a hazard report with a manually selected location and optional photograph.
- See the saved report on the map and in their own report history.
- Confirm a report or flag it according to the application's permissions.
- See clear loading, empty, error, stale-report, and success states.

An authorised moderator must also be able to review a report and record a moderation action. The application must not present seeded demonstration reports as real community reports.

### 1.5 Requirement priority and release labels

- **P0 — MVP essential:** Required before the first working MVP can be accepted.
- **P1 — Early follow-up:** Important for a reliable public pilot; implement after the P0 vertical slice unless already straightforward.
- **P2 — Later release:** Planned capability; do not block the first MVP unless explicitly promoted.
- **P3 — Research/optional:** Requires a separate feasibility, cost, privacy, or product decision.

Release phases:

- **Phase 1:** Responsive web MVP.
- **Phase 1.1:** Pilot hardening and operational readiness.
- **Phase 2:** Optional Google Gemini AI-assisted features.
- **Phase 3:** React Native mobile client and mobile-specific features.
- **Phase 4:** Expanded geographic coverage and advanced mapping/notification capabilities.

## 2. Definitions and abbreviations

| Term | Meaning |
|---|---|
| Hazard report | A user-submitted record describing a road hazard and its location. |
| Community confirmation | A qualifying user action indicating the reported hazard is still present. It is not official verification. |
| Freshness | An indication of how recently a report was created or validly confirmed. |
| Stale report | A report that has not received a qualifying recent update within the configured freshness period. It may still be true. |
| Moderator | An authorised person who reviews reports and performs moderation actions. |
| Demo data | Clearly labelled sample data used for development or demonstrations; not a claim about current real-world conditions. |
| API | Application Programming Interface. |
| DRF | Django REST Framework. |
| CSRF | Cross-Site Request Forgery. |
| CORS | Cross-Origin Resource Sharing. |
| PWA | Progressive Web App. |
| OSM | OpenStreetMap. |
| Geocoding | Converting a place/address search into geographic coordinates, or coordinates into a place label. |
| Viewport | The geographic area currently visible inside the map. |

## 3. Overall description

### 3.1 User classes

#### 3.1.1 Anonymous visitor

Can view the landing page, browse public reports, use map filters, view report details, and navigate to registration or sign-in. Under the initial policy, an anonymous visitor cannot create reports, confirm reports, or submit flags.

#### 3.1.2 Registered user

Can perform anonymous-visitor actions and, while authenticated, create hazard reports, upload optional photographs, confirm that a report remains present, flag reports, and view their own report history. A user may edit or withdraw only those records that the product rules explicitly permit and only through authorised endpoints.

#### 3.1.3 Moderator

Can use a protected moderation queue, inspect reports and flags, review potential duplicates, change report status through allowed transitions, and record a reason for each moderation decision. Moderator access must be enforced on the server.

#### 3.1.4 Administrator

Can manage authorised staff roles, application configuration, and operational settings. Admin powers should be limited to trusted operators and must not be exposed through public registration.

#### 3.1.5 Future mobile user

In Phase 3, a React Native app will use the same domain API for browsing and reporting. It may use a separate mobile-appropriate authentication mechanism, but it must not duplicate the hazard business logic in a second backend.

### 3.2 Operating environment

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Leaflet, React Leaflet, and Lucide React.  
**Backend:** Python, Django, Django REST Framework, and PostgreSQL.  
**Mapping:** Leaflet with OpenStreetMap-compatible tile data and attribution.  
**Deployment:** Separate frontend and backend deployments may be used; all environment-specific origins and secrets must be configured explicitly.

The web application must support current mainstream desktop and mobile browsers. The responsive web app is the initial delivery target. Native iOS/Android binaries are not required for Phase 1.

### 3.3 Architectural constraints

1. The React client must not connect directly to PostgreSQL.
2. Django must validate all data and enforce permissions; frontend validation is for usability only.
3. Passwords must be handled by Django's authentication framework. The application must not implement custom password hashing.
4. AI provider keys and other secrets must stay on the backend and must never be placed in browser-visible `VITE_*` variables.
5. OpenStreetMap tile usage must comply with the selected tile provider's terms, attribution, caching rules, and capacity limits.
6. The public OpenStreetMap standard tile service must not be treated as an unlimited production map API.
7. Core browsing and reporting must work when AI credentials are absent or AI services are unavailable.
8. No sample hazard may be presented as a real, current community report.

### 3.4 Assumptions and dependencies

- Internet connectivity is available for map tiles and online API requests.
- A PostgreSQL instance and media-storage approach will be configured for the deployment environment.
- Users may deny browser location permission; manual map selection must remain available.
- Real-time road-condition data from government or transport authorities is not assumed to be available.
- A Google Gemini integration is optional and will be implemented only in a later phase.
- A suitable tile, geocoding, routing, email, or push-notification provider may require separate policy review, configuration, or billing.

## 4. Scope boundaries

### 4.1 Included in Phase 1 MVP

- Public, responsive landing page.
- Functional interactive map centred initially on Lagos.
- OpenStreetMap-compatible map tiles with visible attribution.
- Hazard markers based on backend records.
- Map viewport filtering and category/status filters.
- Report detail panel or popup with report timestamp and freshness.
- Registration, login, logout, current-user/session restoration, and protected actions.
- Hazard report creation with category, description, coordinates, and optional photograph.
- Server-side validation using DRF serializers.
- User report history.
- Report confirmations and flags with server-side uniqueness/abuse rules.
- Minimal moderator review queue and audit log.
- Responsive empty, loading, error, and success states.
- Clear demo-data separation.
- Tests and setup documentation.

### 4.2 Phase 1.1 — Pilot hardening

- Password-reset flow with configured email delivery.
- Email verification if required by the deployment's risk model.
- More extensive rate limiting, spam detection, and abuse handling.
- Production media storage, backups, logging, and monitoring.
- Accessibility and cross-browser testing.
- Privacy notice, terms of use, and report-retention policy.
- Better duplicate report detection using category, distance, and time.
- Operational configuration for confirmation threshold, stale period, maximum upload size, and map provider.

### 4.3 Phase 2 — Google Gemini AI assistance

- Optional category suggestions from text and, only after safety/privacy review, report photographs.
- Neutral summaries of user-submitted descriptions.
- Suggestions for potentially duplicate reports.
- Moderator prioritisation aids, clearly labelled as suggestions.
- AI usage limits, timeouts, error handling, logging, and cost/quota controls.

AI must not certify that a road hazard exists, independently mark a report official/verified, or automatically make consequential moderation decisions without an explicitly designed and tested human-review policy.

### 4.4 Phase 3 — React Native mobile client

- React Native with Expo.
- Shared Django API and shared domain rules.
- Native camera integration and photo upload.
- Improved GPS-based location selection.
- Mobile-appropriate authentication.
- Push notifications after opt-in and notification rules are defined.
- Saved report drafts for unreliable connectivity.
- Nearby-hazard alerts, subject to location permission and privacy requirements.
- Mobile accessibility, performance, release signing, and app-store compliance.

### 4.5 Phase 4 — Potential future capabilities

These capabilities are not promised by the MVP and require product and technical review:

- More Nigerian cities and configurable regions.
- Address and place search using a suitable geocoding provider.
- Routing integration to show route proximity to reported hazards; routing must not claim to guarantee safety.
- Official-source integrations where reliable APIs and permission exist.
- Following locations or corridors and optional notifications.
- PWA installation and carefully scoped caching.
- Advanced analytics based on privacy-conscious, trustworthy measurements.
- Spatial database extensions such as PostGIS if data volume and geospatial query complexity justify the change.

### 4.6 Explicit non-goals

- Guaranteed-safe routing or navigation.
- Real-time traffic prediction without a trusted data source.
- Official road closure or emergency dispatch functionality.
- Background tracking of a user's location.
- Automatically treating AI output or a single community confirmation as proof.
- Public leaderboard or reporter ranking during the MVP.
- Payment, subscription, advertisements, or marketplace functionality.
- Offline bulk downloads of public OSM tiles.
- Fabricated user counts, hazard counts, testimonials, partners, or impact statistics.

## 5. Functional requirements

### 5.1 Public landing page

- **FR-LAND-001 (P0):** The application shall provide a public landing page at `/`.
- **FR-LAND-002 (P0):** The page shall communicate what RouteX does, who it serves, and that its reports are community-submitted.
- **FR-LAND-003 (P0):** The page shall provide working links to Explore map, Report a hazard, Sign in, and Register as applicable.
- **FR-LAND-004 (P0):** The landing page shall explain the basic process: explore reports, submit a report, and keep information useful through updates.
- **FR-LAND-005 (P0):** The landing page shall use the RouteX design tokens and follow `BRAND.md`, `VOICE.md`, and `STYLE.md`.
- **FR-LAND-006 (P0):** All landing-page copy and capability claims shall reflect implemented behaviour. Unimplemented functionality must not be advertised as available.
- **FR-LAND-007 (P0):** The landing page shall show a helpful empty or unavailable state if its optional map preview or API call fails.
- **FR-LAND-008 (P0):** It shall not display fake live statistics, fake testimonials, fabricated partners, or invented road hazards.
- **FR-LAND-009 (P0):** The page shall be responsive and keyboard accessible.
- **FR-LAND-010 (P1):** The page should include an FAQ covering reports, freshness, photos, location permission, and the meaning of community confirmation.
- **FR-LAND-011 (P1):** Add privacy, terms, and contact links only when genuine pages and real contact details exist.

### 5.2 Navigation and application layout

- **FR-NAV-001 (P0):** Provide usable navigation to the landing page, map, report creation, authentication, and report history when signed in.
- **FR-NAV-002 (P0):** The navigation shall adapt to mobile and desktop layouts without hiding core functionality.
- **FR-NAV-003 (P0):** The interface shall display authentication-aware actions without treating client-side UI state as an authorisation boundary.
- **FR-NAV-004 (P0):** Invalid or unknown routes shall show a useful not-found page or redirect.
- **FR-NAV-005 (P1):** Preserve intended destination across sign-in when practical; after sign-in, return the user to the requested protected workflow.

### 5.3 Authentication and account management

- **FR-AUTH-001 (P0):** The system shall allow users to register with the minimum required account fields.
- **FR-AUTH-002 (P0):** The registration serializer shall validate required fields, email uniqueness, password strength using Django validators, and password confirmation if a confirmation field is collected.
- **FR-AUTH-003 (P0):** Passwords shall be hashed and managed by Django's authentication facilities.
- **FR-AUTH-004 (P0):** Public registration shall never allow a requester to assign themselves a moderator or administrator role.
- **FR-AUTH-005 (P0):** The system shall support login with appropriate generic error messages for invalid credentials.
- **FR-AUTH-006 (P0):** The system shall support logout through a server-side state-changing request that invalidates the session.
- **FR-AUTH-007 (P0):** The frontend shall be able to retrieve the current user's safe profile from a `/auth/me/`-equivalent endpoint.
- **FR-AUTH-008 (P0):** A page refresh shall restore authentication state by querying the backend; it shall not rely on access tokens stored in `localStorage`.
- **FR-AUTH-009 (P0):** The browser authentication flow shall use a documented session and CSRF strategy. Login and other unsafe requests shall be protected against CSRF.
- **FR-AUTH-010 (P0):** The Axios client shall send credentials as required and include the CSRF token on unsafe requests.
- **FR-AUTH-011 (P0):** Anonymous users shall be prevented from report creation, confirmation, and flag creation by backend permission checks.
- **FR-AUTH-012 (P0):** The backend shall provide a safe way to distinguish anonymous, regular, moderator, and administrator permissions.
- **FR-AUTH-013 (P1):** Password reset shall use a secure, time-limited process through a configured email provider.
- **FR-AUTH-014 (P1):** Email verification may be required before write access is granted, subject to a documented product decision.
- **FR-AUTH-015 (P1):** Users should be able to update a limited set of profile fields without changing privileged attributes.
- **FR-AUTH-016 (P2):** Add optional social sign-in only if user demand, privacy, provider configuration, and support cost justify it.

**Authentication implementation note:** Django session authentication is the initial browser strategy. If the future React Native app needs a different authentication flow, implement a mobile-appropriate mechanism deliberately without weakening web session/CSRF controls or duplicating business rules.

### 5.4 Map and map navigation

- **FR-MAP-001 (P0):** The map page shall be available at `/map`.
- **FR-MAP-002 (P0):** The map shall open at a configured initial view centred on Lagos, Nigeria.
- **FR-MAP-003 (P0):** The map shall use Leaflet/React Leaflet and a configurable compatible tile URL.
- **FR-MAP-004 (P0):** Visible map attribution shall credit OpenStreetMap contributors and link to the appropriate attribution/copyright information.
- **FR-MAP-005 (P0):** The map shall support pan and zoom and shall have a defined height at all target viewport sizes.
- **FR-MAP-006 (P0):** Hazard markers shall be rendered from API results, not a hard-coded list presented as live data.
- **FR-MAP-007 (P0):** Selecting a marker shall display the report's category, summary/description, timestamp, freshness, and status.
- **FR-MAP-008 (P0):** Marker icons or associated text shall distinguish supported hazard categories; colour alone shall not communicate category or status.
- **FR-MAP-009 (P0):** When the visible map bounds change, the frontend shall fetch reports for the current viewport using a documented API query format.
- **FR-MAP-010 (P0):** Viewport requests shall be debounced and obsolete results cancelled or ignored where possible.
- **FR-MAP-011 (P0):** The map shall show loading, no-results, and failure states.
- **FR-MAP-012 (P0):** The map shall remain usable when browser geolocation permission is denied.
- **FR-MAP-013 (P0):** The map shall offer manual location selection during report creation.
- **FR-MAP-014 (P0):** If demo records are shown, each demo record shall have an unmistakable demo label in relevant marker/details/list UI.
- **FR-MAP-015 (P1):** The map should cluster markers at low zoom levels when marker density makes the map difficult to use.
- **FR-MAP-016 (P1):** Provide a list-based alternative to marker-only browsing for accessibility and users who prefer a list.
- **FR-MAP-017 (P2):** Add location/address search using a geocoding provider after reviewing that provider's policy and usage limits.
- **FR-MAP-018 (P2):** Add routing or route-hazard proximity integration only after choosing a suitable routing provider and defining careful safety wording.

### 5.5 Hazard categories, status, and freshness

- **FR-HAZ-001 (P0):** The initial categories shall be `flooding`, `pothole`, `blocked_road`, `fallen_tree`, and `other`.
- **FR-HAZ-002 (P0):** Category choices and status choices shall be defined centrally in the backend and validated by serializers.
- **FR-HAZ-003 (P0):** Initial report statuses shall include `reported`, `under_review`, `community_confirmed`, `resolved`, and `rejected`, with an explicitly documented transition policy.
- **FR-HAZ-004 (P0):** Clients shall not be allowed to submit arbitrary status values or directly set fields reserved for moderation.
- **FR-HAZ-005 (P0):** Every report shall display its creation time and relevant last-update or last-confirmation time.
- **FR-HAZ-006 (P0):** Freshness shall be calculated from documented timestamps using a configurable threshold. The initial target threshold is 24 hours, subject to configuration.
- **FR-HAZ-007 (P0):** Stale reports shall be described as potentially out of date, not automatically false or resolved.
- **FR-HAZ-008 (P0):** The application shall distinguish user-submitted status, community-confirmation status, and moderator decisions.
- **FR-HAZ-009 (P1):** Category and status labels should be localisable without changing the stored category/status codes.

### 5.6 Hazard report creation and editing

- **FR-REPORT-001 (P0):** An authenticated user shall be able to create a hazard report.
- **FR-REPORT-002 (P0):** A report shall require a supported category, useful description, latitude, and longitude.
- **FR-REPORT-003 (P0):** A report may include an optional photograph.
- **FR-REPORT-004 (P0):** The user shall be able to set the location by selecting the map or using browser geolocation after a user action.
- **FR-REPORT-005 (P0):** If geolocation fails or is denied, manual map selection shall remain available.
- **FR-REPORT-006 (P0):** The form shall display clear validation messages, loading state, success state, and error state.
- **FR-REPORT-007 (P0):** The backend shall validate all submitted fields regardless of frontend validation.
- **FR-REPORT-008 (P0):** The backend shall assign the reporter from the authenticated request and shall not trust a client-provided reporter ID.
- **FR-REPORT-009 (P0):** The backend shall set the initial status and server timestamps; the client cannot set privileged moderation metadata.
- **FR-REPORT-010 (P0):** If submission fails, the frontend should preserve user-entered values when safe to do so.
- **FR-REPORT-011 (P0):** The frontend shall not report success until the server confirms the report was saved.
- **FR-REPORT-012 (P0):** Images shall be validated for permitted type, size, and actual file content as practical; filenames shall not be trusted.
- **FR-REPORT-013 (P0):** The server shall enforce a configurable upload-size limit and return a clear error when it is exceeded.
- **FR-REPORT-014 (P0):** Uploaded files shall be stored using a configured media-storage path/provider, not embedded as large base64 strings in report JSON.
- **FR-REPORT-015 (P1):** Users may edit a limited set of their own reports within a documented window or until moderation begins, if this is approved by the product team.
- **FR-REPORT-016 (P1):** Users may request withdrawal of their own report, while the system retains appropriate audit information and follows retention policy.
- **FR-REPORT-017 (P2):** Save an incomplete report as a draft, especially for future mobile or poor-connectivity workflows.

### 5.7 Report details

- **FR-DETAIL-001 (P0):** A user shall be able to open a report from the map or a report list.
- **FR-DETAIL-002 (P0):** Details shall include category, description, location, timestamp, current status, freshness, and available photo.
- **FR-DETAIL-003 (P0):** Details shall show a community confirmation count or equivalent confirmation summary when implemented.
- **FR-DETAIL-004 (P0):** Reporter identity shall be limited to fields that are safe and necessary to disclose.
- **FR-DETAIL-005 (P0):** Demo reports shall be identified as demo data wherever their details are shown.
- **FR-DETAIL-006 (P1):** Details should present an activity timeline for significant updates and moderation events that are suitable for user visibility.

### 5.8 Search, filters, sorting, and pagination

- **FR-FILTER-001 (P0):** Users shall be able to filter reports by hazard category.
- **FR-FILTER-002 (P0):** Users shall be able to filter reports by permitted statuses.
- **FR-FILTER-003 (P0):** Map results shall be restrictable to the visible bounding box.
- **FR-FILTER-004 (P0):** The API shall use pagination or another documented result limit to avoid returning unbounded collections.
- **FR-FILTER-005 (P0):** The UI shall support clearing filters and explain when no results match.
- **FR-FILTER-006 (P1):** Users should be able to sort reports by recency and, where meaningful, latest confirmation.
- **FR-FILTER-007 (P2):** Add text search or geocoded place search only after evaluating provider requirements and query limits.

### 5.9 Community confirmations

- **FR-CONF-001 (P0):** An authenticated user shall be able to indicate that a report remains present.
- **FR-CONF-002 (P0):** A user shall not be able to repeatedly count as a new confirmation for the same report.
- **FR-CONF-003 (P0):** A database uniqueness constraint or equivalent transaction-safe mechanism shall prevent duplicate confirmations.
- **FR-CONF-004 (P0):** The system shall record who confirmed and when, while protecting personal details in public responses.
- **FR-CONF-005 (P0):** Confirmation counts shall be computed or maintained consistently and must not be easily inflated through repeat requests.
- **FR-CONF-006 (P0):** The initial default threshold for displaying `community_confirmed` shall be three distinct valid user confirmations. Keep this threshold configurable and document whether the report author counts toward it.
- **FR-CONF-007 (P0):** A community-confirmed label shall not be described as official verification or a guarantee of present conditions.
- **FR-CONF-008 (P0):** The API shall reject confirmations for invalid or ineligible report states according to documented transition rules.
- **FR-CONF-009 (P1):** The product team shall review whether a user can revoke a confirmation, and the backend shall implement a consistent rule rather than silently allowing count manipulation.

### 5.10 Flags and abuse reporting

- **FR-FLAG-001 (P0):** An authenticated user shall be able to flag a report for moderator review.
- **FR-FLAG-002 (P0):** Supported reasons shall include incorrect location, possible duplicate, no longer present, misleading/inappropriate content, and other.
- **FR-FLAG-003 (P0):** Flag input shall be validated by a serializer and associated with the authenticated user on the server.
- **FR-FLAG-004 (P0):** The system shall apply duplicate-flag restrictions or throttling to limit abuse.
- **FR-FLAG-005 (P0):** A flag alone shall not automatically delete a report or assert that the report is false.
- **FR-FLAG-006 (P0):** Flags shall be available in the moderator workflow with an actionable status.
- **FR-FLAG-007 (P1):** Add rate limits and pattern-based abuse controls for repeated, coordinated, or automated submissions.

### 5.11 User report history

- **FR-MY-001 (P0):** Authenticated users shall be able to view their own reports at `/my-reports` or the equivalent route.
- **FR-MY-002 (P0):** Report history shall include status, category, creation time, and a link to report details.
- **FR-MY-003 (P0):** The API shall scope this data to the authenticated user and must not accept an arbitrary user ID as proof of ownership.
- **FR-MY-004 (P0):** Empty and error states shall be shown when the user has no reports or data cannot be loaded.
- **FR-MY-005 (P1):** Add pagination or incremental loading if the report history becomes long.

### 5.12 Moderation and administration

- **FR-MOD-001 (P0):** The application shall provide a moderator-only review queue.
- **FR-MOD-002 (P0):** The queue shall show report category, submitted time, location, flags, current status, and available evidence.
- **FR-MOD-003 (P0):** Only authenticated accounts with the appropriate server-side permission may read the moderation queue or perform moderation actions.
- **FR-MOD-004 (P0):** Moderators shall be able to take explicitly supported actions such as mark for review, resolve, reject, or restore a report according to the transition policy.
- **FR-MOD-005 (P0):** Consequential moderation actions shall require a reason and create an audit record.
- **FR-MOD-006 (P0):** The audit record shall capture the moderator, target report, action, reason, and timestamp.
- **FR-MOD-007 (P0):** Regular users shall not be able to change moderation status by manipulating requests, URLs, or submitted JSON.
- **FR-MOD-008 (P0):** Moderators shall be able to inspect related flags and likely duplicates where the relevant functionality exists.
- **FR-MOD-009 (P1):** Add queue filters, assignment, and review priority if moderation volume warrants them.
- **FR-MOD-010 (P1):** Administrative role assignment shall be limited to trusted administrators and performed through a protected process.

### 5.13 Demo and development data

- **FR-DEMO-001 (P0):** Demo reports shall be created only by an explicit development/demo command or process.
- **FR-DEMO-002 (P0):** Demo records shall be distinguishable at the database and UI levels.
- **FR-DEMO-003 (P0):** Production setup shall not silently seed fake live hazards.
- **FR-DEMO-004 (P0):** Demo data shall be removable without deleting real user reports.
- **FR-DEMO-005 (P0):** The landing page and map shall not invent live data or show hard-coded hazard totals as current facts.

### 5.14 Notifications and communication

- **FR-NOTIFY-001 (P1):** The system may provide email notifications for password resets and other essential account events once email delivery is configured.
- **FR-NOTIFY-002 (P2):** Users may opt into email or push updates for reports or areas they follow.
- **FR-NOTIFY-003 (P2):** Notifications shall respect user preferences and must not disclose sensitive report/user details unnecessarily.
- **FR-NOTIFY-004 (P2):** Push notifications for a React Native app shall be implemented only after permission, opt-in, and delivery rules are documented.

### 5.15 Future Google Gemini integration

- **FR-AI-001 (P2):** AI features shall be optional and controlled through backend configuration or a feature flag.
- **FR-AI-002 (P2):** The backend may request a suggested hazard category based on a report description and, if approved, an uploaded image.
- **FR-AI-003 (P2):** The backend may request a concise, neutral summary of user-provided report text.
- **FR-AI-004 (P2):** AI may suggest possible duplicate reports using available report information, but deterministic category/time/distance checks should be considered as a baseline.
- **FR-AI-005 (P2):** AI output shall be validated against allowed category values, maximum lengths, and expected response structure before use.
- **FR-AI-006 (P2):** The Google Gemini API key shall be held only in backend environment configuration or a suitable secret manager.
- **FR-AI-007 (P2):** AI calls shall have timeout, error, quota, retry, and usage-limit controls.
- **FR-AI-008 (P2):** The app shall remain usable when the API key is missing or Gemini is unavailable.
- **FR-AI-009 (P2):** AI suggestions shall be clearly labelled and editable by the user before submission.
- **FR-AI-010 (P2):** AI shall not independently certify hazards, establish official status, or perform irreversible moderation actions.
- **FR-AI-011 (P2):** Do not transmit unnecessary personal or account information to the provider. Document what information is sent and the applicable privacy implications.
- **FR-AI-012 (P2):** Keep AI request logging privacy-conscious and avoid logging secrets or full private user content unless explicitly needed and documented.
- **FR-AI-013 (P2):** Before implementation, confirm the current Gemini API model, pricing/quota, data handling terms, SDK, and supported capabilities from official Google documentation.

### 5.16 Future React Native application

- **FR-MOBILE-001 (P2):** A future React Native + Expo app shall use the existing Django API for hazard data and business rules.
- **FR-MOBILE-002 (P2):** The API shall avoid requiring browser-only assumptions in hazard endpoints.
- **FR-MOBILE-003 (P2):** The mobile client shall provide native camera and photo-upload integration.
- **FR-MOBILE-004 (P2):** The mobile client may use GPS after an explicit permission request and must offer manual location selection when practical.
- **FR-MOBILE-005 (P2):** The mobile app shall use a mobile-appropriate authentication strategy; do not copy browser session handling without evaluating platform security and API requirements.
- **FR-MOBILE-006 (P2):** Tokens, if used in the mobile client, shall be stored using an appropriate secure platform storage mechanism, not ordinary unencrypted local storage.
- **FR-MOBILE-007 (P2):** Push notifications shall be opt-in and respect OS-level permissions and user preferences.
- **FR-MOBILE-008 (P2):** Offline drafts may be supported, but unsent reports must be identified as drafts and must not appear as server-confirmed reports.
- **FR-MOBILE-009 (P2):** Any offline map feature shall use an explicitly selected provider and comply with its terms; do not bulk-download standard OSM tiles.
- **FR-MOBILE-010 (P2):** Mobile releases shall include device testing, accessibility checks, secure build configuration, and store-compliance review.

## 6. External interface requirements

### 6.1 User interface

- Use React and Tailwind CSS; Bootstrap and React Bootstrap are prohibited for the selected stack.
- Use reusable React components and the shared RouteX design tokens.
- Use Lucide React for consistent line icons, unless a specific map marker requires a custom SVG.
- Use semantic HTML and accessible labels.
- All forms shall include validation feedback and loading, success, and error states.
- Disable repeated submission while an in-flight request is active, while avoiding accidental loss of form contents.
- Use visible focus indicators, keyboard-operable controls, adequate contrast, and reduced-motion support.
- The map must have a text/list alternative where practical and must not be the only way to access report information.

### 6.2 Mapping interface

Initial tile template for development:

```text
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Requirements:

- Tile URL configurable through frontend environment configuration.
- Attribution visible and linkable on the map.
- Respect current tile provider policies and usage restrictions.
- Do not assume the public standard OSM tile service offers a service-level agreement, unlimited capacity, or offline bulk use.
- If load or reliability requirements exceed the public service's appropriate use, select a suitable provider or operate suitable infrastructure before scaling.
- Map tiles are separate from RouteX's hazard database; OSM does not supply RouteX community hazard reports.

Useful official references to check during implementation:

- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- OpenStreetMap copyright and attribution: https://www.openstreetmap.org/copyright
- React Leaflet installation and documentation: https://react-leaflet.js.org/docs/start-installation/
- Nominatim usage policy if public geocoding is later evaluated: https://operations.osmfoundation.org/policies/nominatim/

### 6.3 API conventions

- Use a versioned route prefix: `/api/v1/`.
- Use JSON for standard requests/responses and `multipart/form-data` for report submissions with photos.
- Use consistent error shapes with field-level validation where applicable.
- Use HTTP status codes correctly.
- Use pagination for collection endpoints.
- Keep public read endpoints separate from protected write/moderation endpoints where this improves clarity.
- Do not expose model internals, secrets, stack traces, password data, session data, or unnecessary personal information.

### 6.4 Proposed API surface

The implementation may adjust exact routing to follow existing project conventions, but all implemented behaviours must be covered by equivalent endpoints.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/api/v1/health/` | Basic service health check without secrets | Public/operational |
| GET | `/api/v1/auth/csrf/` | Bootstrap CSRF cookie/token for the browser | Public |
| POST | `/api/v1/auth/register/` | Create an account | Public, throttled |
| POST | `/api/v1/auth/login/` | Establish a session | Public, CSRF-protected and throttled |
| POST | `/api/v1/auth/logout/` | End a session | Authenticated, CSRF-protected |
| GET | `/api/v1/auth/me/` | Return safe current-user information | Publicly callable; response reflects auth state |
| GET | `/api/v1/hazards/` | List reports with filters/pagination/bounds | Public |
| POST | `/api/v1/hazards/` | Create a report | Authenticated |
| GET | `/api/v1/hazards/{id}/` | Report detail | Public unless report is restricted by policy |
| POST | `/api/v1/hazards/{id}/confirm/` | Confirm current presence | Authenticated |
| POST | `/api/v1/hazards/{id}/flags/` | Flag a report | Authenticated |
| GET | `/api/v1/me/reports/` | Current user's reports | Authenticated |
| GET | `/api/v1/moderation/reports/` | Moderation queue | Moderator/admin |
| POST | `/api/v1/moderation/reports/{id}/actions/` | Apply an audited moderation action | Moderator/admin |
| POST | `/api/v1/ai/suggest/` | Future AI suggestion endpoint | Authenticated, feature-enabled, throttled |

The AI endpoint is a Phase 2 requirement, not a prerequisite for Phase 1 acceptance.

### 6.5 Geolocation, geocoding, and routing distinction

- Browser geolocation supplies a device location only after suitable user permission.
- Leaflet allows users to choose a point on the displayed map.
- OSM map tiles display map imagery; they do not by themselves implement address search, autocomplete, or route calculation.
- Geocoding and routing must be selected as separate services if introduced.
- Provider terms, limits, privacy implications, and costs must be assessed before production use.

## 7. Data requirements

### 7.1 User/account data

Store only required information such as unique account identifier, email, display name, password hash managed by Django, role/permissions, and timestamps. Avoid collecting unnecessary personal information.

### 7.2 Hazard report data

The report record shall include, at minimum:

- Stable identifier (UUID or an equivalent suitable key).
- Category.
- Description.
- Latitude and longitude.
- Reporter relationship.
- Status.
- Created and updated timestamps.
- Optional image/media reference.
- Last qualifying confirmation time, where applicable.
- Demo-data flag or an equally reliable separation mechanism.

Optional fields such as location label, moderation metadata, or resolved timestamp may be added if their semantics are documented.

### 7.3 Confirmation data

Store report, user, and creation time. Enforce one qualifying active confirmation per user/report combination unless a deliberately documented revoke/reconfirm policy is implemented.

### 7.4 Flag data

Store report, flagging user, reason, optional details, status, created time, and any review timestamp/action needed by moderation.

### 7.5 Moderation audit data

Store target report, acting moderator, action, reason, timestamp, and any minimal before/after state required for auditability. Regular users must not edit or delete audit records.

### 7.6 Timestamp and freshness rules

- Store timestamps in timezone-aware form; use UTC in the backend.
- Render timestamps in the user's local timezone where appropriate.
- Display absolute date/time or relative age with a way to understand the underlying time.
- Define which events count as a valid freshness update. Opening a report, refreshing a page, or an AI suggestion must not reset freshness.
- A user confirmation may update freshness only after the backend accepts it under the confirmation rules.
- Moderation edits should not silently simulate a community confirmation.

### 7.7 Media storage and privacy

- Store media separately from ordinary JSON fields using configured local development storage and suitable production storage.
- Restrict allowed image types and sizes; verify content rather than trusting filename extensions alone.
- Use generated or sanitised filenames and avoid exposing server filesystem paths.
- Decide whether photo metadata such as EXIF/GPS should be removed before public serving; the preferred public-upload approach is to avoid exposing unnecessary metadata.
- Define file-retention and deletion rules before public launch.
- Avoid showing a reporter's private account information alongside a public photo.

### 7.8 Data migration and demo seeding

- Use Django migrations for schema changes.
- Avoid editing production data through ad hoc scripts without an explicit, reviewed process.
- Demo seeding shall be explicit, repeatable where possible, and safe to remove.
- Demo fixtures shall never be automatically inserted into production deployments.

## 8. Serializer and backend implementation requirements

Serializers are mandatory for request validation and safe response shaping. Avoid placing all business logic into React or large, unstructured view functions.

Required or equivalent serializer responsibilities:

- `UserRegistrationSerializer`: validates account registration and never returns password fields.
- `UserPublicSerializer`: returns only approved public profile fields.
- `HazardReportListSerializer`: compact map/list result.
- `HazardReportDetailSerializer`: full safe report details.
- `HazardReportCreateSerializer`: validates category, description, coordinates, optional image, and assigns reporter/status/timestamps through trusted server logic.
- `HazardConfirmationSerializer`: validates and applies confirmation rules.
- `HazardFlagSerializer`: validates flag inputs and attaches the authenticated user server-side.
- `ModerationActionSerializer`: validates allowed action types and requires an appropriate reason.

Implementation requirements:

1. Validate latitude and longitude ranges server-side.
2. Restrict categories and statuses to defined choices.
3. Do not accept a client-supplied `reporter`, `user`, `role`, moderation decision, or privileged timestamp as authoritative.
4. Use database constraints for uniqueness and transaction-safe logic where duplicate requests could cause inconsistent state.
5. Use serializer validation for field- and object-level constraints.
6. Use permission classes for access control and throttling for sensitive write operations.
7. Avoid N+1 queries when returning report lists and confirmation counts.
8. Keep public serializers from exposing private reporter information or internal moderation data.
9. Add tests for serializers, permissions, API behaviours, and invalid inputs.

## 9. Non-functional requirements

### 9.1 Security

- **NFR-SEC-001:** Secrets and credentials must be stored outside source control.
- **NFR-SEC-002:** Production must not run with `DEBUG=True`.
- **NFR-SEC-003:** Configure allowed hosts, CORS origins, trusted CSRF origins, and cookie settings explicitly for each environment.
- **NFR-SEC-004:** Browser session cookies should use secure settings in HTTPS production; use `HttpOnly` and appropriate `SameSite` settings according to the chosen deployment architecture.
- **NFR-SEC-005:** CSRF protection must not be disabled to work around frontend integration problems.
- **NFR-SEC-006:** All write access and role checks must be enforced server-side.
- **NFR-SEC-007:** Apply throttling to authentication, report creation, confirmations, flags, upload, and future AI endpoints.
- **NFR-SEC-008:** Validate and limit upload files; protect against executable or malicious uploads.
- **NFR-SEC-009:** Do not log passwords, session IDs, API keys, authentication tokens, or unnecessary personal data.
- **NFR-SEC-010:** Follow secure coding practices for SQL access, output escaping, validation, and error handling.
- **NFR-SEC-011:** Restrict moderator actions and preserve relevant audit records.
- **NFR-SEC-012:** Keep AI provider credentials server-side and validate provider responses as untrusted input.

### 9.2 Privacy

- **NFR-PRIV-001:** Request location permission only when needed for a user-initiated function.
- **NFR-PRIV-002:** Provide manual map location selection where practical.
- **NFR-PRIV-003:** Do not track background location in the MVP.
- **NFR-PRIV-004:** Collect only account and report information needed for the service.
- **NFR-PRIV-005:** Do not publicly expose email addresses or other private account details through report serializers.
- **NFR-PRIV-006:** Define data retention, account deletion, photo handling, and privacy-contact processes before a public launch.
- **NFR-PRIV-007:** Document data transmitted to external map, email, or future AI providers.

### 9.3 Performance and scalability

- **NFR-PERF-001:** API collection responses shall be paginated or bounded.
- **NFR-PERF-002:** Map requests shall be restricted to the visible bounds and debounced during movement.
- **NFR-PERF-003:** The frontend shall avoid re-fetching or re-rendering the entire application unnecessarily.
- **NFR-PERF-004:** Images should be size-limited and displayed with appropriate dimensions/lazy loading.
- **NFR-PERF-005:** Database indexes should be added for common filters and relationships where useful.
- **NFR-PERF-006:** Establish a measured baseline during testing. Initial target: common API read/write operations should ordinarily return within 800 ms at the 95th percentile under a modest pilot test, excluding third-party map tile load and external AI calls. Record deviations and environment details rather than claiming a target was met without measurement.
- **NFR-PERF-007:** Use viewport filtering and marker clustering when report density makes rendering slow.

### 9.4 Availability and resilience

- **NFR-REL-001:** If the map tile provider fails, the page should explain the map is unavailable and retain access to non-map report lists/details where possible.
- **NFR-REL-002:** If the backend is unavailable, show a clear error and retry path instead of a blank screen.
- **NFR-REL-003:** If AI is unavailable in Phase 2, reporting and browsing must continue to work.
- **NFR-REL-004:** Do not report a submission as successful until the backend response confirms persistence.
- **NFR-REL-005:** Production deployment should include a documented backup and restore process for PostgreSQL and uploaded media.

### 9.5 Usability and accessibility

- **NFR-UX-001:** The application shall work at common mobile, tablet, and desktop widths without horizontal overflow.
- **NFR-UX-002:** Core actions must be keyboard accessible with visible focus states.
- **NFR-UX-003:** Inputs must have labels and accessible validation messages.
- **NFR-UX-004:** Status and hazard type must not rely on colour alone.
- **NFR-UX-005:** Respect reduced-motion settings and avoid unnecessary animation.
- **NFR-UX-006:** Aim for WCAG 2.2 Level AA conformance for applicable interface content.
- **NFR-UX-007:** Error messages should explain what happened and how to recover, without revealing technical internals.
- **NFR-UX-008:** The main reporting flow should minimise unnecessary steps and make location, category, description, and optional photo status clear.

### 9.6 Maintainability and code quality

- **NFR-MAINT-001:** Use modular React components, Django applications, serializers, services, views, permissions, and tests with clear responsibilities.
- **NFR-MAINT-002:** Avoid unnecessary libraries and premature abstractions.
- **NFR-MAINT-003:** Keep API calls in a frontend service layer and centralise environment configuration.
- **NFR-MAINT-004:** Record dependency versions and setup commands.
- **NFR-MAINT-005:** Use migrations and a repeatable setup process.
- **NFR-MAINT-006:** Update `BACKLOG.md` and `SESSIONS.md` at meaningful milestones.
- **NFR-MAINT-007:** Add comments for non-obvious decisions, not for every line.

### 9.7 Observability and operations

- **NFR-OPS-001:** Provide a simple health endpoint that does not reveal secrets.
- **NFR-OPS-002:** Use structured, useful logs for errors and significant operational events.
- **NFR-OPS-003:** Do not return stack traces or database details to public API clients.
- **NFR-OPS-004:** Document migrations, static files, media storage, environment variables, backup, and deployment processes.
- **NFR-OPS-005:** Separate development, staging, and production configuration.
- **NFR-OPS-006:** Confirm the deployment provider's free-tier quotas and persistence limits before relying on it for real user data.

## 10. Core use cases

### UC-01: Browse the map

**Actor:** Anonymous visitor or registered user.  
**Preconditions:** The frontend can reach the API; map tiles may load from the configured provider.

1. User opens `/map`.
2. The application loads the map and requests reports for the visible bounds.
3. API validates query filters and returns a bounded/paginated collection.
4. Map renders returned markers.
5. User pans, zooms, or changes filters; the application loads the matching report set.
6. User selects a marker and inspects the details.

**Alternate paths:** If there are no reports, show a helpful empty state. If the API fails, show an API error. If tiles fail, retain non-map report access if feasible. Demo items, if used, are visibly labelled.

### UC-02: Register and sign in

**Actor:** Anonymous visitor.

1. User opens registration.
2. Frontend obtains required CSRF state.
3. User submits valid account details.
4. Backend validates with the registration serializer and creates the user using Django authentication.
5. Frontend shows the outcome and guides the user to sign in if registration does not establish a session.
6. User signs in; server establishes the session.
7. Frontend requests current-user information and updates its state.
8. On refresh, the frontend repeats the current-user request to restore session state.

**Alternate paths:** Invalid data returns field-level errors. Failed login returns a generic authentication error. CSRF errors are handled and surfaced usefully, not bypassed.

### UC-03: Submit a hazard report

**Actor:** Authenticated user.

1. User opens Report a hazard.
2. User chooses a category and enters a description.
3. User chooses a location on the map or explicitly requests browser geolocation.
4. User optionally selects a photo.
5. Frontend validates basic input and submits the report.
6. Backend validates the payload and photo through serializers/parsers and assigns ownership/status/timestamps server-side.
7. Backend persists the report and returns the saved record.
8. Frontend confirms success and links to the saved report.
9. The report appears in map results and the user's history when those views refresh.

**Alternate paths:** A denied location permission does not block manual pin selection. Validation errors preserve entered data. Failed uploads and network failures do not generate false success messages.

### UC-04: Confirm a report

**Actor:** Authenticated user.

1. User opens report details.
2. User chooses to confirm the hazard is still present.
3. Backend verifies access, report eligibility, uniqueness, and throttling.
4. Backend saves the confirmation and updates relevant derived values.
5. Frontend displays the new confirmation state and timestamp.

**Alternate paths:** A duplicate confirmation returns a useful message and does not increment the count. A stale or ineligible report follows the configured rule.

### UC-05: Flag a report

**Actor:** Authenticated user.

1. User selects the flag action and a reason.
2. User optionally enters supporting details.
3. Backend validates and records the flag.
4. The report remains visible unless a documented rule or moderator action changes its state.
5. The flag becomes available to moderators.

### UC-06: Moderate a report

**Actor:** Moderator.

1. Moderator opens the protected review queue.
2. Backend verifies moderator permission.
3. Moderator inspects report details, flags, evidence, and history.
4. Moderator selects an allowed action and supplies a reason where required.
5. Backend validates the action, updates status, and records an audit event atomically where possible.
6. The UI displays the completed action only after the server confirms it.

### UC-07: Future AI-assisted report entry

**Actor:** Authenticated user; Phase 2 only.

1. User requests an AI suggestion.
2. Backend checks feature flag, authentication, throttling, payload size, and provider configuration.
3. Backend sends only the required text/image information to Gemini.
4. Backend validates the response against allowed categories and limits.
5. Frontend displays the result as an editable suggestion.
6. The user accepts or edits the suggestion and submits through the ordinary report endpoint.

If the provider is unavailable, the user can continue manually. The AI suggestion does not verify the hazard.

## 11. API error and response requirements

- Validation errors should identify relevant fields without leaking implementation details.
- Authentication failures shall not reveal whether a specific account exists unless that disclosure is explicitly accepted by the product/security review.
- Permission failures shall use suitable status codes and consistent response shapes.
- Rate-limit responses shall explain that the action was attempted too frequently and may be retried later, without revealing internal thresholds unnecessarily.
- Upload errors shall explain whether the issue was type, size, or processing when safe to do so.
- The frontend shall map known API error shapes to form-level or page-level messages.
- The API shall not return raw Django exception messages or tracebacks to public clients.

## 12. Testing and quality assurance

### 12.1 Backend testing

At minimum, tests shall cover:

- User registration, duplicate email, password validation, login, logout, and session restoration endpoint behaviour.
- CSRF requirements for browser authentication and write operations.
- Safe current-user response fields.
- Anonymous read access and protected write access.
- Hazard serializer validation for categories, required description, coordinate bounds, upload type, and upload size.
- Server-assigned reporter, status, and timestamps.
- Confirmation uniqueness, count integrity, and freshness updates.
- Flag validation and duplicate/rate-limit controls.
- Moderation permission and audit records.
- Viewport/category/status filtering, pagination, and malformed query handling.
- Demo data separation and safe removal.
- AI failure paths in Phase 2, including missing credentials and provider errors.

### 12.2 Frontend testing

At minimum, verify:

- Landing page renders and links work.
- Main map shows tiles, attribution, API markers, and report details.
- Viewport changes trigger bounded requests without excessive duplication.
- Loading, empty, error, and demo-data states are clear.
- Registration/login/logout and session restoration work with the backend.
- Protected write actions send credentials and CSRF tokens correctly.
- A report can be submitted with and without a photo.
- Invalid form input is displayed clearly.
- Mobile and desktop layouts do not overflow.
- Keyboard navigation and focus are usable.
- Production frontend build succeeds without broken imports or missing Leaflet markers.

### 12.3 End-to-end acceptance test

A release candidate must pass this minimum path in a clean environment:

1. Start PostgreSQL, backend, and frontend using documented commands.
2. Apply database migrations.
3. Register a test user and sign in.
4. Open the map and confirm that real saved API data, not a hard-coded array, drives report markers.
5. Create a report with manual coordinates and no photo.
6. Verify the stored report is returned by the list/detail endpoints.
7. Create a second report with an allowed photo.
8. Refresh the browser and verify the session is restored.
9. Confirm one report and verify the confirmation is persisted.
10. Flag a report and verify the flag is visible to an authorised moderator.
11. Attempt unauthorised moderation and confirm the server rejects it.
12. Sign out and verify protected actions require authentication.
13. Check the map and report flows with no real reports and with API/tile failure states.
14. Run backend tests and frontend production build and record actual results.

## 13. Deployment and configuration requirements

The project shall document, as applicable:

- Frontend API base URL.
- Map tile URL.
- Django secret key and debug setting.
- Database connection settings.
- Allowed hosts, CORS allowed origins, and trusted CSRF origins.
- Cookie security settings.
- Media storage and upload-size limits.
- Optional email configuration for password reset/verification.
- Optional Gemini API key and feature flag for Phase 2.
- Logging configuration.
- Static file and media-serving strategy.
- Migration, seed-demo, backup, and restore commands.

A `.env.example` shall contain placeholder values only. Real secrets must not be committed. The README shall give separate terminal commands for backend and frontend development.

## 14. Release plan and order of implementation

### Phase 1A — Foundation

1. Inspect existing repository and project notes.
2. Configure React/Vite/Tailwind and Django/DRF/PostgreSQL.
3. Add environment files, README, migrations, and health endpoint.
4. Establish models, serializers, permissions, and API tests.

### Phase 1B — First vertical slice

1. Implement hazard list/detail and viewport filtering.
2. Render the actual API reports on the Leaflet map.
3. Implement manual location selection and report creation.
4. Verify the saved report reappears on the map.

### Phase 1C — Authentication and community functions

1. Implement registration, session login, logout, CSRF, and current-user endpoint.
2. Protect report creation.
3. Implement user report history, confirmations, and flags.
4. Apply rate limits and uniqueness constraints.

### Phase 1D — Landing page and moderation

1. Implement a polished public landing page.
2. Ensure all CTAs link to working features.
3. Implement the moderator queue and audited actions.
4. Complete responsive states, accessibility, and end-to-end testing.

The landing page may be built in parallel with backend work, but must not block testing of the map-to-API-to-database workflow.

### Phase 1.1 — Pilot readiness

1. Password reset and optional email verification.
2. Privacy, terms, photo metadata/retention decisions.
3. Production hosting, media storage, backups, logging, and monitoring.
4. Abuse handling, access reviews, and cross-browser/mobile testing.

### Phase 2 — Gemini AI

1. Verify current Google Gemini API model, SDK, quotas, billing, data handling, and terms.
2. Add a backend provider adapter and configuration flag.
3. Implement one narrow feature first: category suggestion or neutral summary.
4. Test provider failure, throttling, malformed outputs, and privacy boundaries.
5. Add duplicate suggestions only after the first feature is reliable and measured.

### Phase 3 — React Native + Expo

1. Validate that the Django API can serve a non-browser client with appropriate auth.
2. Build native map/reporting flows with a suitable mobile map library/provider.
3. Add camera, GPS, draft, and notification functions incrementally.
4. Perform device, privacy, secure-storage, accessibility, and release tests.

### Phase 4 — Expansion

Add geocoding, routing, additional regions, advanced notifications, or spatial database features only after product need, technical design, terms, costs, and success measures are documented.

## 15. Traceability to project documents

- `PLAN.md` defines product scope and non-goals.
- `BRAND.md` defines identity, personality, and visual principles.
- `VOICE.md` defines interface and safety copy.
- `STYLE.md` defines visual tokens, responsive layouts, accessibility, and frontend conventions.
- `ARCHITECTURE.md` defines technical boundaries, models, API shape, and security approach.
- `BACKLOG.md` defines work priority and delivery queue.
- `SESSIONS.md` records implementation state, decisions, and next steps.
- `IDE_SETUP_PROMPT.md` directs the coding agent to inspect, implement, verify, and update the project.

When two documents conflict, preserve user data and working code, follow the security and privacy requirements in this SRS, then reconcile the documents explicitly. Do not silently ignore a requirement because it is not yet implemented.

## 16. Decisions to confirm before public launch

These decisions do not prevent the basic MVP from being built, but must be resolved before a wider public release:

1. Whether email verification is required for all write actions.
2. Exact report edit/withdrawal rules and retention policy.
3. Whether the report author can count as one of the confirmations.
4. Whether confirmation can be revoked and how freshness is recalculated.
5. Who can grant moderator/admin roles and what review process applies.
6. Maximum photo size, supported formats, metadata removal, and retention.
7. Production tile provider and any provider/geocoding/routing service selected.
8. Hosting provider, database backup plan, and media storage durability.
9. Privacy policy, terms of use, abuse-handling contact, and incident response process.
10. Google Gemini model, quota/cost controls, provider data handling, and feature-specific human review policy.
11. Mobile authentication, notification consent, data retention, offline draft behaviour, and release/distribution strategy.
12. The criteria for expanding from Lagos to additional regions.

## 17. Definition of MVP complete

RouteX MVP is complete only when all P0 requirements have been implemented or explicitly marked as an agreed exception, the core end-to-end acceptance test passes, frontend production build and backend tests have been run, deployment/configuration instructions are documented, and the actual results are recorded in `SESSIONS.md`.

A visual mockup, a hard-coded map, a frontend-only form, an authentication screen that is not connected to Django, or an API with no usable frontend does not count as a working MVP.
