import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { RefreshSessionDto } from '../../interfaces/http/dtos/login.dto'
import { RefreshSessionViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toRefreshSessionViewModel } from './auth-response.mapper'
import { toTerminalAccessDeniedRefreshResponse } from './terminal-access-denial.mapper'

@Injectable()
// Refreshes an existing session token pair and normalizes the downstream token payload.
export class RefreshSessionUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: RefreshSessionDto,
    source: DownstreamRequestSource
  ): Promise<RefreshSessionViewModel> {
    let result: Awaited<ReturnType<AuthGrpcAdapter['refreshSession']>>
    try {
      result = await this.authAdapter.refreshSession(dto.refreshToken.trim(), source)
    } catch (error) {
      const denial = toTerminalAccessDeniedRefreshResponse(error)
      if (denial) {
        return denial
      }

      throw error
    }
    return toRefreshSessionViewModel(result)
  }
}
