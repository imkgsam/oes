import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createGrpcServerCredentials } from '@oes/common/transport'
import { TENANT_ORG_AUDIENCE } from '../../src/modules/tenant-org-trusted-execution.module'

/** Locks the tenant-org-service token-only boundary to its exact audience and declaration source. */
describe('tenant-org-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(TENANT_ORG_AUDIENCE).toBe('urn:oes:service:tenant-org-service')
    const source = readFileSync(join(__dirname, '../../src/interfaces/grpc/tenant-org-management.grpc.controller.ts'), 'utf8')
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
