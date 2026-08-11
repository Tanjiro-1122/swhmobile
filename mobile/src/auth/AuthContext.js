import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { loginUser } from '../RevenueCatService';
import {
  clearStoredSession,
  getAuthUser,
  getStoredSession,
  refreshStoredSession,
  resolveMobileProfile,
  selectSwhProfileByAppleUserId,
  selectSwhProfileByEmail,
  signInWithAppleIdToken,
  signOutAuth,
  storeSession,
  SWH_API_BASE,
  updateAuthUser,
} from '../lib/supabase';

const AuthContext = createContext(null);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || '').split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(global.atob ? global.atob(padded) : '');
  } catch (_error) {
    return null;
  }
}

function getAppleSubjectFromAuthUser(authUser) {
  return String(
    authUser?.identities?.find?.((identity) => identity.provider === 'apple')?.identity_data?.sub ||
    '',
  ).trim();
}

function mergeUserAndProfile(authUser, profile) {
  const email = normalizeEmail(authUser?.email || profile?.email);
  return {
    authId: authUser?.id || null,
    email,
    profile: profile || null,
    swhUserId: profile?.id || authUser?.id || null,
    displayName: profile?.display_name || authUser?.user_metadata?.full_name || null,
    subscriptionType: profile?.subscription_type || 'free',
    isPro: profile?.is_pro === true,
    isAdmin: profile?.is_admin === true,
    credits: Number(profile?.credits ?? profile?.search_credits ?? 0),
    searchCredits: Number(profile?.search_credits ?? profile?.credits ?? 0),
  };
}

async function postEmailLogin(payload) {
  const response = await fetch(`${SWH_API_BASE}/api/emailLogin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || 'Authentication failed. Please try again.');
  }
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const associateRevenueCat = useCallback(async (resolvedAccount) => {
    if (!resolvedAccount?.swhUserId) return;
    try {
      await loginUser(resolvedAccount.swhUserId);
    } catch (error) {
      console.warn('[Auth] RevenueCat identity link failed:', error?.message);
    }
  }, []);

  const resolveProfile = useCallback(async (authUser, accessToken, options = {}) => {
    const email = normalizeEmail(authUser?.email);
    const appleUserId = String(
      getAppleSubjectFromAuthUser(authUser) ||
      options.appleSubject ||
      options.appleUserId ||
      '',
    ).trim();

    let finalProfile = null;
    if (appleUserId) {
      finalProfile = await resolveMobileProfile(accessToken);
    }
    if (!finalProfile && appleUserId) {
      finalProfile = await selectSwhProfileByAppleUserId(appleUserId, accessToken);
    }
    if (!finalProfile && email) {
      finalProfile = await selectSwhProfileByEmail(email, accessToken);
    }

    if (!finalProfile && options.requireExistingProfile) {
      throw new Error(
        'Apple Sign-In worked, but no matching SWH profile was found. Log in with email first, then contact support to link Apple safely.',
      );
    }

    const resolved = mergeUserAndProfile(authUser, finalProfile);
    await associateRevenueCat(resolved);
    return resolved;
  }, [associateRevenueCat]);

  const refreshAccount = useCallback(async () => {
    let nextSession = await getStoredSession();

    if (nextSession?.expires_at && nextSession.expires_at - 60 <= Math.floor(Date.now() / 1000)) {
      if (nextSession.refresh_token) {
        nextSession = await refreshStoredSession(nextSession.refresh_token);
      } else {
        await clearStoredSession();
        nextSession = null;
      }
    }

    setSession(nextSession);

    if (!nextSession?.access_token) {
      setAccount(null);
      return null;
    }

    const authUser = nextSession.user || await getAuthUser(nextSession.access_token);
    const resolved = await resolveProfile(authUser, nextSession.access_token);
    if (!nextSession.user) {
      nextSession = await storeSession({ ...nextSession, user: authUser });
      setSession(nextSession);
    }
    setAccount(resolved);
    return resolved;
  }, [resolveProfile]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const resolved = await refreshAccount();
        if (isMounted && resolved) setAuthError('');
      } catch (error) {
        if (isMounted) setAuthError(error?.message || 'Could not restore session.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [refreshAccount, resolveProfile]);

  const sendEmailCode = useCallback(async ({ email, intent }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error('Enter your email address.');

    await postEmailLogin({
      action: 'send_code',
      email: normalizedEmail,
      intent: intent === 'signup' ? 'signup' : 'login',
    });
  }, []);

  const verifyEmailCode = useCallback(async ({ email, code, intent }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) throw new Error('Enter your email address.');
    if (!code) throw new Error('Enter the code from your email.');

    const data = await postEmailLogin({
      action: 'verify_code',
      email: normalizedEmail,
      code: String(code).trim(),
      intent: intent === 'signup' ? 'signup' : 'login',
    });

    if (!data.access_token || !data.refresh_token) {
      throw new Error('The sign-in code was accepted, but no session was returned.');
    }

    const nextSession = await storeSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });

    const resolved = mergeUserAndProfile(nextSession?.user || data.user, data.profile || null);
    setSession(nextSession || null);
    setAccount(resolved);
    await associateRevenueCat(resolved);
    return resolved;
  }, [associateRevenueCat]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is available on iPhone and iPad.');
    }

    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) throw new Error('Apple Sign-In is not available on this device.');

    const rawNonce = Array.from(
      await Crypto.getRandomBytesAsync(32),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    const claims = decodeJwtPayload(credential.identityToken);
    console.log('[Auth] Apple credential received', {
      audience: claims?.aud || 'unknown',
      issuer: claims?.iss || 'unknown',
      hasEmail: Boolean(claims?.email || credential.email),
      hasNonce: Boolean(claims?.nonce),
      appleUserPresent: Boolean(credential.user),
    });

    let appleSession;
    try {
      appleSession = await signInWithAppleIdToken({
        identityToken: credential.identityToken,
        nonce: rawNonce,
      });
    } catch (error) {
      console.warn('[Auth] Supabase Apple sign-in failed', {
        status: error?.status,
        code: error?.code,
        message: error?.message,
        audience: claims?.aud || 'unknown',
        hasNonce: Boolean(claims?.nonce),
      });
      throw error;
    }

    const givenName = credential.fullName?.givenName || '';
    const familyName = credential.fullName?.familyName || '';
    const fullName = [givenName, familyName].filter(Boolean).join(' ');
    if (fullName) {
      await updateAuthUser(appleSession.access_token, {
          full_name: fullName,
          given_name: givenName || undefined,
          family_name: familyName || undefined,
      }).catch(() => {});
    }

    const displayName = fullName || null;
    const authUser = appleSession.user || await getAuthUser(appleSession.access_token);
    const resolved = await resolveProfile(authUser, appleSession.access_token, {
      appleUserId: credential.user || null,
      appleSubject: claims?.sub || null,
      displayName,
    });
    const storedAppleSession = await storeSession({ ...appleSession, user: authUser });
    setSession(storedAppleSession || null);
    setAccount(resolved);
    return resolved;
  }, [resolveProfile]);

  const signOut = useCallback(async () => {
    await signOutAuth(session?.access_token);
    setSession(null);
    setAccount(null);
  }, [session?.access_token]);

  const value = useMemo(() => ({
    account,
    authError,
    isAuthenticated: Boolean(session?.user && account),
    isLoading,
    refreshAccount,
    sendEmailCode,
    session,
    signInWithApple,
    signOut,
    verifyEmailCode,
  }), [
    account,
    authError,
    isLoading,
    refreshAccount,
    sendEmailCode,
    session,
    signInWithApple,
    signOut,
    verifyEmailCode,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
