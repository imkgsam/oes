# Security Policy

OES handles enterprise identity, permission governance, tenant boundaries, audit trails, and operational workflows. Security reports are taken seriously.

## Supported Versions

OES is currently in active pre-release development. Security fixes are applied to the main development line unless a release branch is explicitly announced.

## Reporting A Vulnerability

Please do not open a public GitHub issue for suspected vulnerabilities.

Report security issues by contacting the maintainers privately. If a GitHub Security Advisory channel is enabled for the repository, use that channel. Otherwise, contact the project owner through the repository profile and include:

- A clear description of the issue.
- Affected service, frontend, contract, or workflow.
- Reproduction steps or proof of concept, if safe to share.
- Potential impact on tenant isolation, authentication, authorization, auditability, or data exposure.
- Suggested remediation, if known.

## Security Review Focus

The highest-priority security areas are:

- Authentication and session handling.
- Permission, role, scope, and policy resolution.
- Tenant and organization isolation.
- Operator context and trace context propagation.
- Audit metadata preservation.
- BFF and gRPC contract boundaries.
- AI-assisted workflows that can access business capabilities.
- PDA and terminal device access policies.

## Disclosure Process

Maintainers will:

- Acknowledge valid reports as soon as practical.
- Reproduce and classify the issue.
- Prepare a fix or mitigation.
- Coordinate disclosure timing when public details could create risk.

Security fixes should preserve the architecture boundaries in [AGENTS.md](AGENTS.md). Temporary mitigations must be clearly marked with removal conditions.
