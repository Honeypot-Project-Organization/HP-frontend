import { useEffect, useState } from "react";

export default function StatBlock({ label, value, text, hint, tone = "signal" }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (text !== undefined || typeof value !== "number") return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(value); return undefined; }
    let raf; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 600);
      setShown(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, text]);
  const color = tone === "threat" ? "text-threat glow-threat" : "text-signal glow-signal";
  return (
    <div className="panel p-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">{label}</div>
      <div className={`mt-1 font-mono text-3xl font-bold ${color}`}>
        {text !== undefined ? text : shown.toLocaleString()}
      </div>
      {hint && <div className="mt-1 text-xs text-mute">{hint}</div>}
    </div>
  );
}
