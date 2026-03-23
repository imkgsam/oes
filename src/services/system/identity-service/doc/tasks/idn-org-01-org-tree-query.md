# 4.4.1 查询租户组织树任务

更新时间：2026-03-23 20:18:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/organization-structure.md](../design/organization-structure.md)

## 当前承接范围

- 提供租户组织树最小查询闭环

## 功能编号

- `4.4.1`

## 当前状态

- 已实现

## 最小闭环范围

- contract：组织树查询请求与响应
- schema：确认 `Org` 自关联结构
- domain：组织节点与树查询模型
- application：Query + Handler
- infra：Repository 实现
- interface：gRPC query 接口
- doc：同步状态与验收结果

## 不包含范围

- 账户组织归属写操作
- 多组织归属

## 验收要求

- 给定 `tenantId` 可返回稳定组织树
- 支持子公司、部门、小组这类层级
- build 通过

## 本次实现结果

- 新增 `GetOrgTreeByTenantId` gRPC contract
- 新增 `OrgNodeEntity`
- 新增 `OrgRepository`、`GetOrgTreeByTenantIdQuery` 与 Handler
- 新增 Prisma mapper 与 repository 实现
- gRPC controller 已接入 `getOrgTreeByTenantId`
- 当前按 `order asc, createdAt asc` 构造稳定树结构

## 关联设计文档

- [../design/organization-structure.md](../design/organization-structure.md)

## 阻塞项

- 当前无
