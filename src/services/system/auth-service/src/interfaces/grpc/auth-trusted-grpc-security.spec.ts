import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AUTH_AUDIENCE } from '../../modules/auth/auth-trusted-execution.module'

/** Locks the auth-service token-only boundary to its exact audience and declaration source. */
describe('auth-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(AUTH_AUDIENCE).toBe('urn:oes:service:auth-service')
    const source = readFileSync(join(__dirname, 'auth.grpc.controller.ts'), 'utf8')
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })
})
