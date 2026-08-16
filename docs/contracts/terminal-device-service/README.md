# Terminal Device Service Contracts

> 服务设计唯一真相源：[terminal-device-service.md](../../architecture/services/terminal-device-service.md)。本目录只描述 `terminal-device-service` 的黑盒服务契约，不重新定义服务长期职责。

Phase 2 contracts:

- [enrollment.md](./enrollment.md)
- [device-access-decision.md](./device-access-decision.md)
- [device-management.md](./device-management.md)
- [runtime-snapshot.md](./runtime-snapshot.md)
- [version-policy.md](./version-policy.md)

These contracts are intended for internal service-to-service use through explicit gRPC or equivalent internal contracts. Front ends must use API Gateway / BFF contracts.
