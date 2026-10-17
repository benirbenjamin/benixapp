import axios from 'axios';

// Centralized Axios client for Kunda Space API
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Automatically inject JWT token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kunda_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Extracts a human-friendly error string from Axios or network errors.
 * Guaranteed to always return a string and never an object, preventing React child rendering errors.
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';

  // If already a string
  if (typeof error === 'string') {
    return error;
  }

  // If response contains data
  const errData = error.response?.data;
  if (errData) {
    if (typeof errData === 'string') {
      const clean = errData.trim();
      if (clean.includes('FUNCTION_INVOCATION_FAILED')) {
        return 'Server execution error (FUNCTION_INVOCATION_FAILED). The serverless API encountered an issue.';
      }
      // If server returned an HTML error document (e.g. Cloudflare / Vercel Security Checkpoint or WAF page)
      if (
        clean.startsWith('<!DOCTYPE') ||
        clean.startsWith('<html') ||
        clean.includes('<body') ||
        clean.includes('data-astro-cid') ||
        clean.includes('Security Checkpoint')
      ) {
        if (error.response?.status === 403) {
          return 'Access temporarily challenged by cloud security. Please pause for 5 seconds and try again.';
        }
        return `Server temporarily unavailable (HTTP ${error.response?.status || 500}). Please refresh.`;
      }
      return clean;
    }
    if (typeof errData.message === 'string' && errData.message.trim().length > 0) {
      return errData.message.trim();
    }
    if (typeof errData.error === 'string') {
      return errData.error;
    }
    if (typeof errData.error === 'object' && errData.error !== null) {
      if (typeof errData.error.message === 'string') {
        return errData.error.message;
      }
      if (typeof errData.error.code === 'string') {
        return `Error: ${errData.error.code}`;
      }
      try {
        return JSON.stringify(errData.error);
      } catch {
        return 'An error occurred processing the request.';
      }
    }
    if (typeof errData.message === 'object' && errData.message !== null) {
      if (typeof errData.message.message === 'string') {
        return errData.message.message;
      }
      try {
        return JSON.stringify(errData.message);
      } catch {
        return 'An error occurred processing the request.';
      }
    }
    if (typeof errData.code === 'string') {
      return `Error: ${errData.code}`;
    }
    try {
      return JSON.stringify(errData);
    } catch {
      return 'An unexpected error occurred.';
    }
  }

  // If 401 Unauthorized
  if (error.response?.status === 401) {
    return 'Invalid credentials. Please verify your email and password.';
  }

  // If 403 Forbidden
  if (error.response?.status === 403) {
    return 'Access denied. Account is restricted.';
  }

  // If 404 Not Found
  if (error.response?.status === 404) {
    return 'The requested resource or endpoint was not found.';
  }

  // If 500 Internal Server Error
  if (error.response?.status >= 500) {
    return 'Server error. Please try again in a few moments.';
  }

  // If standard Axios error message
  if (typeof error.message === 'string') {
    if (error.message.includes('Network Error')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }

  // If error has code property
  if (typeof error.code === 'string') {
    return `Error: ${error.code}`;
  }

  // If error is an arbitrary object
  if (typeof error === 'object' && error !== null) {
    if (typeof (error as any).error === 'string') {
      return (error as any).error;
    }
    if (typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'An unexpected error occurred.';
    }
  }

  return String(error);
}
