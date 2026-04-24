# OES Tenant Web 第一批代码级改造清单

更新时间：2026-04-24 18:09:56 +0800

## 1. 文档目的

本文档用于把 `tenant-web` 的前端设计收敛成第一批可执行改造项。

目标是：

- 先建立长期可扩展的代码骨架
- 不在当前阶段大规模改动现有运行行为
- 避免在 BFF 契约仍持续演进时，把前端写死到错误结构上

## 2. 第一批改造范围

本批次只做低风险骨架改造：

1. 建立 `modules/` 作为后续业务域扩展容器
2. 将现有工作台路由接入 `modules/workbench`
3. 建立 `api/bff/` 目录，作为未来面向 BFF 契约的统一入口
4. 保留当前 `api/core/` 兼容层，避免一次性破坏现有代码

本批次不做：

- 登录流程重写
- store 全量拆分
- 菜单权限模型重写
- 初始化上下文模型落地
- 大规模页面迁移

## 3. 本批次改造项

### 3.1 模块骨架

状态：`已完成`

新增：

- `src/modules/workbench`
- `src/modules/collaboration`
- `src/modules/tenant-admin`

目标：

- 先建立 tenant-web 第一批稳定模块容器
- 后续页面不再全部直接堆到 `views/`

### 3.2 路由组织起点

状态：`已完成`

改造：

- `router/routes/modules/dashboard.ts`

目标：

- 当前仍保持路由注册入口不变
- 但内部改为转接 `modules/workbench/routes`

### 3.3 API 组织起点

状态：`已完成`

新增：

- `src/api/bff/auth`
- `src/api/bff/context`
- `src/api/bff/navigation`

目标：

- 先建立面向前端消费场景的 API 组织方式
- 暂时通过兼容包装复用现有 `api/core/*`

### 3.4 登录主链第一轮接入

状态：`已完成`

已完成：

- 邮箱密码登录
- 手机密码登录
- 邮箱 OTP 登录
- 手机 OTP 登录
- MFA 完成页
- 账户选择页
- session refresh
- logout

### 3.5 登录 UI 第一轮收敛

状态：`已完成`

已完成：

- 密码登录页与验证码登录页均支持 `手机号 / 邮箱` 下划线 tab 切换
- 密码登录页的 tab 位于输入框上方，仍通过路由 query 切换 `mode`
- 验证码登录页采用相同 tab 风格，邮箱 OTP 与手机 OTP 之间仍通过页面状态切换
- 密码登录页中的 `验证码登录`、`扫码登录` 已改为与验证码页 `返回` 按钮一致的 `outline` 控件风格
- 手机号输入已改为左侧国家/地区区号选择、右侧本地号码输入
- 国家/地区区号列表已补全为完整列表，默认 `China (+86)`
- 密码登录页与验证码登录页均已接入前端侧滑块验证门禁
- 第三方登录入口已收敛为微信、QQ、GitHub、Google 图标占位，点击只提示暂未开放

### 3.6 Dashboard 与退出体验收敛

状态：`已完成`

已完成：

- 默认首页切换到 `/workbench/home`
- 工作台首页收敛为 OES 当前阶段入口页
- 系统管理员 `platform.home` 默认入口映射到 `/analytics`，借用 playground analytics 样板作为平台占位首页
- 用户下拉与通知区去除明显模板残留
- logout 交互已与当前登录主链保持一致

### 3.7 登录后壳层上下文收敛

状态：`已完成`

已完成：

- 新增 `auth-context` store，单独承接 `GET /auth/session/context` 与 `GET /auth/session/access-summary`
- `userInfo` 继续只作为 Vben 基础用户展示模型，不再承担 OES 租户、账号、scope 与导航真相
- `access-summary.actionCodes` 写入现有 `accessCodes` store，作为按钮 / 动作权限控制来源
- `navigation.visibleEntries` 已参与本地入口过滤，当前支持 `workbench.home` 与 `platform.home`
- `platform.home` 映射到 `/analytics`，`workbench.home` 映射到 `/workbench/home`
- 用户下拉与工作台上下文展示已根据系统平台 / 租户 scope 做差异化展示

### 3.8 受控状态页收敛

状态：`已完成`

已完成：

- 二维码登录页改为受控状态页
- 找回密码页改为受控状态页
- 注册页改为受控状态页

### 3.9 自助安全与会话管理页

状态：`已完成`

已完成：

