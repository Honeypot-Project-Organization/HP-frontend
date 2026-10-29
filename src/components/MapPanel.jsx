import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { clusterPoints, dotRadius, placeName, precisionLabel } from "../lib/geo.js";

// Offline map: country outlines come from the bundled `world-atlas` package
// (no tiles, no requests). Everything is drawn as plain SVG.
const W = 960;
const H = 500;
const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
const path = geoPath(projection);
const GRATICULE = path(geoGraticule10());
const SPHERE = path({ type: "Sphere" });

let worldPromise = null;
function loadWorld() {
  if (!worldPromise) {
    worldPromise = import("world-atlas/countries-110m.json").then((m) => {
      const topo = m.default || m;
      const fc = feature(topo, topo.objects.countries);
      return fc.features
        .map((f) => ({ id: String(f.id ?? f.properties?.name ?? ""), name: f.properties?.name || "", d: path(f) }))
        .filter((c) => c.d);
    });
    worldPromise.catch(() => { worldPromise = null; });
  }
  return worldPromise;
}

function viewBoxFor(dots, focus) {
  if (!focus || dots.length === 0) return `0 0 ${W} ${H}`;
  const [x, y] = projection([dots[0].longitude, dots[0].latitude]) || [W / 2, H / 2];
  const w = W / 3;
  const h = H / 3;
  const vx = Math.min(Math.max(x - w / 2, 0), W - w);
  const vy = Math.min(Math.max(y - h / 2, 0), H - h);
  return `${vx} ${vy} ${w} ${h}`;
}

/**
 * points: { dots, located, total, unplaced } already grouped by the server (dashboard, all IPs)
 * attackers: alternatively a normalized attacker list (each may have .geo), grouped here (IP page)
 * focus: zoom in on the first dot (single-IP page)
 * available: result of /api/geo/status (true / false / null = unknown)
 */
export default function MapPanel({ points = null, attackers = null, focus = false, available = null }) {
  const navigate = useNavigate();
  const [countries, setCountries] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [active, setActive] = useState(null);
  const [pinned, setPinned] = useState(null);

  useEffect(() => {
    let live = true;
    loadWorld().then((c) => live && setCountries(c)).catch(() => live && setMapError(true));
    return () => { live = false; };
  }, []);

  const { dots, located, total, unplaced } = useMemo(() => points || clusterPoints(attackers), [points, attackers]);
  const maxSessions = dots.reduce((m, d) => Math.max(m, d.sessions), 1);
  const placed = useMemo(
    () => dots.map((d) => {
      const p = projection([d.longitude, d.latitude]);
      return p ? { ...d, x: p[0], y: p[1] } : null;
    }).filter(Boolean),
    [dots],
  );
  const shown = active || pinned;
  const scale = focus ? 1 / 3 : 1;

  if (total > 0 && located === 0) {
    return (
      <p className="py-8 text-center font-mono text-sm text-mute">
        {available === false
          ? "No location database uploaded yet. Run scripts/upload_geoip.py (see the README) and locations will appear here."
          : "No locations available for these IPs yet."}
      </p>
    );
  }
  if (total === 0) {
    return <p className="py-8 text-center font-mono text-sm text-mute">No attackers to place on the map yet.</p>;
  }

  const open = (d) => {
    if (d.count === 1 && d.ips.length === 1) navigate(`/attackers/${encodeURIComponent(d.ips[0])}`);
    else setPinned(d);
  };

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={viewBoxFor(placed, focus)}
          role="group"
          aria-label="Map of attack origins"
          className="w-full h-auto bg-void/60 border border-line/60"
        >
          <path d={SPHERE} fill="#040B07" stroke="#1B3A28" strokeWidth={0.8 * scale + 0.2} />
          <path d={GRATICULE} fill="none" stroke="#0D1B13" strokeWidth={0.5 * scale + 0.1} />
          {countries && countries.map((c) => (
            <path key={c.id + c.name} d={c.d} fill="#0B1A12" stroke="#1F4A33" strokeWidth={0.5 * scale + 0.1}>
              <title>{c.name}</title>
            </path>
          ))}
          {placed.map((d) => {
            const r = dotRadius(d.sessions, maxSessions) * scale * (focus ? 1.6 : 1);
            const exact = d.precision === "city";
            const label = `${placeName(d)}: ${d.count} IP${d.count === 1 ? "" : "s"}, ${d.sessions} session${d.sessions === 1 ? "" : "s"}`;
            return (
              <g
                key={d.key}
                tabIndex={0}
                role="link"
                aria-label={label}
                style={{ cursor: "pointer", outline: "none" }}
                onMouseEnter={() => setActive(d)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(d)}
                onBlur={() => setActive(null)}
                onClick={() => open(d)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(d); } }}
              >
                <circle cx={d.x} cy={d.y} r={r * 2.2} fill="#FF4D4D" opacity={active === d ? 0.28 : 0.14} />
                <circle
                  cx={d.x} cy={d.y} r={r}
                  fill={exact ? "#FF4D4D" : "none"}
                  stroke="#FF4D4D" strokeWidth={1.4 * scale + 0.3}
                  strokeDasharray={exact ? undefined : `${2 * scale + 0.5} ${1.5 * scale + 0.5}`}
                  style={{ filter: "drop-shadow(0 0 3px #FF4D4D)" }}
                />
              </g>
            );
          })}
        </svg>
        {mapError && <p className="mt-1 font-mono text-xs text-mute">Country outlines could not be loaded; dots are still accurate.</p>}
        {shown && (
          <div role="status" className="mt-2 border border-line bg-raised px-3 py-2 font-mono text-xs">
            <div className="text-signal">{placeName(shown)}</div>
            <div className="text-mute">
              {shown.count} IP{shown.count === 1 ? "" : "s"} · {shown.sessions} session{shown.sessions === 1 ? "" : "s"} · {precisionLabel(shown.precision)}
            </div>
            {shown.count > 1 && pinned === shown && (
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {shown.ips.slice(0, 20).map((ip) => (
                  <li key={ip}><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(ip)}`}>{ip}</Link></li>
                ))}
                {shown.count > Math.min(20, shown.ips.length) && <li className="text-mute">+{shown.count - Math.min(20, shown.ips.length)} more</li>}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 font-mono text-xs text-mute">
        {located} of {total} IPs located{unplaced > 0 ? ` (${unplaced} without map position)` : ""}. Dot size = sessions; a dashed ring means the position is only approximate (region or country).
      </p>
    </div>
  );
}
