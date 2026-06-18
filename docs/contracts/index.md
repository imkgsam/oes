# OES 契约文档索引

更新时间：2026-06-18

> 涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；本索引只导航黑盒 contract。

本目录用于沉淀黑盒接口契约，描述调用方可依赖的请求、响应、错误语义与边界，不承载服务内部实现设计。

## 当前契约入口

| 范围 | 文档入口 |
|---|---|
| API Gateway / BFF | [api-gateway/README.md](./api-gateway/README.md) |
| asset-service | [asset-service/README.md](./asset-service/README.md) |
| auth-service | [auth-service/README.md](./auth-service/README.md) |
| collaboration-service | [collaboration-service/README.md](./collaboration-service/README.md) |
| crm-service | [crm-service/README.md](./crm-service/README.md) |
| hr-service | [hr-service/README.md](./hr-service/README.md)，服务设计以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准 |
| identity-service | [identity-service/README.md](./identity-service/README.md) |
| mes-service | [mes-service/README.md](./mes-service/README.md) |
| permission-service | [permission-service/README.md](./permission-service/README.md) |
| party-service | [party-service/README.md](./party-service/README.md) |
| public-entry-service | [public-entry-service/README.md](./public-entry-service/README.md) |
| site-service | [site-service/README.md](./site-service/README.md)，服务设计以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准 |
| tenant-org-service | [tenant-org-service/README.md](./tenant-org-service/README.md) |
| wms-service | [wms-service/README.md](./wms-service/README.md) |

## 使用规则

- 契约文档只描述对外可依赖行为，不复制服务内部领域设计。
- gRPC / proto 语义变化必须先有项目级架构或 ADR 支撑。
- 前端与调用方联调以本目录为入口，具体真相源仍以代码中的 controller、DTO、proto 和 presenter 为准。
