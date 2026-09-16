import { getEnvVar } from './utils/env';

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const resolveDefaultApiUrl = (): string => {
  const envUrl = getEnvVar('VITE_API_URL');
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (isLocalhost) {
    return 'http://localhost:3000/api';
  }

  if (isBrowser) {
    console.warn(
      '[Chatly] VITE_API_URL is not set. In production, configure VITE_API_URL in your Vercel project environment variables.'
    );
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:3000/api';
};

const resolveDefaultSocketUrl = (): string => {
  const envUrl = getEnvVar('VITE_SOCKET_URL');
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  const apiUrl = getEnvVar('VITE_API_URL');
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (isLocalhost) {
    return 'http://localhost:3000';
  }

  if (isBrowser) {
    return window.location.origin;
  }

  return 'http://localhost:3000';
};

export const API_BASE_URL = resolveDefaultApiUrl();
export const SOCKET_URL = resolveDefaultSocketUrl();


export const TOAST_DURATION = 3000;
export const DEBOUNCE_DELAY = 300;
export const TYPING_TIMEOUT = 3000;
export const MESSAGE_PAGE_SIZE = 50;

export const APP_NAME = "Chatly";

export const SPECIAL_CHAR_PASS_FILTER = /[!@#$%^&*()_+\-=$$$${};':"\\|,.<>/?]/;

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
} as const;

export const FRIEND_REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  BLOCKED: 'blocked',
} as const;

export const MESSAGE_ACTIONS = {
  SEND: 'send',
  EDIT: 'edit',
  DELETE: 'delete',
  REPLY: 'reply',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Please log in to continue',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_INPUT: 'Please check your input and try again.',
  NOT_FOUND: 'Resource not found.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  MESSAGE_SENT: 'Message sent',
  FRIEND_REQUEST_SENT: 'Friend request sent',
  FRIEND_REQUEST_ACCEPTED: 'Friend request accepted',
} as const;