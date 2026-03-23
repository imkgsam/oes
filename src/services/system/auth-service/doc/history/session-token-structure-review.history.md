# Session Token Structure Review 历史

更新时间：2026-03-23 21:05:00 +08:00

## 复核目标

- 判断当前 `SESS-01` / `SESS-03` 实现是否仍然符合既定架构方向
- 明确哪些能力可以继续沿当前模型推进
- 明确哪些能力不应继续基于当前模型做补丁式扩展

## 复核结论

### 当前方向可接受的部分

- 当前以 `session` 作为服务端事实源的方向是正确的
- 当前以 `refresh token rotation` 作为默认策略的方向是正确的
- 当前以“一个 session 仅保存最新 refresh token”的方式实现最小 replay 检测，可以作为阶段性方案继续承接主线

### 当前实现的边界

- 当前模型不是 `token family` 模型
- 当前 replay 检测边界是：`session.refreshToken` 必须等于请求中的 refresh token
- 当前旧 refresh token 重放时，会将当前 session 直接删除，属于保守处置策略

### 当前不应继续补丁扩展的部分

- 不应继续把更多会话能力建立在“持久化完整 access token 作为核心状态”之上
- 不应继续在 Redis repository 中堆更多 token 索引补丁逻辑
- 在实现 `validateAccessToken`、`logout`、`logoutAll`、设备管理前，应先确定最终 session/token 持久化模型

## 建议的结构判断

### 现在可以继续做的

- 基于当前模型继续推进非 session 核心能力
- 继续推进 MFA、基础风控、审计
- 在不扩张 token 持久化复杂度的前提下，维持现有 `RefreshSession` 最小闭环

### 继续做 session 相关能力前应先重构的

- `validateAccessToken`
- `logout`
- `logoutAll`
- 单设备踢下线
- 设备列表与设备态管理
- 更严格的 replay / token family 建模

## 建议的后续重构方向

- `Session` 聚合持久化“会话事实”而不是完整 access token 文本
- refresh token 改为持久化可轮换的 refresh 凭据状态，至少应向“refresh credential state”收敛
- access token 校验应以 JWT 校验 + session 状态校验为主，而不是依赖持久化 access token 文本等值比较

## 本次复核对应文件

- `src/application/services/session.service.ts`
- `src/domain/aggregates/usersession.aggregate.ts`
- `src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`

## 结论摘要

- 当前 `SESS-01` / `SESS-03` 足够支撑主线继续前进
- 当前 session/token 模型不适合继续做补丁式扩展
- 如果下一步要继续做 session 族能力，应先做一次结构性收敛，而不是继续追加局部修补
