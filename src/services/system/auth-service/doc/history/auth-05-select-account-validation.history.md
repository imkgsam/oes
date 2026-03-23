# AUTH-05 Select Account Validation History

更新时间：2026-03-23 19:25:00 +08:00

## 本次变更

- `auth.proto` 新增 `SelectAccount` 接口
- `auth-service` 新增 `SelectAccountCommand` 与 `SelectAccountHandler`
- 接入账户存在、归属、启用状态校验
- `AuthGrpcController` 已接入 `selectAccount`

## 约束

- 本次不进入 session / token 签发
- 本次不引入 challenge 持久化
- 当前选择提交仍使用 `userId + accountId` 直接入参

## 验证要求

- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
