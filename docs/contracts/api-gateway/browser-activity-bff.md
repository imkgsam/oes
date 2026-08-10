# Browser Activity BFF Contract

> `browser-activity-service` 的服务职责、核心对象与 owner 边界以 [browser-activity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/browser-activity-service.md) 为唯一稳定真相源。`auth-service`、`permission-service`、Terminal Access Policy、access summary 与 navigation visibility 以对应服务真相源为准。本文只描述 API Gateway / BFF 的 HTTP 黑盒契约。

## 1. Purpose

Browser Activity BFF exposes two endpoint groups:

- `/extension/browser-activity/*` for authenticated browser-extension collection.
- `/browser-activity/*` for tenant-web administrator policy and query workflows.
- `/browser-activity/employees/:accountId/audit-grant` for tenant account collection authorization.

BFF owns HTTP shape, access-token/session verification, permission and terminal guard composition, exact Browser Activity ExecutionToken exchange and view model mapping. BFF does not own browser activity facts, employee master data or downstream identity authority. The target audience is exactly `urn:oes:service:browser-activity-service`; Gateway sends mTLS plus target Token and never reconstructs tenant/operator/terminal/session authority in the gRPC body.

## 2. Collection Gate

Extension collection endpoints require all conditions below:

1. request has a valid authenticated extension access token.
2. session terminal is `BROWSER_EXTENSION`.
3. session scope is tenant account.
4. terminal access is still allowed for the account.
5. downstream `browser-activity-service` employee audit grant is enabled for the session account.

If the plugin is not logged in, the front end has no access token and must not call these endpoints. If it calls without a valid token, BFF returns `401` and no visit fact is recorded.

## 3. Endpoint Summary

| Endpoint | Terminal | Purpose |
| --- | --- | --- |
| `GET /extension/browser-activity/audit-control` | `BROWSER_EXTENSION` | Read whether the authenticated plugin account may start browser audit collection. |
| `POST /extension/browser-activity/visit-sessions` | `BROWSER_EXTENSION` | Ingest visit session summaries. |
| `POST /extension/browser-activity/heartbeat` | `BROWSER_EXTENSION` | Record authenticated plugin heartbeat. |
| `POST /extension/browser-activity/disconnect` | `BROWSER_EXTENSION` | Mark the authenticated plugin session offline. |
| `GET /browser-activity/policy` | `WEB` | Read tenant policy. |
| `PUT /browser-activity/policy` | `WEB` | Update tenant policy. |
| `GET /browser-activity/employees/audit-grants` | `WEB` | Read employee collection grants. |
| `PUT /browser-activity/employees/:accountId/audit-grant` | `WEB` | Enable or disable one employee browser audit collection grant. |
| `GET /browser-activity/overview` | `WEB` | Read tenant overview and employee ranking. |
| `GET /browser-activity/online-presence` | `WEB` | Read browser-extension online presence by employee. |
| `GET /browser-activity/employees/:accountId/timeline` | `WEB` | Read one employee timeline. |
| `GET /browser-activity/domains` | `WEB` | Read domain aggregation. |
| `GET /browser-activity/url-search` | `WEB` | Search URL/title facts. |

## 4. Extension Endpoints

### 4.1 Audit Control

```http
GET /extension/browser-activity/audit-control
Authorization: Bearer <extension-access-token>
```

Response when collection is enabled:

```json
{
  "enabled": true,
  "nextPollAfterSeconds": 60,
  "reasonCode": "ENABLED"
}
```

Response when collection is disabled for the authenticated account:

```json
{
  "enabled": false,
  "nextPollAfterSeconds": 60,
  "reasonCode": "EMPLOYEE_AUDIT_DISABLED"
}
```

Rules:

- BFF ignores any client-supplied tenant, account, operator, role, permission, or terminal fields.
- BFF validates the authenticated `BROWSER_EXTENSION` session and requests an empty-scope SELF_SERVICE target Token; no identity context is copied into the gRPC body.
- The endpoint does not accept URL, Domain, page title, duration, active tab, or user activity fields.
- The endpoint does not write online presence and must not be used by tenant-web to infer online status.
- Browser extensions use this as the control plane while the data channel is disabled, so administrator re-enablement can resume collection without requiring plugin logout/login.

### 4.2 Visit Sessions

```http
POST /extension/browser-activity/visit-sessions
Authorization: Bearer <extension-access-token>
```

Request:

