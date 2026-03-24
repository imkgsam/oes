# Identity Service 概览

更新时间：2026-03-24 12:40:00 +09:00

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

当前已提供：

- `getUserByEmail`
- `getUserByPhone`
- `getUserById`
- `getAccountsByUserId`
- `getAccountById`
- `getTenantById`
- `getOrgTreeByTenantId`
- `listAccountOrgMemberships`
- `setAccountPrimaryOrg`
- `addAccountOrgMembership`
- `removeAccountOrgMembership`
- `listAccountWorkEmailAssets`
- `assignAccountWorkEmailAsset`
- `revokeAccountWorkEmailAsset`
- `setAccountWorkEmailAssetStatus`
- `setAccountPrimaryWorkEmailAsset`
- `listAccountWorkPhoneAssets`
- `assignAccountWorkPhoneAsset`
- `revokeAccountWorkPhoneAsset`
- `setAccountWorkPhoneAssetStatus`
- `setAccountPrimaryWorkPhoneAsset`

## 当前阶段定位

当前阶段已经完成身份查询基线、组织结构最小闭环，以及联系方式资产最小闭环。

- `Phase 1` 查询基线已完成
- `Phase 2` 组织结构与联系方式资产分片已完成
- 下一步建议进入机器身份分片

## 文档分工

- [INDEX.md](./INDEX.md)：导航入口
- [requirements.md](./requirements.md)：文档与实施约束
- [roadmap.md](./roadmap.md)：阶段目标
- [design/identity-center.md](./design/identity-center.md)：总设计
- `design/*.md`：功能集合设计
- `tasks/*.md`：最小闭环任务
- `history/*.history.md`：设计与文档演进记录
## Status Update 2026-03-24

- Current implementation has completed the Phase 2 minimum closure for org structure and contact assets.
- Implemented contact asset capabilities now include:
  - `listAccountWorkEmailAssets`
  - `assignAccountWorkEmailAsset`
  - `revokeAccountWorkEmailAsset`
  - `setAccountWorkEmailAssetStatus`
  - `setAccountPrimaryWorkEmailAsset`
  - `listAccountWorkPhoneAssets`
  - `assignAccountWorkPhoneAsset`
  - `revokeAccountWorkPhoneAsset`
  - `setAccountWorkPhoneAssetStatus`
  - `setAccountPrimaryWorkPhoneAsset`
- Current work focus has shifted from "add Phase 3 machine identity" to "tighten internal quality of Phase 2".
- Service-internal testing baseline has been added under `test/l1` and aligned with the independent microservice testing standard.
- Jest configuration is now aligned with `permission-service` using `jest.config.js` plus `tsconfig.spec.json`.
- `ts-jest` warnings for the current test mode have been removed.
- Contact commands now participate in `ValidatingCommandBus` validation with `class-validator` decorators, consistent with the existing validation path used by the service.

### Current stop point

- Do not start `6.1 ServiceAccount` yet.
- Next recommended step is to continue identity-service internal tightening:
  - add missing validation decorators for contact queries
  - clean controller-side `?? ''` fallback inputs
  - keep Phase 2 behavior stable before entering machine identity
