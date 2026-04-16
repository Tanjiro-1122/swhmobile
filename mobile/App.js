import React, { useEffect, useRef } from 'react';
import { Platform, BackHandler, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

import WebViewScreen from './src/WebViewScreen';
import { initializePurchases } from './src/RevenueCatService';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializePurchases().catch((error) => {
      console.error('[RevenueCat] Initialization error:', error);
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
