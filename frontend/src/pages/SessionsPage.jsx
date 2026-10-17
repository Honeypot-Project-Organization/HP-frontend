import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import SortTh, { nextSort, sortRows } from "../components/SortTh.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { getSessionsPage } from "../lib/api.js";
import { fmtDateTime, fmtDuration } from "../lib/format.js";

const STEP = 100;

export default function SessionsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [q, setQ] = useState("");
  const [result, setResult] = useState("all");
  const [sort, setSort] = useState({ key: "start_time", dir: "desc" });

  async function load(reset) {
    setLoading(true); setError(null);
    try {
      const page = await getSessionsPage(reset ? 0 : rows.length, STEP);
      setRows(reset ? page : [...rows, ...page]);
      setMore(page.length === STEP);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const shown = useMemo(() => {
    const f = rows.filter((s) => s.src_ip.includes(q.trim()) && (result === "all" || (result === "granted") === s.login_success));
    return sortRows(f, sort);
  }, [rows, q, result, sort]);
  const onSort = (k) => setSort((s) => nextSort(s, k));

  return (
    <div>
      <PageHeader path="sessions" title="Sessions">
        <RefreshButton onClick={() => load(true)} loading={loading} updatedAt={updatedAt} />
      </PageHeader>
      {rows.length === 0 && loading && <Loading />}
      {rows.length === 0 && error && <ErrorBox error={error} onRetry={() => load(true)} />}
      {(rows.length > 0 || (!loading && !error)) && (
        <Panel title={`${shown.length} shown / ${rows.length} loaded`} right={
          <div className="flex gap-2">
            <input className="input !w-40" placeholder="filter by IP" aria-label="Filter by IP" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="input !w-32" aria-label="Filter by result" value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="all">all</option><option value="granted">granted</option><option value="denied">denied</option>
            </select>
          </div>
        }>
          {error && <div className="mb-3"><ErrorBox error={error} /></div>}
          {shown.length === 0 ? <Empty>{rows.length === 0 ? "No sessions recorded yet" : "No sessions match the filters"}</Empty> : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <SortTh label="Source IP" k="src_ip" sort={sort} onSort={onSort} />
                    <SortTh label="Start" k="start_time" sort={sort} onSort={onSort} />
                    <SortTh label="Duration" k="duration_seconds" sort={sort} onSort={onSort} />
                    <SortTh label="Login" k="login_success" sort={sort} onSort={onSort} />
                    <SortTh label="User" k="username" sort={sort} onSort={onSort} />
                    <SortTh label="Cmds" k="command_count" sort={sort} onSort={onSort} />
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(s.src_ip)}`}>{s.src_ip}</Link></td>
                      <td className="font-mono text-xs">{fmtDateTime(s.start_time)}</td>
                      <td className="font-mono">{fmtDuration(s.duration_seconds)}</td>
                      <td><AccessPill ok={s.login_success} /></td>
                      <td className="data">{s.username ?? "\u2014"}</td>
                      <td className="font-mono">{s.command_count}</td>
                      <td><Link className="text-xs text-signal underline" to={`/sessions/${encodeURIComponent(s.id)}`}>open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {more && <div className="mt-4 text-center"><button className="btn" onClick={() => load(false)} disabled={loading}>{loading ? "Loading" : "Load older sessions"}</button></div>}
        </Panel>
      )}
    </div>
  );
}
