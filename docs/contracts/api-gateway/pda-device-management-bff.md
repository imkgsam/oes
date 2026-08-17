# PDA Device Management BFF Contract

> PDA 设备治理长期 owner 以 [terminal-device-service.md](../../architecture/services/terminal-device-service.md) 为准；跨服务协同以 [managed-terminal-device-management.md](../../architecture/collaborations/managed-terminal-device-management.md) 为准。本文只描述 PDA 端 `/pda/*` HTTP contract。

## 1. Purpose

This document defines the Phase 2 PDA-facing device management HTTP contracts exposed by API Gateway / PDA BFF.

These contracts support:

- PDA enrollment activation
- device access decision consumption
- managed heartbeat
- bootstrap device policy
- diagnostic log upload under device governance

They do not define Admin device management UI, WMS / MES business workflows, MDM, remote control, automatic upgrade, or account security trusted devices.

## 2. Boundary

PDA BFF owns the external HTTP shape consumed by `app/pda`.

PDA BFF does not own:

- terminal device registry truth
- enrollment truth
- lifecycle status rules
- app version policy truth
- session / token truth
- terminal access truth
- WMS / MES business truth

PDA BFF must call `terminal-device-service` for `DeviceAccessDecision` and device state changes.

## 3. Common Device Metadata

PDA requests should carry normalized device metadata when available.

```json
{
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
  }
}
```

Rules:

- `terminalDeviceId` is absent before enrollment.
- `manufacturerSerial` is a high-priority identity signal, not a system primary key.
- `appInstallationId` identifies an installation instance, not the physical device.
- Sensitive identity fields may be masked in responses.

## 4. Common Device Decision

PDA-facing responses that need governance status should include a device decision summary.

```json
{
  "allowed": true,
  "decisionCode": "ALLOW",
  "deviceStatus": "ACTIVE",
  "presenceStatus": "ONLINE",
  "requiredAction": "NONE",
  "messageKey": null,
  "shouldClearLocalSession": false,
  "shouldClearLocalTerminalDeviceId": false,
  "versionPolicy": {
    "minSupportedAppVersion": "2.0.0",
    "latestAppVersion": "2.1.0",
    "upgradeRequired": false,
    "upgradeRecommended": true,
    "apkDownloadUrl": null,
    "releaseNotesUrl": null
  }
}
```

`decisionCode` values:

- `ALLOW`
- `ENROLLMENT_REQUIRED`
- `DEVICE_PENDING_APPROVAL`
- `DEVICE_DISABLED`
- `DEVICE_LOST`
- `DEVICE_MAINTENANCE`
- `DEVICE_DECOMMISSIONED`
- `APP_VERSION_UNSUPPORTED`
- `DEVICE_IDENTITY_CONFLICT`
- `ENROLLMENT_EXPIRED`
- `ENROLLMENT_USED`
- `ENROLLMENT_REVOKED`
- `ENROLLMENT_INVALID`

`requiredAction` values:

- `NONE`
- `ENROLL_DEVICE`
- `CONTACT_ADMIN`
- `CLEAR_LOCAL_SESSION`
- `CLEAR_LOCAL_DEVICE_AND_SESSION`
- `UPGRADE_APP`

## 5. `POST /pda/device/enroll`

### 5.1 Purpose

Activates a PDA using an administrator-issued enrollment code.

### 5.2 Users

Unauthenticated PDA App before first login.

### 5.3 Request

```json
{
  "enrollmentCode": "ENR-123456",
  "device": {
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
    }
  },
  "clientTime": "2026-05-16T10:00:00Z"
}
```

### 5.4 Success Response

```json
{
  "enrolled": true,
  "terminalDeviceId": "tdv_001",
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "deviceStatus": "ACTIVE",
  "decision": {
    "allowed": true,
    "decisionCode": "ALLOW",
    "deviceStatus": "ACTIVE",
    "presenceStatus": "UNKNOWN",
    "requiredAction": "NONE",
    "messageKey": null,
    "shouldClearLocalSession": false,
    "shouldClearLocalTerminalDeviceId": false,
    "versionPolicy": {
      "minSupportedAppVersion": "2.0.0",
      "latestAppVersion": "2.1.0",
      "upgradeRequired": false,
      "upgradeRecommended": true,
      "apkDownloadUrl": null,
      "releaseNotesUrl": null
    }
  },
  "serverTime": "2026-05-16T10:00:03Z"
}
```

### 5.5 Failure Response

```json
{
  "enrolled": false,
  "terminalDeviceId": null,
  "decision": {
    "allowed": false,
    "decisionCode": "ENROLLMENT_EXPIRED",
    "deviceStatus": null,
    "presenceStatus": "UNKNOWN",
    "requiredAction": "CONTACT_ADMIN",
    "messageKey": "pda.enrollment.expired",
    "shouldClearLocalSession": true,
    "shouldClearLocalTerminalDeviceId": false,
    "versionPolicy": null
  },
  "serverTime": "2026-05-16T10:00:03Z"
}
```

Rules:

- Enrollment code is single-use.
- PDA BFF must not decode tenant or device configuration from QR payload; it forwards the code to `terminal-device-service`.
- Identity conflict does not allow PDA-side self-recovery.

## 6. `GET /pda/session/bootstrap`

### 6.1 Purpose

Initializes PDA after session restore or login and returns account, session, access, device decision, version policy, workbench and server time.

### 6.2 Control Model

