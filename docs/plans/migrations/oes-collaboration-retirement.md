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

### 1.1 用户优先级与迁移终态验收条件

- AI Platform 与 ActionGrant 的已冻结设计继续以 architecture、ADR、collaboration、contract 与 feature packet 真相源为准，但其 runtime/feature implementation 延后到核心业务能力完成之后。本迁移阶段不得创建或恢复 AI Platform runtime、Task Assistant runtime、ActionGrant runtime、DelegationGrant runtime、AI tool execution、confirmation UI 或 ActionGrant consumer implementation 任务。
- 已集成的 `task-assistant-collaboration-task.v1` registration 保持 disabled，仅作为设计/契约及迁移证据；不得据此启动 AI feature runtime。
- 非 AI feature 的基础能力按依赖顺序继续：Permission Decision RPC 已完成；下一队列为 GRPC current-main rebuild，随后才是依赖满足后的 EXEC-CRYPTO 与必要 service-trust/security foundation。
- 迁移保全是删除前硬 gate：每个旧 worktree、branch、task 必须先归入“已集成 current main”“保留并重建/集成的候选”“已持久登记的 superseded/rejected evidence”或“dirty/untracked 待捕获处置”之一。未分类资源不得 reset、clean、删除或覆盖。
- 最终 Git 验收态只保留最新完整 root `main` worktree；迁移台账必须先进入 `main`，再移除 Program Control migration worktree。所有有用代码、设计、候选、拒绝证据、测试记录和 dirty 内容必须先集成或持久登记。
- 旧 capability-collaboration Command/design/I/R/V/X/checker tasks 在证据消费后归档；已完成的 migration implementation tasks 及时归档。Program Control、Unified Design 与持久 I&V 仅在仍有迁移职责时保留，最终迁移关闭时归档 migration-only control tasks；全程不启用 checker。
- 本节只记录本次迁移的优先级与关闭验收条件，不建立新的治理框架。

## 2. 全局快照

