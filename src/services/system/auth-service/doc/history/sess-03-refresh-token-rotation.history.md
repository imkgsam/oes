# SESS-03 Refresh Token Rotation 历史

更新时间：2026-03-23 20:30:00 +08:00

## 本次变更

- 新增 `RefreshSession` gRPC 接口与 CQRS 命令链路
- 在 `SessionService` 中接入 refresh token rotation
- 增加 refresh token 非法与 replay 检测异常
- 修正 Redis session repository，在 refresh rotation 后删除旧 token 索引

## 影响范围

- `auth.proto`
- `auth.grpc.controller.ts`
- `refresh-session.command.ts`
- `refresh-session.handler.ts`
- `session.service.ts`
- `redis-user-session.repository.ts`

## 验证

- `pnpm.cmd proto:gen`
- `..\\..\\node_modules\\.bin\\tsc.cmd -b --force` in `src/common`
- `pnpm.cmd --filter auth-service build`

## 结论

- `SESS-03` 已形成可构建的最小 rotation 闭环
- 当前 replay 检测基于“session 仅保存最新 refresh token”完成
- token family 独立建模后续再做
