# Auth Service 路线图

更新时间：2026-03-28 23:15 +09:00

## 当前阶段判断

- 当前处于 `Phase 1` 后段
- 人类认证主线最小闭环已经打通
- 安全增强能力已在 `auth-service` 边界内基本收口
- session 主链已可运行，`SESS-02` 已在 `auth-service` 边界内完成
- `CRED-01` 已在当前目标数据库上关闭
- `SESS-05` 的 admin 接口已开始接入既有 `operator context`

## 当前已完成

1. 主认证主线
- `AUTH-01` 邮箱密码登录
- `AUTH-02` 邮箱 OTP 登录
- `AUTH-03` 手机密码登录
- `AUTH-04` 手机 OTP 登录
- `AUTH-05` 账户候选查询与账户选择

2. 会话与 token
- `SESS-01` session 建立与 token 签发
- `SESS-02` 已完成第一阶段结构收缩
- `SESS-03` refresh token rotation
- `SESS-04` logout / logoutAll
- `SESS-05` session query、保留当前设备退出其他设备、管理员单 session 管理

3. MFA
- `MFA-04` 邮箱 OTP MFA challenge 与 challenge 提交
- `MFA-05` 手机 OTP MFA challenge
- `MFA-06` OTP MFA 绑定管理
- `MFA-07` TOTP MFA
- `MFA-08` Recovery Codes

4. 风控与审计
- `RISK-01` 登录失败限流
- `RISK-02` OTP 发码频控与失败次数持久化
- `AUD-01` 认证审计事件

5. 标识治理
- `CRED-01` 已建立治理文档与扫描脚本
- 当前目标数据库已 schema push 完成
- 当前目标数据库 `LoginMethod` 记录数为 `0`
- repository 兼容双查已清理

## 当前未完成但优先级高

1. 运行通道收口
- 邮件发送仍为开发 / 模拟通道
- 短信发送仍为开发 / 模拟通道

2. 更高阶 MFA 因子
- `EMAIL_OTP / SMS_OTP / TOTP / Recovery Codes` 已进入实现闭环

3. 跨模块设备上下文传播设计
- 当前 `auth-service` 已支持 `SelectAccountRequest` 显式承接 `deviceId / deviceName / userAgent / ipAddress`
- 但 `api-gateway -> auth-service` 尚无统一的自动设备上下文透传协议
- 该事项涉及 gateway、shared gRPC metadata 与 `src/common` 边界，不再属于单服务收口

## 当前建议顺序

1. `auth-service` 内部闭环已基本完成，后续优先级转向外部依赖决策
2. 保持跨模块设备上下文自动透传为后续治理项
3. 仅在接入真实历史数据后，再继续 `CRED-01` 的 backfill 执行阶段

## 已记录的后续治理项

1. 设备上下文自动透传
- 目标：让 gateway 在不依赖业务方手工拼装请求字段的前提下，将 `userAgent / clientIp / deviceId / deviceName` 稳定传入 `auth-service`
- 当前状态：已明确不在本线程内继续扩 `src/common/src/authorization/**`
- 进入条件：需要单独的跨模块设计或 architecture 线程先冻结边界
