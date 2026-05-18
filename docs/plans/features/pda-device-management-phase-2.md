# PDA Device Management Phase 2

> `terminal-device-service` 的长期职责以 [terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md) 为准；Managed Terminal Device Management 的跨服务协同以 [managed-terminal-device-management.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md) 为准。本文只记录 PDA Device Management Phase 2 的 feature 范围、执行切片与验收要求。

## 1. 目标

- 建立 PDA 设备从管理员发放 enrollment、PDA 入网激活、设备绑定租户、设备准入判定、禁用清退、运行状态上报、版本策略到后台看板的最小闭环。
- 新增 `terminal-device-service` 作为企业受管现场交互终端设备治理真相源，Phase 2 只正式支持 `PDA`。
- 让 PDA 登录租户由已入网设备的 `tenantId` 决定，用户登录时不再选择租户。
- 将设备状态、版本策略、identity conflict 与清退动作统一收敛到 `DeviceAccessDecision`，避免 PDA BFF / Admin BFF 复制设备治理规则。

## 2. 不做什么

- 不做 WMS / MES 业务闭环。
- 不做仓库、车间、产线、工位、库区、库位绑定。
- 不做设备分组策略。
- 不做离线业务提交。
- 不做自动升级、热更新、后台静默安装。
- 不做 MDM / 企业应用市场集成。
- 不做实时远程控制、远程锁屏、远程擦除。
- 不做前台服务、后台常驻 heartbeat、开机自启。
- 不做蓝牙打印、NFC。
- 不做照片上传或业务附件服务。
- 不做账号安全 trusted device、MFA、登录历史、管理员会话管理。
- 不做生产设备、IoT、机台、普通资产管理。
- 不把 heartbeat 当作登录真相。
- 不把 `lastReportedAccount` 当作当前登录用户真相。

## 3. 上游依赖

- architecture:
  - [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md)
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
  - [13-response-and-exception-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/13-response-and-exception-architecture.md)
- services:
  - [terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md)
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- collaborations:
  - [managed-terminal-device-management.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md)
  - [terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/terminal-access-policy.md)
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
- contracts:
  - [pda-device-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-device-bff.md)
  - [pda-auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/pda-auth-bff-login.md)
  - [js-bridge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/pda/js-bridge.md)
  - 后续待新增 `terminal-device-service` 与 PDA / Admin BFF Phase 2 contracts
- adr:
  - [0006-terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0006-terminal-device-service.md)
  - [0005-terminal-access-policy.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0005-terminal-access-policy.md)

## 4. 当前结论

- Phase 2 新增 `terminal-device-service`，只管理企业受管现场交互终端设备。
- Phase 2 只正式支持 `PDA`，模型预留 `KIOSK / INDUSTRIAL_TABLET`。
- 管理员先创建短期、单次、可撤销 enrollment，PDA 扫码或输入 code 激活后才创建正式 `TerminalDevice`。
- Enrollment 是入网授权，不是设备本身；二维码只承载 enrollment code / token。
- 正常激活成功后设备直接进入 `ACTIVE`。
- `TerminalDevice` Phase 2 只绑定 `tenantId`。
- PDA 登录租户由 `TerminalDevice.tenantId` 决定，登录页不再选择租户。
- 同一 PDA 如需换租户，必须先 `DECOMMISSIONED`，再由新租户重新 enrollment。
- 生命周期状态为 `PENDING_APPROVAL / ACTIVE / DISABLED / LOST / MAINTENANCE / DECOMMISSIONED`。
- 除 `ACTIVE` 外，所有状态都阻断 PDA 登录和业务请求。
- `DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` 必须触发或请求 `auth-service` revoke 关联 PDA sessions。
- `DECOMMISSIONED` 是不可直接恢复终止状态；PDA 必须清理本地 session 与 `terminalDeviceId`。
- Heartbeat 只形成 runtime snapshot 与 presence 推断，不改变生命周期状态。
- Presence 推断值为 `ONLINE / STALE / OFFLINE / UNKNOWN`。
- App 版本策略归属 `terminal-device-service`，Phase 2 不做自动升级或 MDM。
- 设备看板必须区分管理真相与运行诊断；`lastReportedAccount` 不等于当前登录用户。
- PDA BFF 与 Admin BFF 只做外部契约适配和服务编排。

## 5. 契约真相位置

