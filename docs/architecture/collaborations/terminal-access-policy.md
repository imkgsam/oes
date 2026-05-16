# Terminal Access Policy 协同蓝图

> `permission-service` 的服务设计唯一真相源为 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本文只记录 `permission-service`、`auth-service` 与 terminal-specific BFF 的协同链路，不重新定义 Terminal Access Policy 的核心对象或长期 owner 边界。

## 1. 目标

本文冻结 OES 中“账号允许从哪些终端登录”的跨服务协同方式。

Terminal Access Policy 是登录 / session 建立前的服务端准入能力，不是前端菜单权限，不是 navigation visibility，也不是客户端自声明 terminal。

## 2. 参与方

- `api-gateway / BFF`
- `auth-service`
- `permission-service`
- `identity-service`
- `tenant-web`
- `app/pda`
- `app/kiosk`

## 3. 真相归属

- `permission-service`
  - 拥有 Terminal Access Policy 策略模型与判定真相。
  - 拥有 role terminal access、account terminal access override、解析规则与管理审计。
- `auth-service`
  - 认证、MFA、session、refresh、token 与认证链路审计边界以 [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md) 为准。
  - 消费 `permission-service` terminal access 判定结果。
  - 不持久化或复制 terminal access 策略真相。
- `api-gateway / BFF`
  - 拥有外部 HTTP terminal-specific 入口。
  - 将 Web / PDA / KIOSK 入口归一化为可信 terminal。
  - 不承担核心准入裁决。
- `identity-service`
  - 按 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 提供账号存在性、账号归属、scope 与 tenant 引用事实。
  - 不拥有 terminal access 策略。
- 前端应用
  - 只消费对应 BFF contract。
  - 不拥有 terminal access 判断规则。

## 4. Terminal 集合

后端第一阶段枚举：

- `WEB`
- `PDA`
- `KIOSK`
- `MOBILE`
- `MINIAPP`

Phase 1 外部登录入口只实现：

- `WEB`
- `PDA`
- `KIOSK`

`MOBILE / MINIAPP` 仅作为策略枚举预留，不实现独立 BFF 登录路径。

`DEFAULT` 只属于 navigation fallback，不属于登录准入 terminal。

`API / MACHINE` 不属于人类账号 terminal access，应走 machine auth / service account。

## 5. BFF 入口边界

外部 HTTP 入口按 terminal 分离：

- `/auth/*`：Web 登录闭环，固定 `terminal=WEB`
- `/pda/auth/*`：PDA 登录闭环，固定 `terminal=PDA`
- `/kiosk/auth/*`：KIOSK 登录闭环，固定 `terminal=KIOSK`

客户端请求不能自由声明 terminal 后被信任。若未来 HTTP payload 携带 terminal 意图，BFF 也必须按入口校验并归一化。

## 6. 登录链路

标准链路：

```text
client
-> terminal-specific BFF HTTP endpoint
-> auth-service gRPC login/account-selection/MFA/refresh
-> permission-service gRPC ResolveAccountTerminalAccess
```

账号密码 / OTP 等主认证通过后，候选账号仍按当前身份链路返回，不在 account options 阶段过滤 terminal access。

用户选择 account 后：

1. `auth-service` 校验 account 属于当前 user。
2. `auth-service` 校验 account 启用状态与 tenant lifecycle。
3. `auth-service` 调用 `permission-service.ResolveAccountTerminalAccess`。
4. 若不允许，返回 `TERMINAL_ACCESS_DENIED`，不创建 MFA challenge，不签发 session。
5. 若允许，再进入 MFA 或直接建立 session。

## 7. Refresh 链路

Refresh 不接受客户端重新声明 terminal。

`auth-service` 必须从已持久化 session / refresh token claims 读取原 terminal，再调用 `permission-service` 重查 terminal access。

若已不允许：

- refresh 失败
- 不签发新 token
- 删除或撤销当前 session
- 记录 `SESSION_REFRESH_DENIED_TERMINAL_ACCESS`

Phase 1 不在每次 access token validation 重查 terminal access。即时清退由管理员 session revoke 能力完成。

## 8. Session Context 与 Navigation

登录成功后的 session context 必须返回：

- `terminal`
- 当前账号最终允许登录终端
- `navigation.defaultEntry`
- `navigation.visibleEntries`

PDA / KIOSK 仍消费通用 navigation entry 模型。后端只返回 entry key，前端各自映射为本端页面、任务入口或工作台入口，不返回 Web route、菜单层级、icon 或 layout 作为跨端真相。

Phase 1 navigation seed 只建立最小系统入口，例如：

- `pda.home`
- `kiosk.home`

外观质检、仓储、车间业务入口随对应业务闭环单独设计。

## 9. 管理协同

Terminal Access 管理接口属于 `api-gateway` 的 permission-management 薄代理范围，不直接暴露运行时判定 RPC。

管理能力：

- role terminal access 读取 / 修改
- account terminal access override 读取 / 修改 / 删除
- current account effective terminal access 读取，用于管理员账号详情和个人中心只读展示

管理写操作必须：

- 使用独立 terminal access permission code
- 校验 operator scope 与目标 role / account scope
- 记录 permission-service 管理审计

## 10. 审计

`auth-service` 必须记录：

- 登录成功，包含 terminal
- `TERMINAL_ACCESS_DENIED`
- `SESSION_REFRESH_DENIED_TERMINAL_ACCESS`

`permission-service` 必须记录：

- role terminal access 管理变更
- account terminal access override 管理变更

Phase 1 不持久化每一次 allow 判定。判定 RPC 仍返回可解释结果，供 `auth-service` 写入认证审计。

## 11. 明确禁止

- 禁止由前端隐藏入口替代服务端准入。
- 禁止客户端自由声明 terminal 后被信任。
- 禁止 `auth-service` 持久化 terminal access 策略真相。
- 禁止 `identity-service` 承载 role-based terminal access 语义。
- 禁止把 navigation visibility 当作 terminal login access。
- 禁止跨服务共享数据库。

## 12. 关联文档

- [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
