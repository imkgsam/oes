# Public Entry Navigation Design

## 0. 文档控制

```text
designKey: public-entry-navigation-design
designStatus: DESIGN_FROZEN_PENDING_FEATURE_PACKET
implementationStatus: NOT_IMPLEMENTED
lastUpdatedAt: 2026-06-15 00:00:00 Asia/Shanghai
lastUpdatedBy: Codex
supersedes: 2026-06-15 thread discussion about ShortLink and BusinessCard menu placement
truthSource: pending docs/plans/features/public-entry-navigation-entries.md or equivalent implementation packet
doNotUseAsStableSource: false
conflictResolution: 当本文与更早讨论冲突时，以本文冻结结论为准；若后续 architecture / contracts / feature packet 明确覆盖本文，以后续稳定真相源为准。
```

## 1. 目标

冻结 Public Entry 相关入口在 tenant-web 管理导航、员工详情与个人自助入口中的放置方式，避免把 ShortLink、BusinessCard 与 HR 员工主数据或权限治理菜单混在一起。

## 2. 当前范围

本文负责：

- 冻结 `员工数字名片`、`公开短链`、`我的名片` 的导航归属。
- 冻结员工详情页与名片管理页之间的关系。
- 给后续 permission-service navigation seed 与 tenant-web route 调整提供依据。

本文不负责：

- 改写 ShortLink 或 BusinessCard 服务职责。
- 重新定义 HR / Identity / Contact Asset owner 边界。
- 设计 CRM 回流、Campaign、二维码资产管理或自定义短链域名。
- 直接定义最终代码实现计划。

## 3. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-15 | 新增管理类一级菜单 `公开触点`，承载 public-entry-service 相关公开入口能力。 | tenant-web 管理导航、permission navigation seed | permission-service navigation seed、tenant-web routes |
| 2026-06-15 | `员工数字名片` 放在 `公开触点` 下，作为 BusinessCard 管理页。 | BusinessCard 管理入口 | tenant-web routes、navigation seed |
| 2026-06-15 | `公开短链` 放在 `公开触点` 下，作为 ShortLink 通用治理页，不作为名片子页面。 | ShortLink 管理入口 | tenant-web routes、navigation seed |
| 2026-06-15 | `我的名片` 是员工自助入口，不进入管理员菜单。 | employee self-view、个人中心、工作台 | tenant-web profile/workbench follow-up |
| 2026-06-15 | 员工详情页只显示名片状态摘要与跳转入口，不承载完整名片配置。 | HR 员工详情页、BusinessCard 管理页 | HR workspace follow-up、BusinessCard route |

## 4. 推荐导航结构

```text
公开触点
- 员工数字名片
- 公开短链

员工详情页
- 名片状态摘要
- 查看 / 进入名片配置入口

个人中心 / 工作台
- 我的名片
```

## 5. 边界说明

`公开触点` 是管理类入口分组，不是新的业务真相 owner。它用于在 tenant-web 中组织 public-entry-service 相关能力。

`员工数字名片` 消费 HR、Identity、Contact Asset 与 ShortLink 能力，但不拥有员工、任职、账号、联系方式正文或 ShortLink 生命周期真相。

`公开短链` 是 ShortLink 通用治理入口。它管理 public URL、ShortLink lifecycle、target reference、QR 与访问统计，不读取或拥有 BusinessCard 展示内容。

`我的名片` 是 authenticated self-view 场景。它应由当前登录 account / employee context 派生，不依赖管理员菜单可见性，也不要求管理员权限码。

员工详情页可以帮助用户发现名片状态，但不应内嵌完整名片配置，避免把公开入口治理能力误归入 HR 员工主数据维护。

## 6. 建议 entryKey

```text
public-entry.business-cards
public-entry.short-links
```

若导航系统需要父级 entryKey，可以使用：

```text
public-entry.touchpoints
```

`我的名片` 暂不进入 admin navigation seed。后续若个人中心或工作台需要 entryKey，应在对应自助导航体系中单独设计，不复用管理员入口。

## 7. 后续实现建议

- 在 permission-service navigation foundation 中注册 `public-entry.business-cards` 与 `public-entry.short-links`。
- 将 tenant admin route 中当前挂在 `/admin` 权限治理组下的 ShortLink / BusinessCard 管理页迁入新的 `公开触点` route group。
- 给合适的管理角色默认开放 `public-entry.business-cards` 与 `public-entry.short-links` 可见性。
- 保留或迁移 `我的名片` 路由，但不把它加入管理员导航 seed。
- 后续在员工详情页增加名片状态摘要与跳转入口时，必须只消费 BusinessCard 查询能力，不在 HR 内重定义名片配置模型。

## 8. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-15 | `公开触点` 一级菜单是否需要独立 icon 与 order 固定值 | 需要结合当前 tenant-web 菜单排序实现确认 | implementation packet 中按现有 route/menu 规则确定 |
| 2026-06-15 | `我的名片` 最终落在个人中心还是工作台，或两处都放 | 本轮只冻结“不进管理员菜单” | 后续个人中心 / 工作台 UX 设计时确认 |

## 9. 恢复入口

下次继续前先读：

- `docs/architecture/services/public-entry-service.md`
- `docs/plans/features/shortlink-public-entry-phase-1.md`
- `docs/plans/features/employee-digital-business-card.md`
- `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- `src/services/system/permission-service/src/scripts/navigation-foundation.ts`

当前推荐下一步：

- 创建一个小型 feature packet 或实施计划，按本文调整 navigation seed 与 tenant-web route group。
