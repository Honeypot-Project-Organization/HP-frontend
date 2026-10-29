# Honeypot dashboard (frontend)

Part of a four-repo project: **backend** (API), **frontend** (this), **assets** (honeypot deployment, setup
guide, security notes) and **contracts** (agreed API and data shapes; see `contracts/docs/api.md`).

React 18 + Vite + Tailwind + react-router + recharts. All data comes from the real FastAPI backend; there is no mock mode.

## Run

```bash
cd frontend
cp .env.example .env        # set VITE_API_BASE_URL (never commit .env)
npm install                 # versions are pinned (Vite 7, Tailwind 3, React Router 7; needs Node 20.19+); do not `npm install tailwindcss` / `vite` separately
npm run dev                 # http://localhost:5173
npm run build               # outputs dist/
npm run selftest            # pure-logic checks, no network
```

Backend must allow the dashboard origin: set `CORS_ALLOWED_ORIGIN` (exact origin, no trailing slash).
Create the admin with `scripts/create_admin.py` in the backend repo.

If you ever see a Tailwind "PostCSS plugin has moved" error, the wrong major versions got installed. Fix:
`rm -r node_modules package-lock.json && npm install`.

## Deploy (Firebase Hosting)

Set `VITE_API_BASE_URL` to your API URL, `npm run build`, then `firebase deploy --only hosting`.
`firebase.json` ships a CSP whose `connect-src` names the API origin; update it if your URL changes.

## Pages

| Route | Backend routes used |
|---|---|
| `/login` | `POST /login` |
| `/` Dashboard | `/api/stats`, `/api/stats/daily`, `/api/sessions`, `/api/ips`, `/api/stats/top-credentials`, `/api/geo/status` (attack-origin map under Connection history) |
| `/attackers` | `/api/ips` |
| `/attackers/:ip` | `/api/ips/{ip}`, `/api/ips/{ip}/sessions`, `/api/ips/{ip}/commands`, `/api/geo/status` + origin map/table + VirusTotal link (no API/key) |
| `/sessions`, `/sessions/:id` | `/api/sessions`, `/api/sessions/{id}`, `/api/sessions/{id}/commands` |
| `/commands`, `/commands/:key` | `/api/commands` (grouped client-side) |

**Backend routes added for this frontend** (in the backend repo, `app/routers/dashboard.py`):
`GET /api/ips/{ip}`, `/api/ips/{ip}/sessions`, `/api/ips/{ip}/commands`, `/api/commands`, `/api/sessions/{id}`.
Redeploy the backend before using the detail pages, or they will show a 404 error.

## Attack-origin map

Drawn as plain SVG from the bundled `world-atlas` country outlines (`d3-geo` projection), so it makes **no
external requests** (no tiles, no CDN). Locations come from the API's `geo` field on each attacker; see
`scripts/upload_geoip.py` in the backend repo for the one-time database upload. Until a database is uploaded the map
shows an explanatory empty state. Dots are grouped into ~0.5-degree cells (about 55 km), sized by sessions; a dashed ring
means the position is only region/country level. The footer carries the attribution link DB-IP's licence requires - keep it.

## Security notes

- The JWT is kept in `sessionStorage` and cleared on logout or any 401.
- Attacker-supplied text is rendered as text only (no `dangerouslySetInnerHTML`, no clickable attacker URLs).
- Only external link: `https://www.virustotal.com/gui/ip-address/<ip>` (new tab, `noopener noreferrer`).
- Fonts are system fallbacks (Chakra Petch / JetBrains Mono used if installed); nothing is loaded from third parties.

## Limits

- Attackers, Sessions and Commands show 100 rows per page. Searching, the denied/granted filter, the date range
  and sorting are done by the API over ALL rows (this needs backend/contracts 1.1.0 or newer). The date pickers
  work in UTC down to the second.
- The dashboard's top 10 countries / attackers / credentials and the map come from the API, over all IPs.
- Out of scope: MITRE lookup.
