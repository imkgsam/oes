# hr-service Management API

## 1. 模块职责

`HrManagementService` 负责 minimum 第一阶段的员工与任职管理写接口。

截至 2026-05-05，runtime 已支持通过 `CreateEmployeeOnboarding` 为首租户管理员建立 HR 员工、首条任职与默认账号访问接入；本次文档收口不重跑 Jest / Vitest。

## 2. 通用上下文要求

当前 runtime 已落地的管理接口上下文校验为：

- 所有 management gRPC 写接口必须在 metadata 中携带 `operator-id`
- 所有 management gRPC 写接口必须在 metadata 中携带 `trace-id`
- 带有 `tenant_id` 请求字段的 command 必须提供非空 `tenant_id`，并由 application 层用于租户内 Employee / Employment 校验

当前 runtime 尚未强制以下更强保证，调用方不得把它们视为已由 `hr-service` contract 保证：

- 独立的 internal service 凭证 / 调用方身份 gate
- 除 `operator-id` 之外的完整 operator context 结构
- metadata 级 `tenant_id`
- 结构化审计元数据持久化

若后续需要将 internal service gate、完整 operator context、metadata tenant 或审计元数据升级为强 contract，应先补充架构 / ADR 或 contract 决策，再修改 runtime 与测试。

## 3. 最小写接口

### `CreateEmployeeOnboarding`

- 作用：通过 HR-owned saga 建立或复用员工相关主体、员工主档、首条任职，并在需要时完成账号绑定与 `account.basic` 默认访问接入。
- 请求关键字段：
  - `tenant_id`
  - `idempotency_key`
  - `person.legal_name`
  - optional `person.existing_party_id`
  - optional `person.existing_tenant_party_id`
  - optional `person.identifiers[]`
  - optional `primary_employment.org_unit_id`
  - optional `primary_employment.effective_from`
  - optional `primary_employment.position_name`
  - optional `create_account`
  - optional `existing_account_id`
  - optional `employee_code`
- 响应关键字段：
  - `employee`
  - optional `employment`
  - optional `access`
- 关键语义：
  - Employee / Employment 真相只属于 `hr-service`。
  - PersonParty / TenantParty 真相仍属于 `party-service`，HR 只通过显式端口建立或复用引用。
  - Account 真相仍属于 `identity-service`，角色 / grant 真相仍属于 `permission-service`。
  - 当请求同时提供账号接入与首条任职时，HR onboarding access 段负责通过 permission 边界完成 `account.basic` 默认 grant。
  - 下游账号绑定或权限 grant 失败时，不回滚已成立的 Party / Employee / Employment 真相；失败接入段应可查询、可重试。

### `CreateEmployee`

- 作用：基于已存在的 `tenantPartyId / partyId` 建立员工主档
- 请求关键字段：
  - `tenant_id`
  - `tenant_party_id`
  - optional `party_id`
  - `employee_code`
- 关键语义：
  - `employeeId` 必须独立生成
  - 同一 `tenantId + tenantPartyId` 在第一阶段只能对应一个正式 Employee
  - `party_id` 如存在，只用于完整性校验，不构成第二 owner
  - 新建 Employee 初始 `lifecycleStatus=PREBOARDING`

### `CreateEmployment`

- 作用：为员工建立正式任职记录
- 请求关键字段：
  - `tenant_id`
  - `employee_id`
  - `org_unit_id`
  - `effective_from`
- 关键语义：
  - `org_unit_id` 必须引用已校验的 `OrgUnit`
  - 第一阶段同一员工最多只有一条当前 `ACTIVE` employment
  - 第一阶段只支持立即生效任职；`effective_from` 不得晚于命令 accepted time
  - 创建成功后 `Employment.status=ACTIVE`
  - 若 Employee 当前为 `PREBOARDING`，创建第一条 active employment 后进入 `ACTIVE`

### `EndEmployment`

- 作用：结束一条 active employment
- 请求关键字段：
  - `employment_id`
  - `effective_to`
  - optional `ended_reason`
- 关键语义：
  - 当前 proto / runtime 不接受独立 `tenant_id` 字段；租户边界来自 `employment_id` 对应的既有 HR 记录
  - 仅允许结束当前 `ACTIVE` employment
  - `effective_to` 不得早于该 employment 的 `effective_from`
  - 结束后该 employment 进入 `ENDED`
  - 若员工没有继任 active employment，Employee 进入 `OFFBOARDED`

### `ChangePrimaryEmployment`

- 作用：通过“结束旧 employment + 建立新 employment”的受控语义完成调岗
- 请求关键字段：
  - `tenant_id`
  - `employee_id`
  - `from_employment_id`
  - `to_org_unit_id`
  - `effective_from`
  - optional `ended_reason`
- 关键语义：
  - 这是 minimum 第一阶段唯一允许的调岗 command
  - 必须在 `hr-service` 本地事务内原子完成
  - 校验 `from_employment_id` 是该 employee 当前唯一 `ACTIVE` employment
  - 校验 `to_org_unit_id` 属于同一 tenant 且是有效 `OrgUnit`
  - 成功后旧 employment 进入 `ENDED`，新 employment 进入 `ACTIVE`
  - Employee 保持 `ACTIVE`
  - 任一校验失败时不得产生部分变更
  - 不允许原地篡改既有 employment 的正式 `org_unit_id`

## 4. onboarding owner 语义

- minimum 第一阶段由 `hr-service application orchestration` 拥有 onboarding 业务结果。
- `party-service` 只负责 `PersonParty / TenantParty`。
- `identity-service` 负责 account binding。
- `permission-service` 负责角色 / grant。
- 后段失败不得回滚前段已成立的 `Party / Employee / Employment` 真相。
- 若 account binding 或 permission grant 失败，`hr-service` 应返回并持有可重试的 onboarding 接入段状态。
- grant 失败后，已创建 / 已绑定 account 不得成为可登录且具备业务访问能力的 active account，直到 grant 重试成功。

## 5. 主要错误语义

- validation failure
  - 请求字段缺失、非法状态转换
- duplicate employee
  - 同一 `tenantId + tenantPartyId` 已存在正式员工主档
- invalid org reference
  - `org_unit_id` 无效或不属于目标 tenant
- active employment conflict
  - 已存在 active employment，且当前命令不允许并存
- invalid status transition
  - 例如结束非 active employment、创建 future-dated minimum employment、调岗 source employment 不匹配

## 6. 明确禁止

- 不允许把 `accountId` 当作 `Employee` 主键或正式上游主引用
- 不允许通过 HR 直接写账号、角色、权限真相
- 不允许通过 legacy account-org membership 接口建立正式 employee 归属
