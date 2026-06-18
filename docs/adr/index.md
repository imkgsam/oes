# OES ADR 索引

更新时间：2026-06-10

> 涉及 permission-service 的当前服务职责、核心对象或 owner 边界时，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准；ADR 索引只导航历史架构决策。

本目录用于记录关键架构决策与取舍。

当前 ADR：

- `0001-unified-web-scope-aware-user-account.md`
  - 决定 OES 采用统一 Web Shell，并将 `UserAccount` 升级为支持 `SYSTEM / TENANT` scope 的统一工作上下文账号模型。
- `0002-system-role-instance-and-account-role-scope.md`
  - 决定 OES 将系统角色模板、系统级真实角色、租户级真实角色分离，并让 `AccountRole` 支持系统/租户 scope。
- `0003-party-master-service-and-tenant-party-binding.md`
  - 已被 ADR 0008 替代；历史上决定 OES 采用 system-wide `party-service` 主体主数据，并采用 `TenantParty` 作为第一阶段业务域主体引用入口。
- `0004-self-service-and-admin-authorization-boundary.md`
  - 决定 OES 将“当前主体管理自己”的 self-service 能力与“管理员管理别人”的 admin-management 能力分层建模，禁止继续复用同一条管理员权限门。
- `0005-terminal-access-policy.md`
  - 决定 OES 的终端准入策略真相归 `permission-service`，由 `auth-service` 在登录 / refresh 链路消费判定，并由 Web / PDA / KIOSK BFF 固定可信 terminal。
- `0006-terminal-device-service.md`
  - 决定 OES 新增 `terminal-device-service` 作为企业受管现场交互终端设备治理真相源，承接 PDA 设备入网、生命周期、禁用、运行快照、版本策略与设备治理审计。
- `0007-terminal-aware-account-security-phase-2.md`
  - 决定 Terminal-aware Account Security Phase 2 的登录方式、terminal MFA、PDA 设备绑定租户、session、trusted device、登录历史与受管设备清退协同边界。
- `0008-tenant-scoped-tenant-party-primary-party-model.md`
  - 决定 OES 采用 tenant-scoped `TenantParty` 作为核心主体模型，替代 ADR 0003 的 system-wide Party + TenantParty binding 模型。

若后续涉及 bounded context、共享契约、事件模型、权限语义、租户模型、`src/common` 对外 API 或 AI 工具协议变更，应先在本目录新增 ADR，再进入实现。
