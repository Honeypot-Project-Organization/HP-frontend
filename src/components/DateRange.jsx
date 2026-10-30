import { rangeProblem } from "../lib/dates.js";
import DateTimeField from "./DateTimeField.jsx";

/**
 * From / To pickers (themed calendar + clock, down to the second).
 * Values are in UTC (the dashboard shows UTC everywhere). Empty = no limit.
 */
export default function DateRange({ from, to, onFrom, onTo, extra = null }) {
  const problem = rangeProblem(from, to);
  const clear = () => { onFrom(""); onTo(""); };
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 font-mono text-xs text-mute">
      <DateTimeField label="From (UTC)" value={from} onChange={onFrom} max={to || undefined} />
      <DateTimeField label="To (UTC)" value={to} onChange={onTo} min={from || undefined} />
      {extra}
      <button type="button" className="btn" onClick={clear} disabled={!from && !to}>Clear dates</button>
      {problem && <span role="alert" className="text-threat">{problem}</span>}
    </div>
  );
}
