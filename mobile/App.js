import React, { useEffect, useRef } from 'react';
import { Platform, BackHandler, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';

import WebViewScreen from './src/WebViewScreen';
import { initializePurchases } from './src/RevenueCatService';

// Initialize Sentry
// The DSN is managed via environment variables in eas.json or .env
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://dummydsn@o4505578434330624.ingest.sentry.io/4505578436198400',
  tracesSampleRate: 1.0,
});

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializePurchases().catch((error) => {
      console.error('[RevenueCat] Initialization error:', error);
      Sentry.captureException(error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="WebView" component={WebViewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
