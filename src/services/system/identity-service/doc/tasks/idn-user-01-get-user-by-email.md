# 1.1 按个人邮箱查询用户任务

更新时间：2026-03-23 17:05:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/human-identity.md](../design/human-identity.md)

## 当前承接范围

- 提供按个人邮箱查询 `User` 的最小查询闭环

## 功能编号

- `1.1`

## 当前状态

- 已实现

## 最小闭环范围

- contract：定义 `GetUserByEmail` 请求与响应
- schema：复用当前 `User.email` 承接“个人邮箱”语义
- domain：定义 `UserSummaryEntity`
- application：`GetUserByEmailQuery` + Handler
- infra：`UserRepository` 与 Prisma 实现
- interface：gRPC query 接口
- doc：同步状态与验收结果

## 不包含范围

- 账户候选列表查询
- 企业邮箱资产查询
- schema 字段命名重构

## 验收要求

- 可通过个人邮箱查询到自然人身份
- 返回结果不混入租户内账户信息
- build 通过

## 关联设计文档

- [../design/human-identity.md](../design/human-identity.md)

## 阻塞项

- 当前无
