# Browser Activity Service P1 Contract

> `browser-activity-service` 的服务职责、核心对象与 owner 边界以 [browser-activity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/browser-activity-service.md) 为唯一稳定真相源。本文只描述 P1 service-level 黑盒契约。

## 1. Purpose

P1 contract 支持两个调用方向：

- `api-gateway` 从 authenticated browser-extension session 写入访问会话汇总与 heartbeat。
- `api-gateway` 从 authenticated tenant-web admin session 管理员工采集授权，并读取策略、概览、员工时间线、domain 聚合与 URL 搜索结果。

服务端必须拒绝未登录插件、非 `BROWSER_EXTENSION` terminal、员工采集授权 disabled 或缺少 tenant context 的采集写入。

## 2. Common Context

所有 13 个 RPC 使用唯一 audience `urn:oes:service:browser-activity-service`，同时验证当前 Gateway mTLS workload、certificate-bound ExecutionToken 和方法声明。请求 body 不携带可信身份。

Rules:

- tenant、account、org、session、terminal 与 trace 从 guard-verified execution context 取得；`session_terminal` 必须由 Auth 从与 `session_id` 相同的 active session truth 签入。
- management/query RPCs require `principal_type=HUMAN` and `session_terminal=WEB`；extension RPCs require `principal_type=HUMAN` and `session_terminal=BROWSER_EXTENSION`。
- all 13 RPCs reject `MACHINE` and `DELEGATED` in this contract version.
- request body 中的 tenant/operator/trace/audit/session 副本不构成 authority，也不存在 legacy header、signed operator 或 body fallback。
- management 与 sensitive-read audit action 由目标方法固定生成；actor、tenant、session、target 与 trace 来自可信上下文。

### 2.1 RPC authorization matrix

| RPC | Mode | Required Permission Code |
| --- | --- | --- |
| `GetPolicy` | `BUSINESS` / `HUMAN WEB` | `browser_activity.policy.read` |
| `UpdatePolicy` | `BUSINESS` / `HUMAN WEB` | `browser_activity.policy.manage` |
| `GetEmployeeAuditGrants` | `BUSINESS` / `HUMAN WEB` | `browser_activity.overview.read` |
| `UpdateEmployeeAuditGrant` | `BUSINESS` / `HUMAN WEB` | `browser_activity.policy.manage` |
| `GetOverview` | `BUSINESS` / `HUMAN WEB` | `browser_activity.overview.read` |
| `GetEmployeeTimeline` | `BUSINESS` / `HUMAN WEB` | `browser_activity.employee_detail.read` |
| `GetDomainAggregation` | `BUSINESS` / `HUMAN WEB` | `browser_activity.url_detail.read` |
| `SearchUrls` | `BUSINESS` / `HUMAN WEB` | `browser_activity.url_detail.read` |
| `GetOnlinePresence` | `BUSINESS` / `HUMAN WEB` | `browser_activity.overview.read` |
| `GetAuditControl` | `SELF_SERVICE` / `HUMAN BROWSER_EXTENSION` | empty set |
| `AppendVisitSessions` | `SELF_SERVICE` / `HUMAN BROWSER_EXTENSION` | empty set |
| `Heartbeat` | `SELF_SERVICE` / `HUMAN BROWSER_EXTENSION` | empty set |
| `Disconnect` | `SELF_SERVICE` / `HUMAN BROWSER_EXTENSION` | empty set |

### 2.2 Proto removal and reservation

Token-only cutover removes the following legacy request fields and reserves both their existing names and field numbers. All unlisted business payload/target fields retain their current names and numbers.

