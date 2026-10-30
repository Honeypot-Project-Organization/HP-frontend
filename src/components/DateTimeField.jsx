import { useCallback, useRef, useState } from "react";
import Popover from "./Popover.jsx";
import { MONTHS, WEEKDAYS, clamp, daysInMonth, formatParts, monthGrid, parseParts, shiftMonth } from "../lib/calendar.js";

const two = (n) => String(n).padStart(2, "0");

/**
 * Calendar + clock picker in the dashboard's own theme (the browser's built-in
 * picker cannot be styled). Works in UTC. value/onChange use "YYYY-MM-DDTHH:mm:ss"; "" = not set.
 */
export default function DateTimeField({ label, value, onChange, min, max }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const parts = parseParts(value);
  const now = new Date();
  const [view, setView] = useState({ y: parts ? parts.y : now.getUTCFullYear(), mo: parts ? parts.mo : now.getUTCMonth() });

  const toggle = () => {
    if (!open && parts) setView({ y: parts.y, mo: parts.mo });
    setOpen(!open);
  };
  const base = parts || { y: view.y, mo: view.mo, d: 1, h: 0, mi: 0, s: 0 };
  const emit = (p) => onChange(formatParts(p));
  const pickDay = (c) => emit({ ...base, y: c.y, mo: c.mo, d: Math.min(c.d, daysInMonth(c.y, c.mo)) });
  const setTime = (k, hi) => (e) => {
    const n = clamp(Number(e.target.value.replace(/\D/g, "")), 0, hi);
    emit({ ...base, d: parts ? parts.d : 1, [k]: n });
  };
  const useNow = () => {
    const n = new Date();
    emit({ y: n.getUTCFullYear(), mo: n.getUTCMonth(), d: n.getUTCDate(), h: n.getUTCHours(), mi: n.getUTCMinutes(), s: n.getUTCSeconds() });
    setView({ y: n.getUTCFullYear(), mo: n.getUTCMonth() });
  };
  const outOfRange = (c) => {
    const day = `${c.y}-${two(c.mo + 1)}-${two(c.d)}`;
    return (min && day < min.slice(0, 10)) || (max && day > max.slice(0, 10));
  };
  const grid = monthGrid(view.y, view.mo);
  const text = parts ? formatParts(parts).replace("T", " ") : "any";

  return (
    <div className="flex flex-col gap-1">
      <span id={`dtf-${label}`}>{label}</span>
      <button
        ref={btn} type="button" className="input !w-56 text-left" aria-haspopup="dialog" aria-expanded={open}
        aria-labelledby={`dtf-${label}`} onClick={toggle}
      >
        <span className={parts ? "text-ink" : "text-mute"}>{text}</span>
        <span aria-hidden="true" className="float-right text-signal">▾</span>
      </button>
      <Popover anchorRef={btn} open={open} onClose={close} width={288} label={`${label} picker`} className="p-3">
        <div>
          <div className="mb-2 flex items-center justify-between gap-1">
            <button type="button" className="btn !px-2" aria-label="Previous month" onClick={() => setView(shiftMonth(view.y, view.mo, -1))}>◀</button>
            <div className="flex items-center gap-1">
              <span className="text-signal">{MONTHS[view.mo]}</span>
              <input
                className="input !w-20 !px-1 !py-0.5 text-center" aria-label="Year" inputMode="numeric" value={view.y}
                onChange={(e) => { const y = Number(e.target.value.replace(/\D/g, "").slice(0, 4)); if (y >= 1) setView({ ...view, y }); }}
              />
            </div>
            <button type="button" className="btn !px-2" aria-label="Next month" onClick={() => setView(shiftMonth(view.y, view.mo, 1))}>▶</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => <span key={w} className="py-1 text-mute">{w}</span>)}
            {grid.flat().map((c) => {
              const selected = parts && parts.y === c.y && parts.mo === c.mo && parts.d === c.d;
              const bad = outOfRange(c);
              return (
                <button
                  key={`${c.y}-${c.mo}-${c.d}`} type="button" disabled={bad} onClick={() => pickDay(c)}
                  aria-label={`${c.d} ${MONTHS[c.mo]} ${c.y}`} aria-pressed={selected || undefined}
                  className={`py-1 text-sm border ${selected ? "border-signal bg-signal text-void" : "border-transparent hover:border-signal hover:text-signal"} ${c.inMonth ? "text-ink" : "text-mute/50"} disabled:opacity-30 disabled:cursor-not-allowed`}
                >{c.d}</button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1">
            <span className="mr-1 text-mute">UTC</span>
            {[["h", "Hour", 23], ["mi", "Minute", 59], ["s", "Second", 59]].map(([k, name, hi], i) => (
              <span key={k} className="flex items-center gap-1">
                {i > 0 && <span className="text-mute">:</span>}
                <input className="input !w-12 !px-1 !py-1 text-center" aria-label={name} inputMode="numeric" value={two(base[k])} onChange={setTime(k, hi)} />
              </span>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <button type="button" className="btn" onClick={useNow}>Now</button>
            <button type="button" className="btn" onClick={() => { onChange(""); setOpen(false); }}>Clear</button>
            <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      </Popover>
    </div>
  );
}
