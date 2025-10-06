import { Domain } from '../aggregates/domain.aggregate'
import { DomainRecord } from '../entities/domain-record.entity'
import {
  IDomainChallengeGeneratorPort,
  DomainVerificationMethod,
  DomainVerificationChallenge
} from '../ports/domain-challenge-generator.port'
import { IDomainVerificationPort } from '../ports/domain.ports'
/**
 * 域名验证服务接口
 *
 * 职责：
 * 1. 跨实体的域名验证协同
 * 2. 复杂的验证业务规则
 * 3. 验证策略的选择和执行
 *
 * 设计原则：
 * - 无状态服务
 * - 专注于跨实体协同
 * - 不包含具体的外部依赖实现
 * - 通过依赖注入获取外部能力
 */
export interface IDomainVerificationService {
  /**
   * 验证域名所有权（跨实体协同）
   * 协调Domain聚合根和DNS记录验证
   * @param domain 域名聚合根
   * @param verificationMethod 验证方法
   * @param challenge 验证挑战（由外部提供）
   * @returns 验证结果
   */
  verifyDomainOwnership(
    domain: Domain,
    verificationMethod: DomainVerificationMethod,
    challenge: string
  ): Promise<DomainVerificationResult>

  /**
   * 验证指定的DNS记录列表
   * 跨Domain和DomainRecord实体的协同操作
   * @param domain 域名聚合根
   * @param records 要验证的DNS记录列表
   * @returns 验证结果列表
   */
  verifyDnsRecords(domain: Domain, records: DomainRecord[]): Promise<DnsRecordVerificationResult[]>

  /**
   * 检查域名是否可达
   * 跨实体的可达性检查
   * @param domain 域名聚合根
   * @returns 可达性检查结果
   */
  checkDomainReachability(domain: Domain): Promise<DomainReachabilityResult>
}

// 注意：DomainVerificationMethod 和 DomainVerificationChallenge 已移动到 domain.ports.ts

/**
 * 域名验证结果
 */
export interface DomainVerificationResult {
  success: boolean
  method: DomainVerificationMethod
  verifiedAt?: Date
  errorMessage?: string
  errorCode?: string
  details?: Record<string, any>
}

/**
 * DNS记录验证结果
 */
export interface DnsRecordVerificationResult {
  recordId: string
  recordType: string
  recordName: string
  success: boolean
  verifiedAt?: Date
  errorMessage?: string
  actualValue?: string
  expectedValue?: string
  ttl?: number
}

/**
 * 域名可达性检查结果
 */
export interface DomainReachabilityResult {
  reachable: boolean
  responseTime?: number
  errorMessage?: string
  ipAddresses?: string[]
  mxRecords?: string[]
}

// 注意：DomainVerificationChallenge 已移动到 domain.ports.ts

/**
 * 域名验证服务实现类
 *
 * 专注于跨实体的域名验证协同逻辑
 * 不包含具体的外部依赖实现，通过依赖注入获取外部能力
 */
export class DomainVerificationService implements IDomainVerificationService {
  constructor(
    private readonly dnsVerificationPort: IDomainVerificationPort,
    private readonly challengeGeneratorPort: IDomainChallengeGeneratorPort
  ) {}

  async verifyDomainOwnership(
    domain: Domain,
    verificationMethod: DomainVerificationMethod,
    challenge: string
  ): Promise<DomainVerificationResult> {
    // 跨实体协同：协调Domain聚合根和DNS验证
    try {
      // 业务规则检查：域名必须处于待验证状态
      if (domain.isVerified()) {
        return {
          success: true,
          method: verificationMethod,
          verifiedAt: new Date(),
          details: { message: 'Domain already verified' }
        }
      }

      let success = false
      let details: Record<string, any> = {}

      switch (verificationMethod) {
        case DomainVerificationMethod.DNS_TXT: {
          const txtRecords = await this.dnsVerificationPort.queryDnsRecords(domain.value, 'TXT')
          const verificationRecord = txtRecords.find((r) => r.value.includes(challenge))
          success = !!verificationRecord
          details = {
            challenge,
            foundRecords: txtRecords.length,
            verificationRecord: verificationRecord?.value
          }
          break
        }

        case DomainVerificationMethod.DNS_CNAME: {
          const cnameRecords = await this.dnsVerificationPort.queryDnsRecords(domain.value, 'CNAME')
          const cnameVerificationRecord = cnameRecords.find((r) => r.name === challenge)
          success = !!cnameVerificationRecord
          details = {
            challenge,
            foundRecords: cnameRecords.length,
            verificationRecord: cnameVerificationRecord?.name
          }
          break
        }

        default:
          throw new Error(`Unsupported verification method: ${String(verificationMethod)}`)
      }

      return {
        success,
        method: verificationMethod,
        verifiedAt: success ? new Date() : undefined,
        details
      }
    } catch (error) {
      return {
        success: false,
        method: verificationMethod,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'VERIFICATION_ERROR'
      }
    }
  }

  async verifyDnsRecords(
    domain: Domain,
    records: DomainRecord[]
  ): Promise<DnsRecordVerificationResult[]> {
    // 跨实体协同：验证Domain的指定DNS记录
    if (records.length === 0) {
      return []
    }

    // 并行验证所有记录以提高性能
    const verificationPromises = records.map(async (record) => {
      try {
        const dnsRecords = await this.dnsVerificationPort.queryDnsRecords(domain.value, record.type)
        const matchingRecord = dnsRecords.find(
          (r) => r.name === record.name && r.value === record.value
        )

        return {
          recordId: record.id,
          recordType: record.type,
          recordName: record.name,
          success: !!matchingRecord,
          verifiedAt: new Date(),
          actualValue: matchingRecord?.value,
          expectedValue: record.value,
          ttl: matchingRecord?.ttl
        }
      } catch (error) {
        return {
          recordId: record.id,
          recordType: record.type,
          recordName: record.name,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const results = await Promise.all(verificationPromises)
    return results
  }

  async checkDomainReachability(domain: Domain): Promise<DomainReachabilityResult> {
    // 跨实体协同：检查Domain的可达性
    try {
      const startTime = Date.now()

      // 检查A记录
      const aRecords = await this.dnsVerificationPort.queryDnsRecords(domain.value, 'A')
      const responseTime = Date.now() - startTime

      // 检查MX记录
      const mxRecords = await this.dnsVerificationPort.queryDnsRecords(domain.value, 'MX')

      return {
        reachable: aRecords.length > 0,
        responseTime,
        ipAddresses: aRecords.map((r) => r.value),
        mxRecords: mxRecords.map((r) => r.value)
      }
    } catch (error) {
      return {
        reachable: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// 注意：DomainVerificationChallengeGenerator 已重构为 IDomainChallengeGeneratorPort
// 具体实现在 Infrastructure 层的 Adapter 中
