import { useEffect, useState } from "react";
import { getHealth } from "../lib/api.js";

export default function StatusStrip() {
  const [h, setH] = useState(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    let alive = true;
    const check = () => getHealth().then((r) => alive && setH(r));
    check();
    const a = setInterval(check, 60000);
    const b = setInterval(() => setNow(new Date()), 1000);
    return () => { alive = false; clearInterval(a); clearInterval(b); };
  }, []);
  const label = !h ? "checking" : h.ok ? `online ${h.ms}ms` : h.databaseDown ? "db down" : "offline";
  const color = !h ? "text-mute" : h.ok ? "text-ok" : "text-threat";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-panel/80 px-4 py-1.5 font-mono text-xs">
      <span>API: <span className={color}>{label}</span></span>
      <span className="text-mute">{now.toISOString().replace("T", " ").slice(0, 19)} UTC</span>
    </div>
  );
}
