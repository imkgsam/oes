# Party、Identity、HR 与 Tenant/Org 协同蓝图

## 1. 目标

定义 OES 中现实世界主体、登录身份、租户边界与组织结构之间的长期协同方式，回答：

- `party-service`、`identity-service`、`tenant-org-service`、`hr-service` 各自拥有哪一层真相
- `User`、`Party`、`TenantParty`、`Employee`、`Employment`、`OrgUnit` 之间如何受控关联
- 哪些入口已经允许开始迁移，哪些入口仍需后置

## 2. 参与服务

- `party-service`
- `identity-service`
- `tenant-org-service`
- `hr-service`
- `api-gateway`，在需要聚合主体展示信息时

## 3. 真相归属

- `party-service`
  - canonical `Party`
  - `TenantParty`
  - `PartyIdentifier`
  - 稳定 `PartyRelationship`
- `identity-service`
  - `User`
  - `UserAccount`
  - `User.partyId -> Party(Person)` 受控关联
  - `UserAccount <-> Employee` 绑定真相
  - 账号、租户、组织、联系资产的身份映射查询
- `tenant-org-service`
  - tenant boundary
  - org tree
  - `OrgUnit` 到 organization party 的可选受控关联
- `hr-service`
  - `Employee`
  - `Employment`
  - 正式 `人 -> org` 任职真相

## 4. 核心边界

- `Party` 回答“这个自然人 / 组织主体是谁”。
- `User` 回答“这个主体如何登录、绑定了哪些认证标识、拥有哪些账号”。
- `UserAccount` 回答“这个主体在某个租户 / scope 下如何出现”。
- `TenantParty` 是业务域第一阶段默认主体引用入口，不是裸 `partyId`。
- `Employee` 回答“这个自然人在某个 tenant 内是否构成员工”。
- `Employment` 回答“这个员工当前如何正式任职到 `OrgUnit`”。
- `OrgUnit` 不等于 `Party`；组织节点如需表达现实世界组织主体，应受控关联到 organization party，而不是把 org tree 放进 `party-service`。
- `account -> org` 不是正式真相；若未来存在 account 视角 org 数据，也只能来自 `Employment` 派生投影。

## 5. 当前已落地协同

截至 2026-04-22，以下链路已经正式落地：

1. `identity-service` 创建新用户时，会先调用 `party-service` 注册 `PersonParty`
2. `identity-service.User` 已正式持有 `partyId`
3. `identity-service` query contract 已开始向上游暴露 `partyId / userPartyId`
4. `api-gateway/auth-bff` 管理端展示名已开始优先通过 `party-service` 补水

这些实现说明 `party-service` 已经具备“平台层定向迁移”的基础，不再只是目标态设计。

## 6. 当前未落地协同

截至当前，以下能力仍未进入正式迁移：

- employee onboarding 的运行时实现；协同边界与 minimum contracts 已由 [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md) 与 `hr-service` minimum contracts 冻结
- 业务域统一以 `tenantPartyId` 引用主体的迁移
- repo 范围内所有 `entity-service` 历史命名、配置、generated 产物和旧契约的全面清理
- 全局 repo-wide rename 或一次性切换

其中业务域统一 `tenantPartyId` 引用、repo-wide cleanup 与全局 rename 仍不应在当前 platform-first 主线中顺手扩张实现。

## 7. `organizationPartyId` 正式收口

截至 2026-04-24，`tenant-org-service -> party-service` 的 `organizationPartyId` 协同已冻结以下最小正式语义：

