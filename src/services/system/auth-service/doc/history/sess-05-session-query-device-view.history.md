# SESS-05 Session Query And Device View

更新时间：2026-03-25 11:00 +08:00

## 变更范围

- 新增最小 session query / device view 闭环
- 补“保留当前设备，踢掉其他设备”的最小设备管理增强

## 变更结果

- 新增 `ListSessions` gRPC 接口
- 新增 `ListSessionsQuery / Handler`
- 当前 session 列表视图可返回设备维度字段与 session 生命周期字段
- 新增 `LogoutOtherDevices` gRPC 接口
- 新增 `LogoutOtherDevicesCommand / Handler`
- 新增对应审计事件

## 验证

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `D:\\user\\vic\\code\\code_base\\on\\oes\\node_modules\\.bin\\tsc.cmd -b --force` in `auth-service`
- `pnpm --filter auth-service build`
