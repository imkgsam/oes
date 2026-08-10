import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { Metadata } from '@grpc/grpc-js'
import { Reflector } from '@nestjs/core'
import { TrustedExecutionGuard } from '@oes/common/authorization'
import { BrowserActivityGrpcController } from '../../src/interfaces/grpc/browser-activity.grpc.controller'

/** Verifies Browser Activity exposes exactly the frozen BUSINESS and SELF_SERVICE terminal matrix. */
describe('Browser Activity trusted gRPC declarations', () => {
  it('declares nine WEB BUSINESS methods and four Browser Extension SELF_SERVICE methods', () => {
    const business = [
      ['getPolicy', 'browser_activity.policy.read'],
      ['updatePolicy', 'browser_activity.policy.manage'],
      ['getEmployeeAuditGrants', 'browser_activity.overview.read'],
      ['updateEmployeeAuditGrant', 'browser_activity.policy.manage'],
      ['getOverview', 'browser_activity.overview.read'],
      ['getEmployeeTimeline', 'browser_activity.employee_detail.read'],
      ['getDomainAggregation', 'browser_activity.url_detail.read'],
      ['searchUrls', 'browser_activity.url_detail.read'],
      ['getOnlinePresence', 'browser_activity.overview.read']
    ] as const
    for (const [method, code] of business) {
      expect(
        getRpcAuthorizationModeDeclaration(BrowserActivityGrpcController.prototype, method)
      ).toEqual({
        mode: 'BUSINESS',
        permissions: { all: [code] },
        sessionTerminal: 'WEB'
      })
    }
    for (const method of ['getAuditControl', 'appendVisitSessions', 'heartbeat', 'disconnect']) {
      expect(
        getRpcAuthorizationModeDeclaration(BrowserActivityGrpcController.prototype, method)
      ).toEqual({
        mode: 'SELF_SERVICE',
        allowDelegated: false,
        sessionTerminal: 'BROWSER_EXTENSION'
      })
    }
  })

  it('rejects wrong terminal and MACHINE/DELEGATED claims before controller data', async () => {
    const guard = new TrustedExecutionGuard(
      new Reflector(),
      {
        verify: jest
          .fn()
          .mockResolvedValue({
            principalType: 'HUMAN',
            permissionCodes: ['browser_activity.policy.read'],
            sessionTerminal: 'BROWSER_EXTENSION'
          })
      } as any,
      {
        getVerifiedWorkloadIdentity: jest
          .fn()
          .mockResolvedValue({
            spiffeId: 'spiffe://gateway',
            certificateThumbprint: 'A'.repeat(43)
          })
      } as any,
      'urn:oes:service:browser-activity-service'
    )
    const metadata = new Metadata()
    metadata.set('authorization', 'Bearer token')
    const context = {
      getHandler: () => BrowserActivityGrpcController.prototype.getPolicy,
      getClass: () => BrowserActivityGrpcController,
      getArgByIndex: () => ({}),
      switchToRpc: () => ({ getContext: () => metadata, getData: () => ({}) })
    } as any
    await expect(guard.canActivate(context)).rejects.toBeDefined()
  })
})
