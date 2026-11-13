import { MATCH_NOTE } from "../lib/mitre.js";

export default function MatchNote({ className = "" }) {
  return <p className={`font-mono text-xs text-mute ${className}`}>{MATCH_NOTE}</p>;
}
