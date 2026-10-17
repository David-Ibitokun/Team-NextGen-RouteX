# RouteX Mobile Application

> **Team:** NextGen  
> **Product:** RouteX  
> **Tagline:** Know the Road Ahead.  
> **Architecture:** Expo React Native Shell → Android WebView → RouteX React/Vite Web App → Django REST Framework API → PostgreSQL

---

## 1. Architecture Overview

The RouteX mobile application is built with **React Native and Expo (SDK 58)** in TypeScript. It provides a secure, branded Android native container (`WebView`) housing the responsive RouteX web application.

```
┌────────────────────────────────────────────────────────┐
│           Expo React Native Container (Android)        │
│  - SafeAreaProvider & StatusBar (Theme tokens)        │
│  - RouteXHeader (Native app bar with reload & back)   │
│  - Android Hardware BackButton Handler                 │
│  - Security boundary & Origin Validation               │
├────────────────────────────────────────────────────────┤
│                      WebView                           │
│  - RouteX Responsive Web App (React 18 + Vite)        │
│  - Leaflet Map + OpenStreetMap zero-key tiles          │
│  - Cookie sharing & session authentication            │
│  - Geolocation & camera photo capture                 │
└────────────────────────────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
             Django REST Framework API (v1)
                           │ ORM
                           ▼
                  PostgreSQL / SQLite
```

---

## 2. Prerequisites

- **Node.js**: v18+ (tested on Node v24 LTS)
- **npm**: v9+
- **Expo Go** app (installed on your Android physical phone) OR **Android Studio Emulator**
- Running RouteX backend (`run_backend.bat`) and frontend (`run_frontend.bat`)

---

## 3. Environment Configuration

The mobile container requires the URL of the running RouteX web application via `EXPO_PUBLIC_WEB_URL`.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure `EXPO_PUBLIC_WEB_URL` for your target environment:

### A. Android Emulator (Standard)
Android emulators run on an internal virtual network where `localhost` refers to the emulator itself. To connect to your host computer development server, use `10.0.2.2`:
```env
EXPO_PUBLIC_WEB_URL=http://10.0.2.2:5173
```

### B. Physical Android Device (LAN Wi-Fi)
Ensure your phone and development computer are connected to the same Wi-Fi network. Use your computer's local LAN IP (run `ipconfig` on Windows):
```env
EXPO_PUBLIC_WEB_URL=http://192.168.0.178:5173
```
*(Also ensure your Windows Firewall permits inbound traffic on port 5173 and 8000)*

### C. Staging / Production Deployment
For deployed environments:
```env
EXPO_PUBLIC_WEB_URL=https://routex.app
```

---

## 4. Quick Start Commands

From the repository root:
```cmd
run_mobile.bat
```

Or from the `mobile/` directory:
```bash
# Run unit tests and type checks
npm test
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

## 5. Security & Navigation Policy

The mobile shell implements strict security boundaries via `src/navigation/urlPolicy.ts`:
- **Allowed Origin:** Top-level navigation is strictly restricted to the origin configured in `EXPO_PUBLIC_WEB_URL`.
- **External Links:** Any links pointing outside the approved RouteX origin (e.g. OpenStreetMap attribution, privacy policies) are intercepted and opened safely in the device's system browser via `Linking.openURL()`.
- **Blocked Schemes:** Insecure schemes such as `javascript:`, `file:`, `data:`, and `vbscript:` are blocked immediately.
- **Intent Schemes:** `tel:`, `mailto:`, and `sms:` links are safely delegated to native device apps.
- **Mixed Content:** Mixed HTTP content inside HTTPS connections is rejected (`mixedContentMode="never"`).
- **Cookies & Storage:** Session cookies and DOM storage are isolated to the RouteX origin (`thirdPartyCookiesEnabled={false}`).

---

## 6. Device Hardware & Features

### Geolocation
- Android permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`) are declared in `app.json`.
- The WebView enables `geolocationEnabled={true}` to allow the web app's interactive map location picker and "Use my location" button.
- If geolocation permission is denied by the user, the web application gracefully falls back to interactive pin dropping on the map.

### Camera & Photo Evidence Upload
- The web app uses standard HTML `<input type="file" accept="image/*" capture="environment">`.
- Android WebView handles standard Android intent pickers for gallery photos or camera capture when camera permissions are granted.

### Android Back Button Navigation
- When pressing the physical or on-screen Android back button:
  - If the web app has navigation history (`canGoBack` is true), the WebView steps back inside the web app history.
  - If at the web application root (`canGoBack` is false), an exit confirmation dialog is presented to avoid accidental app closure.

---

## 7. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **White/Blank screen or Connection Refused** | Incorrect `EXPO_PUBLIC_WEB_URL` | Check `.env`. In emulator, use `http://10.0.2.2:5173`. On physical phone, use computer LAN IP `http://192.168.0.178:5173`. Verify Vite is running. |
| **"Missing EXPO_PUBLIC_WEB_URL" Screen** | `.env` file does not exist | Run `cp .env.example .env` and restart Expo (`npm start`). |
| **CSRF Failed / Login Error in Mobile** | Cross-origin cookie blocked | Ensure frontend is proxied or both web and backend share allowed origins. Vite proxy forwards `/api` directly to Django. |
| **Location Permission Denied** | Device location turned off | Enable GPS on device, allow location prompt in Expo Go, or tap anywhere on the map to place hazard pin manually. |
| **Photo Upload Fails** | Exceeded upload ceiling or camera permission | Max photo size is 5MB. Ensure image file size is within limits. |

---

## 8. Known Limitations (Hackathon MVP)

1. **WebView Architecture:** This is an Expo native WebView wrapper around the responsive web application, not a pure native component rewrite.
2. **Offline Mode:** The web app includes a PWA service worker shell cache, but dynamic hazard report submissions require an active network connection to Django.
3. **Push Notifications:** Native push notifications are planned for a later phase after native API transition.
