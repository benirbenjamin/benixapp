const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('radio_token');
  const headers = {
    ...options.headers,
  };

  // If not sending FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMsg = 'An unexpected error occurred';
    if (data && typeof data === 'object') {
      if (data.error && (data.details || data.message) && data.error !== (data.details || data.message)) {
        errorMsg = `${data.error} (${data.details || data.message})`;
      } else if (data.error) {
        errorMsg = data.error;
      } else if (data.message) {
        errorMsg = data.message;
      }
    } else if (typeof data === 'string') {
      if (data.includes('Vercel Security Checkpoint') || data.includes('verifying your browser')) {
        errorMsg = 'Vercel Security Checkpoint is blocking API calls. The Vercel Firewall / Attack Challenge Mode is active on your domain. Please disable "Attack Challenge Mode" in your Vercel Dashboard (under Security / Firewall).';
      } else if (data.includes('<html') || data.includes('<!DOCTYPE')) {
        errorMsg = `Server error (${response.status} ${response.statusText}). The server returned an HTML error page.`;
      } else {
        errorMsg = data.trim() || `Request failed with status ${response.status}`;
      }
    } else {
      errorMsg = `Request failed with status ${response.status}`;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (endpoint, body) => apiRequest(endpoint, {
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};
