import { useCallback, useRef, useState } from "react";
import Popover from "./Popover.jsx";

/** Themed drop-down (the browser's native one cannot be styled). options: [{ value, label }] */
export default function Select({ value, onChange, options, label, width = 160 }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  const current = options.find((o) => o.value === value) || options[0];
  return (
    <>
      <button
        ref={btn} type="button" className="input text-left" style={{ width }} aria-label={label}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
      >
        <span>{current ? current.label : ""}</span>
        <span aria-hidden="true" className="float-right text-signal">▾</span>
      </button>
      <Popover anchorRef={btn} open={open} onClose={close} width={width} role="listbox" label={label}>
        {options.map((o) => (
          <button
            key={o.value} type="button" role="option" aria-selected={o.value === value}
            className={`block w-full px-3 py-2 text-left hover:bg-signal/10 hover:text-signal ${o.value === value ? "bg-signal/15 text-signal" : "text-ink"}`}
            onClick={() => { onChange(o.value); setOpen(false); if (btn.current) btn.current.focus(); }}
          >{o.label}</button>
        ))}
      </Popover>
    </>
  );
}
