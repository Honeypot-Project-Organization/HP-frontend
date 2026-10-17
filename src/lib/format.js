export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
export function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function toDate(v) {
  if (v === null || v === undefined || v === "") return null;
  let s = v;
  // Backend stores naive UTC datetimes; Python may serialize them without a zone.
  if (typeof s === "string" && /^\d{4}-\d{2}-\d{2}T[\d:.]+$/.test(s)) s += "Z";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
const pad = (n) => String(n).padStart(2, "0");
export function fmtDateTime(v) {
  const d = toDate(v);
  if (!d) return "—";
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
export function fmtTime(v) {
  const d = toDate(v);
  if (!d) return "—";
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
export function dayKey(v) {
  const d = toDate(v);
  if (!d) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
export function fmtRelative(v, now = Date.now()) {
  const d = toDate(v);
  if (!d) return "never";
  const s = Math.max(0, Math.round((now - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function fmtDuration(sec) {
  const n = numOrNull(sec);
  if (n === null) return "—";
  if (n < 60) return `${n.toFixed(n < 10 ? 1 : 0)}s`;
  const m = Math.floor(n / 60);
  const r = Math.round(n % 60);
  if (m < 60) return `${m}m ${r}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
export function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
export function isValidIp(s) {
  const v = String(s ?? "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return v.split(".").every((p) => Number(p) <= 255);
  return /^[0-9a-fA-F:.]{2,45}$/.test(v) && v.includes(":");
}
// FNV-1a 32-bit, used as a stable URL key for a command string.
export function hashStr(s) {
  let h = 0x811c9dc5;
  const str = String(s ?? "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
export function truncate(s, n) {
  const t = String(s ?? "");
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
// Attacker-supplied URLs are shown defanged and never made clickable.
export function defang(url) {
  return String(url ?? "").replace(/^http/i, "hxxp").replace(/\./g, "[.]");
}
