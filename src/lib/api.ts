// Minimal mock API service for frontend

import { User, Branch, ExchangeRate, DailyReconciliation } from './types';

const API_BASE = '/api';

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const saved = localStorage.getItem('cashup_session');
    if (saved) {
      const { user } = JSON.parse(saved);
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-name'] = user.name;
      }
    }
  } catch(e) {}
  return headers;
};

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) {
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('GET Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.statusText }; }
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
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('POST Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.statusText }; }
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
      const text = await res.text();
      let err;
      try { err = JSON.parse(text); } catch(e) { console.error('PUT Failed API:', endpoint, 'Status:', res.status, 'Body:', text.substring(0, 50)); err = { error: res.statusText }; }
      throw new Error(err.error || 'Server error');
    }
    const textRes = await res.text();
    try { return JSON.parse(textRes); } catch(e) { console.error('PUT Parse Error API:', endpoint, textRes.substring(0,50)); throw new Error('Invalid JSON response'); }
  }
};