- 新增 `api/bff/security`，集中封装已登录用户自助安全接口
- 新增 `/account/security` 页面，并从用户下拉菜单进入
- 页面支持查看当前用户自己的会话列表
- 页面支持退出其他设备、退出全部设备
- 页面支持查看 MFA 绑定状态
- 页面支持启停 MFA 绑定
- 页面支持初始化并激活 TOTP 绑定
- 页面支持初始化与重新生成恢复码

边界约束：

- 当前页面只处理当前登录用户自己的 self-service security
- 管理员查看 / 撤销其他用户 session 不混入本页面
- 找回密码、自助注册、第三方登录、二维码登录仍保持后置

### 3.10 管理员认证与会话管理页

状态：`已完成`

已完成：

- 新增 `api/bff/admin-security`，集中封装管理员认证审计与会话管理接口
- 新增 `/admin/auth-session-management` 页面，并从用户下拉菜单进入
- 页面采用“单页双视角”：
  - 系统管理员可输入 `tenantId` 收敛审计范围
  - 租户管理员不显示租户筛选器，查询自动限定到当前租户
- 页面采用“审计事件主表 + 目标用户会话抽屉”结构
- 支持从审计事件行的 `operatorId` 直接进入目标用户会话排查
- 支持手动输入 `userId` 打开目标用户会话抽屉
- 支持查看目标用户会话详情与管理员强制下线
- 用户下拉菜单根据 `actionCodes` 控制是否显示该入口

边界约束：

- 这不是“管理员个人安全页”，而是管理员排查其他用户认证与会话问题的后台页
- 页面结构统一，但系统管理员与租户管理员按当前 session scope 呈现不同筛选能力
- 当前 BFF 只提供按 `userId` 查看目标用户会话，不提供管理员用户搜索器
- 因此前端当前通过两种方式进入会话排查：
  - 审计事件里的 `operatorId`
  - 手动输入 `userId`
- 若后续需要按邮箱 / 手机号 / 用户名检索目标用户，必须先补齐新的 BFF 查询契约，而不是让前端绕过 BFF 直接调用下游服务

### 3.11 Tenant / Org / HR 前端基础入口收口

状态：`已完成`

已完成：

- `tenant-web` 已形成平台侧 `Tenant` 管理入口：
  - 路径：`/admin/tenant-management`
  - 入口 key：`admin.tenant-management`
  - 当前口径仅服务 `SYSTEM` scope 的 tenant boundary 治理
- `tenant-web` 已形成共享 `OrgUnit` 管理入口：
  - 平台侧路径：`/admin/org-management`
  - 租户侧主路径：`/settings/organization-people/departments`
  - 旧入口 `/settings/org-structure` 仅保留兼容跳转，并继续挂在原 `entryKey`
  - 两个入口复用同一页模型，按当前 session scope 切换“平台先选 tenant / 租户固定当前 tenant”两种模式
- `tenant-web` 已形成租户侧 `组织与人员` 统一入口：
  - 主路径：`/settings/organization-people`
  - 独立入口 key：`tenant-settings.organization-people`
  - 默认进入 `成员` Tab，`部门` Tab 继续消费 `OrgUnit` 管理面
- `tenant-web` 已保留历史入口兼容跳转：
  - `/settings/employee-employment` 继续挂在 `tenant-settings.employee-employment` 并跳转到 `组织与人员 > 成员`
  - `/settings/org-structure` 继续挂在 `tenant-settings.org-structure` 并跳转到 `组织与人员 > 部门`
- `tenant.admin` baseline 已与当前基础入口范围对齐：
  - 包含 `workbench.home`、`admin.auth-session-management`、`admin.role-management`、`admin.account-management`、`tenant-settings.organization-people`、`tenant-settings.org-structure`、`tenant-settings.employee-employment`、`tenant-settings.login-mfa`
  - 不包含 `admin.tenant-management` 与平台侧 `admin.org-management`

边界约束：

- `Tenant` 管理入口不对租户管理员开放，避免把平台 tenant boundary 治理与租户内自治配置混成一个入口
- `组织与人员` 统一入口不改变 `tenant-org-service` 与 `hr-service` owner，只是租户侧消费面收口
- 组织管理入口只消费 `Tenant + OrgUnit` 真相，不在前端把 org tree 扩成 account membership 或 employee owner 视图
- 成员入口只管理 `Employee / Employment`，不把 account binding、grant compensation、账号目录或账号角色配置并入同页
- 当前信息架构仍保持 `account-management` 与 `employee-management` 双入口；如后续需要聚合视图，必须另行冻结

