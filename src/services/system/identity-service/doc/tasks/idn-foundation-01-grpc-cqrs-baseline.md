# 0.1 gRPC 与 CQRS 基线任务

更新时间：2026-03-23 16:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)

## 当前承接范围

- 将 `identity-service` 从历史 TCP 草稿结构收敛到 `gRPC + CQRS` 基线

## 功能编号

- `0.1`

## 当前状态

- 已实现

## 最小闭环范围

- main：切到 gRPC 启动方式
- interfaces：建立 `interfaces/grpc`
- application：引入 `command/query` 结构
- modules：建立最小装配层
- outdated：标记 `interfaces/tcp` 与历史 application service 为过时代码
- doc：同步结构与状态

## 不包含范围

- 具体用户查询能力
- 具体账户查询能力
- 具体租户查询能力

## 验收要求

- 服务入口不再以 TCP 作为目标方向
- 存在最小 gRPC controller 与 CQRS 装配
- 过时代码已显式标记
- build 可通过

## 关联设计文档

- [../design/identity-center.md](../design/identity-center.md)

## 阻塞项

- 当前无
