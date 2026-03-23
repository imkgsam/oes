# 4.4.3 账户多组织归属任务

更新时间：2026-03-24 10:52:00 +09:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/organization-structure.md](../design/organization-structure.md)

## 当前承接范围

- 建立账户多组织归属能力

## 功能编号

- `4.4.3`

## 当前状态

- 已实现

## 最小闭环范围

- schema：补齐账户组织归属关系语义
- domain：主归属与附属归属规则
- application：Command / Query + Handler
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- 复杂跨组织审批规则

## 验收要求

- 一个账户可归属多个组织
- 可区分主组织和附属组织
- build 通过

## 本次实现结果

- `UserAccountOrgMembership` 正式补齐 `relationType`
- 新增 `AddAccountOrgMembership` 与 `RemoveAccountOrgMembership` gRPC 管理接口
- 新增 `ListAccountOrgMemberships` gRPC 查询接口
- 新增多组织归属 command / query 与 handler
- 当前支持新增附属组织、移除附属组织、列出账户全部组织归属
- 当前会阻止重复归属，并阻止直接删除主组织归属

## 关联设计文档

- [../design/organization-structure.md](../design/organization-structure.md)

## 阻塞项

- 当前无
