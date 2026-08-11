import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import SalAvatar from '../components/native/SalAvatar';
import { colors, spacing } from '../theme/nativeTheme';

export default function LoadingScreen() {
  return (
    <View style={styles.root}>
      <SalAvatar size={96} crop="portrait" />
      <ActivityIndicator color={colors.cyan} style={styles.spinner} />
      <Text style={styles.text}>Waking S.A.L.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  spinner: {
    marginTop: spacing.lg,
  },
  text: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.md,
  },
});

