import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import { IdentityExternalCredentialAdmissionGuard } from '../../modules/identity-trusted-execution.module'
import {
  AuthenticateApiKeyRequest,
  AuthenticateApiKeyResponse,
  IdentityMachineAuthServiceController,
  IdentityMachineAuthServiceControllerMethods
} from '@oes/common/generated/identity_service'
import { AuthenticateApiKeyCommand } from '../../application/commands'
import { IdentityAuditService } from '../../application/services/identity-audit.service'
import { classifyAuditResult, extractAuditErrorDetails } from './grpc-audit-support'
import { IdentityGrpcPresenter } from './identity-grpc.presenter'

@UseFilters(GrpcExceptionFilter)
@UseGuards(IdentityExternalCredentialAdmissionGuard)
@Controller()
@IdentityMachineAuthServiceControllerMethods()
export class IdentityMachineAuthGrpcController implements IdentityMachineAuthServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly identityAuditService: IdentityAuditService
  ) {}

  async authenticateApiKey(
    request: AuthenticateApiKeyRequest
  ): Promise<AuthenticateApiKeyResponse> {
    try {
      const result = await this.commandBus.execute(new AuthenticateApiKeyCommand(request.secret!))

      this.identityAuditService.emitApiKeyAuthenticated(result.apiKey, result.serviceAccount)

      return {
        principal: {
          apiKey: IdentityGrpcPresenter.toApiKey(result.apiKey),
          account: IdentityGrpcPresenter.toServiceAccount(result.serviceAccount)
        }
      }
    } catch (error) {
      this.identityAuditService.emitEnvelope('API_KEY_AUTHENTICATED', 'machine', {
        operator: {
          operatorId: null,
          operatorType: 'SYSTEM'
        },
        scope: {
          tenantId: null,
          orgId: null
        },
        resource: {
          resourceType: 'api_key',
          resourceId: null
        },
        result: classifyAuditResult(error),
        details: {
          authenticationMethod: 'API_KEY',
          ...extractAuditErrorDetails(error)
        }
      })
      throw error
    }
  }
}