| 项目 | Handoff 状态 | 2026-08-04 本地只读核验 |
| --- | --- | --- |
| Repository root | `/Users/acehood/Documents/GitHub/oes` | 路径存在；`main` 工作树 clean |
| `main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 当前 `3e263e501341ea1b90049d5343c42db055f3c5ea`；AI、Principal Authorization、ActionGrant design、Permission 与 GRPC carrier 经唯一 I&V lane ff-only 推进 |
| `origin/main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 当前本地 remote-tracking ref 为 `3e263e501341ea1b90049d5343c42db055f3c5ea` |
| Legacy formal A/* threads | 101 | 仅保留 handoff 汇总计数；未读取或唤醒线程 |
| Worktrees | 29 | 当前 35；新增项为本 Program Control、AI Platform completion、Integration & Verification、Unified Design、Permission decision RPC 与 GRPC carrier rebuild worktree |
| `codex/*` branches | 23 | 当前 29；新增项为 `codex/oes-program-control-migration`、`codex/migration/ai-platform-completion`、`codex/integration/main-queue`、`codex/unified-design/security-open-packets`、`codex/migration/permission-decision-rpc` 与 `codex/migration/grpc-carrier-rebuild` |
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

### 4.1 GRPC — `CARRIER_ACCEPTED_AND_INTEGRATED`

- source threads：control `019fc87a-54b3-7463-ad9d-5750e8bab94b`；A/D GRPC `019f99f6-c707-7eb0-8c93-267c67288475`；A/D ASSET `019f983c-152a-7051-8011-9a25ca0987d7`；current A/I `019fc563-a9c4-76b0-9774-283206d2f1f0`。
- carrier：branch `codex/grpc/i04-source-credential-carrier`，candidate `dced77ad8cb877ea9aad10f1c6a310ad32a924df`；commit 存在，branch ref 一致，工作树 clean；相对当前 `main` 核验为 13 个 Common/Gateway transport-private source-credential 路径。
- carrier acceptance：handoff 明确未创建 A/V；后续必须先验收再进入集成候选。
- Asset：branch `codex/grpc/i03-gateway-trusted-execution-producer`，candidate `6973bcda1484ac2fccc522f5d8ee70dc989c7541`；commit 与 branch ref 存在。
- handoff security evidence：bearer 未进入 DTO、`TrustedExecutionContext`、cache key、日志、审计、ordinary metadata 或 legacy authority；本轮未重跑安全审计。
- target ownership：Gateway & Trusted Transport。
- ordering：carrier 验收/集成优先；Asset 在 Platform Security 落地后同步、重建并复验。
- rebuild task：`OES Implementation · GRPC Carrier Rebuild`，thread `019fd120-b523-7e83-9881-68dce7db88c2`，host `local`；标题已设置并读回，首次即时快照为 `active`，cwd 是只读 root，不是旧删除 worktree。
- fixed lease：`/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-carrier-rebuild` / `codex/migration/grpc-carrier-rebuild`，从 `main@45a7e306…` 建立；candidate 已提交、验收并集成，source worktree clean。
- rebuilt candidate：`3e263e501341ea1b90049d5343c42db055f3c5ea`，direct parent/current main `45a7e3065d66f3692493181120ebd08e47ec283f`；精确 12 changed paths、497 insertions / 22 deletions，全部位于登记的 13-path lease。
- blob disposition：11 个 candidate blobs 与 retained `dced77ad…` 完全一致；`public-barrels.spec.mjs` 适配 current main 以断言 transport-private carrier 不可见；`src/common/src/transport/grpc/index.ts` 精确保持 current-main blob，因此不出现在 12-path diff 中，避免 public export。
- implementation verification：Common build exit 0；API Gateway build exit 0；Common focused 14 tests 与 Gateway focused 8 tests passed；Prettier、path/diff/retained-blob、bearer non-propagation/public-barrel/cache/context/legacy scans passed。AI/ActionGrant runtime、Asset、Permission 与 Auth STS 未触碰。
- I&V route：既有持久 task `019fcaf2-ca7b-7140-b46d-b6cacae58556` 派发前为 idle；接收 exact candidate 后首次即时快照为 active，完成独立验收/集成后回到 idle。未创建新 acceptance task。
- I&V terminal：`ACCEPTED_AND_INTEGRATED`。candidate/parent/ancestry、12 paths / 497+/22-、13-path lease、UTF-8、diff check、11 retained blobs、adapted public-barrel invisibility 与 unchanged transport public barrel 全部通过。
- independent verification：I&V 与 root 均完成 Common/API Gateway build；Common 3 suites / 14 tests、Gateway 2 suites / 8 tests、public-barrel invisibility 与 bearer non-propagation/cache/context/log/audit/legacy scans 通过。早期两条 shell scan 命令仅有注释误报/反引号解释错误，纠正后的结构检查通过，候选未修改。
- final integration evidence：root ff-only merge exit 0；root 新鲜 build/focused tests 通过；唯一一次 `git push origin main` exit 0。root/I&V/source、本地 main、local origin/main 与 `ls-remote main` 均为 `3e263e501341ea1b90049d5343c42db055f3c5ea` 且 clean。
- task archive：GRPC implementation task `019fd120-b523-7e83-9881-68dce7db88c2` 已在 terminal 证据消费后归档。
- discrepancy：handoff 指定的 Asset retained writer worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i03-gateway-trusted-execution-producer` 当前实际绑定 carrier branch，并位于 `dced77ad8cb877ea9aad10f1c6a310ad32a924df`；Asset branch/candidate 仍保留，但当前没有绑定该 branch 的 worktree。

### 4.2 PRINCIPAL-ROLE / Permission — `IMPLEMENTATION_ACCEPTED_AND_INTEGRATED`（legacy resources retained）

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
- remediation candidate：`codex/migration/permission-decision-rpc@45a7e3065d66f3692493181120ebd08e47ec283f`；direct parent rejected candidate `96eb67aa126cccbb98e91bb0fedf4f90cfd8399e`；base/current root main `634414557f14576c666d98276be80a230130b055` 是 ancestor；fixed worktree clean。
- correction scope：8 files，534 insertions / 99 deletions；所有 principal/workload/delegated-action allow/deny authzVersion 统一为绑定决策上下文、可信版本与最终 Code 集的 64 位 lowercase SHA-256；workload policy 在 repository constructor/Nest bootstrap 立即完整解析，缺失/空/非法/冲突配置阻止启动。
- cumulative scope：相对 base 精确 42 files，3867 insertions / 58 deletions，仍全部位于原 stable lease；generated ignored，root clean，未 merge、未 push。
- remediation verification：定向 6 suites / 41 tests、完整 L1 73 suites / 285 tests、L3 8 suites / 39 tests、Common contract 2/2、proto regen/lint、Common/Permission build、Prettier、diff/lease/security scans 均 exit 0；MIG-D08 的 L2/ESLint 环境限制原样保留。
- replacement registration reconciliation：用户再次登记的 candidate `45a7e306…`、direct parent `96eb67aa…`、base `63441455…`、branch/worktree、clean state 与上述验证证据完全一致；其中“未 merge、未 push”是候选形成时快照，后续状态由下一条独立 I&V terminal 证据推进，不回退已完成集成事实。
- remediation I&V terminal：唯一持久 Integration & Verification task 返回 `ACCEPTED_AND_INTEGRATED`。direct parent/base ancestry、correction 8 files、cumulative 42 files、lease/diff/UTF-8 与 MIG-D09 独立安全断言全部通过。
- final integration evidence：I&V/source/root、本地 `main` 与 `origin/main` 均为 `45a7e3065d66f3692493181120ebd08e47ec283f` 且 clean；proto regen/lint、Prisma generate、Common/Permission build、MIG-D09 4 suites / 36 tests、Common contract 7 tests 与完整 Permission 回归通过；root ff-only merge 与唯一一次 push exit 0，I&V terminal 记录 `ls-remote main` 为同一 SHA。
- MIG-D08 disposition：L2 与 ESLint 环境限制继续保留为仓库/运行环境证据，不覆盖独立安全与运行验证；I&V 接受候选但未宣称这两个 gate 通过。
- task archive：migration implementation task `019fcbff-ff44-7612-a187-045fa9f47333` 在 `main@45a7e306…` 集成证据完成后已归档；source candidate/worktree 继续保留到最终 Git 清理 gate。
- target ownership：Permission implementation 与短时 main integration leases 已释放；GRPC carrier rebuild 已进入独立稳定写 lease。

### 4.3 EXEC-CRYPTO — `CURRENT_MAIN_REMEDIATION_ACTIVE`

- source threads：control `019fc601-1f32-7912-a9a5-849cf22cfd23`；design `019fa287-01a8-7340-8fb3-b56df8652dcd`；I06 `019fc608-c9cf-7a82-a91a-0b9aa6d0cd5f`。
- active retained writer：`/Users/acehood/.codex/worktrees/44ef/oes`；branch `codex/exec-crypto/i06-auth-tg2-remediation`；HEAD `64ea8660687bbeb24349d11bcaed6f63d2373c4b`；clean。
- rejected candidate：`c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc`；commit 保留。拒绝原因来自 handoff：权限请求集合被复制为授权集合并进行自比较，形成恒真 privilege gate。
- authority-upper-bound design branch：`codex/exec-crypto/d-sts-authority-upper-bound@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；无替代候选。
- dependencies：GRPC carrier 与 Permission decision RPC 均已集成，前置满足。retained remediation `64ea8660…` 与 current main 为 `7/2` 分叉，须在 Platform Security 稳定 lease 下形成 current-main rebuilt candidate，不能直接 ff-only 集成旧 SHA。
- root-cause guard：`64ea8660…` 是以 rejected `c7ab0d9c…` 与旧 main 为双 parent 的 merge checkpoint，不能直接复制历史或沿用 rejected privilege gate。requested Codes 只能是请求；current Permission Decision RPC 的 granted output 是 authoritative upper bound，必须检查 `requested ⊆ granted` 并 fail closed。
- implementation task：`OES Implementation · EXEC-CRYPTO Remediation`，thread `019fd13b-18a3-7be3-bdb9-972c7b8a4c89`，host `local`；标题已设置并读回，首次即时快照为 active，cwd 为只读 root，不是旧 worktree。
- fixed worktree：`/Users/acehood/Documents/GitHub/oes/.worktrees/migration/exec-crypto-remediation`；branch `codex/migration/exec-crypto-remediation`；base `3e263e501341ea1b90049d5343c42db055f3c5ea`。派发前确认 `.worktrees` ignored、目标 branch/worktree 不存在；首次快照时仍由任务待创建。
- provisional maximum lease：只允许 retained diff 中 9 个 `src/services/system/auth-service/**` execution-token exchange/context bootstrap/verified-context provider/token-module implementation 与定向 spec 路径；任务必须在写入前完成 exact diff/root-cause/path ownership audit并进一步缩窄。4 个 `docs/**` truth sources 只读，任何新增路径或公共契约变更均返回 Program Control/Unified Design，不自行扩 scope。
- protected paths：ActionGrant runtime、API-key provider、AI、GRPC Asset、Permission、Common public API、其他 Auth 能力与业务 feature 全部禁止写入。current GRPC carrier、mTLS/workload binding 与 frozen ExecutionToken claims/signing/rotation 语义必须保持。
- execution gate：TDD 必须覆盖 requested/granted 不同集合的真实回归；整体实现后一次性批量 build/tests/security/path/diff checks；只形成 clean local candidate，不 merge/push。
- next route decision：EXEC-CRYPTO remediation 先于 GRPC Asset。原因是 Asset 明确等待 Platform Security 落地，而 EXEC-CRYPTO 的两项已登记依赖现已满足。
- target ownership：Platform Security 独占上述 provisional lease；当前无并发 Auth writer。

### 4.4 AI-PLATFORM — `ACCEPTED_AND_INTEGRATED`（legacy resources retained）

- source threads：control `019fa317-f7eb-7d51-a1a5-63c1f90ef907`；A/I `019fc52d-3e6d-7d03-b5f2-27befd10c7d7`；A/V `019fcaac-840c-7072-b792-793396ea30b3`。
- migration implementation thread：`019fcaeb-cc91-7f81-acf9-4e8a34c9701d`；已完成并确认保持 archived，不恢复旧 capability 任务。
- accepted legacy candidate：`6101933d3f054989e6dbfca27889a7141db16075`；branch/worktree `codex/ai-platform/i01-tool-contract-registration` / `/Users/acehood/.codex/worktrees/72ae/oes`；作为历史验收与内容证据保留。
- acceptance worktree：`/Users/acehood/.codex/worktrees/d69e/oes`；detached at exact candidate；clean。
- legacy handoff acceptance：`ACCEPTED`；contract tests 5/5、JSON parse、diff/path checks passed。
- rebuilt candidate：`94094fe57a8d2f18750ef712f2730015be2d9514`；parent `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；branch/worktree `codex/migration/ai-platform-completion` / `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/ai-platform-completion`；clean。
- scope：相对 parent 精确新增 `src/ai-platform/tool-contracts/registrations/` 下两个 `task-assistant-collaboration-task.v1` 文件，共 272 行；两个 blob 与 accepted legacy candidate 完全一致。
- implementation handoff verification：JSON parse passed；既有 contract tests 5/5 passed；diff/path/content/root-protection checks passed。Program Control 本轮未重跑测试，只读复核了 Git 结构与 blob 证据。
- I&V terminal：唯一持久 Integration & Verification 任务 `019fcaf2-ca7b-7140-b46d-b6cacae58556` 返回 `ACCEPTED_AND_INTEGRATED`。JSON parse exit 0；既有 contract tests 5/5 passed；diff check、精确路径与 blob checks passed；fetch `origin/main` exit 0；ff-only merge exit 0；`git push origin main` exit 0。
- final integration evidence：candidate、本地 `main`、本地 `origin/main` 与 `git ls-remote origin refs/heads/main` 均为 `94094fe57a8d2f18750ef712f2730015be2d9514`；root、AI completion worktree 与 I&V worktree 均 clean。
- runtime priority：registration 继续保持 disabled，仅作为已集成的设计/contract evidence；AI Platform、Task Assistant、AI tool execution 与 confirmation UI runtime 均延后到核心业务能力完成之后，不派发实现任务。
- target ownership：AI Platform completion 写入 lease 与短时 main integration lease 均已释放；候选、提交、分支与工作树作为已集成证据保留，等待满足最终清理 gate 后正常清理。唯一 I&V lane 当前不持有 candidate。

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
- runtime priority：ActionGrant/DelegationGrant、AI tool execution、confirmation UI 与 ActionGrant consumer runtime 全部延后到核心业务能力完成之后；旧 runtime candidate `ec2b2cf…` 仅保留为未验收迁移资产，不恢复、不集成、不丢失。
- target ownership：ActionGrant design 与短时 main integration leases 已释放；Permission implementation 已按扩展 Common lease完成并集成。ActionGrant runtime 不进入当前基础能力执行队列。

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
- original retained risk：`/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/x01-integration` 曾存在两个未跟踪文件：
  - `src/services/system/auth-service/src/domain/api-key/api-key.credential.ts`
  - `src/services/system/auth-service/src/domain/api-key/api-key.credential.spec.ts`
- read-only capture：
  - `api-key.credential.spec.ts`：1485 bytes；SHA-256 `a42530b851021b6b9d0e9eb93fb422e6f279af0b954e8bc73e20a9a35890b6a0`；Git blob `34ad722672a11433d1296fac2d3f11e9acfd2d8d`。与 rejected API-KEY candidate `b641e0e104080dd852688ac1b1887efc9f2684a5` 同路径 blob 完全一致；与 current main / `codex/api-key/i02-runtime-completion` 的后续 blob `2651e842…` 不同；其余已知 API-KEY refs 同路径不存在。分类：`SUPERSEDED_REJECTED_EVIDENCE_IDENTICAL`。
  - `api-key.credential.ts`：3002 bytes；SHA-256 `e911043ae743a4a2c6cae4edd4f1caff7b50a327a6f43cc4048886cec24c8040`；Git blob `e54f5f1f5e0f467b98da681a035b3682d3a164f7`。与 current main / `codex/api-key/i02-runtime-completion` blob `0e40efef…`、rejected `b641e0e1…` blob `6b65fdea…` 均不同；`codex/acapikey-external-api-key`、design、x01 integration 与 `a776ad75…` 同路径不存在，`git log --all --find-object` 未找到该 blob。捕获时分类：`UNIQUE_UNCOMMITTED_CONTENT`。
- comparison set：current main、`codex/acapikey-external-api-key`、`codex/api-key/d-external-api-key-security`、`codex/api-key/i02-runtime-completion`、`codex/api-key/x01-integration`、rejected `b641e0e1…` 与 integrated `a776ad75…`。本轮未 clean、move、stage、commit 或删除两文件。
- durable preservation：同一 evidence branch/worktree 已形成 `codex/api-key/x01-integration@755d857ab990520a916f73e859e39f1207085e32`，parent `a776ad75894f515d0d559f783616f655dec8d592`；commit message `chore(migration): preserve rejected api key prototype`；精确新增上述 2 files / 113 insertions，`git diff-tree --check` exit 0，worktree clean。
- final classification：实现使用已被 ADR-0017/provider design 明确淘汰的 raw pepper/`createHmac` seam；连同上下文 spec 统一分类为 `PRESERVED_REJECTED_PROTOTYPE_EVIDENCE`，永不路由 I&V、永不集成 main。
- target：保留 clean durable evidence ref 直到 final cleanup manifest 已进入 main；届时可与其他 superseded/rejected refs 一并正常移除。

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
4. GRPC carrier rebuilt candidate `3e263e50…` 已独立验收、ff-only 集成并 push。
5. 下一基础主线是 Platform Security 的 EXEC-CRYPTO remediation current-main rebuild；完成后，GRPC Asset 再按已登记候选同步、重建、复验、集成。
6. AI Platform 与 ACTION-GRANT runtime/feature implementation 保持 deferred，不因基础安全能力推进而自动恢复。
7. SITE 仅在前置依赖满足后恢复。

## 7. 归档候选与必须保留的资源

### 7.1 Safe archive candidates（仅候选，不执行）

- EVENT closure record/thread resources：已有 `CLOSED` 与 main evidence。
- EXEC-REVOKE closure record/thread resources：已有 `CLOSED` 与 main evidence。
- API-KEY historical command/thread resources：可形成 immutable closure summary；原 dirty content 已进入 clean rejected-prototype evidence ref `755d857a…`，待 final cleanup manifest 集成后与其他 evidence refs 一并清理。

AI legacy A/V 与 migration implementation 任务已有完整重建、独立 I&V、集成及远端 main 证据，可进入 thread archive candidate；本阶段不执行归档。AI 的分支、提交与工作树继续保留，只有用户明确批准后才正常清理 Git 资源。所有仍承载候选、拒绝证据或未冻结设计上下文的 `MIGRATION_FROZEN` 旧任务继续保留。

### 7.2 Retained candidate/decision resources

| 资源角色 | Ref / SHA | 保留原因 |
| --- | --- | --- |
| GRPC carrier | `codex/grpc/i04-source-credential-carrier@dced77ad8cb877ea9aad10f1c6a310ad32a924df` | 保留原候选；须基于 current main 重建后验收/集成 |
| GRPC Asset | `codex/grpc/i03-gateway-trusted-execution-producer@6973bcda1484ac2fccc522f5d8ee70dc989c7541` | 待 Platform Security 后重建复验 |
| Permission decision legacy workspace | `codex/acprincipalrole-principalrolebinding-command@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 保留旧上下文；不恢复旧任务 |
| Principal Authorization rejected design candidate | `4f78cec80b133fd186079fefc6b78ba42be86c28` | 保留 DESIGN_GAP 证据；已由同 branch 的 replacement supersede |
| Principal Authorization replacement candidate | `codex/unified-design/security-open-packets@fe395fb5254a620108882494eb601cfe00fd5701` | 已独立验收并集成；保留设计与修正证据 |
| ActionGrant design candidate | `codex/unified-design/security-open-packets@634414557f14576c666d98276be80a230130b055` | 已独立验收并集成；保留设计与 Permission scope-gap closure 证据 |
| Permission Decision RPC rejected candidate | `codex/migration/permission-decision-rpc@96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` | 保留 I&V 安全拒绝证据；同 branch remediation 已完成并集成 |
| Permission Decision RPC remediation candidate | `codex/migration/permission-decision-rpc@45a7e3065d66f3692493181120ebd08e47ec283f` | 已独立验收并集成；保留实现与安全修正证据 |
| EXEC-CRYPTO writer | `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660687bbeb24349d11bcaed6f63d2373c4b` | 保留上下文；无替代 candidate |
| EXEC-CRYPTO rejected candidate | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | 保留拒绝证据 |
| API-KEY rejected prototype evidence | `codex/api-key/x01-integration@755d857ab990520a916f73e859e39f1207085e32` | 精确保全原两个 untracked 文件；obsolete raw-pepper seam，永不进入 main |
| AI accepted legacy candidate | `codex/ai-platform/i01-tool-contract-registration@6101933d3f054989e6dbfca27889a7141db16075` | 保留历史验收与 blob 对照证据 |
| AI rebuilt candidate | `codex/migration/ai-platform-completion@94094fe57a8d2f18750ef712f2730015be2d9514` | 已独立验收并集成；保留交付证据，等待用户批准清理 |
| ACTION-GRANT candidate | `codex/action-grant/i01-delegated-task-runtime@ec2b2cf881fec81f1882b3260f397f33d618aaf0` | 未验收 runtime candidate；按用户优先级 deferred，只保全证据，不恢复实现 |
| Closed-cycle main evidence | `0a321c0d35442a0cf94956734f33cf5fab696f88` | EVENT / EXEC-REVOKE closure evidence |

### 7.3 当前全部 worktree 清单

当前观察到 35 个 worktree；除 active GRPC carrier rebuild writer 外均 clean。所有 legacy 资源保持原状。

| Worktree | Branch | HEAD | State |
| --- | --- | --- | --- |
| `/Users/acehood/Documents/GitHub/oes` | `main` | `3e263e501341ea1b90049d5343c42db055f3c5ea` | clean |
| `/Users/acehood/.codex/worktrees/10ab/oes` | detached | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |
| `/Users/acehood/.codex/worktrees/1d99/oes` | detached | `0a321c0d35442a0cf94956734f33cf5fab696f88` | clean |
| `/Users/acehood/.codex/worktrees/229b/oes` | detached | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/program-control/migration` | `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd69` | clean；替代已回收的 Codex 临时 worktree |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/ai-platform-completion` | `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` | clean；AI rebuilt candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/permission-decision-rpc` | `codex/migration/permission-decision-rpc` | `45a7e3065d66f3692493181120ebd08e47ec283f` | clean；Permission remediation candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/integration/main-queue` | `codex/integration/main-queue` | `3e263e501341ea1b90049d5343c42db055f3c5ea` | clean；GRPC carrier accepted/integrated，I&V 当前不持有新 candidate |
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
| `/Users/acehood/Documents/GitHub/oes/.worktrees/api-key/x01-integration` | `codex/api-key/x01-integration` | `755d857ab990520a916f73e859e39f1207085e32` | clean；durable rejected-prototype evidence，永不进入 main |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/exec-crypto/d-sts-authority-upper-bound` | `codex/exec-crypto/d-sts-authority-upper-bound` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/governance/d-single-consumer-pull` | `codex/governance/d-single-consumer-pull` | `a1597e8ea03baffafd8b3cca59770f8fdcadcc69` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/governance/repository-hygiene-v2` | `codex/governance/repository-hygiene-v2` | `aa7babec82d709f559938208d262aceac9f78f17` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i01-generated-metadata-substrate` | `codex/grpc/i01-generated-metadata-substrate` | `4240e4b7deecac6be92f9f183ca6fbea70f83215` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i03-gateway-trusted-execution-producer` | `codex/grpc/i04-source-credential-carrier` | `dced77ad8cb877ea9aad10f1c6a310ad32a924df` | clean；path/branch 名称不一致 |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/v01-generated-metadata-foundation` | detached | `9d091829e5aad6aad2e93ae1a90ea2187ba785ab` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/x01-integration` | `codex/grpc/x01-integration` | `78329db36f13be30f293f2666720180da8991faa` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-carrier-rebuild` | `codex/migration/grpc-carrier-rebuild` | `3e263e501341ea1b90049d5343c42db055f3c5ea` | clean；candidate accepted/integrated，implementation task archived |
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
| `codex/api-key/x01-integration` | `755d857ab990520a916f73e859e39f1207085e32` |
| `codex/exec-crypto/d-sts-authority-upper-bound` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` |
| `codex/exec-crypto/i06-auth-tg2-remediation` | `64ea8660687bbeb24349d11bcaed6f63d2373c4b` |
| `codex/governance/d-single-consumer-pull` | `a1597e8ea03baffafd8b3cca59770f8fdcadcc69` |
| `codex/governance/repository-hygiene-v2` | `aa7babec82d709f559938208d262aceac9f78f17` |
| `codex/grpc/i01-generated-metadata-substrate` | `4240e4b7deecac6be92f9f183ca6fbea70f83215` |
| `codex/grpc/i02-trusted-execution-runtime-baseline` | `9bcf5768b33b625e5f7821b87b4977a7eece01d0` |
| `codex/grpc/i03-gateway-trusted-execution-producer` | `6973bcda1484ac2fccc522f5d8ee70dc989c7541` |
| `codex/grpc/i04-source-credential-carrier` | `dced77ad8cb877ea9aad10f1c6a310ad32a924df` |
| `codex/grpc/x01-integration` | `78329db36f13be30f293f2666720180da8991faa` |
| `codex/integration/main-queue` | `3e263e501341ea1b90049d5343c42db055f3c5ea` |
| `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` |
| `codex/migration/grpc-carrier-rebuild` | `3e263e501341ea1b90049d5343c42db055f3c5ea` |
| `codex/migration/permission-decision-rpc` | `45a7e3065d66f3692493181120ebd08e47ec283f` |
| `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd690af817f8e9bb092fbafb769a31b2e1a6` |
| `codex/trusted-grpc-execution-context/d-freeze` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` |
| `codex/unified-design/security-open-packets` | `634414557f14576c666d98276be80a230130b055` |

### 7.5 Final disposition readiness refresh（只读，未清理）

2026-08-05 以 `main@3e263e501341ea1b90049d5343c42db055f3c5ea` 对全部 Git 资源重新分类：

| 资源分类 | 数量 | 当前处置 |
| --- | ---: | --- |
| root main worktree | 1 | 最终唯一保留目标；当前 clean |
| 非 root、HEAD 已是 main ancestor、clean | 25 | Git 内容已进入 main，但在 ledger 集成、任务证据消费与全局清理 gate 完成前不移除 |
| newly integrated clean worktrees | 1 | GRPC carrier source `3e263e50…`；已独立验收并进入 main，等待 final cleanup manifest |
| retained non-main candidate worktrees | 3 | EXEC-CRYPTO `64ea8660…`、GRPC carrier `dced77ad…`、deferred ActionGrant runtime `ec2b2cf…`；分别等待 dependency-ordered rebuild/验收或持久 deferred disposition |
| superseded/rejected evidence worktrees | 4 | EXEC-CRYPTO rejected `c7ab0d9c…`、API-KEY prototype `755d857a…` 及 AI legacy candidate/acceptance 两个 `6101933d…` worktrees；证据已登记，仍待 ledger 入 main 后的清理 gate |
| Program Control migration ledger worktree | 1 | 当前不在 main；必须先完成 ledger candidate 验收与集成 |
| **worktree total** | **35** | 全部 worktree clean；GRPC candidate 正在 I&V，本轮删除/clean/reset 数为 0 |

branch refs 共 29：22 个 branch HEAD 已是 current main ancestor；7 个非 ancestor refs 已全部分类为 deferred ActionGrant runtime、AI legacy accepted evidence、API-KEY rejected prototype evidence、EXEC-CRYPTO retained candidate、GRPC Asset candidate、原 GRPC carrier candidate与 Program Control migration ledger。不存在未分类 branch ref。

任务处置快照：handoff registry 仍登记 101 个 legacy formal A/* tasks，最终均须在直接证据消费后归档；最近 50 项应用快照可见其中 24 个 legacy A/* tasks，另可见 legacy Global Command 1 个。MIG-D04 导致部分 capability 缺少逐 task IDs，因此当前 thread archive manifest 尚未完整，不能把 101 项声明为已具备逐项归档条件。本轮未唤醒、归档或删除旧 capability 任务；checker 为 0。AI、Permission 与 GRPC rebuild implementation tasks 均已归档，共 3 个 completed migration implementation tasks。EXEC-CRYPTO remediation task `019fd13b-18a3-7be3-bdb9-972c7b8a4c89` active；Program Control、Unified Design 与持久 I&V 继续保留到对应迁移职责结束。

当前全局清理 blocker 共 4 类：GRPC 两个 current-main rebuild/integration 处置、EXEC-CRYPTO retained/rejected 链处置、deferred ActionGrant runtime candidate 的持久 disposition、Program Control ledger 集成与完整 thread archive manifest。API-KEY content-loss blocker 已转为 clean durable evidence ref，不再单独阻塞内容保全；仍随 final manifest 执行统一清理。任一 blocker 未关闭前，所有 worktree/branch 删除数保持 0。

## 8. 本轮验证记录

只读验证覆盖：

- `git rev-parse`：核验 root、Program Control、所有列出的 candidate/decision commit 与关键 branch refs。
- `git worktree list --porcelain`：最新枚举 35 个当前 worktree。
- 每个 worktree 的 `git status --porcelain=v1 --untracked-files=all`：最新核验全部 clean；GRPC rebuild 已形成候选并释放写入状态。
- `git for-each-ref refs/heads/codex/`：最新枚举 29 个当前 `codex/*` branches；逐 ref 与 current main 做 ancestry/divergence 分类。
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

`PERMISSION_REMEDIATION_CANDIDATE_READY` 登记时新增只读验证：

- replacement `45a7e306…` 的 direct parent 为 rejected `96eb67aa…`，base `63441455…` ancestry check exit 0；source worktree clean。
- correction-only diff 精确 8 files，534 insertions / 99 deletions；cumulative diff 精确 42 files，3867 insertions / 58 deletions。
- task handoff 记录 authzVersion 与 eager policy parsing 的 RED→GREEN、安全回归、完整 L1/L3、contract/proto/build/format/lease gates 通过；Program Control 未重复运行测试。
- root main/origin-main 保持 `63441455…` 且 clean；replacement 未集成、未 push。

Permission remediation I&V terminal evidence：

- 结论 `ACCEPTED_AND_INTEGRATED`；correction 8 files / 534+/99- 与 cumulative 42 files / 3867+/58- 的 ancestry、lease、diff check、UTF-8 检查通过。
- 独立运行确认所有 authzVersion 为 opaque SHA-256，绑定可信版本与最终 Code 集；缺失/非法 workload policy 在 constructor/Nest bootstrap 阶段 fail closed。
- root 新鲜 proto/Prisma/Common/Permission build、MIG-D09 定向与 Common contract/Permission 回归通过；generated outputs 保持 ignored。
- I&V 清理了自身 `prisma generate` 造成的 root package/lockfile 非候选副作用，最终三工作面 clean。
- root ff-only merge、唯一一次 push 与远端 SHA 检查通过；main/origin-main/remote 为 `45a7e306…`。

GRPC carrier rebuild I&V terminal evidence：

- 结论 `ACCEPTED_AND_INTEGRATED`；candidate `3e263e50…`、direct parent `45a7e306…`、12 paths / 497+/22-、13-path lease、UTF-8 与 diff check 全部通过。
- 11 个 retained blobs 精确一致；适配后的 public-barrel test 证明 carrier 不可见；`src/common/src/transport/grpc/index.ts` 保持 current-main blob，不公开 transport-private carrier。
- I&V 与 root 均通过 Common/API Gateway build、Common 14 tests、Gateway 8 tests、public-barrel 与 bearer/cache/context/log/audit/legacy security scans。
- root ff-only merge、唯一一次 push 与远端 SHA 检查通过；root/I&V/source、main/origin-main/remote 均为 `3e263e50…` 且 clean。

本轮没有运行 build、test、lint、安全审计或 acceptance；对应结果均仅作为 handoff evidence 保留，后续候选交付必须在精确重建后的 SHA 上重新验证。

## 9. Discrepancy register

| ID | 发现 | 影响 | 当前处置 |
| --- | --- | --- | --- |
| MIG-D01 | GRPC Asset handoff worktree path 当前绑定 carrier branch/HEAD，而不是 Asset branch/candidate | 不得把该 path 误作 Asset writer；后续恢复 Asset 前需显式选择/建立正确工作面 | 保留全部 refs/worktree，不修改 |
| MIG-D02 | API-KEY x01 integration worktree 曾有 2 个未跟踪 domain 文件 | 测试文件与 rejected `b641e0e1…` 完全一致；实现文件 blob `e54f5f1f…` 唯一但使用 ADR-0017 已淘汰的 raw-pepper seam | `CLOSED_FOR_CONTENT_PRESERVATION`：两文件已精确提交为 clean rejected-prototype evidence `755d857a…`；永不进 main，待 final manifest 后清理 ref/worktree |
| MIG-D03 | 当前资源计数为 35 worktrees / 29 `codex/*` branches，高于 handoff 的 29/23 | 差额来自本 Program Control、AI Platform completion、Integration & Verification、Unified Design、Permission decision RPC 与 GRPC carrier rebuild 的隔离工作树/分支，并非旧资源漂移 | 在全局快照显式对账 |
| MIG-D04 | API-KEY、EVENT、EXEC-REVOKE 的具体 source thread IDs 未包含在 compact bundle | 台账只能保留 capability 状态与 Git evidence，不能形成完整 thread-level archive manifest | 不唤醒旧线程；等待后续显式补充或按现有证据形成 closure summary |
| MIG-D05 | GRPC carrier `dced77ad…` 的 parent 为 `65e49258…`，不能直接通过 current-main ff-only gate | 旧 SHA 必须仅作 evidence 并在 current main 重建 | `CLOSED`：rebuilt `3e263e50…` 已独立复验、ff-only 集成并 push；原 candidate 继续保留历史证据 |
| MIG-D06 | Principal Authorization candidate `4f78cec8…` 的 Permission 服务真相源同时要求验证 ExecutionToken 又声明不消费 ExecutionToken | 首个 candidate 被 I&V 拒绝 | `CLOSED`：replacement `fe395fb5…` 已最小修正、复验、集成并 push |
| MIG-D07 | Permission implementation inventory 发现 Common 缺少 principal-authorization INTERNAL Code 注册，且 DELEGATED issuance 缺少 owner upper-bound contract/runtime resolver | 原 Permission lease 不足，直接实现会复制跨域真相或读取 AI registration JSON | `CLOSED`：ActionGrant design `63441455…` 已冻结并集成最小 Common lease 与 owner/consumer boundary；恢复同一 Permission task |
| MIG-D08 | Permission candidate 的 L2 受本地 PostgreSQL `permissiondb` 不可达限制；精确 ESLint 受共享 parser `project`/`projectService` 冲突限制 | 两个 gate 未提供代码级通过证据，但其失败均发生在环境/配置前置 | 保留字面失败证据；交由独立 I&V 复核，不在实现候选中修改数据库环境或共享 ESLint 配置 |
| MIG-D09 | Permission candidate `96eb67aa…` 的最终 DELEGATED/WORKLOAD authzVersion 非 opaque SHA-256，且 workload policy 未在 bootstrap 解析 | 泄露内部版本结构、未绑定最终有效 Code 集；非法/缺失策略直到首个请求才失败 | `CLOSED`：remediation `45a7e306…` 已修正、独立复验、集成并 push |

## 10. 下一阶段入口

GRPC carrier `3e263e50…` 已 `ACCEPTED_AND_INTEGRATED`，本地与远端 main 一致，implementation task 已归档。当前迁移阶段为 `EXEC_CRYPTO_REMEDIATION_ACTIVE`：单一 implementation task `019fd13b-18a3-7be3-bdb9-972c7b8a4c89` 已启动，基于 current main 审计并重建 DG-1 仍要求的最小 Platform Security 路径；retained `64ea8660…` 与 rejected `c7ab0d9c…` 只作 evidence，requested/granted 自比较缺陷不得复用。GRPC Asset 继续等待 EXEC-CRYPTO 前置，AI/ActionGrant runtime 保持 deferred，API-KEY `755d857a…` 不进入 main。删除数保持 0，不启用 checker，也不恢复旧 capability 任务。
