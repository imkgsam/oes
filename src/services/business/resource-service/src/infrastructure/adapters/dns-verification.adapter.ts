import { Injectable } from '@nestjs/common'
import {
  IDomainVerificationPort,
  DnsRecord,
  DomainReachabilityResult
} from '../../domain/ports/domain.ports'
import * as dns from 'dns'
import { promisify } from 'util'

/**
 * DNS验证适配器
 *
 * 职责：
 * 1. 实现域名验证的外部能力
 * 2. 提供DNS查询功能
 * 3. 检查域名可达性
 * 4. 封装DNS解析逻辑
 *
 * 设计原则：
 * - 单一职责：专注于DNS相关操作
 * - 错误处理：优雅处理DNS查询失败
 * - 性能优化：支持并发查询
 * - 可测试性：支持Mock实现
 */
@Injectable()
export class DnsVerificationAdapter implements IDomainVerificationPort {
  private readonly dnsResolve = promisify(dns.resolve)
  private readonly dnsResolve4 = promisify(dns.resolve4)
  private readonly dnsResolve6 = promisify(dns.resolve6)
  private readonly dnsResolveMx = promisify(dns.resolveMx)
  private readonly dnsResolveTxt = promisify(dns.resolveTxt)
  private readonly dnsResolveCname = promisify(dns.resolveCname)
  private readonly dnsResolveNs = promisify(dns.resolveNs)
  private readonly dnsResolveSrv = promisify(dns.resolveSrv)

  async queryDnsRecords(domain: string, recordType: string): Promise<DnsRecord[]> {
    try {
      const normalizedType = recordType.toUpperCase()

      switch (normalizedType) {
        case 'A':
          return await this.queryARecords(domain)
        case 'AAAA':
          return await this.queryAaaaRecords(domain)
        case 'CNAME':
          return await this.queryCnameRecords(domain)
        case 'MX':
          return await this.queryMxRecords(domain)
        case 'TXT':
          return await this.queryTxtRecords(domain)
        case 'NS':
          return await this.queryNsRecords(domain)
        case 'SRV':
          return await this.querySrvRecords(domain)
        default:
          throw new Error(`Unsupported DNS record type: ${recordType}`)
      }
    } catch (error) {
      console.error(`DNS query failed for ${domain} (${recordType}):`, error)
      return []
    }
  }

  async checkDomainReachability(domain: string): Promise<DomainReachabilityResult> {
    const startTime = Date.now()

    try {
      // 检查A记录
      const aRecords = await this.queryARecords(domain)
      const responseTime = Date.now() - startTime

      // 检查MX记录
      const mxRecords = await this.queryMxRecords(domain)

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

  private async queryARecords(domain: string): Promise<DnsRecord[]> {
    try {
      const addresses = await this.dnsResolve4(domain)
      return addresses.map((address) => ({
        name: domain,
        type: 'A',
        value: address,
        ttl: 300 // 默认TTL
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async queryAaaaRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const addresses = await this.dnsResolve6(domain)
      return addresses.map((address) => ({
        name: domain,
        type: 'AAAA',
        value: address,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async queryCnameRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const cnames = await this.dnsResolveCname(domain)
      return cnames.map((cname) => ({
        name: domain,
        type: 'CNAME',
        value: cname,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async queryMxRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const mxRecords = await this.dnsResolveMx(domain)
      return mxRecords.map((mx) => ({
        name: domain,
        type: 'MX',
        value: `${mx.priority} ${mx.exchange}`,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async queryTxtRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const txtRecords = await this.dnsResolveTxt(domain)
      return txtRecords.map((txt) => ({
        name: domain,
        type: 'TXT',
        value: Array.isArray(txt) ? txt.join('') : txt,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async queryNsRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const nsRecords = await this.dnsResolveNs(domain)
      return nsRecords.map((ns) => ({
        name: domain,
        type: 'NS',
        value: ns,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  private async querySrvRecords(domain: string): Promise<DnsRecord[]> {
    try {
      const srvRecords = await this.dnsResolveSrv(domain)
      return srvRecords.map((srv) => ({
        name: domain,
        type: 'SRV',
        value: `${srv.priority} ${srv.weight} ${srv.port} ${srv.name}`,
        ttl: 300
      }))
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        return []
      }
      throw error
    }
  }

  /**
   * 验证特定的DNS记录是否存在
   */
  async verifySpecificRecord(
    domain: string,
    recordType: string,
    recordName: string,
    expectedValue: string
  ): Promise<boolean> {
    try {
      const records = await this.queryDnsRecords(domain, recordType)
      return records.some((record) => record.name === recordName && record.value === expectedValue)
    } catch (error) {
      console.error('Failed to verify specific DNS record:', error)
      return false
    }
  }

  /**
   * 批量验证DNS记录
   */
  async verifyMultipleRecords(
    domain: string,
    recordChecks: Array<{
      type: string
      name: string
      expectedValue: string
    }>
  ): Promise<Array<{ success: boolean; actualValue?: string }>> {
    const results = await Promise.allSettled(
      recordChecks.map(async (check) => {
        const records = await this.queryDnsRecords(domain, check.type)
        const matchingRecord = records.find((r) => r.name === check.name)

        return {
          success: matchingRecord?.value === check.expectedValue,
          actualValue: matchingRecord?.value
        }
      })
    )

    return results.map((result) =>
      result.status === 'fulfilled' ? result.value : { success: false }
    )
  }

  /**
   * 检查域名是否可解析
   */
  async isDomainResolvable(domain: string): Promise<boolean> {
    try {
      await this.dnsResolve(domain, 'A')
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 获取域名的所有记录类型
   */
  async getAllRecordTypes(domain: string): Promise<string[]> {
    const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']
    const availableTypes: string[] = []

    for (const type of recordTypes) {
      try {
        const records = await this.queryDnsRecords(domain, type)
        if (records.length > 0) {
          availableTypes.push(type)
        }
      } catch (error) {
        // 忽略查询失败的类型
      }
    }

    return availableTypes
  }
}
