import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  IDENTITY_MACHINE_PERMISSION_CODES,
  InternalServiceGuard,
  PermissionGuard,
  RequireAuthenticatedOperator,
  RequirePermissions
} from '@oes/common/authorization'
import { ExternalApiKeyCredentialServiceController, ExternalApiKeyCredentialServiceControllerMethods } from '@oes/common/generated/auth_service'
import { ExternalApiKeyCredentialService } from '../../application/services/external-api-key-credential.service'
import { resolveExternalApiKeyContext } from './external-api-key-context.adapter'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'

/** Maps frozen API-key proto requests while deriving all authority from trusted gRPC runtime context. */
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseInterceptors(GrpcRequestContextInterceptor)
@ExternalApiKeyCredentialServiceControllerMethods()
export class ExternalApiKeyGrpcController implements ExternalApiKeyCredentialServiceController {
  constructor(private readonly service: ExternalApiKeyCredentialService) {}
  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.CREATE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async createExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    const result = await this.service.create({ integrationMachineId: request.integrationMachineId ?? '' })
    return { apiKey: result.apiKey, credential: toGrpcCredential(result.credential) }
  }
  @RequirePermissions({
    any: [
      IDENTITY_MACHINE_PERMISSION_CODES.CREATE_API_KEY,
      IDENTITY_MACHINE_PERMISSION_CODES.ROTATE_API_KEY,
      IDENTITY_MACHINE_PERMISSION_CODES.REVOKE_API_KEY
    ]
  })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async listExternalApiKeys(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    const records = await this.service.list({ integrationMachineId: request.integrationMachineId ?? '' })
    return { credentials: records.map((record) => toGrpcCredential(record)) }
  }
  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.ROTATE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async rotateExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    const result = await this.service.rotate(request.credentialId ?? '')
    return { apiKey: result.apiKey, credential: toGrpcCredential(result.credential), predecessorCredentialId: request.credentialId ?? '', predecessorValidUntilUnixSeconds: String(Math.floor(result.predecessorValidUntil.getTime() / 1000)) }
  }
  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.REVOKE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async revokeExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    await this.service.revoke(request.credentialId ?? '')
    return { credential: { credentialId: request.credentialId ?? '', status: 'REVOKED' } }
  }
  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  async exchangeExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).verifiedGatewayExchange) throw new Error('EXTERNAL_API_KEY_INVALID')
    const result = await this.service.exchangeExternalApiKey?.(request.presentedApiKey)
    return result ?? (() => { throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE') })()
  }
}

/** Maps stored non-secret credential metadata onto the frozen gRPC response shape. */
function toGrpcCredential(record: any) {
  return {
    credentialId: record.id ?? record.credentialId ?? '',
    integrationMachineId: record.integrationMachineId ?? '',
    keyIdentifier: record.keyIdentifier ?? '',
    status: record.status ?? '',
    createdAtUnixSeconds: record.createdAt ? String(Math.floor(new Date(record.createdAt).getTime() / 1000)) : undefined,
    expiresAtUnixSeconds: record.expiresAt ? String(Math.floor(new Date(record.expiresAt).getTime() / 1000)) : undefined,
    lastUsedAtUnixSeconds: record.lastUsedAt ? String(Math.floor(new Date(record.lastUsedAt).getTime() / 1000)) : undefined,
    supersedesCredentialId: record.supersedesCredentialId ?? undefined
  }
}
