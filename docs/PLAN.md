# RouteX — Project Plan

**Team:** NextGen  
**Product:** RouteX  
**Tagline:** Know the Road Ahead.  
**Initial service area:** Configurable supported regions

## What we are building
RouteX is a community-powered road-hazard reporting platform. Road users can view community reports on a map, submit a hazard with its location and an optional photo, and help keep reports current. Moderators can review reports, duplicates, and abuse.

## Who it is for
- Drivers, commuters, pedestrians, cyclists, and other road users.
- Community members who want to share useful, timely road information.
- Moderators who help maintain report quality and user trust.

## Core user flows
1. Browse reported hazards on an interactive map.
2. Filter reports by category, status, and freshness.
3. Open a marker to see its details, timestamp, evidence, and community activity.
4. Submit a hazard using a selected location, category, description, and optional photo.
5. Confirm that a hazard remains present or flag a report for review.
6. Sign in for actions that require an account; moderators use a protected review queue.

## MVP scope
- Responsive web app using React, Vite, and Tailwind CSS.
- Map using Leaflet and React Leaflet, with appropriate map-data attribution.
- Categories: flooding, pothole, blocked road, fallen tree, and other.
- Django REST Framework API and PostgreSQL database.
- Authentication, role-aware permissions, server-side validation, and report moderation foundations.
- Optional photo uploads, timestamps, freshness indicators, confirmations, flags, and moderation history.
- Clear loading, empty, error, and success states.
- Clearly labelled demo data, only when explicitly enabled for development or presentation.

## Future phases
- **Google Gemini AI:** backend-only assistance for suggested hazard category, concise neutral summaries, and possible duplicate hints. The service must be optional; humans and documented rules remain responsible for review and status changes.
- **React Native mobile app:** consider React Native with Expo after the web MVP is stable. Reuse the same Django API for accounts, reports, confirmations, and moderation-related user flows. Add camera, location permissions, and push notifications only when there is a clear need.
- Expand to additional regions after the initial service is reliable.

## Deliberate non-goals
- No turn-by-turn navigation, routing engine, or live traffic prediction in the MVP.
- No claim that community reports are official road closures or guaranteed truth.
- No AI model deciding whether a hazard is real or automatically publishing, verifying, resolving, or rejecting reports.
- No background location tracking.
- No native mobile app during the initial web phase.
- No fabricated live hazards, statistics, testimonials, partnerships, or official endorsements.
- No paid AI or map provider required for core browsing and reporting.

## Constraints and success criteria
Prioritise an end-to-end, tested reporting flow over visual polish alone. Keep secrets on the backend, validate all writes on the server, build responsive and accessible screens, and document local setup. Show users when information was reported and avoid presenting stale reports as current. Treat free tiers and provider quotas as changeable limits, not guarantees.
