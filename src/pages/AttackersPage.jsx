import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import SortTh, { nextSort, sortRows } from "../components/SortTh.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { clearCache, getAttackers } from "../lib/api.js";
import { fmtDateTime } from "../lib/format.js";

export default function AttackersPage() {
  const { data, error, loading, updatedAt, reload } = useAsync(getAttackers, []);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "last_seen", dir: "desc" });
  const rows = useMemo(() => {
    const f = (data || []).filter((a) => a.ip.includes(q.trim()));
    return sortRows(f, sort);
  }, [data, q, sort]);
  const refresh = () => { clearCache(); reload(); };
  const onSort = (k) => setSort((s) => nextSort(s, k));

  return (
    <div>
      <PageHeader path="attackers" title="Attackers">
        <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
      </PageHeader>
      {!data && loading && <Loading />}
      {!data && error && <ErrorBox error={error} onRetry={refresh} />}
      {data && (
        <Panel title={`${rows.length} of ${data.length} IPs`} right={
          <input className="input !w-48" placeholder="filter by IP" aria-label="Filter by IP" value={q} onChange={(e) => setQ(e.target.value)} />
        }>
          {rows.length === 0 ? <Empty>{data.length === 0 ? "No attackers recorded yet" : "No IPs match the filter"}</Empty> : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <SortTh label="IP" k="ip" sort={sort} onSort={onSort} />
                    <SortTh label="Sessions" k="total_sessions" sort={sort} onSort={onSort} />
                    <SortTh label="Logins ok" k="successful_logins" sort={sort} onSort={onSort} />
                    <SortTh label="Auth tries" k="total_auth_attempts" sort={sort} onSort={onSort} />
                    <SortTh label="Commands" k="total_commands" sort={sort} onSort={onSort} />
                    <SortTh label="First seen" k="first_seen" sort={sort} onSort={onSort} />
                    <SortTh label="Last seen" k="last_seen" sort={sort} onSort={onSort} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.ip}>
                      <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(a.ip)}`}>{a.ip}</Link></td>
                      <td className="font-mono">{a.total_sessions}</td>
                      <td className="font-mono">{a.successful_logins}</td>
                      <td className="font-mono">{a.total_auth_attempts}</td>
                      <td className="font-mono">{a.total_commands}</td>
                      <td className="font-mono text-xs">{fmtDateTime(a.first_seen)}</td>
                      <td className="font-mono text-xs">{fmtDateTime(a.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
