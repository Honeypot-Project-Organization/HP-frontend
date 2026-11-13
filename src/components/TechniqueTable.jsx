import { Link } from "react-router-dom";
import { fmtDateTime } from "../lib/format.js";
import { Empty } from "./States.jsx";

/** Compact table of technique rows (id, name, occurrences, IPs, optionally last seen). */
export default function TechniqueTable({ rows, showLast = false, empty = "No techniques yet" }) {
  if (!rows || rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Occurrences</th><th>IPs</th>{showLast && <th>Last seen</th>}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-mono"><Link className="text-signal hover:underline" to={`/mitre/${r.id}`}>{r.id}</Link></td>
              <td>{r.name || "—"}</td>
              <td className="font-mono">{r.occurrences.toLocaleString("en-US")}</td>
              <td className="font-mono">{r.ips.toLocaleString("en-US")}</td>
              {showLast && <td className="font-mono text-xs">{fmtDateTime(r.last_seen)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
