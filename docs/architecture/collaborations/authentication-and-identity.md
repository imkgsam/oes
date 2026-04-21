# 认证与身份映射协同蓝图

## 1. 目标

定义 OES 中“操作者如何被认证，并在认证完成后拿到正确身份与账号上下文”的长期协同方式。

## 2. 参与服务

- `api-gateway`
- `auth-service`
- `identity-service`
- `notification-service`，当认证流程需要 OTP 或安全提醒时

## 3. 协同分工

- `api-gateway`
  - 承接外部 HTTP 请求、DTO 校验、对前端友好的聚合返回
- `auth-service`
  - 负责主认证、challenge、session、token 与认证审计真相
- `identity-service`
  - 负责用户、账号、租户、组织等身份映射与展示查询真相
- `notification-service`
  - 负责通知投递，不拥有 OTP 或认证 challenge 真相

## 4. 协同顺序

1. 客户端通过 `api-gateway` 发起登录或 challenge 相关请求
2. `api-gateway` 将认证意图映射到 `auth-service`
3. `auth-service` 在需要时调用 `identity-service` 获取受控身份查询支撑
4. 若需 OTP 或安全提醒，`auth-service` 同步调用 `notification-service`
5. `auth-service` 返回认证结果、续流状态或会话结果
6. `api-gateway` 负责聚合为前端消费友好的 HTTP 响应

## 5. 同步 / 异步边界

- 同步：
  - `api-gateway -> auth-service`
  - `auth-service -> identity-service`
  - `auth-service -> notification-service` 的通知请求受理
- 异步：
  - 通知投递回执、补发、供应商状态更新等由通知平台内部治理

## 6. 真相归属

- 认证、challenge、session、token：`auth-service`
- 用户、账号、租户、组织、联系资产映射：`identity-service`
- 通知投递状态：`notification-service`
- 前端消费形状：`api-gateway` contract

## 7. 明确禁止

- 不让 `api-gateway` 直接拥有认证真相
- 不让 `auth-service` 复制 `identity-service` 的长期主数据模型
- 不让 `notification-service` 接管 OTP 或 challenge 业务语义

## 8. 关联文档

- [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [08-notification-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md)
- [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
