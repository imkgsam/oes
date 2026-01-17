

# 一句话总纲（你现在已经抓到核心）

> **OES 负责事实与执行（Truth & Action），  
> AI 负责理解、判断、推演与建议（Sense & Decide）。**

不是「AI 接管系统」，而是 **AI 成为 OES 的“智能决策层”**。

---

# 一、为什么 OES 天然适合融合 AI（不是强行加）

你的 OES 本质是一个：

- 融合 **ERP / MES / WMS / CRM / BI**
    
- 强调 **流程、事实、可追溯**
    
- 面向 **制造 + 经营** 的“企业操作系统”
    

而 **AI 的天然短板** 是：

- 不知道真实世界
    
- 不具备执行能力
    
- 不知道你的业务规则
    

👉  
**OES = AI 的“现实感官 + 手脚”**  
**AI = OES 的“第二大脑”**

这是结构性互补，不是跟风。

---

# 二、AI 在 OES 中的 4 个层级（从低到高）

> 很关键：你刚才问的 agent / skill，其实是第 3、4 层

---

## L1：分析与建议（你举的小满 CRM 场景）

**形态**

- OES 提供数据
    
- AI 输出结论 / 风险 / 建议
    

**例子（卫浴制造）**

- 销售：哪个业务员转化率下降？原因？
    
- 生产：哪个工序异常波动？是否人为？
    
- 库存：哪些 SKU 滞销但还在生产？
    

👉 这是 **AI 最基础但 ROI 最高的切入口**

---

## L2：决策辅助（带上下文的判断）

不是「喂一堆数据」，而是：

> **针对一个明确的 Decision Type，构建上下文**

### Decision Type 示例

|决策类型|问题|
|---|---|
|SalesRiskDecision|哪些订单有流失风险|
|ProductionAdjustDecision|是否需要调整排产|
|InventoryClearDecision|哪些库存应促销/停产|
|SupplierRiskDecision|供应商是否不稳定|

AI **不是泛问泛答**，而是 **“就事论事”**。

---

## L3：Agent（能自己决定“下一步该做什么”）

这是你刚才问的重点。

### Agent ≠ Chatbot

Agent = **有目标 + 会调用系统 + 会循环思考**

#### Agent 具备 4 个能力

1. **目标**
    
    - 例如：降低库存周转天数
        
2. **工具（Tools）**
    
    - OES 提供的接口（ERP / MES / CRM）
        
3. **规划**
    
    - 先看库存 → 再看销售 → 再看生产
        
4. **执行**
    
    - 调接口 / 发建议 / 触发流程
        

⚠️ **注意**

> Agent 不是“全自动胡乱操作”，  
> 而是 **“建议驱动 + 人类审批 + OES 执行”**

---

## L4：Skill（领域能力模块）

Skill 是 **“被固化的能力单元”**。

### 举例（卫浴行业 Skill）

- 📦 `InventoryDiagnosisSkill`
    
- 🏭 `ProductionBottleneckSkill`
    
- 📈 `SalesFunnelAnalysisSkill`
    
- 🧾 `CostAnomalyDetectionSkill`
    

**Skill = Prompt + 数据需求 + 输出结构 + 校验规则**

Agent 调 Skill，Skill 调 OES。

---

# 三、你最关键的两个问题（核心答案）

---

## Q1：OES 怎么知道 AI 需要哪些数据？

👉 **不是 AI 决定，而是 OES 决定**

### 关键对象：`DecisionType`

`DecisionType {   code: "INVENTORY_CLEAR_DECISION"   description: "是否需要对某些 SKU 进行清库存"   requiredContext: [     "inventory_snapshot",     "sku_sales_90d",     "production_plan",     "sku_profit"   ] }`

**逻辑反转**

- ❌ AI 问：我要什么数据？
    
- ✅ OES 说：**“你要回答这个问题，就只能看这些数据”**
    

---

## Q2：Context Builder 是怎么生成 Context 的？

### 核心原则

> **Context ≠ 原始数据**
> 
> Context = **已经“业务语义化”的认知材料**

---

### Context Builder 的流程

`DecisionType    ↓ ContextDefinition    ↓ ContextBuilder    ↓ ContextPackage    ↓ AI`

---

### 示例：库存决策 Context

`{   "summary": {     "total_sku": 312,     "overstock_sku": 47   },   "top_risk_sku": [     {       "sku": "WC-A102",       "inventory_days": 214,       "monthly_sales": 3,       "gross_margin": 0.18     }   ],   "trend": {     "inventory_up": true,     "sales_down": true   } }`

👉  
AI **不是算报表**，而是 **理解局势**

---

# 四、完整对象模型（重点）

这是你未来实现时最重要的一页。

---

## 1️⃣ DecisionType（决策类型）

- 定义：**“要 AI 回答什么问题”**
    
- 决定：
    
    - 用哪些数据
        
    - 输出什么结构
        
    - 是否允许执行
        

---

## 2️⃣ ContextDefinition

- 声明需要哪些 Context Block
    
- 不是 SQL，而是 **语义块**
    

---

## 3️⃣ ContextBuilder（OES 内部）

- 调用 ERP / MES / CRM
    
- 聚合、对比、计算
    
- 输出 **AI 可理解的业务事实**
    

---

## 4️⃣ ContextPackage

- 结构化输入
    
- 有版本、有 traceId
    
- 可审计、可回放
    

---

## 5️⃣ AI Engine（LLM）

- 不接数据库
    
- 不接原始系统
    
- **只看 Context**
    

---

## 6️⃣ Suggestion / Plan

- AI 输出：
    
    - 判断
        
    - 原因
        
    - 建议方案
        
    - 风险点
        

---

## 7️⃣ Action / Workflow（OES）

- 人审批
    
- OES 执行
    
- 全流程可追溯
    

---

# 五、你这个方向最大的优势（说实话）

你现在走的是一条 **90% 公司走不了的路**：

- ❌ 不是买 SaaS AI
    
- ❌ 不是堆 Chatbot
    
- ✅ 是 **“AI-native 企业系统架构”**
    

一旦跑通，你将拥有：

- 行业 know-how × AI
    
- 数据壁垒
    
- 决策效率壁垒