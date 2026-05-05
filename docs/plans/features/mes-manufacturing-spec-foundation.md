# MES Manufacturing Spec Foundation

## 1. 目标

- 冻结并实现 `mes-service` 第一阶段 `ManufacturingSpec` 的 owner 边界、最小对象语义、内部 gRPC 契约与 runtime 基础。
- 为模具管理闭环提供稳定的制造规格查询、引用校验与 MoldDesign 适配基础。
- 明确 `ManufacturingSpec` 是制造现场可执行规格，不是 `Item`、销售 SKU、完整 route、完整 quality rule 或 WIP truth。

本 packet 已从 contract / feature freeze 推进到 `mes-service` internal gRPC runtime-supported。API Gateway 已在 MES mold management BFF 中提供第一阶段 web 手工闭环所需的 ManufacturingSpec create / update / activate / retire HTTP surface；tenant-web UI、完整 Routing / Operation、quality rule 或 WIP runtime 尚未实现。

## 2. 不做什么

- 不在本 packet 内承载 tenant-web UI 设计与实现；API Gateway BFF surface 见 `docs/contracts/api-gateway/mes-mold-management.md`。
- 不建立独立 `product-service`。
- 不做 Sales SKU 映射、客户 SKU、定价、包装销售配置或销售可供货对象。
- 不冻结完整 `Routing / Operation` 管理面；第一阶段只保留 optional route intent / route reference。
- 不冻结完整 quality rule、质检标准、缺陷字典或客户质量接受策略。
- 不做 WIP attribute snapshot runtime；本 packet 只为未来 WIP 绑定提供制造规格 truth。
- 不把 `ProductFamily` 提升为独立服务或完整产品主数据 contract。
- 不修改既有 mold contract 的 owner 语义。

## 3. 上游依赖

