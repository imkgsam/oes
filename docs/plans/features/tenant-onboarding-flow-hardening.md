# Tenant Onboarding Flow Hardening

## 1. 目标

- 将“创建租户 + 创建第一个租户用户”收口为生产级 tenant onboarding 主线。
- 建立 `tenant-org-service` 内部轻量 Saga / Process Manager，支持幂等、失败恢复、审计追踪与前端结果展示。
- 确保 tenant、party、identity、auth、permission 的 owner 边界不被 Gateway 或调用方绕过。

## 2. 不做什么

- 不在本 feature 中引入完整 `workflow-service`。
- 不把 Saga 编排放到 Gateway / BFF。
- 不通过 seed / reset 脚本替代正式业务流程。
- 不跨服务直接写数据库。
- 不在 `tenant-org-service` 拥有 party、identity、auth、permission 的主数据真相。
- 不把 employee / employment 或 account-org membership 变成 `tenant-org-service` 真相；首租户管理员员工化仅通过 `hr-service` owner 能力编排。
- 不复用 employee onboarding grant 语义授予首租户管理员 `tenant.admin` / `hr.admin`；员工默认 `account.basic` 接入仍归 HR employee onboarding access 段。

## 3. 上游依赖

- design workspace:
  - [tenant-onboarding-flow-hardening.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/tenant-onboarding-flow-hardening.md)
