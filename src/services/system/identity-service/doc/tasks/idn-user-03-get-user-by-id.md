# 4.1.3 按用户 ID 查询用户任务

更新时间：2026-03-23 19:05:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/human-identity.md](../design/human-identity.md)

## 当前承接范围

- 提供按 `userId` 查询 `User` 的最小查询闭环

## 功能编号

- `4.1.3`

## 当前状态

- 已实现

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

## 本次实现结果

- 新增 `GetUserById` gRPC contract
- 新增 `GetUserByIdQuery` 与 Handler
- `UserRepository` 与 Prisma 实现支持按用户 ID 查询
- gRPC controller 已接入 `getUserById`
- `auth-service` adaptor 已接入上游调用

## 关联设计文档

- [../design/human-identity.md](../design/human-identity.md)

## 阻塞项

- 当前无
