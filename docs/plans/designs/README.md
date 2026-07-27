# OES 设计工作台索引

## 1. 目的

本目录用于承载 OES 的长周期设计过程工作台，解决以下问题：

- 一个设计讨论可能持续多轮，无法一次冻结
- 设计线程可能在同一主题内多次中断与恢复
- 需要记录开放问题、已确认决定与回写目标
- 需要避免不同服务、feature 与协同议题混写

这里记录的是“设计过程”，不是最终真相，也不是所有设计都必须经过的一层。

## 2. 与其他文档的关系

- `docs/architecture/services/*.md`
  - 记录服务职责真相
- `docs/architecture/collaborations/*.md`
  - 记录跨服务协同真相
- `docs/contracts/**`
  - 记录契约真相
- `docs/plans/features/*.md`
  - 记录 feature 执行状态
- `docs/plans/designs/*.md`
  - 记录尚未完全冻结的设计过程、开放问题、决策日志与回写计划

## 3. 使用规则

- design workspace 不是默认必建。
- 每个 design workspace 必须在正文开头维护 `0. 文档控制`，明确 `designKey`、`designStatus`、`lastUpdatedAt`、`lastUpdatedBy`、`supersedes` 与 `conflictResolution`。
- 每次写入已冻结或后置结论时，必须更新 `lastUpdatedAt`，避免下次读取时无法判断新旧设计优先级。
- 若 workspace 与旧讨论、旧 workspace 或旧草稿冲突，优先看 `lastUpdatedAt` 与 `conflictResolution`；若稳定 `architecture / ADR / contracts` 明确覆盖 workspace，则以稳定真相源为准。
- 如果一个设计已经足够清晰，可以直接转成 `feature packet` 并进入执行，则应直接进入 `docs/plans/features/*.md`，不额外建立 workspace。
- 一个 design workspace 只服务一个设计主题。
- 一个设计主题可以是：
  - 一个新服务
  - 一个跨服务协同能力
  - 一个待冻结的 feature design
- 更适合建立 workspace 的场景包括：
  - 新服务或大服务设计
  - 会持续多轮推进的复杂协同设计
  - 当前还不能直接进入 feature packet 的 feature design
  - 需要频繁中断与恢复上下文的设计过程
- 若讨论已经转向另一个无直接关系的主题，必须新建 workspace，而不是继续混写。
- 已冻结结论必须尽快回写到唯一真相源，不能长期滞留在 workspace。
- design workspace 是过程文件，不是稳定真相源；当设计已冻结且结论已回写完成后，必须退出 active 状态。
- 已退出 active 的 workspace 不得继续作为当前设计入口扩写；后续变更应进入对应真相源、feature packet，或新建新的设计主题 workspace。
- workspace 应保持短小、可恢复、可接续，不写大而全重复正文。

### 3.1 冻结后的收口规则

设计冻结后，维护线程必须先确认所有冻结结论已经回写到正确位置：

- 服务职责：`docs/architecture/services/*.md`
- 跨服务协同：`docs/architecture/collaborations/*.md`
- 架构取舍：`docs/adr/*.md`
- 黑盒契约：`docs/contracts/**`
- feature 执行状态：`docs/plans/features/*.md`

回写完成后，design workspace 必须执行以下收口动作之一：

- 标记为 `SUPERSEDED_BY_TRUTH_SOURCE`，并在 `0. 文档控制` 写明 `truthSource` 与 `doNotUseAsStableSource: true`
- 移动到 `docs/plans/designs/archive/`，仅作为历史设计过程记录
- 若已被稳定真相源完全覆盖且无导航或历史解释价值，可以删除

禁止事项：

- 禁止让已冻结 workspace 长期保持 `ACTIVE_DESIGN_WORKSPACE`
- 禁止把 archived / superseded workspace 当作稳定设计依据
- 禁止在旧 workspace 内继续扩写新主题或新版本设计

## 4. 推荐命名

- `<service-key>-design.md`
- `<capability-key>-design.md`
- `<feature-key>-design.md`

示例：

- `erp-service-design.md`
- `authorization-scope-evolution-design.md`
- `account-security-visibility-design.md`

## 5. 推荐模板

````md
# <Design Topic>

## 0. 文档控制

```text
designKey: <design-key>
designStatus: ACTIVE_DESIGN_WORKSPACE
implementationStatus: IDEA_ONLY | DESIGN_FROZEN | FEATURE_PACKET_CREATED | PARTIALLY_IMPLEMENTED | IMPLEMENTED | DEFERRED | NOT_APPLICABLE
lastUpdatedAt: YYYY-MM-DD HH:mm:ss TZ
lastUpdatedBy: <human-or-thread>
supersedes: <older-design-or-discussion-it-replaces>
truthSource: <architecture/collaboration/ADR/contract/feature path after frozen, or empty while active>
doNotUseAsStableSource: false
conflictResolution: 当本文与更早讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR / contracts 明确覆盖本文时，以稳定真相源为准。
```

## 1. 目标

- 

## 2. 当前范围

- 本 workspace 负责：
- 本 workspace 不负责：

## 3. 涉及对象

- services:
  - 
- features:
  - 
- collaborations:
  - 

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |

## 5. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |

## 6. 真相源回写计划

- 服务职责：
- 协同蓝图：
- contracts：
- feature packet：
- architecture / ADR：

## 7. 恢复入口

- 下次继续前先读：
  - 
- 当前推荐下一步：
  - 
````

## 6. 当前状态

当前目录作为规则与模板入口保留；只有当某项设计确实进入长周期推进时，才建立具体 workspace。

当前已建立或正在推进的 active design workspace 包括：

- [article-content-model-exploration.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/article-content-model-exploration.md)
- [after-sales-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/after-sales-service-design.md)
- [customer-touchpoint-and-platform-integration-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/customer-touchpoint-and-platform-integration-design.md)
- [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
- [contact-asset-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/contact-asset-design.md)
- [employee-digital-business-card-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/employee-digital-business-card-design.md)
- [item-master-model-item-bom-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/item-master-model-item-bom-design.md)
- [packaging-master-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/packaging-master-design.md)
- [wms-inventory-package-unit-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/wms-inventory-package-unit-design.md)
- [warehouse-site-work-context-permission-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/warehouse-site-work-context-permission-design.md)
- [planning-workbench-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/planning-workbench-design.md)
- [scan-identity-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/scan-identity-design.md)
- [shortlink-public-entry-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/shortlink-public-entry-design.md)
- [site-locale-exposure-governance.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/site-locale-exposure-governance.md)
- [whatsapp-sales-inbox-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/whatsapp-sales-inbox-design.md)
- [wms-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/wms-service-design.md)

已退出 active 或暂停维护的 design workspace 包括：

- [collaboration-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/collaboration-service-design.md)
  - Task P1 已冻结并实现完成；后续 Task P2/P3 设计后置，annotation / notification / project 由独立线程承接。

MES 当前新设计不再维护 design workspace，统一沉淀到 [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)。