| Message | Reserved legacy fields |
| --- | --- |
| `GetPolicyRequest` | `tenant_id=1`, `operator=2`, `trace=3` |
| `UpdatePolicyRequest` | `tenant_id=1`, `operator=3`, `trace=4`, `audit=5` |
| `GetEmployeeAuditGrantsRequest` | `tenant_id=1`, `operator=3`, `trace=4` |
| `UpdateEmployeeAuditGrantRequest` | `tenant_id=1`, `operator=4`, `trace=5`, `audit=6` |
| `GetAuditControlRequest` | `tenant_id=1`, `operator=2`, `trace=3` |
| `AppendVisitSessionsRequest` | `tenant_id=1`, `operator=2`, `trace=3`, `audit=4` |
| `HeartbeatRequest` | `tenant_id=1`, `extension_session_id=2`, `operator=4`, `trace=5` |
| `DisconnectRequest` | `tenant_id=1`, `extension_session_id=2`, `operator=4`, `trace=5` |
| `GetOverviewRequest` | `tenant_id=1`, `operator=3`, `trace=4` |
| `GetEmployeeTimelineRequest` | `tenant_id=1`, `operator=4`, `trace=5` |
| `GetDomainAggregationRequest` | `tenant_id=1`, `operator=4`, `trace=5` |
| `SearchUrlsRequest` | `tenant_id=1`, `operator=4`, `trace=5`, `audit=6` |
| `GetOnlinePresenceRequest` | `tenant_id=1`, `operator=4`, `trace=5` |
| `BrowserActivityVisitSessionSummary` | `extension_session_id=2` |

`HeartbeatRequest.observed_at=3`、`DisconnectRequest.observed_at=3`、`AppendVisitSessionsRequest.sessions=5` and every listed query/command target remain business fields. Stored/output `OnlinePresenceEmployee.extension_session_id=4` remains a service-derived read fact populated from verified `session_id`.

## 3. Core Types

### 3.1 BrowserActivityPolicy

```json
{
  "enabled": true,
  "rawRetentionDays": 90,
  "aggregateRetentionDays": 365,
  "updatedAt": "2026-06-25T10:00:00.000Z",
  "updatedByAccountId": "account_admin"
}
```

Defaults:

- `enabled = false`
- `rawRetentionDays = 90`
- `aggregateRetentionDays = 365`

### 3.2 VisitSessionSummary

```json
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
```

Rules:

- `clientVisitId`, `url`, `domain`, `startedAt`, `endedAt`, and duration fields are required; `extensionSessionId` is stamped from verified `session_id` and is not accepted from the payload.
- `pageTitle` may be empty but must be bounded by service validation.
- durations must be non-negative integers.
- service rejects raw input streams such as key values, mouse coordinates, DOM snapshots, screenshots, full page body, request logs, or form values.
- service may idempotently upsert by `tenantId + operator.accountId + clientVisitId`.

### 3.3 ActivityPeriod

P1 supports:

- `LAST_1_HOUR`
- `LAST_1_DAY`
- `LAST_1_WEEK`
- `LAST_1_MONTH`
- `LAST_7_DAYS`
- `LAST_30_DAYS`

### 3.4 EmployeeAuditGrant

```json
{
  "accountId": "account_chen",
  "enabled": true,
  "updatedAt": "2026-06-25T10:00:00.000Z",
  "updatedBy": "account_admin"
}
```

Rules:

- missing grant means `enabled = false`.
- grant is tenant account scoped.
- browser-activity-service owns this audit collection grant fact.
- permission-service remains the source of truth for whether the account can login through `BROWSER_EXTENSION`.

## 4. Policy

### 4.1 Get Policy

Required permission:

- `browser_activity.policy.read`

Response:

```json
{
  "policy": {
    "enabled": true,
    "rawRetentionDays": 90,
    "aggregateRetentionDays": 365,
    "updatedAt": "2026-06-25T10:00:00.000Z",
    "updatedByAccountId": "account_admin"
  }
}
```

### 4.2 Update Policy

Required permission:

- `browser_activity.policy.manage`

Request:

```json
{
  "policy": {
    "enabled": true,
    "rawRetentionDays": 90,
    "aggregateRetentionDays": 365
  }
}
```

Rules:

- `rawRetentionDays` must be between 30 and 365.
- `aggregateRetentionDays` must be between 90 and 1095.
- update atomically records append-only `BROWSER_ACTIVITY_POLICY_UPDATE` management audit from verified execution facts.

## 4A. Employee Audit Grant

### 4A.1 Get Employee Audit Grants

