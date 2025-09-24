/**
 * 技术组件，用于token黑名单控制的接口
 * 提供：
 * 1. 吊销
 * 2. 查询是否吊销
 */
export interface TokenRevocationService {
  revokeToken(jti: string, expiredAt: Date): Promise<void>
  isTokenRevoked(jti: string): Promise<boolean>
}