- `terminal-device-service` 长期 owner 与核心对象以 [terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/terminal-device-service.md) 为准。
- 跨服务协同以 [managed-terminal-device-management.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/managed-terminal-device-management.md) 为准。
- 架构决策以 [0006-terminal-device-service.md](/Users/acehood/Documents/GitHub/oes/docs/adr/0006-terminal-device-service.md) 为准。
- PDA Phase 2 HTTP 契约后续落到：
  - `docs/contracts/api-gateway/pda-device-management-bff.md`
  - `docs/contracts/api-gateway/admin-terminal-device-bff.md`
- 内部服务契约后续落到：
  - `docs/contracts/terminal-device-service/enrollment.md`
  - `docs/contracts/terminal-device-service/device-access-decision.md`
  - `docs/contracts/terminal-device-service/device-management.md`
  - `docs/contracts/terminal-device-service/runtime-snapshot.md`
  - `docs/contracts/terminal-device-service/version-policy.md`

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| architecture owner | 冻结 ADR、服务真相源与协同蓝图 | `docs/adr/**`, `docs/architecture/services/**`, `docs/architecture/collaborations/**` | 当前 Phase 2 设计讨论 | 架构边界与协同真相源 | in_progress |
| contract owner | 冻结 PDA BFF、Admin BFF 与 terminal-device-service contracts | `docs/contracts/api-gateway/**`, `docs/contracts/terminal-device-service/**` | 架构真相源与 feature packet | 黑盒契约 | pending |
| terminal-device-service owner | 实现服务领域模型、application use cases、repositories、gRPC / internal contracts 与审计 | `src/services/**/terminal-device-service/**`, 必要时新增服务 workspace | contracts 与 architecture | 设备治理服务 | pending |
| api-gateway owner | 接入 PDA BFF 与 Admin BFF，编排 auth / permission / terminal-device-service | `src/services/api-gateway/**` | BFF contracts 与 service contracts | 外部 HTTP 能力 | pending |
| auth-service owner | 支持按 `terminalDeviceId + terminal=PDA` 记录和 revoke sessions | `src/services/system/auth-service/**`, auth contracts | 协同蓝图与 contracts | PDA device session revoke 协作 | pending |
| PDA Android/Web owner | 实现入网、受限、版本过低、identity conflict 体验与本地清理 | `app/pda/**` | PDA BFF contracts 与 JS Bridge contract | 端侧设备治理体验 | pending |
| tenant-web owner | 实现 enrollment 管理、设备列表、详情、状态操作、版本策略 UI | `app/web/apps/tenant-web/**` | Admin BFF contracts | 后台设备管理 UI | pending |
| integration owner | 串联 enrollment、登录、禁用、session revoke、heartbeat、版本策略与验收 | `app/pda/**`, `src/services/**`, `docs/plans/features/**` | 所有 owner 输出 | Phase 2 验收结论 | pending |

## 7. 当前 slice

- slice:
  - PDA Device Management Phase 2 architecture and contract foundation
- scope:
  - ADR 与服务真相源
  - Managed Terminal Device Management 协同蓝图
  - PDA Phase 2 feature packet
  - PDA BFF / Admin BFF / terminal-device-service contract 草案
- ready definition:
  - 新增 `terminal-device-service` owner 边界已冻结
  - Enrollment、PDA 登录租户解析、生命周期状态、`DECOMMISSIONED`、`DeviceAccessDecision` 已进入稳定文档
  - PDA BFF 与 Admin BFF 的 Phase 2 黑盒契约可进入实现评审
  - 非目标明确，不牵引 WMS / MES、MDM、账号安全 trusted device 或仓库/车间绑定

## 8. 主线范围

- 本线程主线：
  - 建立 PDA 设备治理 Phase 2 最小闭环。
  - 保持 PDA 设备治理与账号安全 trusted device / MFA / 登录历史分离。
  - 保持设备治理与 WMS / MES 作业上下文分离。
  - 让设备准入和租户归属成为服务端可审计决策。
- 本线程不做：
  - Terminal-aware Account Security Phase 2。
  - WMS / MES PDA 业务闭环。
  - 仓库 / 车间 / 产线 / 工位 / 库区 / 库位绑定。
  - MDM、自动升级、实时远控。
- 偏移返回条件：
  - 若需要设计 MFA、trusted login device、登录历史或管理员会话管理，迁出到 Terminal-aware Account Security thread。
  - 若需要绑定仓库、车间、产线、工位、库区或库位，迁出到 WMS / MES 作业上下文设计 thread。
  - 若需要照片上传或业务附件，先冻结附件服务或 PDA upload contract。
  - 若需要 MDM、企业应用市场、远程锁屏 / 擦除，迁出到 MDM / enterprise device management thread。

