# ADR 0018: Local Development And Test Runtime

```text
status: ACCEPTED
decisionDate: 2026-09-06
architectureTruthSource: docs/architecture/platforms/local-development-and-test-runtime.md
implementationState: PENDING_ATOMIC_CUTOVER
```

## Context

OES 现行本地运行时把 worktree identity、Compose project、generated root/service `.env`、固定
host port 和 current-directory dotenv discovery 绑定在一起。Focused test 与开发环境因而可能
复制完整 Compose project、竞争端口、遗漏 `DATABASE_URL`、复用过宽 credential，或在失败后留下
无法精确归属的资源。Managed test path 还混用了 committed migration 与 `prisma db push`，使本地
结果与 CI/schema truth 不一致。

OES 同时需要保持既有架构边界：local business service 继续作为 host process；Docker 只提供
基础设施；每个服务独占数据库与 business truth；内部同步、事实传播、workload trust、测试分类
与 CI governance 不因本地并发而改变。

## Decision

采用统一 local development/test runtime：

1. 一个 launcher 和 orchestration core 同时服务 `DEV`、`LOCAL_INTEGRATION` 和 `CI`。
2. 每台机器最多一个完整 long-lived `DEV` stack；并行 task 只启动 selected test 需要的最小
   service/provider 集合。
3. `DEV` 使用 machine-shared provider；local Integration 共享物理 TEST PostgreSQL/MinIO 并获得
   per-run logical resource，其他 provider 按声明临时创建；CI provider 全部 job-private。
4. `devStackId` 绑定 shared provider，`taskKey + runId` 绑定 ephemeral/logical resource；worktree
   不构成 runtime ownership。
5. Host port 动态分配并由 Docker published mapping 授权；readiness 后才发布 endpoint。
6. Launcher 从 versioned defaults、machine-local config、profile、explicit argument 和 dynamic
   allocation 构造 in-memory configuration，并向每个 host process 显式注入 minimal environment。
7. Shared physical provider 使用 per-service/per-run ACL、credential 和 namespace；administrative、
   migration 与 runtime authority 分离。
8. Managed DEV/TEST/CI 只应用 committed migration，通过 `prisma migrate deploy` 建立 schema；
   `db push` 不产生 accepted evidence。
9. Real-infrastructure local run 默认最多并发两个，使用现有 lease primitive 实现 FIFO semaphore，
   不引入 resident scheduler service。
10. Runtime 通过 business-neutral A0 验证 isolation、readiness、manifest/evidence binding、normal/
    abnormal cleanup、CI reproduction 和 rollback。
11. Main 以一个候选原子切换所有 supported entry、CI internal path、configuration、test 和 runbook；
    不保留 active legacy/v2 mode。
12. Implementation candidate 在切换前只读盘点并分类现有 OES Compose project/container/network/
    volume，交付 deterministic dry-run、sealed exact-identity cleanup plan 和 residue check；真实主机
    删除只在独立 Human-confirmed Cleanup boundary 执行。

完整 profile、provider、lifecycle、permission、migration、A0 和 rollback contract 以
[Local Development And Test Runtime](../architecture/platforms/local-development-and-test-runtime.md)
为准。

## Consequences

### Positive

- 并行 task 的隔离单位从 worktree/Compose proliferation 收敛为显式 `taskKey + runId` resource。
- Shared PostgreSQL/MinIO 降低本地资源成本，同时 logical database/user 和 bucket/credential 保持
  cross-run isolation。
- Local 与 CI 复用 planner/orchestrator，减少 implicit environment 与手工 topology drift。
- Dynamic port、atomic manifest publication、readiness gate 和 exact cleanup 消除固定端口碰撞及
  stale resource 的 broad deletion 风险。
- Committed migration、service-scoped credential 和 denial matrix 使 schema 与 access evidence 可
  重现、可审计。

### Cost and risk

- Cutover 必须同时迁移当前 pnpm/CI entry、dotenv、Compose lifecycle、fixed-port test、migration、
  seed/fixture 和 runbook；部分切换会制造两个 authority，因此不被接受。
- 现有主机可能同时包含有效 DEV data、active owner resource、idle legacy residue 和无法证明归属的
  object；新 launcher 可用不等于这些资源已安全 reconcile。
- Shared TEST provider 需要可靠的 logical provisioning、lease reconciliation 和 per-run denial；
  仅有名称前缀或 numeric Redis DB 不构成隔离。
- Dynamic endpoint 要求全部 host process 通过 manifest injection 启动；直接执行依赖 stale `.env`
  的 service command 将在切换后 fail closed。
- A0 不证明业务 Journey 完整，existing incomplete production chain 必须继续由其 owner 独立关闭。

## Alternatives rejected

### One complete Dockerized OES stack per task

拒绝。资源成本过高，并违背 local host-process business-service model。

### One shared mutable test database, bucket, or subject namespace

拒绝。它没有 cross-run authorization boundary，会产生 nondeterministic concurrency。

### One complete temporary infrastructure stack per test

拒绝。启动成本与 provider 数量不随 selected dependency 收敛。

### Fixed host ports

拒绝。并发 worktree、stale container 和其他本机进程都可产生 collision。

### Worktree-derived ownership and copied service `.env`

拒绝。Code checkout 不是 execution identity；copied dotenv 会产生 stale/ambiguous binding。

### Long-lived legacy and V2 runtime modes

拒绝。双路径会永久分裂 entry、CI、migration、test 和 runbook authority。

### Business journeys as A0

拒绝。当前 production chain 不完整；以它们验证 runtime 会把 infrastructure acceptance 变成
business debugging，也可能用 fake 错报 Journey complete。

## Migration and rollback

Implementation 可在 isolated candidate 中验证，`main` 在合并前继续执行当前 runbook。Cutover
candidate 必须对 runtime/configuration/entry 做 repository-wide zero-reference check，先备份 DEV
data，重建 disposable TEST data，交付一次性 legacy host-resource inventory/reconciliation tool、
dry-run、sealed cleanup plan、rewritten runbook 与 residue check，并在 exact candidate 上完成
self-test、A0、independent RV 和 `CI / Baseline Checks`。合并需要之后独立的 Human confirmation。

实际删除主机上的 confirmed-idle legacy OES resource 是后续独立 Cleanup confirmation boundary。
Apply 前必须重开 exact Docker identity/labels/state/attachment/owner evidence；active、unknown、shared、
dirty、mismatched 或证据不足资源保留并报告。最终 migration acceptance 要求 confirmed-idle legacy
resource 归零，且每个保留项都有 exact identity 与理由；Design/implementation delivery 不能借
cutover、startup 或 merge 自动删除历史资源。

Rollback 是 whole-candidate Git revert，并在需要时恢复 cutover 前 DEV snapshot；不得选择性恢复
legacy entry、generated `.env` 或 fixed-port path。

## Related documents

- [Local Development And Test Runtime](../architecture/platforms/local-development-and-test-runtime.md)
- [Testing And CI](../architecture/platforms/testing-and-ci.md)
- [Event Bus And Outbox](../architecture/platforms/event-bus-and-outbox.md)
- [Trusted gRPC And Execution Context](../architecture/platforms/grpc-metadata-and-service-trust.md)
- [Observability And Audit](../architecture/platforms/observability-and-audit.md)
