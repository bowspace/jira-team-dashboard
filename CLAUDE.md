# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Multi-page React dashboard that visualizes IT team performance metrics. It fetches CSV data from Google Sheets, parses it, and renders interactive charts and KPI cards. Two main dashboards:

1. **Jira Dashboard** (`/`) — IT team performance from Jira task data (`index.ts`)
2. **Support Dashboard** (`/support`) — Platform support ticket analytics (`src/SupportDashboard.jsx`)

## Architecture

- **UI stack**: React, Recharts (charts), Lucide React (icons), Tailwind CSS (styling).
- **CSV parsing**: Custom `parseCSV` parser handles quoted fields and multi-format dates.
- **Routing**: Client-side routing via `window.history.pushState` in `src/App.jsx`.
- **i18n**: Three languages — Thai (th), English (en), Chinese (zh). Stored in localStorage.
- **Dark mode**: Toggle stored in localStorage.

### Jira Dashboard (`/`)

- **Data source**: Google Sheets CSV export via `gviz/tq` endpoint (sheet ID: `1ZeJOK6BkHtVX97CDSFcWqODJzBqVmRXx6UO0Q9QbDLk`). Falls back to hardcoded `realFallbackData` on CORS/fetch errors.
- **Key data fields mapped from Jira**: Issue key, Project name, Assignee, Reporter, Status, Fix Version/s, Target end, Due Date, Created, Updated, Summary.
- **Metrics calculated**: dev time (days between Created and Updated), delay days (days past Target end/Due Date), on-time rate.
- **Filters**: Timeframe (month/quarter), Assignee, Reporter, Project, Fix Version.

### Support Dashboard (`/support`)

- **Data source**: Google Sheets CSV export (sheet ID via `VITE_SUPPORT_DB_LINK` env var, default: `18a2xbNrbGxEaxK8KGCZhbWueqXpMrgxJgspIW42aIn0`). Sheets named by quarter (e.g., `Q4-2025`, `Q1-2026`). Auto-refresh every 60s.
- **Key data fields**: Request No., Type (ประเภทปัญหา), Requestor Priority (ความเร่งด่วน), Evaluated Priority/IT Priority (ความสำคัญที่ประเมิน), Platform (แพลตฟอร์ม), Title (หัวข้อปัญหา), Assignee, Estimated Fix Time, Cause of Issue (สาเหตุของปัญหา), Created (创建时间), Completed (完成时间), Status (审批状态 + 审批结果), Duration (耗时).
- **Status logic**: Combines `审批状态` + `审批结果` — when `已结束`: Approved→Completed, Rejected→Rejected. Other statuses: Running, Terminated.
- **SLA thresholds (priority-based)**: P0 ≤ 4 hours, P1 ≤ 8 hours, P2 ≤ 10 days (240 hours).
- **Filters**: Quarter, Platform, Type, Requestor Priority, IT Priority, Assignee, Status, Cause.
- **KPIs**: Total Cases, Resolved Rate (Completed/Total), Avg Resolution Time, SLA Compliance (priority-based).
- **Charts**: Cases by Type, Cases by Platform (pie), Resolution Time Distribution, Workload by Assignee, Priority Comparison (Requestor vs IT), Root Cause Breakdown, Root Cause × SLA, SLA Performance by Assignee. All charts show count + percentage.

## Notes

- The Jira dashboard file extension is `.ts` but the code is JSX (no TypeScript types). This is a single React component exported as `default function App()`.
- UI text supports Thai, English, and Chinese.
- The task details tables are capped at 50 displayed rows.
- Column matching supports both Thai and Chinese header names for backwards compatibility with the data source.
