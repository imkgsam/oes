# Terminal Device Service Runtime Snapshot Contract

> 服务设计唯一真相源：[terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)。本文只描述 heartbeat/runtime snapshot contract。

## 1. Purpose

Defines internal contract for recording latest terminal device runtime state from PDA heartbeat.

Runtime snapshot is diagnostic data. It is not lifecycle status truth and not login truth.

## 2. Service Shape

```proto
service TerminalDeviceRuntimeSnapshotService {
  rpc RecordHeartbeat(RecordHeartbeatRequest) returns (RecordHeartbeatResponse);
  rpc GetRuntimeSnapshot(GetRuntimeSnapshotRequest) returns (GetRuntimeSnapshotResponse);
  rpc ListHeartbeatRecords(ListHeartbeatRecordsRequest) returns (ListHeartbeatRecordsResponse);
  rpc RecordDiagnosticLogs(RecordDiagnosticLogsRequest) returns (RecordDiagnosticLogsResponse);
  rpc ListDiagnosticLogs(ListDiagnosticLogsRequest) returns (ListDiagnosticLogsResponse);
}
```

## 3. RecordHeartbeat Request

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "terminalDeviceType": "PDA",
  "identity": {
    "manufacturerSerial": "SEUIC-SN-123456",
    "androidId": "android-id-redacted",
    "appInstallationId": "app-install-uuid",
    "manufacturer": "Seuic",
    "model": "Cruise Ge"
  },
  "software": {
    "androidVersion": "9",
    "webViewVersion": "66.0.3359.158",
    "appVersion": "2.0.0"
  },
  "runtime": {
    "networkStatus": "ONLINE",
    "networkType": "WIFI",
    "batteryLevel": 72,
    "appState": "FOREGROUND"
  },
  "reportedSession": {
    "accountId": "acc_001",
    "tenantId": "tenant_001",
    "sessionId": "sess_001"
  },
  "clientTime": "2026-05-16T10:10:00Z",
  "receivedAt": "2026-05-16T10:10:03Z",
  "traceId": "trace_001"
}
```

`reportedSession` may be null before login.

## 4. RecordHeartbeat Response

```json
{
  "accepted": true,
  "terminalDeviceId": "tdv_001",
  "lastHeartbeatAt": "2026-05-16T10:10:03Z",
  "presenceStatus": "ONLINE"
}
```

## 5. Runtime Snapshot

```json
{
  "terminalDeviceId": "tdv_001",
  "presenceStatus": "ONLINE",
  "lastHeartbeatAt": "2026-05-16T10:10:03Z",
  "lastClientTime": "2026-05-16T10:10:00Z",
  "appVersion": "2.0.0",
  "androidVersion": "9",
  "webViewVersion": "66.0.3359.158",
  "networkStatus": "ONLINE",
  "networkType": "WIFI",
  "batteryLevel": 72,
  "appState": "FOREGROUND",
  "lastReportedAccountId": "acc_001",
  "lastReportedSessionId": "sess_001"
}
```

## 6. Presence Status

- `ONLINE`
- `STALE`
- `OFFLINE`
- `UNKNOWN`

Rules:

- Presence is inferred from `lastHeartbeatAt`.
- Presence is not lifecycle status.
- Administrator does not manually maintain presence.
- Heartbeat does not change `ACTIVE / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED`.
- App close, lock screen, shutdown and network loss all appear as missing heartbeat; Phase 2 does not distinguish exact causes.

## 7. Login Truth Boundary

- `lastReportedAccountId` is diagnostic attachment only.
- Current valid sessions belong to `auth-service`.
- Admin BFF must query `auth-service` to show current active PDA sessions.

## 8. Heartbeat History

Phase 2 stores an immutable heartbeat diagnostic record for each accepted heartbeat in addition to the latest runtime snapshot.

Rules:

- History is newest-first and paginated by `tenantId + terminalDeviceId`.
- History is diagnostic evidence only; lifecycle status remains owned by `TerminalDevice`.
- `reportedAccountId` and `reportedSessionId` remain client-reported diagnostics and are not current login truth.

## 9. Manual Diagnostic Log History

Phase 2 persists sanitized PDA diagnostic logs accepted by `/pda/device/logs` in `terminal-device-service`.

Rules:

- Logs are tenant-scoped by `tenantId + terminalDeviceId`.
- Logs are newest-first and paginated.
- PDA BFF remains responsible for Phase 1 redaction rules before calling `terminal-device-service`.
- Admin BFF must query `terminal-device-service`; it must not rely on gateway process memory for log history.
- Diagnostic logs are troubleshooting evidence only and do not replace audit events or observability pipelines.

## 10. Trusted execution, device proof and wire freeze

| RPC | Mode / principal | Exact Code |
| --- | --- | --- |
| `RecordHeartbeat` | INTERNAL / exact Gateway SYSTEM MACHINE | all `terminal-device.internal.gateway.heartbeat.record` |
| `RecordDiagnosticLogs` | INTERNAL / exact Gateway SYSTEM MACHINE | all `terminal-device.internal.gateway.diagnostic_log.record` |
| `GetRuntimeSnapshot` | BUSINESS / HUMAN WEB | all `terminal-device.sensitive.read` |
| `ListHeartbeatRecords` | BUSINESS / HUMAN WEB | all `terminal-device.sensitive.read` |
| `ListDiagnosticLogs` | BUSINESS / HUMAN WEB | all `terminal-device.sensitive.read` |

所有方法使用 `aud=urn:oes:service:terminal-device-service` 并拒绝 DELEGATED。两个写入 RPC 使用 Gateway MACHINE ET，但仍必须验证 Terminal Device Service 自有的 device credential；ET 证明 Gateway，credential 证明请求持有当前设备的入网秘密，两者不能互相替代。三个管理读取从 HUMAN ET 派生 tenant/operator，device ID 是 tenant-scoped target。

Proto 删除并 reserve：

- `RecordHeartbeatRequest.tenant_id=1`, `received_at=9`, `trace_id=10`；保留 terminal device/type、identity、software、runtime、`reported_session=7` 与 `client_time=8`，新增 `device_credential=11`；
- `GetRuntimeSnapshotRequest.tenant_id=1`；
- `ListHeartbeatRecordsRequest.tenant_id=1`；
- `RecordDiagnosticLogsRequest.tenant_id=1`，新增 `device_credential=4`；
- `ListDiagnosticLogsRequest.tenant_id=1`。

`RecordHeartbeatResponse` 保留现有 `1..4`，新增 `rotated_device_credential=5`, `device_credential_expires_at=6`, `device_credential_version=7`；没有轮换时 credential 字段为空，服务端仍返回当前 expiry/version。

`reported_session` 只保留为诊断附件；已验证 session 存在时 Gateway 可以覆盖为 verified account/session 摘要，未登录时为空，Terminal Device 不以它建立 tenant、当前登录或 authorization。Heartbeat received time 与 trace 使用服务时钟/trusted transport。Credential 在剩余 7 天内轮换并以新旧版本最多 5 分钟重叠收敛；超期、撤销或重放旧版本均 fail closed。Heartbeat 的重复 payload 只形成诊断幂等结果，不改变生命周期或授权。

`RecordDiagnosticLogsRequest.logs=3` 改用独立 input message，兼容保留 `client_time=6`, `level=8`, `event_type=9`, `message=10`, `error_code=13`, `diagnostic_mode=14`, `details_json=15`；删除并 reserve caller-supplied `diagnostic_log_id=1`, `tenant_id=2`, `terminal_device_id=3`, `received_at=7`, `trace_id=11`, `request_id=12`。`account_id=4` / `session_id=5` 只改名为 `reported_account_id` / `reported_session_id` 并保留 wire number。输出 projection 继续由服务生成。

Gateway 的第一轮 redaction 不替代服务端第二轮 secret、大小、条数与 details allowlist 校验。Heartbeat/diagnostic 是受限诊断能力，不赋予业务操作权限，也不把 presence、reported session 或 device credential 写成审计/登录真相。
