# party-service Contracts

## 1. 目的

本目录用于提供 `party-service` 的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- CRM、SRM、订单、合同、会计等未来业务服务

阅读目标：

- 理解 `party-service` 暴露了哪些能力
- 明确每个接口的请求 / 响应语义
- 明确上下文、权限、副作用与错误边界

这些文档不是 proto 副本。

当前稳定真相源仍然是：

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [ADR 0003](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)

涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；Party contract 只提供主体事实与租户主体引用能力。

当前 proto、generated client 与主服务源码采用 `party-service` / `party_service` 命名。

## 2. 模块划分

- [registration.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/registration.md)
  - 主体注册、租户绑定、停用等管理型写接口
- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/query.md)
  - 主体查询、候选搜索、标识解析与关系摘要查询
- [merge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/party-service/merge.md)
  - 主体受控合并接口与 merge 治理边界

说明：

- `merge.md` 已冻结第一阶段 `MergeParties` 黑盒语义。
- merge 审批流、unmerge、事件契约与更细的治理流程仍后置到 future collaboration / feature。
- `PartyOfficialAddress / TenantPartyAddress / TenantPartyContact` 的 owner 归属已在服务真相源冻结，但当前 contract 目录尚未补齐对应黑盒 API。

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 所有调用方都应将 `party-service` 视为 black box，而不是依赖其内部实现结构。
- 第一阶段业务域默认引用 `tenantPartyId`，而不是直接持有裸 `partyId` 作为业务主体主引用。
- `Tenant / OrgUnit / org tree / organizationPartyId` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；Party contract 只描述主体与租户主体引用能力。
- 当前调用链约束：
  - `identity-service`、`api-gateway` 已开始向 `party-service` 传递 `tenantId`、operator / trace metadata
  - 写接口的业务请求体仍以 `tenant_id` 等显式字段为准
- 当前 runtime truth：
  - `party-service` handler 会接收 gRPC metadata，但 phase-1 runtime 尚未在服务内落实 internal-service / operator / permission guard enforcement
  - 服务已初始化 OTEL，但 handler 级 trace metadata 使用与链路约束尚未冻结为可依赖的业务契约
  - phase-1 runtime 尚未在 `party-service` 内落实显式 audit event 持久化
- deferred enforcement：
  - internal-service / authenticated-operator / permission guard
  - handler 级 trace context enforcement
  - 审计事件落库、outbox 或统一 audit 集成

## 4. 与当前 proto 的对齐口径

- 当前 `party_service/party.proto` 已覆盖 registration、query、merge 三组第一阶段 RPC。
- 本目录优先冻结黑盒语义、上下文约束、错误边界与 owner 边界，不要求逐字段复写 proto。
- 若文档中出现宽于当前 proto 的 future 治理语义，应视为后续扩展方向，不能被调用方当作当前阶段已承诺字段。

## 5. 第一阶段最小 contract surface

截至当前，`party-service` phase-1 真正已承诺的最小 contract surface 以当前 proto/runtime 为准：

- registration / binding
  - `RegisterPersonParty`
  - `RegisterOrganizationParty`
  - `BindExistingPartyToTenant`
  - `DeactivateTenantParty`
- query
  - `GetPartyById`
  - `GetTenantPartyById`
  - `ResolvePartyByIdentifier`
  - `SearchPartyCandidates`
  - `ListPartyRelationships`
- merge
  - `MergeParties`

收口口径：

- 文档默认先 shrink 到当前 proto + runtime 已兑现的响应面、副作用与错误语义。
- 凡是宽于当前 runtime 的治理、审批、重定向、审计或更强 enforcement，都只以 deferred 标注，不能被调用方当作当前承诺。

当前不包含：

- customer / supplier / employee / contact 业务角色管理；其中 employee / employment 语义以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
- `PartyOfficialAddress / TenantPartyAddress / TenantPartyContact` 的正式 API surface
- org tree 或 org membership 管理；组织树本体以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准
- 完整主数据治理平台能力
- 自动外部工商 / 证照数据同步
- merge redirect、history traceability、downstream repair、unmerge 等完整治理链
- operator / permission / trace / audit 的完整运行时 enforcement
