import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { clearCache, getAttackersList } from "../lib/api.js";
import { parseUtcInput, rangeProblem } from "../lib/dates.js";
import { fmtDateTime } from "../lib/format.js";
import { PAGE_LIMIT, pageCount } from "../lib/paging.js";

export default function AttackersPage() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateField, setDateField] = useState("last_seen");
  const [sort, setSort] = useState({ key: "last_seen", dir: "desc" });
  const [page, setPage] = useState(0);
  const dq = useDebounced(q.trim(), 300);
  const bad = rangeProblem(from, to);
  const dateFrom = bad ? null : parseUtcInput(from);
  const dateTo = bad ? null : parseUtcInput(to, { end: true });

  const { data, error, loading, updatedAt, reload } = useAsync(
    () => getAttackersList({
      limit: PAGE_LIMIT, skip: page * PAGE_LIMIT, q: dq, date_from: dateFrom, date_to: dateTo,
      date_field: dateField, sort: sort.key, order: sort.dir,
    }),
    [page, dq, dateFrom, dateTo, dateField, sort.key, sort.dir],
  );

  // If the list shrank while viewing a late page, step back to the last real page.
  useEffect(() => {
    if (data && data.rows.length === 0 && page > 0 && data.total !== null) setPage(pageCount(data.total, PAGE_LIMIT) - 1);
  }, [data, page]);

  const filtered = (v) => (set) => { set(v); setPage(0); };
  const refresh = () => { clearCache(); reload(); };
  const onSort = (k) => { setSort((s) => nextSort(s, k)); setPage(0); };
  const anyFilter = Boolean(dq || dateFrom || dateTo);

  return (
    <div>
      <PageHeader path="attackers" title="Attackers">
        <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
      </PageHeader>
      {!data && loading && <Loading />}
      {!data && error && <ErrorBox error={error} onRetry={refresh} />}
      {data && (
        <Panel
          title={data.total === null ? "IPs" : `${data.total.toLocaleString("en-US")} ${anyFilter ? "matching " : ""}IPs`}
          right={<input className="input !w-48" placeholder="filter by IP (all IPs)" aria-label="Filter by IP" value={q} onChange={(e) => filtered(e.target.value)(setQ)} />}
        >
          <DateRange
            from={from} to={to}
            onFrom={(v) => filtered(v)(setFrom)} onTo={(v) => filtered(v)(setTo)}
            extra={
              <div className="flex flex-col gap-1"><span>Date applies to</span>
                <Select
                  label="Date applies to" value={dateField} width={144}
                  onChange={(v) => filtered(v)(setDateField)}
                  options={[{ value: "last_seen", label: "last seen" }, { value: "first_seen", label: "first seen" }]}
                />
              </div>
            }
          />
          {error && <div className="mb-3"><ErrorBox error={error} /></div>}
          {data.rows.length === 0 ? <Empty>{anyFilter ? "No IPs match the filters" : "No attackers recorded yet"}</Empty> : (
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
                  {data.rows.map((a) => (
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
          <Pager page={page} size={PAGE_LIMIT} shown={data.rows.length} total={data.total} onPage={setPage} disabled={loading} />
        </Panel>
      )}
    </div>
  );
}
