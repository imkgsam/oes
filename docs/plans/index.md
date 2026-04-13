# OES 实施计划索引

## 1. 目的

本目录用于承载 OES 的阶段性实施计划、专题规划与执行拆分文档。

与 `docs/architecture/` 的关系如下：

- `docs/architecture/` 负责稳定设计与长期边界
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
5. `frontend-planning-summary.md`
   - 前端高层结论与阅读导航，不承载正式架构正文
6. `tenant-web-frontend-architecture.md`
   - `tenant-web` 前端工程架构主文档
7. `tenant-web-information-architecture.md`
   - `tenant-web` 产品级信息架构主文档
8. `tenant-web-code-refactor-checklist.md`
   - `tenant-web` 当前阶段代码改造、验证状态与后置测试任务
9. `tenant-web-vben-implementation-plan.md`
   - `tenant-web` 对 `vue-vben-admin` 底座的适配与本地化说明
10. `authorization-layering-implementation-plan.md`
   - 粗粒度权限、`checkResource`、`buildQueryScope`、policy 分类、`common/authorization` 迁移与跨服务派生协作授权实施计划
11. `ai-platform-foundation-plan.md`
   - AI 平台基础能力实施计划
12. `machine-principal-foundation-alignment.md`
   - 机器主体基础对齐计划
13. `notification-service-foundation-plan.md`
   - Notification Service 平台基础实施计划
14. `communication-mailbox-foundation-plan.md`
   - Communication And Mailbox 平台基础实施计划
15. `notification-service-contract-draft.md`
   - Notification Service 第一版契约草案
16. `communication-service-contract-draft.md`
   - Communication Service 第一版契约草案
17. `observability-and-audit-foundation-plan.md`
   - 可观测性与审计基础实施计划

## 3. 使用规则

- 计划文档用于记录当前阶段的推进结论，不替代项目级稳定架构文档
- 若计划文档涉及稳定边界变更，应回写 `docs/architecture/` 或新增 ADR
- 计划文档应尽量保持结论明确、范围清晰、便于后续线程接续
- 随时出现的灵感先记录到 `ideas.md`
- 已明确值得推进、但尚未完成设计的功能与议题先记录到 `candidates.md`
- 已确认后置或从活跃 feature 派生、但当前不做的事项记录到 `backlog.md`
- 跨线程 feature 应先建立 `features/<feature-key>.md` 作为唯一协作面板，再拆分多个 owner thread 推进
