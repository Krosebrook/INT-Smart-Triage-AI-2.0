import { getDemoProxyKey } from './sessionState.js';

const DEMO_ENDPOINT = '/api/demo-data';

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const proxyKey = getDemoProxyKey();
  if (proxyKey) {
    headers['X-Demo-Auth'] = proxyKey;
  }
  return headers;
}

export async function fetchDemoData(resource, params = {}) {
  try {
    const response = await fetch(DEMO_ENDPOINT, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ resource, params })
    });

    if (!response.ok) {
      const message = await response.text();
      return { data: null, error: new Error(message || 'Demo API error') };
    }

    const payload = await response.json();
    return { data: payload.data ?? null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
