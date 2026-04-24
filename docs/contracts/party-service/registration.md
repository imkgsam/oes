# party-service Registration And Binding API

## 1. 模块职责

`PartyRegistrationService` 负责主体注册、租户绑定、主体停用等管理型写接口。

第一阶段适用场景：

- 租户注册新的自然人主体
- 租户注册新的组织主体
- 租户绑定已存在主体
- 租户停用自己的 `TenantParty`
- 未来扩展主体级停用能力时，提供受控管理入口

调用约束：

- 接口类型：内部服务接口
- 服务：`PartyRegistrationService`
- 调用方：内部服务
- 当前 runtime truth：
  - phase-1 runtime 尚未在 `party-service` 内落实 internal-service / authenticated-operator / permission guard enforcement
  - 调用方仍应按 architecture 要求继续传递 operator / trace metadata；更强 enforcement deferred

## 2. 通用上下文要求

当前请求面中真正落在 proto / runtime 上的显式上下文主要是：

- `tenantId`

当前调用链已经开始由上游传递但尚未在 `party-service` handler 内强制使用的是：

- `operatorId`
- 如场景适用则携带 `orgId`
- request trace / correlation metadata

deferred enforcement：

- operator context mandatory enforcement
- permission guard
- audit event persistence / replay chain

## 3. 注册自然人主体

### `RegisterPersonParty`

- 作用：注册自然人主体；当提供 `tenant_id` 时同时为该租户创建 `TenantParty`，未提供时只创建 canonical `Party`
- 请求关键字段：
  - `canonical_name`
  - optional `identifiers[]`
  - optional `tenant_id`
  - optional `local_display_name`
  - optional `local_code`
- 关键语义：
  - phase-1 当前只冻结 identifier `strong-match reuse`
  - 当 `identifiers[]` 提供且命中 strong match 时，runtime 直接复用已存在 `party`，并在提供 `tenant_id` 时创建 `TenantParty`
  - 当未命中 strong match 时，runtime 直接创建新的 canonical `Party`
  - 当前 runtime 允许空 `identifiers[]`；此时不会发生 identifier strong-match reuse
  - 候选查重、create-reject / preflight flow、人工确认复用流程当前未落地，统一 deferred
  - 当前契约不允许调用方绕过查重显式声明“强制新建 canonical party”
- 响应关键字段：
  - `party`
  - optional `tenant_party`
  - `match_result`
- 当前 `match_result` 只冻结：
  - `CREATED`
  - `STRONG_MATCH_REUSED`
- 主要副作用：
  - 创建 `Party`
  - 创建 `PersonParty`
  - 创建 `PartyIdentifier`
  - 在提供 `tenant_id` 时创建 `TenantParty`

## 4. 注册组织主体

### `RegisterOrganizationParty`

- 作用：注册组织主体；当提供 `tenant_id` 时同时为该租户创建 `TenantParty`，未提供时只创建 canonical `Party`
- 请求关键字段：
  - `canonical_name`
  - `registered_country`
  - optional `identifiers[]`
  - optional `tenant_id`
  - optional `local_display_name`
  - optional `local_code`
- 关键语义：
  - 与 `RegisterPersonParty` 相同，phase-1 当前只冻结 identifier `strong-match reuse`
  - strong match 命中时，runtime 直接复用已存在 `party`，并在提供 `tenant_id` 时创建 `TenantParty`
  - 未命中 strong match 时，runtime 直接创建新的 canonical `Party`
  - 当前 runtime 允许空 `identifiers[]`
  - 候选查重、create-reject / preflight flow、人工确认复用流程当前未落地，统一 deferred
  - 组织主体的名字不是全局唯一键，不能只按名称判断是否为同一主体
- 响应关键字段：
  - `party`
  - optional `tenant_party`
  - `match_result`
- 当前 `match_result` 只冻结：
  - `CREATED`
  - `STRONG_MATCH_REUSED`
- 主要副作用：
  - 创建 `Party`
  - 创建 `OrganizationParty`
  - 创建 `PartyIdentifier`
  - 在提供 `tenant_id` 时创建 `TenantParty`

## 5. 绑定已有主体到租户

### `BindExistingPartyToTenant`

- 作用：将已存在的 canonical `Party` 绑定到当前租户，创建 `TenantParty`
- 请求关键字段：
  - `tenant_id`
  - `party_id`
  - optional `local_display_name`
  - optional `local_code`
  - optional `tags[]`
- 关键语义：
  - 同一租户对同一 `partyId` 只能存在一条有效 `TenantParty`
  - 该接口不创建新的 canonical `Party`
- 当前 runtime 命中重复绑定时直接返回 conflict，不提供“返回现有绑定”的幂等结果
- 响应关键字段：
  - `tenant_party`
  - `party`
- 主要副作用：
  - 创建 `TenantParty`

## 6. 停用租户主体

### `DeactivateTenantParty`

- 作用：停用某租户下的 `TenantParty`
- 请求关键字段：
  - `tenant_id`
  - `tenant_party_id`
  - optional `reason`
- 关键语义：
  - 第一阶段默认是停用，不是物理删除
  - 若该 `TenantParty` 已被业务域引用，调用方应依赖下游业务规则决定是否允许停用或仅允许标记为 inactive
- 响应关键字段：
  - `tenant_party`
- 主要副作用：
  - `TenantParty.status` 从 active 类状态切换到 inactive 类状态
  - 当前 runtime 不包含显式 audit event 落库；审计要求 deferred

## 7. 主要错误语义

调用方应重点关注这几类失败：

- validation failure
  - 当前 runtime 明确校验的是注册接口中的 `canonical_name` 不能为空
- duplicate binding
  - `BindExistingPartyToTenant` 命中相同 `tenant_id + party_id`
- not found
  - `BindExistingPartyToTenant` 中的 `party_id` 不存在
  - `DeactivateTenantParty` 中的 `tenant_party_id` 不存在

以下语义当前不要写成已承诺：

- permission denied
- strong-match-conflict create-reject flow
- candidate-review / manual-approval flow
- 完整 cross-tenant misuse guard enforcement
- 标识格式、标识类型或更细状态转换校验

## 8. 幂等性与副作用提示

- `RegisterPersonParty` 与 `RegisterOrganizationParty` 都有明确副作用，不是幂等查询接口。
- `BindExistingPartyToTenant` 对同一 `tenantId + partyId` 组合当前直接抛 `duplicate binding`，不返回现有绑定。
- `DeactivateTenantParty` 不是删除接口；调用方不得把停用当成清理历史引用的替代方案。
