# PDA Frontend Truth Source

> PDA terminal architecture remains governed by [docs/architecture/terminals/pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/terminals/pda.md). This document narrows the frontend responsibility boundary for PDA Web UI.

## 1. Positioning

The PDA frontend is the field-execution UI for managed Android PDA devices.

It is optimized for scanning, simple confirmation, large touch targets, rapid feedback, and short task flows. It should not become a small-screen tenant-web administration app.

## 2. Technical Boundary

- PDA Web must keep using the existing `app/pda/web` Vue 3, Vite, TypeScript, Pinia, Vue Router, and Vant stack.
- New PDA features should reuse existing PDA API client, bridge client, session store, heartbeat, diagnostic log, and route conventions.
- UI should use PDA-oriented cards, scan-first flows, strong feedback, and concise task surfaces.
- Do not introduce tenant-web Vben components into PDA.

## 3. Owns

PDA owns UI workflows for:

- scanning business identifiers
- confirming field facts
- moving objects between physical locations
- installing or removing objects at a line or station
- recording high-frequency execution quantities
- changing simple execution readiness states
- capturing lightweight field reasons
- showing concise current-state and warning information needed to continue work

## 4. Does Not Own

PDA does not own:

- master data configuration
- engineering design setup
- complex table administration
- printing labels or documents
- lifecycle rules
- audit or correction authority beyond the command it submits
- manual life-counter correction
- broad historical analysis

## 5. Design Rule

PDA workflows should reduce field work to scan, verify, choose the smallest necessary reason or quantity, and submit. If a flow requires complex selection, batch setup, printing, or broad comparison, it likely belongs in tenant-web.

