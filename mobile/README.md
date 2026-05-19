# LearnHub Mobile

React Native + Expo client for the e-learning platform.

## Stack

- **Expo SDK 50** + **React Native 0.73**
- **Expo Router** (file-based routing)
- **TypeScript**
- **TanStack Query** for server state
- **Zustand** for auth state
- **expo-av** for video playback
- **expo-secure-store** for tokens (no plain `localStorage`)

## Run

```bash
cd mobile
npm install
npm start           # Expo dev menu (a, i, w for android/ios/web)
npm run android     # Android emulator
npm run ios         # iOS simulator
npm run web         # web preview
```

Update the API URL in `app.json` under `expo.extra.apiUrl` to point to your backend. For physical devices on the same network, use your machine's LAN IP (e.g. `http://192.168.1.10:8000/api/v1`).

## Routes

```
app/
├── index.tsx                      Redirect → /tabs
├── _layout.tsx                    Root layout (auth bootstrap, QueryClient)
├── tabs/                          Bottom tabs (logged-in or anonymous)
│   ├── _layout.tsx
│   ├── index.tsx                  Home — hero + horizontal carousels
│   ├── catalog.tsx                Search + course list
│   ├── my-courses.tsx             Enrolled courses with progress bars
│   └── account.tsx                Profile + auth entry
├── auth/                          Login / register stack
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── courses/[id].tsx               Course details + enroll
└── learn/[id].tsx                 Video player + curriculum sidebar
```

## Notes

- Tokens are stored in `expo-secure-store` (Keychain on iOS, KeyStore on Android). The axios client auto-refreshes the access token on 401.
- Paid checkout is not yet wired in the mobile app — students get a friendly message pointing them to the web for Stripe Checkout. Once the backend exposes a native-friendly checkout (e.g. Stripe React Native SDK), wire it into `app/courses/[id].tsx`.
- Future additions called out in the parent README roadmap:
  - Offline downloads via `expo-file-system`
  - Picture-in-Picture playback
  - Push notifications via `expo-notifications`
  - Chromecast / AirPlay support
