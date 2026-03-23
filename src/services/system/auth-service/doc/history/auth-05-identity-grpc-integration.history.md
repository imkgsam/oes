# AUTH-05 Identity gRPC Integration History

更新时间：2026-03-23 19:05:00 +08:00

## 本次变更

- `auth-service` 接入 `identity-service` gRPC transport 配置
- `ExternalServicesModule` 开始注入 `identity-service` gRPC client
- `IdentityServiceAdaptor` 从占位实现切换为真实 gRPC 调用
- 扩展 `getAccountById` 返回模型，补齐 `userId` 与 `isEnabled`

## 约束

- 本次只接通上游查询边界
- 不包含账户选择提交接口
- 不包含 session / token 签发
- 不包含手机登录链

## 验证要求

- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
