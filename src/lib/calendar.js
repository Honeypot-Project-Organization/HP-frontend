// Pure calendar helpers for the date picker. Everything is UTC.

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n, w = 2) => String(n).padStart(w, "0");
const RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** "YYYY-MM-DDTHH:mm[:ss]" -> { y, mo (0-11), d, h, mi, s } or null. */
export function parseParts(value) {
  const m = RE.exec(String(value ?? ""));
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((x) => (x === undefined ? 0 : Number(x)));
  return { y, mo: mo - 1, d, h, mi, s };
}

export function formatParts({ y, mo, d, h, mi, s }) {
  return `${pad(y, 4)}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}`;
}

export const daysInMonth = (y, mo) => new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();

/** 6 rows x 7 columns of { y, mo, d, inMonth } starting on Sunday. */
export function monthGrid(y, mo) {
  const first = new Date(Date.UTC(y, mo, 1)).getUTCDay();
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      const dt = new Date(Date.UTC(y, mo, 1 - first + r * 7 + c));
      row.push({ y: dt.getUTCFullYear(), mo: dt.getUTCMonth(), d: dt.getUTCDate(), inMonth: dt.getUTCMonth() === mo });
    }
    rows.push(row);
  }
  return rows;
}

export function shiftMonth(y, mo, delta) {
  const t = new Date(Date.UTC(y, mo + delta, 1));
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() };
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? Math.trunc(n) : lo));
