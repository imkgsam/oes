# Permission Service Contracts

> 服务设计唯一真相源：[permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)。本目录只描述 `permission-service` 对外黑盒 contract，不重新定义 Permission、Role、AccountRole、Policy、access summary、navigation governance、terminal access 或 onboarding grant 的长期 owner 边界。

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

## 3. Machine Contract Sources

- [permission_check.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_check.proto)
- [permission_terminal_access.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_terminal_access.proto)
- [permission_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_management.proto)
- [policy_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_management.proto)
