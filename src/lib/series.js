import { dayKey } from "./format.js";

// Fill missing UTC days with zeros so the chart has a continuous axis.
export function fillDays(rows, days, now = new Date()) {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = dayKey(d);
    const r = map.get(key);
    out.push({ date: key, connections: r ? r.connections : 0, granted: r ? r.granted ?? 0 : 0 });
  }
  return out;
}

// Build a per-day series from normalized sessions.
export function dailyFromSessions(sessions) {
  const m = new Map();
  for (const s of sessions) {
    const k = dayKey(s.start_time);
    if (!k) continue;
    const r = m.get(k) || { date: k, connections: 0, granted: 0 };
    r.connections += 1;
    if (s.login_success) r.granted += 1;
    m.set(k, r);
  }
  return [...m.values()].sort((a, b) => a.date.localeCompare(b.date));
}
