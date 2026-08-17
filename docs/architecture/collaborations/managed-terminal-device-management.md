# Managed Terminal Device Management 协同蓝图

> `terminal-device-service` 的服务设计唯一真相源为 [terminal-device-service.md](../services/terminal-device-service.md)。本文只记录 PDA / Admin BFF、`terminal-device-service`、`auth-service`、`permission-service`、`identity-service` 与 `tenant-org-service` 围绕企业受管终端设备治理的协同链路，不重新定义单个服务的长期职责。

## 1. 目标

本文冻结 OES 中“企业受管现场交互终端设备如何入网、绑定租户、进入登录链路、被禁用或退役、上报运行状态、被后台管理与审计”的跨服务协同方式。

Phase 2 只正式支持 `PDA`，但协同模型按 managed terminal device 设计，预留未来 `KIOSK / INDUSTRIAL_TABLET` 等现场交互终端。

## 2. 参与方

- `app/pda`
- `api-gateway / PDA BFF`
- `api-gateway / Admin BFF`
- `terminal-device-service`
- `auth-service`
- `permission-service`
- `identity-service`
- `tenant-org-service`
- `tenant-web`

## 3. 真相归属

- `terminal-device-service`
  - 拥有 managed terminal device registry、enrollment、生命周期状态、租户绑定、运行快照、版本策略、`DeviceAccessDecision` 与设备治理审计事实。
  - Phase 2 只绑定 `tenantId`，不绑定仓库、车间、产线、工位、库区或库位。
- `auth-service`
  - 拥有认证、MFA、active session、refresh token、access token、session revoke 与认证域审计真相。
  - 消费 `terminalDeviceId` 作为 PDA session metadata。
  - 按 `terminalDeviceId + terminal=PDA` revoke sessions。
- `permission-service`
  - 拥有设备管理权限码、角色、policy、授权判定与 Terminal Access Policy 真相。
  - 判断账号是否允许从 `PDA` terminal 建立 session。
- `identity-service`
  - 拥有 `User / UserAccount`、账号归属、账号展示摘要与身份映射真相。
- `tenant-org-service`
  - 拥有租户存在性、租户生命周期与组织结构真相。
- PDA BFF
  - 拥有 `/pda/*` 外部 HTTP 契约、设备 metadata 归一化、DTO 映射和服务编排。
  - 不拥有设备治理、认证、权限或业务规则真相。
- Admin BFF
  - 拥有后台设备管理 HTTP 契约、权限聚合、DTO 映射和服务编排。
  - 不拥有设备生命周期规则、版本策略规则或 session 真相。
- `app/pda`
  - 拥有端侧设备治理体验、Bridge 调用和本地凭证清理执行。
  - 不拥有设备准入、租户归属、登录或权限真相。

## 4. Terminal Device 类型

Phase 2 正式支持：

- `PDA`

模型预留但不实现：

- `KIOSK`
- `INDUSTRIAL_TABLET`
- `SHARED_MOBILE_TERMINAL`

明确不属于本协同：

- 浏览器 trusted login device
- MFA device
- 普通个人手机
- IoT / 机台 / PLC / 传感器
- 固定资产管理里的普通资产

## 5. Enrollment 入网协同

Enrollment 是管理员发放的一次性设备入网授权，不是设备本身。

正常链路：

```text
tenant-web admin
-> Admin BFF create enrollment
-> permission-service authorize terminal-device.enrollment.create
-> terminal-device-service create TerminalDeviceEnrollment
-> Admin BFF returns QR/code to tenant-web
-> PDA scans QR or enters code
-> PDA BFF /pda/device/enroll
-> terminal-device-service validates enrollment and identity signals
-> terminal-device-service creates TerminalDevice(status=ACTIVE)
-> terminal-device-service marks enrollment USED
-> terminal-device-service returns one-time deviceCredential/expiry/version and stores only hash/state/version
-> PDA stores terminalDeviceId and Keystore-encrypted deviceCredential
```

稳定规则：

