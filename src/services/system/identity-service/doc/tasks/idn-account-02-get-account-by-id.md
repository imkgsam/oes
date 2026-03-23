# 2.2 按账户 ID 查询账户

更新时间：2026-03-23 18:15:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/account-identity.md](../design/account-identity.md)

## 当前承接范围

- 提供 `getAccountById` 最小查询闭环

## 功能编号

- `2.2`

## 当前状态

- 已实现

## 最小闭环范围

- contract：定义请求与响应
- domain：定义账户最小详情模型
- application：Query + Handler
- infrastructure：Repository 实现
- interface：gRPC query 接口
- doc：同步状态、历史与全局审核

## 不包含范围

- 账户管理写操作
- 组织归属查询
- 联系方式资产查询
- 租户详情查询

## 验收要求

- 给定 `accountId` 可返回账户最小详情
- 返回结果可供 `auth-service` 做账户上下文校验
- `build` 通过

## 本次实现结果

- 新增 `GetAccountById` gRPC contract
- 新增 `AccountSummaryEntity`
- 新增 `GetAccountByIdQuery` 与 `GetAccountByIdHandler`
- `PrismaAccountRepository` 支持按账户 ID 查询
- gRPC controller 已接入 `getAccountById`
- 当前 `displayName` 继续使用 `Tenant.name` 作为临时承接展示名

## 关联设计文档

- [../design/account-identity.md](../design/account-identity.md)

## 阻塞项

- 无