- `organizationPartyId` 表示某个 `OrgUnit` 对现实世界 `OrganizationParty` 的可选正式引用，不改变 `OrgUnit` 仍由 `tenant-org-service` 拥有、`OrganizationParty` 仍由 `party-service` 拥有的边界。
- 该关联不是第一阶段通用必填字段；默认仍是 optional association。
- 当前第一阶段只允许 `ROOT` 与 `BRANCH` 节点持有 `organizationPartyId`，因为它们才可能稳定表示 tenant 自身或 tenant 下的现实世界组织主体。
- `DEPARTMENT`、`TEAM`、`OTHER` 节点不得绑定 `organizationPartyId`；这些节点表达的是 tenant 内部组织结构，不是 canonical 组织主体。
- “required in some cases” 不在当前通用 `OrgUnit` contract 中冻结；若 future onboarding、directory、legal-doc 或其他场景要求某类组织节点必须关联 organization party，应在该场景自己的 collaboration / contract 中单独提升为必填规则。

## 8. 校验责任分工

- `tenant-org-service`
  - 拥有 `organizationPartyId` 字段的写入、更新、清空与读侧发布语义
  - 在写入口校验当前 `OrgUnit` 类型是否允许持有 organization party 引用
  - 通过 `party-service` 只读 query 校验目标 party 是否存在、是否为 `ORGANIZATION`、是否处于可引用状态
- `party-service`
  - 继续只拥有 canonical `Party` / `OrganizationParty` 真相
  - 通过 query contract 提供 existence / type / status 事实
  - 不拥有 org tree、OrgUnit 生命周期或节点类型规则
- `api-gateway`
  - 只暴露管理入口和查询入口所需的 `organizationPartyId` 字段
  - 不在 gateway/BFF 层承载 party type、org type 或 owner 语义判断

## 9. 迁移护栏

- 当前闭环只做 platform-first 的 `tenant-org-service` 写入口、查询入口与 gateway 暴露。
- 不把 org tree 语义并入 `party-service`。
- 不引入 customer / supplier / employee / contact / external collaborator 角色语义。
- 不把 `organizationPartyId` 扩张为 repo-wide `tenantPartyId` 或裸 `partyId` 统一运动。
- 不顺手做 admin / directory 大面积聚合增强。

## 10. 迁移准入规则

当前允许开始的迁移类型：

- 平台层服务之间的受控迁移
  - `identity-service -> party-service`
  - `api-gateway -> party-service`
  - future `tenant-org-service -> party-service`
  - `hr-service` minimum 在既有 `party-service` 边界内受控消费 `Register / Bind / Get / Search`
- 明确只读展示型聚合
- 明确不会改变业务域引用语义的命名与历史遗留清理

当前不允许直接开始的迁移类型：

- 业务域在没有独立 feature / contract 的前提下直接改为裸 `partyId`
- 把 `tenant-org-service` 的 org tree 语义并入 `party-service`
- 在没有 migration plan 的情况下做 repo-wide rename
- 让前端绕过 BFF / gateway 直接消费 `party-service`

## 11. 入口规则

- 平台管理与展示入口统一通过 `api-gateway` / BFF 暴露
- 内部同步协作统一走 gRPC
- `party-service` 不直接成为前端入口
- 用户与账号相关入口继续由 `identity-service` / `auth-service` 承接，再按需要联动 `party-service`

## 12. 迁移顺序

推荐顺序如下：

1. 平台层协同先行
   - `identity-service`
   - `api-gateway`
   - `tenant-org-service`
2. 历史 `entity` 残留治理
   - schema
   - docs
   - config
   - generated / naming
3. 业务域引用迁移
   - CRM / SRM / 订单 / 合同 / 会计
   - 统一按 `tenantPartyId` 进入

## 13. 明确禁止

- 不让 `identity-service` 继续拥有真实姓名真相
- 不让 `party-service` 承担登录、会话、org tree、客户联系人或员工任职语义
- 不让 `identity-service`、`tenant-org-service` 或兼容 membership API 重新拥有正式 `employee -> org` 真相
- 不让业务域绕过 `TenantParty`
- 不让单个实现线程自行决定跨服务迁移边界

## 14. 关联文档

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [0003-party-master-service-and-tenant-party-binding.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0003-party-master-service-and-tenant-party-binding.md)
- [party-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/party-service-foundation.md)
- [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)
