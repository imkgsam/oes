# Public Entry Service Contracts

> 服务设计唯一真相源：[public-entry-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/public-entry-service.md)。本目录只描述 `public-entry-service` 的黑盒契约，不重新定义服务长期职责、ShortLink / BusinessCard owner 边界或 target resolver 模型。

Phase 1 contracts:

- [shortlink-public-redirect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-public-redirect.md)
- [shortlink-admin-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-admin-management.md)
- [shortlink-target-resolver.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-target-resolver.md)
- [business-card-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-management.md)
- [business-card-self-view.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-self-view.md)
- [business-card-public-render.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-public-render.md)

## 3. Trusted gRPC 23-RPC Contract

本次 cutover 只改变当前 23 个 RPC 的内部信任来源，不增加业务能力或 Permission Code。所有 RPC 的 audience 固定为 `urn:oes:service:public-entry-service`：

| RPC | Mode / principal | Exact existing Code |
| --- | --- | --- |
| `CreateShortLink` | BUSINESS / HUMAN / WEB | `public-entry.short-link.create` |
| `GetShortLink` | BUSINESS / HUMAN / WEB | `public-entry.short-link.read` |
| `ListShortLinks` | BUSINESS / HUMAN / WEB | `public-entry.short-link.read` |
| `ListShortLinksByTarget` | BUSINESS / HUMAN / WEB | `public-entry.short-link.read` |
| `UpdateShortLinkTarget` | BUSINESS / HUMAN / WEB | `public-entry.short-link.update` |
| `UpdateShortLinkMetadata` | BUSINESS / HUMAN / WEB | `public-entry.short-link.update` |
| `ChangeShortLinkStatus` | BUSINESS / HUMAN / WEB | target-status-to-Code；见 §3.2 |
| `GetShortLinkStats` | BUSINESS / HUMAN / WEB | `public-entry.short-link.stats.read` |
| `GenerateShortLinkQr` | BUSINESS / HUMAN / WEB | `public-entry.short-link.read` |
| `ResolvePublicRedirect` | BUSINESS / GATEWAY SYSTEM MACHINE | `public-entry.short-link.read` |
| `EnsurePrimaryBusinessCard` | BUSINESS / HUMAN / WEB | `public-entry.business-card.manage` |
| `ListBusinessCards` | BUSINESS / HUMAN / WEB | `public-entry.business-card.read` |
| `GetBusinessCardDetail` | BUSINESS / HUMAN / WEB | `public-entry.business-card.read` |
| `UpdateBusinessCardConfig` | BUSINESS / HUMAN / WEB | `public-entry.business-card.manage` |
| `UpdateBusinessCardContactActions` | BUSINESS / HUMAN / WEB | `public-entry.business-card.manage` |
| `EnableBusinessCard` | BUSINESS / HUMAN / WEB | `public-entry.business-card.enable` |
| `DisableBusinessCard` | BUSINESS / HUMAN / WEB | `public-entry.business-card.disable` |
| `RunBusinessCardReadinessCheck` | BUSINESS / HUMAN / WEB | `public-entry.business-card.read` |
| `BindOrRefreshBusinessCardPublicEntry` | BUSINESS / HUMAN / WEB | `public-entry.business-card.public-entry.manage` |
| `GetBusinessCardVisitSummary` | BUSINESS / HUMAN / WEB | `public-entry.business-card.stats.read` |
| `GetOwnBusinessCardPreview` | SELF_SERVICE / HUMAN / WEB | empty set |
| `RenderPublicBusinessCard` | BUSINESS / GATEWAY SYSTEM MACHINE | `public-entry.business-card.read` |
| `GenerateBusinessCardVCard` | BUSINESS / GATEWAY SYSTEM MACHINE | `public-entry.business-card.read` |

### 3.1 Request authority deletion and reservation

Proto implementation must delete and reserve the following exact request fields/numbers. They are not supported payload after cutover：

- ShortLink admin：
  - `CreateShortLinkRequest`: `tenant_id=1`, `operator_context=8`
  - `GetShortLinkRequest`: `tenant_id=1`
  - `ListShortLinksRequest`: `tenant_id=1`
  - `ListShortLinksByTargetRequest`: `tenant_id=1`
  - `UpdateShortLinkTargetRequest`: `tenant_id=1`, `operator_context=5`
  - `UpdateShortLinkMetadataRequest`: `tenant_id=1`, `operator_context=8`
  - `ChangeShortLinkStatusRequest`: `tenant_id=1`, `operator_context=5`
  - `GetShortLinkStatsRequest`: `tenant_id=1`
  - `GenerateShortLinkQrRequest`: `tenant_id=1`
