# ADR 0005: Terminal Access Policy Ownership And Login Enforcement

> 当前 `permission-service` 服务职责、Terminal Access Policy 核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本 ADR 只保留 terminal access ownership 与登录链路 enforcement 的架构决策记录。

日期：2026-05-11

## Status

Accepted

## Context

OES 将支持多个面向不同场景的交互终端：

- `WEB`：tenant-web / Web 管理端 / 浏览器办公端
- `PDA`：现场手持设备端
- `KIOSK`：固定工位触摸屏，例如外观质检台
- `MOBILE`：未来移动办公 App
- `MINIAPP`：未来小程序

终端准入不是菜单可见性，也不是前端隐藏入口。它回答的是：

> 某个 `account` 在当前租户 / scope / role 上下文下，是否允许从某类 terminal 建立或继续 session。

该能力涉及权限语义、登录链路、session / token metadata、BFF 可信入口、审计与迁移，必须先冻结架构边界再实现。

## Decision

OES 采用 `permission-service` 拥有 Terminal Access Policy 真相、`auth-service` 在登录和 refresh 链路消费判定、BFF 按终端入口归一化 terminal 的设计。

具体决策：

- Terminal Access Policy 真相归属 `permission-service`。
- 不新建独立 terminal-access 微服务。
- `auth-service` 不拥有策略模型，只在 session 建立前和 refresh 时调用 `permission-service` 判定。
- `api-gateway / BFF` 拥有外部 HTTP 入口与 terminal 归一化：
  - `/auth/*` 固定为 `WEB`
  - `/pda/auth/*` 固定为 `PDA`
  - `/kiosk/auth/*` 固定为 `KIOSK`
- 客户端不能自由声明 terminal 后被信任。
- 运行时内部同步判定走专用 gRPC：`PermissionTerminalAccessService.ResolveAccountTerminalAccess`。
- 管理端配置 / 展示走 `api-gateway` 管理契约，不直接暴露运行时判定 RPC。

## Policy Model

Terminal Access Policy 的判定对象是 `account`，不是自然人 `user`。

第一阶段模型：

```text
RoleTerminalAccess:
  roleId
  allowedTerminals[]

AccountTerminalAccessOverride:
  accountId
  scopeLevel
  tenantId
  allowedTerminals[]
```

解析规则：

```text
if account override exists:
  effectiveAllowedTerminals = override.allowedTerminals
else:
  effectiveAllowedTerminals = union(active role allowedTerminals)
```

规则说明：

- 未配置 role terminal access 默认拒绝。
- 多 active role 采用 allow union。
- account override 只要存在就完全替代 role union。
- account override `allowedTerminals=[]` 表示账号级全终端封禁。
- role 空配置与未配置不做治理语义区分，运行时都等价为不提供 terminal access。
- Phase 1 不引入 `DENY`、`EXTEND`、override `mode`、`effectiveAt`、`expiresAt`。
- role template 可以配置默认 terminal access；从 template 创建 role instance 时复制配置。
- 运行时只读取真实 role instance，不读取 template。
- template 修改不自动同步已有 role instance。

## Login And Session Enforcement

登录链路顺序：

```text
primary credential ok
-> account selection
-> tenant lifecycle check
-> terminal access check
-> MFA if required
-> session/token issuance
```

Terminal access 判定发生在 account selection 之后、MFA challenge 创建之前。拒绝时：

- 不创建 MFA challenge
- 不签发 session / token
- HTTP 返回业务型 `DENIED`
- `reasonCode = TERMINAL_ACCESS_DENIED`
- 不向登录端返回 `effectiveAllowedTerminals`

session / token 必须绑定 terminal：

- session storage 持有 terminal
- access token claims 持有 terminal
- refresh token claims 持有 terminal
- `ValidateAccessTokenResponse` 返回 terminal
- session context 返回 terminal

Refresh 时必须基于原 session terminal 重查 terminal access。若失效：

- 拒绝 refresh
- 不签发新 token
- 删除或撤销当前 session
- 记录 `SESSION_REFRESH_DENIED_TERMINAL_ACCESS`

Phase 1 不在每次 access token validation 时重查 terminal access。若管理员需要策略变更立即生效，应配合 session revoke 能力。

## Management And UI

管理 UI 第一阶段采用对象内嵌：

- 角色详情：配置 role 默认 terminal access。
- 管理员账号详情：展示当前账号最终允许终端，并提供“账号专属终端准入”开关。
- 个人中心：只读展示当前账号最终允许终端，不允许修改。

Phase 1 管理 UI 只显示 `WEB / PDA / KIOSK`；后端枚举预留 `MOBILE / MINIAPP`。

租户管理员可以在本租户边界内管理：

- 本租户 role instance 的 terminal access。
- 本租户账号的 terminal access override。

系统管理员可以管理：

- system role instance / template 的 terminal access。
- system account 的 terminal access override。

所有管理写操作必须经过：

- 独立 terminal access 权限码
- 租户 / scope 边界校验
- 管理审计

## Consequences

正向影响：

- 登录准入真相与 role / account-role 授权治理保持同源。
- `auth-service` 保持认证 / session 真相，不复制权限语义。
- Web / PDA / KIOSK 入口可信，避免客户端伪造 terminal。
- refresh 可阻断已失效 terminal access。
- 后续可在不改变登录主链的前提下扩展管理诊断、有效期、审批流。

代价：

- 需要新增 permission-service gRPC contract、持久化模型、seed 与管理接口。
- 登录 / refresh 链路新增对 permission-service 的运行时依赖。
- 默认拒绝要求迁移 / seed 先补齐现有 Web 角色的 `WEB` 准入。

## Alternatives Considered

### 通用 ABAC / policy AST

优点是表达力强。缺点是 Phase 1 过重，登录硬准入解释成本高，不利于管理端理解和审计排查。

### auth-service 本地维护

实现短，但会复制 role / account-role 授权语义，违反 `auth-service` 与 `permission-service` 的边界。

### 新建 terminal-access 服务

服务拆分过细，当前缺乏独立 bounded context 证据。Terminal Access Policy 与 role / account-role 治理高度耦合，应留在 `permission-service` 内部。

## Related Documents

- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
