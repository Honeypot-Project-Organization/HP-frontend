// Pure-logic checks (no network, no browser). Run: npm run selftest
import assert from "node:assert/strict";
import { defang, dayKey, fmtDuration, hashStr, isValidIp, toDate, truncate } from "../src/lib/format.js";
import { dailyFromSessions, fillDays } from "../src/lib/series.js";
import { normalizeCredential, normalizeDaily, normalizeSession, normalizeStats } from "../src/lib/normalize.js";
import { normalizeAttacker, normalizeGeo } from "../src/lib/normalize.js";
import { clusterPoints, countryCounts, dotRadius, placeName } from "../src/lib/geo.js";
import { groupCommands } from "../src/lib/commands.js";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("naive ISO timestamps are treated as UTC", () => {
  assert.equal(toDate("2026-09-20T10:00:00").toISOString(), "2026-09-20T10:00:00.000Z");
  assert.equal(dayKey("2026-09-20T23:59:59Z"), "2026-09-20");
  assert.equal(toDate("garbage"), null);
});
t("format helpers", () => {
  assert.equal(truncate("abcdef", 3), "abc…");
  assert.equal(fmtDuration(null), "—");
  assert.equal(fmtDuration(125), "2m 5s");
  assert.equal(defang("http://evil.example/a"), "hxxp://evil[.]example/a");
  assert.ok(isValidIp("203.0.113.9") && isValidIp("2001:db8::1") && !isValidIp("999.1.1.1") && !isValidIp("a b"));
  assert.equal(hashStr("uname -a"), hashStr("uname -a"));
  assert.notEqual(hashStr("a"), hashStr("b"));
});
t("fillDays fills gaps oldest-first", () => {
  const out = fillDays([{ date: "2026-09-20", connections: 3, granted: 0 }], 3, new Date("2026-09-21T12:00:00Z"));
  assert.deepEqual(out.map((r) => [r.date, r.connections]), [["2026-09-19", 0], ["2026-09-20", 3], ["2026-09-21", 0]]);
});
t("dailyFromSessions", () => {
  const r = dailyFromSessions([
    { start_time: "2026-09-20T01:00:00Z", login_success: true },
    { start_time: "2026-09-20T02:00:00Z", login_success: false },
    { start_time: null, login_success: false },
  ]);
  assert.deepEqual(r, [{ date: "2026-09-20", connections: 2, granted: 1 }]);
});
t("normalizers match backend shapes", () => {
  assert.deepEqual(normalizeDaily([{ date: "2026-09-20", attacks: 4 }]), [{ date: "2026-09-20", connections: 4, granted: 0 }]);
  assert.equal(normalizeCredential({ username: "root", password: "x", count: 2 }).label, "root:x");
  assert.equal(normalizeStats(null).total_sessions, 0);
  const s = normalizeSession({ id: "abc", src_ip: "1.2.3.4", login_success: 1, duration_seconds: "5" });
  assert.equal(s.login_success, true);
  assert.equal(s.duration_seconds, 5);
});
t("groupCommands groups identical strings", () => {
  const g = groupCommands([
    { input: "ls", src_ip: "1.1.1.1", session_id: "a", timestamp: "2026-09-20T01:00:00Z" },
    { input: "ls ", src_ip: "2.2.2.2", session_id: "b", timestamp: "2026-09-20T02:00:00Z" },
    { input: "id", src_ip: "1.1.1.1", session_id: "a", timestamp: "2026-09-20T03:00:00Z" },
    { input: "  ", src_ip: "1.1.1.1", session_id: "a", timestamp: null },
  ]);
  assert.equal(g.length, 2);
  assert.equal(g[0].text, "ls");
  assert.equal(g[0].count, 2);
  assert.equal(g[0].ipCount, 2);
});
t("normalizeGeo accepts good data and rejects bad", () => {
  assert.equal(normalizeGeo(null), null);
  assert.equal(normalizeGeo({ found: false }), null);
  const g = normalizeGeo({ found: true, country_code: "DE", country: "Germany", city: "Frankfurt", latitude: 50.1, longitude: 8.7, precision: "city", asn: 14061, network: "DO" });
  assert.equal(g.country, "Germany");
  assert.equal(g.accuracy_radius_km, null);
  const bad = normalizeGeo({ found: true, country: "X", latitude: 999, longitude: 5, precision: "weird", asn: "nope" });
  assert.equal(bad.latitude, null);
  assert.equal(bad.longitude, null);
  assert.equal(bad.precision, null);
  assert.equal(bad.asn, null);
  assert.equal(normalizeAttacker({ ip: "1.1.1.1" }).geo, null);
  assert.equal(normalizeAttacker({ ip: "1.1.1.1", geo: { found: true, country: "France", precision: "country" } }).geo.country, "France");
});
const mk = (ip, sessions, geo) => normalizeAttacker({ ip, total_sessions: sessions, geo });
t("clusterPoints groups nearby IPs and counts unplaced", () => {
  const de = (lat, lng) => ({ found: true, country: "Germany", city: "Frankfurt", latitude: lat, longitude: lng, precision: "city" });
  const r = clusterPoints([
    mk("1.1.1.1", 5, de(50.11, 8.68)),
    mk("1.1.1.2", 3, de(50.2, 8.6)),
    mk("2.2.2.2", 1, { found: true, country: "France", precision: "country", latitude: 46, longitude: 2 }),
    mk("3.3.3.3", 2, { found: true, country: "Chad", precision: "country" }),
    mk("4.4.4.4", 9, null),
  ]);
  assert.equal(r.total, 5);
  assert.equal(r.located, 4);
  assert.equal(r.unplaced, 1);
  assert.equal(r.dots.length, 2);
  assert.equal(r.dots[0].count, 2);
  assert.equal(r.dots[0].sessions, 8);
  assert.deepEqual(r.dots[0].ips, ["1.1.1.1", "1.1.1.2"]);
  assert.equal(clusterPoints(null).dots.length, 0);
});
t("countryCounts, placeName, dotRadius", () => {
  const rows = countryCounts([
    mk("a", 1, { found: true, country_code: "DE", country: "Germany" }),
    mk("b", 4, { found: true, country_code: "DE", country: "Germany" }),
    mk("c", 2, { found: true, country_code: "FR", country: "France" }),
    mk("d", 9, null),
  ]);
  assert.deepEqual(rows.map((x) => [x.name, x.ips, x.sessions]), [["Germany", 2, 5], ["France", 1, 2]]);
  assert.equal(placeName({ city: "Paris", region: "Paris", country: "France" }), "Paris, France");
  assert.equal(placeName(null), "Unknown location");
  assert.ok(dotRadius(0, 10) < dotRadius(10, 10) && dotRadius(10, 10) <= 10);
});
console.log(`\n${n} groups passed`);