- 管理员必须先创建 enrollment，PDA 才能正式入网。
- 二维码只承载短期 enrollment code / token，不承载完整设备配置。
- 原始 code / token 不应明文长期保存；服务端应保存 hash 或安全摘要。
- Phase 2 enrollment 固定短期、单次、可撤销。
- 使用成功后 enrollment 变为 `USED`，不可复用。
- 正常激活成功后才创建正式 `TerminalDevice`，状态直接为 `ACTIVE`。
- `PENDING_APPROVAL` 只用于异常场景，不是正常入网必经状态。
- `deviceCredential` 是 Terminal Device Service 自有的设备证明，不是 Auth credential、Execution Principal、Permission grant 或 session。它默认 30 天有效，剩余 7 天内由 heartbeat 轮换，新旧版本最多重叠 5 分钟；之后的设备判定、heartbeat 与诊断写入同时要求 Gateway MACHINE ET 与准确、未过期 device credential。
- `DISABLED / LOST / MAINTENANCE` 暂停 credential，受审计的 ACTIVE restore 恢复；`DECOMMISSIONED` 与重新 enrollment 永久撤销旧 credential。Phase 2 不引入每设备 Machine Principal、设备 mTLS PKI 或硬件私钥签名。
- 使用过期、已使用或已撤销 enrollment 时，PDA BFF 必须拒绝入网并返回 PDA-friendly 错误。
- identity 与预期 serial 不一致、疑似重复设备或 identity conflict 时，PDA 端只展示“需要管理员确认”，不得让现场人员自行恢复旧设备或注册新设备。

## 6. PDA 登录租户解析

PDA 登录租户由受管设备绑定决定，用户登录时不再选择租户。

登录链路：

```text
PDA login form
-> PDA BFF /pda/auth/login with terminalDeviceId + identity metadata
-> terminal-device-service DeviceAccessDecision(requestPurpose=LOGIN)
-> PDA BFF obtains resolvedTenantId
-> auth-service authenticates account in resolvedTenantId with terminal=PDA
-> permission-service checks Terminal Access Policy for PDA
-> auth-service issues session with terminal=PDA and terminalDeviceId
-> PDA stores session through Android Shell secure storage
```

稳定规则：

- PDA 完成 enrollment 后，`TerminalDevice` 绑定唯一 `tenantId`。
- PDA 登录页不提供租户选择。
- PDA BFF 必须先解析设备所属租户，再调用 `auth-service`。
- `auth-service` 只在 resolved tenant 下认证账号。
- 若账号不属于该 tenant，或没有 PDA terminal access，登录失败。
- session 必须记录 `terminal = PDA` 与 `terminalDeviceId`。
- 同一 PDA 如需换租户，必须先由原租户 `DECOMMISSIONED`，再由新租户重新 enrollment。

## 7. DeviceAccessDecision 协同

`DeviceAccessDecision` 是所有 PDA 设备准入判断的统一服务端决策。

典型调用点：

- `/pda/device/enroll`
- `/pda/auth/login`
- `/pda/session/bootstrap`
- `/pda/device/heartbeat`
- `/pda/device/logs`
- 后续 `/pda/*` 业务请求入口

输入应包含：

- `terminalDeviceId`，当已入网时
- `terminalDeviceType`
- `appVersion`
- identity signals
- request purpose
- operator / session context，若已登录
- trace context

输出应包含：

- `allowed`
- `decisionCode`
- `resolvedTenantId`
- `deviceStatus`
- `presenceStatus`
- `versionPolicy`
- `requiredAction`
- `messageKey`
- `shouldClearLocalSession`
- `shouldClearLocalTerminalDeviceId`
- `shouldRevokeServerSessions`

BFF 规则：

- PDA BFF、Admin BFF 和未来业务 BFF 只消费 decision，不复制状态、版本或 identity conflict 判断。
- BFF 可将 decision 映射成前端友好错误码、页面状态或提示文案。
- BFF 不得把 `deviceStatus != ACTIVE` 这类核心规则散落在 controller / DTO / gateway guard 中。

## 8. 生命周期状态与清退协同

生命周期状态：

- `PENDING_APPROVAL`
- `ACTIVE`
- `DISABLED`
- `LOST`
- `MAINTENANCE`
- `DECOMMISSIONED`

状态效果：

| 状态 | 登录 / 业务 | heartbeat / logs | session 处理 | terminalDeviceId |
| --- | --- | --- | --- | --- |
| `ACTIVE` | 允许 | 允许 | 保持 | 保持 |
| `PENDING_APPROVAL` | 阻断 | 允许 | 如存在则清理 | 视具体异常处理 |
| `DISABLED` | 阻断 | 允许 | revoke 并清理本地 session | 保持 |
| `LOST` | 阻断 | 允许 | revoke 并清理本地 session | 保持 |
| `MAINTENANCE` | 阻断 | 允许 | revoke 并清理本地 session | 保持 |
| `DECOMMISSIONED` | 阻断 | 允许有限治理请求 | revoke 并清理本地 session | 清除 |

清退链路：

