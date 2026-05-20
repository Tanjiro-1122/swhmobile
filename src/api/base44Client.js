// src/api/base44Client.js — DEPRECATED STUB
// Base44 SDK has been fully removed. This file exists only to prevent import errors
// during the transition period. Remove it after confirming no imports remain.
// All functionality has been migrated to:
//   - Auth:       src/lib/AuthContext.jsx + supabase.auth
//   - Entities:   src/api/db.js
//   - LLM:        src/api/integrations.js (direct OpenAI)
//   - Backend:    /api/* Vercel routes

export const base44 = {
  auth: {
    me: () => JSON.parse(localStorage.getItem('swh_user') || 'null'),
    isAuthenticated: () => !!localStorage.getItem('swh_user'),
    getToken: () => localStorage.getItem('swh_auth_token'),
    setToken: () => {},
    logout: () => { localStorage.removeItem('swh_user'); window.location.href = '/'; },
    signOut: () => { localStorage.removeItem('swh_user'); window.location.href = '/'; },
  },
  entities: {},
  functions: {
    invoke: async (name, args) => {
      const res = await fetch(`/api/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      return { data: await res.json() };
    },
  },
  integrations: {
    Core: {
      InvokeLLM: async (args) => {
        const { InvokeLLM } = await import('./integrations');
        return InvokeLLM(args);
      },
    },
  },
};
