import { useEffect, useMemo, useState } from "react";
import { getMitreCatalog } from "../lib/api.js";

/** The technique catalog (id -> name/tactics/basis), loaded once. Never throws: names just stay blank. */
export function useCatalog() {
  const [list, setList] = useState(null);
  useEffect(() => {
    let live = true;
    getMitreCatalog().then((r) => live && setList(r)).catch(() => live && setList([]));
    return () => { live = false; };
  }, []);
  const byId = useMemo(() => new Map((list || []).map((c) => [c.id, c])), [list]);
  return { list: list || [], byId, ready: list !== null };
}
