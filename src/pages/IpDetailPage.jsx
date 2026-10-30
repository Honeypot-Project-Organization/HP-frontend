import { Link, useParams } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import ConnectionChart from "../components/ConnectionChart.jsx";
import ExpandableText from "../components/ExpandableText.jsx";
import MapPanel from "../components/MapPanel.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getAttacker, getGeoStatus, getIpCommands, getIpSessions } from "../lib/api.js";
import { fmtDateTime, fmtSessionDuration, isValidIp } from "../lib/format.js";
import { placeName, precisionLabel } from "../lib/geo.js";
import { dailyFromSessions } from "../lib/series.js";

export default function IpDetailPage() {
  const { ip = "" } = useParams();
  const valid = isValidIp(ip);
  const { data, error, loading, updatedAt, reload } = useAsync(async () => {
    if (!valid) throw new Error("Invalid IP address");
    const [info, sessions, commands, geoStatus] = await Promise.all([getAttacker(ip), getIpSessions(ip), getIpCommands(ip), getGeoStatus()]);
    return { info, sessions, commands, geoStatus };
  }, [ip]);

  const header = (
    <PageHeader path={`attackers/${ip}`} title={ip}>
      {valid && (
        <a className="btn" href={`https://www.virustotal.com/gui/ip-address/${encodeURIComponent(ip)}`} target="_blank" rel="noopener noreferrer">
          VirusTotal ↗
        </a>
      )}
      <RefreshButton onClick={reload} loading={loading} updatedAt={updatedAt} />
    </PageHeader>
  );
  if (!data && loading) return <div>{header}<Loading /></div>;
  if (!data) return <div>{header}<ErrorBox error={error} onRetry={reload} /></div>;

  const { info, sessions, commands, geoStatus } = data;
  const g = info.geo;
  const series = dailyFromSessions(sessions);
  return (
    <div>
      {header}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatBlock label="Sessions" value={info.total_sessions} />
        <StatBlock label="Login attempts" value={info.total_auth_attempts} />
        <StatBlock label="Successful logins" value={info.successful_logins} tone="threat" />
        <StatBlock label="Commands" value={info.total_commands} />
      </div>
      <p className="mb-5 font-mono text-xs text-mute">First seen {fmtDateTime(info.first_seen)} · last seen {fmtDateTime(info.last_seen)}</p>

      <Panel title="Connection history">
        <ConnectionChart data={series} showGranted />
      </Panel>

      <Panel title="Origin" className="mt-5" threat>
        {g ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <MapPanel attackers={[info]} focus available={geoStatus.available} />
            <table className="tbl">
              <tbody>
                <tr><th scope="row">Place</th><td>{placeName(g)}</td></tr>
                <tr><th scope="row">Country</th><td>{g.country ?? "\u2014"}{g.country_code ? ` (${g.country_code})` : ""}</td></tr>
                <tr><th scope="row">Region</th><td>{g.region ?? "\u2014"}</td></tr>
                <tr><th scope="row">City</th><td>{g.city ?? "\u2014"}</td></tr>
                <tr><th scope="row">Network</th><td>{g.network ?? "\u2014"}{g.asn !== null ? ` (AS${g.asn})` : ""}</td></tr>
                <tr><th scope="row">Coordinates</th><td className="font-mono">{g.latitude !== null ? `${g.latitude.toFixed(2)}, ${g.longitude.toFixed(2)}` : "\u2014"}</td></tr>
                <tr><th scope="row">Precision</th><td>{precisionLabel(g.precision)}{g.accuracy_radius_km !== null ? ` (within ~${g.accuracy_radius_km} km)` : ""}</td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>
            {geoStatus.available === false
              ? "No location database uploaded yet (run scripts/upload_geoip.py)"
              : "No location found for this IP"}
          </Empty>
        )}
      </Panel>

      <Panel title={`Sessions (${sessions.length})`} className="mt-5">
        {sessions.length === 0 ? <Empty>No sessions</Empty> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Session</th><th>Start</th><th>Duration</th><th>Login</th><th>Cmds</th></tr></thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-mono"><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(s.id)}`}>{s.id}</Link></td>
                    <td className="font-mono text-xs">{fmtDateTime(s.start_time)}</td>
                    <td className="font-mono">{fmtSessionDuration(s)}</td>
                    <td><AccessPill ok={s.login_success} /></td>
                    <td className="font-mono">{s.command_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={`Command log (${commands.length})`} className="mt-5" threat>
        {commands.length === 0 ? <Empty>No commands from this IP</Empty> : (
          <table className="tbl">
            <thead><tr><th>Time</th><th>Command</th><th /></tr></thead>
            <tbody>
              {commands.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs whitespace-nowrap">{fmtDateTime(c.timestamp)}</td>
                  <td><ExpandableText text={c.input} /></td>
                  <td className="whitespace-nowrap">{c.cmd_key ? <Link className="text-xs text-signal underline" to={`/commands/${c.cmd_key}`}>details</Link> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
