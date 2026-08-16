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

## 6. Application Structure

Current code stays inside the existing Vben application and follows these ownership areas:

- `api/core/`: shared request/session primitives only.
- `api/bff/`: typed API Gateway/BFF clients grouped by capability.
- `modules/`: capability composition, route metadata and feature-local UI orchestration.
- `views/`: route-level pages; `_core` is limited to shell and platform surfaces.
- `components/`: reusable presentation components without business truth ownership.
- `store/`: session, verified account context, access summary and UI-only state kept separate.
- `router/routes/`: stable route definitions; backend navigation facts control visibility but do not define Vue component paths.

New capabilities extend these areas instead of creating a second application shell or parallel API/store conventions.

## 7. Data And State

- Session/token state is distinct from current account context.
- Account context is distinct from access summary, navigation and business read models.
- BFF responses are the frontend contract; tenant-web does not import service-internal DTOs or generated gRPC types.
- Business current state remains in the owning service; frontend stores may cache display data but never become truth sources.
- A context switch must use the backend switch flow and then refresh token, session context, access summary and navigation.
- Permission checks in the UI are visibility/experience controls; protected mutations still require server-side authorization.

## 8. Navigation And Information Architecture

Top-level navigation is organized by user work rather than microservice names. Stable groups may include workbench, collaboration, master data, commercial operations, supply/manufacturing, finance, analytics and administration.

Rules:

- route/component metadata stays frontend-owned;
- permission-service owns visible entry and landing-policy facts, not Vue routes or icons;
- feature/plugin enablement is not inferred from navigation visibility;
- one capability has one canonical route and may expose contextual cross-links rather than duplicate pages;
- terminal access and business permission remain separate gates.

## 9. Interaction Rules

- Prefer task-oriented pages over exposing raw service CRUD.
- Use tables for comparison and governance, details/drawers for focused inspection, and explicit confirmation for destructive or security-sensitive actions.
- Empty, loading, denied, partial and dependency-failure states must be distinguishable.
- Tenant/org/account selectors consume governed BFF queries and never accept arbitrary identifiers as authority.
- Cross-service pages show owner-sourced facts and preserve source/error boundaries instead of synthesizing a new frontend truth.

## 10. Change Discipline

- A feature may change only its capability module, required BFF client, routes/views and narrowly shared presentation components.
- Shell, request client, global store, navigation resolver and design-system changes require a separately frozen platform slice.
- Template/demo residues may be removed when unused; new business work must not depend on demo modules.
- New or rewritten code follows the repository UTF-8 and summary-comment rules.
- Frontend acceptance includes typecheck/build, focused tests and the relevant authenticated browser workflow.

## 11. Related Truth Sources

- [Gateway and BFF](../platforms/gateway-and-bff.md)
- [Unified web account context](../platforms/unified-web-account-context.md)
- [Authorization layering](../platforms/authorization-layering-and-resource-policy.md)
- [PDA frontend](./pda.md)
