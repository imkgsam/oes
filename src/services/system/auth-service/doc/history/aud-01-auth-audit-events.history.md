# AUD-01 Auth Audit Events History

更新时间：2026-03-23 22:45:00 +08:00

## 本次变更

- 新增统一的 `AuthAuditEvent` 事件模型
- 新增 `AuthAuditService` 负责发出内部审计事件
- 新增 `AuthAuditListener` 统一记录审计日志
- 在登录失败、MFA challenge、登录成功、refresh 成功链路中接入审计事件
- 为 `auth-service` 增加 `@nestjs/event-emitter` 依赖

## 影响范围

- `src/services/system/auth-service/src/application/events/auth-audit.event.ts`
- `src/services/system/auth-service/src/application/services/auth-audit.service.ts`
- `src/services/system/auth-service/src/infrastructure/listeners/auth-audit.listener.ts`
- `src/services/system/auth-service/src/application/commands/auth/login-with-email-password.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/refresh-session.handler.ts`
- `src/services/system/auth-service/src/modules/auth/auth.module.ts`
- `src/services/system/auth-service/package.json`

## 验证

- `pnpm.cmd --filter auth-service build`

## 结论

- `AUD-01` 当前最小闭环已完成：认证关键节点已产出统一内部审计事件并写入日志
- 当前未覆盖登出审计和外部审计平台对接
