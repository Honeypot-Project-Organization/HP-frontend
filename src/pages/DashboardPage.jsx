import { useState } from "react";
import { Link } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import ConnectionChart from "../components/ConnectionChart.jsx";
import MapPanel from "../components/MapPanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getAttackers, getDailySeries, getGeoStatus, getSessionsPage, getStats, getTopCredentials, clearCache } from "../lib/api.js";
import { fmtDuration, fmtRelative, fmtDateTime, toDate } from "../lib/format.js";
import { countryCounts } from "../lib/geo.js";
import { fillDays } from "../lib/series.js";

const RANGES = [7, 14, 30, 90];

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data, error, loading, updatedAt, reload } = useAsync(async () => {
    const [stats, daily, sessions, attackers, creds, geoStatus] = await Promise.all([
      getStats(), getDailySeries(days), getSessionsPage(0, 10), getAttackers(), getTopCredentials(8), getGeoStatus(),
    ]);
    return { stats, daily: fillDays(daily, days), sessions, attackers, creds, geoStatus };
  }, [days], 60000);

  const refresh = () => { clearCache(); reload(); };
  const header = (
    <PageHeader path="dashboard" title="Overview">
      <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
    </PageHeader>
  );
  if (!data && loading) return <div>{header}<Loading label="Fetching telemetry" /></div>;
  if (!data) return <div>{header}<ErrorBox error={error} onRetry={refresh} /></div>;

  const { stats, daily, sessions, attackers, creds, geoStatus } = data;
  const countries = countryCounts(attackers, 8);
  const top = [...attackers].sort((a, b) => b.total_sessions - a.total_sessions).slice(0, 8);
  const last = toDate(stats.last_event_received_at);
  const stale = last ? Date.now() - last.getTime() > 3600_000 : false;

  return (
    <div>
      {header}
      {error && <div className="mb-4"><ErrorBox error={error} /></div>}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <StatBlock label="Sessions" value={stats.total_sessions} />
        <StatBlock label="Unique IPs" value={stats.unique_ips} />
        <StatBlock label="Auth attempts" value={stats.total_auth_attempts} />
        <StatBlock label="Logins granted" value={stats.successful_logins} tone="threat" hint={`${stats.success_rate_percent}% success`} />
        <StatBlock label="Commands" value={stats.total_commands} />
        <StatBlock label="Last event" text={fmtRelative(stats.last_event_received_at)} tone={stale ? "threat" : "signal"} hint={stale ? "shipper may be down" : fmtDateTime(stats.last_event_received_at)} />
      </div>

      <Panel title="Connection history" right={
        <div className="flex gap-1" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r} type="button" className={`btn ${r === days ? "btn-primary" : ""}`} onClick={() => setDays(r)} aria-pressed={r === days}>{r}d</button>
          ))}
        </div>
      }>
        <ConnectionChart data={daily} />
      </Panel>

      <Panel title="Attack origins" className="mt-5" threat>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <MapPanel attackers={attackers} available={geoStatus.available} />
          <div>
            <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-mute">Top countries</h3>
            {countries.length === 0 ? <p className="font-mono text-xs text-mute">No country data yet</p> : (
              <table className="tbl">
                <thead><tr><th>Country</th><th>IPs</th><th>Sess</th></tr></thead>
                <tbody>
                  {countries.map((c) => (
                    <tr key={c.code || c.name}>
                      <td>{c.name}</td>
                      <td className="font-mono">{c.ips}</td>
                      <td className="font-mono">{c.sessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2 mt-5">
        <Panel title="Latest sessions" right={<Link className="text-xs text-signal underline" to="/sessions">all</Link>}>
          {sessions.length === 0 ? <Empty>No sessions recorded yet</Empty> : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Source</th><th>Start</th><th>Dur</th><th>Login</th></tr></thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono"><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(s.id)}`}>{s.src_ip}</Link></td>
                      <td className="font-mono text-xs">{fmtDateTime(s.start_time)}</td>
                      <td className="font-mono">{fmtDuration(s.duration_seconds)}</td>
                      <td><AccessPill ok={s.login_success} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Top attackers" threat right={<Link className="text-xs text-signal underline" to="/attackers">all</Link>}>
          {top.length === 0 ? <Empty>No attackers yet</Empty> : (
            <table className="tbl">
              <thead><tr><th>IP</th><th>Sessions</th><th>Cmds</th><th>Last seen</th></tr></thead>
              <tbody>
                {top.map((a) => (
                  <tr key={a.ip}>
                    <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(a.ip)}`}>{a.ip}</Link></td>
                    <td className="font-mono">{a.total_sessions}</td>
                    <td className="font-mono">{a.total_commands}</td>
                    <td className="font-mono text-xs">{fmtRelative(a.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="Top credentials tried" className="mt-5">
        {creds.length === 0 ? <Empty>No credential attempts yet</Empty> : (
          <table className="tbl">
            <thead><tr><th>Username</th><th>Password</th><th>Count</th></tr></thead>
            <tbody>
              {creds.map((c) => (
                <tr key={c.label}>
                  <td className="data">{c.username ?? "\u2014"}</td>
                  <td className="data">{c.password ?? "\u2014"}</td>
                  <td className="font-mono">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