## 9. 阻塞 / 依赖

- `auth-service` 需要支持 session metadata 记录 `terminalDeviceId`，并支持按 `terminalDeviceId + terminal=PDA` revoke。
- `permission-service` 需要新增 terminal device 管理权限码 seed 与授权判定。
- `api-gateway` 需要新增 PDA device management BFF 与 Admin terminal device BFF 契约。
- `app/pda` 需要具备入网、受限、版本过低与 identity conflict 页。
- `tenant-web` 后台需要具备 enrollment 与设备治理页面。
- 若项目尚无 `terminal-device-service` workspace，需要先按服务标准结构建立：
  - `application/`
  - `domain/`
  - `infrastructure/`
  - `interfaces/`
  - `modules/`

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-16 | Terminal-aware Account Security：登录历史、MFA、trusted login device、管理员会话管理 | Sidecar | 不阻塞 PDA 设备治理，但影响后台账号安全体验 | 已拆到独立 thread 推进 | 独立 feature packet / auth-service contracts | open |
| 2026-05-16 | 仓库 / 车间 / 产线 / 工位 / 库区 / 库位绑定 | Blocker-Later | Phase 2 只绑定 tenant，不影响当前最小闭环 | 后续作为 WMS / MES 作业上下文或 terminal assignment 单独设计 | future collaboration / feature packet | open |
| 2026-05-16 | MDM、自动升级、企业应用市场、远程控制 | Sidecar | 不进入 Phase 2 | 后续如有企业运维要求再单独设计 | future ADR / feature packet | open |

## 11. 验收标准

- 管理员可创建短期、单次、可撤销 PDA enrollment。
- PDA 首次启动可扫码或输入 enrollment code 完成入网。
- 入网成功后创建正式 `TerminalDevice`，状态为 `ACTIVE`，绑定唯一 `tenantId`。
- PDA 登录页不再选择租户，登录租户由 `terminalDeviceId` 解析。
- 不属于该租户或无 PDA terminal access 的账号无法登录。
- PDA session 记录 `terminal = PDA` 与 `terminalDeviceId`。
- PDA 只持久化设备 enrollment / `terminalDeviceId`；用户登录态不跨 App 关闭恢复，15 分钟 idle 后 logout，refresh token 短窗口仅用于持续作业中的 token rotation。
- 管理员可查看设备列表与详情，区分管理真相与 runtime snapshot。
- 管理员可执行 `DISABLED / LOST / MAINTENANCE / ACTIVE restore / DECOMMISSIONED`，高风险动作必填原因并审计。
- 非 `ACTIVE` 设备无法登录或发起业务请求。
- 设备进入 `DISABLED / LOST / MAINTENANCE / DECOMMISSIONED` 后，相关 PDA sessions 被服务端 revoke。
- `DECOMMISSIONED` 后 PDA 清理本地 session 与 `terminalDeviceId`，再次使用必须重新 enrollment。
- Heartbeat 更新 runtime snapshot 与 presence，但不改变生命周期状态。
- App 低于 `minSupportedAppVersion` 时阻断登录和业务请求，但允许 heartbeat / diagnostic logs。
- 设备治理关键动作产生审计记录。

## 12. 关闭条件

- ADR、服务真相源、协同蓝图、feature packet、BFF contracts 与 internal service contracts 全部冻结。
- `terminal-device-service` 最小领域模型与服务接口实现完成。
- PDA BFF、Admin BFF、auth-service session revoke、permission-service 权限码协作完成。
- app/pda 完成入网、受限、版本过低、identity conflict 四类体验。
- tenant-web 完成 Phase 2 后台最小闭环。
- 端到端验收覆盖 enrollment、登录、禁用、清退、heartbeat、版本策略与退役重入网。
- 文档中的非目标未被实现范围污染。

## 13. 实现与验证记录

Status, 2026-05-17:

- `terminal-device-service` 已实现 enrollment、device access decision、runtime snapshot、version policy、device management query/update、audit event query 与 unavailable event publish 最小闭环。
- PDA BFF 已接入 managed device enrollment、tenant-bound login metadata、bootstrap access decision、heartbeat runtime snapshot 与 diagnostic log access decision。
- Admin Terminal Device BFF 已接入 enrollment 管理、设备列表 / 详情 / 更新 / 状态变更、version policy、audit event，并在服务返回 revoke intent 时调用 `auth-service` 清理相关 PDA sessions。
- app/pda web 已实现 enrollment、restricted、identity conflict、version blocked 与 tenant-bound managed login flow。
- tenant-web 已实现 Phase 2 设备管理最小后台，包括 enrollment、设备看板、详情、状态操作、version policy 与审计列表。

