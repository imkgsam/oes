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
