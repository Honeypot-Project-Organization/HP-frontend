// The date filters work in UTC, like every time shown in the dashboard.
// <input type="datetime-local" step="1"> yields "YYYY-MM-DDTHH:mm[:ss]" with no zone.

const RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Convert a datetime-local value to an ISO-8601 UTC string, or null if empty/invalid.
 * end=true makes the bound inclusive of the whole second (…:59.999Z).
 */
export function parseUtcInput(value, { end = false } = {}) {
  const m = RE.exec(String(value ?? "").trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((x) => (x === undefined ? 0 : Number(x)));
  const t = Date.UTC(y, mo - 1, d, h, mi, s, end ? 999 : 0);
  const dt = new Date(t);
  // Reject rollovers such as 2026-02-31 (Date.UTC would quietly move them to March).
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString();
}

/** Problem with a from/to pair, or null. Both arguments are raw input values. */
export function rangeProblem(from, to) {
  const a = parseUtcInput(from);
  const b = parseUtcInput(to, { end: true });
  if (a && b && a > b) return "The start is after the end.";
  return null;
}
