
> RE是 指令执行模块， PM提供指令RE进行执行， 未来拓展AI时可接入

---

## **一、模块定位**

**职责**：

1. 执行 PM 下发的动作（Command）
    
2. 调用下游微服务接口或外部系统（RPC / MQ / HTTP）
    
3. 并行执行动作（Step 内或多 Step 并行）
    
4. 支持幂等执行、失败重试、超时处理
    
5. 将执行结果以事件形式回报给 PM
    
6. 支持动态注册、插件化扩展动作
    

**不做的事情**：

- 不管理流程状态
    
- 不处理触发条件（由 PM 决策）
    
- 不做流程补偿逻辑
    

> 核心思想：**Robot-Engine = 动作执行者，PM = 流程大脑**

---

## **二、架构设计**

``anduino
          ┌───────────────┐
          │  Process Manager │
          │ - 下发 Command   │
          │ - 接收事件更新状态│
          └───────┬─────────┘
                  │ Command
                  ▼
         ┌──────────────────┐
         │  Robot-Engine     │
         │ - 动作注册表      │
         │ - Adapter / Port  │
         │ - 并行执行动作    │
         │ - 幂等 / 重试    │
         └───────┬──────────┘
                 │
      ┌──────────┴───────────┐
      │                      │
      ▼                      ▼
RPC 同步调用                 MQ 异步调用
下游服务/模块                下游服务/模块
 │                            │
 └───────────────┬────────────┘
                 ▼
           EventBus / MQ
                 │
                 ▼
          Process Manager
        （更新流程状态）


**特点**：

- **动作注册表 + Adapter** → 支持 RPC/MQ/HTTP 灵活调用
    
- **事件驱动** → PM 与 RE 解耦
    
- **并行 + 幂等 + 超时 + 重试** → 高可靠、高并发
    
- **插件化 / 配置化动作** → 支持用户自定义流程
    

---

## **三、核心设计概念**

### 1️⃣ 动作注册表（ActionRegistry）

- 每个动作对应 **Outbound Port + Adapter + 方法 + 执行方式**
    
- 支持静态注册 / 配置化 / 插件化
    

``typescript
interface ActionEntry {
  name: string            // 动作标识，例如 'DISABLE_USER'
  port: string            // Outbound Port 名称，例如 'UserServicePort'
  method: string          // Port 方法名，例如 'disableUser'
  type: 'RPC' | 'MQ'      // 调用方式
  options?: {
    retry?: number        // 重试次数
    timeout?: number      // 超时
  }
}


---

### 2️⃣ Outbound Port + Adapter

- **Port** 定义 Robot-Engine 与外部服务的契约
    
- **Adapter** 实现 Port，支持 RPC / MQ / HTTP
    

``typescript
export interface UserServicePort {
  disableUser(userId: string): Promise<void>
  notifyUser(userId: string, message: string): Promise<void>
}

@Injectable()
export class UserServiceRpcAdapter implements UserServicePort {
  constructor(private rpcClient: RpcClientService) {}
  async disableUser(userId: string) {
    return this.rpcClient.call('userService', 'disableUser', { userId })
  }
  async notifyUser(userId: string, message: string) {
    return this.rpcClient.call('userService', 'notifyUser', { userId, message })
  }
}


- Robot-Engine 动态注入 Adapter → 根据注册表执行方法
    

---

### 3️⃣ 执行结果事件

``typescript
interface ActionResultEvent {
  processId: string
  step: string
  action: string
  status: 'SUCCESS' | 'FAIL'
  payload: any
  error?: string
  timestamp: Date
}


- 回传给 PM，用于推进流程状态或触发补偿
    

---

## **四、Robot-Engine 核心执行流程**

1. PM 下发 Command（动作名称 + payload）
    
2. Robot-Engine 查找动作注册表 → 找到 Outbound Port + 方法
    
3. 调用 Adapter 执行动作（RPC / MQ）
    
4. 并行执行 Step 内多动作
    
5. 捕获异常 → 并发布 ActionResultEvent 给 PM
    
6. 支持超时、重试和幂等执行
    

---

### **五、NestJS 示例代码**

``typescript
@Injectable()
export class RobotEngineService {
  private actionsRegistry = new Map<string, ActionEntry>()
  private portAdapters = new Map<string, any>()

  constructor(private eventBus: EventBus) {}

  // 注册 Adapter
  registerAdapter(portName: string, adapter: any) {
    this.portAdapters.set(portName, adapter)
  }

  // 注册动作
  registerAction(entry: ActionEntry) {
    this.actionsRegistry.set(entry.name, entry)
  }

  // 执行单个动作
  async executeCommand(processId: string, step: string, actionName: string, payload: any) {
    const entry = this.actionsRegistry.get(actionName)
    if (!entry) throw new Error(`Unknown action: ${actionName}`)

    const adapter = this.portAdapters.get(entry.port)
    if (!adapter || typeof adapter[entry.method] !== 'function') {
      throw new Error(`Adapter or method not found for action ${actionName}`)
    }

    let attempt = 0
    const maxRetry = entry.options?.retry || 0
    while (attempt <= maxRetry) {
      try {
        if (entry.type === 'RPC') {
          await adapter[entry.method](...Object.values(payload))
        } else if (entry.type === 'MQ') {
          await adapter[entry.method](...Object.values(payload)) // MQ publish
        }

        await this.eventBus.publish({
          type: 'ACTION_DONE',
          payload: { processId, step, action: actionName, status: 'SUCCESS', payload }
        })
        break
      } catch (err) {
        attempt++
        if (attempt > maxRetry) {
          await this.eventBus.publish({
            type: 'ACTION_DONE',
            payload: { processId, step, action: actionName, status: 'FAIL', payload, error: err.message }
          })
        }
      }
    }
  }

  // 并行执行 Step 内动作
  async executeStep(processId: string, step: string, actions: string[], payload: any) {
    await Promise.all(actions.map(a => this.executeCommand(processId, step, a, payload)))
  }
}

---

## **六、注意事项 / Best Practices**

1. **统一身份调用**
    
    - Robot-Engine 使用统一 serviceAccount
        
    - 触发来源信息保存在 PM / Event
        
2. **幂等性**
    
    - 动作必须幂等
        
    - 防止重复执行产生副作用
        
3. **超时 / 重试**
    
    - 动作级别超时
        
    - 异常重试
        
    - MQ 使用 Dead Letter Queue
        
4. **并行执行**
    
    - Step 内动作并行 → Promise.all / Worker Pool
        
    - 支持多子流程并行
        
5. **动作注册表**
    
    - 静态 + 配置化 + 插件化结合
        
    - 动态支持用户自定义动作
        
6. **事件驱动**
    
    - Robot-Engine 不直接更新流程状态 → PM 接收 ActionResultEvent
        
    - 支持异步、跨微服务调用
        
7. **动态可扩展**
    
    - 支持用户自定义 Adapter / Port
        
    - 支持新动作注册无需改核心代码
        

---

### **七、总结**

- **PM → RE → 下游模块** = 清晰职责链
    
- **动作注册表 + Adapter** = 高度解耦、可扩展
    
- **RPC / MQ 混合** = 支持同步/异步动作
    
- **并行 + 幂等 + 重试 + 超时** = 高可靠、高可用
    
- **事件驱动** = RE 不管理状态，PM 全权控制流程