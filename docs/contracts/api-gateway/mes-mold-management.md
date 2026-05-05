# API Gateway MES Mold Management BFF Contract

## 1. 模块职责

`api-gateway` 的 MES mold management BFF 面向 `tenant-web` 第一阶段模具管理闭环。

本 BFF 只负责：

- 将 HTTP 请求映射为 `mes-service` 内部 gRPC command / query。
- 注入 tenant / org / operator / trace / audit 上下文。
- 做路径参数、分页、枚举与 checkbox 批量提交的轻量 BFF 编排。
- 暴露成型车间主管在 web 端可操作的最小闭环入口。

本 BFF 不负责：

- 承载 MES 领域规则。
- 直接写 MES 数据库。
- 绕过 `mes-service` 的 ManufacturingSpec、MoldDesign、ProductionMoldInstance、MoldUsage 规则。
- 替代未来 PDA 扫码采集端。

截至 2026-05-05，本文件描述的 HTTP surface 已在 `api-gateway` 代码中形成第一阶段实现，并已接入 `tenant-web` `/mes/mold-management` 内容区工作台。BFF 仍不承载 UI shell、菜单框架或 MES 领域规则。

## 2. 角色与权限

第一阶段业务角色只有：

- `mes.forming_workshop.supervisor`
- 展示名：`成型车间主管`

BFF 运行时仍按 permission code 鉴权，不把 role 名称硬编码为业务规则。

当前 HTTP surface 使用的权限包括：

| 权限 | 用途 |
| --- | --- |
| `mes.manufacturing_spec.read` | 读取制造规格 |
| `mes.manufacturing_spec.manage` | 创建、启用制造规格 |
| `mes.mold_design.read` | 读取模具设计 |
| `mes.mold_design.manage` | 注册模具设计 |
| `mes.production_mold_instance.read` | 读取生产模实例 |
| `mes.production_mold_instance.manage` | 注册、转移、安装、卸下生产模实例 |
| `mes.work_center_mold_status.read` | 查看产线当前模具与每日 checklist |
| `mes.mold_usage.record` | 提交每日注浆使用记录 |

## 3. 通用上下文

所有接口路径都以 tenant 为边界：

```text
/mes/tenants/:tenantId
```

通用规则：

- 请求必须携带 JWT。
- tenant-scoped operator 不允许访问其他 tenant 的 MES workspace。
- `orgId` 可从 query / body 显式传入；未传时使用 authenticated operator context 中的 `orgId`。
- command 若未显式传 `commandId`，BFF 使用 request id 作为默认 idempotency key。
- management command 由 BFF 生成 MES audit context；业务原因优先使用请求体 `reason` 或默认 command reason。

## 4. HTTP Surface

### 4.1 ManufacturingSpec

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/mes/tenants/:tenantId/manufacturing-specs` | `mes.manufacturing_spec.read` | 分页查询制造规格 |
| `GET` | `/mes/tenants/:tenantId/manufacturing-specs/:manufacturingSpecId` | `mes.manufacturing_spec.read` | 查看制造规格详情 |
| `POST` | `/mes/tenants/:tenantId/manufacturing-specs` | `mes.manufacturing_spec.manage` | 创建制造规格草稿 |
| `POST` | `/mes/tenants/:tenantId/manufacturing-specs/:manufacturingSpecId/update` | `mes.manufacturing_spec.manage` | 更新制造规格 |
| `POST` | `/mes/tenants/:tenantId/manufacturing-specs/:manufacturingSpecId/activate` | `mes.manufacturing_spec.manage` | 启用制造规格 |
| `POST` | `/mes/tenants/:tenantId/manufacturing-specs/:manufacturingSpecId/retire` | `mes.manufacturing_spec.manage` | 退役制造规格 |

说明：

- BFF 不复制 item-master truth；`itemRef` 仍由 `mes-service` 通过受控下游调用校验。
- 跨 org 不可见目标由 `mes-service` 返回 `NOT_FOUND`，BFF 不额外兜底。

### 4.2 MoldDesign

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/mes/tenants/:tenantId/mold-designs` | `mes.mold_design.read` | 分页查询模具设计 |
| `GET` | `/mes/tenants/:tenantId/mold-designs/:moldDesignId` | `mes.mold_design.read` | 查看模具设计详情 |
| `POST` | `/mes/tenants/:tenantId/mold-designs` | `mes.mold_design.manage` | 注册模具设计 |

说明：

- 新 MoldDesign 只能引用同 tenant / org 下 `ACTIVE` ManufacturingSpec。
- MoldDesign 的制造适配规则由 `mes-service` 决定，BFF 只做枚举输入映射。
- `outputs[].options[]` 用于表达同一个 MoldDesignOutput 的可选制造规格 / 数量组合，例如连体马桶主体注浆前选择 300 坑距或 400 坑距。多个 `outputs[]` 表达一次注浆同时产出的多个对象；`options[]` 表达单个产出的互斥选择。

