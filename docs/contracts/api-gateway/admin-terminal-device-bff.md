# Admin Terminal Device BFF Contract

> `terminal-device-service` 的长期职责以 [terminal-device-service.md](../../architecture/services/terminal-device-service.md) 为准；设备管理权限真相以 [permission-service.md](../../architecture/services/permission-service.md) 为准。本文只描述 tenant-web 后台设备管理 HTTP contract。

## 1. Purpose

This document defines the Phase 2 Admin BFF contract for managed terminal device management.

It supports:

- enrollment management
- terminal device list and detail
- lifecycle status operations
- version policy management
- device governance audit query

It does not define PDA-side enrollment HTTP shape, WMS / MES business workflows, MDM, automatic upgrade, or account security trusted devices.

## 2. Boundary

Admin BFF owns HTTP shape and aggregation for `tenant-web`.

Admin BFF does not own:

- terminal device registry truth
- enrollment truth
- lifecycle transition rules
- version policy truth
- session truth
- authorization truth

Admin BFF must call:

- `permission-service` for administrator permissions.
- `terminal-device-service` for device management commands and queries.
- `auth-service` when current PDA sessions must be queried or revoked.

## 3. Permissions

Phase 2 uses these action codes:

- `terminal-device.enrollment.create`
- `terminal-device.enrollment.revoke`
- `terminal-device.read`
- `terminal-device.sensitive.read`
- `terminal-device.status.disable`
- `terminal-device.status.mark-lost`
- `terminal-device.status.mark-maintenance`
- `terminal-device.status.restore-active`
- `terminal-device.version-policy.manage`
- `terminal-device.audit.read`

Admin BFF must not collapse these into one coarse `manage` permission.

## 4. `POST /admin/terminal-devices/enrollments`

### 4.1 Purpose

Creates a short-lived, single-use enrollment for a PDA.

### 4.2 Request

```json
{
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "expectedManufacturerSerial": "SEUIC-SN-123456",
  "expiresAt": "2026-05-17T10:00:00Z",
  "notes": "Issued for warehouse pilot"
}
```

### 4.3 Response

```json
{
  "enrollmentId": "enr_001",
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "status": "ISSUED",
  "enrollmentCode": "ENR-123456",
  "qrPayload": "oes-pda-enrollment://ENR-123456",
  "expiresAt": "2026-05-17T10:00:00Z",
  "createdAt": "2026-05-16T10:00:00Z",
  "createdBy": "acc_admin"
}
```

Rules:

- Response may reveal `enrollmentCode` only at creation time or controlled re-display time.
- Service storage should keep a hash or secure digest, not plaintext code.
- `terminalDeviceType` Phase 2 must be `PDA`.

## 5. `GET /admin/terminal-devices/enrollments`

### 5.1 Purpose

Lists enrollments in the current tenant.

### 5.2 Query

- `status`
- `terminalDeviceType`
- `page`
- `pageSize`

### 5.3 Response

