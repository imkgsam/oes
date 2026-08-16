# OES Tenant Web 前端架构设计

更新时间：2026-04-09 21:10:00 +08:00

> 前端不拥有 access summary、terminal access、Role、Policy、permission code 或授权判定真相；这些服务设计边界以 [permission-service.md](../architecture/services/permission-service.md) 为准。本文只描述 tenant-web 前端架构。

## 1. 文档目的

本文档定义 `tenant-web` 的前端工程架构，用于回答以下问题：

- 前端状态应该如何分层
- API 请求代码应该如何组织
- 路由、菜单、页面之间的关系应该如何设计
- 在后端系统能力先行、业务域后续逐步接入的情况下，前端怎样做到可扩展而不推翻

本文档聚焦 `tenant-web`，不覆盖 `platform-web`。

## 2. 设计目标

### 2.1 长期可扩展

前端架构必须支持后续逐步接入：

- CRM / SRM
- ERP / Finance
- WMS / Inventory
- MES / Manufacturing
- APS / Planning
- Workflow / Task
- BI / Reporting

且不因这些模块增加而整体重构目录或状态模型。

### 2.2 前端依赖 BFF，而不是依赖后端内部服务结构

前端应将 Gateway / BFF 视为唯一 HTTP 真相源。

因此：

- 前端 API 目录不应映射 `auth-service`、`identity-service`、`permission-service` 内部结构
- 前端消费的是“登录流程”、“初始化上下文”、“导航摘要”、“工作台数据”等客户端视角契约

### 2.3 壳层稳定，业务域渐进接入

前端应先稳定以下壳层：

- 登录与会话
- 租户上下文
- 导航与菜单
- 基础布局
- 工作台
- 通用列表 / 表单 / 详情骨架

业务域页面可以逐步进入这个壳层，而不改变壳层本身。

## 3. 当前代码结构判断

当前 `tenant-web` 已具备如下工程基础：

- 启动入口：
  - [main.ts](../../app/web/apps/tenant-web/src/main.ts)
  - [bootstrap.ts](../../app/web/apps/tenant-web/src/bootstrap.ts)
- 路由装配：
  - [router/index.ts](../../app/web/apps/tenant-web/src/router/index.ts)
  - [router/guard.ts](../../app/web/apps/tenant-web/src/router/guard.ts)
- 请求封装：
  - [api/request.ts](../../app/web/apps/tenant-web/src/api/request.ts)
- 认证 store：
  - [store/auth.ts](../../app/web/apps/tenant-web/src/store/auth.ts)

当前问题不是“没有架构”，而是“架构仍偏模板默认语义，需要 OES 化”。

## 4. 推荐目录分层

### 4.1 应用层目录建议

建议 `apps/tenant-web/src` 逐步演进为以下分层：

- `app/`
  - 应用启动、provider、应用级初始化
- `layouts/`
  - 基础布局、认证布局、工作台布局部件
- `router/`
  - 静态骨架路由、路由守卫、菜单装配
- `api/`
  - 面向 BFF 的请求模块
- `stores/`
  - 应用级状态管理
- `modules/`
  - 业务模块
- `views/`
  - 通用页面壳、工作台、错误页、认证页
- `components/`
  - tenant-web 应用独有组件
- `composables/`
  - tenant-web 应用独有 hooks
- `types/`
  - 应用级类型

### 4.2 为什么要引入 `modules/`

当前 `views/` 适合放壳层页面，但后续业务域不断增加后，单纯把所有页面堆在 `views/` 会失控。

建议后续新增业务域时采用：

- `modules/workbench`
- `modules/collaboration`
- `modules/tenant-admin`
- `modules/sales`
- `modules/procurement`
- `modules/inventory`
- `modules/manufacturing`
- `modules/planning`
- `modules/reporting`

每个模块内部再按页面、组件、api-adapter、types 组织。

这样可以保证：

- 前端模块边界稳定
- 后续业务域接入不污染壳层目录

## 5. Store 分层设计

### 5.1 为什么要分层

当前模板式写法容易把很多概念塞进一个 `userInfo` 或一个 `accessStore` 里。

OES 不适合这样做，因为前端要同时处理：

- 会话状态
- 当前 operator / account / tenant / org 上下文
- 导航与权限摘要
- 工作台与页面状态
- 偏好设置与 UI 状态

这些职责不同，生命周期也不同。

### 5.2 推荐 store 分层

建议采用四层：

1. `session store`
2. `auth context store`
3. `access store`
4. `ui store`

### 5.3 session store

职责：

- access token
- refresh token
- token 刷新状态
- 登录过期状态
- 当前认证流程状态

典型字段：

- `accessToken`
- `refreshToken`
- `isRefreshing`
- `loginExpired`
- `authFlowState`

说明：

- 它只关心“当前会话是否有效”
- 不关心当前用户完整业务身份信息

### 5.4 auth context store

职责：

- 当前 operator 摘要
- 当前 account 摘要
- 当前 tenant 摘要
- 当前 org 摘要
- 当前终端类型
- 当前身份切换 / 上下文切换

典型字段：

- `operator`
- `account`
- `tenant`
- `org`
- `terminal`
- `currentRoleSummary`

说明：

- 这层是 OES 特有的关键层
- 它把“登录态”和“业务上下文”分开

### 5.5 access store

职责：

- 可见菜单
- 可访问页面
- 按钮 / 操作码
- 默认首页
- 菜单是否已装配完成

典型字段：

- `menus`
- `routes`
- `actionCodes`
- `defaultHomePath`
- `isAccessResolved`

说明：

- 当前共享包里的 `useAccessStore` 可以继续复用
- 但后续建议把 OES 专属字段在应用层再封装，不直接把所有业务意义塞进共享 store

