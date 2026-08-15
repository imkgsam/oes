import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { PERMISSION_AUDIENCE } from '../../src/modules/authorization/permission-trusted-execution.module'

/** Locks the permission-service token-only boundary to its exact audience and declaration source. */
describe('permission-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(PERMISSION_AUDIENCE).toBe('urn:oes:service:permission-service')
    const source = readFileSync(join(__dirname, '../../src/interfaces/grpc/permission-management.grpc.controller.ts'), 'utf8')
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })

  it('fails closed without mTLS deployment configuration and installs server credentials unconditionally', () => {
    expect(() => createGrpcServerCredentials({})).toThrow('gRPC mTLS is required')
    const source = readFileSync(join(__dirname, '../../src/main.ts'), 'utf8')
    expect(source).toMatch(/credentials:\s*createGrpcServerCredentials\(\)/)
    expect(source).not.toMatch(/OES_GRPC_TLS_ENABLED/)
  })
})
