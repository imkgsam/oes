# OES 协同框架退役迁移台账（草案）

```yaml
status: DRAFT_MIGRATION_INVENTORY
documentRole: migration-ledger-only
governanceFramework: false
frozenDecisionSource: false
sourceThreadId: 019f7325-177e-77a1-9189-b36a10d94c3c
inventoryDate: 2026-08-04
programControlBranch: codex/oes-program-control-migration
```

> 本文只记录旧协同框架退役时的资源、证据、依赖与迁移排序，不定义新的治理框架，也不重新定义任何服务、契约或领域真相。稳定设计必须以本文链接的 architecture、ADR、collaboration 与 contract 真相源为准。

## 1. 范围与冻结边界

- 来源：legacy OES Global Command 提交的 `MIGRATION_HANDOFF_BUNDLE`。
- 本阶段只做 Git 引用/工作树只读核验并登记迁移资产。
- 旧 OES capability collaboration 已退役；本台账不恢复其 Command、A/I、A/V、A/X、checker 或 watchdog 模型。
- 本阶段不创建 Unified Design 或实现线程，不集成或推送 `main`，不归档、删除或清理任何分支、工作树、提交或线程，也不执行 reset、rebase、force 操作。
- 未通过本地 Git 直接验证的线程状态、历史验收和安全审计结论均标记为“handoff evidence”，不冒充本轮重跑结果。

## 2. 全局快照

