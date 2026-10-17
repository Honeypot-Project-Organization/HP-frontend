import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getCommandCorpus } from "../lib/api.js";
import { groupCommands } from "../lib/commands.js";
import { fmtDateTime } from "../lib/format.js";

export default function CommandDetailPage() {
  const { key = "" } = useParams();
  const { data, error, loading, reload } = useAsync(async () => groupCommands(await getCommandCorpus()).find((g) => g.key === key) || null, [key]);

  const header = <PageHeader path={`commands/${key}`} title="Command detail" />;
  if (!data && loading) return <div>{header}<Loading /></div>;
  if (error && !data) return <div>{header}<ErrorBox error={error} onRetry={reload} /></div>;
  if (!data) {
    return (
      <div>{header}
        <Empty>Command not found in the most recent commands. <Link className="text-signal underline" to="/commands">Back to commands</Link></Empty>
      </div>
    );
  }
  const items = [...data.items].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  return (
    <div>
      {header}
      <Panel title="Command" threat>
        <pre className="whitespace-pre-wrap break-all font-mono text-sm text-ink">{data.text}</pre>
      </Panel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <StatBlock label="Executions" value={data.count} />
        <StatBlock label="Distinct IPs" value={data.ipCount} />
        <StatBlock label="Sessions" value={data.sessionCount} />
        <StatBlock label="Last seen" text={data.last ? data.last.toISOString().slice(0, 10) : "\u2014"} />
      </div>
      <Panel title="Occurrences">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Time</th><th>IP</th><th>Session</th></tr></thead>
            <tbody>
              {items.slice(0, 200).map((c, i) => (
                <tr key={c.id || i}>
                  <td className="font-mono text-xs whitespace-nowrap">{fmtDateTime(c.timestamp)}</td>
                  <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(c.src_ip)}`}>{c.src_ip}</Link></td>
                  <td className="font-mono"><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(c.session_id)}`}>{c.session_id}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
