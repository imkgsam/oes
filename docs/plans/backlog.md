# OES Deferred Backlog

更新时间：2026-04-13

本文档只用于记录两类内容：

- 已确认后置的事项
- 从活跃 feature 派生，但当前不进入主线处理的 sidecar / unrelated work

它不是灵感池，不是候选功能池，也不是当前活跃 feature 的阻塞面板。

## 1. 归位规则

以下内容不再写入本文件：

- 灵感 -> `docs/plans/ideas.md`
- 候选功能 / 候选设计 -> `docs/plans/candidates.md`
- 当前活跃 feature 的 blocker -> 对应 `docs/plans/features/<feature-key>.md`

只有明确“不是现在做”的事项，才进入本文档。

## 2. Backlog Thread 工作方式

可以单独开启一个 backlog thread，专门处理本文档中的条目。

该线程不直接实现代码，默认职责是：

- 对新条目先给出归位建议
- 统计当前 backlog 状态
- 与用户确认哪些事项应继续后置
- 将后置任务推进为可执行计划
- 将 sidecar work 迁回对应 feature packet 或升级为独立 plan

### 2.1 标准输出格式

每次 backlog thread 开始工作时，应先输出当前概览：

```text
Backlog 概览
- Deferred Work：N 个
- Sidecar Work：N 个

本次建议处理：
- 可继续后置：...
- 已到触发条件：...
- 可迁出到 feature packet：...
```

处理单个条目时，应使用以下格式：

```text
条目：<名称>
分类：Deferred Work / Sidecar Work
当前判断：...
触发条件：...
建议下一步：继续后置 / 迁出到 feature packet / 升级为正式 plan
目标落点：...
```

### 2.2 条目推进规则

- `Deferred Work` 到达触发条件后，必须重新评估，不自动进入实现
- `Sidecar Work` 如果开始影响当前活跃 feature，应迁回对应 feature packet
- 已迁出到正式文档的条目，应在本文件中标记迁出目标，而不是无痕删除

### 2.3 新条目确认规则

当用户提出新的后置事项或派生事项时，不应立即写入本文件。

线程应先给出简短建议：

```text
收到内容：...
建议分类：Deferred Work / Sidecar Work / 应迁入 ideas / 应迁入 candidates / 应回到 feature packet
我认为有价值的部分：...
当前是否属于主线阻塞：是 / 否
建议目标落点：...
等待用户确认：是 / 否 / 调整后再记
```

只有在用户确认后，才写入本文档。

## 3. Deferred Work

| 时间 | 后置事项 | 分类 | 当前判断 | 后续处理 |
|---|---|---|---|---|
| 2026-04-12 | 登录周边能力：二维码登录、找回密码、自助注册、第三方登录 | Deferred Work | 当前认证主链已足够支撑 `tenant-web` 继续推进登录、上下文、Dashboard、登出、权限摘要和自助安全页面；但二维码登录、找回密码、自助注册、第三方登录均不属于当前阶段可执行能力。它们不是单纯前端页面问题，必须区分产品决策、BFF 契约、下游服务能力、前端交互与安全验收。当前前端只允许保留受控占位入口，不得伪造可执行流程。 | 到达触发条件后重新评估并拆成独立 plan / contracts：1. 产品确认该能力进入当前阶段；2. BFF 黑盒契约冻结；3. auth / identity / notification / third-party provider 等下游能力明确；4. 前端再移除占位页并接入真实流程。 |
| 2026-04-13 | 管理员用户检索与租户选择器：按邮箱 / 手机 / 用户名搜索目标用户，以及系统管理员可视化租户选择器 | Deferred Work | 当前“认证与会话管理”页面已经可用，但管理员目标用户定位仍依赖审计事件中的 `operatorId` 或手动输入 `userId`，系统管理员租户筛选仍为 `tenantId` 文本输入。这两个能力都需要新的 BFF 黑盒契约，前端不能直接绕过 BFF 消费内部 `identity-service` 能力。 | 到达触发条件后重新评估并拆成独立 contracts / plan：1. 确认管理员需要更友好的用户检索与租户筛选体验；2. BFF 暴露管理员用户搜索接口；3. BFF 暴露租户目录或租户搜索接口；4. 前端再将文本输入升级为搜索选择器。 |
| 2026-04-13 | 统一账户上下文切换（SYSTEM / TENANT） | Deferred Work | 当前登录、首页、自助安全和管理员认证页都已按现有上下文模型运行，但“登录后切换账户 / 切换上下文”仍涉及 token、session、导航、缓存失效、页面刷新边界，设计尚未冻结，不适合直接编码推进。 | 继续后置，等待 architecture / contracts 收敛后再拆正式 feature packet；未完成设计前不进入实现。 |
| 2026-04-13 | Access token refresh 浏览器端专项联调 | Deferred Work | 前端已具备 refresh 代码路径，但当前业务页面覆盖仍有限，且该专项不应为测试目的新增临时页面或按钮。 | 等更多正式鉴权页面稳定接入后，再以浏览器级联调或 E2E 用例完成专项验证。 |

## 4. Sidecar Work

| 时间 | 条目 | 分类 | 来源 | 当前判断 | 后续处理 |
|---|---|---|---|---|---|

## 5. 使用约束

- 本文件不能直接作为实现依据
- 当前活跃 feature 的 blocker 不得写入本文件
- 如果某条内容已经提升为正式 plan / feature packet，应在本文档中标记迁出目标
