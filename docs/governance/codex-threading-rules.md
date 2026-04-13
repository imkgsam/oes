# OES Codex 多线程治理规则

## 1. 目的

本文档定义 OES 项目中多个 Codex 线程并行工作时的职责划分、路径 ownership、文件修改边界与受保护文件机制。

目标是让多线程开发满足以下要求：

- 在统一设计下并行
- 不互相覆盖文件
- 不擅自修改共享边界
- 不破坏架构一致性

本文档属于执行层治理规范，必须服从以下上游文档：

- `AGENTS.md`
- `docs/architecture/*.md`
- `docs/adr/*.md`

## 2. 线程分类与职责划分

### 2.1 architecture thread

职责范围：

- 维护项目级架构与治理规则
- 调整系统边界、上下文边界、共享边界
- 定义受保护文件与跨模块变更规则
- 为跨模块任务提供上游设计

可以做什么：

- 修改 `AGENTS.md`
- 修改 `docs/architecture/**`
- 修改 `docs/governance/**`
- 修改 `docs/adr/**`
- 评估 `src/common` 与 proto 边界的变更必要性

明确禁止做什么：

- 不直接推进业务功能实现
- 不在没有设计说明的情况下修改多个业务服务代码
- 不把局部实现问题包装成全局架构变更

输入是什么：

- 项目级架构文档
- 治理文档
- 当前仓库结构与已有服务现状

输出是什么：

- 架构文档
- 治理规则
- ADR
- 受保护边界定义

### 2.2 plan thread

职责范围：

- 在既有架构下拆分任务
- 定义串行与并行边界
- 为 implementation thread 分配路径 ownership

可以做什么：

- 修改 `docs/plans/**`
- 输出任务拆分方案
- 输出路径边界与线程约束

明确禁止做什么：

- 不修改架构边界
- 不修改业务实现代码
- 不在没有 architecture thread 支持时重新定义共享边界

输入是什么：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- 已有 ADR
- 当前目标与约束

输出是什么：

- 任务清单
- 串并行说明
- 线程路径权限说明
- 验收标准

### 2.3 implementation thread

职责范围：

- 在已冻结设计与已分配路径范围内实现具体任务

可以做什么：

- 修改自己被授权的服务内部代码
- 修改自己被授权的服务内测试
- 修改自己被授权的服务内局部文档

明确禁止做什么：

- 不修改 `AGENTS.md`
- 不修改 `docs/architecture/**`
- 不修改 `docs/governance/**`
- 不擅自修改 proto
- 不擅自修改 `src/common` 公共边界
- 不改变权限、租户、operator context、AI 工具边界
- 不扩大任务范围

输入是什么：

- 上游架构文档
- 计划线程的任务说明
- 允许修改路径
- 验收标准

输出是什么：

- 局部实现结果
- 验证结果
- 风险说明

### 2.4 review thread

职责范围：

- 审核实现线程结果
- 重点发现越界修改、边界破坏、契约风险、验证不足

可以做什么：

- 读取目标线程修改结果
- 输出 findings 与审核结论
- 明确是否允许进入集成

明确禁止做什么：

- 不替代实现线程重写整套方案
- 不越权修改架构文档
- 不把个人偏好提升为架构规则

输入是什么：

- 实现线程结果
- 上游架构与治理规则
- 验收标准

输出是什么：

- 审核结论
- 问题清单
- 是否允许集成

### 2.5 integration thread

职责范围：

- 集成多个已审核通过的实现结果
- 处理兼容性与冲突收口
- 做最终统一验证

可以做什么：

- 合并结果
- 处理局部兼容性调整
- 统一验证与收口说明

明确禁止做什么：

- 不在集成阶段擅自新增架构决策
- 不跳过 review 直接合并
- 不擅改受保护共享边界

输入是什么：

- 已通过 review 的线程结果
- review 结论
- 计划线程定义的集成顺序

输出是什么：

- 集成结果
- 冲突处理说明
- 最终验证结果

## 3. 线程拆分原则

### 3.1 如何定义“可独立执行”的任务

一个任务只有同时满足以下条件时，才适合独立线程执行：

- 目标明确
- 输入明确
- 输出明确
- 修改路径可限定
- 不依赖线程内临时发明架构
- 可以在不修改受保护文件的前提下闭环

