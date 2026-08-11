import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import {
  ActionCard,
  Card,
  MiniIcon,
  NativeScreen,
  Pill,
  PrimaryButton,
} from '../components/native/NativeLayout';
import { useAuth } from '../auth/AuthContext';
import { getAccessModel } from '../lib/access';
import { colors, spacing } from '../theme/nativeTheme';

const salImage = require('../../assets/sal.jpeg');

export default function HomeScreen({ navigation }) {
  const { account } = useAuth();
  const access = getAccessModel(account);

  return (
    <NativeScreen
      eyebrow="Sports Wager Helper"
      title="S.A.L. in your pocket"
      subtitle="Fast sports questions, quick reads, and credit-powered lookups in a native companion built for game day."
    >
      <Card accent="green">
        <Image source={salImage} resizeMode="contain" style={styles.fullOwl} />
        <View style={styles.brandRow}>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>SWH Mobile</Text>
            <Text style={styles.brandSubtitle}>Your quick sports intelligence desk</Text>
          </View>
          <Pill accent="cyan">Native</Pill>
        </View>
        <Text style={styles.body}>
          Start with a fast lookup, then open the full website whenever you need
          the complete research workstation.
        </Text>
      </Card>

      <View style={styles.actionGrid}>
        <ActionCard
          title="Today's Games"
          detail="Jump into the slate before kickoff."
          accent="cyan"
          icon={<MiniIcon type="time" accent="cyan" size={18} />}
        />
        <ActionCard
          title="Best Odds"
          detail="Scan the market before you decide."
          accent="blue"
          icon={<MiniIcon type="trend" accent="blue" size={18} />}
        />
        <ActionCard
          title="Player Lookup"
          detail="Ask S.A.L. for a quick player read."
          accent="purple"
          icon={<MiniIcon type="person" accent="purple" size={18} />}
        />
        <ActionCard
          title="Team Lookup"
          detail="Check context before the matchup."
          accent="green"
          icon={<MiniIcon type="shield" accent="green" size={18} />}
        />
      </View>

      <Card accent="cyan">
        <Text style={styles.sectionTitle}>Credits</Text>
        <Text style={styles.creditValue}>{access.label}</Text>
        <Text style={styles.body}>
          {access.isUnlimited
            ? 'Your plan includes unlimited S.A.L. lookups. No credit spend is required.'
            : 'Your mobile credits power quick S.A.L. lookups. Buy more credits from the native Account tab.'}
        </Text>
      </Card>

      <PrimaryButton variant="secondary" onPress={() => navigation.navigate('WebView')}>
        Advanced Research
      </PrimaryButton>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  fullOwl: {
    alignSelf: 'center',
    height: 240,
    marginBottom: spacing.md,
    width: '100%',
  },
  brandCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2,
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  creditValue: {
    color: colors.green,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
});
