# API Gateway Contracts

## 1. 目的

本目录用于提供面向前端与外部客户端的 `api-gateway` / BFF 黑盒接口导航。

这些文档的目标不是复制 DTO、Swagger 或下游 proto，而是帮助前端线程快速判断：

- 当前哪些 HTTP 能力已经可以对接
- 每组能力的使用场景是什么
- 真正的契约真相源在哪里
- 当前有哪些明确的边界与未实现项

## 2. 阅读原则

- 本目录文档优先承担“索引 / 导航 / 边界说明”职责，不复制大量字段定义。
- 具体请求 / 响应字段，以对应 controller / DTO / ViewModel 代码和 Swagger 为准。
- 当黑盒说明与代码实现出现冲突时，以代码为准，并应回写文档修正。

## 3. 当前可对接能力

- [auth-bff-login.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-login.md)
  - 登录主流程第一批 HTTP 编排接口
  - 当前已可支撑：
    - 主登录提交
    - 邮箱 OTP challenge
    - 手机 OTP challenge
    - MFA 完成
    - 账户选择
    - session refresh
    - 登录后工作台初始化上下文
- [navigation-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/navigation-summary.md)
  - OES 导航摘要设计
  - 当前已确认：
    - 后端负责 `defaultEntry / visibleEntries`
    - 前端负责本端 route / page / screen 映射与呈现
    - 后端不返回跨端通用菜单层级或 Web route
- [access-summary.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/access-summary.md)
  - OES 权限摘要设计
  - 当前已确认：
    - `GET /auth/session/access-summary` 作为长期权限摘要入口
    - `roles` 用于展示 / 诊断
    - `actionCodes` 用于按钮与动作控制
    - 当前阶段 `actionCodes` 等于后端解析出的 effective permission codes
    - 前端不得从 roles 自行推导 permissions
- [auth-bff-self-service.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-self-service.md)
  - 已登录用户的自助安全管理接口
  - 当前已可支撑：
    - 会话列表
    - 当前会话登出
    - 登出其他设备
    - 全部登出
    - MFA 绑定查看
    - MFA 绑定启停
    - TOTP 初始化与激活
    - recovery codes 初始化与轮换
- [auth-bff-admin-security.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/auth-bff-admin-security.md)
  - 管理员安全管理接口
  - 当前已可支撑：
    - 查看目标用户会话列表
    - 撤销目标单个会话
    - 查询认证域审计事件
- [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
  - 权限管理后台接口
  - 当前已冻结：
    - permission 字典管理页首批接口
    - role instance 管理页首批接口
    - role template 管理页首批接口
    - account-role 设置页首批接口
    - role 成员查看接口

## 4. 前端对接真相源

前端线程在阅读黑盒文档之外，还应同时参考以下代码作为当前真相源：

- BFF controller：
  - [auth.controller.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts)
- 请求 DTO：
  - [login.dto.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/login.dto.ts)
- 响应 ViewModel：
  - [auth-response.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/auth-response.view-model.ts)
  - [session-context.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/session-context.view-model.ts)
  - [self-security.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/self-security.view-model.ts)
  - [admin-security.view-model.ts](/Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts)

## 5. 当前明确边界

- 当前 `auth-bff` 已开放三组能力：
  - 登录主流程
  - 自助安全管理
  - 管理员安全管理
- 当前 `permission-management` 已开放四组管理能力：
  - permission 字典管理
  - role instance 管理
  - role template 管理
  - account-role 设置
- `GET /auth/session/context` 已完成第一阶段交付：
  - 可稳定返回当前 operator / account / tenant
  - `org` 暂为可选
  - `navigation.defaultEntry` 与 `navigation.visibleEntries` 是当前导航可见性真相
  - `navigation.defaultHomePath` 与 `navigation.menus` 仅作为当前兼容字段保留
  - `access.actionCodes` 暂为兼容空数组占位，长期权限摘要入口为 `GET /auth/session/access-summary`
- 上述三组能力均已完成 BFF 层自动化验证，其中 `auth-bff` 关键链路已补 Gateway HTTP → gRPC downstream 的真实联调测试。
- `POST /auth/login` 中的 `tenantHint` 与 `device` 当前为预留字段：
  - 保留在 HTTP 契约中
  - 但当前尚未下推到下游认证逻辑
  - 前端不得依赖这两个字段已经产生实际行为

## 6. 后续扩展方式

后续每新增一组对外 HTTP 能力时，应按以下方式扩展本目录：

- 先新增对应黑盒文档，例如：
  - `auth-bff-self-service.md`
  - `auth-bff-admin-security.md`
- 再将新文档挂到本 README 中
- 不在 README 中复制大段请求 / 响应细节，避免文档漂移

## 7. 当前后置项

- `identity-bff` 的机器身份管理组当前后置：
  - 下游 `identity-service` 契约与授权模型已经较稳定
  - 但当前尚无明确前端页面或外部消费场景
  - 为避免提前暴露语义不稳定的 HTTP 契约，本阶段不继续推进该组 BFF
- Gateway 历史 `auth-service` 与 `identity-service` 占位代理已清理：
  - `auth-service` 的对外能力统一以 `auth-bff` 承接
  - `identity-service` 若未来需要对外暴露，将以新的场景型 BFF 或明确管理接口组重新设计