### 3.12 组织与人员工作台 wave-1 收口

状态：`已完成`

已完成：

- `组织与人员` 已作为租户侧成员 / 部门统一入口落地，默认进入 `成员` Tab
- 工作台固定为两个 Tab：
  - `成员`：承接 `Employee / Employment` 工作区
  - `部门`：承接 `OrgUnit` 工作区
- 成员详情已收口为五个区块：
  - `员工信息`
  - `当前任职`
  - `其他任职`
  - `任职记录`
  - `账号与访问`
- `账号与访问` 第一阶段已落地：
  - 只展示登录接入状态、账号摘要、脱敏登录方式摘要、角色摘要与待处理原因
  - 当前动作只保留 `开通登录`、`继续完成接入`、`前往账号管理`
- 创建成员时“允许登录”第一阶段已落地：
  - 先创建 `Employee`
  - 再创建首条 `ACTIVE Employment`
  - 满足条件时触发受控成员登录接入
- 当前 `routes / views / tests` 已覆盖：
  - 新入口与旧入口兼容重定向
  - dedicated `entryKey` 的可见性过滤
  - 成员详情五区块与 `账号与访问` 一期行为

## 4. 后续执行项

在第一批完成后，建议进入第二批：

1. 将 `auth-context store` 继续从认证壳层扩展到业务模块上下文消费
2. 将 `workbench / collaboration / tenant-admin` 的页面壳层继续迁入模块目录
3. 根据 BFF 契约成熟情况扩展更多导航 entry 与业务模块入口
4. 继续完善 action codes 在按钮、动作和页面级守卫中的使用
5. 等 BFF 能力就绪后，再把扫码登录、找回密码、自助注册从受控状态页切换为真实流程

### 4.1 Tenant / Org / HR 基础入口后置项

状态：`后置`

- `account binding / onboarding access` 查询与补偿管理面仍未进入实现；当前 `员工与任职管理` 不承担该管理面
- `access channel / entry policy` 独立模型仍未冻结；当前 `账号与访问` 只停留在一期摘要与受控接入动作
- fully open 的兼任部门 / 多 `ACTIVE Employment` 管理仍未进入实现；当前 `其他任职` 仅保留边界占位
- 已离任成员独立工作台仍未进入实现；当前离任状态仍在同一成员工作区内查看
- 成员页内完整账号后台仍未进入实现；当前只保留摘要与跳转 `account-management`
- `supplier / dealer / customer / external collaborator` 扩展仍未进入当前工作台范围；当前统一入口只承接 `Employee / Employment` 与 `OrgUnit`
- `account-management` 与 `employee-management` 的长期信息架构仍未冻结；当前只确认双入口并存，不做页面合并
- 环境侧 `permission baseline sync / seed` 动作仍依赖运行环境执行与 runbook 收口，不属于当前前端基础入口实现范围

## 5. 当前实施原则

- 保证现有页面可继续运行
- 只做可验证、可回退的小步演进
- 若后续 BFF 契约出现不合理设计，应回推 Gateway 调整，而不是让前端硬编码适配

## 6. 当前验证状态

- `pnpm --dir app/web --filter @oes/tenant-web typecheck` 已通过
- 登录、dashboard、logout 代码链路已完成第一轮打通
- 邮箱密码、手机密码、邮箱 OTP、手机 OTP 均已具备前端入口与提交流程
- 本地联调脚本与 dev 启动链已修复到可继续验证状态
- 管理员认证与会话管理页已完成代码接入，支持按 scope 呈现不同筛选能力
- tenant / org / hr 基础入口、`组织与人员` 统一入口与 `tenant.admin` 导航基线已在当前代码层收口
- `organization-people` 新入口、旧入口兼容跳转、成员详情五区块与 `账号与访问` 一期行为已由当前 routes / views / tests 覆盖
- 浏览器人工联调仍建议继续覆盖四种登录方式、账户选择、刷新保持会话与登出

## 7. 后置测试任务

### 7.1 Access Token 自动刷新浏览器联调

状态：`后置`

背景：

- 当前 `tenant-web` 登录后的 dashboard / workbench 仍以静态入口和前端壳层为主。
- 除登录初始化、session context、access summary、logout 外，尚缺少稳定业务页面持续触发鉴权后端请求。
- 因此不应为了测试 token refresh 临时添加测试按钮或测试页面，避免引入短期补丁式代码。

后置测试目标：

