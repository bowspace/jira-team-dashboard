# team-performance — Roadmap

The Roadmap page (`/roadmap`) tracks multi-project deploy timelines and rollout progress, read from and written to a Google Sheet via gviz JSONP + a Google Apps Script Web App.

## Language

**Status**:
The stage of a Timeline or State row, stored directly on the row: `draft` / `plan` / `inprogress` / `release` (Channel rows additionally support `carry`).
_Avoid_: Column, stage, bucket (when meaning the stored field)

**Column** (Weekly view):
One of the three Weekly kanban buckets — Plan / In Progress / Release. **Derived, not stored** — a card's column is computed on every render from its Status plus whether its dates overlap the current week (`prod_date` for Release; `start`/`end` for Plan/In Progress). There is no `column` field on a row.
_Avoid_: Status (when meaning the visual bucket rather than the stored field)

## Example dialogue

> **Dev**: I dragged a card into the Release column but it's back in Plan after I refresh.
> **Expert**: Dragging into Release sets Status to `release`, but Release membership also requires `prod_date` to fall within the current week. If the card had no `prod_date` set, the drag should have shown the date-confirmation modal before committing — did it?
> **Dev**: No, it just moved instantly.
> **Expert**: Then the "does the card already satisfy the target Column" check is missing for that transition — it should have detected `prod_date` wasn't in-week and prompted before saving.
