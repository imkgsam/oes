# tenant-org-service 职责卡

## 1. Purpose

`tenant-org-service` 是 OES 的租户边界与组织结构真相服务，负责回答“这个 tenant 是什么、tenant 内部如何组织、某个组织引用是否合法、组织层级应如何被解析”。

## 2. Owns

- `Tenant` 真相
- `OrgUnit`、组织树与层级结构真相
- 组织节点类型、组织路径、祖先 / 子孙关系与排序
- 业务对象 `ownerOrgId / submitOrgId / responsibleOrgId` 等组织引用的合法性校验基础
- 组织节点与现实世界 `organization party` 的可选受控关联

## 3. Does Not Own

- 自然人或法定组织主体主数据真相
- 账号认证、会话、登录链路与联系方式资产真相
- `User / UserAccount` 身份映射真相
- account 到 org 的长期归属真相
- `Employee / Employment` 与员工任职真相
- 角色、权限、policy 与授权判定真相
- 客户、供应商、订单、审批实例等业务资源真相

## 4. Core Responsibilities

- 提供 tenant 创建、启停、归档与租户基础标识治理能力
- 提供租户内部组织树、部门、小组、分公司等组织结构治理能力
- 提供组织路径、祖先、子孙、同级等层级解析能力
- 为业务服务、Workflow、Reporting 提供组织引用校验与层级遍历基础
- 为 future `hr-service` 提供可被正式任职关系引用的 `OrgUnit` 真相
- 在必要时允许组织节点受控关联到 `party-service` 的 organization party，但不替代主体主数据
- `organizationPartyId` 的基础语义是“组织节点对现实世界 organization party 的可选正式引用”，不是所有 `OrgUnit` 都默认拥有的字段语义
- 当前第一阶段只允许 `ROOT` 与 `BRANCH` 节点持有 `organizationPartyId`；`DEPARTMENT`、`TEAM`、`OTHER` 不得绑定 organization party
- `tenant-org-service` 负责在写入口校验 `organizationPartyId` 是否可被当前节点类型持有，并通过 `party-service` 只读 query 校验目标 party 是否存在、是否为 `OrganizationParty`、以及是否处于可引用状态

## 5. External Interfaces

- 典型上游入口：`api-gateway`、`auth-service`、`identity-service`、future `hr-service`、业务服务
- 典型下游消费方：
  - 需要 tenant 摘要与组织树的 BFF / 前端聚合层
  - 需要组织引用校验与层级解析的业务服务
  - 需要以 `OrgUnit` 为结构基础的 future `hr-service`

## 6. Upstream Dependencies

- `identity-service`
  - 提供 `userId / accountId / tenantId` 等身份侧引用事实
- `party-service`
  - 在组织节点需要受控关联现实世界组织主体时提供上游主体事实
- future `hr-service`
  - 在需要基于正式员工任职形成 org-based scope 时提供人员任职事实

## 7. Downstream / Published Facts

- tenant 基础摘要
- 租户内部组织树与组织节点元数据
- 组织节点祖先、子孙、同级与路径等层级解析事实
- 业务对象组织引用是否合法的校验结果
- 组织节点与法定组织主体之间的受控关联结果

## 8. Non-goals

- 不直接承接认证、会话、令牌或账号凭证逻辑
- 不直接拥有自然人 / 法定组织主体主数据
- 不维护 `UserAccount`、contact assets 或 available account contexts
- 不拥有 account 到 org 的归属真相
- 不拥有 `Employee / Employment`、岗位、汇报关系或薪酬考勤等 HR 语义
- 不在本服务内直接实现业务域自己的订单、客户、供应商或审批规则
- 不把“哪些场景必须关联 organization party”上升为通用 org tree 规则；如 future 场景需要必填，应由对应协同 contract 单独冻结
