import { TokenRevocationService } from 'src/domain/ports/token.revocation.port'
import Redis from 'ioredis'

export class RedisTokenRevocationService implements TokenRevocationService {
  constructor(private redis: Redis) {}

  async revokeToken(jti: string, expiredAt: Date): Promise<void> {
    const ttl = Math.max(1, Math.floor((expiredAt.getTime() - Date.now()) / 1000))
    await this.redis.set(`jwt:blacklist:${jti}`, '1', 'EX', ttl)
  }
  async isTokenRevoked(jti: string): Promise<boolean> {
    return (await this.redis.exists(`jwt:blacklist:${jti}`)) === 1
  }
}
