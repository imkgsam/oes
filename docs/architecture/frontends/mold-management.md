# Mold Management Frontend Responsibilities

## 1. Scope

本文只定义 MES 模具管理在 `tenant-web` 与 PDA 间的稳定交互边界。领域对象、生命周期、命令、查询和业务校验以 [mes-service.md](../services/mes-service.md) 与 [MES mold contract](../../contracts/api-gateway/mes-mold-management.md) 为准。

## 2. Responsibility Split

| Capability | tenant-web | PDA |
| --- | --- | --- |
| MoldDesign / MasterMold | 管理设计、主模与基础配置。 | 不提供。 |
| ProductionMold identity | 预登记、生成二维码、打印标签、维护台账。 | 扫描已存在标签并确认到货；不得创建模具身份或打印标签。 |
| Physical movement / drying | 查询、配置资源、审计修正。 | 扫描模具与目标 StorageResource 记录移动；干燥区进出仍是移动。 |
| Installation | 查询历史、处理异常修正。 | 扫描模具和 WorkCenter，选择位置并安装。 |
| Readiness / maintenance | 查询及异常修正。 | 确认可用于生产或退回维护。 |
| Usage | 汇总、查询历史及审计修正。 | 按 WorkCenter 对 READY 模具提交批量使用量。 |
| Scrap / removal | 台账标记报废并查询历史。 | 现场标记、确认物理移除。 |
| Life counter | 查询并以审计理由调整。 | 只读展示。 |

## 3. Interaction Rules

- `PRE_REGISTERED` 模具必须先由 PDA 扫描确认到货，才可移动、安装、ready、计次或报废。
- 第一阶段安装位置使用 `workCenterRef + moldPositionIndex`，索引从 1 开始并保持连续；移入/移出由 MES 原子调整顺序。
- 安装后先进入维护/准备状态；只有 READY 且存在 active installation 的模具可提交使用量。
- PDA usage batch 中每行必须引用 ProductionMold、ToolingInstallation 且数量大于 0；任一行失败时整批不写入。
- installed mold 报废先进入 pending removal；确认物理移除后关闭 installation 并完成报废。
- PDA 是现场事实的正常入口；tenant-web 的修改属于治理或异常修正，必须要求权限与审计理由。
- 两个前端都只调用 BFF contract，不复制 MES 生命周期或直接写数据库。

## 4. Acceptance

- Web 不承担现场高频扫码动作，PDA 不承担主数据设计与台账治理。
- 所有 mutation 由 MES owner 验证状态、资源、tenant、operator 与幂等。
- 当前放置、安装、ready、usage、scrap 与 life history 均来自 MES read model。
- 终端错误、权限拒绝、并发冲突和业务前置条件失败具有可区分反馈。
