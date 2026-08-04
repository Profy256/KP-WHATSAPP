import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  // The API host sleeps idle instances, and a cold boot (container start +
  // migrations + a serverless database waking up) can take the better part of a
  // minute. Without a ceiling the browser hangs indefinitely; with one we can
  // tell the user what is actually happening.
  timeout: 90_000,
});

/**
 * Pings the API's liveness endpoint to start a cold boot early.
 *
 * Call this when a page that will soon POST to the API mounts (the login form,
 * say). By the time the user has typed their details the instance is usually
 * awake, so the request that matters doesn't eat the cold-start wait — which is
 * what turned signups into "Authentication failed".
 */
export function warmUp() {
  return api.get('/health', { timeout: 90_000 }).catch(() => {});
}

/** Turns an axios failure into something a user can act on. */
export function authErrorMessage(err: unknown, fallback: string) {
  const e = err as { code?: string; response?: { data?: { error?: string } } };
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.code === 'ECONNABORTED') {
    return 'The server is taking too long to respond — it may be waking up. Please try again in a moment.';
  }
  if (e?.code === 'ERR_NETWORK') {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return fallback;
}

api.interceptors.request.use((config) => {
  const token = Cookies.get('profy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an expired/invalid token, clear it and send the user back to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('profy_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