### 3.2 如何避免多个线程修改同一批文件

必须遵守：

- 每个线程启动前声明允许修改路径
- 同一批核心文件不能分配给多个 implementation thread
- 共享边界文件若必须修改，应升级为 architecture thread 或 integration thread 管控

### 3.3 什么情况下必须串行

以下情况必须串行：

- 修改 `AGENTS.md`
- 修改 `docs/architecture/**`
- 修改 `docs/governance/**`
- 修改 `docs/adr/**`
- 修改 proto
- 修改 `src/common` 公共边界
- 修改权限、租户、operator context、AI 工具协议
- 上游计划尚未冻结

### 3.4 什么情况下可以并行

以下情况通常可以并行：

- 不同服务内部的局部实现
- 已冻结契约下的多服务适配
- 不同服务下的局部测试补齐
- 不同独立文档的补充

### 3.5 跨模块任务如何拆分

跨模块任务必须按以下顺序拆分：

1. architecture thread 定义边界
2. plan thread 拆分任务与路径
3. implementation threads 按服务或独立路径实现
4. review thread 审核
5. integration thread 收口

## 4. 文件修改边界规则

### 4.1 每个线程必须声明允许修改的路径

每个线程开始前必须明确：

- 允许修改的目录
- 允许修改的文件类型
- 禁止修改的路径

未声明路径的线程，不允许进入实现。

### 4.2 implementation thread 默认允许修改的路径

只允许修改：

- 自己负责服务目录下的实现文件
- 自己负责服务目录下的测试文件
- 自己负责服务目录下的局部说明文档

### 4.3 implementation thread 默认禁止修改的路径

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- `docs/adr/**`
- `src/common/src/contracts/**`
- `src/common/src/generated/**`
- 所有 proto 定义目录
- 未授权的 `src/common/**`
- 其他线程已声明 ownership 的路径

### 4.4 什么属于跨模块修改

以下都属于跨模块修改：

- 修改多个服务共同依赖的契约
- 修改 `src/common` 公共抽象
- 修改项目级架构文档
- 修改租户、权限、operator context 语义
- 修改事件模型
- 修改 AI 工具协议

## 5. 路径 ownership 表

说明：

- `默认 owning thread` 指在没有额外说明时，最适合负责该路径的线程类型。
- `可并行性` 指该路径通常是否适合与其他路径同时开发。

| 路径 | 默认 owning thread | 可并行性 | 说明 |
| --- | --- | --- | --- |
| `AGENTS.md` | architecture thread | 否 | 项目总约束，受保护 |
| `docs/architecture/**` | architecture thread | 否 | 项目级架构主文档 |
| `docs/governance/**` | architecture thread | 低 | 执行规则，通常串行修改 |
| `docs/adr/**` | architecture thread | 否 | 关键架构决策 |
| `docs/plans/**` | plan thread | 低 | 可拆分不同计划文件，但不宜并发改同一文件 |
| `docs/contracts/**` | architecture thread / plan thread | 低 | 黑盒接口契约，涉及协议语义时需先冻结设计 |
| `src/common/src/contracts/**` | architecture thread | 否 | 共享契约边界，受保护 |
| `src/common/src/generated/**` | integration thread | 否 | 生成物，不由普通实现线程直接维护 |
| `src/common/src/auth/**` | architecture thread / integration thread | 低 | 公共认证能力，影响面大 |
| `src/common/src/authorization/**` | architecture thread / integration thread | 低 | 公共权限、operator context 与内部服务认证能力，影响面大 |
| `src/common/src/transport/**` | architecture thread / integration thread | 低 | gRPC 与调用基础设施 |
| `src/common/src/config/**` | architecture thread / integration thread | 中 | 平台配置能力 |
| `src/common/src/registry/**` | architecture thread / integration thread | 中 | 服务发现与注册 |
| `src/common/src/logging/**` | architecture thread / integration thread | 中 | 平台可观测能力 |
| `src/common/src/cqrs/**` | architecture thread / integration thread | 中 | 服务骨架能力 |
| `src/services/api-gateway/**` | implementation thread | 中 | 可独立线程开发，不得擅改共享契约 |
| `src/services/system/auth-service/**` | implementation thread | 中 | 可独立线程开发，认证语义变更需升级 |
| `src/services/system/identity-service/**` | implementation thread | 中 | 可独立线程开发，身份边界变更需升级 |
| `src/services/system/permission-service/**` | implementation thread | 中 | 可独立线程开发，权限语义变更需升级 |
| `src/services/system/entity-service/**` | implementation thread | 中 | 可独立线程开发，主体边界变更需升级 |
| `src/services/business/**` | implementation thread | 高 | 在不碰共享边界前提下可按服务并行 |
| `src/services/auxiliary/**` | implementation thread | 高 | 在不碰共享边界前提下可按服务并行 |

