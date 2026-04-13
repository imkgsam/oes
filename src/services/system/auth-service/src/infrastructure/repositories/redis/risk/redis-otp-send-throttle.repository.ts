import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { OTP_USAGES } from '../../../../common/constants'
import { OtpSendThrottleState } from '../../../../domain/aggregates/otp-send-throttle-state.aggregate'
import { IOtpSendThrottleRepository } from '../../../../domain/repositories/otp-send-throttle.repository'

@Injectable()
export class RedisOtpSendThrottleRepository implements IOtpSendThrottleRepository {
  private readonly OTP_SEND_PREFIX = 'otp_send_throttle:'
  private readonly redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    })
  }

  async findByIdentifierAndUsage(
    identifier: string,
    usage: OTP_USAGES
  ): Promise<OtpSendThrottleState | null> {
    const payload = await this.redis.get(this.getKey(identifier, usage))
    if (!payload) {
      return null
    }

    return OtpSendThrottleState.fromRedis(JSON.parse(payload))
  }

  async save(state: OtpSendThrottleState): Promise<void> {
    await this.redis.set(
      this.getKey(state.getIdentifier(), state.getUsage()),
      JSON.stringify(state.toRedis()),
      'EX',
      state.getTTLSeconds()
    )
  }

  private getKey(identifier: string, usage: OTP_USAGES): string {
    return `${this.OTP_SEND_PREFIX}${usage}:${identifier.toLowerCase()}`
  }
}
