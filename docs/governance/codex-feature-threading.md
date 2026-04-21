# OES Codex Feature Thread 协作规范

## 1. 目的

本文档定义 OES 在单个 feature 上如何使用 Codex thread 做并行推进。

目标不是“尽量多开 thread”，而是：

- 让 thread 只读取完成任务所需的最小上下文
- 让前后端或多服务可以并行
- 让协作信息只有一个协调面板，不再通过多份文档来回同步
- 让每个 thread 都有清晰 ownership、输入、输出和关闭条件

本文档属于执行治理规范，必须服从以下上游文档：

- `AGENTS.md`
- `docs/architecture/*.md`
- `docs/adr/*.md`
- `docs/governance/codex-threading-rules.md`
- `docs/governance/codex-workflow.md`

## 2. 核心结论

### 2.1 不按“前端 / 后端”长期固定拆分

对于跨模块 feature，默认不采用“一个 thread 只做前端，另一个 thread 只做后端”的长期固定分工。

原因：

- 当契约尚未冻结时，前端和后端会互相等待
- 两边容易在不同文档中重复描述同一组字段和状态
- 真正的阻塞通常来自契约和验收边界，而不是技术栈边界

更推荐按以下角色拆分：

- contract / producer owner
- consumer owner
- review / integration owner

### 2.2 不是每个 feature 都必须开多个 thread

默认规则：

- 小 feature：一个 thread 直接闭环
- 中等 feature：先一个 thread 定义 feature packet 与契约，再按需要拆成两个或更多 thread
- 大 feature：按 vertical slice 拆成多个 thread，但每个 slice 都要能独立验收

判断标准不是“功能听起来大不大”，而是：

- 是否存在稳定的边界
- 是否可以限定写路径
- 是否可以独立验证
- 是否会因为等待另一个 thread 而长期停滞

### 2.3 同一 feature 下允许受控复用 thread

默认不鼓励为复用而长期保留 thread，但在同一 feature 下，允许按 owner 角色受控复用 thread。

推荐规则：

- 一个 thread 必须只服务一个明确 feature
- 同一 feature 下，可由同一 owner 继续推进多个相邻 slice
- feature 完成后关闭 thread
- 新 feature 默认新开 thread

只有在以下条件同时成立时，才建议复用已有 thread：

- 职责边界没有变化
- 主要修改路径没有变化
- 上下文仍然是同一个 feature packet
- 不会把旧上下文污染到新的目标

换句话说：

- 新 feature 通常新开 thread
- 同一 feature 的下一小步，在同一 owner、同一路径 ownership 下允许复用

## 3. Feature Packet 机制

### 3.1 每个跨线程 feature 必须有一个 feature packet

路径约定：

- `docs/plans/features/<feature-key>.md`

示例：

- `docs/plans/features/context-switch.md`
- `docs/plans/features/lock-screen-rework.md`

### 3.2 feature packet 的职责

feature packet 只负责协作与执行，不替代架构文档或契约文档。

它回答的问题应当只有：

- 这个 feature 的目标是什么
- 当前依赖哪些正式设计
- 哪些 thread 在做什么
- 谁拥有契约真相
- 当前阻塞点是什么
- 哪些 slice 已完成、哪些未完成
- 什么条件下可以关闭当前 thread
- 当前主线范围是什么
- 派生问题被记录到了哪里

### 3.3 feature packet 不是这些东西

feature packet 不能替代：

- `docs/architecture/**` 的稳定边界
- `docs/contracts/**` 的契约真相
- `docs/adr/**` 的决策记录
- `docs/plans/backlog.md` 的后置事项登记

## 4. 一个 feature 的推荐文档分层

对于一个可并行 feature，推荐只保留以下三类真相：

### 4.1 稳定边界真相

放在：

- `docs/architecture/**`
- 或 `docs/adr/**`

负责定义：

- 边界
- 职责
- 长期模型
- 明确禁止事项

### 4.2 契约真相

放在：

- `docs/contracts/**`

负责定义：

