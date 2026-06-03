# Frontend Architecture Truth Sources

> This directory defines stable frontend ownership boundaries. It does not replace service truth sources, BFF contracts, or terminal architecture documents.

## Purpose

OES has multiple frontend surfaces with different operating contexts. A feature must decide which surface owns each user action before UI implementation starts.

This directory answers:

- what each frontend owns
- what each frontend must not own
- which actions belong to office governance versus field execution
- how frontends consume BFFs without copying business rules

## Truth Sources

| Frontend | Truth source | Scope |
| --- | --- | --- |
| tenant-web | [tenant-web.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/frontends/tenant-web.md) | Office, administration, configuration, master data, governance, query, correction. |
| PDA | [pda.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/frontends/pda.md) | Field execution, scan confirmation, fast status changes, and device-native workflows. |

## Global Rules

- Business services own domain truth and lifecycle rules.
- API Gateway / BFF owns external HTTP shape and frontend-oriented orchestration.
- Frontends own interaction design, local state, display mapping, and user flow.
- Frontends must not directly encode core business rules that belong to a service.
- If a feature needs Web and PDA support, first classify actions by responsibility, then design each UI.
- Web and PDA may both read the same object, but only the correct operational surface should write each fact.

