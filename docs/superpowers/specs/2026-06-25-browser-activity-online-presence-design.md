# Browser Activity Online Presence Design

## Status

Approved design for Browser Activity Audit Workbench P1.1.

Stable truth sources:

- `docs/architecture/services/browser-activity-service.md`
- `docs/contracts/browser-activity-service/browser-activity-p1.md`
- `docs/contracts/api-gateway/browser-activity-bff.md`

This spec records the implementation-facing design. Service ownership, core object names, and long-term boundaries are defined only by the stable truth sources above.

## Goal

Tenant administrators need to know which employees currently have the browser-extension collection channel online.

P1.1 defines online as:

> The employee's browser-extension is authenticated, the tenant browser activity policy is enabled, and the latest valid heartbeat for that tenant account is within 90 seconds.

This status answers collection-channel liveness only. It does not imply employee productivity, compliance, screen presence, or current work quality.

## Non-Goals

P1.1 does not add:

- screenshots, screen recording, DOM capture, page body capture, keyboard logging, or mouse tracking
- website risk labels, productivity scoring, violation conclusions, or AI judgments
- employee self-service visibility
- WebSocket push
- cross-service database reads

## Approach

Use existing authenticated browser-extension heartbeat as the source of truth.

The browser extension already sends heartbeat only after extension login. `browser-activity-service` should maintain a current presence read model from accepted heartbeat facts. Tenant-web reads that model through API Gateway / BFF.

Status thresholds:

| Status | Definition |
| --- | --- |
| `ONLINE` | Latest valid heartbeat is within 90 seconds. |
| `STALE` | Latest valid heartbeat is older than 90 seconds and no older than 180 seconds. |
| `OFFLINE` | Latest valid heartbeat is older than 180 seconds or absent. |

Heartbeat interval remains 60 seconds. The 90-second online threshold tolerates one delayed browser timer or transient network delay without immediately flipping to offline.

## Backend Design

`browser-activity-service` should add or maintain a current presence model keyed by tenant account:

- `tenantId`
- `accountId`
- `displayNameSnapshot`
- `extensionSessionId`
- `sessionStartedAt`
- `lastHeartbeatAt`
- `lastObservedDomain`
- `status`

Heartbeat ingest updates this model only after the request passes the existing collection gate:

- authenticated `BROWSER_EXTENSION` session
- tenant account context
- terminal access still allowed
- tenant policy enabled
- BFF-built tenant/operator/trace context

Logout or session revocation events are not required for P1.1. If no immediate offline signal is available, status is derived from heartbeat timeout.

## BFF Design

Add tenant-web endpoint:

```http
GET /browser-activity/online-presence?status=ALL&includeOfflineWithinMinutes=1440
```

Permission:

- `browser_activity.overview.read`

BFF responsibilities:

- enforce authenticated `WEB` tenant context
- forward query to `browser-activity-service`
- map response to tenant-web view model
- never derive online status from WEB login state, CRM activity, or tenant-web page activity

Overview may also include:

- `metrics.onlineEmployeeCount`
- `metrics.staleEmployeeCount`
- `employees[].onlineStatus`
- `employees[].lastHeartbeatAt`

## Frontend Design

Enhance the existing `浏览器访问审计` workbench.

Visible UI changes:

- top metrics add online employee count and heartbeat-delayed count
- employee switcher adds a status dot per employee
- selected employee detail shows online status, last heartbeat time, session started time, and last observed domain
- page refreshes online presence by polling every 30-60 seconds

Visual language:

- green dot: `ONLINE`
- amber dot: `STALE`
- gray dot: `OFFLINE`

Copy must describe the status as plugin collection-channel state. It must not use performance, discipline, or violation language.

## Error Handling

- If BFF is unavailable in local development, existing preview mode may show sample presence data with a clear preview indicator.
- If policy is disabled, the UI should show zero online collection channels and the disabled policy state.
- If a heartbeat is delayed, `STALE` should be shown before `OFFLINE` to avoid noisy flicker.
- If a selected employee has no presence row, treat the employee as `OFFLINE`.

## Testing

Required implementation verification:

- service tests for status threshold calculation at 90 and 180 seconds
- service tests that WEB terminal heartbeat cannot create presence
- BFF tests for `/browser-activity/online-presence`
- tenant-web tests for online/stale/offline rendering
- extension tests proving heartbeat still starts only after extension login
- live smoke proving extension token creates online presence and WEB token cannot ingest heartbeat
- Playwright smoke for desktop and mobile workbench layout

## Acceptance

- Tenant administrator can see who is currently online in the Browser Activity Audit Workbench.
- Online status is based only on authenticated browser-extension heartbeat.
- Unauthenticated plugin state produces no heartbeat, no presence, and no buffered online state.
- WEB login state does not make an employee online.
- Status changes to `STALE` and `OFFLINE` by timeout without requiring a logout event.
- UI remains audit-first and does not imply productivity or violation conclusions.
