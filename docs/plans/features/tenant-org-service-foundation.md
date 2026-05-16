# Tenant-Org Service Foundation

## 1. 状态

本 feature packet 已关闭，仅保留为历史执行记录。

`tenant-org-service` 的稳定服务设计唯一以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。本文不再承载 `Tenant`、`OrgUnit`、org tree、org hierarchy、org reference validation、onboarding 或 authorization boundary 的正文设计。

## 2. 当前引用入口

- 服务真相源：[tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- Identity 协同：[tenant-org-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-identity.md)
- HR 服务真相源：[hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- HR 协同：[tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
- Party / Identity / HR / Tenant-Org 协同：[party-identity-and-tenant-org.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/party-identity-and-tenant-org.md)
- 黑盒契约：[tenant-org-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/README.md)

## 3. 关闭结论

- `Tenant` 与 org tree owner 已收敛到 `tenant-org-service`。
- `identity-service` 不再拥有 tenant / org 真相，仍可保留 `tenantId / orgId` 作为身份上下文、引用或审计字段。
- account-org membership、employee / employment、正式人员归属与由人员任职派生的 `OrgScope` 不属于 `tenant-org-service`；HR 任职口径以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- tenant / org 前端基础入口只消费 `tenant-org-service` 的稳定真相，不反向扩张服务边界。
