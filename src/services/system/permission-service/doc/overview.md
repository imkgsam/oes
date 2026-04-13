# Permission Service 概览

更新时间：2026-04-06 11:20:00 +08:00

## 服务定位

`permission-service` 是 `oes` 的授权中心，负责权限、角色、策略和鉴权决策能力，不负责用户登录认证和身份主数据维护。

## 职责边界

负责：

- `Permission` 核心权限模型
- `Role` 模板与租户实例模型
- `Policy` 及其与权限的绑定关系
- `CheckPermission`
- 历史兼容 `CheckPermissionWithContext`
- 后台管理接口的授权边界

不负责：

- 外部用户登录认证
- access token 原始签发
- 用户主数据、账号主数据维护

## 上游依赖

- 仓库级执行约束见 [../../../../../AGENTS.md](../../../../../AGENTS.md)
- 项目级治理规则见 [../../../../../docs/architecture/05-governance.md](../../../../../docs/architecture/05-governance.md)
- 多线程协作规则见 [../../../../../docs/governance/codex-threading-rules.md](../../../../../docs/governance/codex-threading-rules.md)

## 文档分工

- [INDEX.md](./INDEX.md)：导航入口
- [overview.md](./overview.md)：服务定位与边界
- [roadmap.md](./roadmap.md)：阶段划分、优先级、实施顺序
- `design/*.md`：功能设计细节和长期注意事项
- `tasks/*.md`：实施步骤与待办切片
- `history/*.history.md`：历史演进记录

## 当前能力域

- 角色管理
- 账号角色管理
- 权限管理
- Policy 管理
- 鉴权能力

## 当前结论

- 角色模型采用 `SYSTEM_TEMPLATE + TENANT_INSTANCE`
- `Policy` 以 `Permission` 作为核心挂载对象
- 业务管理接口需要在服务内完成操作者授权，不只依赖网关
- 跨服务安全协作统一遵循 `docs/architecture/14-grpc-metadata-and-service-trust-architecture.md` 与 `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md`
- 服务内可独立闭环的能力已基本完成，包括：
  - `Role / AccountRole / Permission / Policy` 管理主链
  - `CheckPermission` 与历史兼容 `CheckPermissionWithContext`
  - 管理接口的内部服务认证、操作者校验、本地最终授权与租户范围收口
  - 管理变更审计与鉴权决策记录持久化
- 当前剩余未完成项主要是依赖上游联调或更重解释模型的功能：
  - gateway 拒绝链统一 JSON 错误响应收尾
