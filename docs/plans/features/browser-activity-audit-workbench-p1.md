# Browser Activity Audit Workbench P1

## 1. Scope

This packet turns the confirmed `browser-activity-audit-workbench` active design workspace into an executable P1 feature.

Stable truth sources:

- `docs/architecture/services/browser-activity-service.md`
- `docs/contracts/browser-activity-service/browser-activity-p1.md`
- `docs/contracts/api-gateway/browser-activity-bff.md`
- `docs/plans/designs/browser-workspace-extension-design.md`

Historical design input:

- `docs/plans/designs/browser-activity-audit-workbench-design.md`

P1 builds a tenant administrator workbench for browser visit history, active browsing duration, idle duration, domain aggregation, URL search, and employee timelines. It keeps the current CRM employee performance console as a separate CRM analytics page.

## 2. Decisions

- Browser visit facts are not CRM facts.
- Browser visit facts are not ordinary audit-log facts.
- A dedicated `browser-activity` capability owns visit sessions, retention policy, aggregation, and query semantics.
- Browser extension is the only P1 collection terminal.
- Tenant-web only reads and configures tenant-scoped facts through API Gateway / BFF.
- P1 records visit session summaries, not raw mouse, scroll, click, keyboard, DOM, screenshot, request, or page-content streams.
- P1 rankings express factual active browsing duration only; they do not produce performance, violation, or "slacking" conclusions.
- Tenant-web P1 UI uses the confirmed **employee timeline center** layout: employee switcher on the left, chronological visit history in the center, and domain / URL investigation panels on the right.
- Tenant-web P1 UI may borrow the existing `/analytics` page's chart-forward visual rhythm, but the information architecture remains audit-first rather than CRM or performance-first.

## 3. P1 Behavior

Tenant administrators can:

- Enable or disable browser activity audit for the tenant.
- Configure raw-detail and aggregate retention windows.
- View employee active browsing duration ranking.
- Switch to one employee and view visit totals plus chronological visits.
- View domain aggregation and drill into employee / URL usage.
- Search URL keyword or full URL and see who visited it, when, and for how long.

Employees are collected only when all conditions are true:

- The tenant audit switch is enabled.
- The employee belongs to the tenant.
- The account can log into the `browser-extension` terminal.
- The employee is signed into the Browser Workspace Extension.

## 4. P1 Metrics

- `onlineDurationSeconds`: plugin authenticated and heartbeating.
- `dwellDurationSeconds`: URL session duration from start to end or flush.
- `foregroundDurationSeconds`: tab visible and browser focused duration.
- `activeDurationSeconds`: foreground duration where the latest user activity is within 5 minutes.
- `idleDurationSeconds`: foreground or open duration after 5 minutes without user activity.

Rules:

- Active window is fixed at 5 minutes.
- Idle starts after 5 continuous minutes without activity.
- Same URL switched away and back within 30 seconds can be merged.
- Default ranking sorts by `activeDurationSeconds`.

## 5. Architecture

P1 should introduce a dedicated browser activity capability rather than attaching this to CRM.

Recommended implementation shape:

- `browser-activity-service`: owns tenant policy, visit session summaries, aggregate read models, and management-view audit events.
- `api-gateway`: exposes tenant-web and browser-extension BFF endpoints.
- `browser-extension`: collects local visit summaries and flushes batches only when enabled.
- `tenant-web`: renders the administrator workbench and settings.
- `permission-service`: owns navigation and action-code visibility.

No service may query another service database directly. Employee display and account context are resolved through explicit adapters/contracts, not copied as hidden truth.

## 6. Contracts

P1 should add contract docs before code:

- Extension write endpoint: batch upsert/append visit session summaries.
- Tenant-web policy endpoint: read/update tenant activity audit policy.
- Tenant-web query endpoints:
  - overview/ranking
  - employee timeline
  - domain aggregation
  - URL search

Every request carries explicit tenant, operator, trace, and audit context.

## 7. Permissions

Proposed action boundaries:

- `browser_activity.policy.read`
- `browser_activity.policy.manage`
- `browser_activity.overview.read`
- `browser_activity.employee_detail.read`
- `browser_activity.url_detail.read`

Navigation:

- Tenant-web entry: `browser-activity.audit-workbench`
- Suggested menu placement: administrator/governance or workplace analytics, not CRM.

The existing CRM page should move under CRM:

- Existing entry: `admin.employee-performance-console`
- Rename/menu placement target: CRM analytics under CRM 一级菜单.

## 8. Non-Goals

P1 does not build:

- Screenshots.
- Screen recording.
- Keyboard logging.
- Page body or form capture.
- Website classification.
- Risk scoring.
- AI judgment.
- Employee self-service visibility.
- Export workflow.
- Department or job-position collection policies.

## 9. Acceptance

- The CRM employee performance console remains available from CRM navigation only.
- Tenant admin can open Browser Activity Audit Workbench from its own non-CRM entry.
- Extension does not collect when tenant policy is disabled.
- Extension does not collect for accounts that lack browser-extension terminal access.
- Visit summaries use the frozen active/idle/foreground/dwell definitions.
- Tenant-web ranking defaults to active browsing duration.
- Employee detail, domain, URL, and timeline views render from backend facts.
- Sensitive administrator reads and policy changes are auditable.
- Unit, contract, build, and browser tests pass.