Fresh verification:

- `pnpm proto:lint` passed.
- `DATABASE_URL='postgres://imkgsam:imkgsam@localhost:5432/terminaldevicedb' pnpm --filter terminal-device-service prisma:push` passed.
- `pnpm --filter auth-service prisma:push` passed.
- `pnpm --filter terminal-device-service test` passed: 5 suites / 61 tests.
- `pnpm --filter auth-service exec jest terminal-login-policy terminal-mfa-policy pda-account-resolution handle-terminal-device-unavailable --runInBand` passed: 8 suites / 34 tests.
- `pnpm --filter api-gateway exec jest src/modules/pda-bff src/modules/terminal-device-admin-bff --runInBand` passed: 6 suites / 13 tests.
- `pnpm --filter terminal-device-service build`, `pnpm --filter auth-service build`, and `pnpm --filter api-gateway build` passed.
- `pnpm --dir app/pda/web test` passed: 6 files / 26 tests.
- `pnpm --dir app/pda/web build` passed.
- `pnpm --dir app/web test:unit apps/tenant-web/src/api/bff/terminal-device/index.spec.ts apps/tenant-web/src/views/admin/terminal-device-management/index.spec.ts` passed: 2 files / 6 tests.
- `pnpm --dir app/web build:tenant` passed with the existing Node engine warning because local Node is `v25.5.0` while app/web declares `^20.19.0 || ^22.18.0 || ^24.0.0`.
- `node --test scripts/local/seed-system-admin.spec.mjs scripts/local/reset-to-system-admin.spec.mjs scripts/local/tenant-web-auth-test-fixtures.spec.mjs scripts/local/seed-tenant-web-auth-test-data.spec.mjs` passed: 10 tests.
- `pnpm --filter auth-service exec jest account-session-establishment terminal-login-policy terminal-mfa-policy pda-account-resolution handle-terminal-device-unavailable --runInBand` passed: 9 suites / 38 tests.
- `pnpm --filter api-gateway exec jest auth-response.mapper src/modules/pda-bff src/modules/terminal-device-admin-bff --runInBand` passed: 8 suites / 15 tests.
- `pnpm --filter terminal-device-service build`, `pnpm --filter auth-service build`, `pnpm --filter api-gateway build`, and `pnpm proto:lint` passed after the PDA auth live smoke closure.

Live smoke note:

- After the policy-service implementation files were committed by their owning thread, a focused PDA device-governance live smoke was run on 2026-05-17 with the existing local API Gateway on `9101` and `terminal-device-service` on `127.0.0.1:50057`.
- Smoke evidence: gRPC enrollment creation succeeded; `POST /api/v1/pda/device/enroll` activated the PDA with `decisionCode=ALLOW`; active heartbeat returned `ALLOW`; `DISABLED` returned `DEVICE_DISABLED` and `shouldClearLocalSession=true`; unsupported app version returned `APP_VERSION_UNSUPPORTED` and `requiredAction=UPGRADE_APP`; `DECOMMISSIONED` returned `DEVICE_DECOMMISSIONED`, `shouldClearLocalSession=true`, and `shouldClearLocalTerminalDeviceId=true`.
- A follow-up PDA auth login live smoke was run on 2026-05-17 after adding deterministic local seed data for the Meilong PDA smoke account.
- Auth smoke evidence: gRPC enrollment creation succeeded; `POST /api/v1/pda/device/enroll` activated a PDA with `decisionCode=ALLOW`; `POST /api/v1/pda/auth/login` returned `SUCCESS` and `nextStep=NONE`; the HTTP session returned `terminal=PDA`, `terminalDeviceId`, and `deviceBoundTenantId`; the decoded access token carried the same `terminalDeviceId` and `deviceBoundTenantId`; `GET /api/v1/pda/session/bootstrap` returned the same account, tenant, session device id, device id, and `decisionCode=ALLOW`.

## 14. 备注

- 当前 Phase 2 只做 PDA 设备治理，不把 KIOSK / INDUSTRIAL_TABLET 带入实现。
- 若后续发现 `DECOMMISSIONED` 误操作恢复需求，应作为高权限 break-glass 或审计补偿机制单独设计，不进入普通恢复流程。
