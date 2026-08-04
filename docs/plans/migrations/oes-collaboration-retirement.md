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
| `main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 一致 |
| `origin/main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 一致（本地 remote-tracking ref；未 fetch） |
| Legacy formal A/* threads | 101 | 仅保留 handoff 汇总计数；未读取或唤醒线程 |
| Worktrees | 29 | 当前 30；新增项仅为本 Program Control worktree |
| `codex/*` branches | 23 | 当前 24；新增项仅为 `codex/oes-program-control-migration` |
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
- discrepancy：handoff 指定的 Asset retained writer worktree `/Users/acehood/Documents/GitHub/oes/.worktrees/grpc/i03-gateway-trusted-execution-producer` 当前实际绑定 carrier branch，并位于 `dced77ad8cb877ea9aad10f1c6a310ad32a924df`；Asset branch/candidate 仍保留，但当前没有绑定该 branch 的 worktree。

### 4.2 PRINCIPAL-ROLE / Permission — `MIGRATION_FROZEN`

- source threads：control `019fc879-f423-7b10-80ff-93557a6f51c7`；design `019fa287-0043-74d3-afbf-d12252837d9b`；decision-RPC A/I `019fc87b-1859-7ef2-88a6-a89c9a087024`。
- worktree `/Users/acehood/.codex/worktrees/bf83/oes`；branch `codex/acprincipalrole-principalrolebinding-command`；HEAD `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；clean。
- candidate：无新实现候选；既有 PrincipalRoleBinding runtime 的 main-history 状态来自 handoff。
- unresolved packet：仅登记为 Unified Design 待解析项；详细语义不得在本台账冻结，须回写上节所列 Permission/authorization 真相源与 contract 后才能实现。
- target ownership：Unified Design，冻结后转 Platform Security。

### 4.3 EXEC-CRYPTO — `MIGRATION_FROZEN`

- source threads：control `019fc601-1f32-7912-a9a5-849cf22cfd23`；design `019fa287-01a8-7340-8fb3-b56df8652dcd`；I06 `019fc608-c9cf-7a82-a91a-0b9aa6d0cd5f`。
- active retained writer：`/Users/acehood/.codex/worktrees/44ef/oes`；branch `codex/exec-crypto/i06-auth-tg2-remediation`；HEAD `64ea8660687bbeb24349d11bcaed6f63d2373c4b`；clean。
- rejected candidate：`c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc`；commit 保留。拒绝原因来自 handoff：权限请求集合被复制为授权集合并进行自比较，形成恒真 privilege gate。
- authority-upper-bound design branch：`codex/exec-crypto/d-sts-authority-upper-bound@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116`；无替代候选。
- dependencies：GRPC carrier 与 Permission decision RPC。
- target ownership：Platform Security。

### 4.4 AI-PLATFORM — `MIGRATION_FROZEN`

- source threads：control `019fa317-f7eb-7d51-a1a5-63c1f90ef907`；A/I `019fc52d-3e6d-7d03-b5f2-27befd10c7d7`；A/V `019fcaac-840c-7072-b792-793396ea30b3`。
- candidate：`6101933d3f054989e6dbfca27889a7141db16075`；branch/worktree `codex/ai-platform/i01-tool-contract-registration` / `/Users/acehood/.codex/worktrees/72ae/oes`；clean。
- acceptance worktree：`/Users/acehood/.codex/worktrees/d69e/oes`；detached at exact candidate；clean。
- handoff acceptance：`ACCEPTED`；contract tests 5/5、JSON parse、diff/path checks passed。本轮未重跑测试。
- local Git validation：相对原 base `7500bd66d3e11b7a39bb0de052141efe4bfa0d09`，candidate 恰好新增 `src/ai-platform/tool-contracts/registrations/` 下两个文件。
- integration state：未进入 `main`；当前 `main` 已前进至 `65e49258…`，因此必须在交付前重建并复验集成结果。
- target ownership：临时 AI Platform completion lane；完成后再进入归档判定。

### 4.5 ACTION-GRANT — `MIGRATION_FROZEN`

- source threads：control `019fa287-d27a-79b1-8021-36537c90945e`；design `019fa287-02ff-7023-a2d1-ed935605671b`；A/I `019fc52b-39bf-7250-84de-6d5bcff1d099`。
- candidate：`ec2b2cf881fec81f1882b3260f397f33d618aaf0`；branch/worktree `codex/action-grant/i01-delegated-task-runtime` / `/Users/acehood/Documents/GitHub/oes/.worktrees/action-grant/i01-delegated-task-runtime`；clean；尚未 accepted/rejected，且无 A/V。
- preserved commit chain：`5bd955a4` → `17b6a14b` → `ec2b2cf881fec81f1882b3260f397f33d618aaf0`；本轮用 ancestry check 核验顺序成立。
- change surface：Common、Auth、Permission、Collaboration、proto、Prisma 与测试；精确语义仍以上节真相源为准。
- unresolved packet：Auth/Permission transport mounting 的 canonical ownership/path lease，以及 fail-closed 初始化、rollback 与 acceptance；须由 Unified Design 冻结后再执行。
- target ownership：Unified Design → ActionGrant Completion；排在 Platform Security 之后，且不得与其并发写入。

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

1. AI candidate 基于当前 `main` 重建、复验、集成。
2. GRPC carrier 验收、集成。
3. Unified Design 解析 Permission 与 ActionGrant 的开放设计包，并将冻结结论回写唯一真相源。
4. Platform Security 串行交付 Permission decision RPC 与 Auth STS。
5. GRPC Asset candidate 同步、重建、复验、集成。
6. ACTION-GRANT 同步、解决冲突、验收、集成。
7. SITE 仅在前置依赖满足后恢复。

## 7. 归档候选与必须保留的资源

### 7.1 Safe archive candidates（仅候选，不执行）

- EVENT closure record/thread resources：已有 `CLOSED` 与 main evidence。
- EXEC-REVOKE closure record/thread resources：已有 `CLOSED` 与 main evidence。
- API-KEY historical command/thread resources：可形成 immutable closure summary；其 dirty integration worktree 必须先有显式处置决定，Git 资源继续保留。

AI A/V 虽已接受候选，但候选尚未基于当前 `main` 完成重建与集成，因此不列为当前 safe archive candidate。所有 `MIGRATION_FROZEN` control/design/implementation 线程在 ownership 迁移完成前均继续保留。

### 7.2 Retained candidate/decision resources

| 资源角色 | Ref / SHA | 保留原因 |
| --- | --- | --- |
| GRPC carrier | `codex/grpc/i04-source-credential-carrier@dced77ad8cb877ea9aad10f1c6a310ad32a924df` | 待验收/集成 |
| GRPC Asset | `codex/grpc/i03-gateway-trusted-execution-producer@6973bcda1484ac2fccc522f5d8ee70dc989c7541` | 待 Platform Security 后重建复验 |
| Permission decision workspace | `codex/acprincipalrole-principalrolebinding-command@65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | 待 Unified Design |
| EXEC-CRYPTO writer | `codex/exec-crypto/i06-auth-tg2-remediation@64ea8660687bbeb24349d11bcaed6f63d2373c4b` | 保留上下文；无替代 candidate |
| EXEC-CRYPTO rejected candidate | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | 保留拒绝证据 |
| AI candidate | `codex/ai-platform/i01-tool-contract-registration@6101933d3f054989e6dbfca27889a7141db16075` | accepted，待重建复验/集成 |
| ACTION-GRANT candidate | `codex/action-grant/i01-delegated-task-runtime@ec2b2cf881fec81f1882b3260f397f33d618aaf0` | pending，待设计与串行整合 |
| Closed-cycle main evidence | `0a321c0d35442a0cf94956734f33cf5fab696f88` | EVENT / EXEC-REVOKE closure evidence |

### 7.3 当前全部 worktree 清单

迁移时观察到 30 个 worktree；除明确标记外均 clean。所有资源保持原状。

| Worktree | Branch | HEAD | State |
| --- | --- | --- | --- |
| `/Users/acehood/Documents/GitHub/oes` | `main` | `65e49258a0dc57b7daf3d40d5e8a63ea94dfc116` | clean |
| `/Users/acehood/.codex/worktrees/10ab/oes` | detached | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` | clean |
| `/Users/acehood/.codex/worktrees/1d99/oes` | detached | `0a321c0d35442a0cf94956734f33cf5fab696f88` | clean |
| `/Users/acehood/.codex/worktrees/229b/oes` | detached | `c7ab0d9cf6767e63c499e7fc15a3d9d725b45cfc` | clean |
| `/Users/acehood/Documents/GitHub/oes/.worktrees/program-control/migration` | `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd69` | clean；替代已回收的 Codex 临时 worktree |
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
| `codex/oes-program-control-migration` | live branch ref；inventory checkpoint `1f5fdd690af817f8e9bb092fbafb769a31b2e1a6` |
| `codex/trusted-grpc-execution-context/d-freeze` | `7500bd66d3e11b7a39bb0de052141efe4bfa0d09` |

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

本轮没有运行 build、test、lint、安全审计或 acceptance；对应结果均仅作为 handoff evidence 保留，后续候选交付必须在精确重建后的 SHA 上重新验证。

## 9. Discrepancy register

| ID | 发现 | 影响 | 当前处置 |
| --- | --- | --- | --- |
| MIG-D01 | GRPC Asset handoff worktree path 当前绑定 carrier branch/HEAD，而不是 Asset branch/candidate | 不得把该 path 误作 Asset writer；后续恢复 Asset 前需显式选择/建立正确工作面 | 保留全部 refs/worktree，不修改 |
| MIG-D02 | API-KEY x01 integration worktree 有 2 个未跟踪 domain 文件 | 禁止把该 worktree 当作可直接清理资源；需先确认文件来源与保留方式 | 保留 dirty state，不读取线程、不清理 |
| MIG-D03 | 当前资源计数为 30 worktrees / 24 `codex/*` branches，高于 handoff 的 29/23 | 差额来自本 Program Control 隔离工作树/分支，并非旧资源漂移 | 在全局快照显式对账 |
| MIG-D04 | API-KEY、EVENT、EXEC-REVOKE 的具体 source thread IDs 未包含在 compact bundle | 台账只能保留 capability 状态与 Git evidence，不能形成完整 thread-level archive manifest | 不唤醒旧线程；等待后续显式补充或按现有证据形成 closure summary |

## 10. 下一阶段入口

本草案需先由用户/legacy handoff owner 复核。复核前保持所有资源原状，不创建 Unified Design、实现或 Integration & Verification 线程。通过复核后，Program Control 才能根据第 6 节的排序建立稳定 write-ownership lease 与后续派发清单。
