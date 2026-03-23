# SESS-03 Refresh Token Rotation 任务

更新时间：2026-03-23 20:30:00 +08:00

## 上游设计文档

- [../design/auth-center.md](../design/auth-center.md)
- [../design/session-token-management.md](../design/session-token-management.md)

## 当前承接范围

- refresh token rotation 最小闭环

## 当前状态

- 部分实现

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
- `auth-service` 构建通过

## 关联设计文档

- [../design/session-token-management.md](../design/session-token-management.md)

## 阻塞项

- 当前仍未对 token family 做独立建模，replay 检测以“当前 session 仅保存最新 refresh token”为边界
