# OES ADR 索引

更新时间：2026-04-19

本目录用于记录关键架构决策与取舍。

当前 ADR：

- `0001-unified-web-scope-aware-user-account.md`
  - 决定 OES 采用统一 Web Shell，并将 `UserAccount` 升级为支持 `SYSTEM / TENANT` scope 的统一工作上下文账号模型。
- `0002-system-role-instance-and-account-role-scope.md`
  - 决定 OES 将系统角色模板、系统级真实角色、租户级真实角色分离，并让 `AccountRole` 支持系统/租户 scope。
- `0003-party-master-service-and-tenant-party-binding.md`
  - 决定 OES 将原 `entity-service` 概念演进为 `party-service`，并采用 `TenantParty` 作为第一阶段业务域主体引用入口。
- `0004-self-service-and-admin-authorization-boundary.md`
  - 决定 OES 将“当前主体管理自己”的 self-service 能力与“管理员管理别人”的 admin-management 能力分层建模，禁止继续复用同一条管理员权限门。

若后续涉及 bounded context、共享契约、事件模型、权限语义、租户模型、`src/common` 对外 API 或 AI 工具协议变更，应先在本目录新增 ADR，再进入实现。
