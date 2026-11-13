import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AccessPill from "../components/AccessPill.jsx";
import ConnectionChart from "../components/ConnectionChart.jsx";
import ExpandableText from "../components/ExpandableText.jsx";
import MatchNote from "../components/MatchNote.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Pager from "../components/Pager.jsx";
import Panel from "../components/Panel.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { getMitreDaily, getMitreLinked, getMitreTechnique } from "../lib/api.js";
import { fmtDateTime, fmtSessionDuration } from "../lib/format.js";
import { attackUrl, isTechId, tacticsLabel } from "../lib/mitre.js";
import { PAGE_LIMIT } from "../lib/paging.js";
import { fillDays } from "../lib/series.js";

const RANGES = [7, 14, 30, 90];

function LinkedPanel({ id, kind, title, head, row }) {
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAsync(
    () => getMitreLinked(id, kind, { limit: PAGE_LIMIT, skip: page * PAGE_LIMIT }), [id, kind, page],
  );
  return (
    <Panel title={`${title}${data && data.total !== null ? ` (${data.total.toLocaleString("en-US")})` : ""}`} className="mt-5">
      {!data && loading && <Loading />}
      {!data && error && <ErrorBox error={error} onRetry={reload} />}
      {data && (data.rows.length === 0 ? <Empty>Nothing linked yet</Empty> : (
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{data.rows.map((r, i) => row(r, i))}</tbody>
          </table>
        </div>
      ))}
      {data && <Pager page={page} size={PAGE_LIMIT} shown={data.rows.length} total={data.total} onPage={setPage} disabled={loading} />}
    </Panel>
  );
}

const ipLink = (ip) => <Link className="text-signal hover:underline" to={`/attackers/${encodeURIComponent(ip)}`}>{ip}</Link>;

export default function MitreDetailPage() {
  const { tid = "" } = useParams();
  const [days, setDays] = useState(30);
  const valid = isTechId(tid);
  const detail = useAsync(() => (valid ? getMitreTechnique(tid) : Promise.reject(Object.assign(new Error("Not a MITRE technique id"), { status: 404 }))), [tid]);
  const daily = useAsync(() => (valid ? getMitreDaily(tid, days).then((r) => fillDays(r, days)) : Promise.resolve([])), [tid, days]);

  const header = <PageHeader path={`mitre/${tid}`} title={valid ? tid : "MITRE technique"} />;
  // useAsync keeps the previous result when a fetch fails, so ignore data that belongs to another id.
  const { data: cur, error, loading, reload } = detail;
  const t = cur && cur.id === tid ? cur : null;
  if (!t && loading) return <div>{header}<Loading /></div>;
  if (!t && error && error.status === 404) {
    return <div>{header}<Empty>No such technique. <Link className="text-signal underline" to="/mitre">Back to MITRE techniques</Link></Empty></div>;
  }
  if (!t) return <div>{header}<ErrorBox error={error} onRetry={reload} /></div>;

  const url = attackUrl(t.id);
  return (
    <div>
      {header}
      <Panel title={t.name || t.id} threat>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">Technique</dt>
          <dd className="font-mono">{t.id}{t.known ? "" : " (no longer in the rule catalog)"}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">Tactic</dt>
          <dd>{tacticsLabel(t.tactics)}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">Matched from</dt>
          <dd>{t.basis === "event" ? "events (connections and logins)" : "command text"}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">First seen</dt>
          <dd className="font-mono">{fmtDateTime(t.first_seen)}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">Last seen</dt>
          <dd className="font-mono">{fmtDateTime(t.last_seen)}</dd>
          <dt className="font-mono text-xs uppercase tracking-wider text-mute">MITRE page</dt>
          <dd>{url ? <a className="text-signal underline" href={url} target="_blank" rel="noopener noreferrer">{url.replace("https://", "")}</a> : "—"}</dd>
        </dl>
        <MatchNote className="mt-3" />
      </Panel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-5">
        <StatBlock label="Occurrences" value={t.occurrences} hint={t.basis === "event" ? "events" : "commands matched"} />
        <StatBlock label="IPs" value={t.ips} />
        <StatBlock label="Sessions" value={t.sessions} />
        <StatBlock label="Commands" value={t.commands} />
      </div>

      <Panel title="Matching rules">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Rule</th><th>Applies to</th><th>Pattern (regular expression, case-insensitive)</th></tr></thead>
            <tbody>
              {t.rules.length === 0 && <tr><td colSpan={3} className="text-mute">No rule produces this technique any more.</td></tr>}
              {t.rules.map((r) => (
                <tr key={r.name}>
                  <td className="font-mono text-xs">{r.name}</td>
                  <td className="font-mono text-xs">{r.scope === "full" ? "whole command line" : r.scope === "event" ? "event" : "each command segment"}</td>
                  <td className="data text-xs">{r.pattern ?? r.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-xs text-mute">A command line is split on ; && || and | and each part is tested separately, unless the rule applies to the whole line.</p>
      </Panel>

      <Panel title="Activity" className="mt-5" right={
        <div className="flex gap-1" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r} type="button" className={`btn ${r === days ? "btn-primary" : ""}`} onClick={() => setDays(r)} aria-pressed={r === days}>{r}d</button>
          ))}
        </div>
      }>
        {daily.error && !daily.data ? <ErrorBox error={daily.error} onRetry={daily.reload} /> : (
          <ConnectionChart data={daily.data || []} label="Occurrences" emptyText="No occurrences in this range" />
        )}
      </Panel>

      <LinkedPanel
        id={t.id} kind="commands" title="Linked commands" head={["Time", "IP", "Session", "Command", ""]}
        row={(c, i) => (
          <tr key={c.id || i}>
            <td className="font-mono text-xs whitespace-nowrap">{fmtDateTime(c.timestamp)}</td>
            <td className="font-mono">{ipLink(c.src_ip)}</td>
            <td className="font-mono"><Link className="text-signal hover:underline" to={`/sessions/${encodeURIComponent(c.session_id)}`}>{c.session_id}</Link></td>
            <td><ExpandableText text={c.input} /></td>
            <td className="whitespace-nowrap">{c.cmd_key ? <Link className="text-xs text-signal underline" to={`/commands/${c.cmd_key}`}>details</Link> : null}</td>
          </tr>
        )}
      />
      <LinkedPanel
        id={t.id} kind="ips" title="Linked IPs" head={["IP", "Sessions", "Commands", "First seen", "Last seen"]}
        row={(a) => (
          <tr key={a.ip}>
            <td className="font-mono">{ipLink(a.ip)}</td>
            <td className="font-mono">{a.total_sessions}</td>
            <td className="font-mono">{a.total_commands}</td>
            <td className="font-mono text-xs">{fmtDateTime(a.first_seen)}</td>
            <td className="font-mono text-xs">{fmtDateTime(a.last_seen)}</td>
          </tr>
        )}
      />
      <LinkedPanel
        id={t.id} kind="sessions" title="Linked sessions" head={["Source IP", "Start", "Duration", "Login", "Cmds", ""]}
        row={(s) => (
          <tr key={s.id}>
            <td className="font-mono">{ipLink(s.src_ip)}</td>
            <td className="font-mono text-xs">{fmtDateTime(s.start_time)}</td>
            <td className="font-mono">{fmtSessionDuration(s)}</td>
            <td><AccessPill ok={s.login_success} /></td>
            <td className="font-mono">{s.command_count}</td>
            <td><Link className="text-xs text-signal underline" to={`/sessions/${encodeURIComponent(s.id)}`}>open</Link></td>
          </tr>
        )}
      />
    </div>
  );
}
