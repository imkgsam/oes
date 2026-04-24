# tenant-org-service Contracts

## 1. 目的

本目录用于提供 `tenant-org-service` 的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `auth-service`
- `identity-service`
- future `hr-service`
- future `workflow-service`
- 需要组织引用校验与组织树查询的业务服务

当前稳定真相源仍然是：

- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [tenant-org-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/tenant-org-service-foundation.md)

## 2. 模块划分

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/query.md)
  - tenant 摘要、组织树、组织节点与组织引用校验查询
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/management.md)
  - tenant 与 org tree 管理型写接口

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 管理型写接口要求：
  - internal service 调用上下文
  - authenticated operator context
  - trace context
  - 审计元数据
- 第一版不开放 account-org membership 管理接口。
- 第一版不开放 employee / employment 相关接口。

## 4. 第一阶段能力范围

截至当前，`tenant-org-service` 第一阶段只开放以下能力：

- tenant 创建、启停、归档与摘要查询
- 组织树查询
- 组织节点创建、更新、移动、归档
- 组织引用合法性校验
- 祖先 / 子孙等组织层级遍历

当前不包含：

- account-org membership
- primary org 管理
- employee / employment
- 基于正式人员归属的 org scope 解析
