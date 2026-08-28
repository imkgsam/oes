import { CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AccountType, IS_PUBLIC_KEY } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { JWT_INVALID, JWT_MISSING } from '@oes/common/exceptions'
import { RpcException } from '@nestjs/microservices'
import { TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { AuthGrpcAdapter } from '../../modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'
import { GatewayVerifiedSourceCredentialVault } from '../grpc/gateway-verified-source-credential.vault'

// Validates gateway bearer tokens against auth-service session truth before protected requests proceed.
@Injectable()
export class GatewaySessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AuthGrpcAdapter) private readonly authAdapter: AuthGrpcAdapter,
    private readonly vault: GatewayVerifiedSourceCredentialVault,
    @Optional()
    private readonly sourceCredentialIssuer = new TransportPrivateSourceCredentialIssuer()
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    if (context.getType() !== 'http') return false

    const http = context.switchToHttp()
    const request = http.getRequest()
    const authHeader = request.headers['authorization'] || request.headers['Authorization']
    if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
      throw ExceptionFactory.application(JWT_MISSING)
    }

    const token = String(authHeader).slice(7).trim()
    if (!token) {
      throw ExceptionFactory.application(JWT_MISSING)
    }

    let result: Awaited<ReturnType<AuthGrpcAdapter['validateAccessToken']>>
    try {
      result = await this.authAdapter.validateAccessToken(token, {
        requestId: this.normalizeHeader(request.headers['x-request-id']),
        traceId: this.normalizeHeader(request.headers['x-trace-id']),
        traceparent: this.normalizeHeader(request.headers.traceparent),
        tracestate: this.normalizeHeader(request.headers.tracestate)
      })
    } catch (error) {
      if (this.isInvalidTokenError(error)) {
        throw ExceptionFactory.application(JWT_INVALID)
      }

      throw error
    }

    request['user'] = {
      id: result.userId,
      sub: result.userId,
      userId: result.userId,
      holderId: result.accountId,
      aid: result.accountId,
      tenantId: result.tenantId || undefined,
      tid: result.tenantId || undefined,
      displayName: result.displayName || undefined,
      sid: result.sessionId,
      scopeLevel: result.scopeLevel,
      terminal: result.terminal || undefined,
      allowedTerminals: result.allowedTerminals ?? [],
      passwordSetupRequired: Boolean(result.passwordSetupRequired),
      roles: result.roleIds ?? [],
      typ: AccountType.USER
    }
    this.vault.admitHumanSession(
      request,
      this.sourceCredentialIssuer.issueVerifiedSessionAccessCredential(token),
      http.getResponse()
    )
    return true
  }

  private normalizeHeader(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }

  private isInvalidTokenError(error: unknown): boolean {
    if (!(error instanceof RpcException)) {
      return false
    }

    const payload = error.getError()
    if (typeof payload !== 'object' || payload === null) {
      return false
    }

    const candidate = payload as { code?: unknown; grpcStatus?: unknown }
    return (
      candidate.code === 'AUTH_ACCESS_TOKEN_INVALID' ||
      candidate.grpcStatus === 16
    )
  }
}
