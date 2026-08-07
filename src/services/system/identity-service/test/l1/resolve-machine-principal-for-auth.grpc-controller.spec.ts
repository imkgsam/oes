import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Reads Identity's source proto so this controller-boundary test protects the frozen MACHINE wire surface. */
const readIdentityProto = (): string =>
  readFileSync(join(__dirname, '../../../../../common/src/contracts/identity_service/identity_query.proto'), 'utf8')

/** Prevents the Auth-only resolver and binding management RPCs from drifting into an unprotected or API-key surface. */
describe('MACHINE workload Identity gRPC contract', () => {
  it('defines the exact Auth resolver selectors and safe decision fields', () => {
    const source = readIdentityProto()
    expect(source).toContain('rpc ResolveMachinePrincipalForAuth(ResolveMachinePrincipalForAuthRequest) returns (ResolveMachinePrincipalForAuthResponse);')
    expect(source).toContain('string machine_principal_id = 1;')
    expect(source).toContain('string machine_workload_binding_id = 2;')
    expect(source).toContain('int64 machine_workload_binding_version = 3;')
    expect(source).toContain('string workload_spiffe_id = 4;')
    expect(source).toContain('bool allowed = 1;')
    expect(source).toContain('string decision_reference = 13;')
    expect(source).toContain('string reason_code = 14;')
  })

  it('defines binding enrollment and optimistic disable management RPCs', () => {
    const source = readIdentityProto()
    expect(source).toContain('rpc EnrollMachineWorkloadBinding(EnrollMachineWorkloadBindingRequest) returns (EnrollMachineWorkloadBindingResponse);')
    expect(source).toContain('rpc DisableMachineWorkloadBinding(DisableMachineWorkloadBindingRequest) returns (DisableMachineWorkloadBindingResponse);')
    expect(source).toContain('string idempotency_key = 3;')
    expect(source).toContain('int64 expected_binding_version = 2;')
    expect(source).toContain('MachineWorkloadBinding binding = 1;')
  })
})
