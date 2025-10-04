/**
 * 域名验证挑战生成器适配器
 *
 * 实现：IDomainChallengeGeneratorPort
 * 职责：在Infrastructure层实现Domain层定义的挑战生成能力
 *
 * 设计原则：
 * - 实现Domain层定义的Port接口
 * - 提供安全的挑战字符串生成
 * - 支持多种验证方法的挑战生成
 * - 可配置的过期时间和重试次数
 */

import {
  IDomainChallengeGeneratorPort,
  DomainVerificationMethod,
  DomainVerificationChallenge
} from '../../domain/ports'
import { Domain } from '../../domain/aggregates/domain.aggregate'
import { randomBytes, createHash } from 'crypto'

/**
 * 域名验证挑战生成器适配器
 *
 * 在Infrastructure层实现Domain层定义的挑战生成能力
 */
export class ChallengeGeneratorAdapter implements IDomainChallengeGeneratorPort {
  private readonly defaultExpirationHours: number
  private readonly defaultMaxRetries: number

  constructor(defaultExpirationHours: number = 24, defaultMaxRetries: number = 3) {
    this.defaultExpirationHours = defaultExpirationHours
    this.defaultMaxRetries = defaultMaxRetries
  }

  /**
   * 生成安全的验证挑战字符串
   * 使用加密安全的随机数生成器
   */
  generateChallengeString(): string {
    // 使用加密安全的随机数生成器
    const randomPart = randomBytes(16).toString('hex')
    const timestamp = Date.now().toString(36)
    const hash = createHash('sha256')
      .update(randomPart + timestamp)
      .digest('hex')
      .substring(0, 8)

    return `domain-verification-${timestamp}-${hash}`
  }

  /**
   * 生成域名验证挑战信息
   * 根据不同的验证方法生成相应的挑战指令
   */
  generateVerificationChallenge(
    domain: Domain,
    verificationMethod: DomainVerificationMethod
  ): DomainVerificationChallenge {
    const challenge = this.generateChallengeString()
    const expiresAt = new Date(Date.now() + this.defaultExpirationHours * 60 * 60 * 1000)

    switch (verificationMethod) {
      case DomainVerificationMethod.DNS_TXT:
        return {
          method: verificationMethod,
          challenge,
          instructions: this.generateDnsTxtInstructions(challenge),
          expiresAt,
          retryCount: 0,
          maxRetries: this.defaultMaxRetries
        }

      case DomainVerificationMethod.DNS_CNAME:
        return {
          method: verificationMethod,
          challenge,
          instructions: this.generateDnsCnameInstructions(domain, challenge),
          expiresAt,
          retryCount: 0,
          maxRetries: this.defaultMaxRetries
        }

      default:
        throw new Error(`Unsupported verification method: ${String(verificationMethod)}`)
    }
  }

  /**
   * 生成DNS TXT记录验证指令
   */
  private generateDnsTxtInstructions(challenge: string): string {
    return [
      '请添加以下TXT记录到您的DNS配置中：',
      '',
      `记录类型: TXT`,
      `记录名称: _domain-verification`,
      `记录值: ${challenge}`,
      '',
      '注意事项：',
      '1. 记录名称可以是 _domain-verification 或 @',
      '2. 记录值必须完全匹配（包括引号）',
      '3. DNS传播可能需要几分钟到几小时',
      '4. 验证将在24小时后过期'
    ].join('\n')
  }

  /**
   * 生成DNS CNAME记录验证指令
   */
  private generateDnsCnameInstructions(domain: Domain, challenge: string): string {
    return [
      '请添加以下CNAME记录到您的DNS配置中：',
      '',
      `记录类型: CNAME`,
      `记录名称: ${challenge}`,
      `记录值: verification.${domain.value}`,
      '',
      '注意事项：',
      '1. 记录名称必须是完整的子域名',
      '2. 记录值必须指向 verification.您的域名',
      '3. DNS传播可能需要几分钟到几小时',
      '4. 验证将在24小时后过期'
    ].join('\n')
  }
}

/**
 * 挑战生成器工厂
 *
 * 用于创建配置好的挑战生成器实例
 */
export class ChallengeGeneratorFactory {
  /**
   * 创建默认配置的挑战生成器
   */
  static createDefault(): ChallengeGeneratorAdapter {
    return new ChallengeGeneratorAdapter()
  }

  /**
   * 创建自定义配置的挑战生成器
   */
  static createCustom(expirationHours: number, maxRetries: number): ChallengeGeneratorAdapter {
    return new ChallengeGeneratorAdapter(expirationHours, maxRetries)
  }

  /**
   * 创建用于测试的挑战生成器
   * 使用固定的挑战字符串，便于测试
   */
  static createForTesting(): ChallengeGeneratorAdapter {
    return new TestingChallengeGeneratorAdapter()
  }
}

/**
 * 测试用的挑战生成器
 *
 * 生成固定的挑战字符串，便于单元测试
 */
class TestingChallengeGeneratorAdapter extends ChallengeGeneratorAdapter {
  private testChallengeCounter = 0

  generateChallengeString(): string {
    this.testChallengeCounter++
    return `test-challenge-${this.testChallengeCounter}`
  }
}
