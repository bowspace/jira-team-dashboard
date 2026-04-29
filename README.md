# IT Team Performance Dashboard

A React dashboard that visualizes IT team performance metrics from Jira task data via Google Sheets. Supports Thai, English, and Chinese languages.

**Live:** https://dist-delta-azure.vercel.app

## Features

- KPI cards: total tasks, on-time rate, avg dev time, avg delay
- Epic summary table with progress bars and on-time rates
- Charts: project performance, individual performance, on-time ratio, trend analysis
- Filters: weekly / monthly / quarterly date, project, assignee, reporter, fix version, epic
- Direct links to Jira issues and Google Sheets data source
- Multi-language support (TH / EN / CN) with localStorage persistence

## Data Source

Google Sheets spreadsheet with 2 sheets:
- **Q1-2026** — all IT team tasks (linked from Jira)
- **Epic** — epic/sub-project data, joined via `Custom field (Epic Link)`

Sheet ID: `1ZeJOK6BkHtVX97CDSFcWqODJzBqVmRXx6UO0Q9QbDLk`

## Prerequisites

- Node.js >= 18

## Install

```bash
npm install
```

## Run (Development)

```bash
npx vite
```

Opens at http://localhost:5173

## Build

```bash
npx vite build
```

Output goes to `./dist`.

## Deploy to Vercel

### First time

1. Login to Vercel:

```bash
npx vercel login
```

2. Build and deploy:

```bash
npx vite build
npx vercel deploy --prod ./dist --yes
```

### Subsequent deploys

```bash
npx vite build && npx vercel deploy --prod ./dist --yes
```

## Tech Stack

- React
- Vite
- Tailwind CSS v4
- Recharts
- Lucide React

## Shared KPI Config (Google Sheet Tab: `KPI Config`)

The app can read/write shared KPI settings from a dedicated tab named `KPI Config`.

### 1) KPI Config tab format

Create a sheet tab named `KPI Config` with these columns:

- `A1 = key`
- `B1 = value`

Rows:

- `targets.onTimeRate`
- `targets.efficiencyImprovement`
- `targets.bugFixRate`
- `weights.onTimeRate`
- `weights.efficiencyImprovement`
- `weights.kpi3`
- `weights.kpi4`
- `weights.bugFixRate`
- `thresholds.warningGap`
- `thresholds.bugOnTimeDays`

### 2) Read config

No extra setup required for reading (same Google Sheet CSV access as existing dashboard data).

### 3) Write config (required for shared save)

Set env var `VITE_KPI_CONFIG_API_URL` to a deployed Google Apps Script web app URL that accepts POST:

- body: `{ sheetId, sheetName, rows }`
- `sheetName` should be `KPI Config`
- `rows` is a 2D array (header + key/value rows)

Without `VITE_KPI_CONFIG_API_URL`, the dashboard can still edit local config but cannot save back to Google Sheet.
