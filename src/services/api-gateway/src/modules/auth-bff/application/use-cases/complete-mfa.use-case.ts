import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { TenantOrgQueryGrpcAdapter } from '../../infrastructure/downstream/tenant-org-service/tenant-org-query-grpc.adapter'
import { CompleteMfaDto } from '../../interfaces/http/dtos/login.dto'
import { AuthResponseViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'
import { hydrateAuthResponseTenantNames } from './auth-response-tenant-name.hydrator'
import { toAuthServiceLoginMethod } from './login-method.mapper'
import { toTerminalAccessDeniedAuthResponse } from './terminal-access-denial.mapper'

@Injectable()
// Completes a pending MFA challenge and returns the next normalized auth flow state.
export class CompleteMfaUseCase {
  constructor(
    private readonly authAdapter: AuthGrpcAdapter,
    private readonly tenantOrgAdapter?: TenantOrgQueryGrpcAdapter
  ) {}

  async execute(dto: CompleteMfaDto, source: DownstreamRequestSource): Promise<AuthResponseViewModel> {
    let result: Awaited<ReturnType<AuthGrpcAdapter['submitMfaChallenge']>>
    try {
      result = await this.authAdapter.submitMfaChallenge(
        dto.challengeId.trim(),
        dto.factor,
        dto.code.trim(),
        toAuthServiceLoginMethod(dto.loginMethod),
        dto.factorChallengeId?.trim() || undefined,
        dto.trustCurrentDevice,
        source
      )
    } catch (error) {
      const denial = toTerminalAccessDeniedAuthResponse(error)
      if (denial) {
        return denial
      }

      throw error
    }

    const hydratedResult = await hydrateAuthResponseTenantNames(
      result,
      source,
      this.tenantOrgAdapter
    )

    return toAuthResponseViewModel(hydratedResult)
  }
}