```json
{
  "sessions": [
    {
      "clientVisitId": "visit_7d9b8b6f",
      "url": "https://supplier-portal.example/orders",
      "domain": "supplier-portal.example",
      "pageTitle": "Supplier Orders",
      "startedAt": "2026-06-25T09:12:00.000Z",
      "endedAt": "2026-06-25T09:28:00.000Z",
      "lastFlushedAt": "2026-06-25T09:28:00.000Z",
      "dwellDurationSeconds": 980,
      "foregroundDurationSeconds": 920,
      "activeDurationSeconds": 840,
      "idleDurationSeconds": 80,
      "mergeKey": "account_chen:supplier-portal.example:https://supplier-portal.example/orders"
    }
  ]
}
```

Response:

```json
{
  "acceptedCount": 1,
  "rejectedCount": 0,
  "policyEnabled": true,
  "serverReceivedAt": "2026-06-25T09:28:02.000Z"
}
```

Disabled response:

```json
{
  "acceptedCount": 0,
  "rejectedCount": 1,
  "policyEnabled": false,
  "reasonCode": "EMPLOYEE_AUDIT_DISABLED"
}
```

BFF rules:

- ignores any client-supplied tenant, operator, role, permission, or terminal fields.
- requests a SELF_SERVICE Token with empty Code set from the verified `BROWSER_EXTENSION` session and forwards no tenant/operator/trace/audit/session body duplicate.
- removes client `extensionSessionId`; Auth-signed `session_id` is the downstream source of the extension session fact.
- rejects prohibited raw data fields before forwarding.
- forwards only bounded visit summaries to `browser-activity-service`.
- when the downstream response has `policyEnabled = false`, the plugin must stop data collection and discard pending local summaries.

Extension reliability rules:

- The plugin must persist finalized visit summaries to a local outbox before calling this endpoint.
- The plugin deletes an outbox entry only after this endpoint accepts the corresponding summary batch.
- Transient network or backend failures must leave the outbox entry available for retry after extension restore or the next successful collection activation.
- Browser tab close, browser window focus loss, and extension service-worker suspend must finalize the current active visit into the outbox before clearing in-memory state.
- When audit control or heartbeat reports collection disabled, the plugin must clear active state and same-account outbox entries so disabled audit data is not backfilled later.

### 4.3 Heartbeat

```http
POST /extension/browser-activity/heartbeat
Authorization: Bearer <extension-access-token>
```

Request:

```json
{
  "observedAt": "2026-06-25T09:30:00.000Z"
}
```

Response:

```json
{
  "accepted": true,
  "policyEnabled": true,
  "nextHeartbeatAfterSeconds": 60
}
```

Rules:

- Heartbeat is part of the audit data channel and is only sent while collection is enabled.
- If heartbeat returns `accepted = false` or `policyEnabled = false`, the plugin must stop data collection and switch to audit-control polling.
- Tenant-web online status is derived from this heartbeat only, never from audit-control polling.

### 4.4 Disconnect

```http
POST /extension/browser-activity/disconnect
Authorization: Bearer <extension-access-token>
```

Request:

```json
{
  "observedAt": "2026-06-25T09:31:00.000Z"
}
```

Gateway validates the current `BROWSER_EXTENSION` session and requests a SELF_SERVICE target Token. The downstream session id comes from that Token; client `extensionSessionId` is ignored/rejected and is never forwarded as authority.

## 5. Tenant-Web Endpoints

All tenant-web endpoints require authenticated `WEB` session and tenant context.

### 5.1 Policy

```http
GET /browser-activity/policy
PUT /browser-activity/policy
```

Permissions:

- read: `browser_activity.policy.read`
- update: `browser_activity.policy.manage`

Update request:

```json
{
  "enabled": true,
  "rawRetentionDays": 90,
  "aggregateRetentionDays": 365
}
```

### 5.2 Overview

```http
GET /browser-activity/overview?period=LAST_7_DAYS
```

Permission:

- `browser_activity.overview.read`

Response shape matches `browser-activity-service` overview view model.

P1.1 response additions:

- `metrics.onlineEmployeeCount`
- `metrics.staleEmployeeCount`
- `employees[].onlineStatus`
- `employees[].lastHeartbeatAt`
- `employees[].auditEnabled`
- `employees[].browserExtensionLoginAllowed`

Rules:

- BFF must not derive online status from WEB login state, CRM actions, or tenant-web activity.
- online status is mapped from `browser-activity-service` heartbeat-derived presence only.
- `auditEnabled` comes from `browser-activity-service` employee audit grants.
- `browserExtensionLoginAllowed` comes from permission-service account terminal access.

### 5.2A Employee Audit Grant

```http
GET /browser-activity/employees/audit-grants?accountIds=account_chen&accountIds=account_lin
```

Permission:

- `browser_activity.overview.read`

```http
PUT /browser-activity/employees/:accountId/audit-grant
```

Permission:

- `browser_activity.policy.manage`

Request:

