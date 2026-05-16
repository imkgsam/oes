# OES 终端架构索引

## 1. 目的

本目录用于沉淀 OES 各类客户端终端的稳定设计真相源，回答“这个终端是什么、服务哪些场景、如何接入平台能力、不能拥有哪些真相”。

这里不承载：

- 服务职责真相
- 业务域对象真相
- 详细实现计划
- 具体页面执行状态
- 后端黑盒契约正文

## 2. 使用规则

- 每个重要终端只能有一份稳定设计真相源。
- 终端文档只定义终端边界、技术形态、平台协同方式与长期演进方向。
- 认证、身份、权限、业务资源、设备治理等真相仍以对应服务、协同蓝图、contract 或 ADR 为准。
- feature packet、implementation plan、UI 实现文档只能引用终端真相源，不得重新定义终端长期边界。
- 若终端设计变化影响认证、权限、设备治理、BFF 或业务服务边界，应同步更新对应 architecture / collaboration / contract / ADR。

## 3. 当前终端索引

| Terminal | Truth Source | Status | Note |
| --- | --- | --- | --- |
| `PDA` | [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md) | `DESIGNING` | 面向车间 / 仓库现场作业的 Android PDA 设备端；Phase 1 先冻结系统基础能力，不承载 WMS / MES 业务闭环。 |

## 4. 与其他架构目录的关系

- 服务职责真相仍在 [services/index.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/index.md)。
- 跨服务协同真相仍在 [collaborations/index.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/index.md)。
- 终端对外消费契约应沉淀到 `docs/contracts/**`。
- 终端阶段执行主线应沉淀到 `docs/plans/features/**`。
