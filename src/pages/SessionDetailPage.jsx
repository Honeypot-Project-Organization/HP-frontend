import { Link, useParams } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import ExpandableText from "../components/ExpandableText.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getIpSessions, getSession, getSessionCommands } from "../lib/api.js";
import { fmtDateTime, fmtDuration, hashStr, toDate } from "../lib/format.js";

function Row({ k, children }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-line/40">
      <dt className="w-36 shrink-0 font-mono text-xs uppercase tracking-wider text-mute">{k}</dt>
      <dd className="min-w-0 break-all font-mono text-sm">{children}</dd>
    </div>
  );
}

export default function SessionDetailPage() {
  const { sessionId = "" } = useParams();
  const { data, error, loading, updatedAt, reload } = useAsync(async () => {
    const [session, commands] = await Promise.all([getSession(sessionId), getSessionCommands(sessionId)]);
    const others = (await getIpSessions(session.src_ip).catch(() => [])).filter((s) => s.id !== session.id).slice(0, 10);
    return { session, commands, others };
  }, [sessionId]);

  const header = (
    <PageHeader path={`sessions/${sessionId}`} title={`Session ${sessionId}`}>
      <RefreshButton onClick={reload} loading={loading} updatedAt={updatedAt} />
    </PageHeader>
  );
  if (!data && loading) return <div>{header}<Loading /></div>;
  if (!data) return <div>{header}<ErrorBox error={error} onRetry={reload} /></div>;

  const { session: s, commands, others } = data;
  const t0 = toDate(s.start_time)?.getTime();
  return (
    <div>
      {header}
      <Panel title="Summary">
        <dl>
          <Row k="Source IP"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(s.src_ip)}`}>{s.src_ip}</Link>{s.src_port ? `:${s.src_port}` : ""}</Row>
          <Row k="Protocol">{s.protocol}{s.dst_port ? ` (port ${s.dst_port})` : ""}</Row>
          <Row k="Login"><AccessPill ok={s.login_success} /></Row>
          <Row k="Username">{s.username ?? "\u2014"}</Row>
          <Row k="Password">{s.password ?? "\u2014"}</Row>
          <Row k="Started">{fmtDateTime(s.start_time)}</Row>
          <Row k="Ended">{fmtDateTime(s.end_time)}</Row>
          <Row k="Duration">{fmtDuration(s.duration_seconds)}</Row>
          <Row k="Status">{s.status}</Row>
          <Row k="Client">{s.client_version ?? "\u2014"}</Row>
          <Row k="Downloads">{s.download_count}</Row>
        </dl>
      </Panel>

      <Panel title={`Command log (${commands.length})`} className="mt-5" threat>
        {commands.length === 0 ? <Empty>No commands in this session</Empty> : (
          <table className="tbl">
            <thead><tr><th>#</th><th>Time</th><th>+s</th><th>Command</th><th /></tr></thead>
            <tbody>
              {commands.map((c, i) => {
                const t = toDate(c.timestamp)?.getTime();
                const off = t && t0 ? Math.max(0, Math.round((t - t0) / 1000)) : null;
                return (
                  <tr key={c.id || i}>
                    <td className="font-mono text-mute">{i + 1}</td>
                    <td className="font-mono text-xs whitespace-nowrap">{fmtDateTime(c.timestamp)}</td>
                    <td className="font-mono">{off === null ? "\u2014" : `+${off}`}</td>
                    <td><ExpandableText text={c.input} /></td>
                    <td className="whitespace-nowrap"><Link className="text-xs text-signal underline" to={`/commands/${hashStr(c.input.trim())}`}>details</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {others.length > 0 && (
        <Panel title={`Other sessions from ${s.src_ip}`} className="mt-5">
          <ul className="space-y-1 font-mono text-sm">
            {others.map((o) => (
              <li key={o.id}><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(o.id)}`}>{o.id}</Link> <span className="text-mute">{fmtDateTime(o.start_time)}</span></li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
