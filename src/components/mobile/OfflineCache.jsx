import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// This component runs in the background to cache data for offline use
export default function OfflineCache() {
  // Cache recent matches
  useQuery({
    queryKey: ['offlineMatches'],
    queryFn: async () => {
      const matches = await base44.entities.Match.list('-created_date', 20);
      localStorage.setItem('cachedMatches', JSON.stringify({
        data: matches,
        timestamp: Date.now()
      }));
      return matches;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Cache user data
  useQuery({
    queryKey: ['offlineUser'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        localStorage.setItem('cachedUser', JSON.stringify({
          data: user,
          timestamp: Date.now()
        }));
        return user;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  return null;
}

// Utility functions to get cached data when offline
export const getCachedMatches = () => {
  try {
    const cached = localStorage.getItem('cachedMatches');
    if (!cached) return [];
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return cached data if less than 1 hour old
    if (age < 60 * 60 * 1000) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
};

export const getCachedUser = () => {
  try {
    const cached = localStorage.getItem('cachedUser');
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return cached data if less than 24 hours old
    if (age < 24 * 60 * 60 * 1000) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};