import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../theme/nativeTheme';
import SalAvatar from './SalAvatar';

export function NativeScreen({ children, eyebrow, title, subtitle }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + spacing.md, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children, accent = 'cyan', style }) {
  return (
    <View style={[styles.card, { borderColor: accentColor(accent, 0.55) }, style]}>
      {children}
    </View>
  );
}

export function ActionCard({ title, detail, accent = 'cyan', icon, disabled = false, onPress }) {
  const isInteractive = Boolean(onPress) && !disabled;

  return (
    <Pressable
      disabled={!isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { borderColor: accentColor(disabled ? 'dim' : accent, 0.45) },
        pressed && isInteractive && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.actionMark, { backgroundColor: accentColor(accent, 0.15) }]}>
        {icon ? icon : (
          <Text style={[styles.actionMarkText, { color: accentColor(accent, 1) }]}>
            {title.slice(0, 1)}
          </Text>
        )}
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDetail}>{detail}</Text>
    </Pressable>
  );
}

export function MiniIcon({ type = 'dot', accent = 'cyan', size = 18 }) {
  const color = accentColor(accent, 1);

  if (type === 'home') {
    return (
      <View style={{ height: size, width: size }}>
        <View style={[styles.iconRoof, { borderColor: color }]} />
        <View style={[styles.iconBox, { borderColor: color }]} />
      </View>
    );
  }

  if (type === 'trend') {
    return (
      <View style={{ height: size, width: size }}>
        <View style={[styles.iconTrendBase, { backgroundColor: color }]} />
        <View style={[styles.iconTrendRise, { backgroundColor: color }]} />
        <View style={[styles.iconTrendDot, { backgroundColor: color }]} />
      </View>
    );
  }

  if (type === 'person') {
    return (
      <View style={[styles.iconPerson, { height: size, width: size }]}>
        <View style={[styles.iconPersonHead, { borderColor: color }]} />
        <View style={[styles.iconPersonBody, { borderColor: color }]} />
      </View>
    );
  }

  if (type === 'shield') {
    return <View style={[styles.iconShield, { borderColor: color, height: size, width: size * 0.86 }]} />;
  }

  if (type === 'time') {
    return (
      <View style={[styles.iconClock, { borderColor: color, height: size, width: size }]}>
        <View style={[styles.iconClockHandLong, { backgroundColor: color }]} />
        <View style={[styles.iconClockHandShort, { backgroundColor: color }]} />
      </View>
    );
  }

  if (type === 'bolt') {
    return (
      <View style={{ height: size, width: size }}>
        <View style={[styles.iconBoltTop, { backgroundColor: color }]} />
        <View style={[styles.iconBoltBottom, { backgroundColor: color }]} />
      </View>
    );
  }

  return <View style={[styles.iconDot, { backgroundColor: color, height: size * 0.5, width: size * 0.5 }]} />;
}


export function Pill({ children, accent = 'cyan' }) {
  return (
    <View style={[styles.pill, { borderColor: accentColor(accent, 0.45) }]}>
      <Text style={[styles.pillText, { color: accentColor(accent, 1) }]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({ children, onPress, variant = 'primary', disabled = false }) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}>
        {children}
      </Text>
    </Pressable>
  );
}

export function EmptyState({ label, detail, showSal = false }) {
  return (
    <Card accent="purple" style={styles.emptyState}>
      {showSal ? <SalAvatar size={52} crop="eyes" style={styles.emptyAvatar} /> : null}
      <Text style={styles.emptyLabel}>{label}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </Card>
  );
}

function accentColor(accent, opacity) {
  const hex = colors[accent] || colors.cyan;
  if (opacity >= 1) return hex;

  const value = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hex}${value}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 96,
  },
  header: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.cyan,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  actionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    minHeight: 128,
    padding: spacing.md,
    width: '48%',
  },
  actionMark: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 36,
  },
  actionMarkText: {
    fontSize: 17,
    fontWeight: '900',
  },
  iconRoof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 9,
    left: 4,
    position: 'absolute',
    top: 1,
    transform: [{ rotate: '45deg' }],
    width: 9,
  },
  iconBox: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    bottom: 1,
    height: 10,
    left: 4,
    position: 'absolute',
    width: 10,
  },
  iconTrendBase: {
    bottom: 3,
    height: 2,
    left: 1,
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
    width: 8,
  },
  iconTrendRise: {
    bottom: 6,
    height: 2,
    position: 'absolute',
    right: 2,
    transform: [{ rotate: '-42deg' }],
    width: 12,
  },
  iconTrendDot: {
    borderRadius: 3,
    height: 5,
    position: 'absolute',
    right: 1,
    top: 2,
    width: 5,
  },
  iconPerson: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPersonHead: {
    borderRadius: 5,
    borderWidth: 2,
    height: 8,
    marginBottom: 1,
    width: 8,
  },
  iconPersonBody: {
    borderRadius: 8,
    borderTopWidth: 2,
    height: 7,
    width: 16,
  },
  iconShield: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 2,
  },
  iconClock: {
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 2,
    justifyContent: 'center',
  },
  iconClockHandLong: {
    height: 7,
    position: 'absolute',
    top: 3,
    width: 2,
  },
  iconClockHandShort: {
    height: 2,
    position: 'absolute',
    right: 4,
    top: 8,
    width: 6,
  },
  iconBoltTop: {
    height: 12,
    left: 7,
    position: 'absolute',
    top: 0,
    transform: [{ skewX: '-24deg' }],
    width: 4,
  },
  iconBoltBottom: {
    bottom: 0,
    height: 12,
    left: 6,
    position: 'absolute',
    transform: [{ skewX: '-24deg' }],
    width: 4,
  },
  iconDot: {
    borderRadius: 99,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  actionDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.sm,
    marginRight: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.green,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderBright,
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#06101f',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.48,
  },
  emptyState: {
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
  },
  emptyAvatar: {
    marginBottom: spacing.md,
  },
  emptyLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDetail: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
