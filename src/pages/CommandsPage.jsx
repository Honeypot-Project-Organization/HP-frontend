import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Pager from "../components/Pager.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import SortTh, { nextSort } from "../components/SortTh.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { useDebounced } from "../hooks/useDebounced.js";
import { clearCache, getCommandGroups, getStats } from "../lib/api.js";
import { fmtDateTime, truncate } from "../lib/format.js";
import { PAGE_LIMIT, pageCount } from "../lib/paging.js";

export default function CommandsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "count", dir: "desc" });
  const [page, setPage] = useState(0);
  const dq = useDebounced(q.trim(), 300);

  const { data, error, loading, updatedAt, reload } = useAsync(async () => {
    const [list, stats] = await Promise.all([
      getCommandGroups({ limit: PAGE_LIMIT, skip: page * PAGE_LIMIT, q: dq, sort: sort.key, order: sort.dir }),
      getStats(),
    ]);
    return { ...list, stats };
  }, [page, dq, sort.key, sort.dir]);

  useEffect(() => {
    if (data && data.rows.length === 0 && page > 0 && data.total !== null) setPage(pageCount(data.total, PAGE_LIMIT) - 1);
  }, [data, page]);

  const refresh = () => { clearCache(); reload(); };
  const onSort = (k) => { setSort((s) => nextSort(s, k)); setPage(0); };
  const top = data && sort.key === "count" && sort.dir === "desc" && page === 0 && !dq ? data.rows[0] : null;

  return (
    <div>
      <PageHeader path="commands" title="Commands">
        <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
      </PageHeader>
      {!data && loading && <Loading />}
      {!data && error && <ErrorBox error={error} onRetry={refresh} />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <StatBlock label="Commands recorded" value={data.stats.total_commands} hint="all of them" />
            <StatBlock label={dq ? "Matching commands" : "Unique commands"} value={data.total ?? data.rows.length} />
            <StatBlock label="Most common" text={top ? `${top.count}×` : "—"} hint={top ? truncate(top.text, 40) : "sort by Count to see"} tone="threat" />
          </div>
          <Panel title="Command summary" right={<input className="input !w-56" placeholder="search all commands" aria-label="Search commands" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />}>
            {error && <div className="mb-3"><ErrorBox error={error} /></div>}
            {data.rows.length === 0 ? <Empty>{dq ? "No commands match" : "No commands recorded yet"}</Empty> : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <SortTh label="Command" k="text" sort={sort} onSort={onSort} />
                      <SortTh label="Count" k="count" sort={sort} onSort={onSort} />
                      <SortTh label="IPs" k="ip_count" sort={sort} onSort={onSort} />
                      <SortTh label="Sessions" k="session_count" sort={sort} onSort={onSort} />
                      <SortTh label="Last seen" k="last_ts" sort={sort} onSort={onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((g) => (
                      <tr key={g.key}>
                        <td className="data"><Link className="text-signal hover:underline" to={`/commands/${g.key}`}>{truncate(g.text, 120)}</Link></td>
                        <td className="font-mono">{g.count}</td>
                        <td className="font-mono">{g.ip_count}</td>
                        <td className="font-mono">{g.session_count}</td>
                        <td className="font-mono text-xs">{fmtDateTime(g.last_ts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={page} size={PAGE_LIMIT} shown={data.rows.length} total={data.total} onPage={setPage} disabled={loading} />
          </Panel>
        </>
      )}
    </div>
  );
}
