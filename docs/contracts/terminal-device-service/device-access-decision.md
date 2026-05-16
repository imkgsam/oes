# Terminal Device Service DeviceAccessDecision Contract

> 服务设计唯一真相源：[terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)。本文只描述设备准入判定 contract。

## 1. Purpose

Defines the internal decision contract used by BFFs and future PDA business entry points to determine whether a terminal device may perform a request.

This contract prevents gateway/controller/DTO layers from copying lifecycle, version, enrollment, and identity conflict rules.

## 2. Service Shape

```proto
service TerminalDeviceAccessDecisionService {
  rpc ResolveDeviceAccessDecision(ResolveDeviceAccessDecisionRequest)
      returns (ResolveDeviceAccessDecisionResponse);
}
```

## 3. Request

```json
{
  "tenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "terminalDeviceType": "PDA",
  "requestPurpose": "LOGIN",
  "appVersion": "2.0.0",
  "identity": {
    "manufacturerSerial": "SEUIC-SN-123456",
    "androidId": "android-id-redacted",
    "appInstallationId": "app-install-uuid",
    "manufacturer": "Seuic",
    "model": "Cruise Ge"
  },
  "session": {
    "accountId": "acc_001",
    "sessionId": "sess_001"
  },
  "traceId": "trace_001"
}
```

`tenantId` may be absent for PDA login before tenant is resolved. In that case the service resolves tenant from `terminalDeviceId`.

## 4. Request Purpose

- `ENROLLMENT`
- `LOGIN`
- `BOOTSTRAP`
- `BUSINESS_REQUEST`
- `HEARTBEAT`
- `DIAGNOSTIC_LOG`

Rules:

- `LOGIN / BOOTSTRAP / BUSINESS_REQUEST` require `ACTIVE` and supported app version.
- `HEARTBEAT / DIAGNOSTIC_LOG` may be allowed for non-active devices so the PDA can receive policy and upload diagnostics.
- `DECOMMISSIONED` may allow only limited governance responses and must request local device id cleanup.

## 5. Response

```json
{
  "allowed": true,
  "decisionCode": "ALLOW",
  "resolvedTenantId": "tenant_001",
  "terminalDeviceId": "tdv_001",
  "terminalDeviceType": "PDA",
  "deviceStatus": "ACTIVE",
  "presenceStatus": "ONLINE",
  "versionPolicy": {
    "minSupportedAppVersion": "2.0.0",
    "latestAppVersion": "2.1.0",
    "upgradeRequired": false,
    "upgradeRecommended": true,
    "apkDownloadUrl": null,
    "releaseNotesUrl": null
  },
  "requiredAction": "NONE",
  "messageKey": null,
  "shouldClearLocalSession": false,
  "shouldClearLocalTerminalDeviceId": false,
  "shouldRevokeServerSessions": false
}
```

## 6. Decision Codes

- `ALLOW`
- `ENROLLMENT_REQUIRED`
- `DEVICE_PENDING_APPROVAL`
- `DEVICE_DISABLED`
- `DEVICE_LOST`
- `DEVICE_MAINTENANCE`
- `DEVICE_DECOMMISSIONED`
- `APP_VERSION_UNSUPPORTED`
- `DEVICE_IDENTITY_CONFLICT`
- `TERMINAL_DEVICE_NOT_FOUND`
- `INVALID_TERMINAL_DEVICE_TYPE`

Enrollment-specific denial codes may be returned by enrollment activation:

- `ENROLLMENT_EXPIRED`
- `ENROLLMENT_USED`
- `ENROLLMENT_REVOKED`
- `ENROLLMENT_INVALID`

## 7. Required Actions

- `NONE`
- `ENROLL_DEVICE`
- `CONTACT_ADMIN`
- `CLEAR_LOCAL_SESSION`
- `CLEAR_LOCAL_DEVICE_AND_SESSION`
- `UPGRADE_APP`

## 8. Lifecycle Rules

- `ACTIVE`: allow login, bootstrap and business requests if version policy passes.
- `PENDING_APPROVAL`: deny login and business requests; allow diagnostics.
- `DISABLED`: deny login and business requests; request local session clear.
- `LOST`: deny login and business requests; request local session clear.
- `MAINTENANCE`: deny login and business requests; request local session clear.
- `DECOMMISSIONED`: deny login and business requests; request local session and terminal device id clear.

## 9. Version Rules

- If `appVersion < minSupportedAppVersion`, deny login, bootstrap and business request with `APP_VERSION_UNSUPPORTED`.
- If `appVersion < latestAppVersion` but not below minimum, allow and mark upgrade recommended.
- Version comparison must be performed by `terminal-device-service`, not by BFF.

## 10. Identity Rules

- `terminalDeviceId` is the primary internal reference after enrollment.
- Identity signals are used for diagnostics, conflict detection and risk handling.
- Matching manufacturer serial without local `terminalDeviceId` must not auto-recover old devices.
- Identity conflict must return a decision requiring administrator handling.
