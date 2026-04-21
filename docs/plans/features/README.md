# OES Feature Packet 模板

## 1. 目的

本目录用于存放跨线程 feature 的协作面板。

这里不承载稳定架构，也不承载正式契约真相。这里只记录：

- 当前 feature 的目标
- 当前主线范围
- 当前 slice
- owner 分工
- 阻塞与依赖
- 派生问题
- 验收与关闭条件
- 当前 feature 依赖的服务职责文档
- 当前 feature 依赖的协同蓝图

如果某个 feature 需要多个 thread 并行，必须先建立对应的 feature packet。

## 2. 命名规则

文件名使用：

- `<feature-key>.md`

示例：

- `context-switch.md`
- `lock-screen-rework.md`
- `machine-principal-login.md`

## 3. 使用规则

- 每个 feature 只有一个 feature packet
- 每个 packet 只服务一个 feature
- 当前状态只回写这一份 packet，不在多份文档重复同步
- 架构边界回写 `docs/architecture/**` 或 `docs/adr/**`
- 服务职责回写 `docs/architecture/services/*.md`
- 跨服务协同规则回写 `docs/architecture/collaborations/*.md`
- 正式契约回写 `docs/contracts/**`
- 后置事项回写 `docs/plans/backlog.md`
- 灵感回写 `docs/plans/ideas.md`
- 候选功能或候选设计议题回写 `docs/plans/candidates.md`
- 如果某段正文未来会被第二个 feature 复用，它就不应继续留在当前 packet 中

## 4. 模板

```md
# <Feature Name>

## 1. 目标

- 

## 2. 不做什么

- 

## 3. 上游依赖

- architecture:
  - 
- services:
  -
- collaborations:
  -
- contracts:
  - 
- adr:
  - 

## 4. 当前结论

- 
- 仅保留当前 feature 必需结论；服务长期职责与可复用协同规则应改为引用上游真相源

## 5. 契约真相位置

- 

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| producer owner |  |  |  |  | pending |
| consumer owner |  |  |  |  | pending |
| review / integration owner |  |  |  |  | pending |

## 7. 当前 slice

- slice:
- scope:
- ready definition:

## 8. 主线范围

- 本线程主线：
- 本线程不做：
- 偏移返回条件：

## 9. 阻塞 / 依赖

- 

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |

分类只能使用：

- `Blocker-Now`
- `Blocker-Later`
- `Sidecar`

规则：

- `Blocker-Now`：不解决主线无法继续，可在当前 thread 受控处理
- `Blocker-Later`：当前不立刻阻塞，先记录，必要时转入下一 slice
- `Sidecar`：不属于当前主线，迁入 `backlog.md` 或升级为新 feature

## 11. 验收标准

- 

## 12. 关闭条件

- 

## 13. 备注

- 
```