Required permission:

- `browser_activity.overview.read`

Request:

```json
{
  "accountIds": ["account_chen", "account_lin"]
}
```

Response:

```json
{
  "grants": [
    {
      "accountId": "account_chen",
      "enabled": true,
      "updatedAt": "2026-06-25T10:00:00.000Z",
      "updatedBy": "account_admin"
    },
    {
      "accountId": "account_lin",
      "enabled": false
    }
  ]
}
```

### 4A.2 Update Employee Audit Grant

Required permission:

- `browser_activity.policy.manage`

Request:

```json
{
  "accountId": "account_chen",
  "enabled": true
}
```

Rules:

- request requires trusted `WEB` operator context.
- BFF must verify target account supports `BROWSER_EXTENSION` terminal before enabling.
- service atomically records the grant fact and append-only `BROWSER_ACTIVITY_EMPLOYEE_GRANT_UPDATE` management audit from verified execution facts.

## 5. Extension Ingest

### 5.1 Audit Control

Purpose:

- Return the authenticated browser extension account's collection grant without writing heartbeat, URL, domain, page title, duration, active tab, or user activity facts.

Request:

```json
{}
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

- request requires trusted `BROWSER_EXTENSION` operator context.
- the response is account-scoped and tenant-scoped.
- this is the extension control plane only; it must not update online presence and must not be interpreted as employee online status.
- the extension may keep polling this endpoint while collection is disabled so that administrator re-enablement can resume collection without plugin logout/login.

### 5.2 Append Visit Sessions

Purpose:

- Append or idempotently upsert browser visit summaries produced by an authenticated browser extension.

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

Reject conditions:

- missing authenticated extension context
- signed `session_terminal` is missing or is not `BROWSER_EXTENSION`
- session tenant/account context is missing or inconsistent
- payload contains prohibited raw data fields
- summary duration fields are invalid

Rules:

- when employee audit grant is disabled, service must not store visit facts and must return the disabled response instead of partially accepting data.
- after receiving `policyEnabled = false`, the extension must discard pending local summaries and switch to audit-control polling.

### 5.3 Heartbeat

Purpose:

- Record extension online state only while the plugin is authenticated.

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

If employee audit grant is disabled, response is a non-recording denial:

```json
{
  "accepted": false,
  "policyEnabled": false,
  "nextHeartbeatAfterSeconds": 60
}
```

Rules:

- heartbeat is part of the audit data channel and is only sent while collection is enabled.
- when employee audit grant is disabled, service must not update online presence and must return `accepted = false`.
- after receiving `accepted = false` or `policyEnabled = false`, the extension must stop heartbeat and visit upload, discard pending local summaries, and switch to audit-control polling.

### 5.4 Disconnect

Purpose:

- Mark the authenticated extension session offline immediately on logout, account switch or controlled plugin shutdown.

Request:

```json
{
  "observedAt": "2026-06-25T09:31:00.000Z"
}
```

Rules:

- the service derives tenant, account and extension session from the verified SELF_SERVICE execution context.
- a `WEB`, another session terminal, `MACHINE`, `DELEGATED`, body-supplied session id or cross-tenant target is rejected before presence mutation.
- repeated disconnect for the same verified session is idempotent.

## 6. Admin Queries

All admin queries are tenant-scoped and require `WEB` terminal context.

### 6.1 Overview

Required permission:

- `browser_activity.overview.read`

Request:

```json
{
  "period": "LAST_7_DAYS"
}
```

Response:

```json
{
  "period": "LAST_7_DAYS",
  "policy": {
    "enabled": true,
    "rawRetentionDays": 90,
    "aggregateRetentionDays": 365
  },
  "metrics": {
    "employeeCount": 3,
    "onlineEmployeeCount": 1,
    "staleEmployeeCount": 1,
    "onlineDurationSeconds": 81000,
    "foregroundDurationSeconds": 58260,
    "activeDurationSeconds": 48360,
    "idleDurationSeconds": 9900,
    "urlCount": 116
  },
  "employees": [
    {
      "accountId": "account_chen",
      "displayName": "陈双鹏",
      "onlineStatus": "ONLINE",
      "lastHeartbeatAt": "2026-06-25T09:30:00.000Z",
      "onlineDurationSeconds": 28800,
      "foregroundDurationSeconds": 21600,
      "activeDurationSeconds": 18360,
      "idleDurationSeconds": 3240,
      "pageViewCount": 46
    }
  ]
}
```

Rules:

- employees are sorted by `activeDurationSeconds` descending by default.
- response expresses factual duration only and must not include performance labels or violation conclusions.
- `onlineStatus` is derived from authenticated browser-extension heartbeat and must not be inferred from WEB login state or CRM activity.
- `ONLINE` means the latest valid heartbeat is within 90 seconds; `STALE` means older than 90 seconds and no older than 180 seconds; `OFFLINE` means older than 180 seconds or absent.

### 6.2 Employee Timeline

Required permission:

- `browser_activity.employee_detail.read`

Sensitive read audit:

- required as method-owned `BROWSER_ACTIVITY_EMPLOYEE_TIMELINE_READ`; failure prevents a successful response.

Request:

```json
{
  "employeeAccountId": "account_chen",
  "period": "LAST_7_DAYS"
}
```

Response:

```json
{
  "employeeAccountId": "account_chen",
  "visits": [
    {
      "visitId": "visit_7d9b8b6f",
      "domain": "supplier-portal.example",
      "url": "https://supplier-portal.example/orders",
      "pageTitle": "Supplier Orders",
      "startedAt": "2026-06-25T09:12:00.000Z",
      "endedAt": "2026-06-25T09:28:00.000Z",
      "dwellDurationSeconds": 980,
      "foregroundDurationSeconds": 920,
      "activeDurationSeconds": 840,
      "idleDurationSeconds": 80
    }
  ]
}
```

### 6.3 Domain Aggregation

Required permission:

- `browser_activity.url_detail.read`

Sensitive read audit:

- required as method-owned `BROWSER_ACTIVITY_DOMAIN_AGGREGATION_READ`; failure prevents a successful response.

Request:

```json
{
  "employeeAccountId": "account_chen",
  "period": "LAST_7_DAYS"
}
```

Response:

```json
{
  "domains": [
    {
      "domain": "supplier-portal.example",
      "employeeCount": 2,
      "visitCount": 12,
      "urlCount": 8,
      "foregroundDurationSeconds": 2900,
      "activeDurationSeconds": 2400,
      "idleDurationSeconds": 500
    }
  ]
}
```

### 6.4 URL Search

Required permission:

- `browser_activity.url_detail.read`

Sensitive read audit:

- required as method-owned `BROWSER_ACTIVITY_URL_DETAIL_SEARCH`; failure prevents a successful response.

Request:

```json
{
  "keyword": "orders",
  "period": "LAST_7_DAYS"
}
```

Response:

```json
{
  "results": [
    {
      "url": "https://supplier-portal.example/orders",
      "domain": "supplier-portal.example",
      "pageTitle": "Supplier Orders",
      "employeeDisplayName": "陈双鹏",
      "visitCount": 3,
      "activeDurationSeconds": 840,
      "lastVisitedAt": "2026-06-25T09:28:00.000Z"
    }
  ]
}
```

Rules:

- empty keyword is rejected.
- keyword search is tenant-scoped.
- full URL and page title are sensitive fields.

### 6.5 Online Presence

Required permission:

- `browser_activity.overview.read`

Purpose:

- Return the current browser-extension collection-channel status for tenant employees.

Request:

```json
{
  "status": "ALL",
  "includeOfflineWithinMinutes": 1440
}
```

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

- online presence is derived only from authenticated `BROWSER_EXTENSION` heartbeat.
- `ONLINE`, `STALE`, and `OFFLINE` describe collection-channel liveness, not employee productivity or policy compliance.
- service may omit long-offline employees unless `status=ALL` or `includeOfflineWithinMinutes` asks for recent offline rows.
- response must not include page body, DOM, screenshots, input content, mouse coordinates, or request logs.
