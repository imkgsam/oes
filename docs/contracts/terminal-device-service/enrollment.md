# Terminal Device Service Enrollment Contract

> 服务设计唯一真相源：[terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)。本文只描述 enrollment 黑盒契约。

## 1. Purpose

Defines internal contract for administrator-issued terminal device enrollment.

Enrollment is a short-lived, single-use, revocable authorization to activate a real terminal device. It is not the device record itself.

## 2. Ownership

`terminal-device-service` owns:

- enrollment generation
- enrollment validation
- enrollment use
- enrollment expiration
- enrollment revocation
- enrollment audit facts

Admin BFF and PDA BFF consume this contract and must not persist enrollment truth.

## 3. Commands

Target service shape:

```proto
service TerminalDeviceEnrollmentService {
  rpc CreateEnrollment(CreateEnrollmentRequest) returns (CreateEnrollmentResponse);
  rpc ListEnrollments(ListEnrollmentsRequest) returns (ListEnrollmentsResponse);
  rpc RevokeEnrollment(RevokeEnrollmentRequest) returns (RevokeEnrollmentResponse);
  rpc ActivateEnrollment(ActivateEnrollmentRequest) returns (ActivateEnrollmentResponse);
}
```

## 4. CreateEnrollment

Request:

```json
{
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "expectedManufacturerSerial": "SEUIC-SN-123456",
  "expiresAt": "2026-05-17T10:00:00Z",
  "notes": "Issued for warehouse pilot"
}
```

Response:

```json
{
  "enrollmentId": "enr_001",
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "status": "ISSUED",
  "enrollmentCode": "ENR-123456",
  "expiresAt": "2026-05-17T10:00:00Z",
  "createdAt": "2026-05-16T10:00:00Z"
}
```

Rules:

- Phase 2 `terminalDeviceType` must be `PDA`.
- Enrollment is single-use.
- Raw code must not be stored as plaintext long term.
- Creation must write audit.

## 5. ActivateEnrollment

Request:

```json
{
  "enrollmentCode": "ENR-123456",
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

Response:

```json
{
  "activated": true,
  "terminalDeviceId": "tdv_001",
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "deviceStatus": "ACTIVE",
  "enrollmentId": "enr_001",
  "decisionCode": "ALLOW",
  "deviceCredential": "opaque-device-credential",
  "deviceCredentialExpiresAt": "2026-06-15T10:00:03Z",
  "deviceCredentialVersion": 1
}
```

Failure response:

```json
{
  "activated": false,
  "terminalDeviceId": null,
  "tenantId": null,
  "deviceStatus": null,
  "enrollmentId": null,
  "decisionCode": "ENROLLMENT_EXPIRED"
}
```

Rules:

- `ISSUED` and unexpired enrollment may be activated.
- `USED / EXPIRED / REVOKED` enrollment must be rejected.
- On success, create `TerminalDevice(status=ACTIVE)` and mark enrollment `USED`.
- Identity conflict must not auto-recover old devices.
- If expected serial is configured and mismatches, reject or require administrator handling.

## 6. RevokeEnrollment

Request:

```json
{
  "enrollmentId": "enr_001",
  "reason": "Issued by mistake"
}
```

Response:

```json
{
  "enrollmentId": "enr_001",
  "status": "REVOKED",
  "revokedAt": "2026-05-16T11:00:00Z",
  "revokedBy": "acc_admin"
}
```

Rules:

- `USED` enrollment cannot be revoked.
- `reason` is required.
- Revocation must write audit.

## 7. Enrollment Status

- `ISSUED`
- `USED`
- `EXPIRED`
- `REVOKED`

Expiration may be materialized by background job or evaluated lazily at validation time.

## 8. Trusted execution and wire compatibility freeze

| RPC | Mode | Principal / terminal | Exact Code |
| --- | --- | --- | --- |
| `CreateEnrollment` | BUSINESS | HUMAN / WEB | all `terminal-device.enrollment.create` |
| `ListEnrollments` | BUSINESS | HUMAN / WEB | all `terminal-device.read` |
| `RevokeEnrollment` | BUSINESS | HUMAN / WEB | all `terminal-device.enrollment.revoke` |
| `ActivateEnrollment` | INTERNAL | exact Gateway SYSTEM MACHINE | all `terminal-device.internal.gateway.enrollment.activate` |

所有 RPC 使用 `aud=urn:oes:service:terminal-device-service` 并拒绝 DELEGATED。前三个 Admin RPC 的 tenant、operator、org 与 trace 从 trusted execution context 派生；设备/enrollment target 必须在该 tenant 内。`ActivateEnrollment` 只接受准确 Gateway SPIFFE workload 的 certificate-bound ET，tenant 从 enrollment 解析，enrollment code 是一次性 activation credential，不是 principal 或 Permission grant。

Proto 删除并 reserve 下列 request 字段号与名称：

- `CreateEnrollmentRequest`: `tenant_id=1`, `operator_context=7`；保留 `terminal_device_type=2`, `display_name=3`, `expected_manufacturer_serial=4`, `expires_at=5`, `notes=6`。
- `ListEnrollmentsRequest`: `tenant_id=1`；保留 `terminal_device_type=2`, `status=3`, `pagination=4`。
- `RevokeEnrollmentRequest`: `tenant_id=1`, `operator_context=4`；保留 `enrollment_id=2`, `reason=3`。
- `ActivateEnrollmentRequest`: `trace_id=5`；保留 `enrollment_code=1`, `terminal_device_type=2`, `identity=3`, `software=4`。
- `OperatorContext` 成为 compatibility tombstone，reserve `1,2,3` 与 `operator_account_id`, `operator_org_id`, `trace_id`。

Activation 的 `identity=3` 改用只包含当前 wire `manufacturer_serial=1`, `android_id=2`, `app_installation_id=3`, `manufacturer=4`, `model=5` 的 input message；caller 不能提交服务端 projection 的 identity source、confidence 或 masked values。

`ActivateEnrollmentResponse` 保留现有 `1..7`，新增 `device_credential=8`, `device_credential_expires_at=9`, `device_credential_version=10`。成功事务原子创建 Device、保存 credential hash/ACTIVE 状态、消费 enrollment 并写安全审计；原始 credential 只返回一次，不进入持久化明文、日志或审计。Credential 默认最长 30 天；heartbeat 在剩余 7 天内原子轮换，新旧版本最多重叠 5 分钟。失败 response 不返回 credential。`DISABLED / LOST / MAINTENANCE` 暂停使用，`ACTIVE` restore 恢复；`DECOMMISSIONED` 与重新 enrollment 永久撤销。
