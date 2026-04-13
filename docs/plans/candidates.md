# OES Feature / Design Candidates

## 1. 目的

本文档用于记录已经明确值得推进，但尚未完成设计、还不能直接进入实现的候选功能与候选设计议题。

它位于：

- `ideas.md` 之后
- `feature packet` 与正式 `plan` 之前

## 2. 使用规则

- 当一个点已经不只是灵感，但边界、契约、实施方式尚未冻结时，记录到这里
- 如果某条候选议题涉及高影响边界，应先升级到 architecture / ADR
- 如果某条候选议题已经完成设计并进入执行，应迁出为独立 feature packet 或正式 plan

## 3. 候选条目

| 日期 | 名称 | 类型 | 当前判断 | 下一步 |
| --- | --- | --- | --- | --- |
| 2026-04-12 | 系统内 Robot / 自动化执行服务 | Architecture Candidate | 当前已有 machine principal、AI 工具治理、内部服务信任、权限与审计底座，但尚无完整 Robot / Automation 执行主体设计；历史草稿里的执行主体、触发、执行实例、动作语义、补偿、重试、超时、ActionRegistry 等思路可以作为候选素材，但服务拆分、身份模型、工作流关系、动态扩展边界均未冻结 | 后续单独讨论并决定是否升级到 architecture / ADR |
| 2026-04-12 | 登录后支持从头像菜单切换 Tenant / Workspace / Account Context | Feature Candidate | 该能力会改变页面、数据范围、权限摘要、菜单与 operator context，不能只按前端下拉菜单处理；需要明确 tenant、workspace、account/context 的边界，以及切换后 session、权限、审计与导航如何刷新 | 后续单独做 feature design，形成 feature packet |
| 2026-04-12 | AI Decision Context 模型 | Architecture Candidate | `docs/architecture/04-ai-architecture.md` 已记录参考方向，但 `DecisionType / ContextDefinition / ContextBuilder / ContextPackage / Suggestion` 是否作为正式对象模型尚未冻结 | 后续单独讨论是否升级为 architecture / ADR |
| 2026-04-12 | 优化 tenant-web 锁屏：取消每次锁屏前输入临时密码，并支持自动锁屏 | Feature Candidate | 当前问题已经明确，但锁屏目的、安全语义、解锁凭据、独立锁屏密码与自动锁屏策略仍未冻结，暂时还不能直接进入实现 | 后续先做 feature design，再决定是否拆成独立 feature packet |
