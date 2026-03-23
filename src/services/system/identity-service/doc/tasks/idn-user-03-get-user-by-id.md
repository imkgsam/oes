# 4.1.3 按用户 ID 查询用户任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/human-identity.md](../design/human-identity.md)

## 当前承接范围

- 提供按 `userId` 查询 `User` 的最小查询闭环

## 功能编号

- `4.1.3`

## 当前状态

- 未开始

## 最小闭环范围

- contract：定义查询请求与响应
- domain：定义查询结果模型
- application：Query + Handler
- infra：Repository 实现
- interface：gRPC query 接口
- doc：同步状态与验收结果

## 不包含范围

- 账户详情
- 组织归属

## 验收要求

- 可通过 `userId` 查询到自然人身份
- 查询结果可供上游服务关联使用
- build 通过

## 关联设计文档

- [../design/human-identity.md](../design/human-identity.md)

## 阻塞项

- `IDN-FOUNDATION-01` 未完成前无法进入正式实现
