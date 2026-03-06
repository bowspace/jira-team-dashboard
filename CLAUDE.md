# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-file React dashboard (`index.ts`) that visualizes IT team performance metrics from Jira task data. It fetches CSV data from a Google Sheet, parses it, and renders interactive charts and KPI cards.

## Architecture

- **Data source**: Google Sheets CSV export via `gviz/tq` endpoint (sheet ID: `1ZeJOK6BkHtVX97CDSFcWqODJzBqVmRXx6UO0Q9QbDLk`). Falls back to hardcoded `realFallbackData` on CORS/fetch errors.
- **CSV parsing**: Custom `parseCSV` parser handles quoted fields and multi-format dates (YYYY-MM-DD, DD/MM/YY).
- **UI stack**: React, Recharts (charts), Lucide React (icons), Tailwind CSS (styling).
- **Key data fields mapped from Jira**: Issue key, Project name, Assignee, Reporter, Status, Fix Version/s, Target end, Due Date, Created, Updated, Summary.
- **Metrics calculated**: dev time (days between Created and Updated), delay days (days past Target end/Due Date), on-time rate.
- **Filters**: Timeframe (month/quarter), Assignee, Reporter, Project, Fix Version.

## Notes

- The file extension is `.ts` but the code is JSX (no TypeScript types). This is a single React component exported as `default function App()`.
- UI text is primarily in Thai.
- The task details table is capped at 50 displayed rows.
