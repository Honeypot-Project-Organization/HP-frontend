import { fmtTime } from "../lib/format.js";

export default function RefreshButton({ onClick, loading, updatedAt }) {
  return (
    <div className="flex items-center gap-3">
      {updatedAt && <span className="hidden sm:inline font-mono text-xs text-mute">updated {fmtTime(updatedAt)}</span>}
      <button type="button" className="btn" onClick={onClick} disabled={loading}>
        {loading ? "Refreshing" : "Refresh"}
      </button>
    </div>
  );
}
