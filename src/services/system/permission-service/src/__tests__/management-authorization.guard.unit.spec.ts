import type { ExecutionContext } from '@nestjs/common'
import { attachOperatorContext } from '@oes/common/authorization'
import { ManagementAuthorizationGuard } from '../interfaces/guards/management-authorization.guard'

/** Verifies management authorization retains the authenticated subject scope at the RBAC boundary. */
describe('ManagementAuthorizationGuard scope propagation', () => {
  it.each([
    ['TENANT', 'tenant-1'],
    ['SYSTEM', undefined]
  ] as const)(
    'passes the %s subject tenant to Permission eligibility',
    async (_scope, tenantId) => {
      const request = {}
      attachOperatorContext(request, {
        operator_id: 'account-1',
        operator_type: 'HUMAN',
        ...(tenantId ? { tenant_id: tenantId } : {}),
        issued_at: '2026-08-19T00:00:00.000Z',
        expires_at: '2026-08-19T01:00:00.000Z',
        issuer: 'auth-service',
        signature: 'verified'
      })
      const reflector = {
        getAllAndOverride: jest
          .fn()
          .mockReturnValueOnce(true)
          .mockReturnValueOnce('permission.list')
      }
      const accountAuthorizationService = {
        checkPermission: jest.fn().mockResolvedValue(true)
      }
      const context = {
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToRpc: () => ({ getData: () => request })
      } as unknown as ExecutionContext
      const guard = new ManagementAuthorizationGuard(
        reflector as never,
        accountAuthorizationService as never
      )

      await expect(guard.canActivate(context)).resolves.toBe(true)
      expect(accountAuthorizationService.checkPermission).toHaveBeenCalledWith(
        'account-1',
        'permission.list',
        tenantId
      )
    }
  )
})
