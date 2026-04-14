# Sports Wager Helper — Mobile Wrapper

A React Native (Expo) app that wraps the Sports Wager Helper web app in a full-screen WebView and adds native in-app purchases via RevenueCat.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 51 |
| WebView | `react-native-webview` |
| IAP | `react-native-purchases` (RevenueCat) |
| Navigation | `@react-navigation/native` + `@react-navigation/stack` |
| Build | EAS Build |

---

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Xcode (iOS builds)
- Android Studio (Android builds)

---

## Installation

```bash
cd mobile
npm install
```

---

## Running Locally

```bash
# Start Metro bundler (opens Expo Go)
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

---

## Building for Production

### iOS

```bash
eas build --platform ios --profile production
```

### Android

```bash
eas build --platform android --profile production
```

### Both platforms at once

```bash
eas build --platform all --profile production
```

---

## Submitting to App Stores

### iOS (App Store)

```bash
eas submit --platform ios
```

### Android (Google Play)

```bash
eas submit --platform android
```

---

## In-App Purchase Product IDs

All three credit packs are already approved on the iOS App Store:

| Product ID | Name |
|---|---|
| `com.sportswagerhelper.credits.25` | 25 Search Credits |
| `com.sportswagerhelper.credits.60` | 60 Search Credits |
| `com.sportswagerhelper.credits.100` | 100 Search Credits |

---

## Android Products Setup

Android purchases will work once the following steps are completed in **Google Play Console**:

1. Go to **Play Console → Sports Wager Helper → Monetize with Play → Products → In-app products**
2. Create these three products using the **exact same product IDs** as iOS:
   - `com.sportswagerhelper.credits.25`
   - `com.sportswagerhelper.credits.60`
   - `com.sportswagerhelper.credits.100`
3. Set prices and activate the products
4. RevenueCat will automatically sync them once the service account permissions are accepted (invitation already sent to RevenueCat's service account)

> **Note:** The Google Cloud org policy currently blocks JSON key creation. Once the RevenueCat service account invitation (`revenue-cat@rc-production.iam.gservice...`) is accepted, RevenueCat will be able to validate Android receipts automatically — no JSON upload required.

The app code handles the case where Android products are not yet available gracefully (empty product list with a user-friendly message).

---

## RevenueCat Configuration

| Setting | Value |
|---|---|
| iOS SDK Key | `appl_gCTrteiTHnaclzveBxPzKFKEbrC` |
| Android SDK Key | `goog_FZSBeUnrDQyPWQloQGdlxAOLRYE` |
| Entitlement ID | `entl5ad30a0ac8` |

---

## WebView ↔ Native Bridge

The web app at `https://sportswagerhelper.base44.app` can trigger native purchase flows by calling:

```javascript
// Open the native purchase sheet for a specific credit pack
window.NativePurchase.buyCredits('com.sportswagerhelper.credits.25');

// Restore previous purchases
window.NativePurchase.restore();

// Check if user has an active entitlement
window.NativePurchase.checkEntitlement();
```

Results are delivered back to the web app via a `NativePurchaseResult` DOM event:

```javascript
document.addEventListener('NativePurchaseResult', (event) => {
  const { type, success, isActive } = event.detail;
  // type: 'PURCHASE_RESULT' | 'RESTORE_RESULT' | 'ENTITLEMENT_RESULT'
});
```

---

## Environment Variables

No environment variables are required at runtime — all keys are bundled in the source code. For a more secure setup in production, consider moving API keys to EAS Secrets:

```bash
eas secret:create --scope project --name REVENUECAT_IOS_KEY --value appl_gCTrteiTHnaclzveBxPzKFKEbrC
eas secret:create --scope project --name REVENUECAT_ANDROID_KEY --value goog_FZSBeUnrDQyPWQloQGdlxAOLRYE
```

Then read them via `expo-constants` and `Constants.expoConfig.extra`.
