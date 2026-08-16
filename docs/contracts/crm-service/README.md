# crm-service Contracts

> `crm-service` 的服务职责、核心对象、owner 边界与长期命名以 [crm-service.md](../../architecture/services/crm-service.md) 为唯一稳定真相源。本目录只描述当前 CRM v2 P1 黑盒契约，不重新定义服务内部设计。

## 1. Current Surface

当前 proto 恰好包含 15 个 RPC / 3 个 service：

- [customer-query.md](./customer-query.md)：`CustomerQueryService`，4 个 RPC。
- [customer-management.md](./customer-management.md)：`CustomerManagementService`，10 个 RPC。
- [object-reference.md](./object-reference.md)：`CrmObjectReferenceService`，1 个 RPC。

旧 customer-master `SearchSelectableCustomers / CustomerPartyBinding / CustomerContact / CustomerAddress` 契约已被 CRM v2 P1 原地替代，不再是当前 proto 或实现依据。

## 2. Trusted Execution Baseline

- 14 个 customer query/management RPC 是 `BUSINESS / HUMAN`，只接受 Gateway dedicated CRM mTLS client。
- `ValidateCrmObjectReference` 是 `INTERNAL / HUMAN_OBO`，只接受 `collaboration-service` actor/workload。
- audience 固定为 `urn:oes:service:crm-service`。
- 所有 RPC 要求 certificate-bound ET、准确 Permission Code、准确 terminal allowlist 与 fail-closed admission。
- 声明层只存在非空 `sessionTerminals` 数组；不提供单值 `sessionTerminal` 字段或兼容 fallback。
- request body、ordinary metadata、legacy operator context、requestId/traceId fallback 不建立 tenant、org、operator、trace、audit、owner 或权限 authority。
- CRM→Party 已集成的 MACHINE_ROOT 调用保持独立；它不允许调用 CRM inbound HUMAN RPC。

Gateway 的 HTTP `RequirePermissions` 是入口检查；CRM 仍独立验证 ET 与 CRM-owned resource facts。AI、ActionGrant、DELEGATED、background-without-user 与外部直接 gRPC 均未开放。

## 3. Wire Reservations

15 个 request message 删除并 reserve 55 个标准 authority 字段：15 个 `tenant_id`、15 个 `operator_context`、15 个 `trace_context` 与 10 个 `audit_context`。legacy `OperatorContext / TraceContext / AuditContext` 再 reserve 8 个 nested 字段。

另外 reserve：

- `CreateLeadRequest.owner_account_id=15`
- `CreateLeadRequest.claim_for_current_user=26`
- `SubmitDraftLeadRequest.claim_for_current_user=7`
- `ConvertLeadToProspectCustomerRequest.allow_ownerless_conversion=6`

合计 67 个 tombstone。现有业务字段编号、response tenant/owner/created-by 投影、profile items、source evidence、duplicate result 与 Party conversion result 保持不变。

## 4. Stable Links

- [crm-service.md](../../architecture/services/crm-service.md)
- [ADR 0015](../../adr/0015-workload-identity-and-execution-token.md)
- [collaboration-service.md](../../architecture/services/collaboration-service.md)
- [party-service.md](../../architecture/services/party-service.md)
- [trusted-grpc-execution-context.md](../../plans/features/trusted-grpc-execution-context.md)
