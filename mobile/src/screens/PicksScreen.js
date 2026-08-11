import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { Card, EmptyState, NativeScreen, Pill, PrimaryButton } from '../components/native/NativeLayout';
import { selectLatestBettingBrief } from '../lib/supabase';
import { colors, radius, spacing } from '../theme/nativeTheme';

function getRiskFromConfidence(confidence) {
  if (confidence === 'High') return 'Low';
  if (confidence === 'Low') return 'High';
  return 'Medium';
}

function formatDate(value) {
  if (!value) return 'Latest published brief';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest published brief';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PickCard({ pick }) {
  const risk = getRiskFromConfidence(pick?.confidence);

  return (
    <Card accent="cyan" style={styles.pickCard}>
      <View style={styles.pickHeader}>
        {pick?.sport ? <Pill accent="cyan">{pick.sport}</Pill> : null}
        {pick?.odds ? (
          <View style={styles.oddsBox}>
            <Text style={styles.odds}>{pick.odds}</Text>
            <Text style={styles.oddsLabel}>Odds</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.pickTitle}>{pick?.pick || 'Published pick'}</Text>
      {pick?.match ? <Text style={styles.match}>{pick.match}</Text> : null}
      {pick?.reasoning ? <Text style={styles.reasoning}>{pick.reasoning}</Text> : null}
      <View style={[styles.riskBadge, styles[`risk${risk}`] || styles.riskMedium]}>
        <Text style={styles.riskText}>{risk} Risk</Text>
      </View>
    </Card>
  );
}

export default function PicksScreen() {
  const { session } = useAuth();
  const [brief, setBrief] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBrief = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const latestBrief = await selectLatestBettingBrief(session?.access_token);
      setBrief(latestBrief);
    } catch (err) {
      setBrief(null);
      setError(err?.message || 'Daily picks are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  const picks = Array.isArray(brief?.top_picks) ? brief.top_picks.slice(0, 6) : [];

  return (
    <NativeScreen
      eyebrow="Daily Picks"
      title="Daily Picks"
      subtitle="Published BettingBrief picks from the live Sports Wager Helper data layer."
    >
      <View style={styles.metaRow}>
        <Pill accent="green">Real data only</Pill>
        {brief ? <Text style={styles.dateText}>{formatDate(brief.brief_date)}</Text> : null}
      </View>

      {isLoading ? (
        <Card accent="cyan" style={styles.loadingCard}>
          <ActivityIndicator color={colors.cyan} />
          <Text style={styles.loadingText}>Loading latest BettingBrief...</Text>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card accent="orange">
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.retry}>
            <PrimaryButton variant="secondary" onPress={loadBrief}>
              Retry
            </PrimaryButton>
          </View>
        </Card>
      ) : null}

      {!isLoading && !error && picks.length === 0 ? (
        <EmptyState
          showSal
          label="No picks published yet"
          detail="When today's BettingBrief publishes picks, they will appear here from the live SWH data source."
        />
      ) : null}

      {!isLoading && !error && picks.map((pick, index) => (
        <PickCard key={`${pick?.pick || pick?.match || 'pick'}_${index}`} pick={pick} />
      ))}
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dateText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  loadingCard: {
    alignItems: 'center',
    minHeight: 160,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.md,
  },
  errorText: {
    color: '#fed7aa',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retry: {
    marginTop: spacing.md,
  },
  pickCard: {
    overflow: 'hidden',
  },
  pickHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  oddsBox: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  odds: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  oddsLabel: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  match: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  reasoning: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  riskLow: {
    backgroundColor: '#22c55e26',
    borderColor: '#22c55e66',
  },
  riskMedium: {
    backgroundColor: '#eab30826',
    borderColor: '#eab30866',
  },
  riskHigh: {
    backgroundColor: '#ef444426',
    borderColor: '#ef444466',
  },
  riskText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});
