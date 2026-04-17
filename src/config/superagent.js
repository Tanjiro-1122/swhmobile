/**
 * Superagent configuration
 * Controls whether to use self-hosted superagent or Base44
 */

export const SUPERAGENT_CONFIG = {
  enabled: import.meta.env.VITE_USE_SUPERAGENT === 'true',
  url: import.meta.env.VITE_SUPERAGENT_URL || 'http://localhost:8000',
};
