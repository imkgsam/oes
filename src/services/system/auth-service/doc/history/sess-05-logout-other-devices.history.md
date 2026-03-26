# SESS-05 Logout Other Devices

更新时间：2026-03-25 10:45 +08:00

## 变更范围

- 在 `SESS-05` 基础上补“保留当前设备，踢掉其他设备”的最小闭环

## 变更结果

- 新增 `LogoutOtherDevices` gRPC 接口
- 新增 `LogoutOtherDevicesCommand / Handler`
- 复用 session 仓储的 `kickOtherDevices`
- 新增对应审计事件

## 验证

- 待本轮实现完成后补充
