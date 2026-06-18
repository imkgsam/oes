# site-service Contracts

```text
contractStatus: FROZEN_FOR_P1_IMPLEMENTATION
featurePacket: docs/plans/features/external-site-integration-p1.md
serviceTruthSource: docs/architecture/services/site-service.md
runtimeKitTruthSource: docs/architecture/site-runtime-kit.md
lastUpdatedAt: 2026-06-16
```

## 1. 目的

本目录用于冻结 External Site Integration P1 的黑盒契约。

`site-service` 的唯一稳定服务设计真相源是 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)。`@oes/site-runtime-kit` 的 P1 架构真相源是 [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md)。本目录只描述调用方可依赖的请求、响应、错误语义与安全边界，不重新定义服务职责、核心对象或长期边界。

这些文档面向：

- `api-gateway` Admin BFF
- `api-gateway` Site-facing BFF / Site API
- `site-service`
- `@oes/site-runtime-kit`
- Site Runtime backend
- future contract tests

## 2. P1 契约模块

- [security-and-signing.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/security-and-signing.md)
  - `OES_SITE_CREDENTIAL`、HMAC signed request、webhook signing、scope 与错误语义。
- [sync-api.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/sync-api.md)
  - Site Runtime 拉取 latest state、changed resources、public views、snapshot 的 Site-facing API。
- [public-views.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/public-views.md)
  - `ProductPublicView`、`CategoryPublicView`、`BlogPublicView`、`NewsPublicView` 的 P1 数据契约。
- [preview-and-runtime-status.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/preview-and-runtime-status.md)
  - preview token / draft preview view 与 Site Runtime status 契约。
- [admin-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/admin-bff.md)
  - OES Admin 的 Site Management P1 最小 BFF 契约。

## 3. 全局调用约束

### 3.1 Admin 调用

OES Admin 只能通过 `api-gateway` Admin BFF 使用站点管理能力。

Admin BFF 调用要求：

- authenticated operator context
- tenant context
- permission context
- trace context
- audit context for commands

### 3.2 Site Runtime 调用

Site Runtime 只能通过 `@oes/site-runtime-kit` 调用 OES Site-facing BFF / Site API。

Site-facing API 调用要求：

- `OES_SITE_CREDENTIAL`
- HMAC signed request
- timestamp
- nonce
- credential id
- site id
- client id
- trace id
- request id

Site Runtime 不得直接调用 OES Core 内部 API，不得直接调用 `site-service` 内部接口。

### 3.3 Storefront Frontend 调用

Storefront Frontend 不得：

- 持有 `OES_SITE_CREDENTIAL`
- 持有 client secret 或 webhook signing secret
- 直接调用 OES Core API
- 直接调用 OES Site-facing API
- 直接读取 Site Runtime 本地数据库

Storefront Frontend 应通过 Site Runtime 的 SSR / API 路径读取本地 published data。

## 4. P1 状态

本目录当前是 `FROZEN_FOR_P1_IMPLEMENTATION`。

已冻结：

- 与 `site-runtime-kit.md` 对齐
- 与 `site-service.md` 对齐
- 与 `external-site-integration-p1.md` 对齐

实现前仍需要在 implementation plan 中决定：

- `@oes/site-runtime-kit` 的包路径。
- `site-service` 的源码服务路径与持久化实现计划。
- contract tests 的具体落点。

contracts 已冻结后，允许分别编写 `@oes/site-runtime-kit` 与 `site-service` 的实现计划；生产代码实现仍需等待对应 implementation plan 批准。
