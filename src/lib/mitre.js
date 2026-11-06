// Small helpers for MITRE ATT&CK technique ids. The matches are produced by the API's
// pattern rules and are heuristic, not confirmed.

export const TECH_RE = /^T\d{4}(?:\.\d{3})?$/;
export const MATCH_NOTE = "Matched by pattern rules: a heuristic guess, not a confirmed technique.";

export function isTechId(v) {
  return typeof v === "string" && TECH_RE.test(v);
}

/** T1110.001 -> https://attack.mitre.org/techniques/T1110/001/ (built here, never taken from the API). */
export function attackUrl(id) {
  return isTechId(id) ? `https://attack.mitre.org/techniques/${id.replace(".", "/")}/` : null;
}

export function techList(v) {
  return Array.isArray(v) ? [...new Set(v.filter(isTechId))].sort() : [];
}

export function basisLabel(b) {
  return b === "event" ? "event" : "command";
}

export function tacticsLabel(t) {
  return Array.isArray(t) && t.length ? t.join(", ") : "—";
}
