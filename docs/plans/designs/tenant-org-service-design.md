# tenant-org-service Design

## 1. 目标

- 收敛 `tenant-org-service` 的完整服务设计，明确 tenant boundary、org tree、account 组织归属与 org scope 的边界。
- 记录当前已冻结的设计决定、关键使用场景与后续需要回写的真相源。
- 为后续 `Tenant` owner 从 `identity-service` 迁移到 `tenant-org-service` 提供设计恢复入口。

## 2. 当前范围

- 本 workspace 负责：
  - `Tenant`
  - `OrgUnit`
  - `OrgMembership`
  - `OrgScope`
  - 与 `identity-service`、`permission-service`、报表中心、审批路由的边界
- 本 workspace 不负责：
  - `hr-service` 任职、岗位、汇报关系
  - 完整审批引擎设计
  - BI / 报表中心具体页面与交互实现
  - tenant 迁移实施细节与数据迁移脚本

## 3. 涉及对象

- services:
  - `tenant-org-service`
  - `identity-service`
  - `permission-service`
  - future `workflow-service`
  - future reporting / BI services
- features:
  - 报销申请与审批路由
  - 报表中心组织视角分析
  - 租户与组织管理
- collaborations:
  - account context 与 tenant 引用协同
  - org scope 与授权 / 查询过滤协同

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-21 | `tenant-org-service` 的目标职责是统一管理 `tenant + org`，不是只管理 org 的辅助服务。 | 服务边界、tenant owner 迁移方向 | `docs/architecture/services/tenant-org-service.md` / ADR |
| 2026-04-21 | `Tenant` owner 目标态迁入 `tenant-org-service`；`identity-service` 未来保留 account 到 tenant 的引用与上下文聚合。 | `identity-service` / `tenant-org-service` 边界 | ADR / migration plan |
| 2026-04-21 | 第一版核心模块收敛为 `Tenant`、`OrgUnit`、`OrgMembership`、`OrgScope`。`OrgContext` 不作为第一版核心主轴。 | 服务模块划分 | 服务设计正文 / contracts |
| 2026-04-21 | `tenant account context` 是主工作上下文；`org` 主要承担结构、归属与范围解析。只有少数模块场景才显式暴露 org 视角。 | account context、BFF、前端、BI | collaboration / feature packet |
| 2026-04-21 | 报销申请等业务单据不能仅依赖 `OrgMembership` 动态猜测审批归属；提交时应冻结 `submitOrgId` / `ownerOrgId`，审批流据此路由。 | 审批、业务单据、workflow | collaboration / feature packet |
| 2026-04-21 | 报表中心是 `OrgScope` 的核心使用场景：用户应能从自己可覆盖的上级组织看汇总，再 drill down 到下级组织或小组。该能力应通过“模块内组织视角选择 + drill down”实现，而不是全局 org session context。 | reporting / BI、org scope | future reporting feature / collaboration |

## 5. 关键使用场景

### 5.1 报销申请提交与审批路由

- 一个 account 在同一 tenant 下可以属于多个 org。
- 报销申请提交时，系统不能仅根据当前 membership 自动猜测审批归属。
- 正式方案：
  - 若只有一个可发起业务归属 org，则默认使用该 org。
  - 若存在多个可发起业务归属 org，则提交时要求用户明确选择一次。
  - 单据提交后冻结 `submitOrgId` 或 `ownerOrgId`。
  - 审批流根据该 org 解析审批模板、组织负责人或上级组织链路。

### 5.2 报表中心组织视角与 drill down

- 示例组织树：
  - `销售部`
    - `外销`
      - `A组`
      - `B组`
    - `内销`
      - `华东区`
      - `华南区`
- 目标场景：
  - 销售部负责人默认从 `销售部` 视角查看整体汇总。
  - 可以继续 drill down 到 `外销`、`内销`、`A组`、`华东区` 等下级组织视图。
  - 该能力基于 `OrgScope` 限制“最多可看哪一片树”，然后由报表模块内组织选择器在授权范围内切换视图。
- 设计结论：
  - 报表中心需要强依赖 `OrgScope`。
  - 不需要把 org 做成全局 session context。

## 6. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-04-21 | `OrgMembership` 的 `relationType` 第一版是 `PRIMARY / SECONDARY / TEMPORARY`，还是收窄为更简单模型？ | 需要结合审批、报表和多组织归属场景决定最小可用复杂度。 | 继续设计 `OrgMembership` command / query 时收口。 |
| 2026-04-21 | 是否需要“org 子树管理员”能力；若需要，它与 tenant 管理员的边界、授权语义和典型场景是什么？ | 当前只确认大租户下可能存在分公司 / 工厂自治需求，但尚未确认是否属于第一阶段核心能力。 | 后续单独评估治理场景，必要时拆成独立 capability design。 |
| 2026-04-21 | `OrgScope` 是直接暴露通用 `scopeMode`，还是收敛成更语义化的 resolver 接口？ | 当前通用模式易理解设计，但对业务调用方可能过于抽象。 | 在 contracts 设计时评估对内 / 对外形态。 |

## 7. 真相源回写计划

- 服务职责：
  - `docs/architecture/services/tenant-org-service.md`
- 协同蓝图：
  - tenant / org 与 account context
  - tenant / org 与审批路由
  - tenant / org 与 reporting / BI
- contracts：
  - future `docs/contracts/tenant-org-service/**`
- feature packet：
  - future reporting / BI feature
  - future tenant / org management feature
- architecture / ADR：
  - tenant owner 从 `identity-service` 迁移到 `tenant-org-service`

## 8. 恢复入口

- 下次继续前先读：
  - `docs/architecture/services/tenant-org-service.md`
  - `docs/architecture/services/identity-service.md`
  - `docs/plans/backlog.md`
  - 本 workspace
- 当前推荐下一步：
  - 继续冻结 `OrgMembership` 的最小模型与约束
  - 再收敛 `OrgScope` 的接口形态与对下游的调用方式
