import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthenticatedOperatorGuard,
  AuthorizeInternalCall,
  GrpcRequestContextInterceptor,
  IDENTITY_MACHINE_PERMISSION_CODES,
  InternalServiceGuard,
  PermissionGuard,
  RequirePermissions
} from '@oes/common/authorization'
import { AuthAudienceTrustedInternalExecutionGuard } from '../../modules/auth/auth-trusted-execution.module'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { ExternalApiKeyCredentialServiceController, ExternalApiKeyCredentialServiceControllerMethods } from '@oes/common/generated/auth_service'
import { ExternalApiKeyCredentialService } from '../../application/services/external-api-key-credential.service'
import { resolveExternalApiKeyContext } from './external-api-key-context.adapter'
import { GrpcExceptionFilter } from '../../../../../../common/dist/core/filters'
import { CompromiseExternalApiKeyVerifierVersionCommand } from '../../application/commands/auth'

const EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PERMISSION =
  'auth.internal.external_api_key.verifier_version.compromise'

/** Maps frozen API-key proto requests while deriving all authority from trusted gRPC runtime context. */
@Controller()
@UseFilters(GrpcExceptionFilter)
@UseInterceptors(GrpcRequestContextInterceptor)
@ExternalApiKeyCredentialServiceControllerMethods()
export class ExternalApiKeyGrpcController implements ExternalApiKeyCredentialServiceController {
  constructor(
    private readonly service: ExternalApiKeyCredentialService,
    private readonly commandBus: ValidatingCommandBus
  ) {}

  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.CREATE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async createExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
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
    if (!resolveExternalApiKeyContext(request).trustedHuman) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    const records = await this.service.list({ integrationMachineId: request.integrationMachineId ?? '' })
    return { credentials: records.map((record) => toGrpcCredential(record)) }
  }

  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.ROTATE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async rotateExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    const result = await this.service.rotate(request.credentialId ?? '')
    return {
      apiKey: result.apiKey,
      credential: toGrpcCredential(result.credential),
      predecessorCredentialId: request.credentialId ?? '',
      predecessorValidUntilUnixSeconds: String(
        Math.floor(result.predecessorValidUntil.getTime() / 1000)
      )
    }
  }

  @RequirePermissions({ all: [IDENTITY_MACHINE_PERMISSION_CODES.REVOKE_API_KEY] })
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard, PermissionGuard)
  async revokeExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).trustedHuman) {
      throw new Error('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
    }
    await this.service.revoke(request.credentialId ?? '')
    return { credential: { credentialId: request.credentialId ?? '', status: 'REVOKED' } }
  }

  @AuthorizeInternalCall({ all: ['auth.internal.external_api_key.exchange'] })
  @UseGuards(AuthAudienceTrustedInternalExecutionGuard)
  async exchangeExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(request).verifiedGatewayExchange) {
      throw new Error('EXTERNAL_API_KEY_INVALID')
    }
    const result = await this.service.exchangeExternalApiKey?.(request.presentedApiKey)
    return result ?? (() => {
      throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
    })()
  }

  @AuthorizeInternalCall({ all: [EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PERMISSION] })
  @UseGuards(AuthAudienceTrustedInternalExecutionGuard)
  async compromiseExternalApiKeyVerifierVersion(
    request: any,
    _metadata?: unknown,
    call?: unknown
  ): Promise<any> {
    const context = resolveExternalApiKeyContext(request)
    if (
      !context.verifiedSecurityOperationsCompromise ||
      !context.workloadSubject ||
      !context.workloadClientId
    ) {
      throw new Error('EXTERNAL_API_KEY_VERIFIER_COMPROMISE_DENIED')
    }
    const result = await this.commandBus.execute(
      new CompromiseExternalApiKeyVerifierVersionCommand({
        verifierKeyVersion: request.verifierKeyVersion ?? '',
        incidentReference: request.incidentReference ?? '',
        occurredAtUnixSeconds: Number(request.occurredAtUnixSeconds ?? 0),
        workloadSubject: context.workloadSubject,
        workloadClientId: context.workloadClientId,
        requestId: context.requestId,
        traceId: context.traceId
      })
    )
    return {
      incidentReference: result.incidentReference,
      matchedCredentialCount: result.matchedCredentialCount,
      newlyRevokedCredentialCount: result.newlyRevokedCredentialCount,
      alreadyRevokedCredentialCount: result.alreadyRevokedCredentialCount,
      completedAtUnixSeconds: Math.floor(result.completedAt.getTime() / 1000)
    }
  }
}

/** Maps stored non-secret credential metadata onto the frozen gRPC response shape. */
function toGrpcCredential(record: any) {
  return {
    credentialId: record.id ?? record.credentialId ?? '',
    integrationMachineId: record.integrationMachineId ?? '',
    keyIdentifier: record.keyIdentifier ?? '',
    status: record.status ?? '',
    createdAtUnixSeconds: record.createdAt
      ? String(Math.floor(new Date(record.createdAt).getTime() / 1000))
      : undefined,
    expiresAtUnixSeconds: record.expiresAt
      ? String(Math.floor(new Date(record.expiresAt).getTime() / 1000))
      : undefined,
    lastUsedAtUnixSeconds: record.lastUsedAt
      ? String(Math.floor(new Date(record.lastUsedAt).getTime() / 1000))
      : undefined,
    supersedesCredentialId: record.supersedesCredentialId ?? undefined
  }
}
