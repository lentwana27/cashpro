// Minimal mock API service for frontend

import { User, Branch, ExchangeRate, DailyReconciliation } from './types';

const API_BASE = '/api';

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const saved = localStorage.getItem('cashup_session');
    if (saved) {
      const { token } = JSON.parse(saved);
      // The server identifies the caller from this signed token only.
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch(e) {}
  return headers;
};

// A 401 on a normal request means the session is missing, expired or from before signed
// sessions existed: clear it and send the user to the login page (once).
let redirectingToLogin = false;
function handleUnauthorized(res: Response, endpoint: string) {
  if (res.status === 401 && !endpoint.startsWith('/auth/') && !redirectingToLogin) {
    redirectingToLogin = true;
    try { localStorage.removeItem('cashup_session'); } catch (e) {}
    window.location.href = '/login';
  }
}

export const api = {
  async delete(endpoint: string, body?: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    
    if (!res.ok) {
      handleUnauthorized(res, endpoint);
      let msg = 'Server error';
      try {
        const data = await res.json();
        if (data.error) msg = data.error;
      } catch(e) {}
      throw new Error(msg);
    }

    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { return {}; }
  },
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) {
      handleUnauthorized(res, endpoint);
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('GET Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.status + ' ' + res.statusText }; }
      throw new Error(err.error || 'Server error');
    }
    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { console.error('GET Parse Error API:', endpoint, textRes.substring(0,50)); throw new Error('Invalid JSON response'); }
  },
  async post(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      handleUnauthorized(res, endpoint);
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('POST Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.status + ' ' + res.statusText }; }
      throw new Error(err.error || 'Server error');
    }
    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { console.error('POST Parse Error API:', endpoint, textRes.substring(0,50)); throw new Error('Invalid JSON response'); }
  },
  async put(endpoint: string, body: any) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      handleUnauthorized(res, endpoint);
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('PUT Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.status + ' ' + res.statusText }; }
      throw new Error(err.error || 'Server error');
    }
    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { console.error('PUT Parse Error API:', endpoint, textRes.substring(0,50)); throw new Error('Invalid JSON response'); }
  }
};