- endpoint / RPC
- request / response
- error semantics
- 当前是否已实现
- fixture / example payload

### 4.3 协作状态真相

放在：

- `docs/plans/features/<feature-key>.md`

负责定义：

- 当前 owner
- 当前 slice
- 当前阻塞
- 当前验收标准

禁止把这三类信息分散到多份“对照说明文档”中来回同步。

## 5. 推荐线程角色

### 5.1 contract / producer owner

职责：

- 在实现并行前，消费已冻结的 feature 设计
- 冻结当前 slice 的 contract
- 提供 fixture / sample payload
- 实现 producer 侧代码
- 明确何时可供 consumer 接入

通常负责：

- `docs/contracts/**`
- BFF / gateway / service producer 侧实现
- mock / fixture

输出：

- 稳定契约
- 可消费样例
- `READY_FOR_CONSUMER`

### 5.2 consumer owner

职责：

- 基于已冻结契约接入消费方
- 不在本 thread 中重新发明契约
- 对契约问题进行反馈，但不擅自改动契约真相

通常负责：

- 前端接入
- 下游消费适配
- contract fixture 驱动开发

输出：

- 消费方实现
- UI / downstream adapter 接入结果
- 发现的契约缺口

### 5.3 review owner

职责：

- 检查 thread 是否越界
- 检查是否偏离 feature packet
- 检查是否把局部约定误写成全局规则

### 5.4 integration owner

职责：

- 收口多个已完成 slice
- 做统一验证
- 关闭已完成的临时 thread

## 6. 一个 feature 应该如何拆 slice

### 6.1 默认按 vertical slice 拆，而不是按技术层拆

错误示例：

1. thread A: 全部前端
2. thread B: 全部后端

推荐示例：

1. slice A: 契约 + fixture + producer endpoint
2. slice B: consumer 接入 + 基础交互
3. slice C: 权限 / 错误态 / 缓存一致性
4. slice D: 自动化验证与收口

原因：

- 每个 slice 都能独立验收
- 不会把前后端完全串死
- 出错时只回退一个 slice，而不是整个 feature

### 6.2 只有满足以下条件才值得拆更多 thread

- 写路径能明确隔离
- 契约已经冻结，或能先冻结最小契约
- 可以用 fixture 先推进 consumer
- 每个 thread 都能产出独立可检查结果

如果不满足这些条件，强行并行只会制造同步成本。

### 6.3 先 design，再并行实现

对于跨线程 feature，默认顺序是：

1. feature design thread 冻结目标、边界与最小契约
2. producer / consumer owner 基于该设计并行推进
3. review / integration 收口

如果没有先完成 design thread，就不应让多个实现 thread 同时猜测边界与字段。

## 7. thread 生命周期规则

### 7.1 何时创建新 thread

以下情况建议新开 thread：

- 新 feature
- 同一 feature 的新 slice，但职责已变化
- 需要修改新的路径 ownership
- 需要新的上游材料
- 旧 thread 已完成原始目标

### 7.2 何时关闭 thread

thread 满足以下条件时应关闭：

- 该 thread 的目标已完成
- 验收项已完成或明确失败原因
- 输出已回写到 feature packet
- 未决问题已转移到 backlog 或下一 slice

### 7.3 何时不应复用旧 thread

以下情况不应复用：

- 新 feature 与旧 feature 不是同一 packet
- 修改路径已经变化
- 需要重新理解另一套业务边界
- 旧 thread 中积累了大量已失效上下文

## 8. feature packet 的最小必填项

每个 feature packet 至少应包含：

1. `目标`
2. `不做什么`
3. `上游依赖`
4. `契约真相位置`
5. `线程分工`
6. `当前 slice`
7. `主线范围`
8. `阻塞 / 依赖`
9. `派生问题 ledger`
10. `验收标准`
11. `关闭条件`

## 9. 推荐执行流程

### 第一步：先建 feature packet

先明确：

- 目标
- 边界
- owner
- slice
- 主线范围

### 第二步：冻结最小契约

至少冻结：

- request
- response
- error cases
- sample payload

