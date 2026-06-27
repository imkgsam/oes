# Browser Activity Service P1 Contract

> `browser-activity-service` 的服务职责、核心对象与 owner 边界以 [browser-activity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/browser-activity-service.md) 为唯一稳定真相源。本文只描述 P1 service-level 黑盒契约。

## 1. Purpose

P1 contract 支持两个调用方向：

- `api-gateway` 从 authenticated browser-extension session 写入访问会话汇总与 heartbeat。
- `api-gateway` 从 authenticated tenant-web admin session 管理员工采集授权，并读取策略、概览、员工时间线、domain 聚合与 URL 搜索结果。

服务端必须拒绝未登录插件、非 `BROWSER_EXTENSION` terminal、员工采集授权 disabled 或缺少 tenant context 的采集写入。

## 2. Common Context

所有请求必须由调用方显式传递服务端可信上下文。

```json
{
  "tenantId": "tenant_meilong",
  "orgId": "org_sales",
  "operator": {
    "userId": "user_chen",
    "accountId": "account_chen",
    "displayName": "陈双鹏",
    "terminal": "BROWSER_EXTENSION"
  },
  "trace": {
    "traceId": "trace_01HX",
    "requestId": "req_01HX"
  },
  "audit": {
    "reason": "BROWSER_EXTENSION_INGEST",
    "sourceIp": "127.0.0.1",
    "userAgent": "Chrome Extension"
  }
}
```

Rules:

- `tenantId` is required for every P1 request.
- ingest / heartbeat require `operator.terminal = BROWSER_EXTENSION`.
- admin read / policy calls require `operator.terminal = WEB`.
- service rejects client-supplied terminal claims when the BFF has not normalized them into trusted context.
- audit context is required for policy updates and sensitive admin reads.

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
  "extensionSessionId": "ext_session_01HX",
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

- `clientVisitId`, `extensionSessionId`, `url`, `domain`, `startedAt`, `endedAt`, and duration fields are required.
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
- update records management audit.

## 4A. Employee Audit Grant

### 4A.1 Get Employee Audit Grants

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
- service records the grant fact and management audit metadata.

## 5. Extension Ingest

### 5.1 Audit Control

Purpose:

- Return the authenticated browser extension account's collection grant without writing heartbeat, URL, domain, page title, duration, active tab, or user activity facts.

Request:

```json
{
  "tenantId": "tenant_meilong",
  "operator": {
    "accountId": "account_chen",
    "terminal": "BROWSER_EXTENSION"
  }
}
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
      "extensionSessionId": "ext_session_01HX",
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
- `operator.terminal` is not `BROWSER_EXTENSION`
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
  "extensionSessionId": "ext_session_01HX",
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

- required

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

- `browser_activity.overview.read`

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

- required

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
