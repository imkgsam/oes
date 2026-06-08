# Public Entry Service Contracts

> 服务设计唯一真相源：[public-entry-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/public-entry-service.md)。本目录只描述 `public-entry-service` 的黑盒契约，不重新定义服务长期职责、ShortLink / BusinessCard owner 边界或 target resolver 模型。

Phase 1 contracts:

- [shortlink-public-redirect.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-public-redirect.md)
- [shortlink-admin-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-admin-management.md)
- [shortlink-target-resolver.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/shortlink-target-resolver.md)
- [business-card-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-management.md)
- [business-card-self-view.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-self-view.md)
- [business-card-public-render.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/public-entry-service/business-card-public-render.md)

Contract boundary:

- Public redirect is anonymous and externally reachable.
- Admin management requires authenticated tenant/operator context and permission-service authorization at caller boundary.
- Target resolver is an internal module contract in Phase 1, not a public HTTP contract.
- ShortLink only redirects; target owners render their own public pages.
- BusinessCard contracts only describe BusinessCard configuration, public view assembly, Contact Action references and vCard output rules; they do not own employee, contact asset, login, ShortLink, CRM or tenant truth.
