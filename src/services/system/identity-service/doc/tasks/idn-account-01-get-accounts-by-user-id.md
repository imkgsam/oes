# 2.1 按用户查询账户候选列表任务

更新时间：2026-03-23 17:35:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/account-identity.md](../design/account-identity.md)

## 当前承接范围

- 提供 `getAccountsByUserId` 最小查询闭环

## 功能编号

- `2.1`

## 当前状态

- 已实现

## 最小闭环范围

- contract：定义账户候选列表请求与响应
- schema：复用当前 `UserAccount` 与 `Tenant` 关联结构
- domain：定义账户候选摘要模型
- application：`GetAccountsByUserIdQuery` + Handler
- infra：`AccountRepository` 与 Prisma 实现
- interface：gRPC query 接口
- doc：同步状态与验收结果

## 不包含范围

- 账户选择提交
- token / session 签发
- 组织归属信息展开

## 验收要求

- 给定 `userId` 可返回可用账户候选列表
- 结果至少包含 `accountId`、`tenantId`、展示名
- build 通过

## 关联设计文档

- [../design/account-identity.md](../design/account-identity.md)

## 阻塞项

- 当前无
