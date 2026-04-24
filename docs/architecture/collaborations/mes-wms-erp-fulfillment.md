# MES、WMS 与 ERP 履约协同蓝图

## 1. 目标

定义 OES 中“制造对象如何在放行后交给仓储、仓储如何形成唯一占用真相、履约需求如何消费仓储可用性并在必要时触发后处理或人工审批”的长期协同方式。

## 2. 参与服务

- `mes-service`
- `wms-service`
- future `erp-service / fulfillment`
- `api-gateway`
- future `workflow-service`，当需要紧急订单人工审批时

## 3. 协同分工

- `mes-service`
  - 负责制造对象、放行条件、后处理工序执行与结果真相
- `wms-service`
  - 负责正式仓储责任、库存位置 / 数量 / 状态、占用真相、包装与仓储侧送返控制
- future `erp-service / fulfillment`
  - 负责订单承诺、履约需求、优先级、审批语义与经营单据
- `api-gateway`
  - 承担外部 HTTP / BFF 聚合入口
- future `workflow-service`
  - 承接紧急重分配等需要人工审批的工作流

## 4. 协同顺序

### 4.1 放行后交仓

1. `mes-service` 完成烧成后对象的质检 / 确认与放行判断
2. 只有满足交仓条件后，`mes-service` 才发布“可交仓 / 已交仓”事实
3. `wms-service` 基于该事实创建自己的仓储对象并接手正式库存责任
4. `mes-service` 保留制造追溯真相，但不继续拥有该对象的仓储位置、库存余额与配发状态真相

### 4.2 订单履约与占用

1. future `erp-service / fulfillment` 产生订单承诺与履约需求
2. `wms-service` 先检查目标 SKU 现货库存
3. 若现货不足，`wms-service` 再检查可转化基础 SKU、已包装可拆回库存与其他可用仓储选项
4. `wms-service` 返回能否占用、占用哪些库存、是否需要转换 / 拆包 / 审批
5. future `erp-service / fulfillment` 基于 WMS 返回结果继续推进履约或进入人工判断

### 4.3 后处理送返

1. `wms-service` 将待处理库存锁定、冻结或送入待处理区
2. 若后处理需要跨仓、外发或指定测试区，`wms-service` 负责仓储侧流转记录
3. `mes-service` 负责打孔、laser logo、修补、试水等工序执行与结果真相
4. 工序完成后，由 `wms-service` 负责回仓、恢复可用、转受限或转报废相关仓储状态

### 4.4 紧急订单重分配

1. `wms-service` 识别可被重分配的已占用库存，但不直接覆盖原占用
2. future `erp-service / fulfillment` 或 `workflow-service` 发起人工审批
3. 审批通过后，`wms-service` 才执行占用释放 / 重建或重分配结果写入

## 5. 同步 / 异步边界

- 同步：
  - `api-gateway -> wms-service`
  - future `erp-service / fulfillment -> wms-service` 的履约可用性、占用、释放与重分配请求
  - `wms-service -> mes-service` 的必要追溯摘要或后处理结果查询
- 异步：
  - `mes-service -> wms-service` 的交仓事实、后处理完成事实
  - future `workflow-service` 的审批结果通知

## 6. 真相归属

- 制造对象、后处理工序、放行条件与结果：`mes-service`
- 仓储位置、库存余额、库存状态、占用真相、包装转换：`wms-service`
- 订单承诺、履约优先级、经营单据：future `erp-service / fulfillment`
- 审批过程状态：future `workflow-service`
- 前端消费聚合视图：`api-gateway`

## 7. 明确禁止

- 不让 `mes-service` 直接维护正式仓储库存真相
- 不让 `wms-service` 接管打孔、修补、试水等工序执行真相
- 不让 future `erp-service / fulfillment` 维护独立的物理占用真相
- 不把“送后处理”混同为普通库位移动
- 不把“烧成完成”误判为“自动入库”

## 8. 关联文档

- [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [wms-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/wms-service-design.md)
- [mes-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/mes-service-design.md)
