import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Pager from "../components/Pager.jsx";
import Panel from "../components/Panel.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getCommandGroup, getCommandOccurrences } from "../lib/api.js";
import { fmtDateTime } from "../lib/format.js";
import { PAGE_LIMIT } from "../lib/paging.js";

export default function CommandDetailPage() {
  const { key = "" } = useParams();
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAsync(async () => {
    const [group, occ] = await Promise.all([
      getCommandGroup(key),
      getCommandOccurrences(key, { limit: PAGE_LIMIT, skip: page * PAGE_LIMIT }),
    ]);
    return { group, occ };
  }, [key, page]);

  const header = <PageHeader path={`commands/${key}`} title="Command detail" />;
  if (!data && loading) return <div>{header}<Loading /></div>;
  if (!data && error && error.status === 404) {
    return <div>{header}<Empty>Command not found. <Link className="text-signal underline" to="/commands">Back to commands</Link></Empty></div>;
  }
  if (!data) return <div>{header}<ErrorBox error={error} onRetry={reload} /></div>;

  const { group, occ } = data;
  return (
    <div>
      {header}
      <Panel title="Command" threat>
        <pre className="whitespace-pre-wrap break-all font-mono text-sm text-ink">{group.text}</pre>
      </Panel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <StatBlock label="Executions" value={group.count} />
        <StatBlock label="Distinct IPs" value={group.ip_count} />
        <StatBlock label="Sessions" value={group.session_count} />
        <StatBlock label="Last seen" text={fmtDateTime(group.last_ts)} />
      </div>
      <Panel title="Occurrences">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Time</th><th>IP</th><th>Session</th></tr></thead>
            <tbody>
              {occ.rows.map((c, i) => (
                <tr key={c.id || i}>
                  <td className="font-mono text-xs whitespace-nowrap">{fmtDateTime(c.timestamp)}</td>
                  <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(c.src_ip)}`}>{c.src_ip}</Link></td>
                  <td className="font-mono"><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(c.session_id)}`}>{c.session_id}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={page} size={PAGE_LIMIT} shown={occ.rows.length} total={occ.total} onPage={setPage} disabled={loading} />
      </Panel>
    </div>
  );
}
