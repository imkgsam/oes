import { Injectable } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants/const/auth-service.const'
import { AuthStrategyPort } from 'src/domain/ports/auth-strategy.port'
import { SessionService } from '../services/session.service'

@Injectable()
export class LoginUsecase {
  private strategyProviders = new Map<string, AuthStrategyPort>()

  constructor(
    strategyProdivers: AuthStrategyPort[],
    private readonly sessionService: SessionService
  ) {
    this.strategyProviders = new Map(strategyProdivers.map((s) => [s.getType(), s]))
  }
  async login<T>(type: LoginMethodEnum, payload: T, deviceInfo?: any) {
    const strategy = this.strategyProviders.get(type)
    if (!strategy) throw new Error(`Unsupported login method type: ${String(type)}`)
    const userId = await strategy.authenticate(payload)
    return this.sessionService.createSession(userId, deviceInfo)
  }
}
