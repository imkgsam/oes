# asset-service Contracts

## 1. 目的

本目录用于提供 `asset-service` 的黑盒接口文档。

这些文档面向：

- `api-gateway`
- `auth-bff`
- 未来其他需要受控文件资产能力的系统服务

阅读目标：

- 理解 `asset-service` 暴露了哪些资产能力
- 明确每个接口的请求 / 响应语义
- 明确资产上传、绑定、替换与访问地址的边界

## 2. 模块划分

- [avatar.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/avatar.md)
  - 头像资产上传、绑定、替换与地址解析契约

## 3. 全局调用约束

- 所有接口均为内部服务契约，不对外部客户端直接开放
- 调用链必须显式携带 `tenantId`、`operator context` 与 `trace context`
- `asset-service` 只接受受控分类与受控归属对象，不接受任意匿名资产写入
- 对象存储厂商差异不得泄漏到上层业务契约
