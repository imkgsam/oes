# Codex Command Hub MVP Feature Packet

## 1. 目标

建立 OES Codex Command Hub 的第一版 CLI 能力，用于支持多 Codex thread 的任务身份恢复、ownership claim、冲突检测、进度记录、blocker/failure/handoff 回报与启动 prompt 生成。

## 2. 上游规则

- `docs/governance/codex-global-command-model.md`
- `docs/governance/codex-command-hub.md`
- `docs/governance/codex-threading-rules.md`
- `docs/governance/codex-workflow.md`

## 3. 本 feature 的边界

本次实现：

- 本地 CLI：`node scripts/oes-hub.mjs`
- 本地 JSON 状态存储
- task create / show / list
- thread sync / whoami / register
- ownership claim / owner path query
- checkpoint / blocker / failure / handoff
- prompt generation
- status summary
- focused unit tests

本次不实现：

- HTTP API
- Web dashboard
- event stream
- roadmap 自动导出
- git diff 越权检查
- pre-commit hook
- SQLite / Postgres 后端

## 4. 写入范围

允许写：

- `AGENTS.md`
- `docs/governance/codex-global-command-model.md`
- `docs/governance/codex-command-hub.md`
- `docs/plans/oes-global-roadmap.md`
- `docs/plans/oes-thread-control-board.md`
- `docs/plans/features/codex-command-hub-mvp.md`
- `scripts/oes-hub/**`
- `scripts/oes-hub.mjs`
- `package.json`

禁止写：

- `src/services/**`
- `src/common/**`
- `docs/contracts/**`
- `docs/architecture/services/**`
- `pnpm-lock.yaml`

## 5. 验收标准

- task 可以创建并被 sync
- sync 返回 thread identity、parent、return target、scope、allowed/forbidden paths 与 resume instruction
- claim 可以登记写路径
- claim 对重叠 active ownership 返回拒绝
- blocker 可以把 thread 标记为 blocked
- handoff 可以把 thread 标记为 returned
- prompt 可以为 task/thread 生成新 Codex thread 的启动提示
- tests 覆盖 task、sync、claim conflict、blocker、handoff、prompt

## 6. Handoff 要求

完成后向 Global Command 回报：

- Hub MVP 能力范围
- 修改文件
- 验证命令
- 仍未实现的后续能力
- 是否可以开始用 Hub 管理下一批 OES thread
