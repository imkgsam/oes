import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { SelectAccountDto } from '../../interfaces/http/dtos/login.dto'
import { AuthResponseViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'
import { toAuthServiceLoginMethod } from './login-method.mapper'

interface SelectAccountClientContext {
  userAgent?: string
  ipAddress?: string
}

@Injectable()
// Selects one candidate account and normalizes the downstream session-establishment result.
export class SelectAccountUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: SelectAccountDto,
    source: DownstreamRequestSource,
    clientContext: SelectAccountClientContext
  ): Promise<AuthResponseViewModel> {
    const result = await this.authAdapter.selectAccount(
      {
        userId: dto.userId.trim(),
        accountId: dto.accountId.trim(),
        loginMethod: toAuthServiceLoginMethod(dto.loginMethod),
        deviceId: dto.device?.deviceId?.trim(),
        deviceName: dto.device?.deviceName?.trim(),
        userAgent: clientContext.userAgent?.trim(),
        ipAddress: clientContext.ipAddress?.trim()
      },
      source
    )

    return toAuthResponseViewModel(result)
  }
}