这里强调：

- 冻结的是当前阶段的最小可执行基线
- 不是承诺“以后永远不变”
- 目标是让 producer / consumer 能围绕同一个黑盒真相并行推进

### 第三步：按 owner 并行

- producer owner 实现真实接口
- consumer owner 基于 fixture 接入

### 第四步：review + integration

- 检查越界
- 检查契约漂移
- 检查验收是否闭环

### 第五步：关闭当前 slice thread

- 回写 packet
- 标记状态
- 开启下一个 slice 或结束 feature

## 9.1 thread 的默认行为准则

为避免 thread 逐步偏离主线，默认遵守以下行为准则：

- 优先推进代码闭环，不把“补说明文档”当成主工作面
- 只在边界、契约、进度或后置判断变化时回写文档
- 默认只读当前任务需要的最小文档集，不做横向泛读
- 发现新问题时先分类，再决定是否进入当前 thread
- 未冻结契约前，不让 producer / consumer 长时间各自猜字段
- checklist 只更新完成度，不承担需求设计与契约解释职责

## 9.2 需求变化时怎么处理

如果实现过程中发现“冻结过早”或“场景变化”，默认不要直接扩任务，而是按以下顺序判断：

1. 这是不是只影响实现细节
2. 这是不是已经改变了黑盒契约
3. 这是不是已经改变了 feature 目标、范围或验收标准

对应处理：

- 只影响实现细节 -> 留在当前 thread，按 `Implementation Adjustment` 处理
- 改变黑盒契约 -> 先回写 contracts，再继续 producer / consumer
- 改变 feature 目标或范围 -> 先回写 feature packet，必要时升级到 architecture / ADR

这样做的目的是：

- 允许变化
- 但不允许无入口、无回写、无边界地漂移

## 10. 主线锁定与派生问题分流

### 10.1 每个 thread 只能有一个主线目标

每个 thread 开始时，都必须明确：

- 当前主线目标
- 什么算完成
- 当前 thread 不做什么

### 10.2 新问题不能直接顺手开做

当 thread 推进过程中发现新问题时，必须先分类：

- `Blocker-Now`
- `Blocker-Later`
- `Sidecar`

只有 `Blocker-Now` 才允许在当前 thread 中受控处理。

### 10.3 只允许一层受控偏移

主线遇到 blocker 时，当前 thread 可以处理该 blocker。

但如果 blocker 再派生出新的 blocker，默认不继续无限下钻，应先记录到 `派生问题 ledger`，再决定：

- 升级回 design / contract / architecture owner
- 转入下一 slice
- 迁入 backlog

### 10.4 偏移前必须写返回点

每次准备偏离主线前，应先写清楚：

- 当前主线是什么
- 为什么要偏移
- 偏移去解决什么
- 满足什么条件后必须返回主线

## 11. 反模式

以下做法应避免：

- 用多份 A/B 文档互相同步同一 feature 状态
- 契约未冻结就让前后端长期并行各自猜字段
- 一个 thread 同时负责多个无关 feature
- 同一批核心文件交给多个 implementation thread
- 把“临时说明”写成稳定架构
- 为了复用 thread 而让 thread 长期挂着不关闭
- 发现新问题后不分类，直接顺手扩任务
- 让当前活跃 feature 的 blocker 漂到 backlog 里
- 不记录返回点就连续偏离主线

## 12. 当前默认执行建议

对 OES 当前阶段，默认采用以下策略：

- 小 feature：一个 thread 闭环
- 跨前后端 feature：先 design thread，再由 producer / consumer owner 并行
- 高风险跨模块 feature：先 architecture / contract，再 implementation
- 同一 feature 下允许受控复用 owner thread
- feature 完成后及时关闭 thread
- 新 feature 默认新开 thread

结论：

- 不是每个 feature 都必须开多个 thread
- 但跨模块 feature 通常不应只靠“前端 thread / 后端 thread”长期对写文档协作
- 最稳的方式是：一个 feature packet，少量 owner thread，按 slice 推进，完成即关闭
