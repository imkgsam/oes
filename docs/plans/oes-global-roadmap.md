# OES Global Roadmap

## 1. 定位

本文档是 OES 项目级全局 roadmap 的长期沉淀。它只记录项目级能力层级、推进方向、依赖关系与当前优先级，不承载服务级详细设计。

Global Command Thread 是本文档唯一写入 owner。其他 thread 只能通过 Hub handoff / blocker / failure 将信息回报给 Global Command。

## 2. 能力层级

### 2.1 Foundation Layer

- auth-service
- identity-service
- permission-service
- tenant-org-service
- party-service
- terminal-device-service
- audit / observability
- operator context
- event bus
- contracts / gRPC metadata

### 2.2 Business Core Layer

- CRM
- Sales
- HR
- Finance
- WMS
- SRM
- Procurement
- Item Master
- MES
- IM / communication
- Email / mailbox
- Notification

### 2.3 Experience Layer

- tenant web
- admin portal
- employee mini-program
- PDA / terminal surface
- display website
- Chrome browser plugin
- API Gateway / BFF

### 2.4 AI / Automation Layer

- AI tool protocol
- knowledge retrieval
- approval workflow
- audit replay
- cost control
- agent workflow

### 2.5 Collaboration / Command Layer

- Codex Command Hub
- global thread control
- ownership registry
- handoff / blocker / failure routing
- roadmap export

## 3. 当前优先方向

### P0：Codex Command Hub 与全局协作治理

目的：

- 固化 Global Command / Management / Worker Thread 的协作模式
- 提供 task、ownership、handoff、blocker、failure 的统一入口
- 降低多 thread 并行时的文件冲突和归因成本

前置：

- `docs/governance/codex-global-command-model.md`
- `docs/governance/codex-command-hub.md`

### P1：Browser Plugin + CRM Customer Workflow

候选依赖：

- CRM customer master / customer query
- API Gateway / BFF exposure
- auth session / operator context
- permission decision
- audit
- AI tool protocol if plugin invokes AI actions

Global Command 只维护依赖链。Chrome 插件能力细节必须由 design thread 承接。

### P1：Foundation Platform Hardening

候选依赖：

- permission-service
- identity-service
- tenant-org-service
- party-service
- audit / observability
- gRPC metadata and service trust

### P2：Collaboration Services

候选方向：

- IM
- email / mailbox
- notification
- task collaboration

### P2：Manufacturing Flow

候选方向：

- MES production execution
- APS planning
- shop-floor workflow
- item / BOM / mold integration

### P2：Experience Surface Expansion

候选方向：

- display website
- employee mini-program
- admin portal hardening
- PDA / terminal workflows

## 4. 新功能 Intake 模板

```text
Feature:
Requested priority:
Proposed capability area:
Candidate owner group:
Suspected dependencies:
Required design thread:
Required architecture sources:
Required contract sources:
Collision risks:
Global Command decision:
```

Global Command 不得在 intake 中输出 final service placement、domain model、workflow、schema、API 或 event contract。
