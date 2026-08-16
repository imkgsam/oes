# OES 前端规划导航

更新时间：2026-04-24

## 1. 目的

本文档只负责给前端相关 thread 提供高层结论与阅读导航。

它不是正式架构正文，也不是执行状态面板。

## 2. 当前高层结论

当前前端方向已经收敛为以下结论：

- OES 采用“统一平台能力 + 多前端终端承载”的方向
- 当前 Web 主线是统一 Web Shell，而不是一开始拆成多个独立 Web
- 统一 Web Shell 内当前按 `/platform/*` 与 `/tenant/*` 区域区分平台侧与租户侧
- `tenant-web` 当前作为租户业务 Web 主线前端继续推进
- 平台、租户、终端准入、会话上下文、导航与权限必须显式区分，不能继续混在模板默认用户模型中
- tenant / org / hr 前端基础入口阶段已在现有边界内收口到当前 plans 文档：
  - `/admin/tenant-management` 对应平台侧 `Tenant` 管理入口
  - `/admin/org-management` 与 `/settings/organization-people/departments` 共同承接 `OrgUnit` 管理入口
  - `/settings/organization-people/members` 对应 `Employee / Employment` 管理入口
  - `/settings/org-structure` 与 `/settings/employee-employment` 仅保留兼容跳转
  - `Tenant / OrgUnit / org tree` 的服务设计以 [tenant-org-service.md](../architecture/services/tenant-org-service.md) 为准，`Employee / Employment` 的服务设计以 [hr-service.md](../architecture/services/hr-service.md) 为准，本文只记录前端消费入口
- `tenant-web` 租户侧 `组织与人员 wave-1` 已完成文档层收口：
  - 统一入口为 `组织与人员`
  - 固定为 `成员 / 部门` 两个 Tab
  - 成员详情已收口为五区块，`账号与访问` 与“创建成员允许登录”均只进入第一阶段
- `tenant.admin` 当前前端基线已收口为租户治理基础入口，而不是平台治理全开：
  - 已对齐 `workbench.home`、`admin.auth-session-management`、`admin.role-management`、`admin.account-management`、`tenant-settings.organization-people`、`tenant-settings.org-structure`、`tenant-settings.employee-employment`、`tenant-settings.login-mfa`
  - 未对齐 `admin.tenant-management`、`admin.org-management`、`admin.permission-management`、`admin.policy-governance`、`admin.navigation-management`

这些结论的正式归属位置如下：

- 统一 Web Shell、`SYSTEM / TENANT` scope、account context：
  - [0001-unified-web-scope-aware-user-account.md](../adr/0001-unified-web-scope-aware-user-account.md)
  - [unified-web-account-context.md](../architecture/platforms/unified-web-account-context.md)
- Gateway / BFF 与前端契约边界：
  - [gateway-and-bff.md](../architecture/platforms/gateway-and-bff.md)
  - [docs/contracts/api-gateway/README.md](../contracts/api-gateway/README.md)

## 3. 前端文档阅读顺序

### 3.1 如果你在做前端工程结构或代码组织

先读：

1. [tenant-web-frontend-architecture.md](./tenant-web-frontend-architecture.md)
2. [tenant-web-code-refactor-checklist.md](./tenant-web-code-refactor-checklist.md)

### 3.2 如果你在做导航、工作台、模块分组或产品骨架

先读：

1. [tenant-web-information-architecture.md](./tenant-web-information-architecture.md)
2. [tenant-web-frontend-architecture.md](./tenant-web-frontend-architecture.md)

### 3.3 如果你在做登录、上下文、菜单或权限接入

先读：

1. [docs/contracts/api-gateway/README.md](../contracts/api-gateway/README.md)
2. [auth-bff-login.md](../contracts/api-gateway/auth-bff-login.md)
3. [navigation-summary.md](../contracts/api-gateway/navigation-summary.md)
4. [access-summary.md](../contracts/api-gateway/access-summary.md)
5. [tenant-web-code-refactor-checklist.md](./tenant-web-code-refactor-checklist.md)

### 3.4 如果你在做底座适配、模板残留清理或 Vben 本地化

先读：

1. [tenant-web-vben-implementation-plan.md](./tenant-web-vben-implementation-plan.md)
2. [tenant-web-frontend-architecture.md](./tenant-web-frontend-architecture.md)

### 3.5 如果你在做 tenant / org / hr 前端基础入口收口或后续增强

先读：

1. [tenant-web-code-refactor-checklist.md](./tenant-web-code-refactor-checklist.md)
2. [tenant-org-service.md](../architecture/services/tenant-org-service.md)
3. [hr-service.md](../architecture/services/hr-service.md)
4. [hr-service-foundation.md](./features/hr-service-foundation.md)
5. [navigation-entry-management.md](./features/navigation-entry-management.md)
6. [backlog.md](./backlog.md)

## 4. 各文档职责

当前前端 plans 文档分工如下：

- [tenant-web-frontend-architecture.md](./tenant-web-frontend-architecture.md)
  - `tenant-web` 前端工程架构主文档
- [tenant-web-information-architecture.md](./tenant-web-information-architecture.md)
  - `tenant-web` 产品级信息架构主文档
- [tenant-web-code-refactor-checklist.md](./tenant-web-code-refactor-checklist.md)
  - 当前阶段代码改造与验证状态
- [tenant-web-vben-implementation-plan.md](./tenant-web-vben-implementation-plan.md)
  - `vue-vben-admin` 底座适配与本地化专项说明
- [tenant-org-service.md](../architecture/services/tenant-org-service.md)
  - `Tenant / OrgUnit / org tree` 服务真相源；前端文档只能引用其设计，不重新定义 tenant-org 边界
- [hr-service-foundation.md](./features/hr-service-foundation.md)
  - HR minimum feature 状态与前端入口边界口径；`Employee / Employment` 服务设计以 [hr-service.md](../architecture/services/hr-service.md) 为准
- [navigation-entry-management.md](./features/navigation-entry-management.md)
  - 导航 entryKey 收口与兼容入口保留口径
- [backlog.md](./backlog.md)
  - 已确认 deferred 的前端后续项与环境侧收口项

## 5. 使用约束

- 本文档不再重复承载统一 Web Shell、scope、session context、导航与权限的正式设计正文
- 本文档不记录当前 feature 执行状态
- 若前端 thread 需要正式真相，应回到对应 `architecture / contracts / plans` 主文档，而不是扩写本页