```json
{
  "items": [
    {
      "enrollmentId": "enr_001",
      "terminalDeviceType": "PDA",
      "displayName": "PDA-Warehouse-01",
      "status": "USED",
      "expiresAt": "2026-05-17T10:00:00Z",
      "usedAt": "2026-05-16T10:30:00Z",
      "usedByTerminalDeviceId": "tdv_001",
      "createdBy": "acc_admin",
      "createdAt": "2026-05-16T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

## 6. `POST /admin/terminal-devices/enrollments/{enrollmentId}/revoke`

### 6.1 Purpose

Revokes an unused enrollment.

### 6.2 Request

```json
{
  "reason": "Issued by mistake"
}
```

### 6.3 Response

```json
{
  "enrollmentId": "enr_001",
  "status": "REVOKED",
  "revokedAt": "2026-05-16T11:00:00Z",
  "revokedBy": "acc_admin"
}
```

Rules:

- `USED` enrollments cannot be revoked.
- `reason` is required.

## 7. `GET /admin/terminal-devices`

### 7.1 Purpose

Lists managed terminal devices in the current tenant.

### 7.2 Query

- `terminalDeviceType`
- `status`
- `presenceStatus`
- `appVersion`
- `keyword`
- `page`
- `pageSize`

### 7.3 Response

```json
{
  "items": [
    {
      "terminalDeviceId": "tdv_001",
      "terminalDeviceType": "PDA",
      "displayName": "PDA-Warehouse-01",
      "status": "ACTIVE",
      "presenceStatus": "ONLINE",
      "appVersion": "2.0.0",
      "androidVersion": "9",
      "manufacturer": "Seuic",
      "model": "Cruise Ge",
      "lastHeartbeatAt": "2026-05-16T10:10:03Z",
      "lastReportedAccount": {
        "accountId": "acc_001",
        "displayName": "Zhang San"
      },
      "registeredAt": "2026-05-16T10:00:03Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

Rules:

- `lastReportedAccount` is a runtime snapshot field, not current session truth.
- Full serial, android id, IP and diagnostic details require sensitive read permission and should normally be omitted from list response.

## 8. `GET /admin/terminal-devices/{terminalDeviceId}`

### 8.1 Purpose

Returns device detail for management and diagnostics.

### 8.2 Response

```json
{
  "device": {
    "terminalDeviceId": "tdv_001",
    "tenantId": "tenant_001",
    "terminalDeviceType": "PDA",
    "displayName": "PDA-Warehouse-01",
    "status": "ACTIVE",
    "statusReason": null,
    "registeredAt": "2026-05-16T10:00:03Z",
    "enrollmentId": "enr_001"
  },
  "identity": {
    "manufacturer": "Seuic",
    "model": "Cruise Ge",
    "manufacturerSerial": "SEUIC-SN-123456",
    "androidIdMasked": "and***789",
    "identitySource": "MANUFACTURER_SERIAL",
    "identityConfidence": "HIGH"
  },
  "runtime": {
    "presenceStatus": "ONLINE",
    "lastHeartbeatAt": "2026-05-16T10:10:03Z",
    "appVersion": "2.0.0",
    "androidVersion": "9",
    "networkStatus": "ONLINE",
    "networkType": "WIFI",
    "batteryLevel": 72,
    "appState": "FOREGROUND",
    "lastReportedAccount": {
      "accountId": "acc_001",
      "displayName": "Zhang San"
    }
  },
  "currentSessions": [
    {
      "sessionId": "sess_001",
      "accountId": "acc_001",
      "displayName": "Zhang San",
      "createdAt": "2026-05-16T09:00:00Z",
      "lastSeenAt": "2026-05-16T10:09:00Z"
    }
  ],
  "auditSummary": {
    "lastStatusChangedAt": null,
    "lastStatusChangedBy": null
  }
}
```

Rules:

- `currentSessions` must come from `auth-service`, not heartbeat.
- Admin BFF must query current sessions by `terminalDeviceId`; it must not pass heartbeat `lastReportedAccount.accountId` as `userId`.
- Sensitive identity fields require `terminal-device.sensitive.read`.

## 9. `PATCH /admin/terminal-devices/{terminalDeviceId}`

### 9.1 Purpose

Updates non-lifecycle display fields.

### 9.2 Request

```json
{
  "displayName": "PDA-Warehouse-01",
  "notes": "Assigned to warehouse pilot shelf"
}
```

### 9.3 Response

```json
{
  "terminalDeviceId": "tdv_001",
  "displayName": "PDA-Warehouse-01",
  "notes": "Assigned to warehouse pilot shelf",
  "updatedAt": "2026-05-16T11:10:00Z"
}
```

## 10. `PATCH /admin/terminal-devices/{terminalDeviceId}/status`

### 10.1 Purpose

Changes lifecycle status.

### 10.2 Request

```json
{
  "targetStatus": "DISABLED",
  "reason": "Device temporarily removed from pilot"
}
```

### 10.3 Response

```json
{
  "terminalDeviceId": "tdv_001",
  "previousStatus": "ACTIVE",
  "status": "DISABLED",
  "statusReason": "Device temporarily removed from pilot",
  "changedAt": "2026-05-16T11:20:00Z",
  "sessionRevoke": {
    "requested": true,
    "status": "ACCEPTED",
    "affectedSessionCount": 1
  }
}
```

Rules:

- `reason` is required for high-risk status changes.
- `DECOMMISSIONED` must clear PDA local `terminalDeviceId` on next PDA decision response.
- `DECOMMISSIONED` cannot be restored to `ACTIVE`; future use requires new enrollment.
- Status transition rules belong to `terminal-device-service`.

## 11. `GET /admin/terminal-devices/version-policy`

### 11.1 Purpose

Reads version policy for terminal device type in current tenant.

### 11.2 Query

- `terminalDeviceType=PDA`

### 11.3 Response

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "minSupportedAppVersion": "2.0.0",
  "latestAppVersion": "2.1.0",
  "upgradeRequired": false,
  "upgradeRecommended": true,
  "apkDownloadUrl": null,
  "releaseNotesUrl": null,
  "updatedAt": "2026-05-16T11:00:00Z",
  "updatedBy": "acc_admin"
}
```

## 12. `PUT /admin/terminal-devices/version-policy`

### 12.1 Purpose

Updates version policy.

### 12.2 Request

```json
{
  "terminalDeviceType": "PDA",
  "minSupportedAppVersion": "2.0.0",
  "latestAppVersion": "2.1.0",
  "upgradeRequired": false,
  "upgradeRecommended": true,
  "apkDownloadUrl": null,
  "releaseNotesUrl": null,
  "reason": "Pilot rollout baseline"
}
```

Rules:

- Requires `terminal-device.version-policy.manage`.
- Must write device governance audit.
- Does not trigger automatic upgrade.

## 13. `GET /admin/terminal-devices/{terminalDeviceId}/audit-events`

### 13.1 Purpose

Returns device governance audit events.

### 13.2 Response

```json
{
  "items": [
    {
      "auditEventId": "tda_001",
      "action": "STATUS_CHANGED",
      "operatorAccountId": "acc_admin",
      "targetTerminalDeviceId": "tdv_001",
      "before": { "status": "ACTIVE" },
      "after": { "status": "DISABLED" },
      "reason": "Device temporarily removed from pilot",
      "traceId": "trace_001",
      "occurredAt": "2026-05-16T11:20:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

## 14. `GET /admin/terminal-devices/{terminalDeviceId}/heartbeat-records`

### 14.1 Purpose

Returns immutable heartbeat diagnostic records for one managed terminal device.

### 14.2 Response

```json
{
  "items": [
    {
      "heartbeatId": "hb_001",
      "terminalDeviceId": "tdv_001",
      "presenceStatus": "ONLINE",
      "receivedAt": "2026-05-16T10:10:03Z",
      "clientTime": "2026-05-16T10:10:00Z",
      "appVersion": "2.0.0",
      "networkStatus": "ONLINE",
      "batteryLevel": 72,
      "reportedAccountId": "acc_001",
      "reportedSessionId": "sess_001",
      "traceId": "trace_001"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

Rules:

- Heartbeat records are diagnostics, not lifecycle truth and not login truth.
- Current online / offline display may use latest snapshot; history is for troubleshooting.

## 15. `GET /admin/terminal-devices/{terminalDeviceId}/diagnostic-logs`

### 15.1 Purpose

Returns recently uploaded manual PDA diagnostic logs accepted by `/pda/device/logs`.

Rules:

- Log details must preserve Phase 1 redaction rules.
- Admin BFF reads persisted diagnostic logs from `terminal-device-service`.
- Admin BFF must not read gateway-local in-memory diagnostic buffers as the source for this page.
- This endpoint is for field diagnostics and does not replace observability or audit storage.

## 16. Explicitly Forbidden

- Admin BFF must not persist terminal device registry truth.
- Admin BFF must not copy lifecycle transition rules.
- Admin BFF must not treat heartbeat `lastReportedAccount` as current session truth.
- Admin BFF must not expose sensitive identity fields without permission.

## 18. Trusted gRPC caller freeze

All Admin Terminal Device HTTP endpoints require an active WEB HUMAN session. Gateway verifies the HTTP access credential first, then exchanges the request-private verified source credential for a certificate-bound `aud=urn:oes:service:terminal-device-service` HUMAN ExecutionToken carrying the exact Code set required by the downstream RPC. Gateway does not use its SYSTEM MACHINE root for Admin calls and does not forward the HTTP access token to Terminal Device Service.

Gateway no longer sends `tenant_id`, `operator_context`, body trace or `include_sensitive_identity` to Terminal Device Service. Tenant/account/org/terminal/trace come from the same verified session and ET. For device detail, a normal caller obtains an ET with `terminal-device.read`; an authorized sensitive projection obtains the exact set `terminal-device.read + terminal-device.sensitive.read`. The service derives masking from that Code set and records sensitive-read audit; a query/body boolean cannot request unmasked values.

The BFF permission decorators remain the external-entry gate and must match the 13-RPC matrix in the Terminal Device service truth source. `ChangeTerminalDeviceStatus` additionally maps the submitted target status to its exact lifecycle Code; an ET containing another lifecycle Code cannot be reused for a different target status. DELEGATED and non-WEB sessions are not supported by this Admin contract.
- Admin BFF must not implement MDM, automatic upgrade, remote wipe or remote lock in Phase 2.
