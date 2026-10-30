import { useState } from "react";
import { pageCount, pageWindow, rangeLabel } from "../lib/paging.js";

/**
 * page: 0-based. total: number of matching rows, or null when unknown (then
 * only Prev/Next work and Next is enabled while a full page came back).
 */
export default function Pager({ page, size, shown, total, onPage, disabled = false }) {
  const [jump, setJump] = useState("");
  const known = typeof total === "number";
  const pages = known ? pageCount(total, size) : null;
  const hasNext = known ? page + 1 < pages : shown === size;
  const go = (p) => { if (!disabled && p !== page && p >= 0 && (!known || p < pages)) onPage(p); };
  const submitJump = (e) => {
    e.preventDefault();
    const n = Number(jump);
    if (Number.isInteger(n) && n >= 1 && (!known || n <= pages)) go(n - 1);
    setJump("");
  };

  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-mute">
      <span aria-live="polite">{rangeLabel(page, size, shown, known ? total : null)}</span>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className="btn" onClick={() => go(page - 1)} disabled={disabled || page === 0}>Prev</button>
        {known && pageWindow(page, pages).map((p, i) =>
          p === "gap" ? <span key={`g${i}`} className="px-1">…</span> : (
            <button
              key={p} type="button" aria-current={p === page ? "page" : undefined}
              className={`btn ${p === page ? "btn-primary" : ""}`} onClick={() => go(p)} disabled={disabled}
            >{p + 1}</button>
          ))}
        {!known && <span className="px-2">page {page + 1}</span>}
        <button type="button" className="btn" onClick={() => go(page + 1)} disabled={disabled || !hasNext}>Next</button>
        <form onSubmit={submitJump} className="ml-2 flex items-center gap-1">
          <label className="sr-only" htmlFor="pager-jump">Go to page</label>
          <input
            id="pager-jump" className="input !w-16" inputMode="numeric" placeholder={known ? `of ${pages}` : "page"}
            value={jump} onChange={(e) => setJump(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button type="submit" className="btn" disabled={disabled || jump === ""}>Go</button>
        </form>
      </div>
    </nav>
  );
}
