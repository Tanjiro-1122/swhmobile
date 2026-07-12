# SWHmobile Native App Setup

This directory is reserved for the Expo/React Native client. The existing repository root remains the Vite/Base44 web application.

## Bootstrap

From the repository root, generate the current Expo Router template in a temporary directory:

```bash
npx create-expo-app@latest swhmobile-expo-temp
```

Retain the Expo Router template, then move the generated project files into `mobile/`.

Do not commit real secret values. Only variables intentionally exposed to the mobile client may use the `EXPO_PUBLIC_` prefix.

## Native build requirement

Use an Expo development build for RevenueCat, secure native modules, and production-like testing. Expo Go is useful for basic interface work but is not the final purchase-testing environment.
