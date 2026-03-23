# Identity Service 最小闭环全局审核记录

更新时间：2026-03-23 18:15:00 +08:00

## 当前审核范围

- 文档基线
- gRPC + CQRS 结构基线
- `1.1` 按个人邮箱查询用户闭环
- `2.1` 按用户查询账户候选列表闭环
- `2.2` 按账户 ID 查询账户闭环

## 当前判断

### contract / proto

- 部分实现
- 已建立 `identity_query.proto`
- 已落 `GetUserByEmail`
- 已落 `GetAccountsByUserId`
- 已落 `GetAccountById`

### schema

- 部分实现
- 当前仍复用历史 schema
- `UserAccount` 尚无独立 `displayName` 字段，本阶段继续以 `Tenant.name` 临时承接展示名

### application

- 部分实现
- 已建立 CQRS 装配基线
- 已落地 `GetUserByEmailQuery`
- 已落地 `GetAccountsByUserIdQuery`
- 已落地 `GetAccountByIdQuery`

### domain

- 部分实现
- 已建立 `UserSummaryEntity`
- 已建立 `AccountCandidateEntity`
- 已建立 `AccountSummaryEntity`
- 已建立 `UserRepository` 与 `AccountRepository`

### infrastructure

- 部分实现
- 已建立 `PrismaUserRepository`
- 已建立 `PrismaAccountRepository`
- 已支持按用户查询账户候选
- 已支持按账户 ID 查询账户

### interface

- 部分实现
- 已建立 gRPC controller 骨架
- 已接入 `getUserByEmail`
- 已接入 `getAccountsByUserId`
- 已接入 `getAccountById`
- 历史 TCP 控制器已标记 `outdated`

### documentation

- 已实现
- 已同步 `0.1`、`1.1`、`2.1`、`2.2` 的任务状态和历史记录

## 总结

`identity-service` 当前已完成回到 `auth-service` 主线所需的最小集合：

- `0.1`
- `1.1`
- `2.1`
- `2.2`

下一步可以切回 `auth-service`，继续推进账户选择后的账户上下文校验与后续会话链路。
