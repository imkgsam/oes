import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Metadata } from '@grpc/grpc-js'
import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import {
  AUTH_AUDIENCE,
  AuthTrustedExecutionGuard
} from '../../modules/auth/auth-trusted-execution.module'
import { AuthGrpcController } from './auth.grpc.controller'

/** Locks the auth-service token-only boundary to its exact audience and declaration source. */
describe('auth-service trusted gRPC security', () => {
  it('uses one canonical target audience and no legacy class guard', () => {
    expect(AUTH_AUDIENCE).toBe('urn:oes:service:auth-service')
    const source = readFileSync(join(__dirname, 'auth.grpc.controller.ts'), 'utf8')
    expect(source).not.toMatch(/@UseGuards\(InternalServiceGuard/)
    expect(source).not.toMatch(/@RequireAuthenticatedOperator/)
  })

  it.each([
    ['WEB', true],
    ['PDA', true],
    ['KIOSK', false]
  ] as const)(
    'enforces the exact logout terminal declaration for %s',
    async (terminal, allowed) => {
      const declaration = getRpcAuthorizationModeDeclaration(AuthGrpcController.prototype, 'logout')
      const metadata = new Metadata()
      metadata.set('authorization', 'Bearer e30.e30.e30')
      metadata.set('x-request-id', 'request-1')
      metadata.set('traceparent', '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01')
      const data = {}
      const reflector = {
        getAllAndOverride: jest.fn((key: string) =>
          key === 'oes:auth:public-admission' ? undefined : declaration
        )
      }
      const verifier = {
        verify: jest.fn(async () => ({
          issuer: 'https://auth.local.oes.example',
          audience: AUTH_AUDIENCE,
          subject: 'account-1',
          clientId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          tokenId: 'token-1',
          issuedAt: 1,
          notBefore: 1,
          expiresAt: 2,
          certificateThumbprint: 'A'.repeat(43),
          principalType: 'HUMAN',
          permissionCodes: [],
          sessionTerminal: terminal
        }))
      }
      const identity = {
        getVerifiedWorkloadIdentity: jest.fn(async () => ({
          spiffeId: 'spiffe://local.oes.internal/ns/oes/sa/api-gateway',
          certificateThumbprint: 'A'.repeat(43)
        }))
      }
      const handler = jest.fn()
      const context = {
        getHandler: jest.fn(() => handler),
        getClass: jest.fn(),
        getArgByIndex: jest.fn(() => ({ getAuthContext: jest.fn() })),
        switchToRpc: jest.fn(() => ({ getContext: () => metadata, getData: () => data }))
      }
      const guard = new AuthTrustedExecutionGuard(
        reflector as never,
        verifier as never,
        identity as never
      )

      const decision = guard.canActivate(context as never)
      if (allowed) await expect(decision).resolves.toBe(true)
      else await expect(decision).rejects.toThrow('Access denied')
    }
  )
})