- ShortLink public：`ResolvePublicRedirectRequest.trace_id=6`。
- BusinessCard admin：
  - `EnsurePrimaryBusinessCardRequest`: `tenant_id=1`, `operator_context=3`
  - `ListBusinessCardsRequest`: `tenant_id=1`, `operator_context=4`
  - `GetBusinessCardDetailRequest`: `tenant_id=1`, `operator_context=3`
  - `UpdateBusinessCardConfigRequest`: `tenant_id=1`, `operator_context=5`
  - `UpdateBusinessCardContactActionsRequest`: `tenant_id=1`, `operator_context=5`
  - `EnableBusinessCardRequest`: `tenant_id=1`, `operator_context=3`
  - `DisableBusinessCardRequest`: `tenant_id=1`, `operator_context=3`
  - `RunBusinessCardReadinessCheckRequest`: `tenant_id=1`, `operator_context=3`
  - `BindOrRefreshBusinessCardPublicEntryRequest`: `tenant_id=1`, `operator_context=3`
  - `GetBusinessCardVisitSummaryRequest`: `tenant_id=1`, `operator_context=5`
- Self-view：`GetOwnBusinessCardPreviewRequest.tenant_id=1`、`account_id=2`、`trace_id=3`。
- Public render：`RenderPublicBusinessCardRequest.tenant_id=1`、`trace_id=3`；`GenerateBusinessCardVCardRequest.tenant_id=1`、`trace_id=3`。
- `OperatorContext` becomes a compatibility tombstone and reserves `operator_account_id=1`、`operator_org_id=2`、`trace_id=3`；这些名字与号码不得复用。

上述共 41 个 request authority fields：22 tenant、14 operator、4 trace、1 account。Response/record 中 service-owned `tenant_id` 投影、business target ids、pagination、config、ShortLink observation facts 保持现有号码和语义。`user_agent`、`ip_address`、`accept_language`、`referrer` 只是有界访问观测数据，不是身份或授权事实。

### 3.2 Status-to-Code and public ingress

- `ChangeShortLinkStatus.target_status=ACTIVE` requires exactly `public-entry.short-link.update`。
- `target_status=DISABLED` requires exactly `public-entry.short-link.disable`。
- `target_status=ARCHIVED` requires exactly `public-entry.short-link.archive`。
- Gateway 根据目标状态只申请准确 Code；Public Entry 在 mutation 前独立复核。`UNSPECIFIED`、未知状态、任意错误 Code 均 fail closed。
- 三个 public RPC 只允许准确 `api-gateway` SYSTEM MACHINE workload、mTLS leaf/`cnf` 与目标 audience。它们没有 HUMAN session，不接收虚构 tenant；owner 根据 `short_code` 或 `business_card_id` 查找自身记录并执行公开状态检查。
- `GetOwnBusinessCardPreview` 从 verified HUMAN `sub`、tenant 和 Identity binding 推导本人 employee/card，拒绝任意 caller-selected account/employee/card 和 DELEGATED。
- Tenant、org、operator、request/trace/audit 都来自 verified execution context。Body、ordinary metadata、legacy internal metadata 和 signed operator fallback 不具有 authority。
- 12 个现有 canonical Codes 保持不变；本次不授予 Permission catalog/generator writer ownership。

### 3.3 Scope preservation

- 当前 23 个 RPC 的业务规则、public generic error、readiness、VisitEvent、audit、idempotency、persistence 与 response shape 不变。
- 本次不修改 HR、Identity、Permission、TenantOrg target contracts/runtime；Public Entry outbound edges 在各 target service 自己 cutover 时按依赖顺序迁移。
- `business-card-live-smoke.ts` 不再作为无 Token raw gRPC production-like caller。管理/self flow 应经已认证 Gateway HTTP fixture，三个公开 flow 经匿名 Gateway HTTP；controller/security focused tests 覆盖无 HTTP surface 的内部断言。
Contract boundary:

- Public redirect is anonymous and externally reachable.
- Admin management requires authenticated tenant/operator context and permission-service authorization at caller boundary.
- Target resolver is an internal module contract in Phase 1, not a public HTTP contract.
- ShortLink only redirects; target owners render their own public pages.
- BusinessCard contracts only describe BusinessCard configuration, public view assembly, Contact Action references and vCard output rules; they do not own employee, contact asset, login, ShortLink, CRM or tenant truth.
