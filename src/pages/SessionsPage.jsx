import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import DateRange from "../components/DateRange.jsx";
import Select from "../components/Select.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Pager from "../components/Pager.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import SortTh, { nextSort } from "../components/SortTh.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { useDebounced } from "../hooks/useDebounced.js";
import { clearCache, getSessionsList } from "../lib/api.js";
import { parseUtcInput, rangeProblem } from "../lib/dates.js";
import { fmtDateTime, fmtSessionDuration } from "../lib/format.js";
import { PAGE_LIMIT, pageCount } from "../lib/paging.js";

export default function SessionsPage() {
  const [q, setQ] = useState("");
  const [login, setLogin] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState({ key: "start_time", dir: "desc" });
  const [page, setPage] = useState(0);
  const dq = useDebounced(q.trim(), 300);
  const bad = rangeProblem(from, to);
  const dateFrom = bad ? null : parseUtcInput(from);
  const dateTo = bad ? null : parseUtcInput(to, { end: true });

  const { data, error, loading, updatedAt, reload } = useAsync(
    () => getSessionsList({
      limit: PAGE_LIMIT, skip: page * PAGE_LIMIT, q: dq, login: login === "all" ? "" : login,
      date_from: dateFrom, date_to: dateTo, sort: sort.key, order: sort.dir,
    }),
    [page, dq, login, dateFrom, dateTo, sort.key, sort.dir],
  );

  useEffect(() => {
    if (data && data.rows.length === 0 && page > 0 && data.total !== null) setPage(pageCount(data.total, PAGE_LIMIT) - 1);
  }, [data, page]);

  const filtered = (v) => (set) => { set(v); setPage(0); };
  const refresh = () => { clearCache(); reload(); };
  const onSort = (k) => { setSort((s) => nextSort(s, k)); setPage(0); };
  const anyFilter = Boolean(dq || login !== "all" || dateFrom || dateTo);

  return (
    <div>
      <PageHeader path="sessions" title="Sessions">
        <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
      </PageHeader>
      {!data && loading && <Loading />}
      {!data && error && <ErrorBox error={error} onRetry={refresh} />}
      {data && (
        <Panel
          title={data.total === null ? "Sessions" : `${data.total.toLocaleString("en-US")} ${anyFilter ? "matching " : ""}sessions`}
          right={
            <div className="flex gap-2">
              <input className="input !w-44" placeholder="filter by IP (all sessions)" aria-label="Filter by IP" value={q} onChange={(e) => filtered(e.target.value)(setQ)} />
              <Select
                label="Filter by result" value={login} width={128} onChange={(v) => filtered(v)(setLogin)}
                options={[{ value: "all", label: "all" }, { value: "granted", label: "granted" }, { value: "denied", label: "denied" }]}
              />
            </div>
          }
        >
          <DateRange from={from} to={to} onFrom={(v) => filtered(v)(setFrom)} onTo={(v) => filtered(v)(setTo)} />
          {error && <div className="mb-3"><ErrorBox error={error} /></div>}
          {data.rows.length === 0 ? <Empty>{anyFilter ? "No sessions match the filters" : "No sessions recorded yet"}</Empty> : (
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
                  {data.rows.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono"><Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(s.src_ip)}`}>{s.src_ip}</Link></td>
                      <td className="font-mono text-xs">{fmtDateTime(s.start_time)}</td>
                      <td className="font-mono">{fmtSessionDuration(s)}</td>
                      <td><AccessPill ok={s.login_success} /></td>
                      <td className="data">{s.username ?? "—"}</td>
                      <td className="font-mono">{s.command_count}</td>
                      <td><Link className="text-xs text-signal underline" to={`/sessions/${encodeURIComponent(s.id)}`}>open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} size={PAGE_LIMIT} shown={data.rows.length} total={data.total} onPage={setPage} disabled={loading} />
        </Panel>
      )}
    </div>
  );
}
