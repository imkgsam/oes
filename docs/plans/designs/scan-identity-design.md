# Scan Identity Design Draft

> 来源：`mes-service` 设计线程派生草稿。本文不是稳定真相源，用于给后续统一扫码/条码能力线程提供恢复入口。

## 1. 目标

- 为 OES 中跨业务域的扫码场景提供统一识别与路由边界草稿。
- 避免 `mes-service`、`wms`、资产、行政等服务各自定义互不兼容的二维码/条码体系。
- 保持能力轻量，不把业务真相集中到扫码服务。

## 2. 当前判断

- OES 适合建设一个轻量的 `trace identity + scan router` 平台能力。
- 它不应成为 MES、WMS、ERP、资产等业务事实中心。
- 它第一阶段应解决“这个码是什么、应该去哪个业务域处理”，而不是解决所有业务动作。

## 3. 适用场景

- MES：
  - 在制品码
  - 模具码
  - 窑车码
  - 板车码
  - 工位/产线码
- WMS：
  - 外箱码
  - 托盘码
  - 入库单码
  - 库位码
- 身份与权限：
  - 员工工牌码
  - 扫码身份确认
- 固定资产：
  - 笔记本
  - 工装
  - 设备
- 行政/车辆：
  - 智能钥匙柜
  - 车辆授权
  - 用车计划确认

## 4. 推荐边界

### 4.1 负责

- 统一码注册
- 统一编码规则
- 统一解析
- 统一路由
- 码状态管理：
  - 启用
  - 作废
  - 替换
  - 重打
- 提供扫码后的目标服务与目标对象引用

### 4.2 不负责

- 在制品当前工序真相
- 库存数量与库位真相
- 员工权限真相
- 固定资产归属真相
- 订单、出货、财务结算真相

## 5. 核心模型草稿

- `ScanCode`
  - `codeId`
  - `codeType`
  - `physicalTraceId`（如适用）
  - `targetService`
  - `targetObjectId`
  - `status`
  - `createdBy`
  - `createdAt`
- `CodeType`
  - `WIP_UNIT`
  - `MOLD_ASSET`
  - `KILN_CAR`
  - `TRANSFER_CART`
  - `PACKING_BOX`
  - `INBOUND_ORDER`
  - `EMPLOYEE_BADGE`
  - `FIXED_ASSET`
  - `CABINET`
  - `VEHICLE`
- `ScanRoute`
  - `codeType`
  - `defaultTargetService`
  - `defaultAction`
  - `supportedActions`

## 6. 扫码链路

```text
扫码
-> scan identity / scan router 解析
-> 判断 codeType、targetService、targetObjectId
-> 路由到目标业务服务
-> 目标业务服务执行权限与业务校验
-> 返回对应业务视图或操作结果
```

## 7. 分阶段建议

### 第一阶段

- 先支撑 `mes-service` 的在制品、模具、窑车、板车等扫码场景。
- 同时保持码语义为平台级 trace identity，不写死为 MES 私有码。
- 提供统一解析与路由接口。

### 第二阶段

- 接入 WMS 的外箱、托盘、库位、入库单等扫码场景。
- 接入员工工牌与固定资产扫码。

### 第三阶段

- 接入行政与 IoT 场景，例如智能钥匙柜、车辆授权。

## 8. 当前推荐结论

- OES 需要统一扫码入口，但不需要第一阶段就建设重型条码平台。
- `scan identity / scan router` 应是平台基础设施能力。
- 业务真相仍由各领域服务拥有。
