import React, { useEffect, useRef } from 'react';
import { Platform, BackHandler, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Purchases from 'react-native-purchases';

import WebViewScreen from './src/WebViewScreen';

const REVENUECAT_API_KEY_IOS = 'appl_gCTrteiTHnaclzveBxPzKFKEbrC';
const REVENUECAT_API_KEY_ANDROID = 'goog_FZSBeUnrDQyPWQloQGdlxAOLRYE';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initRevenueCat();
  }, []);

  const initRevenueCat = async () => {
    try {
      const apiKey =
        Platform.OS === 'ios'
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;

      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey });
      console.log('[RevenueCat] Initialized successfully');
    } catch (error) {
      console.error('[RevenueCat] Initialization error:', error);
    }
  };

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
