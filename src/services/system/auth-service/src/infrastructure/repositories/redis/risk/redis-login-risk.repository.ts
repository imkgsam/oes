import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { LoginFailureState } from 'src/domain/aggregates/login-failure-state.aggregate'
import { ILoginRiskRepository } from 'src/domain/repositories/login-risk.repository'

@Injectable()
export class RedisLoginRiskRepository implements ILoginRiskRepository {
  private readonly LOGIN_FAILURE_PREFIX = 'login_failure:'
  private readonly redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    })
  }

  async findByIdentifier(identifier: string): Promise<LoginFailureState | null> {
    const payload = await this.redis.get(this.getKey(identifier))
    if (!payload) {
      return null
    }

    return LoginFailureState.fromRedis(JSON.parse(payload))
  }

  async save(state: LoginFailureState): Promise<void> {
    await this.redis.set(
      this.getKey(state.getIdentifier()),
      JSON.stringify(state.toRedis()),
      'EX',
      state.getTTLSeconds()
    )
  }

  async delete(identifier: string): Promise<void> {
    await this.redis.del(this.getKey(identifier))
  }

  private getKey(identifier: string): string {
    return `${this.LOGIN_FAILURE_PREFIX}${identifier.toLowerCase()}`
  }
}
