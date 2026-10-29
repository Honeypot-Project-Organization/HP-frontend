import {
  ApiError, asList, normalizeAttacker, normalizeCommand, normalizeCountries, normalizeCredential,
  normalizeDaily, normalizeGroup, normalizePoints, normalizeSession, normalizeStats,
} from "./normalize.js";

const rawBase = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";
export const apiBase = String(rawBase).replace(/\/+$/, "");

const TOKEN_KEY = "honeypot_token";
let memToken = null; // fallback when sessionStorage is unavailable
export const UNAUTHORIZED_EVENT = "honeypot:unauthorized";

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || memToken;
  } catch {
    return memToken;
  }
}
export function setToken(t) {
  memToken = t;
  try { sessionStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ }
}
export function clearToken() {
  memToken = null;
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
  cache.clear();
}

const cache = new Map();
export function clearCache() { cache.clear(); }
/** meta:true returns { data, total } where total is the X-Total-Count header (null if absent). */
async function request(path, { method = "GET", body, auth = true, timeoutMs = 20000, meta = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${apiBase}${path}`, {
      method, headers, signal: ctl.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(e?.name === "AbortError" ? "Request timed out" : "Cannot reach the API (network or CORS error)", 0);
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { if (res.ok) throw new ApiError("API returned malformed JSON", res.status); }
  }
  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const d = data && data.detail;
    const msg = typeof d === "string" ? d : res.status === 429 ? "Rate limited - slow down" : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  if (meta) {
    const raw = res.headers && res.headers.get ? res.headers.get("X-Total-Count") : null;
    const n = raw === null || raw === "" ? NaN : Number(raw);
    return { data, total: Number.isInteger(n) && n >= 0 ? n : null };
  }
  return data;
}

/** "?a=1&b=2" from an object, skipping empty values. */
export function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && String(v).trim() !== "") u.set(k, String(v).trim());
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export const PAGE_SIZE = 500;

async function fetchPages(path, { maxPages = 4, page = PAGE_SIZE, extra = "" } = {}) {
  const out = [];
  for (let i = 0; i < maxPages; i++) {
    const rows = asList(await request(`${path}?limit=${page}&skip=${i * page}${extra}`));
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

export async function login(username, password) {
  const r = await request("/login", { method: "POST", body: { username, password }, auth: false });
  if (!r || typeof r.access_token !== "string") throw new ApiError("Login response missing token", 200);
  setToken(r.access_token);
}

export async function getHealth() {
  const t0 = performance.now();
  try {
    const res = await fetch(`${apiBase}/health`);
    return { ok: res.ok, ms: Math.round(performance.now() - t0), databaseDown: res.status === 503 };
  } catch {
    return { ok: false, ms: null, databaseDown: false };
  }
}

export const getStats = () => request("/api/stats").then(normalizeStats);
export const getDailySeries = (days = 30) =>
  request(`/api/stats/daily?days=${encodeURIComponent(days)}`).then(normalizeDaily);
export const getTopCredentials = (limit = 10) =>
  request(`/api/stats/top-credentials?limit=${limit}`).then((r) => asList(r).map(normalizeCredential));
export const getTopCountries = (limit = 10) =>
  request(`/api/stats/top-countries?limit=${limit}`).then(normalizeCountries);
export const getGeoPoints = () => request("/api/geo/points").then(normalizePoints);

/**
 * One page of sessions, filtered/sorted by the server over ALL sessions.
 * params: { limit, skip, q, login, date_from, date_to, sort, order } -> { rows, total }
 */
export const getSessionsList = (params) =>
  request(`/api/sessions${qs(params)}`, { meta: true }).then(({ data, total }) => ({ rows: asList(data).map(normalizeSession), total }));
export const getSessionsPage = (skip = 0, limit = 100) => getSessionsList({ skip, limit }).then((r) => r.rows);
export const getSession = (id) =>
  request(`/api/sessions/${encodeURIComponent(id)}`).then(normalizeSession);
export const getSessionCommands = (id) =>
  request(`/api/sessions/${encodeURIComponent(id)}/commands`).then((r) => asList(r).map(normalizeCommand));

/** One page of IPs, filtered/sorted by the server over ALL IPs -> { rows, total } */
export const getAttackersList = (params) =>
  request(`/api/ips${qs(params)}`, { meta: true }).then(({ data, total }) => ({ rows: asList(data).map(normalizeAttacker), total }));
export const getAttacker = (ip) =>
  request(`/api/ips/${encodeURIComponent(ip)}`).then(normalizeAttacker);
export const getIpSessions = (ip) =>
  fetchPages(`/api/ips/${encodeURIComponent(ip)}/sessions`, { maxPages: 2 }).then((r) => r.map(normalizeSession));
export const getIpCommands = (ip) =>
  request(`/api/ips/${encodeURIComponent(ip)}/commands?limit=${PAGE_SIZE}`).then((r) => asList(r).map(normalizeCommand));

/** Which location databases are loaded. Never throws: the map just shows its empty state. */
export const getGeoStatus = () =>
  request("/api/geo/status")
    .then((r) => ({ available: Boolean(r && r.available) }))
    .catch((e) => {
      if (e && e.status === 401) throw e;
      return { available: null };
    });

/** Distinct commands (grouped by the server over ALL commands) -> { rows, total } */
export const getCommandGroups = (params) =>
  request(`/api/commands/groups${qs(params)}`, { meta: true }).then(({ data, total }) => ({ rows: asList(data).map(normalizeGroup), total }));
export const getCommandGroup = (key) =>
  request(`/api/commands/groups/${encodeURIComponent(key)}`).then(normalizeGroup);
export const getCommandOccurrences = (key, params) =>
  request(`/api/commands/groups/${encodeURIComponent(key)}/occurrences${qs(params)}`, { meta: true })
    .then(({ data, total }) => ({ rows: asList(data).map(normalizeCommand), total }));
