# RouteX — UI and Code Style Guide

## 1. Design direction
RouteX should feel like dependable civic technology: modern, calm, practical, and built around the map and hazard information. Avoid a generic analytics dashboard appearance, excessive gradients, glass effects, oversized in-app hero sections, or animation that delays essential tasks.

## 2. Design tokens
Use these consistently through Tailwind theme tokens or CSS variables.

| Token | Hex | Use |
|---|---|---|
| Navy | `#142B3B` | Main text, strong contrast, dark surfaces |
| Teal | `#087F8C` | Primary actions, active navigation |
| Off-white | `#F7F9FA` | App background |
| White | `#FFFFFF` | Cards and panels |
| Amber | `#F2B544` | Caution accents |
| Red | `#D64545` | Error and serious-risk states |
| Green | `#27865B` | Success where semantically correct |
| Slate | `#667784` | Secondary text and muted icons |
| Border | `#DCE4E8` | Input borders and dividers |

Use readable system fonts or a restrained sans-serif family. Avoid tiny, low-contrast text for report status or timestamps.

## 3. Layout
### Desktop
- Compact header with RouteX branding and account actions.
- Map-first workspace; the map usually occupies roughly 65–75% of the usable central area.
- Filters and report list/detail panel should not obstruct essential map controls.
- Moderator views may be denser but must use the same tokens and component language.

### Mobile web
- Full-screen or near-full-screen map.
- Prominent **Report a hazard** action.
- Filters in a drawer or bottom sheet.
- Selected-report details in an expandable bottom sheet.
- Do not cover map attribution or key controls with navigation.
- Forms must work at narrow widths and support comfortable touch targets.

### Spacing and shape
Use a consistent spacing scale, clear grouping, medium corner radii, and subtle shadows only when they improve hierarchy. Avoid excessive borders and oversized pill shapes. Prevent horizontal overflow.

## 4. Core components
Create focused, reusable components as needed:
- `AppHeader`
- `DesktopSidebar` or desktop filter panel
- `MobileBottomNavigation`
- `HazardMap` and `HazardMarker`
- `HazardFilters`
- `HazardDetailsPanel` and `HazardDetailsBottomSheet`
- `ReportHazardForm` and `LocationPicker`
- `HazardReportCard`
- `FreshnessBadge`
- `LoadingState`, `EmptyState`, `ErrorState`, and `DemoDataBanner`
- `VerificationBadge` only when its definition and rules are explicit

Use Lucide React consistently; avoid mixing unrelated icon libraries.

## 5. Map and status semantics
- Distinguish flooding, pothole, blocked road, fallen tree, and other with iconography plus text labels.
- Never rely on colour alone.
- Display report timestamp and status; make stale reports easy to recognise.
- Do not call a report “verified” simply because it includes a photo, an AI suggestion, or one confirmation.
- Show required map attribution.
- Provide a list or other accessible way to reach report information where practical.

## 6. Forms and feedback
- Associate every input with a visible label and useful validation message.
- Explain optional photo and location use.
- Include loading, disabled, success, empty, and error states.
- Avoid duplicate submissions while a request is in flight.
- Preserve entered fields after recoverable errors.
- Show success only after the backend confirms success.
- Confirm destructive moderator actions and require a reason where appropriate.

## 7. Accessibility and responsiveness
- Use semantic HTML and a logical heading hierarchy.
- Support keyboard navigation and visible focus indicators.
- Maintain accessible contrast, especially for slate text and amber backgrounds.
- Label icon-only buttons for assistive technologies.
- Respect reduced-motion preferences.
- Test at narrow phone, tablet, and desktop widths.
- Do not use colour as the sole way to communicate category, severity, or state.

## 8. Frontend engineering conventions
- Use React function components and hooks.
- Use Tailwind CSS. Do not use Bootstrap, React Bootstrap, or Bootstrap class names.
- Keep HTTP calls in a service layer rather than scattering Axios calls through components.
- Use React Router for page navigation and protected routes where needed.
- Centralise API base URL and environment configuration.
- Keep components focused; avoid unnecessary abstractions and dependencies.
- Handle loading, empty, error, and success states explicitly.
- Use stable React keys and never mutate state directly.
- Vite client variables are public. Never place secrets in `VITE_*` variables.
- Import Leaflet CSS and give map containers an explicit height.
- Avoid adding a state-management library until a demonstrated need exists.

## 9. AI and mobile consistency
- AI-suggested content must be marked as a suggestion and be editable/reviewable before submission.
- Keep error and unavailable states clear when the AI service is disabled or fails.
- If a future React Native client is built, reuse the brand tokens and language rules, but use native components and test touch, keyboard, safe-area, and permission behaviour on devices.

## 10. Motion
Use short, purposeful transitions for panels and feedback. Do not animate hazard markers continuously or make motion necessary to understand a status. Prioritise responsiveness and clarity.

## 11. Definition of done for UI work
- Works at mobile and desktop widths.
- Uses existing tokens and reusable components.
- Has appropriate loading, empty, error, and success states.
- Has readable labels, keyboard focus, and accessible contrast.
- Shows truthful report statuses and timestamps.
- Clearly labels demo data.
- Has no broken imports or console errors introduced by the change.
