# Command Validation Boundary 历史

更新时间：2026-03-23 20:50:00 +08:00

## 本次变更

- 为 `SelectAccountCommand` 补齐 `class-validator` 装饰器
- 为 `RefreshSessionCommand` 补齐 `class-validator` 装饰器
- 对齐 `ValidatingCommandBus` 的使用边界，避免空值直接进入 handler/service

## 影响范围

- `select-account.command.ts`
- `refresh-session.command.ts`

## 验证

- `pnpm.cmd --filter auth-service clear:build`
- `pnpm.cmd --filter auth-service build`

## 结论

- 当前 `auth-service` 已有 command 都具备显式输入校验
- 输入合法性回到 command 层，不再由业务逻辑兜底
