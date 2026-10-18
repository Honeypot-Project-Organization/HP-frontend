// Pure helpers for the attack-origin map. No DOM, no network.

/** Rounded grid cell so nearby IPs share one dot (0.5 degree is ~55 km). */
export const CELL_DEGREES = 0.5;

export function precisionLabel(p) {
  if (p === "city") return "City";
  if (p === "region") return "Region";
  if (p === "country") return "Country only";
  return "Unknown";
}

export function placeName(geo) {
  if (!geo) return "Unknown location";
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  const out = [];
  for (const p of parts) if (out[out.length - 1] !== p) out.push(p);
  return out.length ? out.join(", ") : "Unknown location";
}

/**
 * Group attackers (normalized, with .geo) into map dots.
 * Only IPs with coordinates become dots; the rest are counted as `unplaced`.
 * Returns { dots, located, total, unplaced }.
 */
export function clusterPoints(attackers, cell = CELL_DEGREES) {
  const list = Array.isArray(attackers) ? attackers : [];
  const buckets = new Map();
  let located = 0;
  let unplaced = 0;
  for (const a of list) {
    const g = a && a.geo;
    if (!g) continue;
    located += 1;
    if (g.latitude === null || g.longitude === null) { unplaced += 1; continue; }
    const key = `${Math.round(g.latitude / cell)}:${Math.round(g.longitude / cell)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { key, latitude: 0, longitude: 0, ips: [], sessions: 0, country: g.country, region: g.region, city: g.city, precision: g.precision };
      buckets.set(key, b);
    }
    b.latitude += g.latitude;
    b.longitude += g.longitude;
    b.ips.push(a.ip);
    b.sessions += a.total_sessions || 0;
    // keep the most precise label seen in the cell
    const rank = { city: 3, region: 2, country: 1 };
    if ((rank[g.precision] || 0) > (rank[b.precision] || 0)) {
      b.country = g.country; b.region = g.region; b.city = g.city; b.precision = g.precision;
    }
  }
  const dots = [...buckets.values()].map((b) => ({
    ...b,
    latitude: b.latitude / b.ips.length,
    longitude: b.longitude / b.ips.length,
    count: b.ips.length,
  }));
  dots.sort((x, y) => y.sessions - x.sessions || x.key.localeCompare(y.key));
  return { dots, located, total: list.length, unplaced };
}

/** Top countries by sessions: [{ code, name, ips, sessions }]. */
export function countryCounts(attackers, limit = 8) {
  const m = new Map();
  for (const a of Array.isArray(attackers) ? attackers : []) {
    const g = a && a.geo;
    if (!g || (!g.country && !g.country_code)) continue;
    const code = g.country_code || g.country;
    const row = m.get(code) || { code: g.country_code, name: g.country || g.country_code, ips: 0, sessions: 0 };
    row.ips += 1;
    row.sessions += a.total_sessions || 0;
    m.set(code, row);
  }
  return [...m.values()].sort((x, y) => y.sessions - x.sessions || y.ips - x.ips || x.name.localeCompare(y.name)).slice(0, limit);
}

/** Dot radius (px) from session count, bounded so it never swamps the map. */
export function dotRadius(sessions, max) {
  const m = Math.max(1, max || 1);
  const s = Math.max(0, sessions || 0);
  return 3 + 7 * Math.sqrt(s / m);
}
