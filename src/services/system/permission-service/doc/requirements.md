# Permission Service 实施约束

更新时间：2026-03-22 12:00:00 +08:00

## 继承规则

本文件继承仓库级约束：

- [../../../../../AGENTS.md](../../../../../AGENTS.md)
- [../../../../../docs/architecture/05-governance.md](../../../../../docs/architecture/05-governance.md)

当本文件与仓库级约束不冲突时，默认同时生效；若本文件补充了更具体的服务级限制，以本文件为准。

## 服务级补充约束

### 1. 先更新设计，再改代码

涉及以下内容时，必须先更新对应设计文档，再开始实现：

- `Role` / `Permission` / `Policy` 模型边界变化
- 鉴权结果语义变化
- 管理接口访问边界变化
- 与根目录跨服务协议相关的 metadata、guard、调用链变化

### 2. 单次只推进一个功能集合分片

默认一次只推进以下集合中的一个最小分片：

- 4.2 角色管理
- 4.3 账号角色管理
- 4.4 权限管理
- 4.5 Policy 管理
- 4.6 鉴权能力

### 3. 项目级架构优先

若某次改动涉及内部服务认证、操作者上下文或服务间授权链路：

- 先以 `docs/architecture/14-grpc-metadata-and-service-trust-architecture.md` 与 `docs/architecture/15-authorization-layering-and-resource-policy-architecture.md` 为准
- 若需调整协议，先更新项目级架构或 ADR
- 再更新本服务设计与代码

### 4. 文档更新规则

- 稳定结论写入 `design/*.md`
- 阶段变化写入 [roadmap.md](./roadmap.md) 或 `tasks/*.md`
- 变更过程写入 `history/*.history.md`

### 5. “已实现”额外判定

除仓库级要求外，`permission-service` 中某项功能若要标记为“已实现”，还应满足：

- 服务内授权边界未被绕过
- 租户边界明确
- 契约和文档保持一致
