
> PM 是一个流程状态管理模块， 用于持久化管理流程的当前状态以及补偿

---

## **一、模块定位**

**职责：**

- 管理流程实例（Process）的状态和生命周期
    
- 决策下一步动作的执行顺序
    
- 处理失败、补偿、重试、超时
    
- 支持动态可配置流程（用户可自定义流程）
    
- 与 **Robot-Engine (RE)** 交互，通过事件/命令下发动作
    
- 支持流程并行、汇总和状态追踪
    

**不做的事情：**

- 不直接调用外部微服务接口
    
- 不执行业务动作
    
- 不关心触发事件来源的具体实现
    

> 核心思想：**PM = 流程大脑，负责状态和决策，RE = 执行动作者**

---

## **二、架构设计**

          `┌───────────────┐           │ Trigger/Event │  用户、系统事件、Cron           └───────┬───────┘                   │                   ▼          ┌──────────────────┐          │  Process Manager  │          │ - 管理流程状态    │          │ - 决策下一步动作  │          │ - 处理补偿/重试  │          └───────┬──────────┘                  │ Command                  ▼          ┌──────────────────┐          │  Robot-Engine     │          │ - 执行动作         │          │ - 调用外部接口     │          └───────┬──────────┘                  │ Event (Success/Fail)                  ▼          ┌──────────────────┐          │  Process Manager  │          │ - 更新状态/触发下一步 │          └──────────────────┘`

**特点：**

- **事件驱动、异步解耦**
    
- 流程状态持久化到数据库
    
- 支持动态流程配置 → 用户自定义流程无需改代码
    

---

## **三、核心数据模型**

### 1️⃣ 流程模板 / Flow

`interface AutomationFlow {   id: string   name: string   trigger: {     event: string,                        // 触发事件类型     condition?: (payload: any) => boolean // 可选触发条件   }   steps: FlowStep[] }  interface FlowStep {   name: string   actions: string[]           // 动作列表，可并行   onSuccess?: string          // 下一步 Step 名称   onFail?: string             // 补偿或失败 Step   retry?: number              // 重试次数   timeout?: number            // 超时(ms) }`

---

### 2️⃣ 流程实例 / Process

`interface Process {   id: string   flowId: string   step: string                 // 当前执行步骤   status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'   payload: any                 // 事件数据或上下文数据   triggers?: string[]          // 触发源（用户/事件/系统）   createdAt: Date   updatedAt: Date }`

---

### 3️⃣ 事件 / Command

|流向|类型|内容|
|---|---|---|
|Trigger → PM|Event|用户触发 / 系统事件 / Cron|
|PM → Robot|Command|动作名称 + Payload|
|Robot → PM|Event|执行结果 (Success/Fail)|
|PM → Trigger/Listener|Event|流程完成 / 补偿 / 异常通知|

---

## **四、核心功能**

### 1️⃣ 事件触发流程

`async handleEvent(event: DomainEvent) {   const flows = await flowRepo.findByTrigger(event.type)   flows.forEach(flow => {     if (!flow.trigger.condition || flow.trigger.condition(event.payload)) {       this.createProcessInstance(flow, event.payload, event.source)     }   }) }`

---

### 2️⃣ 流程实例管理

- 创建、更新、查询流程实例
    
- 支持暂停、取消流程
    
- 流程实例持久化到数据库 → 崩溃可恢复
    

---

### 3️⃣ 动作执行调度

- 单 Step 多动作 → 并行执行（Promise.all）
    
- 下发命令给 Robot-Engine
    
- 接收执行结果事件 → 决定下一步或补偿
    

---

### 4️⃣ 补偿 / 重试机制

- Step 失败 → 按 `onFail` 配置触发补偿或重试
    
- 支持超时处理和最大重试次数
    

---

### 5️⃣ 动态流程支持

- 流程模板存储在 DB → 用户可自定义流程
    
- PM 读取模板驱动流程，无需修改核心逻辑
    

---

## **五、并行任务支持**

- **Step 内动作并行** → Promise.all 或 Worker Pool
    
- **子流程并行** → 可创建多 Process 实例
    
- **状态汇总** → PM 汇总动作/子流程状态，决定整体状态
    

---

## **六、审计与日志**

- 流程触发来源（用户/系统/事件）
    
- 每个 Step 执行结果、失败原因
    
- 补偿动作和重试记录
    
- 支持回溯和责任追踪
    

---

## **七、注意事项 / Best Practices**

1. **状态持久化**
    
    - 流程实例必须落库，防止服务崩溃丢失状态
        
2. **幂等执行**
    
    - PM 下发动作时需保证幂等性
        
    - Robot-Engine 执行动作也需幂等
        
3. **异步 / 事件驱动**
    
    - PM 与 Robot-Engine 通过 MQ / EventBus 通信
        
    - 避免同步阻塞，提高系统可扩展性
        
4. **并行执行控制**
    
    - 并行动作 → Promise.all 或 Worker Pool
        
    - 汇总状态 → 统一决策
        
5. **补偿与重试策略**
    
    - 失败动作 → 补偿或重试
        
    - 配置超时、重试次数
        
6. **动态流程与用户自定义**
    
    - 流程模板可在数据库中更新
        
    - 支持用户自定义流程，PM 核心逻辑无需改动
        

---

## **八、示例代码**

`@Injectable() export class ProcessManagerService {   constructor(private flowRepo: FlowRepository,               private processRepo: ProcessRepository,               private eventBus: EventBus) {}    async handleEvent(event: DomainEvent) {     const flows = await this.flowRepo.findByTrigger(event.type)     for (const flow of flows) {       if (!flow.trigger.condition || flow.trigger.condition(event.payload)) {         await this.createProcessInstance(flow, event.payload, event.source)       }     }   }    async createProcessInstance(flow: AutomationFlow, payload: any, source: string) {     const process: Process = await this.processRepo.create({       flowId: flow.id,       step: flow.steps[0].name,       status: 'PENDING',       payload,       triggers: [source]     })     await this.executeStep(process)   }    async executeStep(process: Process) {     const flow = await this.flowRepo.findById(process.flowId)     const step = flow.steps.find(s => s.name === process.step)     if (!step) return      try {       // 并行执行所有动作       await Promise.all(step.actions.map(action => this.sendCommandToRobot(action, process.payload)))       await this.updateProcess(process.id, step.onSuccess || '', 'SUCCESS')     } catch (err) {       await this.updateProcess(process.id, step.onFail || '', 'FAILED')     }   }    async sendCommandToRobot(action: string, payload: any) {     await this.eventBus.publish({ type: 'COMMAND', payload: { action, payload } })   }    async updateProcess(processId: string, nextStep: string, status: 'SUCCESS' | 'FAILED') {     await this.processRepo.update(processId, { step: nextStep, status })   } }`

---

### ✅ **总结**

- **PM = 流程大脑**：管理流程实例、状态、补偿、决策
    
- **事件驱动 + 异步 + 并行** → 高可用、解耦
    
- **动态流程模板** → 支持用户自定义
    
- **幂等 + 审计** → 保证流程安全可靠