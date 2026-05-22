// src/api/base44Client.js — Supabase compatibility client
// Keeps legacy `base44.entities.*` / `base44.functions.invoke(...)` imports working
// while routing app data through the Supabase-backed entity layer.

import * as entities from './db';

export const base44 = {
  auth: {
    me: () => JSON.parse(localStorage.getItem('swh_user') || 'null'),
    isAuthenticated: () => !!localStorage.getItem('swh_user'),
    getToken: () => localStorage.getItem('swh_auth_token'),
    setToken: () => {},
    logout: () => { localStorage.removeItem('swh_user'); window.location.href = '/'; },
    signOut: () => { localStorage.removeItem('swh_user'); window.location.href = '/'; },
  },
  entities,
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