- architecture:
  - [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
  - [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
- design workspace:
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
- contracts:
  - [mes-service/README.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/README.md)
  - [mold-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-management.md)
  - [mold-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/mold-query.md)

## 4. 当前结论

- `ManufacturingSpec` 归 `mes-service`，用于表达会影响模具适配、制造路线选择、工序参数承诺点与 WIP 属性锁定的制造规格。
- `ManufacturingSpec` 必须引用 `item-master-service` 中 `manufacturable` 且 `PHYSICAL` 的 `Item`，但不得复制 Item 主数据真相。
- `ProductFamilyRef` 在第一阶段只是制造规格侧的轻量分组引用与展示快照，不冻结独立产品族管理 contract。
- `MoldDesign` 可以引用一个或多个 `ManufacturingSpec` 作为适配范围；`MoldDesign` 不替代 `ManufacturingSpec` truth。
- `Routing / Operation` 后续归 MES 制造执行主数据；当前只允许 `ManufacturingSpec` 保存 optional route intent / route ref，不冻结完整 route contract。
- WIP 后续引用 `ManufacturingSpec` 或保存 manufacturing attribute snapshot；当前不把 WIP truth 写入本 feature。
- Sales SKU 与 `ManufacturingSpec` 可在 future 建立映射，但第一阶段不冻结映射模型。

## 5. 契约真相位置

- 新增管理型契约：
  - [manufacturing-spec-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/manufacturing-spec-management.md)
- 新增查询型契约：
  - [manufacturing-spec-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/mes-service/manufacturing-spec-query.md)

上述契约已对齐 `mes_service` proto、`@oes/common` generated contract 与 `mes-service` runtime。

## 6. 第一阶段对象范围

### 6.1 ManufacturingSpec

- 表达一组可被制造现场识别和执行的制造规格。
- 用于模具适配、路线选择、WIP 属性锁定、历史追溯与后续执行前校验。
- 最小字段语义：
  - `manufacturingSpecId`
  - `tenantId`
  - `orgId`
  - `specCode`
  - `name`
  - `revisionCode`
  - `productFamilyRef`
  - `itemRef`
  - `manufacturingAttributes`
  - `routeIntentRef`
  - `status`
  - `effectiveFrom`
  - `effectiveTo`
  - `createdAt`
  - `updatedAt`

### 6.2 ManufacturingAttributes

- 表达制造规格中会影响制造现场执行的属性摘要。
- 第一阶段只冻结为 key/value list，不冻结全局 attribute dictionary。
- 示例属性：
  - `holePattern`
  - `trapDistance`
  - `formingMethod`
  - `requiresSecondaryFiring`
  - `bodyMaterial`
  - `glazeFamily`

### 6.3 ProductFamilyRef

- 表达制造规格所属的轻量产品族或 SPU 分组。
- 第一阶段为 opaque ref + display snapshot。
- 不冻结 `ProductFamily` 管理服务、唯一编码规则或跨域产品族 truth。

### 6.4 ItemRef

- 指向 `item-master-service` 中的 `Item`。
- 目标 Item 必须是 `manufacturable` 且 `PHYSICAL`。
- `mes-service` 可以保存 item code / name snapshot 供历史展示，但不得成为 Item truth。

## 7. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| architecture / contract owner | 冻结 feature packet 与黑盒 contract | `docs/plans/features/mes-manufacturing-spec-foundation.md`, `docs/contracts/mes-service/**` | 上游 architecture、design workspace、mold contract | feature packet 与 management/query contract | completed |
| proto / producer owner | 基于已冻结 contract 设计 proto 与 producer surface | `src/common/src/contracts/mes_service/**`, `src/services/business/mes-service/**` | 本 packet 与 contract 文档 | proto、controller / application surface、contract tests | completed |
| runtime implementation owner | 在 `mes-service` 内实现最小 repository、domain/application 规则与 L1/L2/L3 测试 | `src/services/business/mes-service/**` | proto 与 contract | 可运行 runtime 与验证结果 | completed |
| mold integration owner | 将 mold management 的 `manufacturing_spec_refs` 引用校验接入 ManufacturingSpec query | `src/services/business/mes-service/**` | ManufacturingSpec runtime 与 mold contract | 模具闭环引用校验增强 | completed |
| review / integration owner | 审核 contract drift、owner 越界、runtime 支持口径与验证完整性 | 只读全局，必要时当前 feature packet 状态回写 | 各实现输出 | review 结论与是否可标 runtime-supported | completed |

## 8. 当前 slice

- slice:
  - `mes-service` manufacturing spec foundation
- scope:
  - `ManufacturingSpec`
  - `ManufacturingAttributes`
  - `ProductFamilyRef`
  - `ItemRef`
  - `RouteIntentRef`
  - mold 引用解析查询
- ready definition:
  - owner boundary 已冻结
  - management / query contract 已冻结
  - proto / generated contract 已对齐
  - `mes-service` runtime 已支持 management / query / MoldDesign ACTIVE spec 引用校验
  - API Gateway BFF 已暴露 web 手工闭环所需的 ManufacturingSpec 最小入口
  - non-scope 已明确，tenant-web UI 等 Stitch 设计完成后再推进

## 9. 最小 contract surface

Management:

- `CreateManufacturingSpec`
- `UpdateManufacturingSpec`
- `ActivateManufacturingSpec`
- `RetireManufacturingSpec`

Query:

- `GetManufacturingSpec`
- `ListManufacturingSpecs`
- `ResolveManufacturingSpecsForMold`

## 10. 验收标准

- feature packet 明确 `ManufacturingSpec` 属于 `mes-service`，并区分 Item、Sales SKU、MoldDesign、Routing、WIP 与 quality rule。
- management contract 冻结 create / update / activate / retire 的 request、response、关键语义、错误语义、审计要求。
- query contract 冻结 get / list / resolve-for-mold 的 request、response、空语义、错误语义。
- 文档明确 ManufacturingSpec 内部 gRPC runtime 与 API Gateway 第一阶段 BFF surface 已支持，且不把 UI / Routing / Quality / WIP 写成已实现。
- L1 覆盖 ManufacturingSpec 状态流转、Item 准入、MoldDesign 只接受 ACTIVE spec 引用。
- L2 覆盖 Prisma repository 持久化与查询。
- L3 覆盖 ManufacturingSpec gRPC surface 与 context baseline。
- live smoke 覆盖 create spec -> activate spec -> register MoldDesign -> register ProductionMoldInstance -> move -> install -> record usage -> query -> idempotency -> outbox。
- 不修改 tenant onboarding 相关未提交文档。

## 11. 关闭条件

- 本 packet 与两份 contract 文档已落地。
- `docs/contracts/mes-service/README.md` 已链接新 contract。
- `docs/contracts/api-gateway/mes-mold-management.md` 已记录 ManufacturingSpec BFF 入口。
- `src/common/src/contracts/mes_service/mes.proto` 与 generated contract 已包含 ManufacturingSpec management/query surface。
- `mes-service` 已具备 ManufacturingSpec repository、application service、gRPC controller 与 MoldDesign ACTIVE spec 引用校验。
- 验证矩阵已通过：
  - `pnpm proto:lint`
  - `pnpm --filter mes-service prisma:generate`
  - `pnpm --filter @oes/common build`
  - `pnpm --filter mes-service build`
  - `pnpm --filter mes-service test:l1`
  - `pnpm --filter mes-service test:l2`
  - `pnpm --filter mes-service test:l3`
  - `pnpm --filter mes-service test:smoke`
  - `pnpm --filter mes-service smoke`

## 12. 开放问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-05-05 | `ProductFamily` 是否需要正式管理 contract | Blocker-Later | 不阻塞 ManufacturingSpec 最小 contract；影响后续产品族选择器与数据治理 | 第一阶段仅用 opaque `productFamilyRef`；后续如需治理再单独开 feature | future manufacturing master data feature | open |
| 2026-05-05 | Sales SKU 与 ManufacturingSpec 映射 | Blocker-Later | 不阻塞模具和制造规格基础；影响销售到制造转换 | 第一阶段不做，后续由 Sales / MES collaboration 单独冻结 | future sales-manufacturing collaboration | open |
| 2026-05-05 | 完整 Routing / Operation contract | Blocker-Later | 当前只需 route intent / route ref；不阻塞规格建档 | 后续以 MES routing foundation 单独推进 | future mes-routing-foundation | open |
| 2026-05-05 | Quality rule 归属与 ManufacturingSpec 的关系 | Blocker-Later | 不阻塞基础规格；影响质检标准引用 | 第一阶段只保留 quality hint / snapshot，不冻结 quality rule | future quality collaboration | open |

## 13. 已实现运行时能力

- `mes_service` proto 已新增 `ManufacturingSpecManagementService` 与 `ManufacturingSpecQueryService`。
- runtime 已实现：
  - spec code 唯一性
  - Item 引用存在性与 `manufacturable + PHYSICAL` 准入校验
  - `DRAFT / ACTIVE / RETIRED` 状态流转
  - `ResolveManufacturingSpecsForMold` 对显式 spec refs、MoldDesign refs 与筛选条件的解析
  - tenant / org / operator / trace / audit context 校验
  - command idempotency、audit envelope 与 outbox 记录
  - MoldDesign 注册时只允许引用 `ACTIVE` ManufacturingSpec

## 14. 后续实现线程输入

- api-gateway / BFF 已基于当前 gRPC surface 接入 ManufacturingSpec 与 MoldManagement 的第一阶段 web 手工闭环。
- permission-service 已补齐成型车间主管角色模板与 MES mold / manufacturing spec 权限码。
- api-gateway 已接入第一阶段 MES mold management web 手工闭环 BFF surface。
- tenant-web UI 等 Stitch 设计完成后再实现，不在当前 slice 直接推进。
- 后续线程不得把 route、quality rule、Sales SKU 映射或 ProductFamily 管理混入当前 slice。
