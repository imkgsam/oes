# Identity Service 概览

更新时间：2026-03-23 15:20:00 +08:00

## 服务定位

`identity-service` 是 `oes` 的身份主数据中心，负责维护和提供“主体是谁、属于哪个租户、在租户内是什么账户、当前是否有效、归属哪些组织”这些事实数据。

## 负责范围

- `User`：自然人全局身份
- `UserAccount`：用户在某租户下的业务账户
- `Tenant`：租户/公司主数据
- `Org`：租户内部组织树
- `AccountContactAsset`：企业邮箱、企业手机等租户资产型联系方式
- `ServiceAccount / APIKey`：机器身份主数据预留

## 不负责范围

- 登录认证
- 密码 / OTP / MFA
- token / session
- 权限决策
- 具体页面、菜单、按钮展示规则

## 上下游关系

### 对 `auth-service`

提供：

- `getUserByEmail`
- `getUserByPhone`
- `getUserById`
- `getAccountsByUserId`
- `getAccountById`
- 可选 `getTenantById`

用途：

- 主认证完成后的账户候选查询
- 账户有效性校验

### 对 `permission-service`

提供：

- `UserAccount`
- `Tenant`
- 后续组织关系

用途：

- 账户级角色、权限决策的主体事实源

### 对业务服务

后续提供：

- 用户信息查询
- 账户信息查询
- 租户信息查询
- 组织信息查询

## 当前阶段定位

当前阶段优先做“身份查询支撑服务”，先支撑 `auth-service AUTH-05` 这类上游查询闭环，不先做完整管理后台。

## 文档分工

- [INDEX.md](./INDEX.md)：导航入口
- [requirements.md](./requirements.md)：文档与实施约束
- [roadmap.md](./roadmap.md)：阶段目标
- [design/identity-center.md](./design/identity-center.md)：总设计
- `design/*.md`：功能集合设计
- `tasks/*.md`：最小闭环任务
- `history/*.history.md`：设计与文档演进记录
