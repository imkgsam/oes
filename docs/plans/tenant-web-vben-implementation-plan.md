# OES Tenant Web 底座适配说明

更新时间：2026-04-13

## 1. 文档目的

本文档只负责说明 OES 在 `tenant-web` 中如何使用和收敛 `vue-vben-admin` 底座。

它的职责是：

- 解释 `app/web` 当前底座结构
- 说明哪些 Vben 能力可以继续复用
- 说明哪些模板默认语义必须被 OES 化
- 记录模板残留与底座清理方向

它不负责：

- `tenant-web` 的整体前端工程架构
- 产品级信息架构
- 当前阶段代码改造 checklist
- 登录主链、BFF 契约或前后端联调状态

相关正式文档：

- 前端工程架构：
  - [tenant-web-frontend-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-frontend-architecture.md)
- 产品信息架构：
  - [tenant-web-information-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-information-architecture.md)
- 当前执行状态：
  - [tenant-web-code-refactor-checklist.md](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-web-code-refactor-checklist.md)

## 2. 当前底座判断

### 2.1 `app/web` 的本质

当前 `app/web/` 不是一个普通单应用模板，而是一个保留了 `vue-vben-admin` 核心工程化能力的前端子 monorepo。

它当前具备：

- `pnpm workspace + turbo` 的多应用 / 多包管理
- `apps/*` 作为具体前端应用承载层
- `packages/*` 作为共享能力层
- `internal/*` 作为工程基建层

这意味着 OES 当前拥有的不是“一套后台页面模板”，而是一套可持续演进的 Web 工程底座。

### 2.2 tenant-web 当前可复用的底座能力

对 OES 而言，以下能力可以继续复用：

- 应用启动链路
- 布局装配机制
- 路由守卫与动态路由装配机制
- 请求拦截器与统一请求封装
- 偏好设置、水印、锁屏等企业后台通用壳层能力
- 共享 UI、hooks、stores、styles 和工程基建

结论：

- 后续要替换的重点是“业务语义与契约接入”
- 不是推翻整套底座

## 3. 对底座的本地化理解

### 3.1 工作区分层

从当前仓库实际代码看，`vue-vben-admin` 在 OES 中可拆成四层理解：

1. 工作区基建层
   - `app/web/package.json`
   - `app/web/pnpm-workspace.yaml`
   - `app/web/turbo.json`
   - 负责构建、类型检查、任务编排、包治理
2. 应用装配层
   - `app/web/apps/tenant-web`
   - 负责应用入口、布局装配、路由守卫、应用级 API 与偏好覆盖
3. 共享能力层
   - `app/web/packages/*`
   - 负责 stores、request、locales、layouts、hooks、styles 等跨应用复用能力
4. 内部工程层
   - `app/web/internal/*`
   - 负责 vite、tsconfig、lint 等工程底座

### 3.2 tenant-web 当前运行主链路

当前应用主链路如下：

1. `src/main.ts`
   - 生成带命名空间的本地偏好存储 key
   - 初始化 `preferences`
2. `src/bootstrap.ts`
   - 初始化组件适配器、表单适配器、i18n、pinia、权限指令、路由与布局插件
3. `src/router/guard.ts`
   - 做登录状态检查
   - 在首次进入受保护页面时生成动态菜单和可访问路由
4. `src/api/request.ts`
   - 统一挂载 token、语言头、响应解包、过期处理与 refresh 流程
5. `src/store/auth.ts`
   - 负责认证态相关的前端接入入口

这条链路说明：

- `tenant-web` 已具备前端应用骨架
- OES 后续主要是沿这条骨架替换业务语义，而不是重写骨架

### 3.3 路由与菜单机制为什么还能用

当前路由机制有两个来源：

- `router/routes/modules/*.ts` 中的本地模块路由
- 运行时按后端摘要生成可访问菜单与路由

这套机制对 OES 仍然有价值，因为它允许：

- 核心兜底路由由前端维护
- 菜单与入口可见性由后端摘要驱动
- 前端保留页面组件映射，不把菜单真相落到浏览器本地

### 3.4 哪些默认语义必须被 OES 化

Vben 默认更偏通用后台模板语义，OES 不能直接照搬。必须显式收敛的包括：

- `userInfo` 不能继续承担完整业务上下文真相
- 菜单可见性不能等同于终端准入
- 前端 API 不能继续沿后端服务名扩散
- 登录后的上下文不能继续靠多个零散模板接口拼装
- 动态菜单、默认首页、按钮权限必须逐步转向 BFF 摘要驱动

## 4. OES 接入时必须坚持的底座边界

### 4.1 不把模板默认页面结构当成 OES 领域结构

`tenant-web` 可以复用底座，但不能把模板默认菜单、页面和用户模型直接视为 OES 的长期结构。

### 4.2 不让前端直接依赖系统服务内部语义

前端应依赖 Gateway / BFF 对外聚合后的显式契约，而不是直接拼装：

- `auth-service` 内部会话结构
- `identity-service` 内部实体结构
- `permission-service` 内部角色模板结构

### 4.3 不让底座能力掩盖 OES 语义分层

以下概念必须显式分开：

- 终端准入
- 会话状态
- 业务上下文
- 导航可见性
- 动作权限摘要

如果继续混在底座默认 store 或模板字段里，后续 `platform-web`、PDA、小程序都无法稳定演进。

## 5. 模板残留与清理方向

### 5.1 当前仍值得关注的模板残留

当前仍存在一些需要继续清理的模板残留，例如：

- `_core` 中部分模板化 profile / fallback 页面
- `locale` 中的 `demos.json`
- 与 OES 无关的默认入口、文案和示例语义

这些残留不会立刻阻塞开发，但会持续污染 OES 的语义判断。

### 5.2 清理原则

清理模板残留时，应遵循：

- 优先清语义，不先追求全量删文件
- 不破坏当前运行壳层
- 不把底座清理和 feature 开发混成一个任务
- 所有与当前执行状态相关的清理进度，统一记录到 checklist，而不是写回本文档

## 6. 工程环境约束

当前 `tenant-web` 仍应遵循工作区约束的 Node 版本线：

- `^20.19.0 || ^22.18.0 || ^24.0.0`

如果本机使用明显偏离工作区约束的 Node 版本，可能导致：

- 类型检查结果不稳定
- 构建与运行时差异
- 调试结论失真

## 7. 本文档的使用方式

以下场景适合优先阅读本文档：

- 需要理解 `tenant-web` 当前底座是什么
- 需要判断某个问题属于“底座能力”还是“OES 业务语义”
- 需要清理模板残留
- 需要决定某个能力是复用底座，还是在应用层重新封装

以下场景不应以本文档为主：

- 设计前端整体工程架构
- 设计产品导航和工作台结构
- 追踪当前功能完成状态
- 跟踪 BFF 契约接入进度
