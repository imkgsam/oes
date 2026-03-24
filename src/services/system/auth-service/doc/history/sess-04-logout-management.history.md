# SESS-04 Logout Management 历史

更新时间：2026-03-24 13:55:00 +08:00

## 本次范围

- 新增单 session 登出
- 新增用户全量 session 登出
- 接入最小认证审计事件

## 修改文件

- `src/common/src/contracts/auth_service/auth.proto`
- `src/application/commands/auth/logout.command.ts`
- `src/application/commands/auth/logout.handler.ts`
- `src/application/commands/auth/logout-all.command.ts`
- `src/application/commands/auth/logout-all.handler.ts`
- `src/application/commands/auth/index.ts`
- `src/application/events/auth-audit.event.ts`
- `src/application/services/auth-audit.service.ts`
- `src/interfaces/grpc/auth.grpc.controller.ts`

## 行为影响

- `Logout(sessionId)` 当前通过删除指定 session 完成最小登出
- `LogoutAll(userId)` 当前通过删除该用户全部 session 完成最小全端登出
- 当前未引入 access token blacklist

## 验证

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter auth-service build`
