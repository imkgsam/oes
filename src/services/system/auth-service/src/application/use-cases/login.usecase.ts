import { Injectable } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
import { AuthStrategyPort } from 'src/domain/ports/auth-strategy.port'
import { SessionService } from '../services/session.service'
import { LoginResponseDto } from '@oes/common/dtos/auth-service/api/rpc/all.dto'
import { IIdentityServicePort } from '../ports'

@Injectable()
export class LoginUsecase {
  private strategyProviders = new Map<string, AuthStrategyPort>()

  constructor(
    strategyProdivers: AuthStrategyPort[],
    private readonly sessionService: SessionService,
    private readonly identityService: IIdentityServicePort
  ) {
    this.strategyProviders = new Map(strategyProdivers.map((s) => [s.getType(), s]))
  }

  /**
   * 登录 use case， 根据不同的登录方式，选择不同的认证策略进行认证
   * 1.
   * @param type
   * @param payload
   * @param deviceInfo
   * @returns
   */
  async login<T>(type: LoginMethodEnum, payload: T, deviceInfo?: any): Promise<LoginResponseDto> {
    const strategy = this.strategyProviders.get(type)
    if (!strategy) throw new Error(`Unsupported login method type: ${String(type)}`)
    const userId = await strategy.authenticate(payload)
    const user = await this.identityService.getUserById(userId)
    if (!user) throw new Error('User not found')
    const accounts = await this.identityService.this.sessionService.createSession(
      userId,
      deviceInfo
    )
  }
}
