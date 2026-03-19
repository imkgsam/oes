# 鉴权能力历史

## 2026-03-18 17:40:01 +08:00

### 本次目标

将鉴权能力从总 checklist 中拆出，并把服务调用接口与业务管理接口的边界写入独立文档。

### 主要改动

- 新建 [authorization.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/authorization.md)
- 明确服务内接口保护需要两层校验：
  - 可信内部服务认证
  - 业务管理接口的操作者上下文校验

### 备注

- 具体跨模块方案不写在本文件中，统一引用根目录设计文档
