# Trusted gRPC Workload Identity

The trusted gRPC architecture remains authoritative for SPIFFE identities, peer admission, execution tokens, and certificate semantics. The unified local runtime owns only profile selection, per-run CA/certificate creation, dynamic endpoints, minimal injection, and exact reconciliation.

## Plan and run

```bash
pnpm runtime:plan -- --profile LOCAL_INTEGRATION --test-class integration \
  --owner collaboration-service --capabilities network-trust
pnpm runtime:run -- --profile LOCAL_INTEGRATION --test-class integration \
  --owner collaboration-service --capabilities network-trust \
  --task-key TASK_KEY -- COMMAND ARGUMENTS
```

The launcher issues a per-run CA and one owner certificate whose URI SAN binds the run and service. The selected process receives only its CA, certificate, private-key path, and SPIFFE ID; private-key bytes never enter the manifest or evidence. CI creates equivalent job-private material. DEV retains machine-stable material within its shared provider identity.

Cross-service tests must declare `network-trust`; Unit and Component tests receive no real certificate or network. Cleanup deletes only exact run certificate files after the owner process stops and preserves any identity mismatch.
