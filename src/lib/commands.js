import { hashStr, toDate } from "./format.js";

// Group identical command strings across all sessions.
export function groupCommands(cmds) {
  const m = new Map();
  for (const c of cmds) {
    const text = c.input.trim();
    if (!text) continue;
    let g = m.get(text);
    if (!g) {
      g = { key: hashStr(text), text, count: 0, ips: new Set(), sessions: new Set(), first: null, last: null, items: [] };
      m.set(text, g);
    }
    g.count += 1;
    g.ips.add(c.src_ip);
    g.sessions.add(c.session_id);
    g.items.push(c);
    const t = toDate(c.timestamp);
    if (t) {
      if (!g.first || t < g.first) g.first = t;
      if (!g.last || t > g.last) g.last = t;
    }
  }
  return [...m.values()]
    .map((g) => ({ ...g, ipCount: g.ips.size, sessionCount: g.sessions.size }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
}

export function summarizeGroups(groups) {
  return {
    unique: groups.length,
    total: groups.reduce((n, g) => n + g.count, 0),
    top: groups[0] || null,
  };
}
