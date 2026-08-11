import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { MiniIcon } from '../components/native/NativeLayout';
import AccountScreen from '../screens/AccountScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import PicksScreen from '../screens/PicksScreen';
import SalScreen from '../screens/SalScreen';
import { colors } from '../theme/nativeTheme';

const Tab = createBottomTabNavigator();
const salImage = require('../../assets/sal.jpeg');

const TAB_META = {
  Home: { label: 'Home', icon: 'home', accent: 'cyan' },
  SAL: { label: 'S.A.L.', central: true },
  Picks: { label: 'Picks', icon: 'bolt', accent: 'green' },
  History: { label: 'History', icon: 'time', accent: 'purple' },
  Account: { label: 'Account', icon: 'person', accent: 'blue' },
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="SAL"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: route.name === 'SAL' ? styles.salTabItem : styles.tabItem,
        tabBarIcon: ({ focused }) => <TabGlyph routeName={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Picks" component={PicksScreen} />
      <Tab.Screen name="SAL" component={SalScreen} options={{ title: 'S.A.L.' }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function TabGlyph({ routeName, focused }) {
  const meta = TAB_META[routeName] || TAB_META.Home;
  const central = meta.central;

  if (central) {
    return (
      <View style={[styles.salGlyph, focused && styles.focusedSalGlyph]}>
        <Image source={salImage} resizeMode="contain" style={styles.salMascot} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.glyph,
        focused && styles.focusedGlyph,
      ]}
    >
      <MiniIcon type={meta.icon} accent={focused ? meta.accent : 'dim'} size={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#07111f',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 86,
    overflow: 'visible',
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: {
    paddingTop: 2,
  },
  salTabItem: {
    paddingTop: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
  glyph: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  salGlyph: {
    alignItems: 'center',
    height: 72,
    justifyContent: 'center',
    marginTop: -34,
    overflow: 'visible',
    width: 72,
  },
  salMascot: {
    height: 82,
    width: 72,
  },
  focusedGlyph: {
    borderColor: colors.cyan,
  },
  focusedSalGlyph: {
    shadowColor: colors.purple,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
