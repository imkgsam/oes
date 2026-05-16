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
