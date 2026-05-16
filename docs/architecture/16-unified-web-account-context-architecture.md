# Unified Web And Scope-aware Account Context Architecture

更新时间：2026-04-11

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只定义统一 Web account context 如何消费权限摘要与导航授权，不重新定义 Role、AccountRole、Policy、access summary 或 navigation governance 的 owner 边界。

## 1. 文档目的

本文档定义 OES 统一 Web Shell、scope-aware `UserAccount`、登录上下文、上下文切换与前后端协作模型。

本文档覆盖以下问题：

- 系统管理员是否需要 account。
- 系统管理员不属于租户时如何登录。
- 租户用户与系统管理员如何复用同一个 Web 前端。
- `UserAccount` 如何同时表达系统账号与租户账号。
- 登录、账户选择、上下文切换、token、导航和权限如何协作。

本设计覆盖 `tenant-web` 与未来 `platform` 区域的统一 Web 方向。它不改变后端 bounded context 边界，也不允许跨服务共享数据库。

其中 `auth-service` 的长期服务边界、account selection、session、token 与 context switch 语义只以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准；本文只描述统一 Web 与 scope-aware account context 对各服务的协同影响。

## 2. 核心结论

OES 采用统一 Web Shell，但必须保留清晰的上下文边界。

核心结论：

- `User` 表示自然人身份。
- `UserAccount` 表示自然人在某个工作上下文中的账号。
- `UserAccount.scopeLevel = SYSTEM` 表示系统管理账号。
- `UserAccount.scopeLevel = TENANT` 表示租户账号。
- 系统管理员需要 account，但不需要 tenant。
- 租户账号必须绑定 tenant。
- 系统账号必须不绑定 tenant。
- 登录后选择的不再只是 tenant account，而是当前工作上下文 account。
- session、navigation、access、audit 都必须以当前 account scope 为边界。

## 3. 概念模型

### 3.1 User

`User` 是自然人身份真相。

职责：

- 登录标识，例如邮箱、手机号、用户名。
- 用户是否启用。
- 自然人的基础身份信息。

`User` 不表达当前登录属于哪个租户，也不表达系统管理员权限。

### 3.2 UserAccount

`UserAccount` 是自然人在一个工作上下文中的账号。

目标语义：

```txt
UserAccount = User + Scope + Context
```

其中：

- `SYSTEM` account 表示系统管理后台身份。
- `TENANT` account 表示某个租户下的账号身份。

建议目标字段：

```prisma
enum UserAccountScopeLevel {
  SYSTEM
  TENANT
}

model UserAccount {
  id          String                @id @default(uuid())
  userId      String
  scopeLevel  UserAccountScopeLevel
  contextKey  String
  tenantId    String?
  displayName String?
  isEnable    Boolean               @default(true)
  avatarUrl   String?
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  User        User                  @relation(fields: [userId], references: [id])
  Tenant      Tenant?               @relation(fields: [tenantId], references: [id])

  @@unique([userId, scopeLevel, contextKey])
  @@index([scopeLevel])
  @@index([tenantId])
}
```

字段规则：

- `scopeLevel = SYSTEM` 时，`tenantId = null`。
- `scopeLevel = SYSTEM` 时，`contextKey = "SYSTEM"` 或稳定系统上下文 key。
- `scopeLevel = TENANT` 时，`tenantId` 必填。
- `scopeLevel = TENANT` 时，`contextKey = tenantId`。
- 同一 `userId` 下同一 `scopeLevel + contextKey` 只能有一个 account。

数据库层如果不能用 Prisma 直接表达条件约束，应在 application 层强制校验，并视情况补数据库 partial index 或 check constraint。

### 3.3 Tenant

`Tenant` 仍然只表达租户隔离边界。
`Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只定义统一 Web account context 如何引用 tenant 上下文。

约束：

- 不创建 fake tenant 表示平台。
- 不把系统管理员挂到某个“平台租户”下。
- 租户数据范围仍以 `tenantId` 为边界。

### 3.4 Session Context

session context 表示当前登录会话选定的工作上下文。

建议统一模型：

```ts
type SessionScopeLevel = 'SYSTEM' | 'TENANT';

