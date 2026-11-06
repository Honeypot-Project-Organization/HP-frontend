import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusStrip from "./StatusStrip.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/attackers", label: "Attackers" },
  { to: "/sessions", label: "Sessions" },
  { to: "/commands", label: "Commands" },
  { to: "/mitre", label: "MITRE" },
];

// Plain outbound links (new tab). Nothing is fetched from these sites by the dashboard.
const external = [
  { href: "https://www.virustotal.com", label: "VirusTotal" },
  { href: "https://attack.mitre.org", label: "MITRE ATT&CK" },
];

export default function Layout() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <StatusStrip />
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Primary" className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-line bg-panel/60 p-3 md:p-4">
          <div className="mb-3 md:mb-6 font-mono text-sm tracking-widest text-signal glow-signal">&gt;_ HONEYPOT</div>
          <ul className="flex md:flex-col gap-1 overflow-x-auto">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block px-3 py-2 font-mono text-sm uppercase tracking-wider border-l-2 whitespace-nowrap ${
                      isActive ? "border-signal text-signal bg-signal/10" : "border-transparent text-mute hover:text-ink"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 md:mt-6">
            <div className="mb-1 hidden md:block font-mono text-[11px] uppercase tracking-[0.18em] text-mute">Resources</div>
            <ul className="flex md:flex-col gap-x-4 gap-y-1">
              {external.map((l) => (
                <li key={l.href}>
                  <a
                    className="font-mono text-xs text-signal underline whitespace-nowrap"
                    href={l.href} target="_blank" rel="noopener noreferrer"
                  >{l.label} <span aria-hidden="true">{"\u2197"}</span><span className="sr-only">(opens in a new tab)</span></a>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className="btn mt-4" onClick={logout}>Log out</button>
        </nav>
        <main className="flex-1 min-w-0 p-4 md:p-6">
          <Outlet />
          <footer className="mt-8 border-t border-line/60 pt-3 font-mono text-xs text-mute">
            <a className="text-signal underline" href="https://db-ip.com" target="_blank" rel="noopener noreferrer">IP geolocation by DB-IP</a>
          </footer>
        </main>
      </div>
    </div>
  );
}
