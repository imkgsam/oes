# Event Bus And NATS Runtime Operations

Event subjects, streams, consumers, retry and DLQ semantics remain owned by the Event Bus architecture. Local provider selection and resource lifecycle are owned only by the unified runtime launcher.

## Local development

```bash
pnpm runtime:plan -- --profile DEV --test-class integration \
  --owners collaboration-service,notification-service --capabilities events
pnpm dev:system -- --task-key TASK_KEY
```

The DEV recipe provides machine-shared JetStream. Only declared event owners receive service credentials; the platform bootstrap authority is not injected into a service.

## Focused integration

```bash
pnpm runtime:run -- --profile LOCAL_INTEGRATION --test-class integration \
  --owners collaboration-service,notification-service \
  --capabilities events,network-trust --task-key TASK_KEY --migrate -- \
  pnpm test:run -- --type integration --owner collaboration-service
```

The run receives a temporary NATS instance with dynamic endpoint and run-scoped users. The manifest is published after readiness. Another run or service credential must be denied outside its declared subject permissions.

## CI and residue

CI selects the same planner/core with a job-private provider. On completion, inspect the exact cleanup record and the workflow's `oes.runtime.task-key` residue check. Do not use broad name or label deletion for recovery.

## Topology validation

`docker/nats/verify-topology.sh` validates the versioned topology and launcher declaration without starting another lifecycle. Replay/recovery credentials remain separately issued and narrowly scoped by the Event Bus contract.
