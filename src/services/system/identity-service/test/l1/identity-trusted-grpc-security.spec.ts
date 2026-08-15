import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IDENTITY_AUDIENCE } from '../../src/modules/identity-trusted-execution.module'

/** Locks the identity-service token-only boundary to its exact audience and declaration source. */
describe('identity-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(IDENTITY_AUDIENCE).toBe('urn:oes:service:identity-service')
    const source = readFileSync(join(__dirname, '../../src/interfaces/grpc/identity-management.grpc.controller.ts'), 'utf8')
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })
})
