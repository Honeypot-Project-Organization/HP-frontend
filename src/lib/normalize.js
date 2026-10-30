import { num, numOrNull } from "./format.js";

function str(v, max = 120) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function coord(v, limit) {
  return typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= limit ? v : null;
}

/** Location data from the API, or null when there is none. */
export function normalizeGeo(g) {
  if (!g || typeof g !== "object" || g.found !== true) return null;
  let latitude = coord(g.latitude, 90);
  let longitude = coord(g.longitude, 180);
  if (latitude === null || longitude === null) latitude = longitude = null;
  const precision = ["city", "region", "country"].includes(g.precision) ? g.precision : null;
  return {
    country_code: str(g.country_code, 2),
    country: str(g.country),
    region: str(g.region),
    city: str(g.city),
    latitude,
    longitude,
    accuracy_radius_km: numOrNull(g.accuracy_radius_km),
    precision,
    asn: numOrNull(g.asn),
    network: str(g.network),
  };
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
  }
}

export function asList(v) {
  return Array.isArray(v) ? v : [];
}

export function normalizeStats(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    total_sessions: num(o.total_sessions),
    total_commands: num(o.total_commands),
    total_auth_attempts: num(o.total_auth_attempts),
    successful_logins: num(o.successful_logins),
    success_rate_percent: num(o.success_rate_percent),
    unique_ips: num(o.unique_ips),
    last_event_received_at: o.last_event_received_at ?? null,
  };
}

export function normalizeDaily(rows) {
  return asList(rows)
    .filter((r) => r && typeof r.date === "string")
    .map((r) => ({ date: r.date.slice(0, 10), connections: num(r.attacks), granted: 0 }));
}

export function normalizeSession(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    id: String(o.id ?? ""),
    src_ip: String(o.src_ip ?? ""),
    src_port: numOrNull(o.src_port),
    dst_port: numOrNull(o.dst_port),
    protocol: o.protocol ?? "ssh",
    start_time: o.start_time ?? null,
    end_time: o.end_time ?? null,
    duration_seconds: numOrNull(o.duration_seconds),
    login_success: Boolean(o.login_success),
    username: o.username ?? null,
    password: o.password ?? null,
    command_count: num(o.command_count),
    download_count: num(o.download_count),
    client_version: o.client_version ?? null,
    status: o.status ?? "open",
  };
}

export function normalizeCommand(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    id: String(o.id ?? ""),
    session_id: String(o.session_id ?? ""),
    src_ip: String(o.src_ip ?? ""),
    timestamp: o.timestamp ?? null,
    input: String(o.input ?? ""),
    cmd_key: typeof o.cmd_key === "string" && /^[0-9a-f]{24}$/.test(o.cmd_key) ? o.cmd_key : null,
  };
}

export function normalizeAttacker(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    ip: String(o.ip ?? ""),
    first_seen: o.first_seen ?? null,
    last_seen: o.last_seen ?? null,
    total_sessions: num(o.total_sessions),
    total_commands: num(o.total_commands),
    total_auth_attempts: num(o.total_auth_attempts),
    successful_logins: num(o.successful_logins),
    geo: normalizeGeo(o.geo),
  };
}

export function normalizeCredential(r) {
  const o = r && typeof r === "object" ? r : {};
  const username = o.username ?? null;
  const password = o.password ?? null;
  return { username, password, count: num(o.count), label: `${username ?? ""}:${password ?? ""}` };
}

export function normalizeGroup(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    key: String(o.key ?? ""),
    text: String(o.text ?? ""),
    count: num(o.count),
    ip_count: num(o.ip_count),
    session_count: num(o.session_count),
    first_ts: o.first_ts ?? null,
    last_ts: o.last_ts ?? null,
  };
}

export function normalizeCountries(r) {
  const o = r && typeof r === "object" ? r : {};
  return {
    countries: asList(o.countries).map((c) => ({
      code: c && typeof c.code === "string" ? c.code : null,
      name: String((c && (c.name || c.code)) ?? "Unknown"),
      ips: num(c && c.ips),
      sessions: num(c && c.sessions),
    })),
    located: num(o.located),
    total: num(o.total),
    pending: num(o.pending),
  };
}

export function normalizePoints(r) {
  const o = r && typeof r === "object" ? r : {};
  const dots = asList(o.dots)
    .map((d) => ({
      key: String(d?.key ?? ""),
      latitude: numOrNull(d?.latitude),
      longitude: numOrNull(d?.longitude),
      count: num(d?.count),
      sessions: num(d?.sessions),
      ips: asList(d?.ips).map(String),
      country: d?.country ?? null,
      region: d?.region ?? null,
      city: d?.city ?? null,
      precision: d?.precision ?? null,
    }))
    .filter((d) => d.latitude !== null && d.longitude !== null);
  return { dots, located: num(o.located), unplaced: num(o.unplaced), total: num(o.total), pending: num(o.pending) };
}
