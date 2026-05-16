# PDA Contracts

> PDA contract 只描述终端侧 JS Bridge 与 BFF 消费边界，不拥有 terminal access、access summary、Role、Policy 或授权判定真相；这些以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。

## 1. Purpose

This directory records PDA terminal contracts that are not service-owned gRPC contracts and are not public Web management contracts.

PDA contracts here describe stable black-box agreements between PDA terminal layers, especially:

- Android Shell
- Vue3 PDA Web
- PDA device capabilities

## 2. Current Contracts

| Contract | Purpose |
| --- | --- |
| [js-bridge.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/pda/js-bridge.md) | Cross-device PDA capability contract between Android Shell and Vue3 PDA Web. |

## 3. Boundary

PDA terminal contracts must not redefine:

- authentication truth
- identity truth
- permission truth
- terminal access truth
- WMS / MES business truth
- device management truth

Those truths belong to their corresponding service, collaboration, contract, or ADR documents.
