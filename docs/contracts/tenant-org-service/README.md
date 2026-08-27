# tenant-org-service Contracts

> `tenant-org-service` 的服务设计唯一真相源是 [tenant-org-service.md](../../architecture/services/tenant-org-service.md)。涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](../../architecture/services/hr-service.md) 为准；涉及角色、权限、grant、AccountRole、PermissionGuard 或授权判定的服务设计边界，以 [permission-service.md](../../architecture/services/permission-service.md) 为准。

## 1. 目的

本目录用于提供 `tenant-org-service` 的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `auth-service`
- `identity-service`
- `hr-service`
- future `workflow-service`
- 需要组织引用校验与组织树查询的业务服务

当前稳定真相源仍然是：

- [tenant-org-service.md](../../architecture/services/tenant-org-service.md)

## 2. 模块划分

- [query.md](./query.md)
  - tenant 摘要、组织树、组织节点与组织引用校验查询
- [management.md](./management.md)
  - tenant 与 org tree 管理型写接口
- [onboarding.md](./onboarding.md)
  - tenant onboarding 轻量 Saga / Process Manager contract

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- 管理型写接口要求：
  - internal service 调用上下文
  - authenticated operator context
  - `PermissionGuard` 按 tenant / org 管理权限码授权
  - trace context
  - 审计元数据
- 租户目录、组织树、组织节点详情与层级遍历等人类可见查询接口要求：
  - internal service 调用上下文
  - authenticated operator context
  - `PermissionGuard` 按 tenant / org 查询权限码授权
  - trace context
  - 审计元数据
- `GetTenantById` 与组织引用校验类查询接口是内部协同能力，必须通过 internal service 受控调用；其返回值不授予调用方对相关 tenant / org / party 的业务使用权。
- 第一版不开放 account-org membership 管理接口。
- 第一版不开放 employee / employment 相关接口；HR 对象与任职语义以 [hr-service.md](../../architecture/services/hr-service.md) 为准。

## 4. 第一阶段能力范围

截至当前，`tenant-org-service` 第一阶段只开放以下能力：

- tenant 创建、启停、归档与摘要查询
- 组织树查询
- 组织节点创建、更新、移动、归档
- 组织引用合法性校验
- 祖先 / 子孙等组织层级遍历
- tenant onboarding process manager、初始 first admin 账号 / 员工 / 访问权协同创建

当前不包含：

- account-org membership
- primary org 管理
- employee / employment
- 基于正式人员归属的 org scope 解析
## Trusted gRPC foundation-group admission

The baseline 20 methods remain BUSINESS with the exact ten current TenantOrg Codes; additive `ResolveAuthSessionTenantLifecycle` is the twenty-first INTERNAL method with `tenant_org.internal.auth_session_tenant_lifecycle.resolve`. Audience and caller rules are frozen by [tenant-org-service.md](../../architecture/services/tenant-org-service.md#13-trusted-grpc-21-rpc-contractfrozen). Existing request tenant fields remain owner resource identifiers; the new resolver's `tenant_id` is likewise a lookup selector and never execution authority.
