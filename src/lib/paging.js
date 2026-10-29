// Pure paging helpers. Pages are 0-based in code, 1-based on screen.

export const PAGE_LIMIT = 100;

export function pageCount(total, size = PAGE_LIMIT) {
  const t = Number.isFinite(total) && total > 0 ? total : 0;
  return Math.max(1, Math.ceil(t / size));
}

/** Page buttons to show: first, last, and a window around the current page,
 *  with "…" markers for the gaps. Example (page 5 of 20): 0 … 3 4 5 6 7 … 19 */
export function pageWindow(page, pages, span = 2) {
  if (pages <= 1) return [0];
  const keep = new Set([0, pages - 1]);
  for (let p = page - span; p <= page + span; p++) if (p >= 0 && p < pages) keep.add(p);
  const sorted = [...keep].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] === 2) out.push(sorted[i] - 1); // a single gap: show the page itself
    else if (i > 0 && sorted[i] - sorted[i - 1] > 2) out.push("gap");
    out.push(sorted[i]);
  }
  return out;
}

/** "1-100 of 2,345" (or "0 of 0"). */
export function rangeLabel(page, size, shown, total) {
  if (shown === 0) return "0 results";
  const from = page * size + 1;
  const to = page * size + shown;
  return total === null || total === undefined ? `${from}–${to}` : `${from}–${to} of ${total.toLocaleString("en-US")}`;
}
