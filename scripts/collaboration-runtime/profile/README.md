# OES owner execution profile template

Render the four `{{...}}` owner paths to exact absolute paths, persist the rendered SHA-256 in the authorization envelope, and read it back before handoff. The template retains environment/private-key denies, uses `on-request` plus `auto_review`, and allows only the repository runtime, exact owner roots, task-local data/processes, loopback, and the approved GitHub/npm destinations.

A handoff accepts the profile only after `OES_EFFECTIVE_PROFILE_REPORT` records actual filesystem, Git, build/test, task-owned database, loopback, approved-network, credential-reference-key, and persisted approval-telemetry probes with `normalPermissionPromptCount=0`.
