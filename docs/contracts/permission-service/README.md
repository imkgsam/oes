# Permission Service Contracts

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本目录只描述 `permission-service` 对外黑盒 contract，不重新定义 Permission、Role、PrincipalRoleBinding、Policy、access summary、navigation governance、terminal access 或 onboarding grant 的长期 owner 边界。

## 1. Purpose

This directory documents black-box contracts exposed by `permission-service` for internal service consumers.

The proto files remain the machine-readable source of truth. These documents explain usage scenarios, caller expectations, and authorization boundaries.

## 2. Current Documents

- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
  - Current-session access summary contract used by `auth-bff`.
  - Returns role summaries for display and effective permission codes for front-end action control.
- [terminal-access.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/terminal-access.md)
  - Runtime terminal access contract used by `auth-service` during login and refresh.
  - Resolves effective account terminal access from role defaults and account overrides.
- [onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md)
  - Employee onboarding initial role / grant handoff contract.

涉及 HR `Employee / Employment`、员工生命周期或 onboarding owner 边界时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；本目录只描述 permission contract 如何消费 employee onboarding 授权 handoff。
- [tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
  - Tenant onboarding first-admin role instance and initial grant target contract.
- [resource-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/resource-authorization.md)
  - Resource authorization contract shape for `checkResource / buildQueryScope`.
  - Freezes `PolicyInstance` as the resource authorization fact model and marks legacy `CheckPermissionWithContext` out of scope and disabled by default for new resource authorization.
- [policy-instance-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/policy-instance-management.md)
  - Controlled management contract for listing, loading, creating, and enabling/disabling template-based `PolicyInstance` facts.
  - Keeps `PolicyInstance` governance separate from legacy `Policy + conditionAstJson`.
- [principal-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/principal-authorization.md)
  - HUMAN / MACHINE 的通用 PrincipalRoleBinding、DELEGATED 授权交集与 workload INTERNAL issuance policy。
  - Freezes trusted-subject inputs for Auth / STS and target-service authorization without creating a second Scope vocabulary.
- [delegated-authorization.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/delegated-authorization.md)
  - HUMAN grant、DelegationGrant、ToolContract upper bound、目标 policy 与风险分类的 DELEGATED 交集判定。

Legacy `Policy + conditionAstJson` mutation RPCs and `CheckPermissionWithContext` remain in the machine contracts only for historical compatibility recovery. They are disabled by default in `permission-service`; new callers must use `PolicyInstanceManagementService` and `ResourceAuthorizationService`.

## 3. Machine Contract Sources

- [permission_check.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_check.proto)
- [permission_terminal_access.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_terminal_access.proto)
- [permission_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_management.proto)
- [policy_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_management.proto)
- [policy_instance_preview.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_instance_preview.proto)
- [policy_instance_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_instance_management.proto)
- [resource_authorization.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/resource_authorization.proto)
## Trusted gRPC foundation-group admission

The exact baseline 66-RPC matrix, `urn:oes:service:permission-service` audience, seven internal decision/read methods, six narrow transport Codes and three request tombstones are owned by [permission-service.md](../../architecture/services/permission-service.md#16-trusted-grpc-66-rpc-contractfrozen). The five later integrated foundation/role-binding methods remain byte- and semantics-stable; `ResolveWorkloadIssuance` stays the only exact-Auth mTLS bootstrap.
