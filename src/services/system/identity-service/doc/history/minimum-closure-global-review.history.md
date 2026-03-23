# Identity Service 最小闭环全局审核记录

更新时间：2026-03-24 10:52:00 +09:00

## 当前审核范围

- 文档基线
- gRPC + CQRS 结构基线
- `1.1` 按个人邮箱查询用户闭环
- `1.2` 按个人手机查询用户闭环
- `1.3` 按用户 ID 查询用户闭环
- `2.1` 按用户查询账户候选列表闭环
- `2.2` 按账户 ID 查询账户闭环
- `3.1` 按租户 ID 查询租户闭环
- `4.1` 查询租户组织树闭环
- `4.2` 账户主组织绑定闭环
- `4.3` 账户多组织归属闭环

## 当前判断

### contract / proto

- 部分实现
- 已建立 `identity_query.proto`
- 已建立 `IdentityManagementService`
- 已落 `GetOrgTreeByTenantId`
- 已落 `GetTenantById`
- 已落 `GetUserById`
- 已落 `GetUserByEmail`
- 已落 `GetUserByPhone`
- 已落 `GetAccountsByUserId`
- 已落 `GetAccountById`
- 已落 `SetAccountPrimaryOrg`
- 已落 `ListAccountOrgMemberships`
- 已落 `AddAccountOrgMembership`
- 已落 `RemoveAccountOrgMembership`

### schema

- 部分实现
- 已为 `UserAccount` 增加正式 `displayName` 字段
- 已新增 `UserAccountOrgMembership` 关联表承接账户与组织归属
- 已为 `UserAccountOrgMembership` 增加 `relationType`
- 已新增 SQL migration，用于落账户主组织部分唯一索引

### application

- 部分实现
- 已建立 CQRS 装配基线
- 已落地 `SetAccountPrimaryOrgCommand`
- 已落地 `AddAccountOrgMembershipCommand`
- 已落地 `RemoveAccountOrgMembershipCommand`
- 已落地 `GetOrgTreeByTenantIdQuery`
- 已落地 `ListAccountOrgMembershipsQuery`
- 已落地 `GetTenantByIdQuery`
- 已落地 `GetUserByIdQuery`
- 已落地 `GetUserByEmailQuery`
- 已落地 `GetUserByPhoneQuery`
- 已落地 `GetAccountsByUserIdQuery`
- 已落地 `GetAccountByIdQuery`

### domain

- 部分实现
- 已建立 `TenantSummaryEntity`
- 已建立 `OrgNodeEntity`
- 已建立 `AccountOrgMembershipEntity`
- 已建立 `UserSummaryEntity`
- 已建立 `AccountCandidateEntity`
- 已建立 `AccountSummaryEntity`
- 已建立 `OrgRepository`、`TenantRepository`、`UserRepository`、`AccountRepository` 与 `AccountOrgMembershipRepository`

### infrastructure

- 部分实现
- 已建立 `PrismaOrgRepository`
- 已建立 `PrismaTenantRepository`
- 已建立 `PrismaUserRepository`
- 已建立 `PrismaAccountRepository`
- 已建立 `PrismaAccountOrgMembershipRepository`
- 已支持按租户 ID 查询组织树
- 已支持按租户 ID 查询租户
- 已支持按用户 ID 查询自然人
- 已支持按个人手机查询自然人
- 已支持按用户查询账户候选
- 已支持按账户 ID 查询账户
- 已支持设置账户主组织与清空主组织
- 已支持新增附属组织归属
- 已支持删除附属组织归属
- 已支持列出账户组织归属
- 账户展示名已正式读取 `UserAccount.displayName`

### interface

- 部分实现
- 已建立 gRPC controller 骨架
- 已接入 `setAccountPrimaryOrg`
- 已接入 `getOrgTreeByTenantId`
- 已接入 `getTenantById`
- 已接入 `getUserById`
- 已接入 `getUserByEmail`
- 已接入 `getUserByPhone`
- 已接入 `getAccountsByUserId`
- 已接入 `getAccountById`
- 已接入 `listAccountOrgMemberships`
- 已接入 `addAccountOrgMembership`
- 已接入 `removeAccountOrgMembership`
- 历史 TCP 控制器已标记 `outdated`

### documentation

- 已实现
- 已同步 `0.1`、`1.1`、`1.2`、`1.3`、`2.1`、`2.2`、`3.1`、`4.1`、`4.2`、`4.3` 的任务状态与历史记录

## 当前结论

`Phase 1` 当前已完成：

- `0.1`
- `1.1`
- `1.2`
- `1.3`
- `2.1`
- `2.2`
- `3.1`

`Phase 2` 当前已完成：

- `4.1`
- `4.2`
- `4.3`

## 总结

`identity-service` 当前已完成 `Phase 2` 的组织结构分片最小闭环。下一步如果继续推进，应进入 `5.1` 企业邮箱资产绑定。
