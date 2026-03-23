

> 一句话描述：通过robot-service来管理租户级的robot服务， robot-engine 来执行所有robot（系统级，租户级），robot是使用token认证的service，不走gateway。

---

## 1. 设计目标（Why Robot）

### 1.1 为什么引入 Robot

Robot 的目标不是“定时任务”，而是解决以下问题：

- 跨服务的**自动化业务流程**
    
- 由 **事件 / 规则** 驱动的系统行为
    
- 需要 **身份、权限、审计、状态、失败处理** 的自动执行
    
- 替代“管理员手工操作”或“隐式写死在代码里的流程”
    

一句话定义：

> **Robot = 系统内可配置、可审计、带身份的自动化操作者**

---

### 1.2 Robot 不解决什么

Robot **不是**：

- cron（无业务语义）
    
- shell script（不可治理）
    
- 单个 service 内部 job
    
- 纯技术维护任务（日志清理、缓存刷新）
    

---

## 2. 核心概念模型（What）

### 2.1 Robot 的本质

> **Robot 是数据，不是代码**

Robot 本身只描述：

- 何时触发
    
- 执行哪些步骤
    
- 用什么身份执行
    

**执行逻辑在 robot-engine（代码）中**

---

### 2.2 核心对象一览

`Robot │ ├── Trigger        // 触发条件 ├── Steps[]        // 执行步骤 ├── Principal      // 身份（Service Account） │ └── Executions[]   // 每次运行实例`

---

## 3. 系统整体架构（Where）

### 3.1 微服务划分

`┌──────────────────────┐ │    api-gateway       │ └────────┬─────────────┘          │ ┌────────▼─────────────┐ │   robot-service      │  ← 控制面（Control Plane） │  - Robot CRUD        │ │  - Trigger 管理      │ │  - Execution 管理    │ └────────┬─────────────┘          │ events / queue ┌────────▼─────────────┐ │   robot-engine       │  ← 运行面（Runtime Plane） │  - Dispatcher        │ │  - Worker Pool       │ │  - Step 执行         │ └────────┬─────────────┘          │ RPC + Token ┌────────▼────────────────────────────┐ │ auth / identity / asset / notify ... │ └─────────────────────────────────────┘`

---

### 3.2 robot-service vs robot-engine

|项目|robot-service|robot-engine|
|---|---|---|
|职责|管理、定义、调度|执行|
|是否暴露 API|是|否|
|是否执行业务|否|是|
|是否持有 token|否|是|
|是否可横向扩展|是|是|

---

## 4. Robot 的身份与安全模型（Who）

### 4.1 Robot 是一个 Principal

Robot **不是用户**，而是系统主体：

`Principal {   id: "robot:employee-offboarding"   type: ROBOT   tenantId }`

---

### 4.2 Service Account 绑定

每个 Robot 绑定一个 ServiceAccount：

`ServiceAccount {   clientId   clientSecret (hash)   principalId }`

用途：

- OAuth2 `client_credentials`
    
- 获取 access token
    
- 用于内部 RPC 鉴权
    

---

### 4.3 调用鉴权流程（标准）

`robot-engine    ↓ auth-service (client_credentials)    ↓ JWT token (sub=robot)    ↓ RPC 调用下游服务`

**不使用 mTLS**，原因：

- 不支持 tenant robot
    
- 无法做细粒度权限
    
- 审计能力弱
    

---

## 5. Trigger 模型（When）

### 5.1 Trigger 类型

|类型|说明|
|---|---|
|EventTrigger|监听业务事件|
|ScheduleTrigger|定时|
|ManualTrigger|管理员手动|
|ConditionTrigger|规则触发|

---

### 5.2 Event Trigger 示例

`{   "type": "EVENT",   "event": "LoginFailed",   "condition": "count > 5" }`

触发流程：

1. 下游 service emit event
    
2. robot-engine 订阅
    
3. 匹配 robot trigger
    
4. 创建 execution
    

---

## 6. Robot Execution（一次运行实例）

### 6.1 Execution 是什么

> **Execution 是 robot 的一次“运行态快照”**

`RobotExecution {   id   robotId   status   context   startedAt   finishedAt }`

---

### 6.2 状态机（FSM）

`PENDING  → RUNNING    → WAITING    → RETRYING    → FAILED    → COMPLETED`

---

## 7. Step 执行模型（How）

### 7.1 Step 是什么

Step 是 **语义化动作**，不是代码：

`{   "type": "DISABLE_ACCOUNT",   "params": { "userId": "{{context.userId}}" } }`

---

### 7.2 Step Handler（代码）

`interface RobotStepHandler {   type: string   execute(step, context, token): Promise<void> }`

`handlers["DISABLE_ACCOUNT"] = DisableAccountHandler`

> **Step 定义是数据，Handler 是代码**

---

### 7.3 Step 特性

- 顺序执行
    
- 支持 retry
    
- 支持 timeout
    
- 支持 compensation（可选）
    

---

## 8. robot-engine 的运行模型（Runtime）

### 8.1 Dispatcher + Worker

- **Dispatcher**：分发 execution
    
- **Worker Pool**：并发执行 step
    

`execution.created       ↓ dispatcher       ↓ worker-1 worker-2 worker-3`

---

### 8.2 为什么不是线程 / script

|需求|script|robot-engine|
|---|---|---|
|审计|❌|✅|
|重启恢复|❌|✅|
|扩展|❌|✅|
|tenant 隔离|❌|✅|

robot-engine 是 **正式微服务**

---

## 9. Robot 的创建方式（Lifecycle）

### 9.1 系统级 Robot（预置）

- 项目启动时创建
    
- tenant 不可修改
    
- 例如：
    
    - 安全封禁
        
    - 系统巡检
        

---

### 9.2 动态 Robot（重点）

支持：

- 系统管理员创建
    
- tenant 管理员创建
    

`POST /robots`

robot-service 校验：

- step 是否允许
    
- trigger 是否安全
    
- 权限是否足够
    

---

## 10. 适用与不适用场景总结

### 10.1 适合 Robot 的场景

- 员工离职自动化
    
- 安全响应（封禁 / 风控）
    
- 跨系统审批
    
- 资产回收
    
- 合规操作
    

---

### 10.2 不适合 Robot 的场景

|场景|用什么|
|---|---|
|日志清理|cron|
|session 清理|job|
|cache warmup|job|
|DB 维护|运维|

---

## 11. 设计原则总结（给未来的你）

1. **Robot 是业务对象，不是工具脚本**
    
2. **Event 只是触发，Robot 才是流程**
    
3. **Execution 是第一公民**
    
4. **一切执行必须有身份**
    
5. **robot-engine 必须可治理、可观测**
    
6. **能数据驱动的，不要 hardcode 流程**
    
7. **能 hardcode 的，必须是执行语义**
    

---

## 12. 最终一句话（架构级总结）

> **Robot = 数据定义的流程  
> Robot-engine = 带身份的执行引擎  
> Event = 触发信号  
> Token = 唯一可信调用凭证**