- 验证 access token 过期后，前端能在收到 `401` 时自动调用 `POST /auth/session/refresh`。
- 验证 refresh 成功后，前端会更新 access token 与 refresh token。
- 验证原始请求会被自动重试，用户不应被无感场景踢回登录页。
- 验证 refresh token 无效、过期或 replay 时，前端会清理登录态并回到登录页。

触发条件：

- 已有至少一个正式页面会稳定调用鉴权 BFF 接口，例如 session 管理、个人安全设置、权限摘要刷新、租户工作台真实数据接口等。
- 或已有专门的浏览器 E2E 测试用例可以通过正式接口触发鉴权请求。

建议测试配置：

- 本地联调时可在 `auth-service` `.env` 中临时设置：
  - `ACCESS_TOKEN_VALIDITY_SEC=30`
  - `REFRESH_TOKEN_VALIDITY_SEC=604800`
- 测试完成后恢复正常 token 生命周期配置。

验收口径：

- 浏览器 Network 能看到原鉴权请求 `401` 后触发 `POST /api/auth/session/refresh`。
- refresh 接口返回新 token pair。
- 原请求重试成功。
- 页面不出现重复错误 toast。
- refresh 失败时跳回登录页，且不会进入无限刷新循环。

### 7.2 登录周边能力后置任务

状态：`后置`

后置范围：

- 二维码登录
- 找回密码
- 自助注册
- 第三方登录

后置原因：

- 这些能力不属于当前登录主链的必要条件
- 这些能力均涉及 BFF 契约、认证服务、身份绑定、通知或第三方 provider
- 当前阶段前端只保留受控占位入口

前后端职责区分：

| 能力 | 前端当前状态 | BFF / 契约职责 | 下游服务职责 | 触发条件 |
|---|---|---|---|---|
| 二维码登录 | 受控占位页 | 定义二维码生成 / 绑定、状态查询、完成登录契约 | `auth-service` 负责 challenge 状态、过期、防重放、审计 | 产品确认该能力进入当前阶段 |
| 找回密码 | 受控占位页 | 定义重置 challenge、校验、提交新密码、错误与限流契约 | `auth-service` 负责 reset token / challenge、密码规则、审计；`notification-service` 负责通知发送 | 确认允许用户自助重置密码 |
| 自助注册 | 受控占位页 | 定义注册申请、验证、租户 / 账号创建或邀请接受契约 | `auth-service` / `identity-service` 负责用户凭据、账号绑定、开户边界、审计 | 确认 OES 允许自助注册而非仅管理员开通 |
| 第三方登录 | 图标占位提示 | 定义 provider discovery、redirect、callback、账号绑定和后续账号选择契约 | `auth-service` / `identity-service` 负责外部身份绑定、session 签发、解绑规则、审计 | 确认 provider 范围与租户 / 平台适用边界 |

### 7.3 管理员用户检索能力后置任务

状态：`后置`

后置原因：

- 当前 `auth-bff` 已开放管理员审计查询与目标用户会话查询，但尚未开放管理员用户检索接口
- `identity-service` 内部已有按邮箱 / 手机号 / 用户 ID 查询自然人身份的 gRPC 能力
- 但前端不能绕过 BFF 直接消费内部服务契约

后置目标：

- 为管理员页补齐“按邮箱 / 手机号 / 用户名 / userId 检索目标用户”的 BFF 黑盒接口
- 若系统管理员需要“租户选择器”而不是“tenantId 文本筛选”，还需补齐可供前端消费的租户目录查询契约

前后端职责区分：

| 能力 | 前端当前状态 | BFF / 契约职责 | 下游服务职责 | 触发条件 |
|---|---|---|---|---|
| 管理员用户检索 | 通过审计事件 `operatorId` 或手动输入 `userId` 进入排查 | 定义管理员可见范围内的目标用户搜索接口与返回摘要结构 | `identity-service` 提供用户摘要查询真相源，`auth-service` 继续负责 session 边界判定 | 确认管理员需要更友好的目标用户检索体验 |
| 系统管理员租户选择器 | 当前使用 `tenantId` 文本筛选 | 定义租户目录查询 / 模糊搜索契约 | `identity-service` 或租户域服务提供租户摘要真相源 | 确认系统管理员需要可视化租户筛选器 |

验收口径：

- 未到触发条件前，前端不得把占位入口改成可执行假流程。
- 任一能力进入实现前，必须先补齐 `docs/contracts/api-gateway/` 下对应黑盒契约。
- 若涉及身份、租户、权限或 operator context 语义变化，必须先更新 architecture 或 ADR。
