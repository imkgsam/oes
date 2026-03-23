# Engineering Baseline Recovery

更新时间：2026-03-22 18:35:00 +08:00

## 本次目标

- 恢复 `auth-service` 的工程可编译基线
- 将对外接口方向纠正为 gRPC
- 收敛异常定义、外部依赖边界和会话聚合的基础结构

## 修改范围

- gRPC 启动链与 `interfaces/grpc`
- `exception-enums` 结构
- `permission-service` 的 `application port + infrastructure adaptor`
- Prisma generated client 与基础仓储编译基线
- `usersession.aggregate.ts`

## 主要改动

- 删除 `interfaces/tcp` 并改为 gRPC controller
- controller 改为使用自动生成的 gRPC 装饰器
- 清理旧异常兼容文件，统一到 `exception-enums`
- 重建 `permission-service.port.ts` 与 `permission-service.adaptor.ts`
- 生成 Prisma client，并修正生成路径与编译引用
- 重写 `usersession.aggregate.ts` 的最小稳定实现
- 使用 `pnpm --filter auth-service build` 完成构建验证

## 备注

- 本次仅恢复工程基线，不代表任何业务任务已经闭环完成
- 当前业务任务状态与最近全局审核结果以 [minimum-closure-global-review.history.md](./minimum-closure-global-review.history.md) 为准
