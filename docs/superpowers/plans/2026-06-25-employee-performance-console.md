# Employee Performance Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tenant-web admin Employee Performance Console backed by an API Gateway CRM performance read facade.

**Architecture:** API Gateway exposes a read-only `/admin/crm/performance/overview` view model assembled from current CRM capabilities. Tenant-web renders an analytics-style command console with employee switching, source breakdown, trends, and recent activity while treating browser-extension data as one source slice.

**Tech Stack:** NestJS API Gateway, Vue 3 tenant-web, Vben UI conventions, ECharts, Vitest, Jest, TypeScript.

---

## Tasks

- [ ] Add API Gateway tests for the performance overview facade.
- [ ] Implement the API Gateway DTO, service, and controller.
- [ ] Add tenant-web API client tests and client function.
- [ ] Add tenant-web route and permission navigation seed.
- [ ] Add the analytics-style employee performance console page.
- [ ] Verify tenant-web unit tests, typecheck, build, and browser rendering.
