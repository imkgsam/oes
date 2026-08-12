# OES 协同框架退役迁移关闭记录

```yaml
status: MIGRATION_CONTENT_PRESERVED_ARCHIVE_IN_PROGRESS
documentRole: historical-migration-closure-record
governanceFramework: false
frozenDecisionSource: false
sourceThreadId: 019f7325-177e-77a1-9189-b36a10d94c3c
inventoryDate: 2026-08-09
closureDate: 2026-08-09
programControlCandidate: cf9ff6035e5f8581d96246e40aaf32549e6fe042
closureRecord: current-document-commit
retainedEvidenceBranches: 6
unarchivedFormalTasks: 6
```

> 本文只记录旧协同框架退役时的资源、证据、依赖、迁移排序与最终关闭结果，不定义新的治理框架，也不重新定义任何服务、契约或领域真相。稳定设计必须以本文链接的 architecture、ADR、collaboration 与 contract 真相源为准。

## 1. 范围与冻结边界

- 来源：legacy OES Global Command 提交的 `MIGRATION_HANDOFF_BUNDLE`。
- 本阶段在已完成 Git 引用/工作树盘点、候选保全与必要基础能力集成的基础上，形成最终处置清单并准备把本台账集成到 `main`。
- 旧 OES capability collaboration 已退役；本台账不恢复其 Command、A/I、A/V、A/X、checker 或 watchdog 模型。
- 本阶段不再创建或恢复 Unified Design、实现线程或 checker；台账候选通过验证并进入 `main` 前，不归档、删除或清理任何仍在清单中的分支、工作树、提交或线程，也不执行 reset、rebase、force 操作。
- 未通过本地 Git 直接验证的线程状态、历史验收和安全审计结论均标记为“handoff evidence”，不冒充本轮重跑结果。

### 1.1 用户优先级与迁移终态验收条件

- AI Platform 与 ActionGrant 的已冻结设计继续以 architecture、ADR、collaboration、contract 与 feature packet 真相源为准，但其 runtime/feature implementation 延后到核心业务能力完成之后。本迁移阶段不得创建或恢复 AI Platform runtime、Task Assistant runtime、ActionGrant runtime、DelegationGrant runtime、AI tool execution、confirmation UI 或 ActionGrant consumer implementation 任务。
- 已集成的 `task-assistant-collaboration-task.v1` registration 保持 disabled，仅作为设计/契约及迁移证据；不得据此启动 AI feature runtime。
- 本次迁移范围内已完成的非 AI 基础能力与当前后续主线：Permission Decision RPC、GRPC carrier、EXEC-CRYPTO HUMAN/MACHINE foundation、GRPC Asset、SITE recovery 与 Public Entry trusted-gRPC slice 均已验收并集成；全仓 trusted-gRPC cutover 仍是独立后续执行主线，Public Entry 之后按冻结顺序进入下一服务审计（当前候选为 Sales），不启动 AI/ActionGrant runtime。
- 迁移保全是删除前硬 gate：每个旧 worktree、branch、task 必须先归入“已集成 current main”“保留并重建/集成的候选”“已持久登记的 superseded/rejected evidence”或“dirty/untracked 待捕获处置”之一。未分类资源不得 reset、clean、删除或覆盖。
- 最终 Git 验收态只保留最新完整 root `main` worktree；迁移台账必须先进入 `main`，再移除 Program Control migration worktree。所有有用代码、设计、候选、拒绝证据、测试记录和 dirty 内容必须先集成或持久登记。
- 旧 capability-collaboration Command/design/I/R/V/X/checker tasks 在证据消费后归档；已完成的 migration implementation tasks 及时归档。Program Control、Unified Design 与持久 I&V 仅在仍有迁移职责时保留，最终迁移关闭时归档 migration-only control tasks；全程不启用 checker。
- 本节只记录本次迁移的优先级与关闭验收条件，不建立新的治理框架。

## 2. 全局快照

