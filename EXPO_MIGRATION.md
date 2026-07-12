# SWHmobile Expo Migration

## Decision

The existing application remains the production Vite/Base44 web app. A new Expo application will live in `mobile/` and consume the existing authentication, API, database, and purchase services.

This avoids converting browser-only components and Radix UI code directly into React Native, which would break the current app.

## Target architecture

```text
swhmobile/
├── src/                    # Existing Vite/Base44 web application
├── mobile/                 # Expo / React Native application
├── api or remote backend   # Existing protected server endpoints
└── shared/                 # Future platform-neutral types and schemas
```

## Phase 1 — Foundation

1. Generate a current Expo Router project inside `mobile/`.
2. Preserve the existing Apple bundle identifier and Android package name.
3. Add separate development, preview, and production EAS profiles.
4. Configure environment variables for public client configuration only.
5. Add a health screen that verifies the mobile app can reach the existing backend.

## Phase 2 — Authentication

1. Connect the mobile app to the same user identity system used by SWH.
2. Store sessions with native secure storage.
3. Verify login, logout, token refresh, and account restoration.
4. Never include service-role, AI-provider, webhook, or other server secrets in the app bundle.

## Phase 3 — Native feature migration

Migrate in this order:

1. Login and onboarding
2. Chat
3. Betting journal
4. Account limits and tier status
5. Purchases and restore purchases
6. Notifications
7. Mood and avatar features

Browser-only UI libraries currently used by the Vite app must be replaced with React Native components. Business rules, validation schemas, and API contracts can be shared after browser dependencies are separated.

## Phase 4 — Purchases

RevenueCat/native purchases require an Expo development build rather than Expo Go. Purchase credit assignment must remain server-authoritative and idempotent.

Required purchase tests:

- New purchase
- Cancelled purchase
- Restore purchase
- Duplicate webhook delivery
- Same account on another device
- Logout and login
- Anonymous-to-authenticated account transition
- Consumable credit granted exactly once

## Phase 5 — Store replacement

The Expo build should replace the existing store app only after bundle identifiers, signing, authentication, purchases, deep links, and production API access are verified. Until then, the current production build remains untouched.

## Immediate next implementation task

Create the Expo Router project in `mobile/`, add a backend health check, and configure identifiers using the values from the existing App Store Connect and Google Play listings.
