export default function PageHeader({ path, title, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="font-mono text-xs text-mute break-all">
          operator@honeypot:~/{path}$ <span className="cursor" aria-hidden="true" />
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-wide text-ink glow-signal break-all">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
