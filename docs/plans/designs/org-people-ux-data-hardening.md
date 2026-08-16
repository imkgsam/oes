# org-people UX data hardening Design

```text
designKey: ORG-PEOPLE-UX-DATA-HARDENING
designStatus: ACTIVE_DESIGN_WORKSPACE
```

> 涉及 HR `Employee / Employment`、员工生命周期、正式 `人 -> org` 归属或 onboarding owner 边界时，以 [hr-service.md](../../architecture/services/hr-service.md) 为准；涉及 permission-service 的服务职责、核心对象或 owner 边界时，以 [permission-service.md](../../architecture/services/permission-service.md) 为准；本文只记录组织与人员 UX / data hardening 设计过程。

## 1. 目标

- 收敛 `tenant-web` 中“组织与人员”入口的最终信息架构与交互方案。
- 在不突破 `tenant-org-service`、`hr-service`、`identity-service`、`permission-service` owner 边界的前提下，提升页面可读性与手工测试可用性。
- 设计本地 / dev 联调所需的 3 个租户、组织、员工、任职、账号接入测试数据，为后续 seed 脚本实现提供唯一恢复入口。

## 2. 当前范围

- 本 workspace 负责：
  - `tenant-web` `组织与人员` 页面内部 IA 与交互收敛
  - `员工` Tab 与 `组织` Tab 的展示结构
  - 成员目录、成员详情 Drawer、组织详情 Drawer 的字段边界
  - 只读聚合所需的最小 BFF read model enhancement
  - 本地 / dev 组织与人员测试数据设计
- 本 workspace 不负责：
  - 更改 `tenant-org-service` / `hr-service` schema
  - 新增完整 org admin / org scope / organization leader owner 体系
  - 完整多任职管理
  - 外部联系人、客户、供应商、协作者模型
  - 独立账号管理后台或权限管理后台设计

## 3. 涉及对象

- services:
  - `api-gateway`
  - `tenant-org-service`
  - `hr-service`
  - `party-service`
  - `identity-service`
  - `auth-service`
  - `permission-service`
- frontend areas:
  - `app/web/apps/tenant-web/src/views/admin/organization-people.vue`
  - `app/web/apps/tenant-web/src/views/admin/employee-management-workspace.vue`
  - `app/web/apps/tenant-web/src/views/admin/org-management-workspace.vue`

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-04-27 | `组织与人员` 入口保留统一页面，但内部固定为 `员工` / `组织` 两个 Tab。 | tenant-web IA | 当前 workspace |
| 2026-04-27 | `员工` Tab 不再使用组织树，改为筛选条 + 成员目录 + 右侧 Drawer 详情。 | tenant-web 成员页 UX | 当前 workspace |
| 2026-04-27 | `组织` Tab 保留组织树，点击节点打开右侧 Drawer 详情。 | tenant-web 部门页 UX | 当前 workspace |
| 2026-04-27 | 员工 Drawer 与组织 Drawer 内部都使用 Tab 分区展示不同范围的数据。 | tenant-web detail UX | 当前 workspace |
| 2026-04-27 | `组织负责人` 语义固定为“业务责任人”，当前只要求显示名字。 | tenant-org / HR / BFF read model | 当前 workspace |
| 2026-04-27 | `组织负责人` 不是权限管理员，不得误建模为 org permission owner。 | 边界治理 | 当前 workspace |
| 2026-04-27 | 若后端当前无法提供负责人、成员摘要、子部门摘要，则前端明确显示 backend gap，不伪造。 | tenant-web detail UX | 当前 workspace |
| 2026-04-27 | 本地 / dev 仅重建 3 个新租户测试数据，陈双鹏固定为系统管理员且同时是美隆租户管理员。 | seed 设计 | 当前 workspace |

## 5. 根因分析

### 5.1 当前页面不够清晰的根因

- 成员页目录当前更接近“技术清单”，主识别锚点偏 `employeeCode`，而不是“人”。
- 成员目录缺少登录接入状态等管理信号，难以快速判断谁可登录、谁待补全接入。
- 当前成员三栏布局中，左侧组织树占据了大量注意力，使成员页没有聚焦在“找人 / 看人 / 操作当前成员”。
- 组织页虽然已经是左树右详情，但详情区仍偏字段陈列，缺少“当前正在管理哪个组织”的强上下文感。
- 技术字段目前过于靠前，业务字段优先级不够稳定。

### 5.2 当前数据不够完整的根因

