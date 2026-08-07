import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Protects the management boundary from silently dropping its permission gate or command mapping. */
describe('Machine workload binding management gRPC controller', () => {
  it('routes both lifecycle methods through the protected management controller', () => {
    const source = readFileSync(
      join(__dirname, '../../src/interfaces/grpc/identity-management.grpc.controller.ts'),
      'utf8'
    )
    expect(source).toContain("@RequirePermissions({ all: ['identity.machine.workload_binding.manage'] })")
    expect(source).toContain('async enrollMachineWorkloadBinding(')
    expect(source).toContain('new EnrollMachineWorkloadBindingCommand')
    expect(source).toContain('async disableMachineWorkloadBinding(')
    expect(source).toContain('new DisableMachineWorkloadBindingCommand')
  })
})
