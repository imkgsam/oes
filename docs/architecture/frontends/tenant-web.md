# Tenant Web Frontend Truth Source

## 1. Positioning

`tenant-web` is the office and administration frontend for OES tenant users.

It is responsible for configuration, master data, governance, review, query, reporting, and exception correction. It is not the normal surface for high-frequency shop-floor or warehouse execution.

## 2. Technical Boundary

- `tenant-web` must evolve inside the existing Vben application structure.
- New management UI should prefer `ant-design-vue` components and existing local Vben patterns.
- Feature work should extend existing route, API, permission, locale, and view conventions.
- Do not replace the Vben shell, global navigation model, request client, or design system for one feature.

## 3. Owns

`tenant-web` owns UI workflows for:

- master data and configuration
- engineering setup
- tenant and organization administration
- role, permission, and policy governance
- complex tables, filters, details, history, and audit views
- batch preparation and printing
- approval or management decisions
- exception correction with audit reason
- dashboards and operational visibility

## 4. Does Not Own

`tenant-web` does not own:

- shop-floor scan execution as the normal path
- warehouse handheld execution as the normal path
- PDA device-native capability flows
- business lifecycle truth
- direct service database writes
- replacement implementations of PDA workflows

## 5. Web Versus Field Execution

Use `tenant-web` when the operator needs broad context, configuration fields, table comparison, review, printing, or historical investigation.

Do not use `tenant-web` as the primary surface for facts that happen physically at a station, line, storage area, or mobile device. Those facts should normally be captured by PDA or another field terminal and validated by the owning service.

