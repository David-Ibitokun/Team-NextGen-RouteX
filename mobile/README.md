# RouteX Mobile Application

> **Team:** NextGen  
> **Product:** RouteX  
> **Tagline:** Know the Road Ahead.  
> **Architecture:** Expo React Native (iOS & Android) with Native Map & Screens + Hybrid Offline Storage + Direct Django REST Framework Integration + Expo Push Notification Gateway

---

## 1. Architecture Overview

The RouteX mobile application is built with **React Native and Expo (SDK 57/58)** in TypeScript. It provides a native mobile client with high-performance screens, direct REST API communication, native geolocation, push notifications, and offline fallback.

```
┌────────────────────────────────────────────────────────┐
│           Expo React Native Container (Android & iOS)   │
│  - NativeMapScreen (Embedded Leaflet with 10km circle) │
│  - ReportScreenNative & ReportModalNative (GPS + AI)   │
│  - NotificationsModalNative (Pull-to-refresh + sync)   │
│  - AISuggestionCardNative (Category & Duplicate check) │
│  - Expo Location (10km Proximity GPS Filtering)        │
│  - Expo Push Notifications Gateway & Device Tokens     │
│  - Hardware Back Button & Origin Security Boundaries   │
└────────────────────────────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
             Django REST Framework API (v1)
                           │ ORM
                           ▼
                  PostgreSQL / SQLite
```

---

## 2. Core Mobile Features

### A. "Hazards Near You" (10 km Proximity Filter)
- Uses `expo-location` to query foreground device coordinates (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync`).
- Requests nearby hazards via `GET /api/v1/hazards/?lat=..&lng=..&radius_km=10`.
- Renders a 10 km dashed radius circle and centers viewport on the user's location.
- Displays distance badges on hazard cards (e.g. `1.8 km away`).

### B. Proactive AI Duplicate Detection & 1-Click Confirmation
- Debounced (1.2s) background similarity scan as commuters type descriptions ($\ge 10$ chars).
- Displays matching nearby hazards within 1 km with AI match rationale.
- Commuters can tap **"Confirm This Hazard Instead"** to upvote the existing report without filing a redundant duplicate.
- Native `Alert.alert` intercepts pre-submission to verify if user intends to proceed near active duplicates.

### C. Full-Stack Notifications System
- Direct integration with `/api/v1/notifications/`: fetches server notifications when logged in and falls back to local `AsyncStorage` for offline/guest users.
- Pull-to-refresh (`RefreshControl`) in `NotificationsModalNative`.
- Tapping a notification marks it as read and automatically opens and centers that hazard on the live map.
- Registers device push tokens (`DevicePushToken`) via Expo push service.

### D. Direct API & Session Handling
- `apiClient.ts` manages cookies, CSRF tokens, and `X-Session-ID` authentication headers.
- Graceful offline fallback keeps previously loaded hazards and notifications available when disconnected.

---

## 3. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL`:

### A. Android Studio Emulator
Android emulators access the host computer via `10.0.2.2`:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1
EXPO_PUBLIC_WEB_URL=http://10.0.2.2:5173
```

### B. Physical Android Device (LAN Wi-Fi)
Ensure your phone and development computer are connected to the same Wi-Fi network. Use your computer's local LAN IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.0.178:8000/api/v1
EXPO_PUBLIC_WEB_URL=http://192.168.0.178:5173
```

---

## 4. Quick Start Commands

From the repository root:
```cmd
run_mobile.bat
```

Or from the `mobile/` directory:
```bash
# Run unit, policy, and API tests (15/15 passing)
npm test

# Type check
npm run type-check

# Start Expo development server
npm start
```

### Running on Android Emulator:
1. Start your Android Emulator in Android Studio.
2. In the running Expo terminal, press `a` to open on Android.

### Running on Physical Device:
1. Open the **Expo Go** app on your Android phone.
2. Scan the QR code displayed in your terminal or Metro bundler window.

---

## 5. Automated Mobile Testing (15/15 Passing)

```text
--- Running RouteX Mobile Unit Tests ---
✓ Test 1 Passed: Empty URL handled safely
✓ Test 2 Passed: Non-HTTP/HTTPS protocol rejected
✓ Test 3 Passed: Valid URL parsed and normalized
✓ Test 4 Passed: RouteX internal origin allowed
✓ Test 5 Passed: about:blank initialization allowed
✓ Test 6 Passed: javascript: scheme blocked
✓ Test 7 Passed: file: scheme blocked
✓ Test 8 Passed: tel: scheme delegated externally
✓ Test 9 Passed: External links redirected to system browser
✓ Test 10 Passed: Malformed URLs rejected

All 10 RouteX Mobile Tests Passed Successfully! (10/10)
--- Running RouteX Mobile Auth, API & Notification Tests ---
✓ Test 1 Passed: API Base URL normalization strips trailing slashes
✓ Test 2 Passed: Registration validation rejects invalid credentials
✓ Test 3 Passed: Registration validation accepts valid credentials
✓ Test 4 Passed: Cookie extraction correctly parses sessionid and csrftoken
✓ Test 5 Passed: Hazard report notification properly formats category and location

All 5 RouteX Mobile Auth & API Tests Passed Successfully! (5/5)
```

---

## 6. Security & Navigation Policy

The mobile client implements strict security boundaries via `src/navigation/urlPolicy.ts`:
- **Allowed Origin:** Top-level navigation is strictly restricted to the origin configured in `EXPO_PUBLIC_WEB_URL`.
- **External Links:** Any links pointing outside the approved RouteX origin (e.g. OpenStreetMap attribution, privacy policies) are intercepted and opened safely in the device's system browser via `Linking.openURL()`.
- **Blocked Schemes:** Insecure schemes such as `javascript:`, `file:`, `data:`, and `vbscript:` are blocked immediately.
- **Intent Schemes:** `tel:`, `mailto:`, and `sms:` links are safely delegated to native device apps.
- **Mixed Content:** Mixed HTTP content inside HTTPS connections is rejected (`mixedContentMode="never"`).
- **Cookies & Storage:** Session cookies and DOM storage are isolated to the RouteX origin (`thirdPartyCookiesEnabled={false}`).

---

## 7. Device Hardware & Features

### Geolocation & Proximity
- Android permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) are declared in `app.json`.
- Uses `expo-location` for 10 km proximity radius filtering (`requestForegroundPermissionsAsync` + `getCurrentPositionAsync`).
- If geolocation permission is denied by the user, the app gracefully falls back to interactive pin dropping on the map.

