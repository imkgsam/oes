# Terminal Device Service DeviceAccessDecision Contract

> 服务设计唯一真相源：[terminal-device-service.md](../../architecture/services/terminal-device-service.md)。本文只描述设备准入判定 contract。

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
  "deviceCredential": "opaque-device-credential"
}
```

The supported post-cutover request carries no tenant authority or session/trace authority. The service always resolves tenant from the registered `terminalDeviceId`; trusted trace facts come from transport context.

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

## 11. Trusted execution and device proof freeze

`ResolveDeviceAccessDecision` 是 `INTERNAL`，只接受准确 Gateway SYSTEM Machine Principal、Gateway SPIFFE workload、certificate-bound `aud=urn:oes:service:terminal-device-service` ET 与 all `terminal-device.internal.gateway.access.resolve`。HUMAN、TENANT MACHINE、DELEGATED、其他 workload、错误 audience/Code/`cnf` 均在进入应用逻辑前拒绝。

LOGIN、BOOTSTRAP、HEARTBEAT 与 DIAGNOSTIC_LOG purpose 共用这一稳定 INTERNAL 模式；即使 BOOTSTRAP 已有 PDA HUMAN session，也不把本 RPC 切换成 HUMAN。当前 HUMAN session 只由 Gateway/Auth 的其他链路使用，不能通过本请求建立 Terminal Device authority。

`ResolveDeviceAccessDecisionRequest` 删除并 reserve `tenant_id=1`, `session=7`, `trace_id=8`，保留 `terminal_device_id=2`, `terminal_device_type=3`, `request_purpose=4`, `app_version=5`, `identity=6`，新增 `device_credential=9`。Terminal Device 从现有 device registry 解析 tenant；identity 使用只包含 wire `1..5` 的 device-signal input message，不能建立 principal。Credential 必须与 terminalDeviceId、当前 appInstallationId、ACTIVE credential state 与未过期 `credentialVersion` 匹配；旧版本只在轮换后的最多 5 分钟重叠窗口接受。

Credential 不匹配、缺失或永久撤销统一返回安全 device-proof denial，不泄露“device 是否存在”“哪个 signal 接近匹配”或 hash 状态。生命周期/版本/identity conflict decision 只在 credential 验证成功后执行；`DECOMMISSIONED` 可返回清理本地 device/session 的安全收敛结果，但不恢复 credential。
