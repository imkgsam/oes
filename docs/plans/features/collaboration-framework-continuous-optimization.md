# Collaboration Framework Continuous Optimization

featureKey: collaboration-framework-continuous-optimization
truthCommit: eaf2966b5b232bb7592833e3379f086ab802ea3d
baseSha: eaf2966b5b232bb7592833e3379f086ab802ea3d
integrationBranch: codex/collaboration-framework-continuous-optimization
worktreeKey: collaboration-framework-continuous-optimization
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: CANDIDATE_READY

## Objective

把已冻结的 Stage 批量合并、moving-main、CI 优化验证、cleanup 与自动 archive 规则实现为可执行且 fail-closed 的协作运行时；性能 cutover 前保持 legacy `Baseline Checks` 为唯一权威门禁。

## Slices

### stage-merge-runtime

state: CANDIDATE_READY
candidate: 165262e4061d391616cdda64b0efab3f4d134521
review: Feature RI exact integration candidate pending

- Scope: Stage merge 卡完整性、有序逐项 admission、健康前缀保留、失败后缀停止、main 漂移技术等价修订。
- Protected scope: 不创建总产品分支/PR，不 direct push main，不改变 Merge Commit 与 `Baseline Checks` 保护。
- Dependencies: merged governance truth at `eaf2966b5b232bb7592833e3379f086ab802ea3d`.
- Acceptance: incomplete roster/card、换序、candidate/scope/risk 变化、越过失败项均 fail closed；无害 main 漂移只允许 exact technical revision。

### cleanup-archive-runtime

state: CANDIDATE_READY
candidate: 165262e4061d391616cdda64b0efab3f4d134521
review: Feature RI exact integration candidate pending

- Scope: cleanup 意图触发的完整 roster 盘点、partial retry、依赖序自动 archive。
- Protected scope: unknown/shared/active/dirty/SHA mismatch 原样保留；长期 Global UD 不归档；不创建 task registry/watchdog。
- Dependencies: Stage exit and exact existing Stage cleanup authorization.
- Acceptance: 只有完整 terminal roster 与资源 cleanup 验证后才依次归档 IT/Feature RI、FL、Stage Design、Stage RI、SL；成功项不重做，失败阻断依赖后缀。

### optimized-ci-shadow

state: CANDIDATE_READY
candidate: 165262e4061d391616cdda64b0efab3f4d134521
review: Feature RI exact integration candidate pending

- Scope: PR stale-run cancellation、确定性测试 inventory/sharding、generated/Prisma artifact 单次构建复用与相同 Prisma engine 单副本传输、L2 仅启动 Postgres/NATS 且只迁移本 shard 数据库、main exact-equivalence fast smoke/full fallback、独立 cleanup、paired fingerprint evidence、non-required optimized shadow。
- Protected scope: legacy full gate 继续唯一 authoritative `Baseline Checks`；shadow 不写 Git/PR/main，不授权 merge，不缩减验证面。
- Dependencies: GitHub Actions current pull_request/push topology.
- Acceptance: shadow 聚合 fail closed，所有 shard 非空且无重复/遗漏，artifact digest/inventory/数据库选择精确，main 仅在 Merge Commit parents/head/base/tree/toolchain/artifact 全等价时跳过 full gate，否则同 run 完整 fallback；PR cancel identity 精确，control/shadow workload fingerprint 可配对；样本不足时不 cutover。

## Feature acceptance

- collaboration-runtime static/type/unit 测试覆盖正向、边界、失败、幂等与恢复路径。
- CI workflow syntax/static contracts、deterministic shard coverage、cleanup residue 均通过。
- legacy authoritative behavior 与 optimized shadow behavior 都有可复现证据。
- 独立 Feature RI 审核 exact candidate 后才发布 Draft PR。

## Candidate evidence

- implementation ancestor: `165262e4061d391616cdda64b0efab3f4d134521`
- full prepared build, proto compatibility, design-gap, risk/unit and collaboration runtime gates: exit `0`
- deterministic L2 shards: `20/20 suites, 45 tests` in 68s; `20/20 suites, 57 tests` in 66s; `19/19 suites, 83 tests` in 62s; every shard rollback verified zero task-owned container/volume/network residue
- prepared artifact roundtrip: 21 Prisma targets, one engine digest, 21/21 restored; local compressed fixture reduced from 192,577,704 to 21,530,266 bytes
- workflow syntax: `actionlint v1.7.12`, exit `0`; formatting and static contracts: exit `0`
- performance cutover: pending the frozen 20 PR/main pairs, cold-cache/superseded/Stage/attempt minimums and all thresholds; legacy `Baseline Checks` remains authoritative
