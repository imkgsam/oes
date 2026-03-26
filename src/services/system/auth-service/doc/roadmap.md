# Auth Service 路线图

更新时间：2026-03-25 15:40 +08:00

## 当前阶段判断

- 当前处于 `Phase 1` 后段
- 人类认证主线最小闭环已经打通
- 安全增强能力已进入收口阶段
- session 主问题已收口，并已进入最小 session query / device control 阶段
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
- `SESS-02` session 结构重构
- `SESS-03` refresh token rotation
- `SESS-04` logout / logoutAll
- `SESS-05` session query、设备重命名、保留当前设备退出其他设备、管理员单 session 管理

3. MFA
- `MFA-04` 邮箱 OTP MFA challenge 与 challenge 提交
- `MFA-05` 手机 OTP MFA challenge

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

1. operator context 接入
- `SESS-05` 的 admin session 接口已完成第一步收口
- 后续其余 admin / management 接口应继续接入项目既有 operator context，而不是局部继续扩展请求字段

2. 运行通道收口
- 邮件发送仍为开发 / 模拟通道
- 短信发送仍为开发 / 模拟通道

## 当前建议顺序

1. 继续进入既有 `operator context` 的接入改造，删除其余 admin 请求中的显式操作者字段
2. 保持 `SESS-05` 与顶层文档同步，收口当前主线
3. 仅在接入真实历史数据后，再继续 `CRED-01` 的 backfill 执行阶段
