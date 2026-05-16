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
  "tenantId": "tenant_001",
  "terminalDeviceType": "PDA",
  "displayName": "PDA-Warehouse-01",
  "expectedManufacturerSerial": "SEUIC-SN-123456",
  "expiresAt": "2026-05-17T10:00:00Z",
  "notes": "Issued for warehouse pilot",
  "operatorContext": {
    "operatorAccountId": "acc_admin",
    "operatorOrgId": null,
    "traceId": "trace_001"
  }
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
  },
  "traceId": "trace_002"
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
  "decisionCode": "ALLOW"
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
  "tenantId": "tenant_001",
  "enrollmentId": "enr_001",
  "reason": "Issued by mistake",
  "operatorContext": {
    "operatorAccountId": "acc_admin",
    "traceId": "trace_003"
  }
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
