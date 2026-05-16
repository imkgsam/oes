# ADR 0006: Terminal Device Service Ownership

日期：2026-05-16

## Status

Accepted

## Context

PDA Phase 1 已完成 Android Shell、Vue3 PDA Web、JS Bridge、`/pda/*` BFF、登录、扫码、拍照、heartbeat 与诊断日志等系统基础能力。Phase 1 明确：

- PDA 是独立 Android 设备端，不是 `tenant-web` 改版。
- `/pda/*` BFF 只做终端聚合和下游服务编排。
- heartbeat 是 PDA App / 设备运行诊断状态，不是用户登录真相。
- Phase 1 不拥有设备 registry、设备禁用、设备绑定、版本治理或设备管理后台。

PDA Device Management Phase 2 需要引入正式设备入网、设备生命周期、设备禁用、设备版本策略、运行快照、后台看板与审计。该能力已经超出 API Gateway / BFF 的聚合职责，也不属于 `auth-service`、`permission-service`、`identity-service` 或 `tenant-org-service` 的既有 bounded context。

同时，OES 还会有独立的 Terminal-aware Account Security 主题，用于讨论登录历史、MFA、trusted login device、管理员会话管理等账号安全能力。该主题与企业受管终端设备治理必须分离，避免把“企业发放并管理的现场终端设备”与“账号安全里的受信登录环境”混为一谈。

## Decision

OES 新增 `terminal-device-service` 作为企业受管现场交互终端设备的真相源。

`terminal-device-service` 管理 managed terminal device，例如：

- `PDA`
- 未来可扩展的 `KIOSK`
- 未来可扩展的 `INDUSTRIAL_TABLET`
- 未来可扩展的共享移动终端

Phase 2 只正式实现 `PDA` 类型，模型和命名预留未来现场触控终端。

核心决策：

- `terminal-device-service` 拥有 terminal device registry、enrollment、生命周期状态、租户绑定、运行快照、版本策略、设备准入决策与设备治理审计。
- PDA 正常入网必须由管理员先创建短期、单次、可撤销 enrollment，PDA 扫码或输入 code 激活后才创建正式 `TerminalDevice`。
- Enrollment 是入网授权，不是设备本身；二维码只承载 enrollment code / token，不承载完整设备配置。
- 正常 enrollment 激活成功后，设备直接进入 `ACTIVE`。
- `TerminalDevice` Phase 2 只绑定 `tenantId`；不绑定仓库、车间、产线、工位、库区或库位。
- PDA 登录时不再选择租户；PDA BFF 先通过 `terminalDeviceId` 解析设备所属 `tenantId`，再让 `auth-service` 在该租户下认证账号。
- `DECOMMISSIONED` 表示设备解除入网 / 退役，是不可直接恢复的终止状态；设备再次使用必须重新 enrollment。
- 非 `ACTIVE` 状态阻断 PDA 登录和业务请求，但允许 enrollment、heartbeat 与 diagnostic logs 等治理 / 诊断请求。
- 设备进入 `DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` 等不可用状态时，必须通过显式协作让 `auth-service` revoke 该 `terminalDeviceId` 关联的 PDA sessions。
- heartbeat 只形成 runtime snapshot 与 presence 推断，不改变设备生命周期状态，也不作为用户登录真相。
- App 版本策略归属 `terminal-device-service`；Phase 2 不做自动升级、热更新、MDM 或企业应用市场集成。
- PDA BFF 与后台 Admin BFF 只做外部契约适配、DTO 映射、权限聚合和服务编排，不持有设备治理规则。
- `terminal-device-service` 必须提供统一 `DeviceAccessDecision` 能力，避免各 BFF 复制状态、版本和准入规则。

## Ownership Boundary

`terminal-device-service` owns：

- `TerminalDevice`
- `TerminalDeviceEnrollment`
- `TerminalDeviceRuntimeSnapshot`
- `TerminalDeviceVersionPolicy`
- `TerminalDeviceAuditEvent`
- device lifecycle status：
  - `PENDING_APPROVAL`
  - `ACTIVE`
  - `DISABLED`
  - `LOST`
  - `MAINTENANCE`
  - `DECOMMISSIONED`
- presence 推断：
  - `ONLINE`
  - `STALE`
  - `OFFLINE`
  - `UNKNOWN`
