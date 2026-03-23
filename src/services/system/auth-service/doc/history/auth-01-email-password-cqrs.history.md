# AUTH-01 Email Password CQRS Slice

更新时间：2026-03-23 10:30:00 +08:00

## 本次目标

- 将 `AUTH-01` 从旧 `application service` 入口收敛到 `domain + CQRS + gRPC controller`
- 为后续登录切片建立第一条目标架构路径

## 修改范围

- 邮箱密码认证策略
- `AuthStrategyFactory` 装配
- `application/commands/auth`
- `auth.module.ts`
- `auth.grpc.controller.ts`
- 异常定义与遗留标记

## 主要改动

- 收敛 `EmailPasswordStrategy` 的认证规则并统一返回 `AUTH_INVALID_CREDENTIALS`
- 将注入 token 从误导性的 `USER_REPOSITORY` 收敛到 `LOGIN_METHOD_REPOSITORY`
- 新增 `LoginWithEmailPasswordCommand` 与 `LoginWithEmailPasswordHandler`
- `AuthGrpcController` 改为走 `ValidatingCommandBus`
- `AuthModule` 引入 `CqrsModule`、`ValidatingCommandBus`、`ValidatingQueryBus`
- 为旧的空壳 `domain/services/auth.service.ts` 标记 `OUTDATED`
- 为误导性的 `USER_REPOSITORY`、`AUTH_SERVICE` token 添加 `OUTDATED` 注释
- 为旧的 `application/services/auth-service.ts` 标记 `OUTDATED` 并从模块装配中移除

## 备注

- 本次只完成 `AUTH-01` 的领域和应用架构切换，不包含 session / token / account 选择
- 当前最大限制仍是 `auth.proto` 无法承载主认证中间结果
