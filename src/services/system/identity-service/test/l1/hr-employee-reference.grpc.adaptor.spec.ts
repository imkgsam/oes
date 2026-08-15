import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { IdentityHrTrustedGrpcClient } from '../../src/infrastructure/adaptors/foundation-trusted-grpc.clients'
import { HrEmployeeReferenceGrpcAdaptor } from '../../src/infrastructure/adaptors/hr-employee-reference.grpc.adaptor'

/** Locks Identity's HR reference adapter to its target-bound mTLS provider. */
describe('HrEmployeeReferenceGrpcAdaptor wiring', () => {
  it('injects the dedicated HR client instead of a generic client token', () => {
    expect(Reflect.getMetadata('design:paramtypes', HrEmployeeReferenceGrpcAdaptor)).toEqual([
      IdentityHrTrustedGrpcClient
    ])
    const source = readFileSync(join(__dirname, '../../src/infrastructure/adaptors/foundation-trusted-grpc.clients.ts'), 'utf8')
    expect(source).toMatch(/class IdentityHrTrustedGrpcClient/)
    expect(source).toMatch(/credentials:\s*createGrpcClientCredentials\(\)/)
  })
})
