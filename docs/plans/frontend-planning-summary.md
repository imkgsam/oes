# OES 前端规划导航

更新时间：2026-04-13

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

这些结论的正式归属位置如下：

- 统一 Web Shell、`SYSTEM / TENANT` scope、account context：
  - [0001-unified-web-scope-aware-user-account.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0001-unified-web-scope-aware-user-account.md)
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
- Gateway / BFF 与前端契约边界：
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [docs/contracts/api-gateway/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/README.md)

## 3. 前端文档阅读顺序

### 3.1 如果你在做前端工程结构或代码组织

先读：

1. [tenant-web-frontend-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-frontend-architecture.md)
2. [tenant-web-code-refactor-checklist.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-code-refactor-checklist.md)

### 3.2 如果你在做导航、工作台、模块分组或产品骨架

先读：

1. [tenant-web-information-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-information-architecture.md)
2. [tenant-web-frontend-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-frontend-architecture.md)

### 3.3 如果你在做登录、上下文、菜单或权限接入

先读：

1. [docs/contracts/api-gateway/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/README.md)
2. [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
3. [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
4. [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
5. [tenant-web-code-refactor-checklist.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-code-refactor-checklist.md)

### 3.4 如果你在做底座适配、模板残留清理或 Vben 本地化

先读：

1. [tenant-web-vben-implementation-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-vben-implementation-plan.md)
2. [tenant-web-frontend-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-frontend-architecture.md)

## 4. 各文档职责

当前前端 plans 文档分工如下：

- [tenant-web-frontend-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-frontend-architecture.md)
  - `tenant-web` 前端工程架构主文档
- [tenant-web-information-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-information-architecture.md)
  - `tenant-web` 产品级信息架构主文档
- [tenant-web-code-refactor-checklist.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-code-refactor-checklist.md)
  - 当前阶段代码改造与验证状态
- [tenant-web-vben-implementation-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-vben-implementation-plan.md)
  - `vue-vben-admin` 底座适配与本地化专项说明

## 5. 使用约束

- 本文档不再重复承载统一 Web Shell、scope、session context、导航与权限的正式设计正文
- 本文档不记录当前 feature 执行状态
- 若前端 thread 需要正式真相，应回到对应 `architecture / contracts / plans` 主文档，而不是扩写本页
