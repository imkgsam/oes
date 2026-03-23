# AUTH-05 Account Candidate Response Slice

更新时间：2026-03-23 11:35:00 +08:00

## 本次目标

- 让 `AUTH-01` 的主认证结果能够承载账户候选列表
- 为后续 `AUTH-05` 真正打通账户选择接口做好 contract 和 application 准备

## 修改范围

- `identity-service` port
- `identity-service adaptor`
- `auth.proto`
- common 生成代码
- `LoginWithEmailPasswordHandler`
- `auth.grpc.controller.ts`

## 主要改动

- 将 `identity-service` port 重构为 capability 风格接口
- 新增 `AccountCandidateSummary`
- `LoginResponse` 增加 `accounts`
- `AUTH-01` handler 现在会查询可用账户并携带到账户候选列表结果中
- `AuthGrpcController` 会返回 `ACCOUNT_SELECTION_REQUIRED + accounts`
- 对 `identity-service adaptor` 明确标记当前上游未就绪的过渡状态

## 备注

- 这一步只完成 `auth-service` 侧承接能力，不代表已与 `identity-service` 真正联通
- 当前真实阻塞点仍在上游服务未实现
