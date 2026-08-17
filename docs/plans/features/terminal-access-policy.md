# Terminal Access Policy Feature Packet

> 服务设计唯一真相源：[permission-service.md](../../architecture/services/permission-service.md)。本文只记录 Terminal Access Policy feature 的范围、执行状态与验收要求；Terminal Access Policy 的 owner、核心对象、解析规则与长期边界不在本文重复定义。

## 1. 目标

冻结并实现 OES 的 Terminal Access Policy：控制账号允许从哪些人类交互终端建立和继续 session。

## 2. 范围

包含：

- `permission-service` Terminal Access Policy 策略模型与运行时解析。
- `auth-service` 登录 / refresh 链路接入。
- Web / PDA / KIOSK BFF terminal-specific 登录入口。
- session / token / session context terminal metadata。
- role terminal access 与 account override 管理能力。
- tenant-web 管理 UI 与个人中心只读展示。
- 最小 PDA / KIOSK navigation entry seed。
- 测试与迁移验证。

不包含：

- PDA / KIOSK 业务闭环。
- 移动端 / 小程序登录入口实现。
- 大屏看板 device access。
- 生物识别、手势认证或设备摄像头能力。
- Terminal access 影响账号数预览。
- 专门诊断 / preview 页面。
- Override 有效期、审批流、DENY / EXTEND。

## 3. 设计与契约引用

- Terminal Access Policy 的 owner、核心对象、解析规则与服务边界以 [permission-service.md](../../architecture/services/permission-service.md) 为准。
- 架构决策以 [ADR 0005](../../adr/0005-terminal-access-policy.md) 为准。
- permission 侧黑盒 contract 以 [terminal-access.md](../../contracts/permission-service/terminal-access.md) 为准。
- Gateway / BFF 管理入口以 [permission-management.md](../../contracts/api-gateway/permission-management.md) 为准。
- auth-service 登录、refresh 与 session 边界以 [auth-service.md](../../architecture/services/auth-service.md) 及其 contract 为准。

## 4. Seed / Migration

上线前必须：

- 为当前 Web 可登录真实角色显式补齐 Web 终端准入。
- 为 PDA / KIOSK 建立最小 navigation entry。
- 不泛化开放现场终端准入。
- PDA / KIOSK 准入只授予明确现场角色。

## 5. 测试场景

必须覆盖：

- 不同角色组合下的终端准入差异。
- account override 覆盖 role union。
- 多 role allow union。
- 禁止时不创建 MFA、不签发 session。
- 登录拒绝返回 `TERMINAL_ACCESS_DENIED`。
- refresh 失效时拒绝并撤销 session。
- session / token / validation / context 携带 terminal。
- Web / PDA / KIOSK BFF 固定可信 terminal。
- 管理写操作产生审计。

## 6. 执行分阶段

1. 文档与契约冻结。
2. proto / generated contract / Prisma model。
3. permission-service resolver、runtime gRPC、management capability。
4. auth-service login / refresh / token / audit。
5. api-gateway Web / PDA / KIOSK BFF。
6. tenant-web 管理 UI 与个人中心展示。
7. seed、迁移、测试、smoke。

## 7. 风险

- 默认拒绝会影响现有 Web 登录，必须先补齐 Web role seed。
- Refresh 重查会增加 auth-service 对 permission-service 的依赖。
- account override 空数组表示全终端封禁，管理 UI 必须二次确认。
- PDA / KIOSK navigation entry 只应 seed 最小入口，不能顺手定义业务闭环。
