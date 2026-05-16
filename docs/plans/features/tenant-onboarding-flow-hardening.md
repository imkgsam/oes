# Tenant Onboarding Flow Hardening

## 1. 状态

本 feature packet 已关闭，仅保留为历史执行记录。

Tenant onboarding 的稳定服务设计以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；黑盒接口以 [tenant-org-service onboarding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/onboarding.md) 与 [api-gateway tenant onboarding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/tenant-onboarding.md) 为准。

本文不再承载 onboarding run、step、proto、schema、跨服务 owner 或前端 wizard 的正文设计。

## 2. 关闭结论

- 当前阶段采用 `tenant-org-service` 内部轻量 Saga / Process Manager。
- Gateway 只提供外部 HTTP contract、鉴权、DTO 转换与展示适配，不保存或推进 onboarding step 状态。
- `tenant-org-service` 只记录 onboarding run、step 状态与外部对象引用，不拥有 party、identity、auth、HR 或 permission 的主数据真相。
- 首租户管理员员工化通过 `hr-service` owner 能力编排，HR `Employee / Employment` 设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准；不把 employee / employment 或 account-org membership 变成 `tenant-org-service` 真相。
- 若后续出现多个长流程，再单独评估是否迁移到 `workflow-service`。
