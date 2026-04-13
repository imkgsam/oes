# Identity Service 文档与实施约束

更新时间：2026-03-23 15:20:00 +08:00

## 继承的全局规范

`identity-service` 默认继承并严格遵循以下规范：

- [AGENTS.md](../../../../../AGENTS.md)
- [docs/architecture/05-governance.md](../../../../../docs/architecture/05-governance.md)
- [docs/governance/codex-threading-rules.md](../../../../../docs/governance/codex-threading-rules.md)

## 本服务额外约束

### 1. 先设计，后改 schema，再写代码

`identity-service` 当前历史代码和旧 `schema.prisma` 不能视为既定事实。任何核心模型调整都应先更新设计文档，再推进 schema 和代码。

### 2. 过时代码必须显式标记

发现明确不再采用的历史实现时，应优先标记 `outdated` 并说明原因。未经确认，不直接物理删除。

### 3. gRPC + CQRS 是目标结构

本服务最终结构应收敛为：

- `interfaces/grpc`
- `application/commands`
- `application/queries`
- `domain`
- `infrastructure`
- `modules`

`TCP` 相关入口和控制器视为过时方向。

### 4. 任务必须按最小闭环拆分

`tasks/*.md` 默认只承接一个明确的最小功能闭环，不使用“大阶段打包任务”替代可执行分片。

### 5. 设计与任务必须双向追踪

- 每个 `design/*.md` 必须有“关联任务完成情况”表
- 每个 `tasks/*.md` 必须明确上游 `design/*.md`
- 全局审核时间必须同步到关联表

### 6. “已实现”状态判定

只有满足以下条件，任务或设计关联项才可标记为“已实现”：

- 代码闭环完成
- 构建验证通过
- 对应文档已同步
- 全局审核记录已更新

否则只能标记为“部分实现”或“未开始”。
