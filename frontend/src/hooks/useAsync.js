import { useCallback, useEffect, useRef, useState } from "react";

// Runs fn on mount and whenever deps change. reload() refetches; intervalMs refreshes silently.
export function useAsync(fn, deps = [], intervalMs = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const seq = useRef(0);

  const run = useCallback((silent) => {
    const id = ++seq.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current().then(
      (data) => { if (id === seq.current) setState({ data, error: null, loading: false, updatedAt: new Date() }); },
      (error) => { if (id === seq.current) setState((s) => ({ ...s, error, loading: false })); },
    );
  }, []);

  useEffect(() => {
    run(false);
    return () => { seq.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!intervalMs) return undefined;
    const t = setInterval(() => run(true), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, run]);

  return { ...state, reload: useCallback(() => run(false), [run]) };
}
