# 自助单会话退出

## 1. 目标

- 在“个人账户 > 账户安全 > 会话管理”中展示当前账号的全部活动会话。
- 支持对“其他活动会话”执行单条退出，而不是只能批量退出其他设备。
- 保持当前会话继续走既有登出入口，不把“退出当前会话”混入列表内的单条操作。
- 统一会话危险操作的确认交互，包括“退出此会话”“退出其他设备”“全部退出”。

## 2. 不做什么

- 不把本 feature 扩展成登录历史页面。
- 不引入管理员会话管理语义，不复用管理员撤销接口作为自助能力。
- 不允许通过新能力退出当前正在使用的会话。
- 不改变“退出其他设备”的现有自助边界：仍然只保留当前会话。
- 不改变“全部退出”的现有自助边界：仍然包含当前会话，并导致当前设备退出登录。
- 不扩展成自然人跨账号会话总览；当前页面继续只面向当前 `account` 上下文。

## 3. 上游依赖

- architecture:
  - [16-unified-web-account-context-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/16-unified-web-account-context-architecture.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- collaborations:
  - [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md)
- contracts:
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
- adr:
  -

## 4. 当前结论

- 本 feature 的定位是“当前账号活动会话的精确自助管理”，不是登录历史、审计分析或管理员会话调查。
- 会话列表中的新动作只面向“其他活动会话”；当前会话不显示“退出此会话”按钮。
- 单条退出属于新的自助语义，应新增自助契约与下游能力，而不是复用管理员撤销接口。
- 所有危险动作都需要确认：
  - `退出此会话`
  - `退出其他设备`
  - `全部退出`
- `全部退出` 继续包含当前会话；成功后当前设备进入已登出状态并返回登录流程。
- 会话列表继续只展示“活动会话”主视图；单条退出成功后目标会话从列表中消失，而不是留在当前页显示“已撤销”。
- 前端以重新拉取 `GET /auth/sessions` 作为列表刷新真相源，不在本地长期维护手工删行状态。

## 5. 契约真相位置

- 当前已存在相关契约：
  - [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - [session.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/auth-service/session.md)
- 本 feature 预期新增或更新的契约：
  - `POST /auth/sessions/:sessionId/logout`
  - `LogoutSession` 或等价的自助单会话退出下游能力
  - “目标会话不可操作 / 不允许操作当前会话”的稳定错误语义
- 当前状态：
  - 以上新增契约尚未正式写入契约真相源；本 packet 只冻结 feature 主线与预期增量，不把未落地接口伪装为已完成契约

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| design owner | 冻结自助单会话退出的产品语义、交互边界、契约增量与非目标 | `docs/plans/features/**`, 必要时 `docs/contracts/**` | 当前自助会话契约、账户安全页现状与本 feature 目标 | 冻结后的 feature packet 与后续契约增量要求 | completed |
| implementation owner | 实现自助单会话退出闭环，覆盖 auth-service、auth-bff 与 tenant-web 会话页交互 | `src/services/system/auth-service/**`, `src/services/api-gateway/**`, `app/web/apps/tenant-web/**`, 必要时 `docs/contracts/**` | feature packet、现有 self-service session 契约 | 可运行实现与验证结果 | pending |
| review / integration owner | 审核自助语义是否与管理员撤销、登录历史与当前登出边界保持分离 | 只读全局，必要时最小修正 | design + implementation 结果 | review 结论、集成验证结果 | pending |

## 7. 当前 slice

- slice:
  - 冻结自助单会话退出第一阶段设计
- scope:
  - 会话列表中的“退出此会话”操作
  - “退出其他设备”确认弹窗
  - “全部退出”确认弹窗与包含当前会话的明确语义
  - 自助单会话退出的 BFF / auth-service 契约增量
- ready definition:
  - 已明确当前会话不显示单条退出
  - 已明确全部退出包含当前会话
  - 已明确成功后列表通过重新拉取保持一致
  - 已明确管理员撤销语义不进入当前 feature

## 8. 主线范围

- 本线程主线：
  - 冻结账户安全页会话管理中的单条退出语义与交互
  - 为后续实现线程提供唯一主线依据
- 本线程不做：
  - 登录历史页面
  - 管理员会话管理增强
  - 异常登录分析与安全通知联动
  - 跨账号会话聚合
- 偏移返回条件：
  - 若需要把会话页扩展成历史页、审计页或管理员调查页，应停止并拆成独立 feature

## 9. 阻塞 / 依赖

- 当前自助 BFF 已具备：
  - `GET /auth/sessions`
  - `POST /auth/logout`
  - `POST /auth/logout-other-devices`
  - `POST /auth/logout-all`
- 当前账户安全页会话管理已有：
  - 会话列表展示
  - “退出其他设备”
  - “全部退出”
  但尚无“退出此会话”单条动作。
- 当前 `auth-service` 契约已区分：
  - 自助会话能力
  - 管理员会话查看与单条撤销
  当前 feature 必须保持这两条语义分离。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-15 | “退出此会话”是否包含当前会话 | Blocker-Now | 直接影响契约与 UI 行为 | 已确认只针对其他活动会话；当前会话继续走既有登出入口 | 当前 feature packet | closed |
| 2026-04-15 | 危险操作是否统一要求确认 | Blocker-Now | 影响前端一致性与误操作风险 | 已确认“退出此会话”“退出其他设备”“全部退出”均需确认 | 当前 feature packet | closed |
| 2026-04-15 | 全部退出是否包含当前会话 | Blocker-Now | 影响现有语义与成功后跳转行为 | 已确认保持现有语义：包含当前会话，成功后进入已登出状态 | 当前 feature packet | closed |
| 2026-04-15 | 单条退出成功后是否保留在列表中显示已撤销 | Blocker-Now | 影响页面定位是否变成历史页 | 已确认当前页继续只展示活动会话；成功后目标会话从列表消失 | 当前 feature packet | closed |
| 2026-04-15 | 登录历史页面 | Sidecar | 若混入会把活动会话管理与历史查询边界打乱 | 继续后置，后续单独做 feature design | [backlog.md](/Users/acehood/Documents/GitHub/oes/docs/plans/backlog.md) | open |

## 11. 验收标准

- 用户能在账户安全页看到当前账号下的活动会话列表。
- 当前会话明确标记为“当前设备”，且不显示“退出此会话”按钮。
- 其他活动会话显示“退出此会话”按钮。
- 点击“退出此会话”会弹确认。
- 单条退出成功后，目标会话从活动列表消失。
- 点击“退出其他设备”会弹确认，成功后只保留当前会话。
- 点击“全部退出”会弹确认，并明确说明包含当前会话。
- “全部退出”成功后，当前页面进入已登出状态并返回登录流程。
- 自助单会话退出不复用管理员撤销语义，不扩展成管理员会话管理页面。

## 12. 关闭条件

- feature packet 已冻结为当前阶段执行真相。
- 自助单会话退出所需的 BFF / auth-service 契约增量已明确。
- 后续实现线程可以在不重新讨论产品边界的前提下直接推进实现。

## 13. 当前实现状态

- 已新增自助单会话退出链路：
  - `POST /auth/sessions/:sessionId/logout`
  - `LogoutSession`
- `auth-service` 已支持：
  - 校验当前会话
  - 拒绝通过该能力操作当前会话
  - 拒绝跨当前账号上下文操作目标会话
  - 删除目标会话并返回成功结果
- `api-gateway` 已支持：
  - 自助单会话退出 HTTP 入口
  - 通过当前 JWT 上下文向下游传递 `userId`、`currentSessionId` 与 `targetSessionId`
  - `logout-other-devices` / `logout-all` 的当前账号语义文案与状态码收口
- `tenant-web` 账户安全页已支持：
  - 仅对其他活动会话显示“退出此会话”
  - 单条退出确认弹窗
  - “退出其他设备”确认弹窗
  - “全部退出”确认弹窗
  - 成功后通过重新拉取 `GET /auth/sessions` 刷新活动会话列表

## 14. 已完成验证

- `auth-service`
  - `pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/logout-session.handler.spec.ts src/interfaces/grpc/auth.grpc.controller.spec.ts --runInBand`
  - `pnpm --dir src/services/system/auth-service build`
- `api-gateway`
  - `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts --runInBand`
  - `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/interfaces/http/controllers/auth.integration.spec.ts --runInBand`
  - `pnpm --dir src/services/api-gateway build`
- `tenant-web`
  - `pnpm --dir app/web/apps/tenant-web typecheck`
  - `pnpm --dir app/web/apps/tenant-web build`

## 15. 备注

- 当前判断该 feature 属于范围清晰、可直接进入执行的 feature，不需要额外建立 design workspace。
- 若后续扩展出“登录历史”“异常登录提示”“安全通知联动”等长期议题，应拆成独立 feature 或 design workspace，而不是继续追加到本 packet。
