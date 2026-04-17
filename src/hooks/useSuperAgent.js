import { useState, useCallback } from 'react';
import { superagent } from '../api/superagentClient';

export function useSuperAgent(agentFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await agentFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agentFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useMatchPreview() {
  return useSuperAgent(superagent.analyzeMatchPreview.bind(superagent));
}

export function useParlayBuilder() {
  return useSuperAgent(superagent.generateParlay.bind(superagent));
}

export function useDailyBrief() {
  return useSuperAgent(superagent.generateDailyBrief.bind(superagent));
}

export function useAskSAL() {
  return useSuperAgent(superagent.askSAL.bind(superagent));
}

export function usePlayerStats() {
  return useSuperAgent(superagent.getPlayerStats.bind(superagent));
}

export function useTeamStats() {
  return useSuperAgent(superagent.getTeamStats.bind(superagent));
}

export function useOddsAnalysis() {
  return useSuperAgent(superagent.analyzeOddsValue.bind(superagent));
}
