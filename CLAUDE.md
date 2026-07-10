# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

React 19 + Vite SPA that visualizes IT team data from Google Sheets. One shell, four pages switched by `activePage` in `src/App.jsx` and mapped to routes via `history.pushState`:

- `/` (jira) — Jira performance metrics. Lives in `src/App.jsx`, which is also the app shell (sidebar nav, dark mode, TH/EN/CN language switch, shared filters) and owns the data passed to the timeline page.
- `/timeline` — `src/TimelineDashboard.jsx`, task Gantt; receives filtered data + `epicMap` as props from `App.jsx`.
- `/support` — `src/SupportDashboard.jsx`, IT Support dashboard; fetches its **own** sheet independently.
- `/roadmap` — `src/RoadmapDashboard.jsx`, multi-project roadmap (Weekly / Overview / Rollout / Config tabs); fetches its own sheet independently and writes back through a Google Apps Script Web App. See below.

`vercel.json` rewrites all paths to `index.html` so client-side routes survive a refresh.

## Commands

```bash
npm install
npx vite            # dev server → http://localhost:5173
npx vite build      # production build → ./dist
npx vite build && npx vercel deploy --prod ./dist --yes   # deploy (live: dist-delta-azure.vercel.app)
```

No test runner: `npm test` is a stub that exits 1. Verify changes by running the dev server.

## Architecture notes

- **Data**: gviz CSV endpoint (`gviz/tq?tqx=out:csv&sheet=<name>`) parsed by the custom `src/utils/parseCSV.js`. An `inFlightSheets` Map dedupes concurrent fetches (StrictMode remount / auto-refresh overlap). Quarter tab names (`Q1-2025`…current quarter) are generated and probed dynamically — adding a quarter tab needs no code change.
- **Sheet IDs** are env-overridable with hardcoded fallbacks: `VITE_DB_LINK` (Jira/timeline), `VITE_SUPPORT_DB_LINK` (support). Local overrides in `.env.local` (gitignored).
- **Jira status semantics** at the top of `App.jsx`: `isExcludedFromPerformance` (Won't Fix / Pending) and `isDone` gate metrics; `STATUS_GROUPS` buckets raw statuses with an "In Progress" catch-all. Metrics: dev time (Created→Updated), delay days (past Target end / Due Date), on-time rate. Issue links use `JIRA_BASE = https://jira2.my-group.net/browse`.
- **Stack**: Recharts (charts), Lucide React (icons), Tailwind CSS v4 via `@tailwindcss/vite` (no config file). UI text is primarily Thai.

### Roadmap page (`/roadmap`)

Ported from the standalone `it_roadmap` project (sibling repo — see below) onto this app's shell and Tailwind styling. Data helpers live in `src/utils/roadmap.js`; the page itself is `src/RoadmapDashboard.jsx`.

- **Reads via gviz JSONP** (`fetchRoadmapData`), not `fetch`+`out:csv` — this specific sheet has a verified CORS failure on the CSV endpoint (documented in `it_roadmap/docs/HANDOFF.md`). Falls back to an in-code sample dataset when unreachable.
- **Writes go through the same Google Apps Script Web App** `it_roadmap` already uses (`apps-script/Code.gs`, unchanged) — `VITE_ROADMAP_SCRIPT_URL` env override, hardcoded fallback otherwise. Edit-mode token in `localStorage` under `roadmap_edit_token`.
- **Row types**: `project` / `timeline` / `state` / `channel` (see `it_roadmap/docs/HANDOFF.md` for the full schema). Timeline rows can optionally link to a Rollout State via the `state_ref` column (reusing the same column `channel` rows already used) — `SYNCED_TIMELINE_STATE_FIELDS` in `utils/roadmap.js` lists which fields (`title`/`status`/`health`/`health_note`/`start`/`end`/`date_label`) get pushed to the linked row on save, bidirectionally (Timeline form → State, or State edit from Rollout → Timeline).
- **Project filter is multi-select** (`ProjectMultiSelect`), stored as an array of project keys; empty array means "ทุกโปรเจค" (all). `inProj(row, selectedProjects)` is the shared predicate — don't reintroduce the old single-string `'__all__'` sentinel.
- Per-project color coding (`PROJECT_PALETTE` / `projectColorIndex`) is used consistently across Weekly/Overview/Config so the same project always gets the same color.
- Status values: `draft` / `plan` / `inprogress` / `release` on Timeline/State rows (`statusAccent` maps each to its color); `channel` rows additionally support `carry`.

> This project is one of two independent repos under a shared parent (`it_team/`); see the parent `CLAUDE.md` for the sibling `it_roadmap` project, which remains the source of truth for the Apps Script backend and the original schema/design decisions (`it_roadmap/docs/HANDOFF.md`).