### 4.3 ProductionMoldInstance

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/mes/tenants/:tenantId/mold-instances` | `mes.production_mold_instance.manage` | 注册生产模实例 |
| `GET` | `/mes/tenants/:tenantId/mold-instances` | `mes.production_mold_instance.read` | 按 tenant 查询生产模实例目录 |
| `GET` | `/mes/tenants/:tenantId/mold-designs/:moldDesignId/mold-instances` | `mes.production_mold_instance.read` | 按模具设计查询生产模实例 |
| `GET` | `/mes/tenants/:tenantId/mold-instances/:productionMoldInstanceId` | `mes.production_mold_instance.read` | 查看生产模实例详情 |
| `POST` | `/mes/tenants/:tenantId/mold-instances/:productionMoldInstanceId/move` | `mes.production_mold_instance.manage` | 转移生产模位置 |
| `POST` | `/mes/tenants/:tenantId/mold-instances/:productionMoldInstanceId/install` | `mes.production_mold_instance.manage` | 安装生产模到产线模位 |
| `POST` | `/mes/tenants/:tenantId/mold-instances/:productionMoldInstanceId/unmount` | `mes.production_mold_instance.manage` | 从产线卸下生产模 |
| `POST` | `/mes/tenants/:tenantId/mold-instances/:productionMoldInstanceId/scrap` | `mes.production_mold_instance.manage` | 报废生产模 |

说明：

- 第一阶段“添加模具 / 卸下模具”通过 install / unmount 表达。
- `workCenterId` 由 MES 产线 / 执行单元主数据提供。
- `resourcePositionId` 可显式传入；未传时由 `mes-service` 在目标 `WorkCenter` 下自动创建或复用可用模位。第一阶段不暴露 standalone ResourcePosition CRUD。

### 4.4 Work Center

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `GET` | `/mes/tenants/:tenantId/work-centers` | `mes.work_center_mold_status.read` | 查询模具管理可用产线 / 执行单元 |
| `POST` | `/mes/tenants/:tenantId/work-centers` | `mes.production_mold_instance.manage` | 创建模具管理可用产线 / 执行单元 |
| `POST` | `/mes/tenants/:tenantId/work-centers/:workCenterId/deactivate` | `mes.production_mold_instance.manage` | 停用产线 / 执行单元 |
| `GET` | `/mes/tenants/:tenantId/work-centers/:workCenterId/current-molds` | `mes.work_center_mold_status.read` | 查看指定产线当前安装模具 |
| `GET` | `/mes/tenants/:tenantId/daily-mold-checklists` | `mes.work_center_mold_status.read` | 生成每日 web 勾选 checklist |

说明：

- 当前产线视图来自 MES work center / resource position / installation 读取模型。
- 第一阶段列表面向实际可生产单位；nested parent WorkCenter 可作为过滤和组织关系使用，但 tenant-web 工作台不强制主管先进入树形建模。
- 可安装模具的第一阶段 `workCenterType` 包括：`CASTING_LINE`、`FLOOR_CASTING_AREA`、`VERTICAL_HIGH_PRESSURE_MACHINE`、`HORIZONTAL_HIGH_PRESSURE_MACHINE`。
- 寿命预警只作为读取模型字段透出；第一阶段不要求实现完整预警处置 UI。

### 4.5 Daily Mold Usage Batch

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/mes/tenants/:tenantId/daily-mold-checklists/:checklistDate/usage-batch` | `mes.mold_usage.record` | 提交每日 checkbox 注浆记录 |

请求关键字段：

| 字段 | 说明 |
| --- | --- |
| `batchCommandId` | 批次幂等 key |
| `workCenterId` | 当日产线 |
| `usedAt` | 使用时间；未传时使用 `checklistDate` |
| `items[]` | checklist 行 |
| `items[].checked` | 只有 `true` 的行会写入 mold usage |
| `items[].productionMoldInstanceId` | 生产模实例 |
| `items[].moldInstallationId` | 当前安装记录 |
| `items[].resourcePositionId` | 模位 |
| `items[].lifeDelta` | 寿命增量；默认 `1` |
| `items[].usageQuantity` | 使用数量；默认 `1` |
| `items[].moldDesignOutputId` | 本次注浆对应的设计产出；用于区分一次注浆产出结构 |
| `items[].moldDesignOutputOptionId` | 本次注浆选择的产出选项；例如 300 / 400 坑距 |

响应关键字段：

| 字段 | 说明 |
| --- | --- |
| `acceptedItems[]` | 已写入 usage command 的行 |
| `skippedItems[]` | 未勾选而跳过的行 |
| `checklistDate` | 本次 checklist 日期 |
| `workCenterId` | 本次产线 |

幂等语义：

- BFF 将每个已勾选行的 command id 组装为 `batchCommandId:productionMoldInstanceId:moldInstallationId`。
- 重复提交同一批次同一安装行应由 `mes-service` command idempotency 保护。

## 5. 当前未覆盖项

以下能力不是本 BFF 第一阶段已实现 surface：

- 模位 / resource position 主数据创建、删除、停用。
- PDA 扫码采集端。
- tenant-web 框架 shell、菜单框架、主题或布局系统改造。
- MoldDesign 编辑、退役、版本冻结 workflow。
- 完整寿命预警处置工作流。

如果后续要补齐 standalone 模位管理，应先冻结 `mes-service` resource position management contract，再扩展 BFF；不得只在 `api-gateway` 内做伪主数据。
