# AUTH-05 登录后账户选择

更新时间：2026-03-23 19:45:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/frontend-auth-context.md](../design/frontend-auth-context.md)

## 当前承接范围

- 登录成功后的 `account` 选择闭环

## 当前状态

- 部分实现

## 最小闭环范围

- contract：定义 `ACCOUNT_SELECTION_REQUIRED` 结果状态与选择接口
- schema：确认 challenge 或等价中间态模型
- domain：账户选择规则
- application：调用 `identity-service` 查询可进入账户并校验所选账户
- interface：返回候选账户并提交选择
- tests：覆盖无账户、单账户、多账户三类场景
- doc：同步状态与验收结果

## 不包含范围

- 单账户自动进入
- challenge 持久化模型
- 登录后权限初始化聚合

## 验收要求

- 无有效 `account` 时不能签发业务访问成功态
- 多账户可返回明确选择态
- 选择提交后可校验账户归属与启用状态

## 本次进展

- `identity-service` 真实上游已接通
- 登录返回候选账户列表已接入真实 gRPC 查询
- 已新增 `SelectAccount` gRPC 接口
- 已在 `auth-service` 内实现：
  - 账户存在校验
  - 账户归属校验
  - 账户启用状态校验
- 选择提交成功后已衔接到 `SESS-01`，可直接返回最终登录成功结果

## 当前剩余阻塞

- 尚未实现单账户自动进入
- 尚未引入 challenge 持久化约束，当前选择接口仍以 `userId + accountId` 直接提交

## 关联设计文档

- [../design/auth-flow.md](../design/auth-flow.md)
- [../design/frontend-auth-context.md](../design/frontend-auth-context.md)
