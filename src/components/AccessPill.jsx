export default function AccessPill({ ok }) {
  return (
    <span className={`inline-block px-2 py-0.5 font-mono text-xs uppercase border ${ok ? "border-ok/60 text-ok bg-ok/10" : "border-mute/40 text-mute"}`}>
      {ok ? "granted" : "denied"}
    </span>
  );
}
