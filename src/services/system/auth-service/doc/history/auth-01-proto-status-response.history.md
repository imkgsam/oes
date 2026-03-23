# AUTH-01 Proto Status Response Slice

更新时间：2026-03-23 11:00:00 +08:00

## 本次目标

- 消除 `AUTH-01` 被旧 `auth.proto` 阻断的问题
- 让邮箱密码主认证至少能够返回合法的阶段性结果

## 修改范围

- `src/common/src/contracts/auth_service/auth.proto`
- `src/common/src/generated/auth_service/auth.ts`
- `auth.grpc.controller.ts`
- `login-with-email-password.handler.ts`

## 主要改动

- 为 `LoginResponse` 增加 `status`、`user_id`、`challenge_id`
- 新增 `LoginStatus` 枚举
- 重新生成 common 的 gRPC 类型
- `AUTH-01` 现在可以返回 `LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED`

## 备注

- 本次只解决主认证结果表达能力，不实现账户列表和后续会话签发
- 下一步应继续承接 `AUTH-05`
