# Terminal Device Service Version Policy Contract

> 服务设计唯一真相源：[terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)。本文只描述 terminal device App version policy contract。

## 1. Purpose

Defines internal contract for tenant-level terminal device app version policy.

Phase 2 only supports PDA app version policy. It does not implement automatic upgrade, hot update, MDM, enterprise app store integration, or background installation.

## 2. Service Shape

```proto
service TerminalDeviceVersionPolicyService {
  rpc GetVersionPolicy(GetVersionPolicyRequest) returns (GetVersionPolicyResponse);
  rpc UpsertVersionPolicy(UpsertVersionPolicyRequest) returns (UpsertVersionPolicyResponse);
}
```

## 3. Policy Scope

Policy key:

- `tenantId`
- `terminalDeviceType`

Phase 2:

- `terminalDeviceType = PDA`

## 4. Version Policy Shape

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

## 5. GetVersionPolicy

Request:

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA"
}
```

Response:

```json
{
  "policy": {
    "tenantId": "tenant_001",
    "terminalDeviceType": "PDA",
    "minSupportedAppVersion": "2.0.0",
    "latestAppVersion": "2.1.0",
    "upgradeRequired": false,
    "upgradeRecommended": true,
    "apkDownloadUrl": null,
    "releaseNotesUrl": null
  }
}
```

## 6. UpsertVersionPolicy

Request:

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
  "reason": "Pilot rollout baseline",
  "operatorContext": {
    "operatorAccountId": "acc_admin",
    "traceId": "trace_001"
  }
}
```

Response:

```json
{
  "policy": {
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
}
```

Rules:

- `reason` is required for updates.
- Update must write audit.
- Version comparison and blocking decision belong to `DeviceAccessDecision`.

## 7. Decision Semantics

- `appVersion < minSupportedAppVersion`: block login, bootstrap and business requests.
- `appVersion < latestAppVersion` but not below minimum: allow and recommend upgrade.
- heartbeat and diagnostic logs may still be accepted when version is unsupported so PDA can receive policy and upload diagnostics.

## 8. Trusted execution and wire freeze

`GetVersionPolicy` 是 BUSINESS/HUMAN WEB，all `terminal-device.read`；`UpsertVersionPolicy` 是 BUSINESS/HUMAN WEB，all `terminal-device.version-policy.manage`。两者使用 `aud=urn:oes:service:terminal-device-service`，拒绝 MACHINE 与 DELEGATED。

`GetVersionPolicyRequest.tenant_id=1` 删除并 reserve，保留 `terminal_device_type=2`。`UpsertVersionPolicyRequest.tenant_id=1` 与 `operator_context=10` 删除并 reserve，保留当前 `terminal_device_type=2`、版本/URL/flag `3..8` 与 `reason=9`。Tenant、operator、org 和 trace 只来自 verified ET / trusted transport；request body 不能扩大 scope。

Upsert 必须把 policy mutation 与 safe audit 原子提交，审计记录 trusted principal、tenant、before/after、reason 与 trace。URL 与 version 是 tenant policy payload，不是 authority；版本阻断仍只由 `ResolveDeviceAccessDecision` 执行。