| 项目 | Handoff 状态 | 2026-08-04 本地只读核验 |
| --- | --- | --- |
| Repository root | `/Users/acehood/Documents/GitHub/oes` | 路径存在；`main` 工作树 clean |
| `main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 当前 `634414557f14576c666d98276be80a230130b055`；AI、Principal Authorization 与 ActionGrant design candidates 经唯一 I&V lane ff-only 推进 |
| `origin/main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 当前本地 remote-tracking ref 为 `634414557f14576c666d98276be80a230130b055` |
| Legacy formal A/* threads | 101 | 仅保留 handoff 汇总计数；未读取或唤醒线程 |
| Worktrees | 29 | 当前 34；新增项为本 Program Control、AI Platform completion、Integration & Verification、Unified Design 与 Permission decision RPC worktree |
| `codex/*` branches | 23 | 当前 28；新增项为 `codex/oes-program-control-migration`、`codex/migration/ai-platform-completion`、`codex/integration/main-queue`、`codex/unified-design/security-open-packets` 与 `codex/migration/permission-decision-rpc` |
| Checker | disabled | handoff evidence；未唤醒旧 checker |
| Root dirty state | clean | clean，暂存区与工作区均无变更 |

当前草案写入面：

- worktree：`/Users/acehood/Documents/GitHub/oes/.worktrees/program-control/migration`
- branch：`codex/oes-program-control-migration`
- base HEAD：`65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`
- inventory checkpoint：`1f5fdd690af817f8e9bb092fbafb769a31b2e1a6`；当前 branch HEAD 以运行时 `git rev-parse codex/oes-program-control-migration` 为准，避免在同一提交中记录自引用 SHA。
- runtime note：原 Codex 临时 worktree `/Users/acehood/.codex/worktrees/2bb6/oes` 已被应用回收；分支、提交和迁移台账均已在上述固定 worktree 中恢复，未发生资产丢失。

## 3. 稳定真相源索引

本节只提供迁移路由，不复制稳定设计正文。

| 主题 | 稳定真相源/执行来源 |
| --- | --- |
| Trusted gRPC / source credential | [ADR-0015](../../adr/0015-workload-identity-and-execution-token.md)、[gRPC metadata and service trust](../../architecture/14-grpc-metadata-and-service-trust-architecture.md)、[Gateway architecture](../../architecture/11-gateway-and-bff-architecture.md)、[trusted gRPC feature packet](../features/trusted-grpc-execution-context.md) |
| Principal authorization / Permission | [permission-service](../../architecture/services/permission-service.md)、[role-based permission resolution](../../architecture/09-role-based-permission-resolution.md)、[authorization decision flow](../../architecture/collaborations/authorization-decision-flow.md)、[principal authorization contract](../../contracts/permission-service/principal-authorization.md) |
| Execution token / Auth STS | [ADR-0015](../../adr/0015-workload-identity-and-execution-token.md)、[auth-service](../../architecture/services/auth-service.md)、[execution-token contract](../../contracts/auth-service/execution-token.md) |
| AI tool registration | [AI architecture](../../architecture/04-ai-architecture.md)、[task-assistant collaboration](../../architecture/collaborations/task-assistant.md)、[task-assistant tool contract](../../contracts/ai-platform/task-assistant-tool-contract.md) |
| ActionGrant | [ADR-0016](../../adr/0016-delegated-execution-and-action-grant.md)、[delegated execution collaboration](../../architecture/collaborations/delegated-execution-and-action-grant.md)、[ActionGrant feature packet](../features/delegated-task-action-grant.md)、[auth-service](../../architecture/services/auth-service.md)、[permission-service](../../architecture/services/permission-service.md)、[collaboration-service](../../architecture/services/collaboration-service.md) |
| Site | [site-service](../../architecture/services/site-service.md)、[site runtime architecture](../../architecture/site-runtime-architecture.md)、[site inspiration feature packet](../features/site-inspiration-management-p1.md) |
| External API key | [ADR-0017](../../adr/0017-protected-external-api-key-verifier-provider.md)、[external API key collaboration](../../architecture/collaborations/external-api-key-security.md)、[Auth external API key contract](../../contracts/auth-service/external-api-key-security.md) |
| Event bus | [ADR-0013](../../adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md)、[ADR-0014](../../adr/0014-cloudevents-and-service-owned-event-code-contracts.md)、[event bus architecture](../../architecture/17-event-bus-and-outbox-architecture.md)、[event contracts](../../contracts/events/README.md) |
| Execution revocation | [ADR-0015](../../adr/0015-workload-identity-and-execution-token.md)、[auth-service](../../architecture/services/auth-service.md)、[execution-token contract](../../contracts/auth-service/execution-token.md) |

## 4. Capability 迁移记录

### 4.1 GRPC — `MIGRATION_FROZEN`

- source threads：control `019fc87a-54b3-7463-ad9d-5750e8bab94b`；A/D GRPC `019f99f6-c707-7eb0-8c93-267c67288475`；A/D ASSET `019f983c-152a-7051-8011-9a25ca0987d7`；current A/I `019fc563-a9c4-76b0-9774-283206d2f1f0`。
- carrier：branch `codex/grpc/i04-source-credential-carrier`，candidate `dced77ad8cb877ea9aad10f1c6a310ad32a924df`；commit 存在，branch ref 一致，工作树 clean；相对当前 `main` 核验为 13 个 Common/Gateway transport-private source-credential 路径。
- carrier acceptance：handoff 明确未创建 A/V；后续必须先验收再进入集成候选。
- Asset：branch `codex/grpc/i03-gateway-trusted-execution-producer`，candidate `6973bcda1484ac2fccc522f5d8ee70dc989c7541`；commit 与 branch ref 存在。
- handoff security evidence：bearer 未进入 DTO、`TrustedExecutionContext`、cache key、日志、审计、ordinary metadata 或 legacy authority；本轮未重跑安全审计。
- target ownership：Gateway & Trusted Transport。
- ordering：carrier 验收/集成优先；Asset 在 Platform Security 落地后同步、重建并复验。
- next-queue preflight：carrier 可作为唯一 I&V lane 的后续候选主题，但精确 candidate 的 parent 为 `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`，当前 `main@fe395fb5…` 与其为 `3/1` 分叉；在 ff-only gate 下，派发前必须先形成基于 current main 的精确 rebuilt candidate。本轮只更新队列与 gate，不派发任务。
- discrepancy：handoff 指定的 Asset retained writer worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i03-gateway-trusted-execution-producer` 当前实际绑定 carrier branch，并位于 `dced77ad8cb877ea9aad10f1c6a310ad32a924df`；Asset branch/candidate 仍保留，但当前没有绑定该 branch 的 worktree。

### 4.2 PRINCIPAL-ROLE / Permission — `IMPLEMENTATION_REMEDIATION_REQUIRED`（legacy resources retained）

- source threads：control `019fc879-f423-7b10-80ff-93557a6f51c7`；design `019fa287-0043-74d3-afbf-d12252837d9b`；decision-RPC A/I `019fc87b-1859-7ef2-88a6-a89c9a087024`。
- legacy workspace：`/Users/acehood/.codex/worktrees/bf83/oes`；branch `codex/acprincipalrole-principalrolebinding-command`；HEAD `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；clean；只作历史引用。
- Unified Design thread：`019fcaeb-cb2e-7e92-8c4e-aab7771d7254`；用户已明确确认 Principal Authorization 方案 A。
- frozen candidate：`codex/unified-design/security-open-packets@4f78cec80b133fd186079fefc6b78ba42be86c28`；parent/current root main `94094fe57a8d2f18750ef712f2730015be2d9514`；worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/unified-design/security-open-packets`；clean。
- exact scope：10 个 `docs/**` 文件，96 insertions / 27 deletions；无 code、proto、schema 或 runtime 变更；`git diff-tree --check HEAD^ HEAD` exit 0。
- frozen semantics：`ResolveWorkloadIssuance` 是唯一 mTLS-only Auth bootstrap issuance-decision entry；Permission 决策、Auth 签发 ExecutionToken；`ResolvePrincipalAuthorization` 要求 mTLS、Permission-audience ExecutionToken 与精确 INTERNAL Code；BUSINESS/INTERNAL issuance 为 all-or-nothing；SELF_SERVICE、resource facts 与 domain rules 不进入 principal resolver。
- I&V terminal：唯一持久 Integration & Verification 任务 `019fcaf2-ca7b-7140-b46d-b6cacae58556` 返回 `DESIGN_GAP`。结构 gate、104 个本地 Markdown 链接、四条其余冻结语义、服务真相源引用和 contract/architecture 命名检查通过；未执行 fetch、root merge 或 push。
- design gap：`docs/architecture/services/permission-service.md` 同一小节第 173 行要求 `ResolvePrincipalAuthorization` 验证 Permission-audience ExecutionToken，第 175 行又声明 Permission 不“消费 ExecutionToken”，与冻结语义及 feature packet 的 ExecutionToken-protected resolver 表述直接冲突。唯一服务真相源必须先消除该歧义并重建 candidate。
- replacement candidate：`codex/unified-design/security-open-packets@fe395fb5254a620108882494eb601cfe00fd5701`；direct parent `4f78cec80b133fd186079fefc6b78ba42be86c28`；base ancestor/current root main `94094fe57a8d2f18750ef712f2730015be2d9514`；worktree clean。
- correction scope：只修改 `docs/architecture/services/permission-service.md`，1 insertion / 1 deletion；删除“不消费 ExecutionToken”的歧义，明确 Permission 不签发、不存储、不记录 Token 正文，但 `ResolvePrincipalAuthorization` 必须按受保护 resolver 契约验证随请求提交的 ExecutionToken。未改变冻结方案 A，也未改写 rejected commit。
- cumulative scope：相对 base `94094fe57…` 仍为精确 10 个 `docs/**` 文件，96 insertions / 27 deletions；非 docs 路径为 0。base ancestry、diff check、UTF-8、104 links 与五条冻结语义检查均为 exit 0 handoff evidence。
- replacement I&V terminal：唯一持久 Integration & Verification 任务返回 `ACCEPTED_AND_INTEGRATED`。candidate/direct-parent/base ancestry、correction 与累计 diff、diff check、UTF-8 10/10、104 links、服务真相源唯一性、contract/architecture 命名与五条冻结语义全部通过；旧歧义缺失且 replacement 语义存在。
- final integration evidence：I&V branch、Unified Design source branch、root `main`、本地 `origin/main` 与 `git ls-remote origin refs/heads/main` 均为 `fe395fb5254a620108882494eb601cfe00fd5701`，三个 worktree 均 clean；fetch、root ff-only merge 与唯一一次 push 均 exit 0。
- implementation task：`OES Implementation · Permission Decision RPC`，thread `019fcbff-ff44-7612-a187-045fa9f47333`，完成只读 inventory 后返回 `SCOPE_GAP`；未写 production code，未形成 candidate，固定 worktree clean at `fe395fb5…`。
- stable implementation lease：只允许 `src/common/src/contracts/permission_service/**` 与 `src/services/system/permission-service/**`；计划固定 worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/permission-decision-rpc`、branch `codex/migration/permission-decision-rpc`，从 `main@fe395fb5…` 建立。Auth、Gateway、Collaboration、ActionGrant、Common authorization/runtime 与 `docs/**` 均受保护。
- implementation scope gaps：Common permission-code truth source 尚未注册 `permission.internal.principal_authorization.resolve`，未来最小 Common lease 至少涉及 `internal.permission-codes.ts`、`permission/index.ts`，仅在类型确有需要时涉及 `types.ts`；DELEGATED issuance 还缺少 HUMAN grant ∩ DelegationGrant ∩ AgentPrincipal ∩ ToolContract upper bounds 的 owner contract/runtime resolver，Permission 不得读取 AI registration JSON 或复制 Auth/ActionGrant truth。
- scope-gap resolution：integrated ActionGrant design 已冻结 Common 为 INTERNAL Code 唯一静态语义源；Permission namespace 最小扩展 lease 是新建 `src/common/src/authorization/permission-codes/permission/internal.permission-codes.ts` 并更新现有 `permission/index.ts`，仅当公共 definition 类型确实不足时才允许涉及对应类型文件。Auth 编排 HUMAN/session、DelegationGrant、Identity AgentPrincipal、AI ToolContract 与 business-owner action/policy snapshot；Permission 只消费可信输入并与 HUMAN grants 求 fail-closed 交集。
- resumed stable lease：原 `src/common/src/contracts/permission_service/**` 与 `src/services/system/permission-service/**` 保持；新增上述 Permission namespace Common 文件。Collaboration INTERNAL Code、Auth/Gateway/Collaboration/AI/ActionGrant runtime 与其他 Common authorization 路径仍受保护。
- implementation candidate：`codex/migration/permission-decision-rpc@96eb67aa126cccbb98e91bb0fedf4f90cfd8399e`；parent/current root main `634414557f14576c666d98276be80a230130b055`；fixed worktree clean；单一 commit `feat(permission): add authorization decision RPCs`。
- exact scope：42 files，3418 insertions / 44 deletions；新增三个 Permission decision RPC contract/controller mappings、application/domain policies 与 ports、Prisma/config adapters、exact-Auth transport guard、DI/audit/tests，以及两个 Permission-owned INTERNAL Codes；未注册 Collaboration Code，未修改 docs、Auth、Gateway、Collaboration、AI 或 ActionGrant runtime。
- implementation verification：L1 73 suites / 267 tests、L3 8 suites / 39 tests、Common contract 2/2、proto regen/lint、Common build、Permission build、Prettier、`git diff --check`、42/42 lease scan 与 bearer/TODO scan 均通过；generated outputs 保持 ignored。
- environment-limited gates：L2 因本地 PostgreSQL `localhost:5432/permissiondb` 不可达而 exit 1；精确 ESLint 因仓库 parser 同时启用 `project` 与 `projectService`，38 files 均在 0:0 失败且未进入规则检查。lefthook 不在 PATH，但 commit exit 0。
- I&V terminal：唯一持久 Integration & Verification task 返回 `REJECTED`；结构、ancestry、42-file lease 与 diff check gate 通过，未取得 root integration lease，未 fetch、merge 或 push。
- rejection 1：DELEGATED `authzVersion` 使用 `|` 直接拼接 HUMAN grant hash、delegation/agent/tool 与 owner policy versions，未形成绑定最终 delegated/effective BUSINESS Code 集的 opaque SHA-256；WORKLOAD 还直接回显 `policyVersion`。
- rejection 2：environment workload issuance policy 在首次 `findPolicy()` 时才解析配置；缺失或非法配置不会阻止 Nest module bootstrap，不满足启动/readiness fail-closed。
- target ownership：这两个问题属于实现/安全缺陷，不是 design gap 或 MIG-D08 环境限制；原 Platform Security lease 返回同一 Permission implementation task，在原 branch/worktree 追加 remediation commit。GRPC carrier rebuild 继续排队。

### 4.3 EXEC-CRYPTO — `MIGRATION_FROZEN`

- source threads：control `019fc601-1f32-7912-a9a5-849cf22cfd23`；design `019fa287-01a8-7340-8fb3-b56df8652dcd`；I06 `019fc608-c9cf-7a82-a91a-0b9aa6d0cd5f`。
- active retained writer：`/Users/acehood/.codex/worktrees/44ef/oes`；branch `codex/exec-crypto/i06-auth-tg2-remediation`；HEAD `64ea8660687bbeb24349d11bcaed6f63d2373c4b`；clean。
- rejected candidate：`c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc`；commit 保留。拒绝原因来自 handoff：权限请求集合被复制为授权集合并进行自比较，形成恒真 privilege gate。
- authority-upper-bound design branch：`codex/exec-crypto/d-sts-authority-upper-bound@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；无替代候选。
- dependencies：GRPC carrier 与 Permission decision RPC。
- target ownership：Platform Security。

### 4.4 AI-PLATFORM — `ACCEPTED_AND_INTEGRATED`（legacy resources retained）

- source threads：control `019fa317-f7eb-7d51-a1a5-63c1f90ef907`；A/I `019fc52d-3e6d-7d03-b5f2-27befd10c7d7`；A/V `019fcaac-840c-7072-b792-793396ea30b3`。
- migration implementation thread：`019fcaeb-cc91-7f81-acf9-4e8a34c9701d`；已完成并 idle，不恢复旧 capability 任务。
- accepted legacy candidate：`6101933d3f054989e6dbfca27889a7141db16075`；branch/worktree `codex/ai-platform/i01-tool-contract-registration` / `/Users/acehood/.codex/worktrees/72ae/oes`；作为历史验收与内容证据保留。
- acceptance worktree：`/Users/acehood/.codex/worktrees/d69e/oes`；detached at exact candidate；clean。
- legacy handoff acceptance：`ACCEPTED`；contract tests 5/5、JSON parse、diff/path checks passed。
- rebuilt candidate：`94094fe57a8d2f18750ef712f2730015be2d9514`；parent `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；branch/worktree `codex/migration/ai-platform-completion` / `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/ai-platform-completion`；clean。
- scope：相对 parent 精确新增 `src/ai-platform/tool-contracts/registrations/` 下两个 `task-assistant-collaboration-task.v1` 文件，共 272 行；两个 blob 与 accepted legacy candidate 完全一致。
- implementation handoff verification：JSON parse passed；既有 contract tests 5/5 passed；diff/path/content/root-protection checks passed。Program Control 本轮未重跑测试，只读复核了 Git 结构与 blob 证据。
- I&V terminal：唯一持久 Integration & Verification 任务 `019fcaf2-ca7b-7140-b46d-b6cacae58556` 返回 `ACCEPTED_AND_INTEGRATED`。JSON parse exit 0；既有 contract tests 5/5 passed；diff check、精确路径与 blob checks passed；fetch `origin/main` exit 0；ff-only merge exit 0；`git push origin main` exit 0。
- final integration evidence：candidate、本地 `main`、本地 `origin/main` 与 `git ls-remote origin refs/heads/main` 均为 `94094fe57a8d2f18750ef712f2730015be2d9514`；root、AI completion worktree 与 I&V worktree 均 clean。
- target ownership：AI Platform completion 写入 lease 与短时 main integration lease 均已释放；候选、提交、分支与工作树作为已集成证据保留，等待用户批准后的正常清理。唯一 I&V lane 当前不持有 candidate。

### 4.5 ACTION-GRANT — `DESIGN_ACCEPTED_AND_INTEGRATED`（legacy implementation `MIGRATION_FROZEN`）

- source threads：control `019fa287-d27a-79b1-8021-36537c90945e`；design `019fa287-02ff-7023-a2d1-ed935605671b`；A/I `019fc52b-39bf-7250-84de-6d5bcff1d099`。
- candidate：`ec2b2cf881fec81f1882b3260f397f33d618aaf0`；branch/worktree `codex/action-grant/i01-delegated-task-runtime` / `/Users/acehood/Documents/GitHub/oes/.worktrees/action-grant/i01-delegated-task-runtime`；clean；尚未 accepted/rejected，且无 A/V。
- preserved commit chain：`5bd955a4` → `17b6a14b` → `ec2b2cf881fec81f1882b3260f397f33d618aaf0`；本轮用 ancestry check 核验顺序成立。
- change surface：Common、Auth、Permission、Collaboration、proto、Prisma 与测试；精确语义仍以上节真相源为准。
- unresolved packet：Auth/Permission transport mounting 的 canonical ownership/path lease，以及 fail-closed 初始化、rollback 与 acceptance；须由 Unified Design 冻结后再执行。
- current design route：同一 OES Unified Design task `019fcaeb-cb2e-7e92-8c4e-aab7771d7254` 在保留 504 前两文件 diff 的基础上完成恢复；现有冻结结论已唯一确定 owner/contract 边界，无需新增用户选择。
- design candidate：`codex/unified-design/security-open-packets@634414557f14576c666d98276be80a230130b055`；parent/current root main `fe395fb5254a620108882494eb601cfe00fd5701`；fixed worktree clean。
- exact scope：精确 12 个 `docs/**` 文件，115 insertions / 45 deletions；`git diff-tree --check HEAD^ HEAD` exit 0；无 proto、schema 或 runtime implementation。
- frozen content：ActionGrant Run/Conversation authority boundary、business-owner fact resolution、Auth orchestration、Permission delegated upper-bound resolution、Common INTERNAL Code leases（包含缺失的 principal-authorization Code）、fail-closed/retry semantics 与 acceptance gates。
- Permission gap consistency：设计冻结了 INTERNAL Code owner/注册 lease，以及 HUMAN grant ∩ DelegationGrant ∩ AgentPrincipal ∩ ToolContract upper-bound owner/consumer 边界；不允许 Permission 读取 AI registration JSON 或复制 Auth/ActionGrant truth。
- I&V terminal：唯一持久 Integration & Verification task 返回 `ACCEPTED_AND_INTEGRATED`。candidate/parent、12 docs、115+/45-、diff check、UTF-8、84 links、六组冻结语义、服务真相源与 contracts，以及 Permission SCOPE_GAP 的唯一 Common lease/owner boundary 均通过。
- final integration evidence：I&V/source/root、本地 `main` 与 `origin/main` 均为 `634414557f14576c666d98276be80a230130b055` 且 clean；fetch、root ff-only merge 与唯一一次 push 均 exit 0；I&V terminal 记录 `ls-remote main` 为同一 SHA。
- target ownership：ActionGrant design 与短时 main integration leases 已释放；Permission implementation 可按扩展 Common lease恢复。ActionGrant runtime implementation 仍排在 Platform Security 之后。

### 4.6 SITE — `MIGRATION_FROZEN`

- source threads：control `019f8fb8-84bf-7c90-ad1f-51853220ac0a`；design `019f8fb8-834c-7b21-9e39-d2e0fdf0c7ff`。
- active I/R/V/X：无。
- state：FAQ 与 Article Category 历史集成状态来自 handoff；Site Inspiration 无 candidate。
- dependencies/gaps：仅登记为待设计/依赖事项，具体方案以 site-service、site runtime 与 feature packet 为准。
- target ownership：Program Control deferred backlog；本阶段不派发实现线程。

### 4.7 API-KEY — delivered historical cycle

- source thread IDs：handoff 未提供；不得推断或唤醒旧线程补采。
- main-history state：protected verifier/runtime 已交付，来自 handoff；public external opening 仍受 selected-cloud KMS/HSM/operator runbook gate 约束，具体以 ADR-0017 与外部 API key 真相源为准。
- active command：不恢复。
- retained risk：`/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/x01-integration` 当前 dirty，存在两个未跟踪文件：
  - `src/services/system/auth-service/src/domain/api-key/api-key.credential.ts`
  - `src/services/system/auth-service/src/domain/api-key/api-key.credential.spec.ts`
- target：immutable closure summary / archive candidate；在 dirty resource 得到用户确认的处置记录前，不删除或清理 Git 资源。

### 4.8 EVENT — `CLOSED`

- source thread IDs：handoff 未提供；不得推断或唤醒旧线程补采。
- main evidence：`0a321c0d35442a0cf94956734f33cf5fab696f88`；commit 存在。
- target：immutable closure summary / safe archive candidate；本阶段不执行归档。

### 4.9 EXEC-REVOKE — `CLOSED`

- source thread IDs：handoff 未提供；不得推断或唤醒旧线程补采。
- main evidence：`0a321c0d35442a0cf94956734f33cf5fab696f88`；commit 存在。
- target：immutable closure summary / safe archive candidate；本阶段不执行归档。

## 5. 写路径重叠与串行约束

| 冲突组 | 重叠面 | Program Control 排序约束 |
| --- | --- | --- |
| GRPC carrier ↔ ACTION-GRANT | trusted-execution index / public-barrel surfaces | GRPC carrier 先完成验收与集成；ActionGrant 后续同步并显式解冲突 |
| EXEC-CRYPTO ↔ ACTION-GRANT | Auth ownership | Platform Security 独占执行窗口；ActionGrant 不并发 |
| PRINCIPAL/PERMISSION ↔ ACTION-GRANT | Permission ownership | Permission RPC 先冻结并交付；ActionGrant 后续同步 |
| ACTION-GRANT ↔ 多 write owners | Common、Auth、Permission、Collaboration、proto/Prisma/tests | 作为迁移保留例外串行完成，不把它视作未来多 owner 常态 |
| AI candidate ↔ 其他候选 | 仅 AI registrations 两文件 | 路径隔离，可最先重建/复验；仍由 Integration & Verification 串行验收 |

## 6. 建议交付顺序（仅迁移排序，不是治理冻结）

1. AI rebuilt candidate `94094fe57…` 已完成独立验收、ff-only 集成与一次 main push。
2. Principal Authorization replacement candidate `fe395fb5…` 已完成独立验收、ff-only 集成与一次 main push，MIG-D06 关闭。
3. ActionGrant design candidate `63441455…` 已独立验收、ff-only 集成并 push；恢复同一 Permission implementation task，并登记最小 Permission namespace Common lease。
4. GRPC carrier 基于新的 `main@fe395fb5…` 形成 current-main rebuilt candidate，再进入持久 I&V lane；当前只排队、不派发。
5. Platform Security 串行完成 Permission decision RPC 与后续 Auth STS；GRPC Asset 再同步、重建、复验、集成。
6. ACTION-GRANT 在设计冻结和 Platform Security 前置完成后同步、解决冲突、验收、集成。
7. SITE 仅在前置依赖满足后恢复。

## 7. 归档候选与必须保留的资源

### 7.1 Safe archive candidates（仅候选，不执行）

- EVENT closure record/thread resources：已有 `CLOSED` 与 main evidence。
- EXEC-REVOKE closure record/thread resources：已有 `CLOSED` 与 main evidence。
- API-KEY historical command/thread resources：可形成 immutable closure summary；其 dirty integration worktree 必须先有显式处置决定，Git 资源继续保留。

AI legacy A/V 与 migration implementation 任务已有完整重建、独立 I&V、集成及远端 main 证据，可进入 thread archive candidate；本阶段不执行归档。AI 的分支、提交与工作树继续保留，只有用户明确批准后才正常清理 Git 资源。所有仍承载候选、拒绝证据或未冻结设计上下文的 `MIGRATION_FROZEN` 旧任务继续保留。

### 7.2 Retained candidate/decision resources

| 资源角色 | Ref / SHA | 保留原因 |
| --- | --- | --- |
| GRPC carrier | `codex/grpc/i04-source-credential-carrier@dced77ad8cb877ea9aad10f1c6a310ad32a924df` | 待验收/集成 |
| GRPC Asset | `codex/grpc/i03-gateway-trusted-execution-producer@6973bcda1484ac2fccc522f5d8ee70dc989c7541` | 待 Platform Security 后重建复验 |
| Permission decision legacy workspace | `codex/acprincipalrole-principalrolebinding-command@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 保留旧上下文；不恢复旧任务 |
| Principal Authorization rejected design candidate | `4f78cec80b133fd186079fefc6b78ba42be86c28` | 保留 DESIGN_GAP 证据；已由同 branch 的 replacement supersede |
| Principal Authorization replacement candidate | `codex/unified-design/security-open-packets@fe395fb5254a620108882494eb601cfe00fd5701` | 已独立验收并集成；保留设计与修正证据 |
| ActionGrant design candidate | `codex/unified-design/security-open-packets@634414557f14576c666d98276be80a230130b055` | 已独立验收并集成；保留设计与 Permission scope-gap closure 证据 |
| Permission Decision RPC rejected candidate | `codex/migration/permission-decision-rpc@96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` | 保留 I&V 安全拒绝证据；等待同 branch remediation candidate |
| EXEC-CRYPTO writer | `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660687bbeb24349d11bcaed6f63d2373c4b` | 保留上下文；无替代 candidate |
| EXEC-CRYPTO rejected candidate | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | 保留拒绝证据 |
| AI accepted legacy candidate | `codex/ai-platform/i01-tool-contract-registration@6101933d3f054989e6dbfca27889a7141db16075` | 保留历史验收与 blob 对照证据 |
| AI rebuilt candidate | `codex/migration/ai-platform-completion@94094fe57a8d2f18750ef712f2730015be2d9514` | 已独立验收并集成；保留交付证据，等待用户批准清理 |
| ACTION-GRANT candidate | `codex/action-grant/i01-delegated-task-runtime@ec2b2cf881fec81f1882b3260f397f33d618aaf0` | pending，待设计与串行整合 |
| Closed-cycle main evidence | `0a321c0d35442a0cf94956734f33cf5fab696f88` | EVENT / EXEC-REVOKE closure evidence |

### 7.3 当前全部 worktree 清单

当前观察到 34 个 worktree；除明确标记外均 clean。所有资源保持原状。

| Worktree | Branch | HEAD | State |
| --- | --- | --- | --- |
| `/Users/acehood/Documents/GitHub/oes` | `main` | `634414557f14576c666d98276be80a230130b055` | clean |
| `/Users/acehood/.codex/worktrees/10ab/oes` | detached | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |
| `/Users/acehood/.codex/worktrees/1d99/oes` | detached | `0a321c0d35442a0cf94956734f33cf5fab696f88` | clean |
| `/Users/acehood/.codex/worktrees/229b/oes` | detached | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/program-control/migration` | `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd69` | clean；替代已回收的 Codex 临时 worktree |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/ai-platform-completion` | `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` | clean；AI rebuilt candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/permission-decision-rpc` | `codex/migration/permission-decision-rpc` | `96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` | clean；Permission implementation candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/integration/main-queue` | `codex/integration/main-queue` | `96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` | clean；I&V 保留 rejected Permission candidate evidence，root main 未变 |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/unified-design/security-open-packets` | `codex/unified-design/security-open-packets` | `634414557f14576c666d98276be80a230130b055` | clean；ActionGrant design candidate |
| `/Users/acehood/.codex/worktrees/44ef/oes` | `codex/exec-crypto/i06-auth-tg2-remediation` | `64ea8660687bbeb24349d11bcaed6f63d2373c4b` | clean |
| `/Users/acehood/.codex/worktrees/475d/oes` | detached | `ddab5e77fdc7240750039c430f48a0e6fd76ab62` | clean |
| `/Users/acehood/.codex/worktrees/4853/oes` | detached | `a0310fbbee37b7d17456e3a7f1bf6ea846c4dfb3` | clean |
| `/Users/acehood/.codex/worktrees/4a92/oes` | `codex/acexeccrypto-token-cryptography-command` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |
| `/Users/acehood/.codex/worktrees/72ae/oes` | `codex/ai-platform/i01-tool-contract-registration` | `6101933d3f054989e6dbfca27889a7141db16075` | clean |
| `/Users/acehood/.codex/worktrees/bf83/oes` | `codex/acprincipalrole-principalrolebinding-command` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | clean |
| `/Users/acehood/.codex/worktrees/d69e/oes` | detached | `6101933d3f054989e6dbfca27889a7141db16075` | clean |
| `/Users/acehood/.codex/worktrees/d899/oes` | detached | `b641e0e104080dd852688ac1b1887efc9f2684a5` | clean |
| `/Users/acehood/.codex/worktrees/f9a5/oes` | `codex/acgrpc-trusted-grpc-execution` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/action-grant/d-governance` | `codex/action-grant/d-governance` | `e006564cee327428e5c7b280c52001d690f6ab37` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/action-grant/i01-delegated-task-runtime` | `codex/action-grant/i01-delegated-task-runtime` | `ec2b2cf881fec81f1882b3260f397f33d618aaf0` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/action-grant/x01-integration` | `codex/action-grant/x01-integration` | `ddab5e77fdc7240750039c430f48a0e6fd76ab62` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/ai-platform/d-governance` | `codex/ai-platform/d-governance` | `1e15b14b180b8345b9a4f77a48ab920a798aeb41` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/ai-platform/d-tool-contract-registration` | `codex/ai-platform/d-tool-contract-registration` | `f2fb093129fa6084f40b9ca9bef6df04a7e163fe` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/d-external-api-key-security` | `codex/api-key/d-external-api-key-security` | `a0206b8aa1c088cd0487c06a37442885b244d3a6` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/i02-verifier-provider` | `codex/api-key/i02-runtime-completion` | `3ce94b7a2ef8fdd1a75e05aa517cc35d60534bf8` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/x01-integration` | `codex/api-key/x01-integration` | `a776ad75894f515d0d559f783616f655dec8d592` | **dirty：2 untracked files** |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/exec-crypto/d-sts-authority-upper-bound` | `codex/exec-crypto/d-sts-authority-upper-bound` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/governance/d-single-consumer-pull` | `codex/governance/d-single-consumer-pull` | `a1597e8ea03baffafd8b3cca59770f8fdcadcc69` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/governance/repository-hygiene-v2` | `codex/governance/repository-hygiene-v2` | `aa7babec82d709f559938208d262aceac9f78f17` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i01-generated-metadata-substrate` | `codex/grpc/i01-generated-metadata-substrate` | `4240e4b7deecac6be92f9f183ca6fbea70f83215` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i03-gateway-trusted-execution-producer` | `codex/grpc/i04-source-credential-carrier` | `dced77ad8cb877ea9aad10f1c6a310ad32a924df` | clean；path/branch 名称不一致 |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/v01-generated-metadata-foundation` | detached | `9d091829e5aad6aad2e93ae1a90ea2187ba785ab` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/x01-integration` | `codex/grpc/x01-integration` | `78329db36f13be30f293f2666720180da8991faa` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/trusted-grpc-execution-context/d-freeze` | `codex/trusted-grpc-execution-context/d-freeze` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |

### 7.4 当前全部 `codex/*` branch refs

| Branch | HEAD |
| --- | --- |
| `codex/acapikey-external-api-key` | `a776ad75894f515d0d559f783616f655dec8d592` |
| `codex/acexeccrypto-token-cryptography-command` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` |
| `codex/acgrpc-trusted-grpc-execution` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` |
| `codex/acprincipalrole-principalrolebinding-command` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` |
| `codex/action-grant/d-governance` | `e006564cee327428e5c7b280c52001d690f6ab37` |
| `codex/action-grant/i01-delegated-task-runtime` | `ec2b2cf881fec81f1882b3260f397f33d618aaf0` |
| `codex/action-grant/x01-integration` | `ddab5e77fdc7240750039c430f48a0e6fd76ab62` |
| `codex/ai-platform/d-governance` | `1e15b14b180b8345b9a4f77a48ab920a798aeb41` |
| `codex/ai-platform/d-tool-contract-registration` | `f2fb093129fa6084f40b9ca9bef6df04a7e163fe` |
| `codex/ai-platform/i01-tool-contract-registration` | `6101933d3f054989e6dbfca27889a7141db16075` |
| `codex/api-key/d-external-api-key-security` | `a0206b8aa1c088cd0487c06a37442885b244d3a6` |
| `codex/api-key/i02-runtime-completion` | `3ce94b7a2ef8fdd1a75e05aa517cc35d60534bf8` |
| `codex/api-key/x01-integration` | `a776ad75894f515d0d559f783616f655dec8d592` |
| `codex/exec-crypto/d-sts-authority-upper-bound` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` |
| `codex/exec-crypto/i06-auth-tg2-remediation` | `64ea8660687bbeb24349d11bcaed6f63d2373c4b` |
| `codex/governance/d-single-consumer-pull` | `a1597e8ea03baffafd8b3cca59770f8fdcadcc69` |
| `codex/governance/repository-hygiene-v2` | `aa7babec82d709f559938208d262aceac9f78f17` |
| `codex/grpc/i01-generated-metadata-substrate` | `4240e4b7deecac6be92f9f183ca6fbea70f83215` |
| `codex/grpc/i02-trusted-execution-runtime-baseline` | `9bcf5768b33b625e5f7821b87b4977a7eece01d0` |
| `codex/grpc/i03-gateway-trusted-execution-producer` | `6973bcda1484ac2fccc522f5d8ee70dc989c7541` |
| `codex/grpc/i04-source-credential-carrier` | `dced77ad8cb877ea9aad10f1c6a310ad32a924df` |
| `codex/grpc/x01-integration` | `78329db36f13be30f293f2666720180da8991faa` |
| `codex/integration/main-queue` | `96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` |
| `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` |
| `codex/migration/permission-decision-rpc` | `96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` |
| `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd690af817f8e9bb092fbafb769a31b2e1a6` |
| `codex/trusted-grpc-execution-context/d-freeze` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` |
| `codex/unified-design/security-open-packets` | `634414557f14576c666d98276be80a230130b055` |

## 8. 本轮验证记录

只读验证覆盖：

- `git rev-parse`：核验 root、Program Control、所有列出的 candidate/decision commit 与关键 branch refs。
- `git worktree list --porcelain`：枚举 30 个当前 worktree。
- 每个 worktree 的 `git status --porcelain=v1`：29 个 clean，API-KEY x01 存在 2 个 untracked files。
- `git for-each-ref refs/heads/codex/`：枚举 24 个当前 `codex/*` branches。
- `git diff --name-status 7500bd66…..6101933d…`：AI candidate 相对其原 base 恰好新增两份 registrations 文件。
- `git diff --name-only 65e49258…..dced77ad…`：GRPC carrier 的 13 个路径与 handoff 一致。
- `git merge-base --is-ancestor`：ActionGrant 三段 commit chain 顺序成立。
- 上节列出的所有 truth-source 文件均存在。

`AI_CANDIDATE_READY` 登记时新增只读验证：

- `git rev-parse`：确认 rebuilt candidate `94094fe57…` 的 parent 为当前 `main@65e49258…`，branch ref 与固定 worktree HEAD 一致且 clean。
- `git diff --stat/--name-status`：确认相对 parent 仅新增两个 registrations 文件，共 272 行。
- `git rev-parse <candidate>:<path>`：确认两个 rebuilt blob 分别与 accepted legacy candidate 对应 blob 完全一致。
- `git worktree list --porcelain` / `git for-each-ref`：AI candidate 登记时资源计数为 31 worktrees / 25 `codex/*` branches；唯一 I&V 固定工作面建立后为 32 / 26。
- JSON parse、既有 contract tests 5/5 与 root-protection checks 为 implementation handoff evidence；Program Control 未重复运行测试。
- 唯一 I&V terminal evidence：JSON parse exit 0；既有 contract tests 5/5 passed；diff check/path/blob checks passed；fetch exit 0；ff-only merge exit 0；push exit 0。
- Program Control 独立终态核验：root `main`、本地 `origin/main` 与 `git ls-remote origin refs/heads/main` 均为 `94094fe57…`；root、AI completion worktree 与 I&V worktree 均 clean。

`PRINCIPAL_AUTHORIZATION_FROZEN_READY` 登记时新增只读验证：

- frozen candidate commit/branch/worktree 一致，parent 为 current root `main@94094fe57…`，Unified Design worktree clean。
- `git diff-tree --check HEAD^ HEAD` exit 0；相对 parent 精确修改 10 个 `docs/**` 文件，96 insertions / 27 deletions。
- 非 `docs/**` 路径计数为 0；无 code、proto、schema 或 runtime 变更。
- root `main`、本地 `origin/main` 与远端 main 均为 `94094fe57…`，root clean。

首次 design candidate I&V terminal evidence：

- 结论 `DESIGN_GAP`；candidate/parent、10 文档、96+/27-、diff check、非 docs 路径为 0 与无 runtime 变更等结构 gate 全部通过。
- 104 个本地 Markdown 链接目标存在；服务真相源引用、contract/architecture 命名和其余四条冻结语义一致。
- 唯一失败项是 Permission 服务真相源第 173/175 行对 ExecutionToken “必须验证”与“不消费”的直接矛盾。
- I&V 未执行 fetch、root merge 或 push；root、本地/远端 main 均保持 `94094fe57…`，root 与 I&V worktree clean。

`PRINCIPAL_AUTHORIZATION_REPLACEMENT_READY` 登记时新增只读验证：

- replacement `fe395fb5…` 的 direct parent 为 rejected candidate `4f78cec8…`，base `94094fe57…` ancestry check exit 0；Unified Design worktree clean。
- correction commit 仅修改 Permission 服务真相源 1 个文件，1 insertion / 1 deletion；未改写、重排或删除 rejected commit。
- 相对 base 的累计候选仍精确为 10 个 `docs/**` 文件、96 insertions / 27 deletions，非 docs 路径为 0。
- root `main` 与本地 `origin/main` 保持 `94094fe57…` 且 clean；未集成、未 push、未开始 ActionGrant。

replacement I&V terminal evidence：

- 结论 `ACCEPTED_AND_INTEGRATED`；candidate object、direct parent、base ancestry、两提交累计范围与 correction 单独 diff 全部通过。
- `git diff-tree --check` exit 0；非 docs 与 code/proto/schema/runtime 路径均为 0；严格 UTF-8 10/10、104 links 与五条冻结语义检查通过。
- 先前歧义 absent、replacement 语义 present；root ff-only merge exit 0，唯一一次 `git push origin main` exit 0。
- root、Unified Design source 与 I&V worktree 均为 `fe395fb5…` 且 clean；本地/远端 main 均为同一 SHA。

`ACTION_GRANT_DESIGN_CANDIDATE_READY` 登记时新增只读验证：

- candidate `63441455…` 的 parent 为 current root `main@fe395fb5…`，branch/worktree HEAD 一致且 clean。
- `git diff-tree --check HEAD^ HEAD` exit 0；精确修改 12 个 `docs/**` 文件，115 insertions / 45 deletions，非 docs 路径为 0。
- Permission implementation 的 inventory `SCOPE_GAP` 已回写为设计一致性 gate；candidate 冻结 Common INTERNAL Code lease 与 delegated upper-bound owner/consumer boundary。
- root `main` 与本地 `origin/main` 保持 `fe395fb5…` 且 clean；candidate 未集成、未 push。

ActionGrant design I&V terminal evidence：

- 结论 `ACCEPTED_AND_INTEGRATED`；candidate 是 parent 的直接后继，精确 12 个 `docs/**` 文件、115 insertions / 45 deletions，非 docs 与 proto/schema/code/runtime 路径为 0。
- `git diff-tree --check`、UTF-8、84 links、六组冻结语义、服务真相源/contract pointers 与 Permission SCOPE_GAP lease/owner boundary 检查通过。
- root ff-only merge exit 0，唯一一次 `git push origin main` exit 0；I&V/source/root 与本地/远端 main 均为 `63441455…` 且 clean。

`PERMISSION_IMPLEMENTATION_CANDIDATE_READY` 登记时新增只读验证：

- candidate `96eb67aa…` 的 parent 为 current root `main@63441455…`，branch/worktree HEAD 一致且 clean；root main/origin-main 保持 parent 且 clean。
- `git diff-tree --check HEAD^ HEAD` exit 0；精确 42 files，3418 insertions / 44 deletions。
- task handoff 记录 L1/L3、Common contract、proto regen/lint、Common/Permission build、Prettier、diff/lease/security gates 通过；Program Control 未重复运行测试。
- L2 数据库不可达与共享 ESLint parser 配置冲突作为环境限制保留，由 I&V 独立复核并决定 gate。

首次 Permission implementation I&V terminal evidence：

- 结论 `REJECTED`；candidate/parent、42 paths、3418+/44-、lease 与 diff check gate 通过；root main/origin-main 保持 `63441455…` 且 clean。
- 独立断言确认 DELEGATED `authzVersion` 泄露内部版本组合且不是 SHA-256；WORKLOAD 直接返回 policy version；现有测试未覆盖最终 delegated/effective Code 集绑定。
- 独立构造与 Nest bootstrap 回归确认 workload issuance policy 缺失/非法配置不会在启动阶段失败。
- MIG-D08 独立复现：L2 因 I&V worktree 无 `.env` 在数据库连接前终止；ESLint 40 files 均在 0:0 parser config error。终态仍由两个安全失败决定，不是环境阻塞。
- I&V 未 fetch、未 merge root、未 push；source/I&V worktree clean at rejected candidate。

本轮没有运行 build、test、lint、安全审计或 acceptance；对应结果均仅作为 handoff evidence 保留，后续候选交付必须在精确重建后的 SHA 上重新验证。

## 9. Discrepancy register

| ID | 发现 | 影响 | 当前处置 |
| --- | --- | --- | --- |
| MIG-D01 | GRPC Asset handoff worktree path 当前绑定 carrier branch/HEAD，而不是 Asset branch/candidate | 不得把该 path 误作 Asset writer；后续恢复 Asset 前需显式选择/建立正确工作面 | 保留全部 refs/worktree，不修改 |
| MIG-D02 | API-KEY x01 integration worktree 有 2 个未跟踪 domain 文件 | 禁止把该 worktree 当作可直接清理资源；需先确认文件来源与保留方式 | 保留 dirty state，不读取线程、不清理 |
| MIG-D03 | 当前资源计数为 34 worktrees / 28 `codex/*` branches，高于 handoff 的 29/23 | 差额来自本 Program Control、AI Platform completion、Integration & Verification、Unified Design 与 Permission decision RPC 的隔离工作树/分支，并非旧资源漂移 | 在全局快照显式对账 |
| MIG-D04 | API-KEY、EVENT、EXEC-REVOKE 的具体 source thread IDs 未包含在 compact bundle | 台账只能保留 capability 状态与 Git evidence，不能形成完整 thread-level archive manifest | 不唤醒旧线程；等待后续显式补充或按现有证据形成 closure summary |
| MIG-D05 | GRPC carrier `dced77ad…` 的 parent 为 `65e49258…`，当前 main 已推进至 `63441455…`，两者为 `4/1` 分叉 | 旧 SHA 不能通过持久 I&V lane 的 ff-only integration gate | 保留原 candidate 证据；后续先形成基于 current main 的精确 rebuilt candidate |
| MIG-D06 | Principal Authorization candidate `4f78cec8…` 的 Permission 服务真相源同时要求验证 ExecutionToken 又声明不消费 ExecutionToken | 首个 candidate 被 I&V 拒绝 | `CLOSED`：replacement `fe395fb5…` 已最小修正、复验、集成并 push |
| MIG-D07 | Permission implementation inventory 发现 Common 缺少 principal-authorization INTERNAL Code 注册，且 DELEGATED issuance 缺少 owner upper-bound contract/runtime resolver | 原 Permission lease 不足，直接实现会复制跨域真相或读取 AI registration JSON | `CLOSED`：ActionGrant design `63441455…` 已冻结并集成最小 Common lease 与 owner/consumer boundary；恢复同一 Permission task |
| MIG-D08 | Permission candidate 的 L2 受本地 PostgreSQL `permissiondb` 不可达限制；精确 ESLint 受共享 parser `project`/`projectService` 冲突限制 | 两个 gate 未提供代码级通过证据，但其失败均发生在环境/配置前置 | 保留字面失败证据；交由独立 I&V 复核，不在实现候选中修改数据库环境或共享 ESLint 配置 |
| MIG-D09 | Permission candidate `96eb67aa…` 的最终 DELEGATED/WORKLOAD authzVersion 非 opaque SHA-256，且 workload policy 未在 bootstrap 解析 | 泄露内部版本结构、未绑定最终有效 Code 集；非法/缺失策略直到首个请求才失败 | I&V `REJECTED`；返回同一 Permission task 追加安全 remediation commit，不重开设计或任务 |

## 10. 下一阶段入口

Permission Decision RPC candidate `96eb67aa…` 已被独立 I&V 以两个安全 gate 失败 `REJECTED`。当前唯一动作是恢复同一 Permission implementation task `019fcbff-ff44-7612-a187-045fa9f47333`，在原 branch/worktree 上追加 MIG-D09 remediation commit 并返回 replacement candidate；不修改设计、数据库环境或共享 ESLint 配置。GRPC carrier 继续排队且与 main 为 `4/1` 分叉。不启用 checker，也不恢复旧 capability 任务。