- enrollment code 生成、校验、使用、过期与撤销语义。
- 设备状态变更、版本策略修改、enrollment 使用与敏感访问审计事实。

`terminal-device-service` does not own：

- 用户认证、密码、MFA、OTP、trusted login device、登录历史、active session 或 token 真相。
- Terminal Access Policy、Role、Permission、Policy 或 access summary 真相。
- `User / UserAccount`、员工、身份映射或账号归属真相。
- 租户生命周期、组织树或仓库 / 车间 / 工厂主数据。
- WMS / MES 作业闭环、库存、工序、库位、工位、产线或任务执行规则。
- IoT、机台、PLC、传感器、普通固定资产或资产折旧 / 盘点。
- MDM、远程擦除、远程锁屏、后台静默安装或实时远程控制。

## Collaboration

PDA 登录链路：

```text
PDA
-> PDA BFF
-> terminal-device-service DeviceAccessDecision
-> auth-service login in resolved tenant
-> permission-service Terminal Access Policy
-> auth-service session issuance
```

后台管理链路：

```text
tenant-web admin page
-> Admin BFF
-> permission-service authorization
-> terminal-device-service command/query
-> auth-service session query/revoke when needed
```

状态变更清退链路：

```text
admin status command
-> terminal-device-service lifecycle transition
-> device governance audit
-> auth-service revoke PDA sessions by terminalDeviceId
-> PDA clears local session and, when decommissioned, local terminalDeviceId on next heartbeat/bootstrap/API response
```

## Consequences

正向影响：

- 设备治理规则从 PDA BFF 中抽离，避免 gateway/controller 演变成设备治理服务。
- 设备准入、禁用、版本策略和审计拥有明确 bounded context。
- PDA 登录租户由受管设备绑定决定，减少现场跨租户误登录风险。
- auth/session 真相仍由 `auth-service` 拥有，权限语义仍由 `permission-service` 拥有。
- 后续 KIOSK / 工业平板可以复用同一服务边界，而不是复制 PDA 专用服务。

代价：

- 新增一个服务真相源、内部契约、BFF 契约与服务间协作链路。
- PDA 登录、bootstrap、heartbeat 与业务请求需要消费设备准入决策。
- 设备状态变更需要与 `auth-service` 建立 session revoke 协作。
- 管理端需要新增 enrollment、设备列表、设备详情、状态操作与版本策略能力。

## Alternatives Considered

### 继续由 PDA BFF 持有设备治理规则

实现较短，但违反 Phase 1 边界。设备 registry、禁用、版本策略与审计会把 gateway 推向核心业务服务，且后续 KIOSK / 工业平板难以复用。

### 放入 auth-service

`auth-service` owns 认证、session、token、MFA 与账号安全设备语义，但不应拥有企业受管现场终端设备 registry。把设备治理放入 auth 会混淆 managed terminal device 与 trusted login device。

### 放入 permission-service

`permission-service` owns 授权事实、Terminal Access Policy 与权限判定，不应拥有设备生命周期、enrollment、运行快照或版本策略。设备状态可作为准入输入，但不是权限模型本身。

### 放入 tenant-org-service

`tenant-org-service` owns 租户、组织和组织结构，不应拥有 PDA 设备身份、运行状态、版本策略、禁用或 enrollment。

### 命名为 device-service

名称过宽，容易吸收 IoT、机台、资产设备、浏览器 trusted device 与 MFA device 等不同领域对象。`terminal-device-service` 更准确表达“企业受管交互终端设备”边界。

### 命名为 pda-device-service

名称过窄，无法自然扩展到 KIOSK、工业平板或共享移动终端。

## Non-goals

Phase 2 明确不做：

- WMS / MES 业务闭环。
- 仓库、车间、产线、工位、库区、库位绑定。
- 设备分组策略。
- 离线业务提交。
- 自动升级、热更新、后台静默安装。
- MDM / 企业应用市场集成。
- 实时远程控制、远程锁屏、远程擦除。
- 前台服务、后台常驻 heartbeat、开机自启。
- 蓝牙打印、NFC。
- 照片上传或业务附件服务。
- 账号安全 trusted device、MFA、登录历史、管理员会话管理。
- 生产设备、IoT、机台、资产管理。
- 把 heartbeat 当作登录真相。
- 把 `lastReportedAccount` 当作当前登录用户真相。

## Related Documents

- [terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)
- [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md)
- [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
- [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)
- [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