- Requires a valid PDA session.
- Request must carry `terminalDeviceId`.
- PDA BFF must call `terminal-device-service` for `DeviceAccessDecision(requestPurpose=BOOTSTRAP)`.

### 6.3 Response

```json
{
  "account": {
    "accountId": "acc_001",
    "tenantId": "tenant_001",
    "scopeLevel": "TENANT",
    "displayName": "Zhang San"
  },
  "session": {
    "sessionId": "sess_001",
    "terminal": "PDA",
    "terminalDeviceId": "tdv_001",
    "expiresAt": "2026-05-16T18:00:00Z",
    "idleTimeoutSeconds": 900
  },
  "access": {
    "roles": [],
    "actionCodes": []
  },
  "device": {
    "terminalDeviceId": "tdv_001",
    "terminalDeviceType": "PDA",
    "tenantId": "tenant_001",
    "displayName": "PDA-Warehouse-01",
    "deviceStatus": "ACTIVE"
  },
  "decision": {
    "allowed": true,
    "decisionCode": "ALLOW",
    "deviceStatus": "ACTIVE",
    "presenceStatus": "ONLINE",
    "requiredAction": "NONE",
    "messageKey": null,
    "shouldClearLocalSession": false,
    "shouldClearLocalTerminalDeviceId": false,
    "versionPolicy": {
      "minSupportedAppVersion": "2.0.0",
      "latestAppVersion": "2.1.0",
      "upgradeRequired": false,
      "upgradeRecommended": true,
      "apkDownloadUrl": null,
      "releaseNotesUrl": null
    }
  },
  "workbench": {
    "mode": "PDA_MANAGED_DEVICE",
    "enabledCards": ["SESSION", "DEVICE", "NETWORK", "SCAN", "LOGS"]
  },
  "serverTime": "2026-05-16T10:10:03Z"
}
```

Rules:

- If decision denies bootstrap, BFF may still return enough device status for a restricted page.
- BFF must not return WMS / MES business tasks in this contract.

## 7. `POST /pda/device/heartbeat`

### 7.1 Purpose

Records latest PDA runtime snapshot and returns device decision / policy.

### 7.2 Users

PDA App before or after login.

### 7.3 Request

```json
{
  "device": {
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
    }
  },
  "runtime": {
    "networkStatus": "ONLINE",
    "networkType": "WIFI",
    "batteryLevel": 72,
    "appState": "FOREGROUND"
  },
  "session": {
    "accountId": "acc_001",
    "tenantId": "tenant_001",
    "sessionId": "sess_001"
  },
  "clientTime": "2026-05-16T10:10:00Z"
}
```

`session` may be `null` before login.

### 7.4 Response

```json
{
  "accepted": true,
  "decision": {
    "allowed": true,
    "decisionCode": "ALLOW",
    "deviceStatus": "ACTIVE",
    "presenceStatus": "ONLINE",
    "requiredAction": "NONE",
    "messageKey": null,
    "shouldClearLocalSession": false,
    "shouldClearLocalTerminalDeviceId": false,
    "versionPolicy": {
      "minSupportedAppVersion": "2.0.0",
      "latestAppVersion": "2.1.0",
      "upgradeRequired": false,
      "upgradeRecommended": true,
      "apkDownloadUrl": null,
      "releaseNotesUrl": null
    }
  },
  "heartbeatIntervalSeconds": 300,
  "serverTime": "2026-05-16T10:10:03Z"
}
```

Rules:

- Heartbeat updates runtime snapshot only.
- Heartbeat does not change lifecycle status.
- `session` fields are diagnostic attachments, not login truth.
- If `shouldClearLocalSession = true`, PDA must clear local session through JS Bridge.
- If `shouldClearLocalTerminalDeviceId = true`, PDA must clear local terminal device binding and return to enrollment flow.

## 8. `POST /pda/device/logs`

### 8.1 Purpose

Uploads manually triggered PDA diagnostic logs under device governance.

### 8.2 Control Model

- May be accepted before login.
- Requires device metadata when available.
- Must consume `DeviceAccessDecision(requestPurpose=DIAGNOSTIC_LOG)`.
- Logs must not contain passwords, access tokens, refresh tokens, secrets, photo file content, or full business documents.

### 8.3 Response

```json
{
  "accepted": true,
  "logBatchId": "pda_log_batch_001",
  "decision": {
    "allowed": true,
    "decisionCode": "ALLOW",
    "deviceStatus": "ACTIVE",
    "presenceStatus": "ONLINE",
    "requiredAction": "NONE",
    "messageKey": null,
    "shouldClearLocalSession": false,
    "shouldClearLocalTerminalDeviceId": false,
    "versionPolicy": null
  },
  "serverTime": "2026-05-16T10:20:03Z"
}
```

## 9. Login Contract Impact

`POST /pda/auth/login` must be updated by the PDA auth contract to include:

- `terminalDeviceId`
- normalized device metadata

PDA BFF must:

1. call `terminal-device-service` for `DeviceAccessDecision(requestPurpose=LOGIN)`;
2. use `resolvedTenantId` from the decision;
3. call `auth-service` with `terminal=PDA` and `terminalDeviceId`;
4. never allow user-selected tenant for PDA login.

## 10. Explicitly Forbidden

- PDA BFF must not persist terminal device registry truth.
- PDA BFF must not copy lifecycle, version policy, identity conflict, or enrollment rules.
- PDA must not choose tenant during login after enrollment.
- Heartbeat must not be treated as current login truth.
- `lastReportedAccount` must not be named as current user.
