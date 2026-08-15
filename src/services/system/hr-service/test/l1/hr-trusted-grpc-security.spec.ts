import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { HR_AUDIENCE } from '../../src/modules/hr-trusted-execution.module'

/** Locks the hr-service token-only boundary to its exact audience and declaration source. */
describe('hr-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(HR_AUDIENCE).toBe('urn:oes:service:hr-service')
    const source = readFileSync(join(__dirname, '../../src/interfaces/grpc/hr-management.grpc.controller.ts'), 'utf8')
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })
})
