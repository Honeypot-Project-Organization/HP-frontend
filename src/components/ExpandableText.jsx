import { useState } from "react";

// Renders attacker text as plain text only; long values collapse.
export default function ExpandableText({ text, max = 160 }) {
  const [open, setOpen] = useState(false);
  const s = String(text ?? "");
  const long = s.length > max;
  return (
    <span className="data whitespace-pre-wrap">
      {long && !open ? `${s.slice(0, max)}…` : s}
      {long && (
        <button type="button" className="ml-2 text-xs text-signal underline" onClick={() => setOpen(!open)}>
          {open ? "less" : "more"}
        </button>
      )}
    </span>
  );
}
