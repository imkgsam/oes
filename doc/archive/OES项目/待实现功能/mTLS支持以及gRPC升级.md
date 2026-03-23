
> 简单一句话讲： TCP需要升级为grpc 才能支持mTLS， serivce->service 之间的调用不通过token来做身份认证，而是通过证书

# 一、当前事实前提（我们先对齐现实）

你现在的系统具备以下真实约束（这是合理的）：

- 微服务通信：**NestJS ClientProxy + TCP**
    
- 微服务运行环境：Docker / 内网
    
- 对外入口：**仅 api-gateway 暴露 HTTP**
    
- 目前阶段：**开发期 / 高频迭代期**
    
- 已有模块：
    
    - auth-service
        
    - identity-service
        
    - permission-service
        
    - entity-service
        
    - ERP / MES / WMS
        
    - api-gateway
        
    - IM / email / notification
        

👉 **我们不会否定这个选择，而是在此之上设计“不会翻车的演进路径”**

---

# 二、你这个系统需要解决的“身份问题”本质上只有三类

这是理解一切的根基。

## ① 人（User）

- 登录
    
- 有租户
    
- 有角色 / 权限 / scope
    
- 会话 / JWT
    

你已经设计得很好：

- identity-service：User / UserAccount / Tenant
    
- auth-service：LoginMethod / Session / Token
    
- permission-service：Role / Permission / Scope
    

✔ 完整 ✔ 正确

---

## ② 非人主体（ServiceAccount）

包括：

- 第三方系统（API 调用）
    
- Bot / 自动化
    
- Webhook
    
- CLI / Script
    

特点：

- **不在你的微服务网络**
    
- **无法使用 mTLS**
    
- 必须靠 **secret / apiKey**
    

你已经有：

`ServiceAccount APIKey AccountType.SERVICE`

✔ 非常正确

---

## ③ 微服务本身（Service Identity）

例如：

- auth-service
    
- identity-service
    
- permission-service
    
- ERP-service
    

这是**最容易被误用 token 的一类**。

> ⚠️ 微服务 ≠ ServiceAccount

微服务是“系统内部组件”，不是“业务主体”。

---

# 三、在「ClientProxy + TCP 开发期」的**正确安全模型**

我们现在进入核心。

## 重要原则（请记住）

> **开发期 TCP = 默认信任网络  
> 但逻辑上必须“按未来 mTLS 来设计”**

---

## 四、开发期（TCP）下的最终推荐分工

### 1️⃣ 微服务 ↔ 微服务（TCP）

#### ✔ 当前阶段：**不做 token 认证**

- auth ↔ identity
    
- auth ↔ permission
    
- ERP ↔ identity
    
- MES ↔ permission
    

原因：

- TCP 无服务身份
    
- token 会制造循环依赖
    
- 开发期信任内网是现实选择
    

👉 **这是“显式信任”，不是偷懒**

---

### 2️⃣ api-gateway → 内部微服务（TCP）

#### ✔ 当前阶段：**不使用 serviceAccount token**

但要注意一个关键点：

> ❗ **gateway 不是主体，它只是“转发请求”**

#### gateway 的职责

- 校验外部 token（USER / SERVICE）
    
- 解析 token
    
- 将“请求上下文”传给下游
    

---

## 五、开发期你“必须已经具备”的 Request Context 模型（非常关键）

### 这是你未来升级的“锚点”

你现在就应该在 TCP payload 里统一传：

`interface RequestContext {   requestId: string;   actorType: 'USER' | 'SERVICE';   actorId: string; // userAccountId or serviceAccountId   tenantId?: string;   roles?: string[];   permissions?: string[]; }`

### TCP 调用示例

`client.send(   { cmd: 'order.create' },   {     ctx,     data: { ... }   } );`

> ⚠️ **ctx ≠ 鉴权**
> 
> ctx 是“语义上下文”，不是安全凭证

但：

> **ctx 的结构 = 未来 JWT claims**

---

## 六、auth-service 在当前阶段的“正确职责”

### auth-service 只做三件事

#### ① 用户登录 → JWT

- 使用 auth-service 自己的 schema
    
- user / session / refreshToken
    

#### ② ServiceAccount（外部）→ JWT

- clientId + secret / apiKey
    
- 调用 identity-service 查询 ServiceAccount
    
- 签发 **SERVICE 类型 JWT**
    

#### ③ Token 生命周期管理

- refresh
    
- revoke
    
- expire
    

---

### auth-service **不应该做的事**

❌ 给内部微服务签 token  
❌ 给自己签 token  
❌ 用 token 调用 identity-service

---

## 七、identity-service 在当前阶段的“真实定位”

identity-service 是：

> **系统“身份数据源”**

它负责：

- User / UserAccount / Tenant
    
- ServiceAccount / APIKey
    
- 是否启用 / 层级 / 归属
    

它**不关心 token**。

---

## 八、permission-service 在当前阶段的定位

permission-service 只认一件事：

> **“谁（accountId / serviceAccountId）  
> 在哪个 tenant  
> 拥有什么权限 / scope”**

它不关心：

- token 是怎么来的
    
- 请求是 HTTP 还是 TCP
    

---

## 九、在 TCP 阶段，你“绝对不要做”的几件事

### ❌ 1. 不要让微服务用 secret 换 token 再调用别的微服务

这是你已经察觉到的**循环依赖地狱**。

---

### ❌ 2. 不要在内部 RPC 上“假装自己很安全”

比如：

`Authorization: Bearer xxx`

但没有真正校验来源。

---

### ❌ 3. 不要把 gateway 当成“超级账号”

gateway 不应该：

- 拥有 system token
    
- 代表自己访问所有资源
    

---

## 十、未来升级到 gRPC + mTLS 时，会发生什么？

### **几乎不改业务代码**

### 变化点：

|维度|变化|
|---|---|
|TCP → gRPC|transport 层|
|ctx → JWT|上下文来源|
|信任内网|mTLS 证书|
|Service Identity|证书 CN / SAN|

---

### 那时的最终模型会变成：

`[User / ServiceAccount]         │         ▼      JWT (谁)         │  api-gateway         │   (透传)         ▼  gRPC + mTLS (是谁调用)         │   microservice`

---

## 十一、你的 schema 是否“为未来准备好了”？

### 答案：**是的，而且是少见的清晰**

- identity-service：ServiceAccount / Level / Type ✔
    
- permission-service：AccountType.USER / SERVICE ✔
    
- auth-service：token / session 独立 ✔
    

你现在**不需要推翻任何模型**。

---

## 十二、最终一句话总结（你可以直接抄进设计文档）

> **开发期：  
> 微服务间用 TCP，信任内网，不用 token  
> token 只用于“外部 → gateway”
> 
> 设计期：  
> ctx 结构即未来 JWT claim  
> 微服务永远不依赖 token 建立信任
> 
> 升级期：  
> TCP → gRPC  
> 信任内网 → mTLS  
> token 不动，模型不变**