## 6. 受保护文件/目录清单

### 6.1 一级受保护

普通 implementation thread 默认禁止修改：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- `docs/adr/**`
- `src/common/src/contracts/**`
- `src/common/src/generated/**`
- 所有 proto 文件

### 6.2 二级受保护

以下路径原则上不应由普通 implementation thread 自由修改：

- `src/common/src/auth/**`
- `src/common/src/authorization/**`
- `src/common/src/transport/**`
- `src/common/src/config/**`
- `src/common/src/registry/**`
- `src/common/src/logging/**`
- `src/common/src/cqrs/**`

### 6.3 历史材料规则

根目录旧 `doc/` 不再作为项目级设计入口。若发现外部材料或历史方案需要保留，应先判断是否仍有当前价值：稳定设计进入 `docs/architecture/`，阶段路径进入 `docs/plans/`，接口契约进入 `docs/contracts/`，不再新增根目录 `doc/*` 作为长期依据。

## 7. 各类线程的路径权限矩阵

### 7.1 architecture thread

可修改：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- `docs/adr/**`
- 必要时可触达共享边界相关文档与契约说明

禁止修改：

- 不应直接推进大规模业务实现代码

### 7.2 plan thread

可修改：

- `docs/plans/**`

禁止修改：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/adr/**`
- 所有业务实现代码
- 共享契约与 proto

### 7.3 implementation thread

可修改：

- 被分配的单服务路径
- 该服务下的测试
- 该服务下的局部文档

禁止修改：

- `AGENTS.md`
- `docs/architecture/**`
- `docs/governance/**`
- `docs/adr/**`
- `src/common/src/contracts/**`
- `src/common/src/generated/**`
- 所有 proto
- 未授权的 `src/common/**`

### 7.4 review thread

可修改：

- review 输出文档
- 审核结论说明

禁止修改：

- 不应替代实现线程大规模改代码
- 不应擅改架构文档

### 7.5 integration thread

可修改：

- 计划中明确要求集成收口的路径
- 必要的兼容性修正
- 生成物和统一验证相关文件

禁止修改：

- 未经 architecture thread 确认擅改受保护边界
- 在集成阶段扩展需求

## 8. 全局设计保护机制

### 8.1 受保护文件修改流程

必须按以下顺序处理：

1. architecture thread 提出修改理由与范围
2. 必要时新增或更新 ADR
3. plan thread 评估对下游线程的影响
4. 边界冻结后再允许实现或集成线程跟进

### 8.2 implementation thread 的升级规则

普通 implementation thread 如果发现必须修改受保护文件，必须：

- 停止继续扩展实现
- 报告影响范围
- 明确说明为什么需要升级到 architecture thread 或 integration thread

## 9. 编码与输出一致性要求

所有线程必须遵守：

- 输出文件统一使用 UTF-8
- 文档正文可以使用中文
- 代码标识符与协议标识符统一使用英文
- 发现历史乱码时先标记问题，不在乱码基础上继续扩写
- 缺陷修复必须先定位根本原因，再提出正式方案，最后实施代码修改
- 禁止临时补丁式实现、硬编码绕过、未确认根因的试错式改动
- 所有实现都必须尽量使用最少、最优雅、最成熟、符合最佳实践且长期可维护的代码
- 发现既有边界或契约不合理时，应升级治理流程，而不是在局部线程内绕过

## 10. 执行结论

OES 多线程治理的核心不是“尽量并行”，而是：

- 先冻结边界
- 再拆分线程
- 每个线程只改自己那一块
- 把架构、契约、共享边界保护起来

只有这样，多线程开发才会提升效率，而不是放大冲突。
