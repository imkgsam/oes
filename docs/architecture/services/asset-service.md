# asset-service 职责卡

## 1. Purpose

`asset-service` 是 OES 的受控资产与对象存储编排服务，负责回答“平台受控文件资产如何上传、持久化、绑定、替换与对外暴露”。

当前第一版已冻结账号头像资产切片，并允许在同一受控资产边界下扩展员工公开展示头像切片；服务边界按长期资产服务方向建立，不把头像上传临时塞回 `auth-bff`、`identity-service` 或 `hr-service`。

## 2. Owns

- 受控文件资产元数据真相
- 对象存储写入、删除与公共访问地址生成语义
- 资产归属、分类、scope、状态与替换生命周期
- 资产上传校验基线：
  - MIME 白名单
  - 文件大小限制
  - 文件头 / 图片解码校验
- 资产替换与清理策略
- 资产上传与替换相关审计事实

## 3. Does Not Own

- 登录、认证、会话与安全挑战真相
- 用户、账号与身份映射真相
- 个人中心前端聚合返回模型
- 任意业务域对象的展示资料真相
- 前端可直接信任的任意外链 URL

## 4. Core Responsibilities

- 为内部调用方提供受控资产上传能力
- 维护资产元数据记录与对象存储 key 映射
- 以 `scopeLevel + tenantId? + ownerAccountId / ownerEmployeeId` 表达资产归属，而不是把所有头像资产都硬绑定到 tenant 或 account
- 生成稳定 `assetId` 与 `publicUrl`
- 在资产绑定完成后执行旧资产替换与清理编排
- 以 S3-compatible 抽象隔离底层对象存储厂商差异

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway` / `auth-bff`
  - `api-gateway` / HR management BFF
  - 未来其他需要受控文件资产的系统服务
- 典型契约位置：
  - [avatar.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/avatar.md)
  - [employee-official-photo.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/asset-service/employee-official-photo.md)

## 6. Upstream Dependencies

- `identity-service`
  - 提供账号与操作者上下文中的绑定目标语义，但不拥有资产元数据
- `auth-bff`
  - 为 web / app 客户端编排头像上传与资料更新流程
- S3-compatible object storage
  - 例如本地 `MinIO`、生产 `S3 / OSS / COS`

## 7. Downstream / Published Facts

- 资产是否存在、属于谁、当前处于什么生命周期状态
- 当前资产属于 `SYSTEM` 还是 `TENANT` scope，以及对应的 tenant 归属
- 当前资产的 `publicUrl`
- 当前归属对象的头像替换结果
- 资产上传、绑定、替换相关审计事实

## 8. Non-goals

- 不在第一版直接做通用附件中心
- 不在第一版承接文档、合同、视频、聊天附件等多品类资产
- 不把图片处理、裁剪、转码流水线一次性做全
- 不让业务服务直接依赖具体云厂商 SDK 细节

## 9. Scope-aware Avatar Boundary

- 当前第一版头像资产服务采用 `scope-aware` 归属模型，而不是 `tenant-only` 模型。
- `TENANT` scope 头像资产必须携带：
  - `scopeLevel = TENANT`
  - `tenantId`
  - `ownerAccountId`
- `SYSTEM` scope 头像资产必须携带：
  - `scopeLevel = SYSTEM`
  - `tenantId = null`
  - `ownerAccountId`
- 当前账号头像上传是“当前 account 自助编辑当前 account profile”的一部分，因此系统账号与租户账号都应支持头像上传与绑定；差异只体现在资产归属 scope，而不是体现在是否允许使用该功能。
- 员工公开展示头像上传是“HR / 租户管理员维护 Employee 正式公开照片”的一部分，因此必须使用员工维度 owner，不得复用账号头像 owner 语义。
- 对象存储 key 也必须按 scope 分层，避免把 system 账号头像硬塞进 tenant 路径：
  - tenant avatar: `avatar/tenant/<tenantId>/<accountId>/...`
  - system avatar: `avatar/system/<accountId>/...`
  - employee official photo: `avatar/tenant/<tenantId>/employee/<employeeId>/official/...`
