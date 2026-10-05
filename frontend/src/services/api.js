// src/services/api.js
// Thin fetch wrapper for the Silas backend.
// Access token is held in memory (module scope) — never in localStorage.
// Refresh uses the HttpOnly cookie set by POST /api/auth/login.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/**
 * Low-level request helper.
 * - Always sends credentials so the refresh cookie travels.
 * - Attaches Bearer token when present.
 * - Throws an Error with .status and .body on non-2xx.
 */
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 204 No Content
  if (res.status === 204) {
    return null;
  }

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (body && (body.message || body.error)) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

// ── Auth endpoints ──────────────────────────────────────────────

/**
 * POST /api/auth/login
 * body: { emailOrUsername, password }
 * returns: { accessToken, user }
 * side-effect: sets HttpOnly refresh cookie + stores accessToken in memory
 */
export async function login(emailOrUsername, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername, password }),
  });
  if (data?.accessToken) {
    setAccessToken(data.accessToken);
  }
  return data;
}

/**
 * POST /api/auth/refresh
 * uses HttpOnly cookie; returns { accessToken }
 */
export async function refresh() {
  const data = await request('/auth/refresh', { method: 'POST' });
  if (data?.accessToken) {
    setAccessToken(data.accessToken);
  }
  return data;
}

/**
 * POST /api/auth/logout
 * clears refresh cookie on server + clears in-memory token
 */
export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    clearAccessToken();
  }
}

/**
 * GET /api/auth/me
 * returns the current user (requires valid access token)
 */
export async function getMe() {
  return request('/auth/me', { method: 'GET' });
}

export { request, API_BASE };

// ─── Client API helpers (T17) ───────────────────────────────────────────────

export async function getEquipment() {
  return request('/client/equipment');
}

export async function getServices() {
  return request('/client/services');
}

export async function listQuotes() {
  return request('/client/quotes');
}

export async function getQuote(id) {
  return request(`/client/quotes/${id}`);
}

export async function createQuote(body) {
  return request('/client/quotes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listBookings() {
  return request('/client/bookings');
}

export async function getBooking(id) {
  return request(`/client/bookings/${id}`);
}

export async function createBooking(body) {
  return request('/client/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function cancelBooking(id) {
  return request(`/client/bookings/${id}/cancel`, {
    method: 'POST',
  });
}

export async function getClientProfile() {
  return request('/client/me');
}

export async function updateClientProfile(body) {
  return request('/client/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function listNotifications() {
  return request('/notifications');
}