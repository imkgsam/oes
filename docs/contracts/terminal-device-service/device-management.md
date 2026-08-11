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

## 10. Trusted execution and field authority freeze

五个 RPC 都是 `BUSINESS`、`HUMAN`、`session_terminal=WEB`，使用 `aud=urn:oes:service:terminal-device-service` 并拒绝 MACHINE/DELEGATED：

| RPC | Exact Code rule |
| --- | --- |
| `ListTerminalDevices` | all `terminal-device.read` |
| `GetTerminalDevice` | all `terminal-device.read`; unmasked identity additionally requires `terminal-device.sensitive.read` in the same ET |
| `UpdateTerminalDevice` | all `terminal-device.update` |
| `ChangeTerminalDeviceStatus` | any lifecycle Code plus exact target binding below |
| `ListTerminalDeviceAuditEvents` | all `terminal-device.audit.read` |

Status 绑定固定为：`DISABLED -> terminal-device.status.disable`、`LOST -> terminal-device.status.mark-lost`、`MAINTENANCE -> terminal-device.status.mark-maintenance`、`ACTIVE -> terminal-device.status.restore-active`、`DECOMMISSIONED -> terminal-device.status.decommission`。`PENDING_APPROVAL` 不能由该 RPC 直接设置；持有任一其他 lifecycle Code 不能执行不匹配的 target transition。

Proto 删除并 reserve：

- `ListTerminalDevicesRequest.tenant_id=1`；
- `GetTerminalDeviceRequest.tenant_id=1` 与 `include_sensitive_identity=3`；
- `UpdateTerminalDeviceRequest.tenant_id=1` 与 `operator_context=5`；
- `ChangeTerminalDeviceStatusRequest.tenant_id=1` 与 `operator_context=5`；
- `ListTerminalDeviceAuditEventsRequest.tenant_id=1`。

其余 device target、filter、pagination、display、notes、target status 与 reason 字段保留原号码。Tenant、operator account/org、trace 与 sensitive projection 只从 verified ET / trusted context 得到。Full serial/android identity 只在 ET 同时含 `terminal-device.sensitive.read` 时返回并写敏感读取审计；caller boolean 不能扩大 projection。

Create/update/status/version-policy 变更与 enrollment 使用/撤销必须写本地治理审计。状态变更、审计与 credential state transition 构成同一 consistency boundary：`DISABLED / LOST / MAINTENANCE` 暂停 credential；受审计的 ACTIVE restore 恢复；DECOMMISSIONED 永久撤销。`terminal-device.unavailable` Redis fact 继续是独立异步 session-cleanup 路径，不是 gRPC 授权或同步成功的替代品。
