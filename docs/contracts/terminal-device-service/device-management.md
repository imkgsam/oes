# Terminal Device Service Device Management Contract

> 服务设计唯一真相源：[terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)。本文只描述设备管理 command/query contract。

## 1. Purpose

Defines internal contracts for querying and managing `TerminalDevice` records.

## 2. Service Shape

```proto
service TerminalDeviceManagementService {
  rpc ListTerminalDevices(ListTerminalDevicesRequest) returns (ListTerminalDevicesResponse);
  rpc GetTerminalDevice(GetTerminalDeviceRequest) returns (GetTerminalDeviceResponse);
  rpc UpdateTerminalDevice(UpdateTerminalDeviceRequest) returns (UpdateTerminalDeviceResponse);
  rpc ChangeTerminalDeviceStatus(ChangeTerminalDeviceStatusRequest)
      returns (ChangeTerminalDeviceStatusResponse);
  rpc ListTerminalDeviceAuditEvents(ListTerminalDeviceAuditEventsRequest)
      returns (ListTerminalDeviceAuditEventsResponse);
}
```

## 3. Core Device Summary

```json
{
  "terminalDeviceId": "tdv_001",
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "status": "ACTIVE",
  "registeredAt": "2026-05-16T10:00:03Z",
  "enrollmentId": "enr_001"
}
```

## 4. Lifecycle Status

- `PENDING_APPROVAL`
- `ACTIVE`
- `DISABLED`
- `LOST`
- `MAINTENANCE`
- `DECOMMISSIONED`

Rules:

- Only `ACTIVE` allows login and business requests.
- `DECOMMISSIONED` is terminal and cannot be restored to `ACTIVE`.
- Reuse after `DECOMMISSIONED` requires new enrollment.

## 5. ListTerminalDevices

Request:

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "status": "ACTIVE",
  "presenceStatus": "ONLINE",
  "keyword": "Warehouse",
  "page": 1,
  "pageSize": 20
}
```

Response:

```json
{
  "items": [
    {
      "terminalDeviceId": "tdv_001",
      "tenantId": "tenant_001",
      "terminalDeviceType": "PDA",
      "displayName": "PDA-Warehouse-01",
      "status": "ACTIVE",
      "presenceStatus": "ONLINE",
      "appVersion": "2.0.0",
      "androidVersion": "9",
      "manufacturer": "Seuic",
      "model": "Cruise Ge",
      "lastHeartbeatAt": "2026-05-16T10:10:03Z",
      "lastReportedAccountId": "acc_001",
      "registeredAt": "2026-05-16T10:00:03Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

## 6. GetTerminalDevice

Request:

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "includeSensitiveIdentity": false
}
```

Response:

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
    "manufacturerSerialMasked": "SEU***456",
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
    "batteryLevel": 72,
    "appState": "FOREGROUND",
    "lastReportedAccountId": "acc_001"
  }
}
```

Rules:

- Full serial / android id require sensitive read permission at caller boundary.
- `lastReportedAccountId` is not current session truth.

## 7. UpdateTerminalDevice

Request:

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "displayName": "PDA-Warehouse-01",
  "notes": "Assigned to pilot",
  "operatorContext": {
    "operatorAccountId": "acc_admin",
    "traceId": "trace_001"
  }
}
```

Response:

```json
{
  "terminalDeviceId": "tdv_001",
  "displayName": "PDA-Warehouse-01",
  "notes": "Assigned to pilot",
  "updatedAt": "2026-05-16T11:00:00Z"
}
```

## 8. ChangeTerminalDeviceStatus

Request:

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "targetStatus": "DISABLED",
  "reason": "Device removed from pilot",
  "operatorContext": {
    "operatorAccountId": "acc_admin",
    "traceId": "trace_002"
  }
}
```

Response:

```json
{
  "terminalDeviceId": "tdv_001",
  "previousStatus": "ACTIVE",
  "status": "DISABLED",
  "statusReason": "Device removed from pilot",
  "changedAt": "2026-05-16T11:20:00Z",
  "sessionRevokeIntent": {
    "required": true,
    "terminal": "PDA",
    "terminalDeviceId": "tdv_001"
  }
}
```

Rules:

- High-risk changes require `reason`.
- `DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` require session revoke intent.
- `DECOMMISSIONED -> ACTIVE` is not allowed.
- Status command must write audit.

## 9. Audit Events

Audit event shape:

```json
{
  "auditEventId": "tda_001",
  "tenantId": "tenant_001",
  "operatorAccountId": "acc_admin",
  "action": "STATUS_CHANGED",
  "targetTerminalDeviceId": "tdv_001",
  "before": { "status": "ACTIVE" },
  "after": { "status": "DISABLED" },
  "reason": "Device removed from pilot",
  "traceId": "trace_002",
  "occurredAt": "2026-05-16T11:20:00Z"
}
```

Gateway access log does not replace this audit event.
