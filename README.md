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
