# mes-service 职责卡

## 1. Purpose

`mes-service` 是 OES 在卫浴陶瓷制造场景下的制造执行与追溯真相服务，负责回答“产品在制造现场是如何被生产、流转、检验、修补、烧成、报废与移交的”。

## 2. Owns

- MES 执行主单与制造现场执行真相
- 单件在制品 / 成瓷追溯对象与 `physicalTraceId`
- 工艺路线实例、工序前置约束与放行结果
- 工序执行记录与关键工艺参数采集摘要
- 生产内质检、瑕疵、内部质量分类与处置决策事实
- 修补、返工、复检、报废控制事实
- 窑炉 / 窑次 / 窑车 / 位置级烧成追溯事实
- 模具、泥浆、釉料等制造现场使用事实
- 制造过程中的 WIP stage、WIP location 与关键 buffer 容量事实
- 面向 planning、quality、WMS、sales / fulfillment 的制造领域事件

## 3. Does Not Own

- 主生产计划、全局排产优化与 APS 约束求解真相
- 企业级质量标准、客户质量接受策略与完整质量治理真相
- 成品仓储库存、库位、配货、出库与发货真相
- 销售订单、经营单据、财务与工资结算真相
- 产品目录、销售 SKU、完整制造主数据真相
- 设备控制系统、PLC、SCADA 本身的控制真相

## 4. Core Responsibilities

- 承接执行需求并将其转为可追溯的制造执行对象
- 管理从脱模贴码开始的单件追溯链
- 管理工序流转、关键放行节点与工艺约束
- 管理一检、成品检、功能检、修补后二检等生产内质检闭环
- 管理修补、返工、后置处理与报废的制造侧处置事实
- 管理模具寿命、模具使用、材料批次使用与烧成位置追溯
- 管理粗胚库、精胚库、釉胚库、待检区、待修补区等制造缓冲区
- 发布已完成、可审计的制造事实，供下游服务消费

## 5. External Interfaces

- 典型上游：
  - `planning-workbench`
  - 统一扫码入口 / trace identity
- 典型下游：
  - `quality-service`
  - `wms-service`
  - `sales-service / fulfillment boundary`
- 典型契约形态：
  - 命令型：工序提交、质检记录、报废确认、仓储移交
  - 查询型：追溯摘要、WIP 汇总、关键缓冲区容量摘要
  - 事件型：在制品创建、工序完成、瑕疵记录、质量重判、模具/材料使用、烧成事件、仓储移交

## 6. Upstream Dependencies

- `planning-workbench`
  - 提供 demand、投产建议、派工与放行建议
- `product / manufacturing master data`
  - 提供产品族、制造规格、路线、工序、模具适配等主数据引用
- `quality-service`
  - 长期提供缺陷字典、内部分类规则、归责规则模板等质量规则引用
- 统一扫码入口 / trace identity
  - 提供扫码解析与对象路由能力

## 7. Downstream / Published Facts

- 在制品创建与属性锁定事实
- 工序完成与位置变化事实
- 质检、瑕疵、内部质量分类与处置事实
- 责任归因与奖罚输入事实
- 模具、泥浆、釉料、窑次、窑车、位置追溯事实
- 成品可移交仓储与正式移交仓储事实

## 8. Non-goals

- 不直接替代 APS 或计划工作台
- 不直接替代 quality-service 的规则中心角色
- 不直接替代 WMS 的仓储与发运职责
- 不直接替代 `sales-service`、future `finance-service` 或其他经营域的订单、财务、工资职责
- 不把无码过渡对象伪装成完整单件追溯对象
