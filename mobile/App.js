import React, { useEffect, useRef } from 'react';
import { Platform, BackHandler, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native'; // Sentry import

import WebViewScreen from './src/WebViewScreen';
import { initializePurchases } from './src/RevenueCatService';

// Initialize Sentry
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN_HERE', // REPLACE WITH YOUR ACTUAL SENTRY DSN
  tracesSampleRate: 1.0,
});

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializePurchases().catch((error) => {
      console.error('[RevenueCat] Initialization error:', error);
      Sentry.captureException(error); // Capture error with Sentry
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
