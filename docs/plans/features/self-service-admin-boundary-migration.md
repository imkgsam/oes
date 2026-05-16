# Self-service And Admin-management Boundary Migration

## 1. 目标

- 将当前用户自助能力与管理员治理能力从接口层、BFF contract、权限门与 UI 入口上持续拆清。
- 消除“个人中心 / 账号安全自助页面复用管理员权限码或管理员 mutation”的历史混用。
- 确保 self-service 的 target 只能来自当前 session / operator context，不能由前端任意指定他人 target。
- 确保 admin-management 继续走 `RBAC + scope / resource` 授权判定，并保留审计。

## 2. 不做什么

- 不重新定义 `auth-service`、`identity-service` 或 `permission-service` 的长期服务职责。
- 不在本 packet 中冻结新的服务设计真相；服务职责必须回写到 `docs/architecture/services/*.md`。
- 不替代黑盒 contract；正式接口字段仍回写到 `docs/contracts/**`。
- 不把所有 self-service 动作建模成普通岗位权限。
- 不为当前用户自助入口引入可指定任意目标用户 / 目标账号的 API。
- 不在未确认场景前拆分所有历史接口；按风险与用户触达路径逐步迁移。

## 3. 上游依赖

- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
- contracts:
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
  - [auth-service/login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/login.md)
  - [auth-service/session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
  - [auth-service/mfa.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/mfa.md)
- adr:
  - [0004-self-service-and-admin-authorization-boundary.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0004-self-service-and-admin-authorization-boundary.md)

## 4. 当前结论

- Self-service 与 admin-management 是接口层语义边界，不只是 UI 文案差异。
- Self-service 默认面向当前登录主体，target 必须由当前 session / operator context 推导。
- Admin-management 默认面向被管理目标用户、目标账号、目标会话或租户策略，必须经过 `RBAC + scope / resource` 判定。
- application / domain 层可以复用底层业务逻辑，但 BFF / gRPC / interface 层不得长期复用同一个权限门承载两种语义。
- 当前用户自己的密码、登录方式、MFA binding、sessions、login history 属于 auth self-service 主线。
- 管理目标用户的 session、login method、password setup requirement、tenant / platform MFA policy 属于 admin-management 主线。
- 当前用户自己的低风险基础资料编辑，例如 `avatar / displayName / bio`，属于 identity self-service 主线。
- 管理他人资料、组织治理字段、账号治理字段或角色授权，属于 admin-management 主线。

## 5. 契约真相位置

- 服务设计唯一真相：
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- 当前 self-service contract：
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
- 当前 admin-management contract：
  - [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 维护迁移规则、拆分优先级与回写目标 | `docs/plans/features/self-service-admin-boundary-migration.md`, 必要时 `docs/architecture/**`, `docs/contracts/**` | 已冻结服务真相源与现有 BFF / contract | 项目级迁移清单与边界决策 | active |
| auth owner | 收敛 auth self-service / admin-management 接口与 contract | `docs/contracts/auth-service/**`, `docs/contracts/api-gateway/auth-bff-*.md`, 必要时 `src/services/system/auth-service/**`, `src/services/api-gateway/**` | 本 packet 与 auth-service 真相源 | auth 相关迁移 slice | pending |
| identity owner | 收敛 identity self-service / admin-management 接口与 contract | `docs/contracts/identity-service/**`, `docs/contracts/api-gateway/**`, 必要时 `src/services/system/identity-service/**`, `src/services/api-gateway/**` | 本 packet 与 identity-service 真相源 | identity 相关迁移 slice | pending |
| review / integration owner | 审核权限门、scope、target 解析和 UI 入口一致性 | 只读全局，必要时最小修正 | design + implementation 结果 | review 结论与残余风险 | pending |

## 7. 当前 slice

- slice:
  - 项目级迁移任务建档
- status:
  - active
- scope:
  - 冻结迁移目标、规则、优先级与待迁移清单
  - 为后续 auth / identity / BFF 迁移线程提供唯一跟踪入口
- ready definition:
  - 上游服务真相源已明确 self-service / admin-management 边界
  - BFF 和 service contract 中已能识别当前自助与管理员入口

## 8. 主线范围

- 本线程主线：
  - 跟踪 self-service 与 admin-management 的项目级迁移债。
  - 将已确认结论回写到服务真相源、协同蓝图或 contract。
  - 将实现任务拆成可独立执行的后续 slice。
- 本线程不做：
  - 不直接替代服务真相源。
  - 不直接替代 API contract。
  - 不在没有实现计划时扩大改造到所有历史接口。
- 偏移返回条件：
  - 若发现服务职责边界不清，先回到 `docs/architecture/services/*.md`。
  - 若发现跨服务协同不清，先回到 `docs/architecture/collaborations/*.md`。
  - 若发现权限语义变化影响公共模型，先升级到 ADR 或 permission architecture。

## 9. 待迁移清单

| Area | 当前风险 | 建议动作 | 回写目标 | 状态 |
| --- | --- | --- | --- | --- |
| auth personal security | 个人中心安全页可能混用管理员安全治理权限门 | self-service endpoint 只从当前 session 派生 target，禁止传入任意目标 user / account | `auth-bff-self-service.md`, `auth-service/*.md` | active |
| auth admin security | 管理员安全治理与当前用户自助安全如果复用接口，容易绕过 scope 或误伤自助体验 | admin contract 独立保留 `checkPermission + scope / resource` 语义 | `auth-bff-admin-security.md`, `auth-service/*.md` | active |
| identity profile self-service | 当前用户低风险资料编辑不应默认要求管理员资料修改权限码 | 建立或确认 identity self-service contract，并与 admin profile management 分离 | `identity-service.md`, `docs/contracts/identity-service/**` | pending |
| contact binding follow-up | 联系资产绑定后补齐登录方式可能混用 admin bootstrap mutation | self-service contact binding 只调用 self-service downstream mutation | `auth-bff-self-service.md`, `identity-service` contract | active |
| UI routing | 普通个人中心入口与管理员安全治理入口如果共享页面状态，容易误用权限码 | 前端按 self-service / admin-management 分离模块入口与 API client | `tenant-web` feature slice | pending |
| audit semantics | 自助安全操作与管理员治理操作审计维度不同 | 审计事件必须区分 self action 与 admin action，并携带 operator / target | auth / identity contract 与实现 slice | pending |

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-12 | 是否所有个人资料编辑都属于 self-service | Blocker-Later | 会影响 identity-service contract 拆分范围 | 低风险资料先按 self-service 处理；组织、角色、账号治理字段仍归 admin-management | `identity-service.md`, identity contract | open |
| 2026-05-12 | 是否需要为 self-service 建独立 permission code | Blocker-Later | 会影响权限模型与 UI guard | 默认不建普通岗位权限；若涉及高风险动作，优先使用 step-up MFA、白名单动作与审计，而非管理员权限码 | permission architecture / ADR | open |
| 2026-05-12 | 历史混合接口是否保留兼容期 | Sidecar | 会影响实现排期与迁移风险 | 后续实现 slice 按调用方迁移情况决定兼容期，并明确废弃条件 | 对应 feature slice | open |

## 11. 验收标准

- 每个 self-service endpoint 的 target 都由当前 session / operator context 派生。
- 每个 admin-management endpoint 都有明确 permission code、scope / resource 判定和审计要求。
- 普通个人中心页面不再依赖管理员安全治理权限码。
- 管理员页面不复用 self-service-only mutation 来治理他人。
- auth 与 identity 的 contract 中都明确区分 self-service 和 admin-management。
- UI API client 与路由入口按 self-service / admin-management 分离。
- 迁移后的行为不降低 session、MFA、password、contact binding 和账号治理的安全性。

## 12. 关闭条件

- auth-service 相关 self-service / admin-management 混用接口已拆分或明确废弃。
- identity-service 相关个人资料自助与管理员资料治理已拆分或明确废弃。
- BFF contract 已完成 self-service / admin-management 分层表达。
- 主要 UI 入口已完成 API client 与权限门分离。
- 残余兼容接口已记录移除条件和后续 owner。

## 13. 备注

- 本 packet 是项目级迁移任务入口，不是服务设计真相源。
- 服务职责变化必须先回写 `docs/architecture/services/*.md`。
- Contract 字段变化必须回写 `docs/contracts/**`。
- 若后续出现新的混用入口，优先追加到本 packet 的待迁移清单，而不是在单个服务中维护孤立清单。
