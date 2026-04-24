# OES 实施计划索引

## 1. 目的

本目录用于承载 OES 的阶段性实施计划、专题规划与执行拆分文档。

与 `docs/architecture/` 的关系如下：

- `docs/architecture/` 负责稳定设计与长期边界
- `docs/architecture/services/` 负责单个服务职责真相
- `docs/architecture/collaborations/` 负责跨服务协同真相
- `docs/plans/` 负责阶段计划、专题推进路径与实施顺序

## 2. 当前计划文档

1. `backlog.md`
   - 已确认后置事项与从活跃 feature 派生、但当前不做的 sidecar work
2. `features/README.md`
   - 跨线程 feature 的协作面板模板与使用规则
3. `ideas.md`
   - 随时记录的灵感池，目标是防遗忘，不直接进入实现
4. `candidates.md`
   - 候选功能与候选设计议题，位于灵感与正式 feature 之间
5. `designs/README.md`
   - 长周期设计过程工作台规则与模板入口；仅在大服务、长设计或暂不能直接进入 feature packet 时使用
6. `frontend-planning-summary.md`
   - 前端高层结论与阅读导航，不承载正式架构正文
7. `tenant-web-frontend-architecture.md`
   - `tenant-web` 前端工程架构主文档
8. `tenant-web-information-architecture.md`
   - `tenant-web` 产品级信息架构主文档
9. `tenant-web-code-refactor-checklist.md`
   - `tenant-web` 当前阶段代码改造、验证状态与后置测试任务
10. `tenant-web-vben-implementation-plan.md`
   - `tenant-web` 对 `vue-vben-admin` 底座的适配与本地化说明
11. `authorization-layering-implementation-plan.md`
   - 粗粒度权限、`checkResource`、`buildQueryScope`、policy 分类、`common/authorization` 迁移与跨服务派生协作授权实施计划
12. `ai-platform-foundation-plan.md`
   - AI 平台基础能力实施计划
13. `machine-principal-foundation-alignment.md`
   - 机器主体基础对齐计划
14. `notification-service-foundation-plan.md`
   - Notification Service 平台基础实施计划
15. `communication-mailbox-foundation-plan.md`
   - Communication And Mailbox 平台基础实施计划
16. `notification-service-contract-draft.md`
   - Notification Service 第一版契约草案
17. `communication-service-contract-draft.md`
   - Communication Service 第一版契约草案
18. `observability-and-audit-foundation-plan.md`
   - 可观测性与审计基础实施计划
19. `mfa-login-policy-and-factor-orchestration-implementation-plan.md`
   - 登录场景 MFA 策略、因子优先级与登录续流编排实施计划
20. `tenant-org-service-foundation-implementation-plan.md`
   - Tenant-Org Service 第一阶段实现、迁移与验证计划
21. `tenant-org-service-migration-plan.md`
   - Tenant 与 org tree 从 `identity-service` 迁入 `tenant-org-service` 的迁移计划
22. `features/hr-service-foundation.md`
   - HR Service minimum 第一阶段 feature packet
23. `hr-service-minimum-implementation-plan.md`
   - HR Service minimum 第一阶段 contract-realization、服务骨架与实现拆分计划

## 3. 使用规则

- 计划文档用于记录当前阶段的推进结论，不替代项目级稳定架构文档
- 计划文档不承载服务职责真相；服务“负责什么 / 不负责什么”应回写 `docs/architecture/services/*.md`
- 计划文档不承载可复用的跨服务协同规则；相关内容应回写 `docs/architecture/collaborations/*.md`
- 长周期设计过程应优先放在 `docs/plans/designs/*.md`，并在冻结后回写唯一真相源
- 如果设计已经足够清晰并可直接进入执行主线，应直接建立 `docs/plans/features/*.md`，不要求额外建立 design workspace
- 若计划文档涉及稳定边界变更，应回写 `docs/architecture/` 或新增 ADR
- 计划文档应尽量保持结论明确、范围清晰、便于后续线程接续
- 随时出现的灵感先记录到 `ideas.md`
- 已明确值得推进、但尚未完成设计的功能与议题先记录到 `candidates.md`
- 已确认后置或从活跃 feature 派生、但当前不做的事项记录到 `backlog.md`
- 跨线程 feature 应先建立 `features/<feature-key>.md` 作为唯一协作面板，再拆分多个 owner thread 推进
- feature packet 应优先引用服务职责文档、协同蓝图与 contracts，而不是重复解释长期设计正文
- design workspace 只用于保持设计过程上下文，不得长期替代 services / collaborations / contracts / feature packet