- 现有本地 seed 主要覆盖 `tenant-web auth` 演示链路，只重建 `authdb / identitydb / permissiondb / tenantorgdb`，尚未覆盖 `party-service` 与 `hr-service` 的员工 / 任职真相。
- 现有 `tenant-org-service` seed 只有 root org，不足以支撑组织树和部门级手测。
- 现有 HR 最小读模型仅稳定提供 `employeeCode / tenantPartyId / lifecycleStatus / employment` 等字段，成员页所需的“姓名”未聚合到 BFF 读模型。
- 负责人摘要当前不属于既有稳定读模型范围，因此组织页只能降级显示 backend gap。

## 6. UI 设计

### 6.1 页面级结构

- 页面入口继续使用统一路径 `/settings/organization-people`。
- 页面内部使用两个固定 Tab：
  - `员工`
  - `组织`
- 页面级 URL 只保留当前主 Tab，不长期持有 `employeeId`、`orgUnitId` 级详情状态。

### 6.2 员工 Tab

布局：

- 顶部筛选条
- 全宽成员目录列表
- 点击成员后打开右侧 Drawer

筛选条：

- 关键字
- 部门筛选
- 生命周期筛选：
  - 全部
  - 在职
  - 已离职
  - 待入职
- 登录接入状态筛选：
  - 已开通
  - 待继续完成
  - 未开通

成员目录目标字段：

- 姓名
- 员工编码
- 主部门
- 任职状态
- 登录接入状态
- 当前岗位：仅在现有读模型支持时显示

Drawer：

- 默认宽度优先 `中等`
- 若内容密度不足以承载，则提升到 `较宽`
- 默认打开 `概览` Tab

员工 Drawer Tabs：

- `概览`
  - 姓名
  - 员工编码
  - 当前租户
  - 生命周期
  - 当前部门
  - 登录接入状态
  - 关键动作：调岗、结束任职、开通登录、继续完成接入、前往账号管理
- `任职`
  - 当前任职
  - 任职记录
- `账号与访问`
  - 账号摘要
  - 登录方式摘要
  - 角色摘要
  - 待处理原因
- `档案`
  - 员工基础信息
  - 技术标识

### 6.3 组织 Tab

布局：

- 页面主体保留组织树
- 点击组织节点后打开右侧 Drawer

组织树目标：

- 强化当前选中态
- 以名称和层级为第一优先级
- 类型与状态弱化展示
- 不伪造成员数或负责人

Drawer：

- 默认宽度优先 `中等`
- 若内容承载不足则提升到 `较宽`
- 默认打开 `概览` Tab

组织 Drawer Tabs：

- `概览`
  - 部门名称
  - 类型
  - 状态
  - 上级部门
  - 负责人名字
- `成员`
  - 部门下成员摘要
  - 子部门
- `技术信息`
  - 节点 ID
  - 组织路径
  - depth
  - organization TenantParty 相关字段

### 6.4 负责人规则

- 当前只显示一个负责人名字。
- 负责人语义固定为业务责任人。
- 不是权限管理员。
- 不是 `tenant-org-service` 自己拥有的人事真相。
- 只能通过受控只读聚合展示，不能把“负责人 owner”写回 `tenant-org-service`。

## 7. 最小 read model enhancement

### 7.1 员工目录补姓名

目标：

- 让成员目录优先显示“姓名 / 员工编码”，而不是只有 `employeeCode`。

来源：

- `tenantPartyId -> party-service TenantParty.displayName`

约束：

- 这是只读聚合，不改变 `Employee` owner。
- 不改 HR schema。
- 若姓名缺失，则优雅降级到员工编码。

### 7.2 员工目录复用登录接入状态

目标：

- 在成员目录直接展示 `已开通 / 待继续完成 / 未开通`。

来源：

- 复用现有 account access summary 语义。

约束：

- 仍然只是成员上下文摘要，不把成员页扩成账号管理页。

### 7.3 组织详情补负责人名字

目标：

- 在组织 Drawer `概览` 中显示负责人名字。

结果形态：

- `leaderName?: string`

约束：

- 只读摘要。
- 不扩成权限管理员体系。
- 若当前无可证明来源，则必须显示 backend gap，而不是伪造。

## 8. backend gap 降级规则

- 若负责人名字不可得：
  - 显示 `Backend gap：当前读模型尚未提供组织负责人名字。`
- 若部门下成员摘要不可得：
  - 显示 `Backend gap：当前读模型尚未提供部门成员摘要。`
- 若子部门摘要不可得：
  - 继续使用组织树作为结构真相；Drawer 内摘要区可显示明确空态或 backend gap。