```json
{
  "enabled": true
}
```

Rules:

- BFF validates the authenticated `WEB` session and requests the exact BUSINESS target Token; downstream identity and trace travel only through the trusted gRPC runtime.
- When `enabled = true`, BFF must call permission-service account terminal access and require `BROWSER_EXTENSION` in the effective terminal list.
- If the target account cannot login through Browser Extension, BFF rejects the request and does not mutate browser-activity-service grant state.
- BFF must not infer plugin-login capability from previous heartbeats or visit facts.

### 5.3 Online Presence

```http
GET /browser-activity/online-presence?status=ALL&includeOfflineWithinMinutes=1440
```

Permission:

- `browser_activity.overview.read`

Rules:

- BFF requests the exact BUSINESS Code above using a verified HUMAN `WEB` session.

Response:

```json
{
  "serverTime": "2026-06-25T09:31:00.000Z",
  "thresholds": {
    "onlineWithinSeconds": 90,
    "staleWithinSeconds": 180,
    "heartbeatIntervalSeconds": 60
  },
  "summary": {
    "onlineCount": 1,
    "staleCount": 1,
    "offlineCount": 4
  },
  "employees": [
    {
      "accountId": "account_chen",
      "displayName": "陈双鹏",
      "onlineStatus": "ONLINE",
      "extensionSessionId": "ext_session_01HX",
      "sessionStartedAt": "2026-06-25T08:58:00.000Z",
      "lastHeartbeatAt": "2026-06-25T09:30:00.000Z",
      "lastObservedDomain": "supplier-portal.example"
    }
  ]
}
```

Rules:

- `ONLINE` means the latest valid authenticated browser-extension heartbeat is within 90 seconds.
- `STALE` means heartbeat is older than 90 seconds and no older than 180 seconds.
- `OFFLINE` means heartbeat is older than 180 seconds or absent.
- BFF forwards only tenant-scoped status facts and must not add productivity, violation, or performance labels.

### 5.4 Employee Timeline

```http
GET /browser-activity/employees/:accountId/timeline?period=LAST_7_DAYS
```

Permission:

- `browser_activity.employee_detail.read`

Rules:

- BFF requests the exact BUSINESS Code; the target writes method-owned sensitive-read audit from ET and trusted trace context before returning.
- `accountId` is treated as tenant-scoped employee account id, not global user id.

### 5.5 Domain Aggregation

```http
GET /browser-activity/domains?period=LAST_7_DAYS&employeeAccountId=account_chen
```

Permission:

- `browser_activity.url_detail.read`

Rules:

- BFF requests the exact BUSINESS Code above and the target writes `BROWSER_ACTIVITY_DOMAIN_AGGREGATION_READ` sensitive-read audit before returning domain facts.
- optional `employeeAccountId` remains a tenant-scoped query target and never overrides the ET principal or tenant.

### 5.6 URL Search

```http
GET /browser-activity/url-search?keyword=orders&period=LAST_7_DAYS
```

Permission:

- `browser_activity.url_detail.read`

Rules:

- empty keyword returns `400`.
- BFF requests the exact BUSINESS Code; the target derives actor/tenant/session/trace from ET and writes method-owned sensitive-read audit before returning.
- response must not include screenshots, page body, DOM, keyboard input or request logs.

## 6. Error Model

| Condition | HTTP Status | Stable code |
| --- | --- | --- |
| Missing or invalid extension session | `401` | `BROWSER_ACTIVITY_EXTENSION_AUTH_REQUIRED` |
| Wrong terminal for extension ingest | `403` | `BROWSER_ACTIVITY_EXTENSION_TERMINAL_REQUIRED` |
| Tenant policy disabled | `409` | `BROWSER_ACTIVITY_POLICY_DISABLED` |
| Missing permission | `403` | `BROWSER_ACTIVITY_PERMISSION_DENIED` |
| Invalid visit summary payload | `400` | `BROWSER_ACTIVITY_INVALID_VISIT_SUMMARY` |
| Prohibited raw data field detected | `400` | `BROWSER_ACTIVITY_PROHIBITED_RAW_DATA` |
| Empty URL search keyword | `400` | `BROWSER_ACTIVITY_EMPTY_URL_SEARCH_KEYWORD` |

## 7. Frontend Rules

Browser extension:

- must not start collection until `AuthSessionController.restore()` or login returns authenticated session.
- must stop collection on logout, session refresh failure, account switch start, or storage clear.
- must not cache unauthenticated browsing history for later upload.

Tenant-web:

- must render facts as audit records, not performance conclusions.
- must not use CRM language for this page.
- may show a local preview notice only when local development BFF endpoints are unavailable; preview data is not accepted as production audit completion.
