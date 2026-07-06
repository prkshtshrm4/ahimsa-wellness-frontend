// ID token from Firebase Auth. Surfaces the API error envelope as ApiError.

const TOKEN_KEY = 'ahimsa.token';

/** API origin. Empty in dev (Vite proxy). Set VITE_API_URL on Vercel to your Railway URL. */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE}/v1${path}`;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) throw new ApiError(res.status, 'error', res.statusText);
    return res;
  }

  const data = await res.json();
  if (!res.ok) {
    const e = data.error || {};
    throw new ApiError(res.status, e.code || 'error', e.message, e.details);
  }
  return data;
}

export const api = {
  get: (p, opts) => request('GET', p, undefined, opts),
  post: (p, b, opts) => request('POST', p, b, opts),
  patch: (p, b, opts) => request('PATCH', p, b, opts),
  del: (p, opts) => request('DELETE', p, undefined, opts),
  // Build an authenticated URL for direct navigation (e.g. PDF in a new tab).
  authedUrl: (p) => {
    const t = getToken();
    return `/v1${p}${p.includes('?') ? '&' : '?'}`; // token is header-only; use fetch+blob for PDFs
  },
};

// Fetch a PDF (auth header) and open it as a blob URL.
export async function openPdf(path) {
  const token = getToken();
  const res = await fetch(apiUrl(path), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError(res.status, 'error', 'Could not load PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
