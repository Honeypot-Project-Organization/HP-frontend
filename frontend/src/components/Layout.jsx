import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusStrip from "./StatusStrip.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/attackers", label: "Attackers" },
  { to: "/sessions", label: "Sessions" },
  { to: "/commands", label: "Commands" },
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