- services:
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
  - [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- collaboration:
  - [party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)
  - [tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
  - [service-collaboration-rules.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/service-collaboration-rules.md)
- contracts:
  - [tenant-org-service/onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/onboarding.md)
  - [permission-service/tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
  - [hr-service/management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/management.md)
  - [api-gateway/tenant-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/tenant-onboarding.md)

## 4. 当前结论

- 当前阶段采用 `tenant-org-service` 内部轻量 Saga / Process Manager。
- Gateway 只提供外部 HTTP contract、鉴权、DTO 转换与展示适配，不保存或推进 onboarding step 状态。
- `tenant-org-service` 保存 `TenantOnboardingRun` 和 step 状态，作为租户开通流程的恢复入口。
- `tenant-org-service` 只能记录下游对象 id 与 step result，不能复制下游主数据。
- `party-service` 继续拥有 `OrganizationParty / PersonParty / TenantParty`。
- `identity-service` 继续拥有 `User / UserAccount`。
- `auth-service` 继续拥有 login method、credential 与 password setup gate。
- `hr-service` 继续拥有首租户管理员对应的 `Employee / Employment` 真相；`tenant-org-service` 只编排并记录 external refs。
- `permission-service` 继续拥有 tenant.admin / hr.admin / account.basic role instance 与 account role grant。
- future `workflow-service` 是长期演进方向，不进入本 feature 第一阶段。

## 5. 契约真相位置

本 feature 的首批 contract 草案位于：

- `docs/contracts/tenant-org-service/onboarding.md`
- `docs/contracts/permission-service/tenant-onboarding-grant.md`
- `docs/contracts/api-gateway/tenant-onboarding.md`

当前文档冻结的是目标 contract 语义；截至 2026-05-05，proto / runtime 已支持当前主线能力，本次文档收口不重跑 Jest / Vitest。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结 onboarding owner、流程、失败恢复与 contract 草案 | `docs/plans/designs/**`, `docs/plans/features/**`, `docs/contracts/**` | 用户确认的 Saga 口径、现有服务职责 | 当前 feature packet 与 contract 草案 | in_progress |
| tenant-org implementation owner | 实现 onboarding run、step 状态与 Saga 编排 | `src/services/system/tenant-org-service/**`, `src/common/src/contracts/tenant_org_service/**` | feature packet + tenant-org contract | 可重试 onboarding API 与测试 | runtime-supported |
| permission implementation owner | 增加非 employee 语义的 tenant account initial grant 能力 | `src/services/system/permission-service/**`, `src/common/src/contracts/permission_service/**` | permission contract | role ensure + grant 能力与测试 | runtime-supported |
| downstream integration owner | 补 party / identity / auth / hr 必要幂等或响应字段 | 对应 system service contract / implementation | feature packet | 下游稳定协作能力 | runtime-supported |
| frontend owner | 将 tenant create modal 升级为 onboarding wizard/result | `app/web/apps/tenant-web/**` | api-gateway contract | 可用 wizard、失败展示、retry 入口 | runtime-supported |
| review owner | 检查是否越界、是否可恢复、是否复用 employee grant 语义 | 只读全局，必要时最小文档收口 | 实现结果与验证 | pending-current-gate |

## 7. 当前 slice

- slice:
  - runtime-supported document closeout
- status:
  - proto / runtime supported
  - feature packet status updated
  - current turn does not rerun Jest / Vitest
- scope:
  - onboarding run 状态模型
  - tenant-org onboarding gRPC / application contract
  - gateway HTTP contract
  - permission tenant onboarding grant contract
  - frontend wizard target shape
- ready definition:
  - 主控已确认当前阶段不引入完整 `workflow-service`
  - 主控已确认 Gateway 不做主编排
  - 主控已确认 `tenant-org-service` 承接轻量 Saga / Process Manager

## 8. 主线流程

1. System admin 调用 Gateway onboarding endpoint。
2. Gateway 校验 system scope 与 request DTO，转发到 `tenant-org-service`。
3. `tenant-org-service` 创建或加载 `TenantOnboardingRun`。
4. `tenant-org-service` 调 `party-service.RegisterOrganizationParty`。
5. `tenant-org-service` 创建 `Tenant + root OrgUnit`，root org 绑定 `organizationPartyId`。
6. `tenant-org-service` 调 `party-service.BindExistingPartyToTenant`，建立 organization tenant-party。
7. `tenant-org-service` 调 `identity-service.CreateUserAccount` 创建首管理员 user/account。
8. `identity-service` 通过 `party-service.RegisterPersonParty` 创建 person party / tenant-party。
9. `tenant-org-service` 调 `hr-service.CreateEmployeeOnboarding`，为首租户管理员创建员工与首条任职。
10. `tenant-org-service` 调 `auth-service.BootstrapUserLoginMethods`。
11. 若请求要求，`tenant-org-service` 调 `auth-service.RequirePasswordSetup`。
12. `tenant-org-service` 调 `permission-service.EnsureTenantRoleInstanceFromTemplate`，确保 `tenant.admin` / `hr.admin` / `account.basic` role instance。
13. `tenant-org-service` 调 `permission-service.GrantInitialAccessForTenantAccount`，授予首管理员 tenant / HR 管理访问。
14. `tenant-org-service` 标记 onboarding 成功，并返回聚合结果。

## 9. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-02 | 是否引入 `TenantStatus.PROVISIONING` | Blocker-Later | 会影响 tenant lifecycle 与现有 active tenant 查询 | 第一版可先用 onboarding run 表达未完成状态；是否扩 tenant status 单独确认 | tenant-org contract | open |
| 2026-05-02 | party-service 写接口是否首版补 `idempotency_key` | Blocker-Now | 影响重复提交和响应丢失后的恢复质量 | 已支持 party registration / tenant-party binding 幂等键 | party-service contract / runtime | closed |
| 2026-05-02 | identity 创建账号是否返回 person tenant-party | Blocker-Now | 影响 onboarding result 完整展示和恢复记录 | 已支持返回 first admin person party / tenant-party refs | identity-service contract / runtime | closed |
| 2026-05-02 | tenant.admin role instance ensure 接口命名 | Blocker-Now | 影响 permission proto 与长期 grant 语义 | 已采用 `EnsureTenantRoleInstanceFromTemplate` 并支持 tenant onboarding grant | permission contract / runtime | closed |
| 2026-05-02 | 首管理员是否必须 password setup | Product Decision | 影响 auth 调用链和前端提示 | 当前创建新用户默认 require password setup；existing user 不强制新增 password setup | auth contract / gateway contract | closed |
| 2026-05-05 | 首租户管理员是否同时成为员工 | Blocker-Now | 影响 onboarding 主流程和 HR owner 边界 | 已支持通过 `hr-service` 创建首租户管理员 employee / employment；`tenant-org-service` 不拥有 HR 真相 | tenant-org / hr runtime | closed |

## 10. 验收标准

- system admin 可以通过一个 onboarding wizard 完成租户与首管理员创建。
- 成功后存在 tenant、organization party、root org、organization tenant-party。
- root org 正确持有 `organizationPartyId`。
- 首管理员存在 person party、person tenant-party、identity user、tenant account、auth login method。
- 首管理员存在由 `hr-service` 拥有的 employee 与首条 employment。
- 首管理员拥有 tenant scoped `tenant.admin` 与 `hr.admin` role instance grant，并具备 onboarding 所需的基础账号访问。
- Gateway 不持有 onboarding step 状态。
- 任一步失败后，onboarding run 能展示失败 step、外部对象引用与 retry 策略。
- 同一 `idempotencyKey` 重复提交不会创建重复 tenant、party、account 或 grant。
- 不跨库直接写他域数据。
- 最小 L1 / L2 / BFF / frontend 验证覆盖成功、幂等、下游失败与 retry。

## 11. 关闭条件

- contract 文档冻结并回写索引。
- implementation plan 已基于本 feature packet 产出。
- tenant-org onboarding run 与 Saga 编排落地。
- permission tenant onboarding grant 能力落地。
- party / identity / auth 的必要协作缺口收口。
- 首租户管理员 employee / employment 支持已按 `hr-service` owner 边界落地。
- tenant-web wizard 和 result / retry 展示落地。
- 最小 e2e / L2 验证通过；若主控明确不继续测试，则本项保留为未在本轮重跑的验收风险。

## 12. 备注

- 本 feature packet 是执行入口，不替代服务职责卡、协同蓝图或正式 proto。
- 当前首要目标是生产级 tenant onboarding 闭环，不是通用 workflow 平台。
- 若后续出现多个长流程，再评估迁移到 `workflow-service`。
