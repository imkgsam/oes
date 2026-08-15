# hr-service Contracts

> `hr-service` 的服务设计唯一真相源是 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)。涉及角色、权限、grant、AccountRole 或授权判定的服务设计边界，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. 目的

本目录用于提供 `hr-service` minimum 第一阶段的黑盒接口文档，只描述调用入口、请求响应、错误语义与调用方约束。

`Employee`、`Employment`、员工生命周期、正式 `人 -> org` 归属与 onboarding owner 边界不在本目录重新定义；如需变更这些设计，必须先更新 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)，再同步调整 contract。

这些文档面向：

- `api-gateway`
- `party-service`
- `tenant-org-service`
- `identity-service`
- `permission-service`
- 后续需要消费正式员工事实的业务服务

## 2. 模块划分

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/query.md)
  - 员工与任职只读查询
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/management.md)
  - 员工建档、任职写接口与 minimum onboarding owner 语义

## 3. 全局调用约束

- 所有接口均为内部服务接口，不直接对外部客户端开放。
- `Employee / Employment` owner、正式 `人 -> org` 真相与 HR onboarding owner 边界以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本文只约束接口如何消费这些稳定语义。
- `Tenant / OrgUnit / org tree` 的服务边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只描述 HR 对 `OrgUnit` 的引用方式。
- `account -> org` 只能作为 compatibility / projection，不能被调用方视为正式 HR 归属 owner。

## 4. 当前能力范围

截至 minimum 第一阶段，本目录只记录以下 contract 能力：

- 员工目录查询
- 员工主档查询
- 任职记录查询
- 创建员工
- 创建任职
- 结束任职 / 调岗所需的受控写语义

当前不包含：

- payroll
- attendance
- performance
- recruiting
- 完整岗位体系
- 角色 / 权限 owner 能力
## Trusted gRPC foundation-group admission

All 15 methods remain BUSINESS with the exact six current HR Codes, `urn:oes:service:hr-service` audience and execution/caller rules frozen by [hr-service.md](../../architecture/services/hr-service.md#11-trusted-grpc-15-rpc-contractfrozen). Ten body tenant fields are reserved; only `ResolveActiveEmployeeByCode.tenant_id=1` remains an Auth-derived target selector and never admission authority.