interface WebSessionContext {
  scopeLevel: SessionScopeLevel;
  operator: {
    userId: string;
    accountId: string;
    displayName?: string;
    avatarUrl?: string;
  };
  account: {
    accountId: string;
    scopeLevel: SessionScopeLevel;
    displayName?: string;
    avatarUrl?: string;
  };
  tenant: null | {
    tenantId: string;
    code?: string;
    name: string;
  };
  org: null | {
    orgId: string;
    name: string;
  };
  navigation: {
    defaultHomePath: string;
    menus: unknown[];
  };
  access: {
    actionCodes: string[];
  };
}
```

系统账号示例：

```json
{
  "scopeLevel": "SYSTEM",
  "operator": {
    "userId": "usr_admin",
    "accountId": "acc_system",
    "displayName": "System Admin"
  },
  "account": {
    "accountId": "acc_system",
    "scopeLevel": "SYSTEM",
    "displayName": "系统管理后台"
  },
  "tenant": null,
  "org": null,
  "navigation": {
    "defaultHomePath": "/platform/home",
    "menus": []
  },
  "access": {
    "actionCodes": []
  }
}
```

租户账号示例：

```json
{
  "scopeLevel": "TENANT",
  "operator": {
    "userId": "usr_user",
    "accountId": "acc_tenant_a",
    "displayName": "Vic Chen"
  },
  "account": {
    "accountId": "acc_tenant_a",
    "scopeLevel": "TENANT",
    "displayName": "Vic Chen @ Meilong"
  },
  "tenant": {
    "tenantId": "tenant_a",
    "name": "Meilong Ceramics"
  },
  "org": null,
  "navigation": {
    "defaultHomePath": "/tenant/workbench",
    "menus": []
  },
  "access": {
    "actionCodes": []
  }
}
```

## 4. 登录流程

### 4.1 统一主认证

前端继续使用统一登录入口。

认证阶段只回答：

- 用户是谁。
- 凭证是否正确。
- 是否需要 MFA。

认证阶段不应该把系统管理员和租户用户拆成两套登录页或两套登录接口。

### 4.2 主认证成功后的上下文决策

主认证成功后，`auth-service` 应通过 `identity-service` 查询当前 user 可用 accounts。

当前稳定流程：

```txt
primary auth success
  -> list available UserAccounts by userId
  -> zero accounts: NO_AVAILABLE_CONTEXT
  -> one account: ACCOUNT_SELECTION_REQUIRED
  -> multiple accounts: ACCOUNT_SELECTION_REQUIRED
