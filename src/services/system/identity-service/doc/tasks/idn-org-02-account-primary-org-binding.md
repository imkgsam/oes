# 4.4.2 账户主组织绑定任务

更新时间：2026-03-23 21:00:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/organization-structure.md](../design/organization-structure.md)

## 当前承接范围

- 为 `UserAccount` 建立主组织绑定能力

## 功能编号

- `4.4.2`

## 当前状态

- 已实现

## 最小闭环范围

- schema：为账户增加主组织关联
- domain：主组织绑定规则
- application：Command + Handler
- infra：Repository 实现
- interface：gRPC 管理接口
- doc：同步状态与验收结果

## 不包含范围

- 多组织归属
- 复杂组织权限继承

## 验收要求

- 一个账户可绑定一个主组织
- 允许账户暂时无主组织
- build 通过

## 本次实现结果

- schema 新增 `UserAccountOrgMembership` 关联表，承接账户与组织的多对多关系
- 新增 `SetAccountPrimaryOrg` gRPC 管理接口
- 新增 `SetAccountPrimaryOrgCommand` 与 Handler
- 新增账户组织归属仓储与 Prisma 实现
- 当前支持设置主组织和清空主组织
- 当前会校验账户存在、组织存在以及账户与组织同租户

## 说明

- 本次按最终 membership 方向落 schema
- 多组织归属的增删查接口留给 `IDN-ORG-03`

## 关联设计文档

- [../design/organization-structure.md](../design/organization-structure.md)

## 阻塞项

- 当前无
