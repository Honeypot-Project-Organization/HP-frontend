export default function Panel({ title, right, children, className = "", threat = false }) {
  return (
    <section className={`panel ${threat ? "panel-diag" : ""} ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 border-b border-line/60">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-signal">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
