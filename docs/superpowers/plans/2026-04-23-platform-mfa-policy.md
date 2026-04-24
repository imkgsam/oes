# Platform MFA Policy Implementation Plan

> Execute this plan end-to-end: design freeze, contract changes, auth-service runtime support, auth-bff admin endpoints, and tenant-web system-admin page.

## Goal

Deliver complete `平台 MFA 配置` support for `SYSTEM` accounts, including policy governance, runtime enforcement, and system-scope trusted-device support.

## Architecture

- tenant policy and platform policy remain separate truths
- runtime policy selection is driven by account `scopeLevel`
- trusted-device truth becomes scope-aware so `NEW_DEVICE_LOGIN` works for both platform and tenant accounts

## Tasks

- [ ] Freeze docs and update feature packet references
- [ ] Add platform MFA policy persistence truth in auth-service
- [ ] Add platform MFA proto RPCs and BFF endpoints
- [ ] Make login MFA orchestration scope-aware for `SYSTEM` and `TENANT`
- [ ] Make step-up MFA policy checks scope-aware for password and contact flows
- [ ] Generalize trusted-device truth from tenant-only to scope-aware
- [ ] Add system-admin platform MFA page aligned with the existing tenant MFA configuration UI
- [ ] Run targeted build and test verification across auth-service, api-gateway, tenant-web, and permission-service

## Verification Target

- system admin can open `平台 MFA 配置`
- tenant admin can open `租户 MFA 配置`
- system accounts resolve platform policy only
- tenant accounts resolve tenant policy only
- system-account `NEW_DEVICE_LOGIN` remembers and recognizes trusted devices
- tenant-account `NEW_DEVICE_LOGIN` remains unchanged
