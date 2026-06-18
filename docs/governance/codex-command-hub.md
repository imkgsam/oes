# OES Codex Command Hub

## 1. 定位

OES Codex Command Hub 是 Codex 多线程协作的实时状态中心。它不替代架构文档、ADR、contracts 或 feature packet。

Hub 负责：

- thread 身份恢复
- task 分配与状态机
- parent / return target 关系
- ownership claim 与冲突检测
- inbox / message / blocker / failure / handoff 记录
- branch / worktree registry
- dependency 与 priority 状态查询
- 后续 roadmap export 的数据来源

文档负责：

- 已冻结架构真相
- 已冻结契约真相
- 长期治理规则
- 长期 roadmap 沉淀

## 2. 在线模型

Codex thread 不能被假设为持续在线。

稳定模型是：

- Hub 常驻或可随时读取同一份状态
- Codex thread 间歇启动
- Global Command / Management Thread 定期或人工唤醒
- 每个 thread 启动时先 sync，结束前 handoff / blocker / failure

Global Command 不在线时：

- Hub 继续保存 task、message、blocker、handoff 与 ownership
- Hub 可执行确定性规则，例如拒绝 ownership 冲突
- 需要判断的事项进入 `requires-global-command` 状态，等待主控下次处理

## 3. Thread 启动协议

新 thread 的启动 prompt 应尽量短：

```text
你是 OES Codex thread。
先运行：node scripts/oes-hub.mjs sync --task <task-id>
严格按照 Hub 返回的 identity、scope、ownership、forbidden files、parent、return target 执行。
修改任何文件前必须先 claim。
完成、阻塞或失败时必须通过 Hub handoff / blocker / failure 上报。
```

如果 thread 已经注册过，也可以使用：

```text
你是 OES Codex thread。
先运行：node scripts/oes-hub.mjs sync --thread <thread-id>
根据 Hub 返回的 resume instruction 继续。
```

## 4. 必须支持的查询

Hub 必须支持 thread 自主查询：

- `sync --task <task-id>`
- `sync --thread <thread-id>`
- `whoami --thread <thread-id>`
- `inbox --thread <thread-id>`
- `threads list`
- `tasks list`
- `owners path <path>`
- `claim --thread <thread-id> --write <glob>`
- `checkpoint --thread <thread-id> --summary <text>`
- `blocker report --thread <thread-id> --summary <text>`
- `failure report --thread <thread-id> --summary <text>`
- `handoff submit --thread <thread-id> --summary <text>`
- `status`

## 5. Ownership 拦截

任何 thread 修改文件前必须先 claim 写路径。

Hub 处理 claim 时必须检查：

- 是否已有 active / blocked / assigned thread 持有重叠写路径
- 当前 task 是否允许写该路径
- 该路径是否属于 forbidden
- 该路径是否属于高风险文件

被拒绝时，thread 只能：

- 继续处理允许范围内的任务
- 或提交 blocker 并停止实现

thread 不得绕过 Hub 继续修改被拒绝文件。

## 6. 被阻塞后的恢复

当 thread 因 ownership 或依赖问题被阻塞：

1. thread 提交 blocker
2. Hub 标记 task / thread 为 `blocked`
3. Hub 路由给 parent、owner group 或 Global Command
4. 上层 thread 后续写入 resolution / resume instruction
5. 原 thread 或新 thread 下次 `sync` 后按 resume instruction 继续

恢复 prompt 不需要重新手写上下文。人只需要唤醒：

```text
sync 你的 Hub thread，然后根据 Hub 的 resume instruction 继续。
```

## 7. 进度写入频率

Hub 不记录每一步思考，只记录关键状态变化。

推荐频率：

- 启动时：sync + claim，状态为 `active`
- 执行中：关键阶段 checkpoint
- 长任务：每 30-60 分钟 checkpoint
- 阻塞：立即 blocker report
- 失败：立即 failure report
- 完成：handoff submit

## 8. Failure 路由

thread 不需要自己判断最终 debug owner。它只需要结构化报告 failure。

Hub 根据以下信息建议 owner：

- 当前 task parent
- affected service / group
- 最近修改相关路径的 thread
- ownership registry
- integration merge order
- failure type

基本归因规则：

- 单 worktree / 单服务测试失败：返回原 implementation/debug thread
- 合并后才失败：分配 Integration Debug Thread
- contract mismatch：分配 Contract Thread 与 Integration Thread
- permission / tenant / operator / audit 问题：分配 Foundation Platform Group
- lockfile / dependency 冲突：分配 Integration Thread

## 9. MVP 范围

首版 Hub 先实现本地 CLI 与状态存储，不实现 HTTP 服务和 dashboard。

MVP 目标：

- 能创建 task
- 能 sync task/thread
- 能注册 thread
- 能 claim ownership 并拒绝重叠写路径
- 能记录 checkpoint、blocker、failure、handoff
- 能查询 active threads、owners、inbox 与 status
- 能生成启动 prompt

后续版本再扩展：

- HTTP API
- dashboard
- event stream
- roadmap export
- git diff 越权校验
- pre-commit hook
