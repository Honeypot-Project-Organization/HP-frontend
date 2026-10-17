export function Loading({ label = "Loading" }) {
  return (
    <div role="status" className="py-8 text-center font-mono text-sm text-signal">
      {label}<span className="cursor ml-1" aria-hidden="true" />
    </div>
  );
}
export function ErrorBox({ error, onRetry }) {
  return (
    <div role="alert" className="border border-threat/60 bg-threat/5 p-4 text-sm">
      <div className="font-mono text-threat uppercase tracking-wider text-xs mb-1">Error</div>
      <div className="text-ink">{error?.message || "Something went wrong"}</div>
      {onRetry && <button className="btn mt-3" onClick={onRetry}>Retry</button>}
    </div>
  );
}
export function Empty({ children = "No data yet" }) {
  return <div className="py-8 text-center font-mono text-sm text-mute">{children}</div>;
}
