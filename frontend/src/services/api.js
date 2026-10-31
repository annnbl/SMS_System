const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('brightloop_token');
export const setAuthToken = (token) => localStorage.setItem('brightloop_token', token);
export const getRefreshToken = () => localStorage.getItem('brightloop_refresh_token');
export const setRefreshToken = (token) => localStorage.setItem('brightloop_refresh_token', token);
export const removeTokens = () => {
  localStorage.removeItem('brightloop_token');
  localStorage.removeItem('brightloop_refresh_token');
  localStorage.removeItem('brightloop_user');
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  let response = await fetch(url, { ...options, headers });

  // Handle Token Expiry & Automatic Refresh
  if (response.status === 401) {
    const errorData = await response.clone().json().catch(() => ({}));
    if (errorData.code === 'TOKEN_EXPIRED') {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            setAuthToken(refreshData.data.accessToken);
            setRefreshToken(refreshData.data.refreshToken);
            // Retry original request with new token
            headers.Authorization = `Bearer ${refreshData.data.accessToken}`;
            response = await fetch(url, { ...options, headers });
          } else {
            removeTokens();
            window.location.href = '/login';
          }
        } catch {
          removeTokens();
          window.location.href = '/login';
        }
      } else {
        removeTokens();
      }
    }
  }

  return response;
};

export const api = {
  get: async (endpoint) => {
    const res = await apiFetch(endpoint);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  },
  post: async (endpoint, body) => {
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  },
  put: async (endpoint, body) => {
    const res = await apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  },
  delete: async (endpoint) => {
    const res = await apiFetch(endpoint, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  },
  downloadPdf: async (endpoint, filename = 'invoice.pdf') => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) throw new Error('Failed to download PDF document');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
};
