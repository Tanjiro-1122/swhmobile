import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { colors, radius, spacing } from '../theme/nativeTheme';

const salImage = require('../../assets/sal.jpeg');

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { sendEmailCode, signInWithApple, verifyEmailCode } = useAuth();
  const [mode, setMode] = useState('welcome');
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const intent = mode === 'signup' ? 'signup' : 'login';
  const title = useMemo(() => {
    if (mode === 'signup') return step === 'code' ? 'Verify your new account' : 'Create account';
    if (mode === 'login') return step === 'code' ? 'Enter your code' : 'Log in to SWH';
    return 'S.A.L. in your pocket';
  }, [mode, step]);

  const startEmailFlow = (nextMode) => {
    setMode(nextMode);
    setStep('email');
    setCode('');
    setError('');
  };

  React.useEffect(() => {
    if (Platform.OS !== 'android' || mode === 'welcome') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'code') {
        setStep('email');
        setCode('');
      } else {
        setMode('welcome');
      }
      setError('');
      return true;
    });
    return () => subscription.remove();
  }, [mode, step]);

  const sendCode = async () => {
    setError('');
    setIsWorking(true);
    try {
      await sendEmailCode({ email, intent });
      setStep('code');
    } catch (err) {
      setError(err?.message || 'Could not send the code.');
    } finally {
      setIsWorking(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    setIsWorking(true);
    try {
      await verifyEmailCode({ email, code, intent });
    } catch (err) {
      setError(err?.message || 'Invalid or expired code.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleApple = async () => {
    setError('');
    setIsWorking(true);
    try {
      await signInWithApple();
    } catch (err) {
      if (err?.code !== 'ERR_REQUEST_CANCELED' && err?.code !== 'ERR_CANCELED') {
        setError(err?.message || 'Apple Sign-In failed.');
      }
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + spacing.md, spacing.xl) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={salImage} resizeMode="contain" style={styles.owl} />
          <Text style={styles.eyebrow}>Sports Wager Helper</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Fast lookups, credit-powered research, and the same account you use
            on SportsWagerHelper.com.
          </Text>
        </View>

        {mode === 'welcome' ? (
          <View style={styles.card}>
            {Platform.OS === 'ios' ? (
              <AuthButton
                label="Continue with Apple"
                onPress={handleApple}
                disabled={isWorking}
                variant="apple"
              />
            ) : null}
            <AuthButton
              label="Log in to existing SWH account"
              onPress={() => startEmailFlow('login')}
              disabled={isWorking}
            />
            <AuthButton
              label="Create account"
              onPress={() => startEmailFlow('signup')}
              disabled={isWorking}
              variant="secondary"
            />
            {isWorking ? <ActivityIndicator color={colors.cyan} style={styles.loader} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.formTitle}>
              {step === 'email'
                ? (intent === 'signup' ? 'Start with email' : 'Enter your account email')
                : `Code sent to ${email.trim().toLowerCase()}`}
            </Text>
            {step === 'email' ? (
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!isWorking}
                inputMode="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.dim}
                style={styles.input}
                value={email}
              />
            ) : (
              <TextInput
                editable={!isWorking}
                inputMode="numeric"
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                placeholderTextColor={colors.dim}
                style={[styles.input, styles.codeInput]}
                value={code}
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AuthButton
              label={step === 'email'
                ? (intent === 'signup' ? 'Send signup code' : 'Send login code')
                : 'Verify code'}
              onPress={step === 'email' ? sendCode : verifyCode}
              disabled={isWorking || (step === 'code' && code.length < 6)}
            />

            <Pressable
              onPress={() => {
                if (step === 'code') {
                  setStep('email');
                  setCode('');
                } else {
                  setMode('welcome');
                }
                setError('');
              }}
              style={styles.backButton}
            >
              <Text style={styles.backText}>{step === 'code' ? 'Use a different email' : 'Back'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthButton({ label, onPress, disabled, variant = 'primary' }) {
  const isApple = variant === 'apple';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.authButton,
        isApple && styles.appleButton,
        isSecondary && styles.secondaryButton,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={[styles.authButtonText, isApple && styles.appleButtonText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  owl: {
    height: 300,
    marginBottom: spacing.md,
    width: '100%',
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderBright,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderBright,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  authButton: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: radius.md,
    minHeight: 54,
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  appleButton: {
    backgroundColor: colors.text,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderBright,
    borderWidth: 1,
  },
  authButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  appleButtonText: {
    color: '#000000',
  },
  pressed: {
    opacity: 0.72,
  },
  backButton: {
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  backText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  error: {
    color: '#fecaca',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  loader: {
    marginTop: spacing.md,
  },
});
