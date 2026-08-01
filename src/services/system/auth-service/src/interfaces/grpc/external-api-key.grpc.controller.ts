import { Controller } from '@nestjs/common'
import { ExternalApiKeyCredentialServiceController, ExternalApiKeyCredentialServiceControllerMethods } from '@oes/common/generated/auth_service'
import { ExternalApiKeyCredentialService } from '../../application/services/external-api-key-credential.service'
import { resolveExternalApiKeyContext } from './external-api-key-context.adapter'

/** Maps frozen API-key proto requests while deriving all authority from trusted gRPC runtime context. */
@Controller()
@ExternalApiKeyCredentialServiceControllerMethods()
export class ExternalApiKeyGrpcController implements ExternalApiKeyCredentialServiceController {
  constructor(private readonly service: ExternalApiKeyCredentialService) {}
  async createExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    const context = resolveExternalApiKeyContext(call); const result = await this.service.create({ trustedHuman: context.trustedHuman, permitted: context.trustedHuman, tenantId: context.tenantId, integrationMachineId: request.integrationMachineId ?? '' })
    return { apiKey: result.apiKey, credential: { credentialId: result.credentialId } }
  }
  async listExternalApiKeys(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    const context = resolveExternalApiKeyContext(call); const records: readonly any[] = await this.service.list({ trustedHuman: context.trustedHuman, permitted: context.trustedHuman, tenantId: context.tenantId, integrationMachineId: request.integrationMachineId ?? '' })
    return { credentials: records.map((record) => ({ credentialId: record.id, keyIdentifier: record.keyIdentifier, integrationMachineId: record.integrationMachineId, status: record.status })) }
  }
  async rotateExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    const context = resolveExternalApiKeyContext(call)
    const result = await this.service.rotate(request.credentialId ?? '', { trustedHuman: context.trustedHuman, permitted: context.trustedHuman, tenantId: context.tenantId, integrationMachineId: '' })
    return { apiKey: result.apiKey, credential: { credentialId: result.credentialId }, predecessorCredentialId: request.credentialId ?? '', predecessorValidUntilUnixSeconds: String(Math.floor(result.predecessorValidUntil.getTime() / 1000)) }
  }
  async revokeExternalApiKey(request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    const context = resolveExternalApiKeyContext(call); await this.service.revoke(request.credentialId ?? '', context.trustedHuman, context.trustedHuman)
    return { credential: { credentialId: request.credentialId ?? '', status: 'REVOKED' } }
  }
  async exchangeExternalApiKey(_request: any, _metadata?: unknown, call?: unknown): Promise<any> {
    if (!resolveExternalApiKeyContext(call).verifiedGatewayExchange) throw new Error('EXTERNAL_API_KEY_INVALID')
    throw new Error('EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE')
  }
}
