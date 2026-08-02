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
- [employee-official-photo.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/employee-official-photo.md)
  - 员工公开展示头像资产上传、绑定与地址解析契约
- [site-media.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/site-media.md)
  - tenant-scoped Site 图片 / 视频的上传、选择、发布期解析、公开交付、引用保护与受控下架契约

相关的 Asset 公共可订阅事件以 [asset-service Event Contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/asset-service.md) 为准。

## 3. 全局调用约束

- 所有接口均为内部服务契约，不对外部客户端直接开放
- 每次调用必须以当前 channel 的 mTLS `VerifiedWorkloadIdentity` 与 `authorization: Bearer <ExecutionToken>` 建立可信执行上下文；五个既有 RPC 的唯一 audience 是 `urn:oes:service:asset-service`
- tenant、execution principal、request、trace 与审计归因通过统一可信 gRPC metadata 传播；request body 不声明 tenant、operator、scope、permission、service name 或签名 operator payload
- 五个既有 RPC 的 mode、Permission Code、字段处置与 caller policy 以 [asset-service.md §10.5](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/asset-service.md) 为唯一稳定设计，以 [avatar.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/avatar.md) 与 [employee-official-photo.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/employee-official-photo.md) 为黑盒行为契约
- `asset-service` 只接受受控分类与受控归属对象，不接受任意匿名资产写入
- 对象存储厂商差异不得泄漏到上层业务契约
- Token 或 metadata 验证失败时直接拒绝；不得回退读取 legacy body identity、共享 signed operator context 或自报 service name
