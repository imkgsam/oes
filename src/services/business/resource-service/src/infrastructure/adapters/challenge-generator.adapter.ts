import { Injectable } from '@nestjs/common'
import {
  IDomainChallengeGeneratorPort,
  DomainVerificationMethod,
  DomainVerificationChallenge
} from '../../domain/ports/domain-challenge-generator.port'
import { Domain } from '../../domain/aggregates/domain.aggregate'
import { randomBytes, createHash } from 'crypto'

/**
 * 挑战生成器适配器
 *
 * 职责：
 * 1. 生成安全的验证挑战字符串
 * 2. 创建验证挑战信息
 * 3. 提供挑战过期时间管理
 * 4. 支持多种验证方法
 *
 * 设计原则：
 * - 安全性：使用加密安全的随机数生成器
 * - 唯一性：确保挑战字符串的唯一性
 * - 可读性：生成便于用户配置的挑战
 * - 可扩展性：支持新的验证方法
 */
@Injectable()
export class ChallengeGeneratorAdapter implements IDomainChallengeGeneratorPort {
  private readonly CHALLENGE_LENGTH = 32
  private readonly CHALLENGE_EXPIRY_HOURS = 24
  private readonly MAX_RETRIES = 3

  generateChallengeString(): string {
    // 使用加密安全的随机数生成器
    const randomData = randomBytes(this.CHALLENGE_LENGTH)

    // 转换为Base64编码，便于用户配置
    const challenge = randomData
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    return challenge
  }

  generateVerificationChallenge(
    domain: Domain,
    verificationMethod: DomainVerificationMethod
  ): DomainVerificationChallenge {
    const challenge = this.generateChallengeString()
    const expiresAt = new Date(Date.now() + this.CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000)

    const instructions = this.generateInstructions(domain, verificationMethod, challenge)

    return {
      method: verificationMethod,
      challenge,
      instructions,
      expiresAt,
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    }
  }

  /**
   * 生成验证指令
   */
  private generateInstructions(
    domain: Domain,
    method: DomainVerificationMethod,
    challenge: string
  ): string {
    switch (method) {
      case DomainVerificationMethod.DNS_TXT:
        return this.generateTxtInstructions(domain, challenge)

      case DomainVerificationMethod.DNS_CNAME:
        return this.generateCnameInstructions(domain, challenge)

      default:
        throw new Error(`Unsupported verification method: ${method}`)
    }
  }

  /**
   * 生成TXT记录验证指令
   */
  private generateTxtInstructions(domain: Domain, challenge: string): string {
    return `
请按照以下步骤验证域名 ${domain.value}：

1. 登录您的域名管理控制台
2. 找到域名 ${domain.value} 的DNS设置
3. 添加一条TXT记录：
   - 记录名称：@ 或 ${domain.value}
   - 记录类型：TXT
   - 记录值：${challenge}
   - TTL：300（或默认值）

4. 保存设置并等待DNS传播（通常需要5-30分钟）
5. 返回此页面点击"验证"按钮

注意事项：
- TXT记录值必须完全匹配：${challenge}
- 不要添加引号或其他字符
- 如果验证失败，请等待更长时间让DNS传播完成
- 验证有效期为24小时
    `.trim()
  }

  /**
   * 生成CNAME记录验证指令
   */
  private generateCnameInstructions(domain: Domain, challenge: string): string {
    const verificationDomain = `verify-${challenge}.${domain.value}`

    return `
请按照以下步骤验证域名 ${domain.value}：

1. 登录您的域名管理控制台
2. 找到域名 ${domain.value} 的DNS设置
3. 添加一条CNAME记录：
   - 记录名称：verify-${challenge}
   - 记录类型：CNAME
   - 记录值：verification.${this.getVerificationDomain()}
   - TTL：300（或默认值）

4. 保存设置并等待DNS传播（通常需要5-30分钟）
5. 返回此页面点击"验证"按钮

注意事项：
- CNAME记录名称必须完全匹配：verify-${challenge}
- 记录值必须指向：verification.${this.getVerificationDomain()}
- 不要添加引号或其他字符
- 如果验证失败，请等待更长时间让DNS传播完成
- 验证有效期为24小时
    `.trim()
  }

  /**
   * 获取验证域名
   * 用于CNAME验证的权威域名
   */
  private getVerificationDomain(): string {
    // 这里应该返回实际的验证服务域名
    // 例如：verification.example.com
    return 'verification.example.com'
  }

  /**
   * 生成带时间戳的挑战字符串
   * 用于需要时间敏感性的验证场景
   */
  generateTimestampedChallenge(): string {
    const timestamp = Date.now().toString()
    const randomData = randomBytes(16)
    const combined = timestamp + randomData.toString('hex')

    // 使用SHA256生成固定长度的挑战
    const hash = createHash('sha256').update(combined).digest('hex')

    return hash.substring(0, this.CHALLENGE_LENGTH)
  }

  /**
   * 生成基于域名的挑战字符串
   * 确保同一域名的挑战具有一致性
   */
  generateDomainBasedChallenge(domain: Domain): string {
    const domainHash = createHash('sha256').update(domain.value).digest('hex')
    const timestamp = Math.floor(Date.now() / (60 * 60 * 1000)) // 小时级时间戳
    const combined = domainHash + timestamp.toString()

    return createHash('sha256').update(combined).digest('hex').substring(0, this.CHALLENGE_LENGTH)
  }

  /**
   * 验证挑战字符串格式
   */
  validateChallengeFormat(challenge: string): boolean {
    if (!challenge || typeof challenge !== 'string') {
      return false
    }

    // 检查长度
    if (challenge.length < 16 || challenge.length > 64) {
      return false
    }

    // 检查字符集（只允许字母、数字、连字符、下划线）
    const validPattern = /^[a-zA-Z0-9\-_]+$/
    return validPattern.test(challenge)
  }

  /**
   * 生成挑战的哈希值
   * 用于存储和比较，避免明文存储
   */
  generateChallengeHash(challenge: string): string {
    return createHash('sha256').update(challenge).digest('hex')
  }

  /**
   * 验证挑战是否过期
   */
  isChallengeExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * 计算挑战剩余时间（分钟）
   */
  getChallengeRemainingMinutes(expiresAt: Date): number {
    const now = new Date()
    const remainingMs = expiresAt.getTime() - now.getTime()
    return Math.max(0, Math.floor(remainingMs / (60 * 1000)))
  }
}
