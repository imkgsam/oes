import { Injectable, BadRequestException } from '@nestjs/common'
import { AuthStrategyPort } from '../../ports/auth-strategy.port'
import { LoginMethodEnum } from '../../../common/constants'

@Injectable()
export class AuthStrategyFactory {
  private readonly strategies = new Map<LoginMethodEnum, AuthStrategyPort<any>>()

  register(strategy: AuthStrategyPort) {
    this.strategies.set(strategy.getType() as LoginMethodEnum, strategy)
  }

  get(method: LoginMethodEnum): AuthStrategyPort<any> {
    const strategy = this.strategies.get(method)
    if (!strategy) throw new BadRequestException(`Unsupported login method: ${method}`)
    return strategy
  }
}
