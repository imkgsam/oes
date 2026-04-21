# OES 文档优化主线收尾记录

## 1. 目的

本文档用于记录本轮 `docs/` 文档优化主线已经完成的治理收敛结果，避免后续线程再次把文档写回重复、混层或漂移状态。

它不替代 [docs-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/governance/docs-architecture.md)，而是对当前整理结果做一次落地确认。

## 2. 本轮已确认并落地的规则

### 2.1 四层文档框架已固定

当前项目级文档统一按以下四层归位：

- `docs/architecture/`
  - 稳定设计、长期边界、职责划分、禁止事项
- `docs/contracts/`
  - 黑盒契约、调用边界、错误语义、请求响应约束
- `docs/plans/`
  - 阶段计划、feature packet、ideas、candidates、backlog
- `docs/governance/`
  - 协作规则、线程规则、文档规则、执行纪律

### 2.2 入口结构已固定

当前统一入口如下：

- [docs/index.md](/Users/acehood/Documents/GitHub/oes/docs/index.md)
- [docs/architecture/index.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/index.md)
- [docs/contracts/index.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/index.md)
- [docs/plans/index.md](/Users/acehood/Documents/GitHub/oes/docs/plans/index.md)
- [docs/governance/index.md](/Users/acehood/Documents/GitHub/oes/docs/governance/index.md)

要求：

- 入口页只做导航
- 入口页不承载大段正文设计
- 子目录应优先从各自 `index.md` 进入

### 2.3 过渡态文档概念已收口

以下做法不再作为长期文档类型保留：

- `followups` 作为正式文档分类
- 在 `contracts/` 中保留未冻结的后续项
- 在索引页重复维护其他目录的长清单

当前规则：

- 已冻结契约进入 `docs/contracts/`
- 未冻结但明确值得推进的事项进入 `docs/plans/candidates.md`
- 已确认后置事项进入 `docs/plans/backlog.md`

### 2.4 单一真相源规则已落地

同一条信息只应有一个正式归属位置：

- 稳定设计只在 `architecture`
- 黑盒契约只在 `contracts`
- 执行状态与阶段推进只在 `plans`
- 协作与执行纪律只在 `governance`

其他文档只能引用，不应再写成第二份真相。

## 3. 本轮已完成的关键收敛

### 3.1 `api-gateway` 契约层收敛

已完成：

- 将 `README` 收敛为纯导航入口
- 清理 `contracts/` 中的过渡态 `followups` 概念
- 将未冻结认证后续项迁回 `docs/plans/candidates.md`
- 收敛 `permission-management.md` 中的执行痕迹与重复说明

### 3.2 服务契约层复核

已完成：

- `auth-service` 契约层复核
- `identity-service` 契约层复核
- `permission-service` 契约层复核

结论：

- 以上目录已基本符合 `contracts/` 职责
- 少量带草稿语气的表述已收敛为正式契约语气

### 3.3 治理入口补齐

已完成：

- 新增 [docs/governance/index.md](/Users/acehood/Documents/GitHub/oes/docs/governance/index.md)
- 顶层入口改为通过治理目录索引进入，而不是直接进入单个规则文件

## 4. 后续新增文档准入规则

后续新增文档前，必须先判断归属：

### 4.1 什么时候进 `contracts`

只有当内容满足以下条件时，才进入 `docs/contracts/`：

- 已形成可依赖的黑盒契约
- 调用方可以按该文档接入
- 请求、响应、错误语义已经基本稳定

不满足以上条件时，不得先写入 `contracts/`。

### 4.2 什么时候进 `plans/candidates`

满足以下条件时，应进入 `docs/plans/candidates.md`：

- 用户明确想做
- 但边界、契约、实施方式还未冻结
- 当前还不能直接进入实现

### 4.3 什么时候进 `backlog`

满足以下条件时，应进入 `docs/plans/backlog.md`：

- 已确认后置
- 或从当前活跃 feature 派生出来，但本轮明确不做

### 4.4 什么时候必须先补 `architecture` 或 ADR

涉及以下内容时，必须先补稳定设计，再进入实现：

- bounded context
- 跨服务契约
- 权限语义
- 租户模型
- operator context
- AI 工具协议
- 共享抽象边界

## 5. 剩余少量维护点

以下事项仍可后续按需处理，但不影响当前文档框架已经成立：

- 个别正文文档中的旧更新时间
- 少数计划文档里的 `draft` 命名是否需要在正式冻结后迁移
- 少数大型专题文档内部是否还存在可继续压缩的重复段落

这些属于后续维护，不属于当前文档框架未完成。

## 6. 当前结论

截至本轮整理完成后，OES 项目级 `docs/` 已从“历史文档混层状态”收敛到“有统一框架、有统一入口、有单一真相源约束”的状态。

后续线程默认应遵循本结论推进，而不是重新发明新的文档层级或过渡文档类型。
