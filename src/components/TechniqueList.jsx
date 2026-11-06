import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog.js";
import { isTechId, tacticsLabel } from "../lib/mitre.js";
import MatchNote from "./MatchNote.jsx";

/** Linked MITRE techniques for a command / session / IP. ids: array of technique ids. */
export default function TechniqueList({ ids, showNote = true, empty = "None matched" }) {
  const { byId } = useCatalog();
  const list = (Array.isArray(ids) ? ids : []).filter(isTechId);
  if (list.length === 0) return <span className="font-mono text-xs text-mute">{empty}</span>;
  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {list.map((id) => {
          const c = byId.get(id);
          return (
            <li key={id}>
              <Link
                to={`/mitre/${id}`} title={c ? tacticsLabel(c.tactics) : undefined}
                className="inline-block border border-line bg-raised px-2 py-1 font-mono text-xs text-signal hover:border-signal"
              >
                {id}{c && c.name ? <span className="text-ink"> {c.name}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
      {showNote && <MatchNote className="mt-2" />}
    </div>
  );
}