### 5.6 ui store

职责：

- 页面级 UI 状态
- 工作台布局偏好
- 标签页、筛选缓存、局部视图状态

典型字段：

- `workbenchWidgets`
- `recentVisited`
- `dashboardFilters`
- `sidebarState`

说明：

- 这层不应承载权限与身份语义

## 6. API 分层设计

### 6.1 设计原则

前端 API 不按后端服务名分层，而按前端消费场景分层。

原因：

- BFF 就是为了屏蔽后端内部服务编排
- 如果前端仍按服务名组织，就会把后端内部边界泄漏到前端

### 6.2 推荐 API 目录

建议 `apps/tenant-web/src/api` 逐步演进为：

- `api/bff/auth`
- `api/bff/context`
- `api/bff/navigation`
- `api/bff/workbench`
- `api/bff/collaboration`
- `api/bff/tenant-admin`
- `api/bff/reporting`

后续业务域接入时再新增：

- `api/bff/sales`
- `api/bff/procurement`
- `api/bff/inventory`
- `api/bff/manufacturing`
- `api/bff/planning`

### 6.3 当前第一批建议对接的能力

根据现有黑盒文档，当前前端可依赖的 BFF 能力主要是：

- 登录主流程
- OTP challenge
- MFA 完成
- account selection
- session refresh

来源文档：

- [auth-bff-login.md](../contracts/api-gateway/auth-bff-login.md)

说明：

- 前端不应提前假设尚未开放的 BFF HTTP 能力
- 对于未开放的初始化上下文、导航摘要等接口，前端架构可以预留位置，但不要伪造已稳定契约

## 7. 路由装配设计

### 7.1 路由分为三层

建议把路由分成三层理解：

1. 壳层固定路由
2. 模块注册路由
3. 可见性摘要驱动结果

### 7.2 壳层固定路由

由前端维护：

- 根路由
- 登录与认证流程
- 404 / 403 / 错误页
- 工作台默认入口

### 7.3 模块注册路由

由前端在代码中注册：

- 每个模块有哪些可挂载页面
- 页面组件和路由 key 的映射

建议后续按模块维护：

- `router/modules/workbench.ts`
- `router/modules/collaboration.ts`
- `router/modules/tenant-admin.ts`
- `router/modules/inventory.ts`

### 7.4 可见性摘要驱动结果

由后端返回：

- 当前用户可见哪些菜单
- 哪些页面允许进入
- 哪些操作按钮允许显示

前端职责是：

- 以本地模块注册表为基底
- 根据后端摘要筛选并组装最终导航

## 8. 模块设计建议

### 8.1 壳层模块

建议优先固化的壳层模块：

- `workbench`
- `collaboration`
- `tenant-admin`

这三类模块可以在业务域未成熟前先建立稳定入口。

### 8.2 业务域模块

后续业务域模块建议统一采用以下内部结构：

- `pages/`
- `components/`
- `api/`
- `types/`
- `schemas/`
- `routes.ts`

说明：

- `pages/` 放页面容器
- `components/` 放模块内复用组件
- `api/` 放该模块对 BFF 的调用适配
- `schemas/` 放列表列定义、表单 schema、筛选 schema

### 8.3 为什么要强调 schema 层

OES 后续大量是企业表单、列表、详情页场景。

如果不提前把 schema 配置层抽出来，后续会出现：

- 列定义散落
- 表单校验散落
- 权限控制散落
- 复用和调整成本很高

## 9. 与权限和上下文的关系

### 9.1 页面显示不等于真实授权

前端只能处理：

- 菜单可见性
- 页面可见性
- 按钮可见性

真正的写操作授权仍必须由后端判定。

### 9.2 前端必须显式感知上下文

对于 OES 来说，前端后续必须显式感知：

- `tenantId`
- `orgId`
- 当前 account
- 当前 operator
- 当前 terminal

但这些字段的最终 HTTP 契约，应以后续 BFF 文档与代码为准。

## 10. 当前阶段的推荐实施顺序

### 第 1 步

先固化：

- 工作台模块
- 协同与待办模块
- 租户治理模块

### 第 2 步

再补前端架构骨架：

- `modules/` 目录
- store 分层
- API 分层
- 路由模块注册方式

### 第 3 步

等待 BFF 契约成熟后接入：

- 初始化上下文
- 导航摘要
- action codes

### 第 4 步

最后逐步接入业务域：

- 经营与交易
- 供应链与库存
- 制造与计划

## 11. 当前明确不建议的做法

- 不建议把所有状态都继续塞进 `userInfo`
- 不建议前端目录直接镜像后端服务目录
- 不建议在 `router` 中堆所有业务模块页面定义
- 不建议每个业务域都自行发明一套列表 / 表单 / 详情页组织方式
- 不建议在 BFF 契约未冻结前就把假接口写死成最终实现

## 12. 本文档输出的工程结论

当前可直接作为后续实现依据的工程结论：

- `tenant-web` 应新增 `modules/` 作为业务域扩展容器
- 前端状态应分成 `session / auth-context / access / ui`
- API 按前端消费场景分层，不按后端服务分层
- 路由采用“壳层固定 + 模块注册 + 后端摘要筛选”模式
- 第一批优先固化 `workbench / collaboration / tenant-admin`

## 13. 与其他文档的关系

- 产品级信息架构：
  - [tenant-web-information-architecture.md](./tenant-web-information-architecture.md)
- tenant-web 实施计划：
  - [tenant-web-vben-implementation-plan.md](./tenant-web-vben-implementation-plan.md)
- Gateway / BFF 黑盒契约导航：
  - [API Gateway Contracts README](../contracts/api-gateway/README.md)
