# SESS-03 Refresh Token Rotation 任务

更新时间：2026-03-28 23:00 +09:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/session-token-management.md](../design/session-token-management.md)

## 当前承接范围

- refresh token rotation 最小闭环

## 当前状态

- 已实现

## 最小闭环范围

- contract：提供 `RefreshSession` gRPC 接口
- domain：基于当前 session 聚合完成 refresh token 轮换与 replay 判定
- application：验证 refresh token、签发新 access/refresh token、保存新 token 状态
- infrastructure：刷新后清理旧 token 索引，避免旧 token 继续被索引命中
- interface：返回新的 access token、refresh token、sessionId、expiresIn
- doc：同步任务状态、历史记录和全局审核

## 不包含范围

- token family 独立建模
- 单设备登出
- 全设备登出
- 会话冻结与恢复
- access token 在线校验闭环
- 自动化测试补齐

## 验收要求

- 每次刷新返回新的 refresh token
- 旧 refresh token 再次使用时能识别为 replay 并拒绝
- 刷新成功后旧 token 索引被清理
- refresh token 索引与 session 绑定关系不一致时会视为 replay 并撤销当前 session
- `auth-service` 构建通过

## 关联设计文档

- [../design/session-token-management.md](../design/session-token-management.md)

## 当前完成结果

- `RefreshSession` 已形成正式 gRPC + CQRS 闭环
- 每次 refresh 都会轮换 refresh token
- Redis session repository 已在同一事务内替换 refresh token 索引
- handler 会同时校验 JWT 中的 `sid` 与 refresh token 索引命中的 session 是否一致
- 旧 token 重放、索引错配或当前 session 不再持有该 token 时，都会触发 `AUTH_REFRESH_TOKEN_REPLAY_DETECTED`
- replay 检测命中后会撤销当前 session，并进入统一审计链路

## 后续增强但不计入本任务缺口

- token family 独立建模
- 更细粒度的风险联动策略
