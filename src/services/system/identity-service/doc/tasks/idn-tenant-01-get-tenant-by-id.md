# 4.3.1 按租户 ID 查询租户任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/tenant-identity.md](../design/tenant-identity.md)

## 当前承接范围

- 提供 `getTenantById` 最小查询闭环

## 功能编号

- `4.3.1`

## 当前状态

- 未开始

## 最小闭环范围

- contract：定义请求与响应
- domain：定义租户最小模型
- application：Query + Handler
- infra：Repository 实现
- interface：gRPC query 接口
- doc：同步状态与验收结果

## 不包含范围

- 租户创建/修改
- 租户运营状态管理

## 验收要求

- 给定 `tenantId` 可返回租户最小信息
- 可供账户上下文展示和后续聚合使用
- build 通过

## 关联设计文档

- [../design/tenant-identity.md](../design/tenant-identity.md)

## 阻塞项

- `IDN-FOUNDATION-01` 未完成前无法进入正式实现
