# SESS-02 Device Context Entry History

## 2026-03-27

### 本次范围

- 将 session 设备上下文的正式进入点收敛到 `SelectAccount`
- 为 `SelectAccount` 补充最小设备上下文字段承接能力

### 变更摘要

- 设计文档明确 `SelectAccountRequest` 可承接 `deviceId/deviceName/userAgent/ipAddress`
- `SelectAccountCommand` 与 `SelectAccountHandler` 不再只写死默认设备值
- 调用方未提供设备上下文时仍保持兼容默认值

### 影响判断

- 属于 `auth-service` 内部 session 建立边界的收口
- 不改变既有登录分支编排
- 会影响 `SelectAccount` gRPC 契约字段

### 风险

- 仍存在调用方暂未传设备上下文时的兼容默认值
- 设备信息真实性仍依赖上游入口后续配合
