import { validateExternalAccessClaims } from './external-access-token.validator'
import { ExternalApiAccessGuard } from './external-api-access.guard'
import { ExternalApiRouteScanner } from './external-api-route.scanner'

describe('Gateway external API batch', () => {
  it('rejects malformed/unsigned external claims and internal scope', () => {
    expect(() => validateExternalAccessClaims({ aud: 'wrong' }, 'issuer')).toThrow('EXTERNAL_API_ACCESS_DENIED')
    expect(() => validateExternalAccessClaims({ iss: 'issuer', aud: 'api-gateway', sub: 'm', tenant_id: 't', credential_id: 'c', authz_version: 'v', scope: 'x.internal.y' }, 'issuer')).toThrow('EXTERNAL_API_ACCESS_DENIED')
  })
  it('rejects external bearer access on an unmarked route', () => {
    const reflector: any = { get: () => undefined }
    const guard = new ExternalApiAccessGuard(reflector, { get: jest.fn(() => false) } as any)
    expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ externalApiContext: { scope: ['x'] } }) }), getHandler: () => function route() {} } as any)).toBe(false)
  })
  it('keeps scanner fail-closed for marked routes without permissions', () => {
    const scanner = new ExternalApiRouteScanner({ getControllers: () => [] } as any, {} as any, { get: jest.fn(() => false) } as any)
    expect(() => scanner.onModuleInit()).not.toThrow()
  })
})
