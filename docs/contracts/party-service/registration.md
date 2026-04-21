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
- 必要 guard：
  - internal service
  - authenticated operator
  - permission guard

## 2. 通用上下文要求

所有管理接口都要求：

- internal service 调用上下文
- `tenant_id`
- operator context
- trace context
- 审计元数据

当前设计要求调用方显式携带：

- `tenantId`
- `operatorId`
- 如场景适用则携带 `orgId`
- request trace / correlation metadata

所有管理型写接口都必须产生可审计副作用。

## 3. 注册自然人主体

### `RegisterPersonParty`

- 作用：在当前租户语境下注册自然人主体，并为该租户创建 `TenantParty`
- 请求关键字段：
  - `tenant_id`
  - `canonical_name`
  - `identifiers[]`
  - optional `local_display_name`
  - optional `local_code`
- 关键语义：
  - 服务应先执行 identifier 强匹配与候选查重
  - 若强匹配命中，可拒绝直接新建并引导调用方改走绑定流程，或按后续实现约定直接返回已存在主体并创建 `TenantParty`
  - 当前契约不允许调用方绕过查重显式声明“强制新建 canonical party”
- 响应关键字段：
  - `party`
  - `tenant_party`
  - `match_result`
- 主要副作用：
  - 创建 `Party`
  - 创建 `PersonParty`
  - 创建 `PartyIdentifier`
  - 创建 `TenantParty`

## 4. 注册组织主体

### `RegisterOrganizationParty`

- 作用：在当前租户语境下注册组织主体，并为该租户创建 `TenantParty`
- 请求关键字段：
  - `tenant_id`
  - `canonical_name`
  - `registered_country`
  - `identifiers[]`
  - optional `local_display_name`
  - optional `local_code`
- 关键语义：
  - 与 `RegisterPersonParty` 相同，必须先执行 identifier 强匹配与候选查重
  - 组织主体的名字不是全局唯一键，不能只按名称判断是否为同一主体
- 响应关键字段：
  - `party`
  - `tenant_party`
  - `match_result`
- 主要副作用：
  - 创建 `Party`
  - 创建 `OrganizationParty`
  - 创建 `PartyIdentifier`
  - 创建 `TenantParty`

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
  - `status`
- 主要副作用：
  - `TenantParty.status` 从 active 类状态切换到 inactive 类状态
  - 记录审计事件

## 7. 主要错误语义

调用方应重点关注这几类失败：

- validation failure
  - 请求字段缺失、格式非法、标识类型不合法
- permission denied
  - operator 不具备注册、绑定或停用主体的权限
- duplicate binding
  - 当前租户已绑定相同 `partyId`
- strong-match-conflict
  - identifier 强匹配命中已存在主体，但调用方请求语义仍试图直接创建新主体
- cross-tenant misuse
  - 调用方试图使用不属于当前租户语境的绑定对象
- domain errors
  - 例如主体不存在、主体已停用、标识冲突、状态不允许变更

## 8. 幂等性与副作用提示

- `RegisterPersonParty` 与 `RegisterOrganizationParty` 都有明确副作用，不是幂等查询接口。
- `BindExistingPartyToTenant` 对同一 `tenantId + partyId` 组合应提供稳定的重复调用语义；具体是返回现有绑定还是抛 duplicate binding，由实现契约进一步冻结，但不得创建重复有效绑定。
- `DeactivateTenantParty` 不是删除接口；调用方不得把停用当成清理历史引用的替代方案。
