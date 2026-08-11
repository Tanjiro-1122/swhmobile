import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  NativeScreen,
  PrimaryButton,
} from '../components/native/NativeLayout';
import { useAuth } from '../auth/AuthContext';
import { formatPlanName, getAccessModel } from '../lib/access';
import PurchaseModal from '../PurchaseModal';
import { colors, spacing } from '../theme/nativeTheme';

export default function AccountScreen() {
  const { account, refreshAccount, signOut } = useAuth();
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const access = getAccessModel(account);
  const plan = formatPlanName(account);

  const handlePurchaseComplete = () => {
    refreshAccount();
    setTimeout(refreshAccount, 3500);
    setTimeout(refreshAccount, 9000);
  };

  return (
    <>
      <NativeScreen
        eyebrow="Profile and Credits"
        title="Account"
        subtitle="Your native account is connected to the same Sports Wager Helper profile used on the web."
      >
      <Card accent="blue">
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.email}>{account?.email || 'Unknown account'}</Text>
        <View style={styles.divider} />
        <InfoRow label="Plan" value={plan} />
        <InfoRow
          label={access.isUnlimited ? 'Access' : 'Search credits'}
          value={access.label}
        />
        <InfoRow label="SWH profile ID" value={account?.swhUserId || 'Unavailable'} muted />
        {account?.isAdmin ? <Text style={styles.adminBadge}>Admin account</Text> : null}
      </Card>

      {access.isUnlimited ? (
        <Card accent="green">
          <Text style={styles.sectionTitle}>Unlimited access active</Text>
          <Text style={styles.body}>
            Your plan does not need consumable search credits for S.A.L. lookups.
          </Text>
        </Card>
      ) : (
        <PrimaryButton onPress={() => setPurchaseOpen(true)}>
          Buy Credits
        </PrimaryButton>
      )}

      <View style={styles.secondaryActions}>
        <PrimaryButton variant="secondary" onPress={refreshAccount}>
          Refresh Account
        </PrimaryButton>
      </View>

      <View style={styles.secondaryActions}>
        <PrimaryButton variant="secondary" onPress={signOut}>
          Sign Out
        </PrimaryButton>
      </View>
      </NativeScreen>
      <PurchaseModal
        visible={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </>
  );
}

function InfoRow({ label, value, muted }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, muted && styles.mutedValue]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  email: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: spacing.md,
    textAlign: 'right',
  },
  mutedValue: {
    color: colors.dim,
    fontSize: 12,
  },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.purple}22`,
    borderColor: colors.purple,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryActions: {
    marginTop: spacing.sm,
  },
});