```

`available accounts` 包括：

- `SYSTEM` accounts
- `TENANT` accounts

这意味着：

- 只有系统管理员账号或只有一个租户账号的用户，当前阶段仍进入 account selection；单 account 自动进入是 future optimization，不作为当前 `auth-service` 稳定行为。
- 同时拥有系统账号和多个租户账号的用户，需要选择工作上下文。

### 4.3 Context Selection

`account selection` 的目标语义升级为 `context selection`。

建议响应：

```json
{
  "status": "CONTEXT_SELECTION_REQUIRED",
  "nextStep": "SELECT_CONTEXT",
  "operator": {
    "userId": "usr_123",
    "displayName": "Vic Chen"
  },
  "contextOptions": [
    {
      "accountId": "acc_system",
      "scopeLevel": "SYSTEM",
      "displayName": "系统管理后台",
      "tenantId": null
    },
    {
      "accountId": "acc_tenant_a",
      "scopeLevel": "TENANT",
      "displayName": "Meilong Ceramics",
      "tenantId": "tenant_a"
    }
  ]
}
```

兼容策略：

- 短期可以继续使用 `ACCOUNT_SELECTION_REQUIRED` 状态名。
- 但 payload 中必须增加 `scopeLevel`。
- 前端页面文案应逐步从“选择账户”升级为“选择工作空间 / 工作上下文”。

### 4.4 No Available Context

如果用户身份验证成功，但没有任何启用 account，应返回无可用上下文。

建议语义：

```json
{
  "status": "DENIED",
  "reasonCode": "NO_AVAILABLE_CONTEXT",
  "message": "当前用户暂无可进入的工作空间，请联系管理员。"
}
```

不建议继续使用只面向租户账号的 `AUTH_NO_AVAILABLE_ACCOUNT` 作为前端展示语义。

## 5. Token 与上下文切换

### 5.1 Token Claims

access token 必须携带当前 session scope 的关键事实。

系统 session：

```json
{
  "sub": "usr_admin",
  "sessionId": "sess_001",
  "accountId": "acc_system",
  "scopeLevel": "SYSTEM",
  "tenantId": null,
  "orgId": null
}
```

租户 session：

```json
{
  "sub": "usr_user",
  "sessionId": "sess_002",
  "accountId": "acc_tenant_a",
  "scopeLevel": "TENANT",
  "tenantId": "tenant_a",
  "orgId": "org_001"
}
```

### 5.2 Context Switch

切换当前工作上下文必须由后端验证并重新签发 token。

建议接口：

```http
POST /auth/session/switch-context
```

请求：

```json
{
  "accountId": "acc_tenant_b"
}
```

后端必须验证：

- 当前 session 有效。
- 当前 user 拥有目标 account。
- 目标 account 启用。
- 如果目标 account 是 `TENANT`，目标 tenant 启用。
- 如果目标 account 是 `SYSTEM`，不得携带 tenant scope。

响应：

```json
{
  "session": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 3600
  },
  "context": {
    "scopeLevel": "TENANT",
    "account": {
      "accountId": "acc_tenant_b",
      "displayName": "Meilong Trading"
    },
    "tenant": {
      "tenantId": "tenant_b",
      "name": "Meilong Trading"
    },
    "navigation": {
      "defaultHomePath": "/tenant/workbench",
      "menus": []
    },
    "access": {
      "actionCodes": []
    }
  }
}
```

建议上下文切换时轮换 refresh token，至少必须签发新的 access token。

## 6. 权限与菜单

### 6.1 Permission Scope

权限判定必须显式区分：

- `SYSTEM`
- `TENANT`

系统权限：

- 不依赖 `tenantId`。
- 适用于平台治理能力，例如租户管理、全局角色模板、系统配置、平台审计。

租户权限：

- 必须绑定 `tenantId`。
- 适用于租户内业务操作，例如组织、库存、生产、销售、审批。

### 6.2 Navigation Summary

BFF 返回菜单时必须按当前 session context 聚合。

系统账号：

- 返回 `/platform/*` 菜单。
- 默认首页建议 `/platform/home`。

租户账号：

- 返回 `/tenant/*` 或现有租户业务菜单。
- 默认首页建议 `/tenant/workbench` 或当前阶段兼容 `/workbench/home`。

前端不应通过本地硬编码判断“是否系统管理员能看到平台菜单”。菜单与 action codes 必须以后端 summary 为准。

## 7. 统一 Web 前端影响

### 7.1 应用形态

短中期建议保留一个 Web 应用。

当前 `apps/tenant-web` 可以先作为统一 Web Shell 的承载应用继续演进，后续是否重命名为 `apps/web` 或 `apps/console-web` 可单独决策。

推荐模块边界：

```txt
src/modules/
  platform/
  tenant/
  workbench/
  shared/
```

推荐路由边界：

```txt
/auth/*
/platform/*
/tenant/*
```

### 7.2 顶部用户区

顶部用户区应显示当前 account/context，而不是假设永远存在租户。

展示规则：

```ts
const displayName = context.account.displayName ?? context.operator.displayName;
const description =
  context.scopeLevel === 'SYSTEM'
    ? '系统管理后台'
    : context.tenant?.name;
```

### 7.3 上下文切换入口

用户下拉中应提供“切换工作空间 / 切换账号”入口。

候选项来自 BFF：

```http
GET /auth/session/contexts
```

前端选择后调用：

```http
POST /auth/session/switch-context
```

成功后必须：

- 更新 token。
- 重新拉取 session context。
- 重置菜单与 action codes。
- 跳转到新 context 的 `defaultHomePath`。

## 8. 服务改造影响

### 8.1 identity-service

需要调整：

- `UserAccount.tenantId` 改为可空。
- 增加 `scopeLevel`。
- 增加 `contextKey`。
- `findAvailableByUserId` 返回 `SYSTEM` 与 `TENANT` accounts。
- account 创建、更新、查询必须校验 scope 与 tenant 的一致性。

不允许：

- 系统账号绑定 tenant。
- 租户账号缺少 tenant。
- 用 fake tenant 承载系统账号。

### 8.2 auth-service

服务设计、认证续流、account selection、session、token 与 context switch 语义以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。

本文只冻结统一 Web 对 `auth-service` 的协同影响：

- account candidate / session context / token payload 需要携带 `scopeLevel`。
- `SYSTEM` session 的 `tenantId` 为空，`TENANT` session 的 `tenantId` 必填。
- 当前阶段保留 account selection 主流程；单 account 自动建立 session 只作为后续优化方向。

### 8.3 permission-service

需要调整：

- 授权上下文接受 `scopeLevel`。
- system-scope 权限不依赖 tenant。
- tenant-scope 权限继续 fail-closed 校验 tenant。
- 菜单与 action code 解析支持两类 scope。

### 8.4 api-gateway / BFF

需要调整：

- 登录响应增加 `scopeLevel`。
- account option 增加 `scopeLevel` 与 nullable `tenantId`。
- session context 支持 `SYSTEM` 与 `TENANT`。
- 增加 context list / switch context 能力。
- 导航与权限摘要按当前 context 聚合。

## 9. 迁移建议

### 9.1 第一阶段：模型兼容

- 为 `UserAccount` 增加 `scopeLevel`，默认历史数据为 `TENANT`。
- 为 `UserAccount` 增加 `contextKey`，历史租户账号填充为 `tenantId`。
- 将 `tenantId` 调整为可空，但应用层保持租户账号必填。

### 9.2 第二阶段：系统账号接入

- 增加系统账号创建能力。
- 为首批平台管理员创建 `SYSTEM` account。
- 登录后查询 accounts 时返回系统账号。
- BFF response 增加 `scopeLevel`。

### 9.3 第三阶段：上下文切换

- 增加 `GET /auth/session/contexts`。
- 增加 `POST /auth/session/switch-context`。
- 前端用户下拉接入上下文切换。

### 9.4 第四阶段：菜单与权限摘要

- BFF 根据当前 `scopeLevel` 返回平台或租户菜单。
- permission-service 返回 system 或 tenant action codes。
- 前端移除本地 fallback 菜单依赖。

## 10. 风险与约束

### 10.1 与租户隔离的关系

本设计不会弱化租户隔离。

原因：

- `TENANT` account 仍必须绑定 `tenantId`。
- `SYSTEM` account 不进入租户数据范围。
- 任何租户资源访问仍必须走 tenant-bound scope。

### 10.2 与 bounded context 的关系

前端合并为统一 Web Shell 不意味着后端 bounded context 合并。

后端仍保持：

- `auth-service` 的认证、session 与 token 边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。
- `identity-service` 的 user / account / scope / tenant 引用边界以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。
- permission-service 负责角色、权限、policy 与授权摘要。
- api-gateway / BFF 负责客户端契约聚合与防腐层。

### 10.3 与审计的关系

审计事件必须记录：

- `operatorId`
- `accountId`
- `scopeLevel`
- `tenantId`，system scope 下为空
- `orgId`，如适用
- `traceId`

不能只记录 `userId`，否则无法还原当时的工作上下文。

### 10.4 与 AI 的关系

AI 工具调用必须消费当前 session context。

系统 scope 下：

- 可以访问平台治理工具。
- 不默认拥有任何租户业务数据访问权。

租户 scope 下：

- 只能访问当前 tenant scope 授权范围内的数据。

## 11. 当前实现状态

更新时间：2026-04-11

已完成的代码落地：

- `identity-service` 的 `UserAccount` 已升级为 scope-aware account，支持 `SYSTEM / TENANT`。
- `SYSTEM` account 允许 `tenantId = null`，`TENANT` account 继续要求有效 tenant。
- `identity-service` account 查询、mapper、repository、gRPC response 已返回 `scopeLevel`。
- `auth-service` account candidate、account selection、session、token payload 已携带 `scopeLevel`。
- `api-gateway / auth-bff` 登录响应和 session context 已兼容 `SYSTEM` account。
- `auth-bff` 的 session context 在 `SYSTEM` scope 下返回 `tenant: null`，默认首页为 `/platform/home`。
- `tenant-web` 的账户选择、session context 类型与用户展示已兼容系统平台账户。
- 本地测试数据脚本已补充一个 `SYSTEM` account，便于联调系统管理员上下文。

仍需后续推进：

- 当前主认证成功后仍进入 account selection 流；“只有一个 account 时自动建立 session”需要在 auth application 层补设备上下文后再做，避免在 gRPC controller 中硬塞 session 发行逻辑。
- `/platform/*` 的真实路由、菜单、权限摘要还未实现，目前只是 session context 的默认入口占位。
- permission-service 需要继续补齐 system-scope role / policy / action-code 聚合，避免系统权限依赖 `tenantId`。
- context switch 需要后续作为独立接口实现，切换 account 后必须重新签发 token、刷新菜单与权限摘要。

## 12. 设计摘要

本设计的核心是：

```txt
User = 自然人
UserAccount = 自然人在某个工作上下文中的账号
SYSTEM UserAccount = 系统管理员账号，不绑定 tenant
TENANT UserAccount = 租户账号，必须绑定 tenant
Session Context = 当前选中的 UserAccount + scope + navigation + access
```

因此：

- 系统管理员需要 account，但不是 tenant account。
- 租户用户需要 tenant account。
- 同一个用户可以拥有多个 accounts。
- 登录后如有多个 accounts，选择的是工作上下文。
- 切换工作上下文必须重新签发 token。
- 前端可以统一为一个 Web Shell，但后端权限和数据边界仍必须按 scope 严格隔离。
