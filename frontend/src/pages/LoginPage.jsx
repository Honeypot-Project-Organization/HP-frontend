import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { authed, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // Only ever redirect to an internal path (never "//host" or a full URL).
  const from = loc.state?.from;
  const dest = typeof from === "string" && /^\/(?![\/\\])/.test(from) ? from : "/";
  if (authed) return <Navigate to={dest} replace />;

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(u.trim(), p);
      nav(dest, { replace: true });
    } catch (ex) {
      setErr(ex.message || "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={submit} className="panel w-full max-w-sm p-6" aria-label="Login">
        <div className="font-mono text-xs text-mute">operator@honeypot:~$ ssh admin<span className="cursor ml-1" aria-hidden="true" /></div>
        <h1 className="mt-2 mb-5 text-2xl font-bold text-signal glow-signal tracking-wide">ACCESS CONSOLE</h1>
        <label className="block font-mono text-xs uppercase tracking-wider text-mute mb-1" htmlFor="u">Username</label>
        <input id="u" className="input mb-4" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required maxLength={64} autoFocus />
        <label className="block font-mono text-xs uppercase tracking-wider text-mute mb-1" htmlFor="p">Password</label>
        <input id="p" type="password" className="input mb-4" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required maxLength={256} />
        {err && <div role="alert" className="mb-4 border border-threat/60 bg-threat/5 p-2 text-sm text-threat">{err}</div>}
        <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>{busy ? "Authenticating" : "Authenticate"}</button>
      </form>
    </div>
  );
}