- 若成员岗位信息不可得：
  - 成员目录与详情不伪造岗位字段，保持空缺或不渲染该项。

## 9. Seed 设计

### 9.1 总体原则

- 仅针对本地 / dev 联调数据。
- 先清空当前测试租户信息，再重建 3 个新租户。
- 不修改生产数据。
- 不手工直写生产库。
- 不修改 schema；如实施中发现必须修改 schema，必须暂停并升级汇报。

### 9.2 三个租户画像

#### 9.2.1 美隆陶瓷

定位：

- 主手测租户
- 制造型企业
- 中等复杂度

组织：

- 公司根
- 总经办
- 人力行政部
- 财务部
- 外贸销售部
- 国内销售部
- 采购部
- 仓储部
- 制造中心
- 成型车间
- 烧成车间
- 品质部

成员覆盖：

- 陈双鹏：系统管理员，同时是美隆租户管理员
- 多个在职成员
- 至少 1 名 `OFFBOARDED`
- 至少 1 名 `PREBOARDING`
- 至少 1 名未开通登录成员
- 至少 1 名接入 `PENDING` 成员
- 至少 1 名有调岗历史成员

#### 9.2.2 海晟国际贸易

定位：

- 扁平贸易型企业

组织：

- 公司根
- 总经理办公室
- 外贸一部
- 外贸二部
- 单证客服部
- 财务结算部

成员覆盖：

- 1 名租户管理员
- 多名销售
- 1 名有 ended employment 历史的员工
- 1 名已建员工但未开通登录成员

#### 9.2.3 北辰零售运营

定位：

- 分支层级型组织

组织：

- 公司根
- 总部
- 华南大区
- 华东大区
- 深圳门店
- 广州门店
- 杭州门店
- 电商运营部

成员覆盖：

- 1 名租户管理员
- 深层组织成员
- 至少 1 个空部门
- 至少 1 名 `PENDING` 接入成员
- 至少 1 名 `OFFBOARDED` 成员
- 至少 1 名从总部调岗到大区的成员

### 9.3 统一状态矩阵

- `ACTIVE` + 已开通登录
- `ACTIVE` + 未开通登录
- `ACTIVE` + 接入 `PENDING`
- `PREBOARDING`
- `OFFBOARDED`
- 有调岗历史
- 有空部门
- 有多人同部门
- 有深层子部门

### 9.4 涉及数据域

- `tenant-org-service`
  - tenant
  - orgUnit
- `hr-service`
  - employee
  - employment
  - employee onboarding access
- `party-service`
  - PERSON TenantParty
  - ORGANIZATION TenantParty
- `identity-service`
  - user
  - userAccount
  - accountContactAsset
  - employee binding
- `auth-service`
  - loginMethod
  - credential
  - 本地联调用验证数据
- `permission-service`
  - 只保留系统管理员 / 租户管理员的最小访问前提

## 10. 明确不做

- 不做 org 权限管理员体系。
- 不把负责人语义误建模成 permission owner。
- 不做完整多任职管理。
- 不让 `组织` Tab 变成员工后台。
- 不让 `员工` Tab 变成账号管理后台。
- 不在前端硬编码负责人、成员数、成员摘要。
- 不在当前线程内引入 supplier / customer / external collaborator。

## 11. 实现顺序

1. 细化 3 个租户的 seed 明细表。
2. 完成最小 BFF read model enhancement。
3. 完成 `tenant-web` 页面结构重构：
   - 双 Tab
   - 员工页目录化
   - 员工 Drawer + 内部 Tabs
   - 组织树 + 组织 Drawer + 内部 Tabs
4. 对 seed、BFF、前端分别做验证。

## 12. 验证要求

- `tenant-web` 页面测试
- `tenant-web` typecheck
- seed 可重复执行
- 若触碰服务端 seed / DB，验证相关服务 build / test
- 输出明确手工测试路径

## 13. 恢复入口

- 下次继续前先读：
  - [tenant-org-service.md](../../architecture/services/tenant-org-service.md)
  - [hr-service.md](../../architecture/services/hr-service.md)
  - [tenant-org-and-hr.md](../../architecture/collaborations/tenant-org-and-hr.md)
  - [hr-service.md](../../architecture/services/hr-service.md)
  - [tenant-web.md](../../architecture/frontends/tenant-web.md)
  - 本 workspace

## 14. 当前推荐下一步

- 把 seed 设计细化成租户 / 组织 / 成员 / 状态矩阵明细。
- 进入 BFF + tenant-web 实现。
