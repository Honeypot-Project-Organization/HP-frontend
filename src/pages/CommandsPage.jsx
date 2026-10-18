import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import SortTh, { nextSort, sortRows } from "../components/SortTh.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { clearCache, getCommandCorpus } from "../lib/api.js";
import { groupCommands, summarizeGroups } from "../lib/commands.js";
import { fmtDateTime, truncate } from "../lib/format.js";

export default function CommandsPage() {
  const { data, error, loading, updatedAt, reload } = useAsync(async () => groupCommands(await getCommandCorpus()), []);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "count", dir: "desc" });
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const flat = (data || []).map((g) => ({ ...g, last_ts: g.last ? g.last.getTime() : null }));
    return sortRows(flat.filter((g) => !n || g.text.toLowerCase().includes(n)), sort);
  }, [data, q, sort]);
  const sum = data ? summarizeGroups(data) : null;
  const refresh = () => { clearCache(); reload(); };
  const onSort = (k) => setSort((s) => nextSort(s, k));

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
            <StatBlock label="Commands loaded" value={sum.total} hint="most recent, up to 2000" />
            <StatBlock label="Unique commands" value={sum.unique} />
            <StatBlock label="Most common" text={sum.top ? `${sum.top.count}\u00d7` : "\u2014"} hint={sum.top ? truncate(sum.top.text, 40) : "none yet"} tone="threat" />
          </div>
          <Panel title="Command summary" right={<input className="input !w-56" placeholder="search commands" aria-label="Search commands" value={q} onChange={(e) => setQ(e.target.value)} />}>
            {rows.length === 0 ? <Empty>{data.length === 0 ? "No commands recorded yet" : "No commands match"}</Empty> : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <SortTh label="Command" k="text" sort={sort} onSort={onSort} />
                      <SortTh label="Count" k="count" sort={sort} onSort={onSort} />
                      <SortTh label="IPs" k="ipCount" sort={sort} onSort={onSort} />
                      <SortTh label="Sessions" k="sessionCount" sort={sort} onSort={onSort} />
                      <SortTh label="Last seen" k="last_ts" sort={sort} onSort={onSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((g) => (
                      <tr key={g.key}>
                        <td className="data"><Link className="text-signal hover:underline" to={`/commands/${g.key}`}>{truncate(g.text, 120)}</Link></td>
                        <td className="font-mono">{g.count}</td>
                        <td className="font-mono">{g.ipCount}</td>
                        <td className="font-mono">{g.sessionCount}</td>
                        <td className="font-mono text-xs">{fmtDateTime(g.last)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