```text
Admin status command
-> Admin BFF permission check
-> terminal-device-service lifecycle transition
-> terminal-device-service writes audit event
-> terminal-device-service requests or emits session revoke intent
-> auth-service revokes sessions by terminalDeviceId + terminal=PDA
-> PDA receives shouldClearLocalSession on next heartbeat/bootstrap/API response
-> PDA Bridge clears local refresh token
-> if DECOMMISSIONED, PDA also clears local terminalDeviceId
```

稳定规则：

- `DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` 必须触发或请求 `auth-service` revoke 该设备关联的 PDA sessions。
- `DECOMMISSIONED` 是不可直接恢复的终止状态；再次使用必须重新 enrollment。
- `DISABLED / LOST / MAINTENANCE` 可按权限和原因恢复 `ACTIVE`。
- `LOST -> ACTIVE` 属高风险恢复，应要求更高权限或至少独立权限码与强审计。
- PDA 端本地清理是体验与端侧收敛，不是唯一安全边界；服务端请求阻断和 session revoke 才是安全边界。

## 9. Heartbeat 与 Presence 协同

Heartbeat 是运行诊断输入，不是登录真相。

链路：

```text
PDA heartbeat
-> PDA BFF normalizes device/runtime metadata
-> terminal-device-service updates TerminalDeviceRuntimeSnapshot
-> terminal-device-service returns DeviceAccessDecision + versionPolicy + serverTime
-> PDA applies requiredAction
```

稳定规则：

- `lastHeartbeatAt` 使用服务端接收时间。
- `lastClientTime` 只用于诊断客户端时钟偏差。
- `lastReportedAccount` 只表示最近 heartbeat 附带账号，不代表当前登录用户真相。
- 当前有效 session 真相归属 `auth-service`。
- presence 由服务端根据 `lastHeartbeatAt` 推断：
  - `ONLINE`
  - `STALE`
  - `OFFLINE`
  - `UNKNOWN`
- presence 不是生命周期状态，管理员不得手动维护。
- heartbeat 不改变 `ACTIVE / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED`。
- App 关闭、设备锁屏、设备关机或网络断开都只能解释为未收到 heartbeat，Phase 2 不承诺精确区分原因。
- Phase 2 不做前台服务、后台常驻 heartbeat 或开机自启。

## 10. 版本策略协同

版本策略归属 `terminal-device-service`。

维度：

- `tenantId`
- `terminalDeviceType`

策略字段：

- `minSupportedAppVersion`
- `latestAppVersion`
- `upgradeRequired`
- `upgradeRecommended`
- 可选 `apkDownloadUrl`
- 可选 `releaseNotesUrl`

执行规则：

- 低于 `minSupportedAppVersion` 时阻断登录和业务请求。
- 低于 `latestAppVersion` 但不低于 min 时允许继续使用，并提示建议升级。
- heartbeat、diagnostic logs 与升级提示仍允许。
- Phase 2 不做自动升级、热更新、后台静默安装、MDM 或企业应用市场集成。

## 11. 后台管理协同

Phase 2 后台最小闭环：

- enrollment 管理
- 设备列表
- 设备详情
- 状态操作
- 版本策略管理

后台链路：

```text
tenant-web admin page
-> Admin BFF
-> permission-service CheckPermission
-> terminal-device-service command/query
-> auth-service query/revoke PDA sessions when needed
-> Admin BFF aggregates response
```

设备看板字段分层：

- 管理真相字段：
  - `terminalDeviceId`
  - `terminalDeviceType`
  - `tenantId`
  - `displayName`
  - `status`
  - `registeredAt`
  - `enrollmentId`
  - `lastStatusChangedAt`
  - `statusReason`
- identity signals：
  - `manufacturer`
  - `model`
  - `manufacturerSerial`
  - `androidId`
  - `identitySource`
  - `identityConfidence`
- 运行诊断字段：
  - `presenceStatus`
  - `lastHeartbeatAt`
  - `appVersion`
  - `androidVersion`
  - `networkStatus`
  - `batteryLevel`
  - `appState`
  - `lastReportedAccount`

稳定规则：

- `lastReportedAccount` 不能命名或解释为当前登录用户。
- 若后台要展示当前有效 PDA session，必须由 Admin BFF 聚合 `auth-service` session 查询结果。
- 敏感字段读取、诊断日志查看与导出需要独立权限和审计。

## 12. 权限协同

设备管理权限码归属 `permission-service`。

Phase 2 建议权限码：

- `terminal-device.enrollment.create`
- `terminal-device.enrollment.revoke`
- `terminal-device.read`
- `terminal-device.sensitive.read`
- `terminal-device.status.disable`
- `terminal-device.status.mark-lost`
- `terminal-device.status.mark-maintenance`
- `terminal-device.status.restore-active`
- `terminal-device.version-policy.manage`
- `terminal-device.audit.read`

