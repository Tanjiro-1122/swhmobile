import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [swhUser, setSwhUser] = useState(null); // our swh_users row
  const [isLoading, setIsLoading] = useState(true);

  // Load swh_users profile for the current user
  const loadSwhUser = async (supabaseUser) => {
    if (!supabaseUser) { setSwhUser(null); return; }
    try {
      const res = await fetch('/api/lookupAccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: supabaseUser.email })
      });
      const data = await res.json();
      if (data.success && data.user) setSwhUser(data.user);
    } catch (e) {
      console.error('loadSwhUser error:', e);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadSwhUser(session?.user ?? null).finally(() => setIsLoading(false));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadSwhUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSwhUser(null);
    // Clear legacy localStorage keys
    try {
      localStorage.removeItem('swh_user');
      localStorage.removeItem('swh_auth_token');
    } catch {}
  };

  const isAuthenticated = !!user;
  const isPro = swhUser?.is_pro || swhUser?.subscription_type === 'pro' || swhUser?.subscription_type === 'annual';

  return (
    <AuthContext.Provider value={{ user, session, swhUser, isLoading, isAuthenticated, isPro, signOut, refreshUser: () => loadSwhUser(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
