import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating box anchored to a button. It is drawn in document.body (position: fixed), so panels
 * with clip-path / overflow can never cut it off, and it flips upward when there is no room below.
 */
export default function Popover({ anchorRef, open, onClose, width = 288, className = "", role = "dialog", label, children }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);

  const place = () => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const h = box.current ? box.current.offsetHeight : 0;
    const below = window.innerHeight - r.bottom;
    const up = h > below - 8 && r.top > below;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const next = {
      left: Math.round(left),
      top: Math.round(up ? Math.max(8, r.top - h - 4) : r.bottom + 4),
      maxHeight: Math.round(Math.max(160, (up ? r.top : below) - 12)),
    };
    // Only update when something moved, otherwise re-placing after every render would loop.
    setPos((p) => (p && p.left === next.left && p.top === next.top && p.maxHeight === next.maxHeight ? p : next));
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const again = () => place();
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    return () => { window.removeEventListener("resize", again); window.removeEventListener("scroll", again, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, width]);

  // The box grows once its content is measured (month changes etc.), so re-place after each render.
  useLayoutEffect(() => { if (open) place(); });

  useEffect(() => {
    if (!open) return undefined;
    const down = (e) => {
      if (box.current && box.current.contains(e.target)) return;
      if (anchorRef.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };
    const key = (e) => { if (e.key === "Escape") { onClose(); if (anchorRef.current) anchorRef.current.focus(); } };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open, onClose, anchorRef]);

  if (!open) return null;
  return createPortal(
    <div
      ref={box} role={role} aria-label={label}
      style={{ position: "fixed", left: pos ? pos.left : -9999, top: pos ? pos.top : 0, width, maxHeight: pos ? pos.maxHeight : undefined, overflowY: "auto", zIndex: 1000 }}
      className={`border border-signal bg-panel font-mono text-sm shadow-[0_0_18px_rgba(0,255,136,.25)] ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