| 项目 | Handoff 状态 | 2026-08-09 本地核验 |
| --- | --- | --- |
| Repository root | `/Users/acehood/Documents/GitHub/oes` | 路径存在；`main` 工作树 clean |
| `main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | AI、Principal Authorization、ActionGrant design、Permission、GRPC carrier、EXEC-CRYPTO HUMAN、完整 MACHINE source-verifier、GRPC Asset token-only cutover、SITE recovery 与本关闭记录均已进入当前文档所在的主线提交 |
| `origin/main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 关闭提交推送后，本地 remote-tracking ref 与 remote `refs/heads/main` 与当前文档提交一致；精确 SHA 由运行时 Git 复核，不在文档内自引用 |
| Legacy formal A/* threads | 101 | handoff历史聚合计数；post-closure exact-ID复核发现19项`archived=0`，SITE、PRINCIPAL-ROLE、EXEC-CRYPTO与GRPC共13项已通过应用接口归档并复核13/13，当前其余6项逐能力审计 |
| Worktrees | 29 | 峰值 39；最终只保留 `/Users/acehood/Documents/GitHub/oes` 根目录 `main` worktree |
| `codex/*` branches | 23 | 峰值 33；27 个已进入 main 的分支已用 `git branch -d` 正常删除，6 个非合并历史证据分支保留 |
| Checker | disabled | handoff evidence；未唤醒旧 checker |
| Root dirty state | clean | clean，暂存区与工作区均无变更 |

关闭集成证据：

- original inventory base：`65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`。
- Program Control candidate：`f4db239e2e80f6d975bcf7d547a3cb8adda7668b`；已无冲突同步 `main@547a0c5d…`，经 root `--ff-only` 集成并推送。
- 原固定 Program Control worktree 与 branch 均已正常移除；未使用 rebase、reset、force 或 bulk clean。
- runtime note：原 Codex 临时 worktree `/Users/acehood/.codex/worktrees/2bb6/oes` 曾被应用回收，分支、提交和迁移台账已恢复并最终进入 `main`，未发生资产丢失。

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

### 4.0 Public Entry — `IMPLEMENTATION_ACCEPTED_AND_INTEGRATED`

- frozen design chain: `e883eeac…` initial packet, `52e6564ea7d23fdb6e5b39bd5fe965710d4fd31e` lease amendment; current main before implementation was `52e6564e…`.
- implementation owner: `019ff519-c105-7630-be96-3af217f385cf`, title `OES Trusted gRPC · Public Entry Implementation Recovery`; fixed worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/public-entry-trusted-grpc`, branch `codex/migration/public-entry-trusted-grpc`.
- rejection/rework chain preserved: `f394c400…` fixed status-specific admission but failed anonymous trace propagation; `03512928…` fixed valid W3C traceparent propagation but retained raw unauthenticated live-smoke; `14e07e8e…` moved smoke to Gateway HTTP but lost raw redirect `Location` and tracestate; final `bda36bffbdc28132872d4bed967adb93c2a92b9e` closed both findings.
- final scope: exact 52-path lease (`45 EXISTING + 7 NEW_TARGET`), 23 RPC mappings, status-specific ChangeShortLinkStatus guard/controller matrix, private carrier barrel, Gateway HTTP-only smoke, and anonymous MACHINE traceparent/tracestate propagation. AI/ActionGrant and unrelated outbound service migrations remained excluded.
- I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556` independently accepted the final candidate: proto/build/focused/fixture/inventory/lease/legacy/hygiene gates all passed; raw ClientProxyFactory/Transport.GRPC/new Metadata smoke scan is zero.
- integration: root preflight confirmed main/local origin/main/remote at `52e6564e…`; `git merge --ff-only bda36bff…` exit 0; final root matrix passed; one `git push origin main` exit 0. Final main/local origin/main/remote = `bda36bff…`, root clean. Source branch/worktree clean and marked `MERGED_WAITING_FOR_USER_CLEANUP`; no deletion in this turn.

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
- Asset current-main caller inventory（2026-08-07）：`asset.proto` 当前恰好 5 个 RPC；production direct callers 只出现在 `api-gateway`。账号头像 upload/bind 是 verified HUMAN/session root 的 `SELF_SERVICE allowDelegated=true`；员工正式照片 upload/bind 是 verified HUMAN/session root 的 `BUSINESS all:[hr.employee.create]`；public URL resolve 是同一 Gateway session root 下的 `INTERNAL all:[asset.internal.avatar.resolve_public_url]` hop。全仓 exact method/generated-client/fixture/Cron/Robot/worker 扫描未发现 direct service 或 pure MACHINE root caller；Auth integration fixture 是 fake server，不建立另一生产 root。冻结但尚未实现的 Site -> Asset Site Media edge 属于 verified multi-hop 且不在本轮五 RPC scope。MACHINE foundation `02457959…` 已集成，因此本轮 caller gate 判定为 `ALL_CALLERS_READY`，但 target 仍为 `LEGACY`：body identity、operator metadata 与未安装完整三-mode server runtime 尚待原子切换。
- Asset legacy candidate disposition：`6973bcda…` 相对 `7500bd66…` 为 35 paths / 1483 insertions / 254 deletions；无 candidate blob 与 current main 完全一致。19 个已存在路径仍停留在旧 base blob，13 个旧新增路径在 current main 不存在，3 个 index/barrel 路径已由 current foundation 演进。旧 Common `TrustedExecutionGuard`/request store 与旧 Gateway exchange/client/module blobs归类为 `SUPERSEDED_IMPLEMENTATION_EVIDENCE`，不得直接恢复；proto field disposition、五 RPC mode mapping、Gateway target-token producer usage、Asset trusted-context派生及 focused tests 归类为 `RETAINED_REBUILD_INTENT`。旧 branch/ref继续保留，但错误绑定 carrier 的 worktree不得作为 writer，也不路由旧 GRPC controller tasks。
- Asset implementation route：唯一新 task `OES Implementation · GRPC Asset Current-Main Rebuild`，thread `019fdb88-0e48-7792-be29-a4c806129ac8`，host `local`；标题已设置并读回，首次即时快照为 `active`，cwd 为 clean root 而非旧/已删除 worktree。`.worktrees` ignore 已命中；固定工作面 `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-asset-rebuild` 与 branch `codex/migration/grpc-asset-rebuild` 已从 exact base `024579598c1293807d3f1cd5e7003aefd8e8fa0a` 创建并核验 clean。稳定 lease 仅覆盖 Asset proto/五 RPC runtime及测试、current Common三-mode guard必要路径、canonical Asset INTERNAL Code登记、Gateway current producer/两个现有Asset adapters及其直接use-case/module/tests；docs、Prisma、Auth/Identity、Site/Site Media、AI/ActionGrant、API-key、deployment及其他服务均受保护。candidate只交既有持久I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556`，不得在实现task merge/push。
- Asset scope-gap terminal：同一 implementation task 完成 root-cause/path audit 后以 `SCOPE_GAP` clean 返回，branch/worktree/HEAD 仍为 `codex/migration/grpc-asset-rebuild@024579598c…`，无 candidate、无保留WIP。根因链为 `GatewayTrustedGrpcExecutionProducer -> TrustedGrpcMetadataProvider -> ExecutionTokenExchangeSourceCredentialCarrier -> verified session credential scope`：`GatewaySessionAuthGuard` 只在 `canActivate()` 局部变量中持有已由 Auth 验证的 raw access token，成功后仅写 `request.user`，而 `GatewayVerifiedSourceCredentialProvider` 只有接口/测试、没有production实现或DI注册。guard返回本身不包裹后续controller/downstream async chain；adapter重读HTTP Authorization、把bearer加入`DownstreamRequestSource`/DTO/普通metadata或`TrustedExecutionContext`均违反冻结的transport-private carrier规则。
- Asset design route：现有真相源唯一冻结了“owner验证成功后才可进入transport-private request scope、bearer不得进入普通request/application/adapter/context/log/audit”，但没有冻结guard到handler的scope owner/lifetime、guard-interceptor/private-vault handoff、成功/异常/取消清理、并发隔离、DI顺序或exact writer paths；TG-5现有描述也未显式租赁session guard/interceptor。该缺口不是普通实现选择，不能由Program Control直接追加lease。已将精确只读选项/推荐/manifest prompt路由到同一 Unified Design `019fcaeb-cb2e-7e92-8c4e-aab7771d7254`，首次即时状态`active`；用户冻结并经既有I&V集成前，同一Asset implementation owner保持idle/clean，不创建replacement或checker。
- Gateway credential lifecycle frozen candidate：`codex/unified-design/security-open-packets@32607c7aa017df9539d2999f97f9b274dbd46a78`，direct parent/current root main `024579598c1293807d3f1cd5e7003aefd8e8fa0a`；Unified Design worktree clean。candidate仅修改3个docs truth sources（Gateway/BFF architecture、gRPC service-trust architecture、trusted-gRPC feature packet），91 insertions / 1 deletion，`git diff-tree --check` exit 0；无code/proto/schema/runtime变更。
- frozen lifecycle：Gateway-private `GatewayVerifiedSourceCredentialVault`以HTTP request object为WeakMap key，仅保存credential kind + Common opaque handle；`GatewaySessionAuthGuard`只能在Auth session验证成功后admit HUMAN_SESSION；`main.ts`显式把`GatewayVerifiedSourceCredentialScopeInterceptor`注册为最外层global interceptor，并在Common accessor scope内执行`next.handle()`实际subscription。later-guard拒绝、complete/error/timeout/cancel/unsubscribe/disconnect均幂等清理；并发request隔离，public/invalid/sessionless无scope，HUMAN_SESSION与EXTERNAL_API不可互换，cache hit仍要求当前已验证request scope；禁止APP_INTERCEPTOR、request-scoped provider和adapter重读Authorization。
- exact future lease：closed 15 tracked paths = 8 EXISTING + 7 NEW_TARGET，仅覆盖Gateway entry/composition、session admission、private vault/scope及focused tests；Common carrier、external API、全部Gateway modules/target adapters、system services、contracts/generated均受保护。本docs candidate已路由既有持久I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556`，单次即时snapshot为active；在exact candidate被接受并集成前，Asset owner `019fdb88-0e48-7792-be29-a4c806129ac8`继续idle/clean at base，不恢复、不创建新task/checker。
- Gateway lifecycle I&V terminal：`ACCEPTED_AND_INTEGRATED`。I&V独立通过exact parent/ancestry、3 docs / 91+/1-、两项diff check、UTF-8 3/3、relative links 10/10、YAML `15 paths = 8 EXISTING + 7 NEW_TARGET`、逐路径state/protected-path与14/14 lifecycle/security语义；root `git merge --ff-only 32607c7a…` exit 0，唯一一次`git push origin main` exit 0。fresh Program Control复核root main、local origin/main与`git ls-remote origin main`均为`32607c7aa017df9539d2999f97f9b274dbd46a78`且root/source clean。
- Asset owner resume：复用同一 task `019fdb88-0e48-7792-be29-a4c806129ac8`，无replacement。固定branch/worktree已ff-only到`32607c7a…`并在resume前clean；随后按“§5.2 closed 15-path lifecycle component + 原登记Asset cutover component”的封闭并集串行执行，任一changed path必须归属其中之一。首次resume snapshot为active，已进入lifecycle TDD RED；普通file/test dependency提示不构成用户审批或设计gap，已明确不得请求普通本地权限。实现task不得merge/push main，clean candidate仍只交既有I&V。
- Asset candidate rejection：`bbcbbc59ea122f4d1adc1ba765159480ee3b0052`（parent `32607c7aa017df9539d2999f97f9b274dbd46a78`，branch `codex/migration/grpc-asset-rebuild`，fixed worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-asset-rebuild`，clean）经既有 I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556` 独立验收后 `REJECTED`，未修改 candidate、未 merge/push。唯一设计缺口是 `TrustedGrpcMetadataProvider` 的 public options 需要 transport-private carrier，而 Common public barrel 必须继续保持 carrier 不可见；推荐由 provider 接受 public accessor、在内部构造 private carrier。该缺口只允许 Unified Design 冻结 exact Common provider/spec lease；其他 cleanup、fail-closed、mode guard 与 Permission generator 问题均回原 Asset owner `019fe09f-b176-7ab2-b15a-b6d00295ce1a` 在同一 worktree/branch 修复。Asset owner 保持 idle/clean，等待设计集成；不创建新 task/checker。
- Common composition seam integration：Unified Design docs-only candidate `190e86d756ac7f46b58918ffdf49727945cc3f00`（parent `32607c7aa017df9539d2999f97f9b274dbd46a78`）仅修改 `docs/architecture/14-grpc-metadata-and-service-trust-architecture.md` 与 `docs/plans/features/trusted-grpc-execution-context.md`，已由既有 I&V 验收、ff-only 集成并 push；root `main` 与 local `origin/main` 均为该 SHA 且 clean。同一 Asset owner `019fe09f-b176-7ab2-b15a-b6d00295ce1a` 已在保留 rejected `bbcbbc59…` 历史的 branch/worktree 上以获准的非破坏性 merge 同步 docs-only main，随后只处理冻结的 Common provider two-seam/撤销 public barrel、lifecycle fail-closed cleanup、guard mode/declaration 与 Permission canonical generator/catalog 返工。仍由原 owner 形成 replacement candidate 并返回持久 I&V；无新 task/checker。
- Asset implementation correction chain：`7e5f393f293db68d65ed242b185505c50a54d2ef` 相对 direct parent `660e913c687a9756930f3641258da411515f9500` 为 17 files / 339+/40-，相对 current-main base `190e86d7…` 累计 40 files / 994+/134-；I&V 以 Critical 拒绝，原因是 `TrustedExecutionGuard` 无条件拒绝冻结契约允许的 `SELF_SERVICE + DELEGATED + allowDelegated:true`。同一 branch/worktree 以 TDD 形成 correction `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d`，direct parent `7e5f393f…`，仅修改 guard implementation/spec 两文件，26+/11-；HUMAN、allowed DELEGATED、disabled DELEGATED、MACHINE、coded HUMAN 矩阵关闭该根因，manifest/lock保持不变。
- Asset final I&V/integration：持久 I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556` 对 `a82e5ea6…` 返回 `ACCEPTED_AND_INTEGRATED`。最终累计范围为 40 files / 1009+/134-；proto gen/lint、Common/Gateway/Permission/Asset builds、Common/Gateway/Permission/Asset focused matrix、public-barrel invisibility、40-path lease、UTF-8、manifest/lock、`.tmp`、legacy/security与diff gates在candidate及root通过。root `git merge --ff-only`恰好一次、`git push origin main`恰好一次；root/main/local origin/main/remote main均为`a82e5ea6…`且clean。
- Asset task/resource closure：implementation owners `019fdb88-0e48-7792-be29-a4c806129ac8`、`019fe09f-b176-7ab2-b15a-b6d00295ce1a`、`019fe1b0-7def-7633-8e96-b4b2a0e9c23d` 与 `019fe1ea-2d97-7743-b040-147fdfb7a223` 已在WIP/candidate无损交接后归档；后两项因不可见approval失效而退役。source `codex/migration/grpc-asset-rebuild@a82e5ea6…` 与 fixed worktree clean，标记 `MERGED_WAITING_FOR_USER_CLEANUP`；迁移final cleanup前保留。持久I&V继续保留为idle可复用任务；全程checker为0。
- Asset execution-owner replacement：原 owner `019fdb88-0e48-7792-be29-a4c806129ac8` 因不可见普通操作审批停滞而按用户批准迁移政策 archived；新 sole writer `019fe09f-b176-7ab2-b15a-b6d00295ce1a` 复用同一固定worktree/branch，无新Git资源。handoff WIP为 `src/services/api-gateway/src/common/guards/gateway-session-auth.guard.spec.ts` RED spec，已保留；该RED因vault admission尚未实现而预期exit 1。两个 setup-only symlink（worktree根`node_modules`、`src/services/api-gateway/node_modules`）已登记为candidate前必须移除的临时依赖链接，不属于tracked WIP；不允许清理其他untracked内容。

### 4.1.1 SITE — `IMPLEMENTATION_ACCEPTED_AND_INTEGRATED`

- recovery audit：current main 的Site surface为Admin 59 RPC与Runtime 7 RPC；Gateway是唯一直接production caller，未发现Cron/Robot/worker root。审计确认Site server尚未完成trusted-gRPC server enforcement、Admin仍携带body identity、Runtime仍需MACHINE ExecutionToken与`SignedSiteContext` HMAC双重验证；Site Media 11 RPC、Asset outbox到Site inbox、Cloudflare R2 precise purge与persistent retry亦未落地，因此实现前先回同一Unified Design冻结唯一真相源与closed lease。
- initial design candidate：`d3e6109b32ca29d6196d68bd024d46190b6e4206`，base `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d`，7 docs / 359+/12-。I&V只发现一项稳定contract自相矛盾：`site-media.md`前文称不定义field number，后文第8节却冻结完整字段号；candidate未集成，其他59+7+11、Code、lease、UTF-8、links与YAML gate均通过。
- replacement design candidate：`c7bda1c487aafc95e356d456a878ba81626c235d`，direct parent `d3e6109b…`；只对`docs/contracts/asset-service/site-media.md`作1+/1-最小修正，明确第8节拥有并冻结11 RPC wire fields/field numbers，proto必须逐项遵循并保留兼容号。累计范围为7 docs / 360+/13-，non-doc paths为0。
- design I&V terminal：`ACCEPTED_AND_INTEGRATED`。Admin 59/59 BUSINESS映射、Runtime 7/7 INTERNAL映射、Site Media 11/11 wire/behavior/Code、13个新增Permission Codes、Admin body identity removal/reservation、MACHINE ET + HMAC双重验证、Asset outbox到Site inbox、R2/CDN precise purge/retry语义、UTF-8 7/7、48 local links、YAML、diff与closed lease全部通过。root ff-only integration与唯一一次main push完成；root/main/local origin/main/remote main均为`c7bda1c4…`且clean。source design worktree clean并标记`MERGED_PRESERVE_UNTIL_FINAL_CLEANUP`。
- implementation gate：`FROZEN_PENDING_IMPLEMENTATION`已关闭为`IMPLEMENTATION_READY`。唯一允许写面是已集成trusted-gRPC feature packet登记的109个逐文件writer paths（54 `EXISTING` + 55 `NEW_TARGET`）；不得扩展为目录ownership，不得触碰AI Platform/ActionGrant runtime。
- required serial batches：Common Permission/proto/generated foundations；Site trusted guard/context与Admin 59 + Runtime 7；Site Media 11与Asset outbox到Site inbox；Gateway adapters/credential composition；Cloudflare R2 precise purge/persistent retry；最后统一batch verification。单一writer不得拆分并发lane，candidate只交既有persistent I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556`，接受前不得merge/push。
- implementation route：唯一task `OES Implementation · SITE Trusted gRPC & Media Recovery`，thread `019fe45e-29c4-7991-9e3d-6c1f2114525e`，host `local`；标题已设置并读回。固定工作面`/Users/acehood/Documents/GitHub/oes/.worktrees/migration/site-trusted-grpc-recovery`、branch `codex/migration/site-trusted-grpc-recovery`从exact main `c7bda1c487aafc95e356d456a878ba81626c235d`建立；全程保持109-path single-writer lease，无子task、并发lane或checker。
- implementation candidate：`547a0c5d55f9a955543779ec584a16e9b05cf453`，direct parent `55e474ff0fc1dff37791fe7ec04780cb51672134`，相对冻结base `c7bda1c4…`累计86 paths / 3139+/422-，全部位于109-path closed lease；source branch/worktree clean。完成Site Admin 59 BUSINESS ET、Runtime 7 INTERNAL MACHINE ET与独立`SignedSiteContext`、Site Media 11 RPC、Gateway Media、Site到Asset multi-hop、R2/storage/purge、transactional outbox/NATS/Site inbox+DLQ、migrations与冻结测试。
- implementation/I&V verification：proto generate/lint、Prisma、四服务build与signature inventory通过；Site L1 382、Site L3 83、Gateway focused 110、Asset full 43、Permission focused 10、Common contracts 5全部通过。I&V返回`ACCEPTED_AND_INTEGRATED`，root/main/local origin/main/remote main均为`547a0c5d…`且root clean。
- resource state：SITE source `codex/migration/site-trusted-grpc-recovery@547a0c5d…` clean，标记`MERGED_WAITING_FOR_USER_CLEANUP`；本轮不删除worktree/branch，不启动后续implementation。AI Platform/ActionGrant runtime继续deferred。

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

### 4.3 EXEC-CRYPTO — `MACHINE_ACCEPTED_AND_INTEGRATED`

- source threads：control `019fc601-1f32-7912-a9a5-849cf22cfd23`；design `019fa287-01a8-7340-8fb3-b56df8652dcd`；I06 `019fc608-c9cf-7a82-a91a-0b9aa6d0cd5f`。
- active retained writer：`/Users/acehood/.codex/worktrees/44ef/oes`；branch `codex/exec-crypto/i06-auth-tg2-remediation`；HEAD `64ea8660687bbeb24349d11bcaed6f63d2373c4b`；clean。
- rejected candidate：`c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc`；commit 保留。拒绝原因来自 handoff：权限请求集合被复制为授权集合并进行自比较，形成恒真 privilege gate。
- authority-upper-bound design branch：`codex/exec-crypto/d-sts-authority-upper-bound@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；无替代候选。
- dependencies：GRPC carrier 与 Permission decision RPC 已集成，HUMAN foundation 前置满足并已交付。retained `64ea8660…` 只保留 merge checkpoint evidence；后续 MACHINE/workload completion 必须继续基于届时 current main 建立新精确候选，不能直接集成旧 SHA。
- root-cause guard：`64ea8660…` 是以 rejected `c7ab0d9c…` 与旧 main 为双 parent 的 merge checkpoint，不能直接复制历史或沿用 rejected privilege gate。requested Codes 只能是请求；current Permission Decision RPC 的 granted output 是 authoritative upper bound，必须检查 `requested ⊆ granted` 并 fail closed。
- implementation task：`OES Implementation · EXEC-CRYPTO Remediation`，thread `019fd13b-18a3-7be3-bdb9-972c7b8a4c89`，host `local`；标题已设置并读回，首次即时快照为 active，cwd 为只读 root，不是旧 worktree。
- fixed worktree：`/Users/acehood/Documents/GitHub/oes/.worktrees/migration/exec-crypto-remediation`；branch `codex/migration/exec-crypto-remediation`；base `3e263e501341ea1b90049d5343c42db055f3c5ea`。candidate 已提交、验收并集成，source worktree clean。
- provisional maximum lease：只允许 retained diff 中 9 个 `src/services/system/auth-service/**` execution-token exchange/context bootstrap/verified-context provider/token-module implementation 与定向 spec 路径；任务必须在写入前完成 exact diff/root-cause/path ownership audit并进一步缩窄。4 个 `docs/**` truth sources 只读，任何新增路径或公共契约变更均返回 Program Control/Unified Design，不自行扩 scope。
- protected paths：ActionGrant runtime、API-key provider、AI、GRPC Asset、Permission、Common public API、其他 Auth 能力与业务 feature 全部禁止写入。current GRPC carrier、mTLS/workload binding 与 frozen ExecutionToken claims/signing/rotation 语义必须保持。
- execution gate：TDD 必须覆盖 requested/granted 不同集合的真实回归；整体实现后一次性批量 build/tests/security/path/diff checks；只形成 clean local candidate，不 merge/push。
- candidate：`1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`，direct parent/current main `3e263e501341ea1b90049d5343c42db055f3c5ea`；精确 8 个 Auth paths、1031 insertions / 159 deletions，位于 9-path provisional maximum lease；无 proto/docs/Common/Permission/Gateway/deployment/database/schema 变化。
- root-cause correction：删除 legacy operator-role authority 与 requested→granted copying/self-comparison；signer 只接受 Permission authoritative decision，并要求完整 principal/scope/tenant/org/audience/request binding、`requested ⊆ granted` 且 requested 中无 denied Code。missing/partial/mismatch/mixed-kind 在签名前 fail closed；BUSINESS 走 `ResolvePrincipalAuthorization`，INTERNAL 走 `ResolveWorkloadIssuance`。
- preserved semantics：GRPC carrier、mTLS/SPIFFE/cert binding 与 frozen ES256/JWS/rotation/`authz_version` 保持；新增 Auth startup dependency `AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION`。
- implementation evidence：RED 复现旧 false authorization；Common/Auth build exit 0；4 focused suites / 12 tests passed；Prettier、diff、UTF-8、security 与 path checks passed。
- slice boundary：source verifier 当前只覆盖 active HUMAN session；MACHINE/workload 是潜在后续 foundation，DELEGATED/API-key/AI/ActionGrant 明确 deferred/out of scope。candidate 不得声明 full TG-2 completion。
- I&V route：既有持久 task `019fcaf2-ca7b-7140-b46d-b6cacae58556` 派发前 idle，已接收 exact candidate；即时快照为 active，candidate/parent/ancestry、8 paths / 1031+/159-、9-path maximum lease、UTF-8 与 diff check 已独立通过，root integration lease 尚未授予。I&V 必须继续判定 HUMAN-only slice 是否满足 DG-1 的 coherent/fail-closed/可独立集成 gate；若 MACHINE 必须原子完成或候选夸大 TG-2 完成度，则 reject。不创建新 acceptance task。
- I&V terminal：`ACCEPTED_AND_INTEGRATED`，明确仅为 HUMAN-only ExecutionToken foundation，不代表 full TG-2/MACHINE 完成。candidate/parent/8 paths/lease/UTF-8/diff/protected-path gates 全部通过。
- independent security evidence：legacy requested→granted/operator authority hits 为 0；10/10 binding/deny/missing conditions 在 sign 前拒绝，mixed-kind 在 Permission/signing 前拒绝；INTERNAL 精确走 `ResolveWorkloadIssuance` 且无 bearer；缺少 `AUTH_PERMISSION_WORKLOAD_ISSUANCE_POLICY_VERSION` 时启动 fail closed。
- verification：I&V 与 root 均通过 Common/Auth build、4 suites / 12 tests、Prettier、binding/mixed-kind/INTERNAL/startup probes 与 security scans。首次 Auth build 因 I&V 缺 ignored Prisma generated input exit 1；生成该 ignored input 后重跑 exit 0，候选未修改。source-credential 变量名扫描误报已改为 application input/resolver 区段检查并得到 0 hits。
- final integration evidence：root ff-only merge、root fresh verification 与唯一一次 main push 通过；root/I&V/source、local main、origin/main 与 `ls-remote main` 均为 `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` 且 clean。
- task archive：implementation task `019fd13b-18a3-7be3-bdb9-972c7b8a4c89` 已在 terminal 证据消费后归档。
- MACHINE boundary：current verifier 仅接受 active HUMAN session/access credential；MACHINE、DELEGATED、API-key、AI、ActionGrant 与多跳 subject ExecutionToken fail closed。MACHINE/workload source-verifier completion 仍是 GRPC Asset `ALL_CALLERS_READY`、token-only server cutover与完整服务迁移的前置。
- next route：下一非 AI foundation 是 MACHINE/workload source-verifier completion；完成并验收前不创建 GRPC Asset rebuild task。
- MACHINE implementation task：`OES Implementation · MACHINE Workload Source Verifier`，thread `019fd240-7062-76c3-a183-56e363e8fee4`，host `local`；标题已设置并读回，首次即时快照为 active，cwd 为只读 root且正在先读冻结真相源。
- MACHINE fixed worktree：`/Users/acehood/Documents/GitHub/oes/.worktrees/migration/machine-workload-source-verifier`；branch `codex/migration/machine-workload-source-verifier`；HEAD/base `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`；clean，无代码或 candidate。
- MACHINE provisional lease：仅允许 Auth/Platform Security 内与 verified mTLS/SPIFFE workload source identity、execution-token source verifier、signing boundary 及其定向 tests 直接相关的最小路径；任务必须在写入前完成 exact ownership audit并登记最终路径。proto/docs/Common/Permission、HUMAN slice与其他 Auth 能力默认受保护。
- MACHINE design-gap gate：若 frozen DG-1 sources 不能唯一决定 workload source credential 与 verified workload identity 的绑定，或 subject/audience 表示方式，必须返回一个精确 gap 给 Unified Design，不得自行发明 contract、claim、proto 或公共抽象。
- MACHINE security gate：requested INTERNAL Codes 只是请求，必须为 authoritative `ResolveWorkloadIssuance` granted subset；mismatch、unknown workload、requested-not-granted、tenant/org/scope/audience/cert-binding failures 均须在 signer 前 fail closed。DELEGATED、API-key、AI、ActionGrant、GRPC Asset、业务 feature与 public external opening禁止写入。
- MACHINE implementation terminal：task `019fd240-7062-76c3-a183-56e363e8fee4` 返回 `DESIGN_GAP` 并 idle；未写 production code、未形成 candidate。
- verified missing boundary：尚未冻结 MACHINE source credential owner/profile/verifier 与 expiry/revocation；credential 到 active Machine Principal、scope、tenant/org、subject 的唯一映射；与 `VerifiedWorkloadIdentity.spiffeId`/leaf certificate thumbprint 的精确绑定及 mismatch categories；以及 Auth-local 或 Identity-owned resolution 与对应 controlled contract/proto/Common lease。
- exclusion evidence：当前 STS 只有 HUMAN session verifier；Common carrier 只是 verified-value wrapper；API-key-root mapping 是 API-key 专用且硬编码 permissions；Identity 现有 resolve RPC 明确只用于 external API-key exchange，均不能作为未冻结 MACHINE contract 直接复用。
- Unified Design route：复用同一 `OES Unified Design` task `019fcaeb-cb2e-7e92-8c4e-aab7771d7254`，派发前 idle、即时快照 active。只读比较 Auth-local 与 Identity-owned machine resolution、expiry/revocation、binding、contract/proto/Common lease，并先向用户给出选项与单一推荐；用户冻结前不得写文档、恢复实现或推进 GRPC Asset。
- frozen design candidate：`codex/unified-design/security-open-packets@d7b935fb434f394ba5af9bee0a3c415b50c26ee1`，direct parent/current main `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`；source worktree clean，未 merge/push；精确 13 docs、300 insertions / 32 deletions，`git diff-tree --check` exit 0，非 docs/proto/schema/runtime路径为0。
- frozen ownership：Auth owns short-lived `MachineWorkloadSourceCredential`（最长15分钟、current-certificate bound、无 refresh token）；Identity owns `MachineWorkloadBinding` 与 controlled `ResolveMachinePrincipalForAuth` design；新增 `identity.internal.machine_principal.resolve` INTERNAL Code；Permission only authorizes，不解析 machine credential 或 SPIFFE mapping；`ResolveWorkloadIssuance` 保持唯一 mTLS-only bootstrap；internal MACHINE 与 external API-key paths 完全分离。
- Asset condition：只有 static inventory 证明不存在 pure MACHINE root caller 时，Asset 才可独立进入 `ALL_CALLERS_READY`；否则必须等待 MACHINE runtime candidate 验收/集成。
- design I&V route：exact candidate 已派发既有持久 task `019fcaf2-ca7b-7140-b46d-b6cacae58556`，即时快照 active；独立检查13文档的 owner/contract/expiry/revocation/binding/API-key exclusion一致性，并只在 main/origin未漂移时 ff-only集成与一次 main push。不创建新 acceptance task。
- design I&V terminal：`DESIGN_GAP — RETURN_TO_UNIFIED_DESIGN`。结构、13 docs / 300+/32-、非 docs/runtime 0、diff check、UTF-8 13/13、146 local links 与主要 frozen ownership semantics 全部通过；未取得 root integration lease，未 fetch/merge/push。
- status inconsistency：`docs/contracts/identity-service/README.md` 把第一方内部 MACHINE resolution列为“截至当前已开放”；`docs/architecture/07-permission-code-source.md` 把 `ResolveMachinePrincipalForAuth` 写成“既有”，但同候选又明确只冻结黑盒语义、Code属于未来最小lease。tracked tree证明resolver proto/runtime、Code registration与Machine credential runtime当前均不存在。
- replacement route：同一 Unified Design task与同一branch/worktree保留rejected `d7b935fb…`，从其上形成最小replacement，只把未来能力统一标为 `FROZEN_PENDING_IMPLEMENTATION` 或等价状态。不得改变已冻结ownership/binding/API-key separation，不添加code/proto/schema/runtime，不恢复MACHINE implementation或GRPC Asset。
- replacement candidate：`bbb7338fea7c7a06aab7a45baff39665c8248197`，direct parent `d7b935fb434f394ba5af9bee0a3c415b50c26ee1`，base/current main `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`；correction-only 13 docs / 27+/16-，cumulative 13 docs / 311+/32-，non-docs 0，source clean。
- replacement semantics：13文档统一 `FROZEN_PENDING_IMPLEMENTATION`；Identity README不再列为当前开放，resolver明确待新增；credential runtime、binding persistence、resolver proto/runtime与Common Code registration均明确未实现。frozen owner/security semantics不变。
- replacement I&V route：已复用同一持久 task独立复验correction/cumulative/status/tracked-tree；仅在main/origin未漂移时ff-only集成与一次push。不创建新任务。
- replacement I&V terminal：第二次 `DESIGN_GAP — RETURN_TO_UNIFIED_DESIGN`。correction/cumulative结构、13 docs、UTF-8、146 links、状态修复、tracked-tree零命中与六组frozen语义通过；未fetch/merge/push。
- exact lease gap：完整MACHINE implementation lease仍是“Auth Prisma/tests/credential paths、Identity Machine Principal/binding paths”等描述性范围，且contract不冻结runtime class/schema。当前仅Permission catalog与两个Common Identity Code文件达到精确路径；I&V不得自行设计其他Auth/Identity/proto/Prisma/test/generated-input paths。
- exact lease route：同一 Unified Design task只读inventory当前repo结构，并在不冻结字段/class/实现细节的前提下，形成完整、最小、逐文件的implementation lease manifest；generated outputs须区分输入与ignored/tracked验证，不作为writer ownership。保留前两次candidate，不恢复implementation或GRPC Asset。
- exact lease candidate：`codex/unified-design/security-open-packets@22ed9ee468d0744b10dec4536856f29c10d3552f`，direct parent `bbb7338fea7c7a06aab7a45baff39665c8248197`，base/current main `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65`；correction-only 精确 3 docs / 174 insertions / 5 deletions，cumulative 精确 13 docs / 480 insertions / 32 deletions；source worktree clean，无 code/proto/schema/runtime 实际变更。
- exact lease manifest：封闭登记 64 个 tracked writer paths（Common contracts 3、Auth 29、Identity 25、Permission/Common Code 7）；27 个 `EXISTING` 均存在且 tracked，37 个固定单一文件名的 `NEW_TARGET` 均不存在、未 tracked、未 ignored。未列 tracked path 一律 deny-by-default。
- derived/protected boundaries：7 个 ignored derived outputs（5 个 proto generated outputs、Auth/Identity 两个 Prisma generated roots）不属于 writer ownership；16 个重点 protected examples 覆盖 HUMAN session 3、external API Key 6、GRPC Asset 3、AI/ActionGrant 4；5 个共享文件带精确修改限制。Permission Code source/generator 与 tracked Common outputs 已明确分离。
- exact lease evidence：correction/cumulative diff check、YAML manifest parse、64-path状态、generated-output分类、protected/shared-path检查、UTF-8 13/13、local links 146/146、`FROZEN_PENDING_IMPLEMENTATION` 13/13、tracked source中resolver/Code/credential/binding零命中、ancestry/HEAD/parent/clean-state checks 均 exit 0；manifest 登记 generation/build/focused-test/ownership 共 14 条未来批量验证命令。
- exact lease I&V route：只复用持久 task `019fcaf2-ca7b-7140-b46d-b6cacae58556` 验收 exact candidate；独立复核第三次 correction、累计13文档、64-path manifest、27/37状态、7个derived outputs、protected/shared restrictions、冻结语义与当前 tracked-tree。仅当 root main/origin-main 仍等于 base 且全部验收通过，才允许 ff-only 集成并 push main 一次；验收前不恢复 MACHINE implementation 或 GRPC Asset。
- exact lease I&V terminal：`ACCEPTED_AND_INTEGRATED`。独立验收确认 correction 3 docs / 174+/5-、cumulative 13 docs / 480+/32-、非docs/runtime 0、UTF-8 13/13、links 146/146 与双层 diff check；Ruby/Psych 解析 manifest 通过，64=3+29+25+7、27 `EXISTING` 与37 `NEW_TARGET` 状态全部匹配，7 derived outputs、16 protected examples、5 shared restrictions、14 future gates 与 tracked-source zero-hit 均通过。Node `yaml` 模块缺失仅作环境记录，未安装依赖，替代解析 exit 0。
- final integration evidence：fetch、root `git merge --ff-only 22ed9ee4…`、fresh root docs/lease checks 与唯一一次 `git push origin main` 均 exit 0；root/local `origin/main`/`ls-remote main` 均为 `22ed9ee468d0744b10dec4536856f29c10d3552f` 且 root/source/I&V clean。I&V 未运行未来 MACHINE runtime tests，未恢复实现或 GRPC Asset。
- implementation resume：已恢复同一 task `019fd240-7062-76c3-a183-56e363e8fee4`，host `local`，即时快照 active；必须在原 worktree/branch 先从 `1ca24f41…` ff-only 同步 `22ed9ee4…`，完整审计 integrated manifest 后才把 lease 扩展为精确64个tracked writer paths。7个ignored派生产物不属于ownership；任何未列tracked path、字段/结构设计缺口或共享限制冲突均返回同一 Unified Design，不自行扩scope。
- resumed implementation terminal：`DESIGN_GAP`，task 已 idle。原 worktree/branch 已 ff-only 同步 `22ed9ee468d0744b10dec4536856f29c10d3552f`；64-path/27 `EXISTING`/37 `NEW_TARGET`/7 derived outputs/16 protected examples/5 shared restrictions 审计通过，但未修改 production code 或 tests、未形成 candidate，worktree 与 root/origin-main 均 clean。
- wire/schema gap：已集成 exact lease 只冻结 path ownership，明确不定义 implementation-defining public/persistence semantics。仍缺 `machine_workload_source_credential.proto` 的 service/RPC、request/response fields、field numbers 与 issuance/revocation caller trust；`IdentityQueryService.ResolveMachinePrincipalForAuth` 的 principal/binding/version/SPIFFE request/response fields、field numbers 与 safe denial；Auth credential 与 Identity binding Prisma PK/FK、unique/lifecycle/revocation/audit persistence；controlled enrollment/reissuance/revocation 的 authorized caller、protected transport 与既有 Auth audit sink/path。当前 lease 未登记额外 tracked audit path。
- wire/schema design route：复用同一 Unified Design task `019fcaeb-cb2e-7e92-8c4e-aab7771d7254`，只读完整分析现有 proto numbering/style、Auth/Identity Prisma conventions、audit infrastructure 与 enrollment ownership；因涉及公共契约字段和持久化语义，必须先向用户给出一个紧凑、连贯的推荐 packet，用户明确冻结前不得写文档。冻结后才更新唯一真相源、feature packet 与 exact lease manifest，并路由同一 I&V。
- wire/schema frozen candidate：`codex/unified-design/security-open-packets@43c3c0ad33b0454d92aef0bbcdfd088a6d2fb05d`，direct parent/current main `22ed9ee468d0744b10dec4536856f29c10d3552f`；source worktree clean，未 merge/push；精确 9 docs、200 insertions / 14 deletions，`git diff-tree --check` exit 0，非 docs/code/proto/schema/runtime 实际变更为0。
- frozen wire packet：冻结 Machine Principal ↔ Worker SPIFFE binding；Auth最长15分钟 source credential 的 issuance/reissuance/revocation 与 dedicated JWS profile；2个Auth RPC与3个Identity RPC的精确message fields/field numbers、caller trust与safe denial；Auth credential/Identity binding Prisma PK/FK/unique/version/status/revocation及同事务audit规则；Identity binding manage与Auth credential revoke两个management Permission Codes。
- lease expansion：exact tracked writer lease 从64扩展为66 paths；新增路径只用于已冻结 wire/schema/audit packet，既有 deny-by-default、ignored generated outputs、protected examples与shared-file restrictions继续有效。external API Key、Principal Authorization不变；AI/ActionGrant runtime继续deferred。
- wire/schema I&V route：只复用持久 task `019fcaf2-ca7b-7140-b46d-b6cacae58556` 独立验收 candidate/parent、9-doc exact diff、字段编号/RPC计数、Prisma与transactional audit语义、Permission Codes、64→66 lease增量及保护边界；仅在root/local origin/remote main仍等于parent且全部通过时ff-only集成并push main一次。验收前不恢复implementation或GRPC Asset。
- wire/schema I&V terminal：`DESIGN_GAP — RETURN_TO_UNIFIED_DESIGN`。candidate object/parent/ancestry、9 docs / 200+/14-、非docs 0、diff check、UTF-8 9/9、links 92/92、2 Auth RPC / 3 Identity RPC、全部message field-number tables且collision=0、JWS/Prisma/transactional audit/Permission semantics，以及66-path YAML（3+29+25+9；29 `EXISTING` / 37 `NEW_TARGET`）均通过；未取得root lease，未fetch/merge/push。
- acceptance-command gap：66-path lease含13个 `NEW_TARGET *.spec.ts`，冻结 focused commands 仅执行10个。未覆盖 `src/common/src/contracts/auth_service/machine_workload_source_credential.contract.spec.ts`、`src/services/system/identity-service/test/l1/machine-workload-binding-management.handlers.spec.ts` 与 `src/services/system/identity-service/test/l1/machine-workload-binding-management.grpc-controller.spec.ts`；`proto:lint`只做Buf lint，Common build只做`tsc -b`，均不执行这些断言。
- correction route：复用同一 Unified Design task，保留 `43c3c0ad…` 为DESIGN_GAP证据，只对 feature packet/exact lease 的 frozen acceptance commands 做最小修正，确保所有13个新增spec都由字面命令执行。不得改wire/schema/Prisma/audit/Permission语义，不添加code/proto/schema/runtime，不恢复MACHINE implementation或GRPC Asset；形成replacement后仍走同一I&V。
- acceptance-command replacement：`codex/unified-design/security-open-packets@7cb5c4d3dae6900c345f688dadad2b7822ac8278`，direct parent `43c3c0ad33b0454d92aef0bbcdfd088a6d2fb05d`，base/current main `22ed9ee468d0744b10dec4536856f29c10d3552f`；correction-only 1 doc / 2 insertions / 1 deletion，cumulative 9 docs / 202 insertions / 15 deletions，source clean。
- replacement evidence：只修改 `docs/plans/features/trusted-grpc-execution-context.md` 的两条focused commands；新增Common contract spec直接Jest命令并把两个Identity management specs加入定向Jest。correction/cumulative diff check、YAML、UTF-8 9/9、links 92/92、66-path lease与13/13 NEW_TARGET spec command coverage通过；wire/JWS/Prisma/audit/Permission语义未变，非docs 0。
- replacement I&V route：仍复用同一持久I&V复验原9-doc packet与最小correction，重点证明13/13新增spec均会执行且命令可运行；仅在root/local origin/remote main仍等于base时ff-only集成replacement并push一次。验收前implementation继续idle/clean。
- replacement I&V terminal：`ACCEPTED_AND_INTEGRATED`。correction 1 doc / 2+/1-、cumulative 9 docs / 202+/15-、diff/UTF-8 9/9/links 92/92、2 Auth RPC / 3 Identity RPC、field collisions=0、JWS/Prisma/transactional audit、66 writers（3+29+25+9；29 `EXISTING`/37 `NEW_TARGET`）、generated/protected/shared boundaries与tracked-source zero-hit均通过。
- coverage closure：focused commands=4、全部frozen commands=15、13个NEW_TARGET specs覆盖13/13。Common命令形态用现有同类spec验证1 suite/2 tests pass；Identity过滤命令形态1 suite/4 tests pass。source docs worktree因无Jest binary首次代理exit 254，仅作依赖环境证据；在依赖完整root相同命令形态exit 0，未来尚不存在的MACHINE tests未运行。
- final integration evidence：fetch、root ff-only merge、fresh root cumulative docs/wire/YAML/coverage checks与唯一一次main push通过；root/local `origin/main`/remote main均为 `7cb5c4d3dae6900c345f688dadad2b7822ac8278` 且root/source clean。
- implementation resume route：恢复同一 task `019fd240-7062-76c3-a183-56e363e8fee4`，先在原clean worktree/branch从`22ed9ee4…` ff-only同步`7cb5c4d3…`，再完整复核66-path lease与frozen wire/schema/audit packet；仅在复核一致后执行实现、TDD及15条frozen commands，不扩path/语义。
- execution-owner replacement：旧 task `019fd240-7062-76c3-a183-56e363e8fee4` 因delivery mode反复在1–2文件后结束并产生禁止的placeholder handlers，已由用户明确retire/archive；不得恢复。新唯一owner为 `OES Implementation · MACHINE Source Verifier Completion`，thread `019fdb21-4731-7341-86d6-c24a593b9fc1`，host `local`；即时快照active，继续复用同一fixed worktree/branch/HEAD与未提交WIP，不创建replacement Git面。
- WIP preservation snapshot：fixed worktree `codex/migration/machine-workload-source-verifier@7cb5c4d3dae6900c345f688dadad2b7822ac8278` 当前23个file entries（3 tracked modified、20 untracked），其中21个路径落在66-path lease。未reset/clean/delete/stage/commit；root main保持clean/read-only。
- out-of-lease WIP：两份误落根级 `src/infrastructure/repositories/prisma/` 的文件禁止进入candidate：`prisma.machine-workload-binding.repository.ts`（565 bytes，SHA-256 `023d511b72397c5cae9faf43efe7eb943242b62e9cdb56c5068aec7906cc845d`）与对应spec（643 bytes，SHA-256 `1d39838b7b43f3b9f52d798b6679bf856167543a4e34075741a9100c32843ab7`）。新owner必须先审阅并把有用语义正式重建到已租赁Identity service路径，再显式处置误路径；不得以`git clean`或无记录删除造成内容丢失。
- placeholder rework gate：Enroll/Disable直接回显input、Resolve固定`allowed:false`及仅`findById`的repository abstraction均不得进入candidate。新owner已被要求先以真实repository fake完成L1 RED，重写idempotent enroll、optimistic/irreversible disable、active exact resolve与冻结reason codes，再完成L1/L2 GREEN及后续Auth/Permission/全量15-command gates。
- replacement-owner implementation terminal：新owner `019fdb21-4731-7341-86d6-c24a593b9fc1` 返回一个精确 `DESIGN_GAP` 并idle，未形成candidate。fixed worktree仍在`7cb5c4d3…`，保留51-file WIP；root/main/origin-main同SHA且clean。已通过Identity L1/L2、Permission focused、Auth build及source service/repository focused tests。
- leaf-notAfter root cause：冻结Auth issuance要求source credential `exp <= current mTLS leaf certificate.notAfter`并持久化leaf notAfter，且Issue proto禁止caller提供certificate/lifetime facts；但Common `GrpcWorkloadIdentityProvider.getVerifiedWorkloadIdentity(call)`当前只返回`spiffeId`与`certificateThumbprint`。`GrpcJsVerifiedPeerAdapter`已把transport-verified leaf DER放入`TransportVerifiedGrpcPeer`，可信事实存在但在provider层被丢弃，Auth不能安全补值。
- recommended minimal design amendment：只评估/冻结 `src/common/src/transport/grpc/grpc-workload-identity.provider.ts` 与对应 `.spec.ts` 两个Common路径。provider从同一verified certificate DER用`X509Certificate`派生`certificateNotAfter: Date`，parse/validTo非法或notAfter不在未来时fail closed；返回保留既有identity字段的structural subtype，不扩大generic `VerifiedWorkloadIdentity`。Auth继续取`min(now+15m, certificateNotAfter)`并拒绝非正lifetime；不得接受metadata/request/environment notAfter。
- design route：同一Unified Design task `019fcaeb-cb2e-7e92-8c4e-aab7771d7254` active，只形成docs-only candidate并更新truth sources/feature packet exact lease；root只读，不得自行integrate/push。candidate仍由持久I&V验收集成。当前implementation owner保持idle，WIP不得修改、reset、clean、删除或提交，直到design集成。
- leaf-notAfter design candidate：`codex/unified-design/security-open-packets@8e4ecff16479d8d15db469a469bf2c15acc6e0b5`，direct parent/current main `7cb5c4d3dae6900c345f688dadad2b7822ac8278`；source clean，未merge/push；精确4 docs / 16 insertions / 2 deletions，`git diff-tree --check` exit 0，无code/proto/schema/runtime实际变更。
- frozen amendment：Common provider必须从同一transport-verified certificate DER派生可信`certificateNotAfter`，invalid DER/validTo或expired leaf在resolution时fail closed；保持现有SPIFFE/thumbprint行为与generic identity contract稳定。Auth MACHINE issuance仅消费该transport-derived `Date`并保持15分钟/leaf upper bound，caller仍不得输入certificate/lifetime。
- lease expansion：tracked writer manifest从66扩展为68 paths：新增`commonTrustedTransport=2`，其余Common contracts 3、Auth 29、Identity 25、Permission/Common Code 9不变；总计31 `EXISTING` / 37 `NEW_TARGET`。新增路径精确为provider与provider spec，未授权目录级Common改动。
- I&V route：candidate已路由同一持久task `019fcaf2-ca7b-7140-b46d-b6cacae58556`，即时快照active；独立复核4-doc exact diff、trusted DER/notAfter derivation、structural subtype边界、fail-closed语义与68-path manifest。只有root/local origin/remote main仍等于parent且验收通过时才ff-only集成并push一次；implementation owner继续idle。
- I&V acceptance：`ACCEPTED`。candidate/parent/ancestry、4 docs / 16+/2-、非docs 0、diff check、UTF-8 4/4、links 52/52、6组semantic checks、68-path manifest（31 `EXISTING` / 37 `NEW_TARGET`）及Common provider baseline 2 tests均通过；同DER派生、不可由caller覆盖、invalid/expired fail closed、generic identity稳定与Auth min-lifetime语义一致。
- final integration evidence：Program Control随后向同一I&V授予短时integration lease；root ff-only merge与main push成功。root/local `origin/main`均为`8e4ecff16479d8d15db469a469bf2c15acc6e0b5`且clean。
- implementation resume：current owner `019fdb21-4731-7341-86d6-c24a593b9fc1`恢复；同一dirty worktree/branch已在保留51-file WIP情况下ff-only同步到`8e4ecff1…`，未reset/rebase/clean。后续只新增已租赁Common provider/spec实现，接通Auth controller/composition，完成全部68-path/15-command验证并形成clean candidate。
- first implementation candidate：`codex/migration/machine-workload-source-verifier@45fbb312002a2060d28aed39b6bdf54c76654f2c`，direct parent/current main `8e4ecff16479d8d15db469a469bf2c15acc6e0b5`；source clean，精确55 files / 1252 insertions / 21 deletions，位于68-path lease内，diff check/UTF-8/protected/ignored-generated gates通过。
- candidate verification evidence：Common/Auth/Identity/Permission build与proto lint exit 0；Common provider 3 tests、Common MACHINE contract 2 tests、Identity 6 suites/10 tests、Permission 3 suites/9 tests通过。完整Auth candidate为3 failed/112 passed、346/349，base为3 failed/110 passed、344/347；失败集合相同，仅为trusted-device、step-up MFA `scopeLevel` expectation、account-lifecycle DI missing password repository，候选未新增baseline failure。
- I&V terminal：`REJECTED`，未修改candidate、未merge/push。Critical：(1) MACHINE verifier只有定义，未接入ExecutionToken exchange；且未每次刷新Identity principal/binding及scope/tenant/org/lifecycle facts；(2) revoke RPC缺少mTLS、target-audience ExecutionToken、operator context、`auth.machine_workload_source_credential.revoke` gate与reason allowlist；(3) Auth repository先插入带audit FK的credential后创建audit row，立即FK会失败。
- important rework：Auth/Identity migration缺少每binding/principal+SPIFFE最多一个ACTIVE的partial uniqueness或等价约束，Auth缺predecessor FK且updateMany+create并发不安全；JWS硬编码issuer且verifier未严格检查issuer/iat/nbf/max TTL/kid/exp/profileVersion与persisted facts；REISSUED/VERIFIED/REJECTED及Identity resolver allow/deny local audit不完整。
- missing frozen tests：68-path manifest中4个NEW_TARGET spec未交付：issue handler spec、revoke handler spec、MACHINE verifier spec与MACHINE gRPC controller spec。candidate path validator记录`missing_new_targets=4`。
- rework route：完整I&V报告已返回同一current owner `019fdb21-4731-7341-86d6-c24a593b9fc1`；即时快照active，继续在同一branch/worktree以`45fbb312…`为保留拒绝证据追加修复提交，不重写历史、不创建新Git面。必须TDD覆盖exchange/Identity refresh、revoke authz、真实PostgreSQL FK/partial uniqueness/predecessor/concurrency、strict JWS/audit及4个missing specs，再形成replacement candidate。
- corrected candidate：`codex/migration/machine-workload-source-verifier@b6cd70dd70d0edf1161f3fcb1584ff3fa7a8d3df`，direct parent `407f3d4e0bedb7807f39b2ecfdb6bf7515739b98`，base/current main `8e4ecff16479d8d15db469a469bf2c15acc6e0b5`；source clean。保留`45fbb312…`后追加5个corrective commits；correction-only 23 files / 169 insertions / 28 deletions，cumulative 60 files / 1397 insertions / 25 deletions，diff check通过。
- reported correction closure：MACHINE/HUMAN verifier组合分流并在Permission前刷新Identity facts；revoke管理鉴权；audit-first FK安全事务、predecessor/reissue事实、partial uniqueness/concurrency；configured issuer与strict JWS/persisted-state checks；Identity allow/deny及Auth reissue/verified/rejected audits；4个missing frozen specs均已加入。
- replacement verification：proto generation/lint与Common/Auth/Identity/Permission四包build通过；Common contract/provider focused 5 tests、Identity 6 suites/10 tests、Permission 3 suites/9 tests通过。Auth full为116/119 suites、350/353 tests，剩余3项与clean main baseline完全相同。
- reacceptance route：exact candidate已路由同一持久I&V `019fcaf2-ca7b-7140-b46d-b6cacae58556`，即时快照active；重新核验68-path、安全阻断项、真实DB约束/事务、strict JWS/audit、4 specs及baseline-neutral full suite。本轮只读验收，明确不merge/push；implementation owner idle等待终态。
- reacceptance terminal：`REJECTED`，candidate未编辑、未merge/push。已确认MACHINE composite verifier接线、Identity refresh调用、audit FK顺序、partial uniqueness/predecessor FK、exact issuer与部分审计事件落地；generation/proto lint/四包build、68-path lease、全部NEW_TARGET存在、focused suites与Auth baseline-neutral对比通过。
- remaining critical：(1) Auth `main.ts`未加载`machine_workload_source_credential.proto`，controller不会注册到runtime host；(2) revoke仍只有`@RequirePermissions`元数据，无mTLS/ExecutionToken/operator/Permission guards或operator传递；(3) Identity adaptor/port丢弃principal ID/type/status/version、binding ID/version、SPIFFE echo与decision reference，verifier只检查`allowed`和scopeLevel，malformed owner facts可进入Permission。
- remaining important：NumericDate仍接受future `iat`且未严格绑定`iat/nbf/exp`与persisted timestamps；controller仍返回空`supersedesCredentialId`，Identity同idempotency并发/disable后重试不能稳定返回原事实；MACHINE denial matrix不完整，production diff仍有Auth repository/adapter与Identity mapper等`any`类型缺口。
- second rework route：完整报告返回同一owner `019fdb21-4731-7341-86d6-c24a593b9fc1`，继续在clean `b6cd70dd…`同branch追加提交。必须增加host registration test、真实guard/operator enforcement tests、完整Identity owner-fact binding、strict NumericDate/persisted-time tests、stable predecessor/idempotency race处理、denial matrix与production `any`清理后再形成replacement。
- accepted implementation candidate：`codex/migration/machine-workload-source-verifier@024579598c1293807d3f1cd5e7003aefd8e8fa0a`，base `8e4ecff16479d8d15db469a469bf2c15acc6e0b5`；source clean。相对第二次rejected `b6cd70dd…`追加9个corrective commits、14 files / 131 insertions / 41 deletions；累计61 files / 1488 insertions / 26 deletions，全部在68-path lease内。
- final correction closure：挂载Auth runtime proto并执行revoke guards/operator/permission；完整绑定Identity principal/binding/version/SPIFFE/lifecycle facts；严格NumericDate/persisted-time与machineType边界；稳定predecessor/idempotency并处理Prisma `P2002`并发重读；补齐denial matrix、类型安全、safe audit及INTERNAL_SERVICE/AUTOMATION_BOT允许与EXTERNAL_INTEGRATION/AI_AGENT拒绝。
- final I&V terminal：`ACCEPTED_AND_INTEGRATED`。fetch、root `git merge --ff-only 02457959…`与唯一一次`git push origin main`均exit 0；root/source clean。permission-code generation、proto regen/lint、Auth/Identity Prisma validate及Common/Auth/Identity/Permission四包build均exit 0。
- final test evidence：Common provider+contract 5 tests、Auth MACHINE 7 suites/24 tests、Identity 6 suites/10 tests、Permission 3 suites/9 tests通过。完整Auth为3 failed/116 suites passed、364/367 tests，失败仅保留先前独立证明的trusted-device、step-up MFA `scopeLevel` expectation与account-lifecycle DI missing password repository三项baseline。
- task replacement/archives：旧task `019fd240-7062-76c3-a183-56e363e8fee4` 因delivery-mode failure在WIP无损移交后已retired/archived；replacement owner `019fdb21-4731-7341-86d6-c24a593b9fc1` 完成交付并在I&V集成证据消费后archived。两者均不得恢复。
- Git preservation state：source branch `codex/migration/machine-workload-source-verifier`与fixed worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/machine-workload-source-verifier` 标记为 `MERGED_PRESERVE_UNTIL_FINAL_CLEANUP`；HEAD `02457959…`、clean。不得提前删除，须等待final cleanup manifest与迁移台账本身进入main。
- next route decision：EXEC-CRYPTO HUMAN与MACHINE source-verifier foundations均已集成；GRPC Asset current-main rebuild现为下一非AI foundation候选，但本轮只收口台账、不派发任务。
- target ownership：MACHINE 68-path implementation与短时main integration leases均已释放；source Git资源仅作已集成交付/拒绝修正/WIP迁移证据保留。下一foundation候选为GRPC Asset current-main rebuild，不在本轮派发。

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
- durable deferred evidence：2026-08-09 已建立 annotated tag `migration-evidence/action-grant-runtime-deferred-20260809`，peeled commit 精确为 `ec2b2cf881fec81f1882b3260f397f33d618aaf0`。该 tag 只保全 44-path / 3567+/174- 的历史候选，不代表验收、集成或恢复实现；最终清理旧 branch/worktree 后仍可追溯原提交。
- target ownership：ActionGrant design 与短时 main integration leases 已释放；Permission implementation 已按扩展 Common lease完成并集成。ActionGrant runtime 不进入当前基础能力执行队列。

### 4.6 SITE 历史入口 — `SUPERSEDED_BY_4.1.1`

- source threads：control `019f8fb8-84bf-7c90-ad1f-51853220ac0a`；design `019f8fb8-834c-7b21-9e39-d2e0fdf0c7ff`。
- 本条是初始 handoff 的历史入口，不再表示 SITE 当前状态；SITE Trusted gRPC / Site Media 的最终状态以 4.1.1 `IMPLEMENTATION_ACCEPTED_AND_INTEGRATED` 为准。
- FAQ 与 Article Category 的历史集成证据继续保留；Site Inspiration 仍是独立后续 feature，不影响本次 SITE recovery 的迁移关闭。
- active I/R/V/X：无；本阶段不再派发 SITE 实现线程。

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
5. EXEC-CRYPTO HUMAN-only foundation `1ca24f41…` 已独立验收、ff-only 集成并 push。
6. MACHINE/workload source-verifier `02457959…` 已独立验收、ff-only集成并push。
7. GRPC Asset replacement `a82e5ea6…` 已关闭两轮I&V拒绝项，完成独立验收、ff-only集成与一次main push；source保持`MERGED_WAITING_FOR_USER_CLEANUP`。
8. AI Platform 与 ACTION-GRANT runtime/feature implementation 保持 deferred，不因基础安全能力推进而自动恢复。
9. 下一非AI runtime顺序为 `site-service` trusted-gRPC/current-main caller inventory与token-only cutover准备；Site Inspiration仍须先复核Event/outbox与CDN/purge平台前置，不直接绕过`WAITING_FOR_PLATFORM_ENABLEMENT`进入业务runtime。

## 7. 归档候选与必须保留的资源

### 7.1 Safe archive candidates（仅候选，不执行）

- EVENT closure record/thread resources：已有 `CLOSED` 与 main evidence。
- EXEC-REVOKE closure record/thread resources：已有 `CLOSED` 与 main evidence。
- API-KEY historical command/thread resources：可形成 immutable closure summary；原 dirty content 已进入 clean rejected-prototype evidence ref `755d857a…`，待 final cleanup manifest 集成后与其他 evidence refs 一并清理。

AI legacy A/V 与 migration implementation 任务已有完整重建、独立 I&V、集成及远端 main 证据，可进入 thread archive candidate；精确未归档项已经列入 7.6，待 ledger 进入 main 后执行。AI 的分支、提交与工作树继续保留到同一清理 gate。所有仍承载候选、拒绝证据或未冻结设计上下文的 `MIGRATION_FROZEN` 旧任务先完成持久 disposition，再正常清理工作面。

### 7.2 Retained candidate/decision resources

| 资源角色 | Ref / SHA | 保留原因 |
| --- | --- | --- |
| GRPC carrier | `codex/grpc/i04-source-credential-carrier@dced77ad8cb877ea9aad10f1c6a310ad32a924df` | 保留原候选；须基于 current main 重建后验收/集成 |
| GRPC Asset legacy candidate | `codex/grpc/i03-gateway-trusted-execution-producer@6973bcda1484ac2fccc522f5d8ee70dc989c7541` | 已由current-main replacement supersede；保留历史实现意图与拒绝/重建对照证据 |
| GRPC Asset accepted replacement | `codex/migration/grpc-asset-rebuild@a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d` | 已独立验收、ff-only集成并push；source clean，`MERGED_WAITING_FOR_USER_CLEANUP` |
| Permission decision legacy workspace | `codex/acprincipalrole-principalrolebinding-command@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 保留旧上下文；不恢复旧任务 |
| Principal Authorization rejected design candidate | `4f78cec80b133fd186079fefc6b78ba42be86c28` | 保留 DESIGN_GAP 证据；已由同 branch 的 replacement supersede |
| Principal Authorization replacement candidate | `codex/unified-design/security-open-packets@fe395fb5254a620108882494eb601cfe00fd5701` | 已独立验收并集成；保留设计与修正证据 |
| ActionGrant design candidate | `codex/unified-design/security-open-packets@634414557f14576c666d98276be80a230130b055` | 已独立验收并集成；保留设计与 Permission scope-gap closure 证据 |
| Permission Decision RPC rejected candidate | `codex/migration/permission-decision-rpc@96eb67aa126cccbb98e91bb0fedf4f90cfd8399e` | 保留 I&V 安全拒绝证据；同 branch remediation 已完成并集成 |
| Permission Decision RPC remediation candidate | `codex/migration/permission-decision-rpc@45a7e3065d66f3692493181120ebd08e47ec283f` | 已独立验收并集成；保留实现与安全修正证据 |
| EXEC-CRYPTO legacy checkpoint | `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660687bbeb24349d11bcaed6f63d2373c4b` | 保留 merge checkpoint 上下文；HUMAN replacement 已集成，不直接复用 |
| EXEC-CRYPTO rejected candidate | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | 保留拒绝证据 |
| EXEC-CRYPTO HUMAN foundation | `codex/migration/exec-crypto-remediation@1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` | 已独立验收并集成；仅 HUMAN，不代表 full TG-2/MACHINE |
| MACHINE exact-lease design candidate | `codex/unified-design/security-open-packets@22ed9ee468d0744b10dec4536856f29c10d3552f` | 第三次 replacement；封闭登记64-path lease，已独立验收、ff-only集成并push |
| MACHINE leaf-notAfter design candidate | `codex/unified-design/security-open-packets@8e4ecff16479d8d15db469a469bf2c15acc6e0b5` | 冻结transport-derived leaf expiry与68-path lease；已独立验收、ff-only集成并push |
| MACHINE implementation rejected evidence | `45fbb312002a2060d28aed39b6bdf54c76654f2c` / `b6cd70dd70d0edf1161f3fcb1584ff3fa7a8d3df` | 保留两轮I&V安全拒绝与同branch corrective history证据 |
| MACHINE implementation accepted candidate | `codex/migration/machine-workload-source-verifier@024579598c1293807d3f1cd5e7003aefd8e8fa0a` | 已独立验收、ff-only集成并push；source Git资源保留至final cleanup |
| API-KEY rejected prototype evidence | `codex/api-key/x01-integration@755d857ab990520a916f73e859e39f1207085e32` | 精确保全原两个 untracked 文件；obsolete raw-pepper seam，永不进入 main |
| AI accepted legacy candidate | `codex/ai-platform/i01-tool-contract-registration@6101933d3f054989e6dbfca27889a7141db16075` | 保留历史验收与 blob 对照证据 |
| AI rebuilt candidate | `codex/migration/ai-platform-completion@94094fe57a8d2f18750ef712f2730015be2d9514` | 已独立验收并集成；保留交付证据，等待用户批准清理 |
| ACTION-GRANT candidate | `codex/action-grant/i01-delegated-task-runtime@ec2b2cf881fec81f1882b3260f397f33d618aaf0` | 未验收 runtime candidate；按用户优先级 deferred，只保全证据，不恢复实现 |
| Closed-cycle main evidence | `0a321c0d35442a0cf94956734f33cf5fab696f88` | EVENT / EXEC-REVOKE closure evidence |

### 7.3 当前全部 worktree 清单

当前观察到 39 个 worktree；候选提交前除本 Program Control 台账文件外，其余 38 个 worktree 全部 clean。所有 legacy 资源保持原状。

| Worktree | Branch | HEAD | State |
| --- | --- | --- | --- |
| `/Users/acehood/Documents/GitHub/oes` | `main` | `547a0c5d55f9a955543779ec584a16e9b05cf453` | clean |
| `/Users/acehood/.codex/worktrees/10ab/oes` | detached | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |
| `/Users/acehood/.codex/worktrees/1d99/oes` | detached | `0a321c0d35442a0cf94956734f33cf5fab696f88` | clean |
| `/Users/acehood/.codex/worktrees/229b/oes` | detached | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/program-control/migration` | `codex/oes-program-control-migration` | live candidate ref | 本台账唯一 writer；candidate commit 后应 clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/ai-platform-completion` | `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` | clean；AI rebuilt candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/permission-decision-rpc` | `codex/migration/permission-decision-rpc` | `45a7e3065d66f3692493181120ebd08e47ec283f` | clean；Permission remediation candidate |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/integration/main-queue` | `codex/integration/main-queue` | `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` | clean；EXEC-CRYPTO HUMAN foundation accepted/integrated，I&V 当前 idle |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/unified-design/security-open-packets` | `codex/unified-design/security-open-packets` | `f57c4b1de5bc6d29a8a5e9824d1c26b1e029cf6b` | clean；最新冻结设计均已进入 main，等待最终清理 |
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
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/exec-crypto-remediation` | `codex/migration/exec-crypto-remediation` | `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` | clean；HUMAN-only candidate accepted/integrated，implementation task archived |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-asset-rebuild` | `codex/migration/grpc-asset-rebuild` | `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d` | clean；candidate accepted/integrated，`MERGED_WAITING_FOR_USER_CLEANUP` |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/grpc-carrier-rebuild` | `codex/migration/grpc-carrier-rebuild` | `3e263e501341ea1b90049d5343c42db055f3c5ea` | clean；candidate accepted/integrated，implementation task archived |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/machine-workload-source-verifier` | `codex/migration/machine-workload-source-verifier` | `024579598c1293807d3f1cd5e7003aefd8e8fa0a` | clean；`MERGED_PRESERVE_UNTIL_FINAL_CLEANUP`；两implementation task均archived |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/migration/site-trusted-grpc-recovery` | `codex/migration/site-trusted-grpc-recovery` | `547a0c5d55f9a955543779ec584a16e9b05cf453` | clean；candidate accepted/integrated，`MERGED_WAITING_FOR_USER_CLEANUP` |
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
| `codex/integration/main-queue` | `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` |
| `codex/migration/exec-crypto-remediation` | `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` |
| `codex/migration/ai-platform-completion` | `94094fe57a8d2f18750ef712f2730015be2d9514` |
| `codex/migration/grpc-asset-rebuild` | `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d` |
| `codex/migration/grpc-carrier-rebuild` | `3e263e501341ea1b90049d5343c42db055f3c5ea` |
| `codex/migration/machine-workload-source-verifier` | `024579598c1293807d3f1cd5e7003aefd8e8fa0a` |
| `codex/migration/permission-decision-rpc` | `45a7e3065d66f3692493181120ebd08e47ec283f` |
| `codex/migration/site-trusted-grpc-recovery` | `547a0c5d55f9a955543779ec584a16e9b05cf453` |
| `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd690af817f8e9bb092fbafb769a31b2e1a6` |
| `codex/trusted-grpc-execution-context/d-freeze` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` |
| `codex/unified-design/security-open-packets` | `f57c4b1de5bc6d29a8a5e9824d1c26b1e029cf6b` |

### 7.5 Final disposition readiness refresh（只读，未清理）

2026-08-09 以 `main@547a0c5d55f9a955543779ec584a16e9b05cf453` 对全部 Git 资源重新分类：

| 资源分类 | 数量 | 当前处置 |
| --- | ---: | --- |
| root main worktree | 1 | 最终唯一保留目标；当前 clean |
| 非 root、HEAD 已是 main ancestor、clean | 25 | Git 内容已进入 main，但在 ledger 集成、任务证据消费与全局清理 gate 完成前不移除 |
| newly integrated clean worktrees | 5 | GRPC carrier `3e263e50…`、EXEC-CRYPTO HUMAN foundation `1ca24f41…`、MACHINE source-verifier `02457959…`、GRPC Asset `a82e5ea6…`与SITE recovery `547a0c5d…`；已独立验收并进入main，等待final cleanup manifest |
| design-gap clean implementation worktrees | 0 | MACHINE design/implementation gaps已关闭 |
| retained non-main candidate worktrees | 3 | EXEC-CRYPTO `64ea8660…` 与 GRPC carrier `dced77ad…` 已归类为被 current-main replacement 消费的 superseded evidence；deferred ActionGrant runtime `ec2b2cf…` 已由 annotated evidence tag 持久保全。三者的 worktree/branch 均可在 ledger 进入 main 后正常清理 |
| superseded/rejected evidence worktrees | 4 | EXEC-CRYPTO rejected `c7ab0d9c…`、API-KEY prototype `755d857a…` 及 AI legacy candidate/acceptance 两个 `6101933d…` worktrees；证据已登记，仍待 ledger 入 main 后的清理 gate |
| Program Control migration ledger worktree | 1 | 已无冲突同步到 current main；仍须完成 ledger candidate 验证、提交与集成 |
| active current-main implementation worktree | 0 | SITE source已clean at integrated `547a0c5d…`并标记`MERGED_WAITING_FOR_USER_CLEANUP`；当前无active implementation writer |
| **worktree total** | **39** | MACHINE、Asset与SITE source worktrees均clean并等待final cleanup；root clean。删除/clean/reset数为0 |

branch refs 共 33：26 个 branch HEAD 已是 current main ancestor（SITE implementation branch当前等于main；Asset rebuild与Unified Design均为main ancestor）；7 个非 ancestor refs 已全部分类为 deferred ActionGrant runtime、AI legacy accepted evidence、API-KEY rejected prototype evidence、EXEC-CRYPTO legacy checkpoint、GRPC Asset legacy candidate、原 GRPC carrier candidate与Program Control migration ledger。MACHINE branch已是current main ancestor。不存在未分类branch ref。

任务处置快照：handoff registry 的 101 是历史聚合计数，不再作为当前可操作任务数。2026-08-09 对本机 Codex state database 只读查询得到 canonical `A/C|A/D|A/I|A/R|A/V|A/X` 标题共 41 项，其中 36 项已归档、5 项未归档；应用最近任务快照还能看到部分已归档的 `notLoaded` 历史项。当前 5 项已形成精确归档 manifest，见 7.6。历史聚合中未出现在本机数据库的项目不重新创建或唤醒，以 capability-level closure summary 完成证据收口。checker 为 0。

当前最终清理只剩 1 个 gate：验证、提交并集成 Program Control ledger。ActionGrant durable evidence、EXEC-CRYPTO superseded disposition 与可执行 thread archive manifest 已完成；GRPC Asset、MACHINE、API-KEY 与 SITE 的内容丢失风险也已关闭。ledger 进入 `main` 前，所有 worktree/branch 删除数保持 0。

### 7.6 可执行 task archive manifest

以下 5 个 canonical formal task 在本机 Codex state database 中仍为 `archived=0`，其设计、候选、拒绝或验收结果已经由本台账、稳定真相源、current `main` 或 ActionGrant durable evidence tag 保全。ledger 进入 `main` 后按下表逐项调用应用归档接口；不得通过直接写数据库代替应用归档。

| Thread ID | Task | Final disposition |
| --- | --- | --- |
| `019fc52b-39bf-7250-84de-6d5bcff1d099` | `A/I/ACTION-GRANT/01` | runtime deferred；candidate 由 evidence tag 保全 |
| `019fc52d-3e6d-7d03-b5f2-27befd10c7d7` | `A/I/AI-PLATFORM/01` | registration 已重建、验收并集成；runtime deferred |
| `019fc87b-1859-7ef2-88a6-a89c9a087024` | `A/I/PRINCIPAL-ROLE/05` | Permission replacement 已验收并集成 |
| `019fcaac-840c-7072-b792-793396ea30b3` | `A/V/AI-PLATFORM/01` | 验收证据已消费并由 current main 覆盖 |
| `019fb37b-3c46-78d1-9d48-72a9caf96d1a` | `A/V/API-KEY/01` | 历史拒绝证据已持久登记；交付周期已关闭 |

迁移控制任务 `OES Program Control`、`OES Unified Design`、`OES Integration & Verification` 与本 legacy migration handoff 任务在 Git 清理完成前保留；最终只读复核完成后再归档，不进入新的开发循环。

### 7.7 最终清理结果

- worktree：从峰值 39 个收敛为 1 个；只保留 `/Users/acehood/Documents/GitHub/oes`，branch 为 `main`。
- merged branches：27 个已进入 `main` 的 `codex/*` branch 均通过 `git branch -d` 正常删除。
- retained evidence branches：以下 6 个非合并 ref 未使用 `-D` 或其他强制方式删除；它们不绑定 worktree，不构成 active writer：
  - `codex/action-grant/i01-delegated-task-runtime@ec2b2cf…`：deferred runtime，另有已推送 annotated evidence tag。
  - `codex/ai-platform/i01-tool-contract-registration@6101933d…`：已被 current-main registration replacement supersede 的历史验收证据。
  - `codex/api-key/x01-integration@755d857a…`：rejected raw-pepper prototype evidence，永不进入 main。
  - `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660…`：已被 current-main HUMAN/MACHINE replacements supersede 的历史 checkpoint。
  - `codex/grpc/i03-gateway-trusted-execution-producer@6973bcda…`：已被 current-main Asset replacement supersede 的历史候选。
  - `codex/grpc/i04-source-credential-carrier@dced77ad…`：已被 current-main carrier rebuild supersede 的历史候选。
- thread archive（已被 7.8 纠正）：本轮曾按旧 canonical-title 查询口径记录从 36/41 收口为 41/41；后续 exact-ID / raw-thread 状态复核证明该查询遗漏了 UI 重命名但底层 `title` 仍保存初始 delegation 的 legacy formal tasks，因此本条不得再作为完整归档证据。
- durable deferred evidence：`migration-evidence/action-grant-runtime-deferred-20260809` 已推送 origin，peeled commit 为 `ec2b2cf881fec81f1882b3260f397f33d618aaf0`。
- safeguards：整个清理过程未使用 `git branch -D`、`git worktree remove --force`、`git reset --hard`、bulk `git clean` 或 checker。

### 7.8 Post-closure SITE archive correction（2026-08-09）

- archive-count root cause：旧 closure 查询按 canonical `title` 匹配 formal tasks；部分线程通过 UI 设置了显示标题，但本机 `state_5.sqlite.threads.title` 仍保存完整初始 delegation，导致这些任务未进入旧 41 项集合。只读 exact-ID 复核发现整个 legacy collaboration formal set 仍有19项 `archived=0`，旧“41/41”结论失效。
- SITE pre-archive state：`A/C/SITE · Site Management Command` `019f8fb8-84bf-7c90-ad1f-51853220ac0a` 与 `A/D/SITE · Site Management Design` `019f8fb8-834c-7b21-9e39-d2e0fdf0c7ff` 在本批次开始时均为 `archived=0` / `notLoaded`。历史FAQ与Article Category I/V/closure children已归档，A/C terminal为`MIGRATION_FROZEN`，无active child/candidate。
- Git state：SITE legacy A/C/A/D没有独立worktree或branch；仓库只保留root main worktree。FAQ、Article Category以及SITE recovery实现均已进入main，当前SITE closure不持有代码writer lease。
- truth-source closure：Site lifecycle、Runtime health、publish/sync、FAQ、Article Category、Inspiration对象/ownership/四端范围与Product Hotspot Phase 2 deferral已进入稳定真相源。原Site governance workspace为`SUPERSEDED_BY_TRUTH_SOURCE`。
- status-sync candidate：docs-only `9e6b590a2a5072d8b8fc95776aabd8c0c6183c26`（parent `87f24059072829d23aa20842a1d05b64f0a617ec`）仅修改`docs/plans/features/site-inspiration-management-p1.md` 9+/9-，把状态校正为`DESIGN_FROZEN_IMPLEMENTATION_NOT_DISPATCHED`并登记trusted gRPC、Site Media、Event/outbox/inbox、R2 precise purge/retry平台前置已集成；Inspiration Core业务实现仍未派发，Product Hotspot与fallback禁令不变。candidate已由persistent I&V独立验收、ff-only集成并push，main/local origin/remote均为`9e6b590a…`且clean。
- SITE archive terminal：本台账纠错进入main后，已通过Codex应用接口仅归档上述A/C/SITE与A/D/SITE两项；未直接写state database，未唤醒线程。exact-ID只读复核为2/2 `archived=1`，`archived_at=1786286470`；两线程仍可按ID只读访问。全局未归档数由19降为17，其余17项留给后续逐能力审计，不在本批次处理。

### 7.9 PRINCIPAL-ROLE archive manifest（2026-08-09）

- exact state：`A/C/PRINCIPAL-ROLE · PrincipalRoleBinding Command` `019fc879-f423-7b10-80ff-93557a6f51c7` 与 `A/D/PRINCIPAL-ROLE · PrincipalRoleBinding Persistence` `019fa287-0043-74d3-afbf-d12252837d9b` 均为 `archived=0` / `notLoaded`。最终 legacy A/I/05 `019fc87b-1859-7ef2-88a6-a89c9a087024` 已为 `archived=1`，历史 I/R/V/X、旧/替换 Command与迁移implementation也均已归档。
- stale handoff disposition：A/C terminal `MIGRATION_FROZEN` 当时记录Permission authority decision RPC处于`DESIGN_GAP`、无candidate；这些缺口后来已由Principal Authorization replacement `fe395fb5…`、ActionGrant design `63441455…`与Permission remediation `45a7e306…`关闭。`ResolvePrincipalAuthorization`、`ResolveWorkloadIssuance`、`ResolveDelegatedAuthorization`、INTERNAL Code、authority registry、审计与opaque `authzVersion`现均有冻结真相源和current-main实现。
- truth sources：`docs/architecture/services/permission-service.md`是唯一服务真相源；`docs/architecture/09-role-based-permission-resolution.md`状态为`FROZEN_PRINCIPAL_PERMISSION_RESOLUTION`，`docs/contracts/permission-service/principal-authorization.md`状态为`FROZEN`，ADR-0015为`ACCEPTED`。A/D最后建议的`PERMISSION-AUTHORITY`独立边界已由现有Unified Design/Permission实现消费，不再需要恢复旧A/D扩写。
- implementation evidence：Permission candidate `45a7e3065d66f3692493181120ebd08e47ec283f`已独立验收并集成；proto generation/lint、Common/Permission build、L1 285、L3 39、focused 41与contract gates通过。L2数据库与ESLint parser历史环境限制已原样登记，不构成未消费production WIP。
- Git state：PRINCIPAL-ROLE legacy线程没有独立worktree或branch；旧`bf83` cwd已失效，所有有用commits均由current main覆盖。当前无dirty、candidate、rejected或active writer资源需要保留。
- PRINCIPAL-ROLE archive terminal：本段进入main后，已通过Codex应用接口仅归档上述A/C与A/D两项；不直接写state database，未唤醒线程。exact-ID只读复核为2/2 `archived=1`，`archived_at=1786287738`；两线程仍可按ID只读访问。全局未归档数由17降为15，其余15项留给后续逐能力审计。

### 7.10 EXEC-CRYPTO archive manifest（2026-08-10）

- exact pre-archive state：以下四项均为 `archived=0` / `notLoaded`，历史 cwd 均已不存在，不绑定当前 worktree，也不持有 active writer：
  - `A/C/EXEC-CRYPTO · Token Cryptography Command` `019fc601-1f32-7912-a9a5-849cf22cfd23`；terminal 为 `MIGRATION_FROZEN`，无 active descendant 或待决 candidate。
  - `A/D/EXEC-CRYPTO · Token Cryptography and Workload Identity` `019fa287-01a8-7340-8fb3-b56df8652dcd`；`FROZEN_DESIGN_READY` 已以 `65e49258…` 进入 main。
  - `A/I/EXEC-CRYPTO/06 · Auth TG-2 Verified Context Remediation` `019fc608-c9cf-7a82-a91a-0b9aa6d0cd5f`；terminal 为 clean `CROSS_CAPABILITY_DEPENDENCY_BLOCKER`，checkpoint `64ea8660…` 已被 current-main replacements supersede。
  - `A/V/EXEC-CRYPTO/02 · Auth TG-2 Final Acceptance` `019fc67d-89f7-7453-8d6d-532f356be1c7`；对 `c7ab0d9c…` 的终态为 `REJECTED`。
- A/V/02 rejection disposition：拒绝结论正确。旧 candidate 的 `VerifiedExecutionTokenContextProvider` 把 `request.requestedPermissionCodes` 复制到 `execution.permissionCodes`，STS 再把请求与同源集合比较，形成请求自授权/恒真 privilege gate。该 candidate 从未进入 main；`c7ab0d9c…` 继续由 `64ea8660…` ancestry 与本台账保留为拒绝证据。
- replacement closure：HUMAN foundation `1ca24f417a2d06bce8be79d4c8ed67bc6c518a65` 与完整 MACHINE source-verifier `024579598c1293807d3f1cd5e7003aefd8e8fa0a` 均为 current main 祖先。current main 从 Auth-verifiable source credential 恢复 principal，BUSINESS/INTERNAL 分别消费 Permission 的 `ResolvePrincipalAuthorization` / `ResolveWorkloadIssuance`；签名前绑定 `allowed`、principal、scope、tenant/org、audience、workload、requested/granted/denied Codes、decision reference 与 opaque `authzVersion`。请求 Codes 不再生成授权集合。
- fresh rejection-regression audit：Program Control 在 root `main@b902ac91…` 对旧 candidate 与 current main 做静态差异追踪，并用 package-aware临时Jest配置运行 `execution-token-exchange.service.spec.ts`、`verified-execution-token-context.provider.spec.ts` 与 `execution-token.module.spec.ts`；最终 3 suites / 10 tests passed，exit 0。早先两次 runner alias 配置失败只影响测试装配，修正映射后同一三套件全绿；tracked root 始终 clean。
- truth/status sync：docs-only candidate `22f07cccbeac1421b86780f1416b66626650494f`（parent `b902ac91…`）仅修改6个既有ADR/service truth/contract/feature文档，15+/15-；把已集成 MACHINE、Gateway/Common/Asset 与 SITE slices 从 `FROZEN_PENDING_IMPLEMENTATION` 校正为 `IMPLEMENTED_VERIFIED`。persistent I&V 独立确认 exact six-path docs-only、UTF-8 6/6、74 links、4个YAML lease manifest与parent byte-identical、deferred边界不变，随后ff-only集成并只push main一次；最终 root/origin/remote为 `22f07ccc…`且clean。
- frozen/deferred boundary：ADR-0015为 `ACCEPTED`，ExecutionToken与Principal Authorization contracts均为 `FROZEN`；当前没有未消费EXEC-CRYPTO设计决策。DELEGATED、AI、ActionGrant runtime 与外部API-key的独立后置/边界不因本批次改变。
- Git disposition：唯一关联非main evidence ref为 `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660687bbeb24349d11bcaed6f63d2373c4b`；无绑定worktree、无dirty WIP，不路由main，继续保留到最终cleanup manifest。
- EXEC-CRYPTO archive terminal：本段进入main后，已通过Codex应用接口仅归档上述四项；不直接写state database，未唤醒线程。exact-ID只读复核为4/4 `archived=1`且仍可读取；A/C、A/D、I06的`archived_at=1786291848`，A/V02的`archived_at=1786291849`。全局未归档数由15降为11，其余11项留给后续逐能力审计。

### 7.11 GRPC global cutover handoff/archive manifest（2026-08-10）

- current-main handoff：docs-only status candidate `4dd7659ea98edc942e95bf593e74ec150e2606db` 已由 persistent I&V 独立验收、ff-only 集成并只 push `main` 一次；root/local `origin/main`/remote `refs/heads/main` 均为该 SHA 且 clean。该提交只更新 [trusted gRPC feature packet](../features/trusted-grpc-execution-context.md)，未改变既有 lease、服务顺序、安全语义或 AI/ActionGrant runtime deferred 边界。
- replacement execution owner：`OES Trusted gRPC Service Migration`，thread `019fe9f8-5a44-76e1-b5a4-110db9da6d59`，host `local`。标题已设置并读回；首轮只读审计 terminal 为 `GRPC_GLOBAL_CUTOVER_AUDIT_READY`，当前 `idle`，cwd 为只读 root，未创建 branch/worktree。它是后续逐服务 cutover 的唯一持久 owner；旧 A/C/GRPC 不再作为 controller。
- current inventory：21 services / 51 baseline controllers / 560 baseline RPCs，另有 5 个冻结的 MACHINE planned RPC；54 generated files 的 explicit metadata signatures 为 590/590、missing 0。签名完整只证明共享调用签名基础，不等于服务完成 token-only cutover。

`C/A/T/L` 分别表示 `CONTRACT_CLASSIFIED` / `ALL_CALLERS_READY` / `TOKEN_ONLY_SERVER_CUTOVER` / `LEGACY_PATH_REMOVED`：

| Service | RPCs / controllers | C/A/T/L | 主要 caller / disposition |
| --- | ---: | --- | --- |
| Asset | 5 / 1 | Y/Y/Y/Y | Gateway、Site Media；`a82e5ea6…` current-main replacement 已完成 |
| Site | 66 / 2 | Y/Y/Y/Y | Gateway；`547a0c5d…` Site/Media/Event/R2-purge slice 已完成 |
| Browser Activity | 13 / 1 | N/N/N/N | Gateway；下一目标，`DESIGN_PENDING` |
| Notification | 2 / 1 | N/N/N/N | Auth |
| Terminal Device | 17 / 1 | N/N/N/N | Gateway |
| Finance | 27 / 2 | N/N/N/N | Gateway |
| Public Entry | 23 / 2 | N/N/N/N | Gateway |
| Sales | 27 / 4 | N/N/N/N | Gateway |
| MES | 32 / 4 | N/N/N/N | Gateway |
| Collaboration | 16 / 4 | N/N/N/N | Gateway；第二批 |
| CRM | 15 / 3 | N/N/N/N | Gateway、Collaboration；第二批 |
| Procurement | 21 / 2 | N/N/N/N | Gateway、WMS；第二批 |
| SRM | 13 / 2 | N/N/N/N | Gateway、Procurement；第二批 |
| Item Master | 50 / 2 | N/N/N/N | Gateway、MES、WMS；高扇入 |
| WMS | 15 / 2 | N/N/N/N | Gateway；依赖后置 |
| HR | 15 / 2 | N/N/N/N | Gateway、Auth、Identity；依赖后置 |
| Party | 6 / 2 | N/N/N/N | Gateway、CRM、HR、TenantOrg；高扇入 |
| TenantOrg | 20 / 2 | N/N/N/N | Gateway、Auth、HR、Identity；高扇入 |
| Identity | 41 / 3 | N/N/N/N | Gateway、Auth、Permission、HR；foundation partial only |
| Permission | 66 / 8 | N/N/N/N | Gateway、Auth、HR、TenantOrg、WMS；bootstrap partial only |
| Auth | 70 / 1 | N/N/N/N | Gateway、HR、Site、TenantOrg；MACHINE foundation complete，full service pending |
| **Total / proven state** | **560 / 51** | **2 Y / 19 N** | **Asset/Site complete；19 services pending** |

- Browser gate：current main 的 13 RPC / 1 controller 仍有 49 个 proto legacy-context references，zero trusted guard/mode declaration；production direct caller 仅 Gateway，静态审计未发现 pure MACHINE root。现有 truth sources 未完整冻结 13 RPC 的 mode、Permission Code、subject/audience、delegation 与 field disposition，因此状态为 `DESIGN_PENDING`；必须由现有 Unified Design 在用户明确冻结后回写 Browser service truth/contract/proto feature sources，冻结前不创建 Browser implementation candidate。
- retained evidence refs：`codex/grpc/i04-source-credential-carrier@dced77ad8cb877ea9aad10f1c6a310ad32a924df` 已由 current-main carrier rebuild `3e263e501341ea1b90049d5343c42db055f3c5ea` 消费并取代；`codex/grpc/i03-gateway-trusted-execution-producer@6973bcda1484ac2fccc522f5d8ee70dc989c7541` 已由 current-main Asset replacement `a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d` 消费并取代。两条旧 ref 均无绑定 worktree、无 dirty WIP、无 active writer，不路由 main，保留为 `SUPERSEDED_IMPLEMENTATION_EVIDENCE` 至 final cleanup。
- design evidence consumption：A/D/GRPC 的 metadata/Asset five-RPC frozen conclusions 已进入稳定真相源并由 carrier/Asset current-main replacements 落地；A/D/ASSET 的五 RPC classification 已由 `a82e5ea6…` 覆盖；A/D/CDN 的 delivery/purge 结论已由 SITE recovery `547a0c5d…` 覆盖。旧 design tasks 不再持有开放决定或稳定写面。
- exact pre-archive state：以下五项在归档前已按 exact ID 读回，均为 `archived=0` / `notLoaded`，没有 active child、active writer 或未消费候选；本段进入 main 后才通过 Codex 应用接口执行归档，未唤醒线程、未删除 Git 资源：
  - `A/C/GRPC · Trusted gRPC Execution Context Command` `019fc87a-54b3-7463-ad9d-5750e8bab94b`；terminal `MIGRATION_FROZEN`。
  - `A/D/GRPC · Trusted Metadata Migration` `019f99f6-c707-7eb0-8c93-267c67288475`；frozen metadata/Asset design 已消费。
  - `A/D/ASSET · Site Media Asset Contract` `019f983c-152a-7051-8011-9a25ca0987d7`；terminal `FROZEN_ASSET_FIVE_RPC_TRUSTED_EXECUTION_CLASSIFICATION`。
  - `A/D/CDN · Asset Delivery and Purge` `019f99f6-c49a-7731-a5a3-fa3c10c9f154`；terminal `FROZEN_CDN_DELIVERY_PURGE`。
  - `A/I/GRPC/04 · Transport-Private Source Credential Carrier` `019fc563-a9c4-76b0-9774-283206d2f1f0`；terminal `CANDIDATE_READY@dced77ad…`，已由 `3e263e50…` 重建消费。
- archive terminal：前置 manifest candidate `a510625c81f647b63cb3e42f1798e4d25706f2fd` 已由 persistent I&V 验收、ff-only 集成并只 push `main` 一次。随后仅对上述五个 exact ID 调用 Codex 应用归档接口；只读 state 复核为 5/5 `archived=1`，`archived_at=1786338857`，且仍可按 ID 读取。`unarchivedFormalTasks` 由 11 降为 6；两条 superseded evidence refs、所有 branch/worktree 与新持久 owner 均未删除或归档。legacy GRPC batch 已关闭，但全仓 gRPC 迁移未完成；剩余 19 服务继续由新持久 owner 串行推进。

## 8. 本轮验证记录

只读验证覆盖：

- 2026-08-07 Asset caller inventory：从 `asset.proto` 五个 RPC 名、generated `AssetServiceClient` imports与实际方法调用反向扫描 production、fixture、Cron/Robot/worker路径；生产caller只得到Gateway auth-bff与HR management adapters，未发现pure MACHINE root。Asset truth source 10.5 的五RPC mode/Code映射、feature packet `ALL_CALLERS_READY` gate与current Gateway/Asset实现逐项对照后，结论为caller prerequisite通过、target implementation仍需current-main原子重建。
- legacy `6973bcda…` preservation audit：核验commit/parent/branch、35-path name-status/stat，并逐路径比较base/candidate/current-main blobs；旧SHA不具备current-main ancestry或直接复用条件，保留意图/测试证据并显式拒绝恢复已被carrier/producer/MACHINE演进替代的旧transport/runtime blobs。
- 唯一Asset implementation task `019fdb88-0e48-7792-be29-a4c806129ac8` 已创建、设置并读回标题；首次即时状态为active，cwd为root，不是旧失效worktree；未创建第二实现task、设计task、I&V或checker。
- Asset MIG-D21 root-cause audit：完整读取current Gateway session guard、guard provider composition、AppModule/main、downstream source、verified-source boundary/producer、Common private accessor/carrier及冻结architecture/feature ownership。`rg`只得到boundary interface/tests，无production provider/DI；guard成功路径只保留`request.user`，raw verified token不跨越`canActivate()`；仓库无既有Gateway AsyncLocal/request-scope owner可直接满足该lifetime。可行实现至少存在global interceptor + private vault与request-scoped owner等多个不同ownership/DI方案，稳定真相源没有唯一选择，故未由Program Control发明lease。
- Unified Design路由：精确prompt已发送至现有task `019fcaeb-cb2e-7e92-8c4e-aab7771d7254`，要求先向用户比较scope lifetime/owner/DI选项并推荐其一，冻结后再写truth source与exact writer manifest；首次即时snapshot为active。Asset task/worktree已独立核验idle/clean at base，无candidate；未resume、未创建replacement/checker。
- Gateway lifecycle candidate registration：本地直接核验`32607c7a…` commit/parent/branch/worktree，direct parent为root main `02457959…`；精确diff为3个docs truth sources、91+/1-，`git diff-tree --check` exit 0。feature packet §5.2实际列出15条closed writer paths（8 EXISTING / 7 NEW_TARGET）、explicit `main.ts` interceptor order、WeakMap vault、subscription/cleanup/isolation/cache rules及focused command；Program Control未把15-path future lease误报为本docs candidate diff。
- existing I&V route：`019fcaf2-ca7b-7140-b46d-b6cacae58556`单次即时snapshot为active，正在独立核验exact SHA、三文档、lifecycle/security语义与15-path YAML lease；Asset owner/worktree仍idle/clean at `02457959…`，未恢复实现。
- Gateway lifecycle I&V integration evidence：terminal为`ACCEPTED_AND_INTEGRATED`；ff-only merge、root fresh docs/security/lease checks与单次push均exit 0，最终main/local origin/remote为`32607c7a…`。Program Control独立`git ls-remote`复核同SHA，root/design clean。
- SAME Asset owner resume evidence：`019fdb88-0e48-7792-be29-a4c806129ac8`固定worktree/branch已在无reset/rebase/clean情况下ff-only同步到`32607c7a…`，resume snapshot active并开始15-path lifecycle RED test；未创建task/checker。active WIP按已登记lease保留，不由Program Control读取、修改或清理。
- Asset replacement-owner evidence：新 task `019fe09f-b176-7ab2-b15a-b6d00295ce1a` 已设置为 sole Asset writer并完成即时active snapshot；固定worktree仍为`32607c7a…`，当前仅有登记的RED spec与两条setup-only `node_modules` symlink，未创建新worktree/branch/checker。新 owner已收到保留RED、验证并移除两条临时symlink、继续TDD与最终clean candidate要求。
- Asset candidate rejection evidence：I&V 对 `bbcbbc59ea122f4d1adc1ba765159480ee3b0052` 的深审确认其余问题属于实现内返工，但 transport-private carrier 的 public options/不可见 barrel 组合未被现有冻结 lease 唯一确定，构成 `DESIGN_GAP — RETURN_TO_UNIFIED_DESIGN`。推荐的最小设计包为 public accessor 入参 + provider 内部 private carrier 构造，仅新增精确 Common provider/spec writer paths；I&V 不修复实现、不取得 integration lease。Unified Design `019fcaeb-cb2e-7e92-8c4e-aab7771d7254` 已接收该路由；同一 Asset owner/worktree 保持拒绝候选 clean 状态，未创建 replacement。
- Common seam integration evidence：本地直接核验 `190e86d756ac7f46b58918ffdf49727945cc3f00` 的 direct parent 为 `32607c7aa017df9539d2999f97f9b274dbd46a78`，commit subject 为 `docs(grpc): freeze private source credential composition`，精确修改两份 `docs/**` truth sources；root `main`、local `origin/main` 同 SHA，root clean。I&V 的验收、ff-only merge与push作为 terminal handoff evidence登记；Program Control 未重跑实现测试，也未写 root。
- Asset final implementation/integration evidence：I&V先拒绝 `7e5f393f…` 的 `SELF_SERVICE allowDelegated` Critical，随后对exact correction `a82e5ea6…`独立复验并返回`ACCEPTED / READY_FOR_INTEGRATION_LEASE`。correction为2 files / 26+/11-，累计为40 files / 1009+/134-；candidate阶段proto gen/lint、四build、Common 5 suites / 43 tests、Gateway lifecycle 3/8、Gateway composition 2/4、Permission 1/2、Asset 1/3、public barrel与结构/安全gate通过。
- Asset root terminal：同一I&V获得短时integration lease后只读确认root/local origin/remote main均为`190e86d7…`，执行一次`git merge --ff-only a82e5ea6…`；root完整验证矩阵通过后只执行一次`git push origin main`。最终root `main`、local `origin/main`、remote `refs/heads/main`与source HEAD均为`a82e5ea69a7773d4e0e8f5a91dcdf7a599897c1d`，root/source clean；source标记`MERGED_WAITING_FOR_USER_CLEANUP`。

- `git rev-parse`：核验 root、Program Control、所有列出的 candidate/decision commit 与关键 branch refs。
- `git worktree list --porcelain`：历史核验为 38；2026-08-09 最终处置刷新为 39 个当前 worktree。
- 每个 worktree 的 `git status --porcelain=v1 --untracked-files=all`：最新核验全部 clean；GRPC rebuild 已形成候选并释放写入状态。
- `git for-each-ref refs/heads/codex/`：历史核验为 32；2026-08-09 最终处置刷新为 33 个当前 `codex/*` branches，并逐 ref 与 current main 做 ancestry/divergence 分类。
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

EXEC-CRYPTO HUMAN foundation I&V terminal evidence：

- 结论 `ACCEPTED_AND_INTEGRATED`，明确限定 HUMAN-only，不代表 full TG-2/MACHINE。candidate `1ca24f41…`、parent `3e263e50…`、8 paths / 1031+/159-、9-path maximum lease、UTF-8、diff 与 protected-path gates 通过。
- Common/Auth build、4 suites / 12 tests、Prettier 与独立 binding/mixed-kind/INTERNAL/startup probes 在 I&V 和 root 均通过；10/10 binding/deny/missing rejections 的 sign calls 为 0。
- current verifier 只接受 active HUMAN session/access credential；MACHINE、DELEGATED、API-key、AI、ActionGrant 与多跳 subject ExecutionToken fail closed。
- root ff-only merge、唯一一次 push 与远端 SHA 检查通过；root/I&V/source、main/origin-main/remote 均为 `1ca24f41…` 且 clean。
- I&V 明确裁定 MACHINE/workload source-verifier completion 仍是 GRPC Asset `ALL_CALLERS_READY`、token-only cutover与完整服务迁移前置。

本轮没有运行 build、test、lint、安全审计或 acceptance；对应结果均仅作为 handoff evidence 保留，后续候选交付必须在精确重建后的 SHA 上重新验证。

## 9. Discrepancy register

| ID | 发现 | 影响 | 当前处置 |
| --- | --- | --- | --- |
| MIG-D01 | GRPC Asset handoff worktree path 当前绑定 carrier branch/HEAD，而不是 Asset branch/candidate | 不得把该 path 误作 Asset writer；后续恢复 Asset 前需显式选择/建立正确工作面 | 保留全部 refs/worktree，不修改 |
| MIG-D02 | API-KEY x01 integration worktree 曾有 2 个未跟踪 domain 文件 | 测试文件与 rejected `b641e0e1…` 完全一致；实现文件 blob `e54f5f1f…` 唯一但使用 ADR-0017 已淘汰的 raw-pepper seam | `CLOSED_FOR_CONTENT_PRESERVATION`：两文件已精确提交为 clean rejected-prototype evidence `755d857a…`；永不进 main，待 final manifest 后清理 ref/worktree |
| MIG-D03 | 当前资源计数为 37 worktrees / 31 `codex/*` branches，高于 handoff 的 29/23 | 差额来自本 Program Control、AI Platform completion、Integration & Verification、Unified Design、Permission decision RPC、GRPC carrier rebuild、EXEC-CRYPTO remediation 与 MACHINE workload source-verifier 的隔离工作树/分支，并非旧资源漂移 | 在全局快照显式对账 |
| MIG-D04 | API-KEY、EVENT、EXEC-REVOKE 的具体 source thread IDs 未包含在 compact bundle | 台账只能保留 capability 状态与 Git evidence，不能形成完整 thread-level archive manifest | 不唤醒旧线程；等待后续显式补充或按现有证据形成 closure summary |
| MIG-D05 | GRPC carrier `dced77ad…` 的 parent 为 `65e49258…`，不能直接通过 current-main ff-only gate | 旧 SHA 必须仅作 evidence 并在 current main 重建 | `CLOSED`：rebuilt `3e263e50…` 已独立复验、ff-only 集成并 push；原 candidate 继续保留历史证据 |
| MIG-D06 | Principal Authorization candidate `4f78cec8…` 的 Permission 服务真相源同时要求验证 ExecutionToken 又声明不消费 ExecutionToken | 首个 candidate 被 I&V 拒绝 | `CLOSED`：replacement `fe395fb5…` 已最小修正、复验、集成并 push |
| MIG-D07 | Permission implementation inventory 发现 Common 缺少 principal-authorization INTERNAL Code 注册，且 DELEGATED issuance 缺少 owner upper-bound contract/runtime resolver | 原 Permission lease 不足，直接实现会复制跨域真相或读取 AI registration JSON | `CLOSED`：ActionGrant design `63441455…` 已冻结并集成最小 Common lease 与 owner/consumer boundary；恢复同一 Permission task |
| MIG-D08 | Permission candidate 的 L2 受本地 PostgreSQL `permissiondb` 不可达限制；精确 ESLint 受共享 parser `project`/`projectService` 冲突限制 | 两个 gate 未提供代码级通过证据，但其失败均发生在环境/配置前置 | 保留字面失败证据；交由独立 I&V 复核，不在实现候选中修改数据库环境或共享 ESLint 配置 |
| MIG-D09 | Permission candidate `96eb67aa…` 的最终 DELEGATED/WORKLOAD authzVersion 非 opaque SHA-256，且 workload policy 未在 bootstrap 解析 | 泄露内部版本结构、未绑定最终有效 Code 集；非法/缺失策略直到首个请求才失败 | `CLOSED`：remediation `45a7e306…` 已修正、独立复验、集成并 push |
| MIG-D10 | EXEC-CRYPTO `1ca24f41…` 只完成 active HUMAN session/access credential source verifier，不是 full TG-2/MACHINE | 若直接推进 GRPC Asset `ALL_CALLERS_READY` 或 token-only cutover，会遗漏合格 MACHINE caller source principal | 保留 HUMAN foundation 集成证据；下一步先完成并验收 MACHINE/workload source-verifier，再允许 GRPC Asset rebuild |
| MIG-D11 | MACHINE source credential owner/profile/expiry/revocation、active Machine Principal mapping、SPIFFE/leaf-cert binding 与 Auth-local/Identity-owned contract lease 未冻结 | 实现会被迫发明 public ownership/contract，或误用 API-key 专用 mapping | MACHINE worktree clean、无 candidate；复用 Unified Design 做只读选项/推荐，等待用户冻结后再恢复实现 |
| MIG-D12 | MACHINE frozen design candidate `d7b935fb…` 把未来 Identity resolver/Code一处写成“当前已开放/既有”，同时又声明proto/Common/runtime尚未实现 | 文档会把 frozen pending contract误报为现有能力，导致implementation lease与运行现状不一致 | I&V返回DESIGN_GAP且未集成；同一 Unified Design task形成仅修正状态措辞的replacement |
| MIG-D13 | MACHINE replacement `bbb7338f…` 修复状态误报，但Auth/Identity/proto/Prisma/tests/generated-input lease仍是描述性范围 | Program Control无法为恢复implementation登记完整exact path ownership，I&V也不能推断实现结构 | `CLOSED`：第三candidate `22ed9ee4…` 的封闭64-path manifest已独立验收并集成；旧candidate继续保留为DESIGN_GAP证据 |
| MIG-D14 | MACHINE exact lease 跨 Common/Auth/Identity/Permission 且含新proto、Prisma输入、tracked codegen输出与ignored派生产物 | 路径或产物分类不精确会导致共享 ownership 漂移、误跟踪generated output或实现自行扩scope | `CLOSED_FOR_DISPATCH`：`22ed9ee4…` 的64 writer paths、7 ignored outputs、16 protected examples与5共享限制已独立验收；恢复实现仍须先本地复核再登记lease |
| MIG-D15 | 64-path lease 只冻结 ownership，未冻结 MACHINE wire fields/field numbers、Prisma PK/FK/unique/lifecycle/revocation、caller trust 与审计持久化路径 | 实现会被迫发明公共契约和持久化语义，或在无 tracked audit lease 情况下绕过审计边界 | `CLOSED`：9-doc wire/schema/audit packet与66-path lease已通过replacement `7cb5c4d3…`独立验收、集成并push |
| MIG-D16 | 66-path lease登记13个新增spec，但frozen focused commands仅执行10个 | candidate可以在3个公共wire/Identity management断言从未执行的情况下被误判为完成 | `CLOSED`：replacement `7cb5c4d3…`补齐并独立验证13/13覆盖，已ff-only集成并push |
| MIG-D17 | 原MACHINE execution task反复在普通批次边界结束并产生直接回显/固定拒绝placeholder，且WIP含2个根级out-of-lease文件 | 继续使用原delivery owner会交付不完整candidate；直接清理会丢失未提交WIP与失败证据 | `CLOSED`：WIP无损移交replacement owner并完成正式TDD重写，最终`02457959…`验收集成；两task均archived，source资源保留至final cleanup |
| MIG-D18 | Common gRPC workload provider丢弃transport-verified leaf `notAfter`，而Auth issuance必须证明`exp <= leaf notAfter`且proto禁止caller输入该事实 | Auth若本地补值会绕过certificate upper bound；当前66-path lease又保护Common provider，无法正确完成controller/composition | `CLOSED`：docs candidate `8e4ecff1…` 的provider+spec最小amendment与68-path lease已验收、ff-only集成并push；implementation已恢复 |
| MIG-D19 | MACHINE candidate `45fbb312…` build/focused green但verifier未装配/刷新Identity、revoke无authz、audit FK顺序错误，且DB并发约束/JWS/audit/4 specs不完整 | 仅靠定向green会交付可绕过revocation与scope事实、无法真实插入或并发破坏唯一性的安全实现 | `CLOSED`：多轮corrective commits与最终candidate `02457959…`关闭并通过I&V/root验证 |
| MIG-D20 | corrected `b6cd70dd…` 仍未挂载Auth host、revoke guard未执行、Identity refreshed facts被adapter丢弃，并存在future-iat、稳定supersession/idempotency与denial/type-safety缺口 | focused green仍无法证明RPC可调用、管理鉴权实际执行或owner facts/时间边界完整绑定 | `CLOSED`：最终candidate `02457959…`完成host/guard/fact/time/idempotency/denial/type-safety修复并验收集成 |
| MIG-D21 | Gateway session guard验证raw access token后只保留principal facts；transport-private source-credential boundary无production provider/DI，且guard不能唯一确定覆盖handler/downstream await的scope lifetime | 直接在Asset adapter重读Authorization或把bearer放入request/application/context会恢复被禁止的普通credential传播；未经设计选择又无法确定guard/interceptor/private-vault ownership、cleanup、并发隔离与exact lease | `CLOSED_FOR_IMPLEMENTATION`：docs-only `32607c7a…`冻结WeakMap vault + explicit outer interceptor lifecycle与closed 15-path lease，已验收集成；同一Asset owner已ff-only同步并恢复，candidate形成前保持单一writer |
| MIG-D22 | Asset candidate `bbcbbc59…` 将 `TrustedGrpcMetadataProvider` 的 public options 与 transport-private carrier 组合暴露，但 integrated Common public barrel 必须保持 carrier 不可见；原 Asset lease 未登记 Common provider/spec 变更 | 直接公开 carrier 会破坏 transport-private 边界；由 Program Control 追加 Common scope 会发明未冻结的公共 ownership/接口 | `CLOSED_FOR_IMPLEMENTATION`：docs-only `190e86d7…` 已冻结 public accessor + provider 内部 private carrier composition seam，并由 I&V 验收、ff-only 集成及 push。同一 Asset owner已非破坏性同步 main，按冻结 seam 与其余实现内问题形成 replacement candidate |
| MIG-D23 | Asset replacement `7e5f393f…` 的 `TrustedExecutionGuard` 无条件拒绝 `SELF_SERVICE` 的 DELEGATED principal，忽略冻结声明 `allowDelegated:true` | Upload/Bind Account Avatar 的合法委托调用在controller前被拒绝，声明与runtime enforcement冲突 | `CLOSED`：两文件TDD correction `a82e5ea6…`允许HUMAN或`DELEGATED && allowDelegated`并保持空Code gate；完整矩阵复验后已ff-only集成及push |
| MIG-D24 | SITE initial design candidate `d3e6109b…` 的Site Media contract前文排除field-number ownership，后文第8节却冻结11 RPC完整字段号 | 实现方不能唯一判断wire field numbers是否属于受支持稳定契约 | `CLOSED`：单文件1+/1- replacement `c7bda1c4…`明确第8节拥有字段与field numbers；累计7-doc packet经I&V复验、ff-only集成及push，109-path implementation gate已开放 |
| MIG-D25 | Site Inspiration packet仍把trusted gRPC、Event/outbox与CDN purge标为“尚未实现”，但SITE recovery已集成这些平台前置 | 后续实现与legacy archive会误判Site仍在等待平台设计/实现 | `CLOSED`：one-doc candidate `9e6b590a…`只校正状态与依赖完成度，经I&V验收、ff-only集成及push；Inspiration业务实现与Product Hotspot deferral语义不变 |
| MIG-D26 | legacy GC按canonical `title`统计并宣称formal tasks 41/41 archived，但UI重命名线程的底层`title`仍是delegation正文 | SITE A/C/A/D实际仍为`archived=0`，迁移关闭记录高估归档完成度 | `SITE_BATCH_CLOSED`：exact-ID复核得到全局19项未归档；SITE两项已通过应用接口归档并复核2/2，当前剩余17项逐能力处理 |
| MIG-D27 | PRINCIPAL-ROLE A/C terminal仍把Permission authority decision RPC记录为未冻结`DESIGN_GAP`，A/D停在是否拆独立`PERMISSION-AUTHORITY`的讨论 | 恢复旧线程会重复已由Unified Design、ActionGrant设计与Permission remediation关闭的边界，并误判current main缺少resolver实现 | `PRINCIPAL_ROLE_BATCH_CLOSED`：冻结真相源与`45a7e306…`实现已覆盖全部旧gap；两项已通过应用接口归档并复核2/2，当前剩余15项 |
| MIG-D28 | EXEC-CRYPTO A/V/02正确拒绝`c7ab0d9c…`的请求自授权恒真门；本批次开始时旧A/C、A/D、I06与A/V02均为`archived=0`，且已实现MACHINE/Gateway/Common/SITE slices仍带pending状态文字 | 若只按旧A/V terminal判断，会把已由Permission-backed HUMAN/MACHINE replacements关闭的问题误作未完成；若归档前未记录状态偏移与拒绝证据，会丢失迁移闭环 | `EXEC_CRYPTO_BATCH_CLOSED`：`1ca24f41…`/`02457959…`与fresh 3 suites/10 tests证明缺陷已修复；status-sync `22f07ccc…`已验收集成；四项已通过应用接口归档并exact-ID复核4/4，当前剩余11项 |
| MIG-D29 | legacy A/C/GRPC terminal停在`MIGRATION_FROZEN`且只覆盖旧foundation/Asset范围；current main虽已完成carrier、MACHINE、Asset与Site，剩余19服务仍未证明完整C/A/T/L | 直接关闭旧GRPC控制面而不建立新owner会丢失全仓cutover职责；继续恢复旧A/C又会重启已退役capability framework | `GRPC_GLOBAL_HANDOFF_ARCHIVE_CLOSED`：`4dd7659e…`已把21服务矩阵与新持久owner写入feature packet；前置manifest `a510625c…`集成后，五项已通过应用接口归档并exact-ID/state复核5/5，当前剩余6项；两条superseded evidence refs继续保留 |

## 10. 最终关闭结果

SITE recovery implementation `547a0c5d55f9a955543779ec584a16e9b05cf453` 已 `ACCEPTED_AND_INTEGRATED`；Site 59+7、Site Media 11、Gateway/Asset/Event/R2-purge 链与验证矩阵完成。AI/ActionGrant runtime 保持 deferred，API-KEY rejected prototype 永不进入 main；无 checker。

本次退役迁移的Git与内容保全阶段已经完成：有用设计与实现已进入`main`或持久evidence ref，拒绝/取代证据已分类。legacy task archive阶段仍在纠错收口：post-closure exact-ID复核发现19项`archived=0`，SITE、PRINCIPAL-ROLE、EXEC-CRYPTO与GRPC共13项已关闭，当前其余6项按能力逐项审计。全仓 trusted gRPC service cutover 是独立的后续执行主线，目前仅 Asset/Site 完成、19服务 pending，不因 legacy GRPC 线程归档而关闭。临时closure Git资源在各批次记录集成后正常移除，最终继续只保留root `main`。本文件只承担迁移关闭证据与归档manifest，不作为设计或实现真相源。
