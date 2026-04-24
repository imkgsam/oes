# Asset Service Design

## 1. 文档目的

本文件是 `asset-service` 的设计工作台，用于沉淀当前线程已经确认的头像资产服务边界、协同关系与第一版冻结结论。

当前文档的定位是：

- 冻结 `asset-service` 的正式设计方向与服务边界。
- 作为后续实现 `asset-service -> auth-bff -> identity-service -> tenant-web` 的恢复入口。
- 明确哪些结论已经冻结，哪些问题仍保持开放。

当前文档明确不负责：

- 直接替代 `docs/architecture/services/asset-service.md` 的稳定职责真相。
- 直接替代 `docs/contracts/**` 记录黑盒接口正文。
- 直接展开完整通用资产平台的所有未来品类设计。

## 2. 当前设计范围

本轮设计只覆盖：

- 新建 `asset-service` 的必要性与职责边界
- 头像上传这一条最小垂直切片
- `asset-service` 与 `auth-bff` / `identity-service` / `tenant-web` 的协同方式
- 头像资产的上传、绑定、替换、清理与展示地址语义
- 基于 S3-compatible 的对象存储抽象策略
- 本地 `MinIO` 与生产云对象存储的一致接口方向

本轮刻意不继续冻结：

- 通用附件、多媒体、文档等其他资产分类
- 图片裁剪、转码、缩略图与内容审核流水线
- CDN、签名下载、防盗链等更宽泛的分发治理
- 完整资产搜索、标签与权限树模型

## 3. 为什么必须新建 `asset-service`

当前个人中心头像能力存在三个正式缺口：

- `tenant-web` 仍把头像当成任意 URL 输入，不符合生产级边界。
- `identity-service.UserAccount.avatarUrl` 当前实际承担了“任意外链字符串”的写模型，这让身份服务被动接管了资产真相。
- 项目还没有一个受控的对象存储边界，`auth-bff` / `identity-service` 都不适合直接长期拥有文件资产生命周期。

因此本轮确认：

- 不把头像上传临时塞进 `auth-bff`
- 不让 `identity-service` 继续把任意 URL 当头像真相
- 直接建立一个范围很窄、但边界正确的 `asset-service`

## 4. 当前冻结结论

### 4.1 服务边界

- `asset-service` 是新的系统服务，负责受控资产元数据与对象存储编排。
- 第一版只支持 `ACCOUNT_AVATAR` 这一类资产。
- 第一版头像资产采用 `scope-aware` 归属模型，不再冻结为 `tenant-only` 资产模型。
- `asset-service` 的目录、模块与测试结构必须对齐仓库里成熟系统服务，而不是临时拼接模块。

### 4.2 头像资料真相

- `identity-service` 不再长期拥有“任意 URL 头像真相”。
- 当前账号头像资料的正式写模型切换为 `avatarAssetId`。
- 个人中心与壳层继续消费 `avatar` 作为展示 URL，但该 URL 必须由 `asset-service` 受控生成。

### 4.3 流程切分

头像更新被明确切成两个写步骤：

1. `tenant-web` 通过 `auth-bff` 上传头像文件，得到 `assetId` 与 `publicUrl`
2. `tenant-web` 保存个人资料时提交 `avatarAssetId`

只有在第二步成功后，`asset-service` 才会把新头像标记为 `ACTIVE`，并把旧头像转为 `REPLACED`。

### 4.4 Scope-aware 资产归属

- 头像资产归属改为：
  - `scopeLevel`
  - `tenantId?`
  - `ownerAccountId`
- 约束如下：
  - `TENANT` 账号头像必须带 `tenantId`
  - `SYSTEM` 账号头像必须不带 `tenantId`
- 当前账号头像上传是个人中心当前账号资料自助编辑的一部分，因此系统账号与租户账号都应支持头像上传；不能把“当前资产实现最初要求 tenantId”误当成产品规则。
- 绑定校验也必须升级为校验 `scopeLevel + tenantId + ownerAccountId`，而不是只校验 `tenantId + accountId`。

### 4.5 对象存储抽象

- 底层只依赖 S3-compatible 抽象，不在业务代码里写死具体云厂商 SDK。
- 本地开发使用 `MinIO`
- 生产环境切换 `S3 / OSS / COS` 时不修改上层服务契约