### Camera & Photo Evidence Upload
- The app supports photo evidence uploads using standard image pickers and camera capture when camera permissions are granted.
- Pre-upload validation enforces a 5MB size limit.

### Notifications & Background Sync
- Uses `expo-notifications` for device push token registration and push notification delivery.
- Offline cache backed by `AsyncStorage` ensures previously loaded hazards and notifications remain readable without an internet connection.

### Android Back Button Navigation
- Handles hardware back press gracefully: steps back inside modal/navigation history when open, or displays an exit confirmation dialog when at the root to avoid accidental closure.

---

## 8. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **Network Request Failed / Cannot connect to API** | Incorrect `EXPO_PUBLIC_API_URL` | Check `.env`. In emulator, use `http://10.0.2.2:8000/api/v1`. On physical phone, use computer LAN IP `http://<YOUR_IP>:8000/api/v1`. Ensure Django is running on `0.0.0.0:8000`. |
| **White/Blank screen or Connection Refused** | Incorrect `EXPO_PUBLIC_WEB_URL` | Check `.env`. In emulator, use `http://10.0.2.2:5173`. On physical phone, use LAN IP `http://<YOUR_IP>:5173`. Verify Vite is running. |
| **"Missing EXPO_PUBLIC_WEB_URL" Screen** | `.env` file does not exist | Run `cp .env.example .env` and restart Expo (`npm start`). |
| **CSRF Failed / Login Error in Mobile** | Cross-origin cookie blocked | Ensure session ID / auth headers are passed via `apiClient.ts` or Vite proxy forwards `/api` directly to Django. |
| **Location Permission Denied** | Device location turned off | Enable GPS on device, allow location prompt in Expo Go, or tap anywhere on the map to place hazard pin manually. |
| **Photo Upload Fails** | Exceeded upload ceiling or camera permission | Max photo size is 5MB. Ensure image file size is within limits. |

---

## 9. Current Status & Production Roadmap

1. **Native Client Transition:** Fully operational native map, hazard reporting with proactive AI duplicate checks, and push notification gateway with 15/15 passing tests.
2. **Offline Mode:** Local cache preserves fetched hazards and notifications when offline; queued offline submissions can be synchronized upon network reconnection.
3. **Production Distribution:** Ready for standalone Android APK / AAB bundling via EAS Build (`eas build -p android`).

