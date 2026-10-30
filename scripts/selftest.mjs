// Pure-logic checks (no network, no browser). Run: npm run selftest
import assert from "node:assert/strict";
import { defang, dayKey, fmtDuration, fmtSessionDuration, hashStr, isValidIp, toDate, truncate } from "../src/lib/format.js";
import { dailyFromSessions, fillDays } from "../src/lib/series.js";
import { normalizeCredential, normalizeDaily, normalizeSession, normalizeStats } from "../src/lib/normalize.js";
import { normalizeAttacker, normalizeGeo } from "../src/lib/normalize.js";
import { clusterPoints, countryCounts, dotRadius, placeName } from "../src/lib/geo.js";
import { normalizeCommand, normalizeCountries, normalizeGroup, normalizePoints } from "../src/lib/normalize.js";
import { pageCount, pageWindow, rangeLabel } from "../src/lib/paging.js";
import { parseUtcInput, rangeProblem } from "../src/lib/dates.js";
import { qs } from "../src/lib/api.js";
import { clamp, daysInMonth, formatParts, monthGrid, parseParts, shiftMonth } from "../src/lib/calendar.js";

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
t("normalizers for server-side groups, countries and map points", () => {
  const g = normalizeGroup({ key: "ab", text: "ls", count: "3", ip_count: 2, session_count: 2, last_ts: "2026-09-20T01:00:00Z" });
  assert.deepEqual([g.count, g.ip_count, g.session_count], [3, 2, 2]);
  assert.equal(normalizeCommand({ input: "x", cmd_key: "0123456789abcdef01234567" }).cmd_key, "0123456789abcdef01234567");
  assert.equal(normalizeCommand({ input: "x", cmd_key: "<script>" }).cmd_key, null);
  const c = normalizeCountries({ countries: [{ code: "DE", name: "Germany", ips: 2, sessions: 5 }], located: 2, total: 3, pending: 1 });
  assert.deepEqual([c.countries[0].name, c.total, c.pending], ["Germany", 3, 1]);
  const p = normalizePoints({ dots: [{ key: "k", latitude: 1, longitude: 2, count: 4, sessions: 9, ips: ["1.1.1.1"] }, { key: "bad", latitude: null, longitude: 1 }], located: 4, total: 5 });
  assert.equal(p.dots.length, 1);
  assert.equal(p.dots[0].count, 4);
  assert.equal(normalizePoints(null).dots.length, 0);
});
t("session duration shown wherever a session is shown", () => {
  assert.equal(fmtSessionDuration({ duration_seconds: 12.5, status: "closed" }), "13s");
  assert.equal(fmtSessionDuration({ duration_seconds: 0, status: "closed" }), "0.0s");
  assert.equal(fmtSessionDuration({ duration_seconds: null, status: "open" }), "open");
  assert.equal(fmtSessionDuration({ duration_seconds: null, status: "closed" }), "\u2014");
  assert.equal(fmtSessionDuration(null), "\u2014");
});
t("paging helpers", () => {
  assert.equal(pageCount(0), 1);
  assert.equal(pageCount(100), 1);
  assert.equal(pageCount(101), 2);
  assert.equal(pageCount(null), 1);
  assert.deepEqual(pageWindow(0, 1), [0]);
  assert.deepEqual(pageWindow(0, 5), [0, 1, 2, 3, 4]);
  assert.deepEqual(pageWindow(9, 20), [0, "gap", 7, 8, 9, 10, 11, "gap", 19]);
  assert.deepEqual(pageWindow(2, 20), [0, 1, 2, 3, 4, "gap", 19]);
  assert.equal(rangeLabel(1, 100, 100, 2345), "101\u2013200 of 2,345");
  assert.equal(rangeLabel(0, 100, 0, 0), "0 results");
});
t("date range inputs are read as UTC with second precision", () => {
  assert.equal(parseUtcInput("2026-03-04T05:06:07"), "2026-03-04T05:06:07.000Z");
  assert.equal(parseUtcInput("2026-03-04T05:06"), "2026-03-04T05:06:00.000Z");
  assert.equal(parseUtcInput("2026-03-04T05:06:07", { end: true }), "2026-03-04T05:06:07.999Z");
  assert.equal(parseUtcInput("2026-02-31T00:00:00"), null);
  assert.equal(parseUtcInput(""), null);
  assert.equal(parseUtcInput("junk"), null);
  assert.equal(rangeProblem("2026-03-05T00:00:00", "2026-03-04T00:00:00") !== null, true);
  assert.equal(rangeProblem("2026-03-04T00:00:00", "2026-03-04T00:00:00"), null);
  assert.equal(rangeProblem("", "2026-03-04T00:00:00"), null);
});
t("calendar helpers", () => {
  assert.deepEqual(parseParts("2026-03-04T05:06"), { y: 2026, mo: 2, d: 4, h: 5, mi: 6, s: 0 });
  assert.equal(formatParts(parseParts("2026-03-04T05:06:07")), "2026-03-04T05:06:07");
  assert.equal(parseParts("x"), null);
  assert.equal(daysInMonth(2028, 1), 29);
  assert.equal(daysInMonth(2026, 1), 28);
  const g = monthGrid(2026, 9); // October 2026 starts on a Thursday
  assert.equal(g.length, 6);
  assert.equal(g[0][4].d, 1);
  assert.equal(g[0][4].inMonth, true);
  assert.equal(g[0][0].inMonth, false);
  assert.deepEqual(shiftMonth(2026, 0, -1), { y: 2025, mo: 11 });
  assert.deepEqual(shiftMonth(2026, 11, 1), { y: 2027, mo: 0 });
  assert.equal(clamp(99, 0, 59), 59);
  assert.equal(clamp(NaN, 0, 59), 0);
});
t("query strings skip empty values and encode the rest", () => {
  assert.equal(qs({ a: 1, b: "", c: null, d: undefined, e: " x y " }), "?a=1&e=x+y");
  assert.equal(qs({}), "");
  assert.equal(qs({ q: "1.2&sort=x" }), "?q=1.2%26sort%3Dx");
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