## 5. 服务协同边界

### 5.1 `tenant-web`

- 提供头像文件选择、预览、上传与资料保存交互
- 不直接持久化文件，不直接信任任意第三方 URL
- 保存资料时只提交 `avatarAssetId`

### 5.2 `auth-bff`

- 作为外部 HTTP 编排层
- 对外暴露：
  - `POST /auth/personal-center/avatar`
  - `PATCH /auth/personal-center/account-profile`
- 负责当前账号上下文校验与多服务编排
- 必须把当前 `scopeLevel` 与 `tenantId` 一并传给 `asset-service`，不能在 `SYSTEM` 场景下假定头像上传不可用
- 不拥有对象存储与资产元数据真相

### 5.3 `identity-service`

- 继续拥有当前 `account profile` 真相
- 当前轮冻结的可编辑字段为：
  - `avatarAssetId`
  - `displayName`
  - `bio`
- 不拥有文件本体写入与对象存储 key 生成逻辑

### 5.4 `asset-service`

- 拥有头像资产元数据真相
- 负责上传校验、对象存储写入、`assetId/publicUrl` 生成、旧头像替换状态推进
- 对上游只暴露受控头像资产能力，不暴露云厂商细节

## 6. 领域对象与状态建议

### 6.1 `Asset`

第一版最小资产对象应至少具备：

- `assetId`
- `scopeLevel`
- `tenantId?`
- `ownerAccountId`
- `category`
- `storageKey`
- `mimeType`
- `size`
- `checksum`
- `publicUrl`
- `status`
- `createdAt`
- `updatedAt`

### 6.2 状态

- `PENDING_BIND`
  - 文件已上传，但尚未被账号资料引用
- `ACTIVE`
  - 当前已被账号资料正式引用
- `REPLACED`
  - 已被新头像替换，等待清理
- `DELETED`
  - 已清理完成

## 7. 推荐写路径

### 7.1 上传头像

1. `tenant-web` 选择文件并请求 `POST /auth/personal-center/avatar`
2. `auth-bff` 校验当前会话与账号上下文
3. `auth-bff` 调用 `asset-service.UploadAccountAvatar`
4. `asset-service` 校验文件、写入对象存储、落元数据，返回 `assetId/publicUrl`
5. 存储 key 按 scope 分层：
   - `TENANT`: `avatar/tenant/<tenantId>/<accountId>/...`
   - `SYSTEM`: `avatar/system/<accountId>/...`

### 7.2 保存资料

1. `tenant-web` 调用 `PATCH /auth/personal-center/account-profile`
2. `auth-bff` 先调用 `identity-service` 更新 `avatarAssetId/displayName/bio`
3. 若头像引用发生变化，`auth-bff` 再调用 `asset-service.BindAccountAvatar`
4. `asset-service` 将新头像转为 `ACTIVE`，旧头像转为 `REPLACED`

## 8. 校验与治理基线

- 允许格式：`jpeg / png / webp`
- 最大大小：`2MB`
- 服务端必须做文件头与图片解码校验
- 不信任原始文件名
- 资产归属必须绑定：
  - `scopeLevel`
  - `tenantId` when `scopeLevel = TENANT`
  - `ownerAccountId`
  - `operatorId`
- 上传与绑定都应进入审计
- 旧头像不盲目立即物理删除，应进入可控清理

## 9. 需要回写的真相源

本轮设计冻结后，应回写到以下位置：

- `docs/architecture/services/asset-service.md`
- `docs/contracts/asset-service/avatar.md`
- `docs/contracts/api-gateway/auth-bff-login.md`
- `docs/plans/features/personal-center.md`

## 10. 当前开放问题

- `asset-service` 是否独立持有自己的数据库，还是沿用项目标准单服务独立 Prisma + Postgres 方案
- `publicUrl` 在本地开发是否直接使用 MinIO 公网样式地址，还是统一走网关静态域名
- 旧头像清理是同步删除还是异步后台清理；当前更推荐异步清理

## 11. 已废弃假设

- “头像资产天然必须属于某个 tenant” 已废弃；这只是第一版初始实现假设，不再是冻结设计。
- “系统账号头像上传应在前端或 BFF 层被禁用” 已废弃；这属于把实现缺口误写成产品边界。
