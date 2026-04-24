# party-service Design

## 1. 目标

- 收敛 `party-service` 的完整服务设计，明确 Party、TenantParty、PartyIdentifier 与主体关系边界。
- 明确员工 onboarding 中 `party-service` 的职责：创建或复用自然人主体，并提供 `hr-service` 可引用的主体事实。
- 为后续独立 thread 推进 party-service feature packet 与实现提供恢复入口。

## 2. 当前范围

- 本 workspace 负责：
  - `Party(Person / Organization)`
  - `TenantParty`
  - `PartyIdentifier`
  - 稳定主体关系
  - 员工、客户、供应商等上下文引用 party 的边界
  - 员工 onboarding 中自然人主体创建 / 复用流程
- 本 workspace 不负责：
  - 员工任职
  - 租户组织树
  - 账号认证、会话、token
  - 角色与权限
  - CRM / SRM / HR 等业务角色语义

## 3. 涉及对象

- services:
  - `party-service`
  - `hr-service`
  - `identity-service`
  - `tenant-org-service`
  - CRM / SRM / order / contract / finance 等 future consumers
- frontend areas:
  - 员工创建
  - 主体查重 / 复用
  - 客户 / 供应商 / 员工主体引用

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-22 | `party-service` 拥有自然人 / 组织主体主数据。 | Party owner | `docs/architecture/services/party-service.md` |
| 2026-04-22 | `hr-service` 创建 Employee 前必须创建或复用 `Party(Person)` 与 `TenantParty`。 | employee onboarding | `party-service` / `hr-service` contracts |
| 2026-04-22 | 业务域优先引用 `tenantPartyId`，不复制主体主数据。 | CRM / SRM / HR / identity 协同 | contracts |
| 2026-04-22 | `party-service` 不承接员工、客户、供应商等业务角色语义。 | bounded context | services 职责卡 |

## 5. 核心职责

### 5.1 Party

- 表达跨业务上下文可复用的自然人或组织主体。
- 维护主体基础事实。
- 不表达员工、客户、供应商等业务角色。

### 5.2 TenantParty

- 表达某个 tenant 对主体的拥有或受控引用关系。
- 为 HR、CRM、SRM、订单、合同、会计等上下文提供租户内主体引用。
- 第一阶段业务单据优先引用 `tenantPartyId`。

### 5.3 PartyIdentifier

- 表达证件号、税号、注册号、护照号等稳定标识。
- 支撑查重、候选匹配、合并治理。

### 5.4 PartyRelationship

- 只表达少量稳定主体关系，例如母子公司、分支机构、法定代表人等。
- 不承接 CRM 联系人关系、HR 任职关系或供应商联系人关系。

## 6. 关键使用场景

### 6.1 员工创建前创建或复用自然人主体

- 员工创建页面收集自然人基础信息。
- BFF 或应用服务先调用 `party-service` 创建 / 复用 `Party(Person)`。
- `party-service` 创建 / 复用该 tenant 下的 `TenantParty`。
- `hr-service` 使用 `partyId / tenantPartyId` 创建 Employee。
- HR 不复制真实姓名、证件、法定主体标识等主体主数据。

### 6.2 员工创建且允许登录

- `party-service` 只负责主体创建 / 复用。
- `hr-service` 负责 Employee / Employment。
- `identity-service` 负责 account。
- `permission-service` 负责初始角色。
- 角色或账号步骤失败不得反向修改 Party 真相。

### 6.3 主体查重与复用

- 创建员工、客户、供应商前可先按标识或关键信息查询候选 party。
- 用户确认复用后创建新的 `TenantParty` 或绑定已有 `TenantParty`。
- 合并、停用、租户绑定停用必须可审计。

## 7. 协同契约待冻结

- `FindPartyCandidates`
  - 按证件、税号、手机号、邮箱或名称候选匹配。
- `CreatePersonParty`
  - 创建自然人主体。
- `CreateTenantParty`
  - 为 tenant 创建主体引用。
- `GetTenantPartySummary`
  - 给 HR / CRM / SRM / BFF 展示主体摘要。
- `DisableTenantParty`
  - 停用 tenant 内主体引用。

具体接口名后续可按 service contract 规范调整。

## 8. 明确不做

- 不维护 Employee / Employment。
- 不维护组织树、组织归属或 org scope。
- 不维护 User / Account / Session。
- 不维护角色、权限、policy。
- 不替代 CRM / SRM / HR 的业务角色模型。

## 9. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-22 | 员工创建时是否强制先做 party 候选查重，还是允许直接创建后治理？ | 影响前端流程、数据质量和 onboarding 复杂度。 | 设计 employee onboarding flow。 |
| 2026-04-22 | `TenantParty` 创建由 `party-service` 自己完成，还是由业务上下文请求绑定？ | 需要兼顾 owner 清晰与业务入口体验。 | 冻结 party contract。 |
| 2026-04-22 | Party 合并后如何通知 HR / Identity / CRM 等引用方？ | 影响事件契约和引用一致性。 | 后续 party governance 设计。 |

## 10. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/party-service.md`
- contracts：
  - future `docs/contracts/party-service/**`
- feature packet：
  - future party-service foundation / employee onboarding feature
- ADR：
  - party master 与 tenant party binding 已有 ADR，必要时追加补充 ADR。

## 11. 恢复入口

- 下次继续前先读：
  - `docs/architecture/services/party-service.md`
  - `docs/adr/0003-party-master-service-and-tenant-party-binding.md`
  - `docs/architecture/services/hr-service.md`
  - 本 workspace
- 当前推荐下一步：
  - 冻结 Party / TenantParty 最小模型。
  - 冻结员工 onboarding 中 party 创建 / 复用契约。
