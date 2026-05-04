# Permission Service Contracts

## 1. Purpose

This directory documents black-box contracts exposed by `permission-service` for internal service consumers.

The proto files remain the machine-readable source of truth. These documents explain usage scenarios, caller expectations, and authorization boundaries.

## 2. Current Documents

- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/access-summary.md)
  - Current-session access summary contract used by `auth-bff`.
  - Returns role summaries for display and effective permission codes for front-end action control.
- [onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md)
  - Employee onboarding initial role / grant handoff contract.
- [tenant-onboarding-grant.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/tenant-onboarding-grant.md)
  - Tenant onboarding first-admin role instance and initial grant target contract.

## 3. Machine Contract Sources

- [permission_check.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_check.proto)
- [permission_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/permission_management.proto)
- [policy_management.proto](/Users/acehood/Documents/GitHub/oes/src/common/src/contracts/permission_service/policy_management.proto)
