# ADR 0001: Unified Web Shell And Scope-aware UserAccount

日期：2026-04-11

## 状态

Accepted

## 背景

OES 早期前端规划曾倾向于将 `platform-web` 与 `tenant-web` 拆成两个独立 Web 应用。随着认证、工作台、账户选择与前端壳层逐步落地，当前出现了一个关键冲突：

- 租户用户登录后需要选择租户账号。
- 系统管理员不应归属于任何租户。
- 现有登录流程又默认要求登录后必须存在可用 `UserAccount`。

如果为系统管理员单独建立一套 `SystemPrincipal`，会导致用户展示、登录上下文切换、审计与权限绑定出现两套人类账号语义。项目当前更希望复用 `UserAccount`，让系统管理员也拥有账号，但该账号不绑定租户。

## 决策

OES 采用以下目标设计：

1. Web 前端采用统一 Web Shell。
2. `UserAccount` 从“租户账号”升级为“用户在某个工作上下文中的账号”。
3. `UserAccount` 必须支持 `SYSTEM` 与 `TENANT` 两类 scope。
4. 系统管理员使用 `scopeLevel = SYSTEM` 的 `UserAccount` 登录。
5. 租户用户使用 `scopeLevel = TENANT` 的 `UserAccount` 登录。
6. `SYSTEM` account 不绑定 `tenantId`。
7. `TENANT` account 必须绑定 `tenantId`。
8. 登录后的 `account selection` 语义升级为 `context / account selection`。
9. 切换当前工作上下文必须由后端重新签发 token。

## 不采用的方案

### 独立 SystemPrincipal

不采用单独 `SystemPrincipal` 作为系统管理员展示和登录身份。

原因：

- 与 `UserAccount` 形成并行账号语义。
- 前端顶部用户展示、上下文切换和审计要兼容两套来源。
- 后续系统管理员同时具备租户账号时，仍然需要再做聚合。

### 为系统管理员创建假租户

不采用“平台租户”或“系统租户”来承载系统管理员。

原因：

- 会污染租户隔离边界。
- 审计、权限、菜单和数据范围会误以为系统管理员属于某个租户。
- 与项目“禁止用实现便利破坏边界”的原则冲突。

### 两套登录页和两套登录接口

不采用 `tenant login` 与 `system admin login` 完全分离。

原因：

- 登录能力会重复，包括密码、OTP、MFA、滑块、refresh、审计、风控。
- 同一自然人同时拥有系统账号与租户账号时，用户体验和代码都会分叉。
- 与统一 Web Shell 的方向冲突。

## 影响

### 对 identity-service

- `UserAccount` 需要增加 scope 语义。
- `tenantId` 需要允许在 `SYSTEM` account 下为空。
- 查询可用账号时需要同时返回 `SYSTEM` 与 `TENANT` accounts。

### 对 auth-service

- 登录后不再假设所有账号都绑定租户。
- 如果只有一个可用 account，可以直接建立对应 scope session。
- 如果有多个可用 account，返回 context selection。
- 如果没有任何可用 account，返回无可用上下文错误。

### 对 permission-service

- 权限解析必须显式区分 `SYSTEM` scope 与 `TENANT` scope。
- 系统级权限不得依赖 `tenantId`。
- 租户级权限仍必须绑定 `tenantId`。

### 对 api-gateway / BFF

- 登录响应和 session context 需要包含 `scopeLevel`。
- `account.tenantId` 在 `SYSTEM` scope 下可为空。
- 菜单与 action codes 需要按当前 session scope 聚合。

### 对前端

- 保留一个统一 Web Shell。
- 前端顶部显示“当前账号 / 当前工作上下文”，而不是假设永远是租户账号。
- 登录后根据 `scopeLevel` 进入 `/platform/*` 或 `/tenant/*` 区域。
- 上下文切换后必须刷新 token、菜单、权限与当前首页。

## 后续要求

实现前必须先更新：

- identity account schema 设计
- auth-bff 登录契约
- session context 契约
- permission system-scope 授权设计
- unified web shell 前端架构文档

## 当前落地状态

更新时间：2026-04-11

本 ADR 的第一阶段代码已落地：

- `identity-service` 已支持 scope-aware `UserAccount`。
- `auth-service` 已在候选 account、account selection、session 与 token payload 中传播 `scopeLevel`。
- `api-gateway / auth-bff` 已允许 `SYSTEM` account 没有 `tenantId`，并在 session context 中返回 `tenant: null`。
- `tenant-web` 已能展示系统平台账户，并能消费 `SYSTEM / TENANT` session context。
- 测试数据脚本已补充系统平台 account，方便浏览器联调。

尚未落地的部分：

- 单 account 自动进入当前仍暂缓，原因是主认证 gRPC request 尚未携带完整 device context，session 发行仍集中在 account selection use case。
- 平台侧 `/platform/*` 真实页面、平台导航与 system-scope 权限摘要仍需后续按模块推进。
