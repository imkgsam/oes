# hr-service 职责卡

## 1. Purpose

`hr-service` 是 OES 的员工与任职关系真相服务，负责回答“这个自然人在当前租户内是否构成员工或工作人员、处于什么任职状态、被分配到哪些岗位或组织”。

## 2. Owns

- 员工 / 工作人员主档真相，使用独立 `employeeId`
- 任职关系、雇佣状态与生命周期真相
- 员工编号、入转调离等人力状态语义
- 岗位分配、汇报关系与主要任职记录
- 与组织挂靠相关的正式人力任职事实；正式 `人 -> org` 真相是 `Employment -> OrgUnit`

## 3. Does Not Own

- 自然人主体主数据真相
- 账号认证、会话与登录链路真相
- 租户内部组织树真相
- `account -> org` 或 account-org membership 的正式归属真相
- 角色、权限、policy 与授权判定真相
- 客户、供应商等外部联系人语义
- 薪酬、考勤、绩效等更重 HR 子域的完整实现范围

## 4. Core Responsibilities

- 把现实世界的自然人主体受控映射为租户内的人力主体，以上游 `tenantPartyId` 作为正式主引用
- 维护员工 / 工作人员的任职状态、任职区间与雇佣关系
- 提供岗位、主要任职与汇报线等人力基础能力
- 为 `tenant-org-service`、`identity-service` 与业务服务提供正式员工事实，而不是让这些服务长期各自维护员工语义
- 区分“组织成员”与“员工”：并非所有组织成员都属于员工，但员工任职应能被正式表达
- 在第一阶段 minimum 范围内，优先冻结 `Employee + 当前唯一 active Employment`，而不是把兼任、借调、复杂任职区间一次性做重

## 5. External Interfaces

- 典型上游入口：`api-gateway`、`tenant-org-service`、`identity-service`、业务服务
- 典型下游消费方：
  - 需要员工身份或任职状态的业务服务
  - 需要正式任职事实的组织与审批链路
  - 未来更重的人力子域，如薪酬、考勤、绩效等

## 6. Upstream Dependencies

- `party-service`
  - 提供自然人主体与稳定标识事实，作为员工主档的上游自然人真相
- `tenant-org-service`
  - 提供租户内部组织节点与组织上下文事实
- `identity-service`
  - 在员工需要绑定账号、操作者或登录入口时提供账号映射事实

## 7. Downstream / Published Facts

- 某自然人在某租户内是否构成员工 / 工作人员
- 员工当前任职状态、主岗位、主组织与任职区间
- 员工编号、汇报关系与主要任职摘要
- 面向组织、审批与业务服务可消费的正式人力事实
- 面向 `identity-service` 的 `UserAccount <-> Employee` 绑定目标摘要，但不拥有账号真相

## 8. Non-goals

- 不直接拥有自然人主体主数据
- 不把客户联系人、供应商联系人等外部关系纳入员工真相
- 不替代 `tenant-org-service` 管理组织树本体
- 不替代 `identity-service` 管理账号、认证与 operator context
- 不让 `account -> org` compatibility 接口回升为正式员工归属真相
- 在当前阶段不默认承接完整 payroll、attendance、performance、recruiting 等重 HR 子域
