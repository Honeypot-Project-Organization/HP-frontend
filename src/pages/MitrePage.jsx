import { useState } from "react";
import { Link } from "react-router-dom";
import MatchNote from "../components/MatchNote.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Panel from "../components/Panel.jsx";
import RefreshButton from "../components/RefreshButton.jsx";
import Select from "../components/Select.jsx";
import StatBlock from "../components/StatBlock.jsx";
import { Empty, ErrorBox, Loading } from "../components/States.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { clearCache, getMitreSummary } from "../lib/api.js";
import { fmtDateTime } from "../lib/format.js";

const FILTERS = [
  { value: "all", label: "all techniques" },
  { value: "event", label: "event-based" },
  { value: "command", label: "command-based" },
];

function topBlock(label, row, tone) {
  return <StatBlock label={label} text={row ? row.id : "—"} hint={row ? `${row.name || ""} · ${row.occurrences.toLocaleString("en-US")}×` : "none yet"} tone={tone} />;
}

export default function MitrePage() {
  const { data, error, loading, updatedAt, reload } = useAsync(getMitreSummary, [], 60000);
  const [basis, setBasis] = useState("all");
  const refresh = () => { clearCache(); reload(); };
  const header = (
    <PageHeader path="mitre" title="MITRE ATT&CK">
      <RefreshButton onClick={refresh} loading={loading} updatedAt={updatedAt} />
    </PageHeader>
  );
  if (!data && loading) return <div>{header}<Loading /></div>;
  if (!data) return <div>{header}<ErrorBox error={error} onRetry={refresh} /></div>;

  const rows = data.techniques.filter((r) => basis === "all" || r.basis === basis);
  return (
    <div>
      {header}
      {error && <div className="mb-4"><ErrorBox error={error} /></div>}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
        <StatBlock label="Total IDs" value={data.total_ids} hint="all matches, repeats included" />
        <StatBlock label="Unique IDs" value={data.unique_ids} hint="distinct techniques seen" />
        {topBlock("Top ID", data.top, "threat")}
        {topBlock("Top event-based", data.top_event)}
        {topBlock("Top command-based", data.top_command)}
      </div>
      <MatchNote className="mb-5" />
      <Panel
        title={`${rows.length} technique${rows.length === 1 ? "" : "s"}`}
        right={<Select label="Technique type" value={basis} onChange={setBasis} options={FILTERS} width={176} />}
      >
        {rows.length === 0 ? <Empty>No techniques matched yet</Empty> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Type</th><th>Occurrences</th><th>IPs</th><th>Last seen</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono"><Link className="text-signal hover:underline" to={`/mitre/${r.id}`}>{r.id}</Link></td>
                    <td>{r.name || "—"}</td>
                    <td className="font-mono text-xs">{r.basis}</td>
                    <td className="font-mono">{r.occurrences.toLocaleString("en-US")}</td>
                    <td className="font-mono">{r.ips.toLocaleString("en-US")}</td>
                    <td className="font-mono text-xs">{fmtDateTime(r.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