稳定规则：

- 普通读取、敏感读取、状态操作、enrollment、版本策略、审计读取必须分开授权。
- `terminal-device-service` 执行命令时必须接收 operator context、tenant context、trace context 与审计元数据。
- `permission-service` 拥有授权判定真相；`terminal-device-service` 不复制 role / permission / policy 语义。
- 高风险状态变更除权限外还必须填写 reason。

## 13. 审计协同

`terminal-device-service` 拥有设备治理域本地审计事实。

必须审计：

- enrollment 生成
- enrollment 使用
- enrollment 撤销
- 设备状态变更
- 版本策略修改
- 敏感详情访问
- 诊断日志查看
- session revoke 请求或结果摘要

高风险动作必须填写原因：

- `DISABLED`
- `LOST`
- `ACTIVE` restore
- `DECOMMISSIONED`
- 手动 session revoke 请求
- identity conflict 恢复或重新登记

审计至少包含：

- `tenantId`
- `operatorAccountId`
- `operatorOrgId`，如适用
- `action`
- `targetTerminalDeviceId`
- `before / after` 摘要
- `reason`
- `traceId`
- `occurredAt`

Gateway access log 不替代设备治理业务审计。

## 14. 同步 / 异步边界

同步：

- PDA BFF -> `terminal-device-service`：
  - enrollment
  - DeviceAccessDecision
  - heartbeat runtime snapshot
  - version policy
- Admin BFF -> `terminal-device-service`：
  - enrollment command/query
  - device command/query
  - version policy command/query
- Admin BFF / PDA BFF -> `permission-service`：
  - 管理权限或 Terminal Access Policy 判定
- PDA BFF -> `auth-service`：
  - login / refresh / logout
- `terminal-device-service` -> `auth-service`：
  - session revoke by `terminalDeviceId + terminal=PDA`，可同步 command 或异步事件，必须形成可追踪结果

异步：

- 设备状态变更后可发布 device governance event。
- session revoke 可用事件驱动，但安全边界必须确保后续 PDA 请求被服务端阻断。
- 统一 audit / observability 可以订阅设备治理事件，但不替代 `terminal-device-service` 的本地审计事实。

## 15. PDA 端体验协同

Phase 2 PDA 端只新增四类设备治理体验：

- 设备入网页
- 设备受限页
- 版本过低页
- identity conflict / recovery pending 页

稳定规则：

- 本地没有 `terminalDeviceId` 时进入设备入网页。
- 入网页支持扫码 enrollment QR；可保留手输 enrollment code 作为兜底。
- 设备状态受限时必须清理本地 session，停留在设备受限页。
- 版本低于最低支持版本时阻断登录和业务请求。
- identity conflict 时只提示联系管理员，不允许现场人员自行恢复旧设备或注册新设备。
- `DECOMMISSIONED` 后 PDA 必须清理本地 session 与 `terminalDeviceId`。
- Phase 2 不做前台服务、开机自启、实时推送或 MDM 控制。

## 16. 明确禁止

- 禁止 PDA BFF 或 Admin BFF 持久化设备 registry 真相。
- 禁止在 gateway/controller/DTO 中复制设备生命周期、版本策略或 identity conflict 规则。
- 禁止跨服务共享数据库。
- 禁止把 heartbeat 当作用户登录真相。
- 禁止把 `lastReportedAccount` 当作当前登录用户真相。
- 禁止把 managed terminal device 与账号安全 trusted login device 混用。
- 禁止让 `terminal-device-service` 拥有 auth session、MFA、登录历史或 trusted device 真相。
- 禁止让 `terminal-device-service` 拥有 WMS / MES 作业上下文、仓库、车间、产线、工位、库区或库位真相。
- 禁止 Phase 2 承诺 MDM、实时远控、自动升级或后台静默安装。

## 17. 非目标

Phase 2 不做：

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
- 生产设备、IoT、机台、普通资产管理。

## 18. 关联文档

- [0006-terminal-device-service.md](../../adr/0006-terminal-device-service.md)
- [terminal-device-service.md](../services/terminal-device-service.md)
- [pda.md](../terminals/pda.md)
- [terminal-access-policy.md](./terminal-access-policy.md)
- [auth-service.md](../services/auth-service.md)
- [permission-service.md](../services/permission-service.md)
- [identity-service.md](../services/identity-service.md)
- [tenant-org-service.md](../services/tenant-org-service.md)
