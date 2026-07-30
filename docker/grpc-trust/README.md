# Local gRPC workload trust

`bootstrap-local-trust.sh` creates an ephemeral local CA and a separate X.509-SVID-style leaf for every workload in `workloads.txt`. It deliberately refuses staging and production: those environments receive different CA, issuer and signing-key material through their deployment secret manager.

The runtime output is private and must not be committed. `environments.json` contains only immutable public identifiers and secret references; it contains no CA private key or JWT signing key.

`rotate-local-trust.sh` polls frequently enough to renew an 24-hour leaf before two-thirds of its lifetime. The root CA private key is only mounted by the local bootstrap/rotator; workload containers mount their own leaf directory.
