# BusinessCard Employee Self-View Contract

> 服务设计唯一真相源：[public-entry-service.md](../../architecture/services/public-entry-service.md)。本文只描述员工本人查看自己数字名片的 Phase 1 黑盒契约，不重新定义 BusinessCard、Identity Contact Asset、HR 或 Permission owner 边界。

## 1. Purpose

Defines the Phase 1 authenticated self-view contract for employees to view their own digital business card preview and public entry.

It answers:

```text
员工本人如何查看自己的名片状态、预览、public URL、主二维码和当前展示动作？
```

## 2. Boundary

Employee self-view allows:

- View own card status.
- View own public URL and QR content.
- View own public preview.
- View currently enabled and displayable actions.

Employee self-view does not allow:

- Edit card configuration.
- Enable / disable card.
- Change Contact Actions.
- Change Contact Asset.
- View visit statistics.
- View admin readiness diagnostics beyond a simple status.

## 3. Control Model

Current gRPC mode is `SELF_SERVICE / HUMAN / WEB` with an empty Code set and `allowDelegated=false`. `tenant_id=1`、`account_id=2`、`trace_id=3` are deleted and reserved. The JSON below is `LEGACY_PRE_CUTOVER` only for those three authority properties; current Public Entry derives tenant/account from verified HUMAN claims and the employee/card target from the controlled Identity binding.

Legacy pre-cutover self-view envelope:

```json
{
  "tenantId": "tenant_001",
  "accountId": "acc_employee",
  "employeeId": "emp_001",
  "traceId": "trace_self_001"
}
```

Rules:

- Target employee must be derived from the current account / employee binding.
- Request must not accept arbitrary `employeeId` or `businessCardId` as a way to view another employee's card.
- Employee self-view does not require `public-entry.business-card.self.read` in Phase 1.
- Self-view is an authenticated self-bound capability:
  - authenticated tenant account
  - account enabled / valid session
  - identity-service `UserAccount <-> Employee` binding
  - target employee/card derived by the server from current account context
  - card belongs to the same tenant
- BFF may assemble session and account context, but BusinessCard application must re-derive or verify the target through identity-service binding or controlled account context.
- Permission-service generic self-scope is not required for Phase 1. A future tenant policy to disable employee self-view should be treated as a permission / self-service policy open issue.

## 4. GetMyBusinessCard

Purpose:

- Return the current user's own BusinessCard view summary.

Request (`LEGACY_PRE_CUTOVER`; current wire request has no authority fields):

```json
{
  "tenantId": "tenant_001",
  "accountId": "acc_employee",
  "traceId": "trace_self_get_001"
}
```

Response:

```json
{
  "card": {
    "businessCardId": "card_001",
    "status": "ACTIVE",
    "publicEntryRef": {
      "publicEntryId": "sl_001",
      "shortCode": "CF26ZS1",
      "publicUrl": "https://go.oes.com/c/CF26ZS1",
      "qrContent": "https://go.oes.com/c/CF26ZS1",
      "status": "ACTIVE",
      "expiresAt": null
    },
    "preview": {
      "displayName": "Zhang San",
      "englishDisplayName": "San Zhang",
      "title": "Sales Manager",
      "companyDisplayName": "OES Demo Company",
      "departmentName": "Sales",
      "officialPhotoUrl": "https://assets.example.com/photo.jpg",
      "actions": [
        {
          "contactActionType": "CALL_PHONE",
          "displayable": true,
          "includeInVCard": true
        }
      ],
      "vCardAvailable": true
    }
  }
}
```

Rules:

- Preview may include resolved public display values because it is a rendered view, not stored BusinessCard truth.
- Contact values may be shown only if they are displayable in the public card view.
- Self-view must not expose hidden Contact Asset values.
- Visit summary is not returned in Phase 1.

## 5. Unavailable Self-View

If no card exists:

```json
{
  "card": null,
  "status": "NOT_CREATED"
}
```

If card exists but not public:

```json
{
  "card": {
    "businessCardId": "card_001",
    "status": "DISABLED",
    "publicEntryRef": null,
    "preview": null
  },
  "status": "NOT_PUBLIC"
}
```

Rules:

- Self-view may show coarse status.
- Detailed readiness reasons remain admin-only in Phase 1.

## 6. Error Semantics

| Condition | Error |
| --- | --- |
| no authenticated account context | `UNAUTHENTICATED` |
| no employee binding for current account | `EMPLOYEE_BINDING_NOT_FOUND` |
| account does not belong to tenant | `FORBIDDEN` |
| upstream identity / HR unavailable | `UPSTREAM_UNAVAILABLE` |

Rules:

- Self-view must not become a user discovery API.
- Caller cannot supply arbitrary target identity.
