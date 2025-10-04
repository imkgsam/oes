/**
 * Domain层端口接口
 *
 * 用途：
 * 1. 定义domain层所依赖的外部系统接口
 * 2. 实现依赖倒置原则
 * 3. 支持依赖注入
 * 4. 提供清晰的边界定义
 *
 * 注意：
 * - 这些是Domain层需要的外部能力接口
 * - 具体实现在Infrastructure层的Adapter中
 * - 当前只保留核心功能，其他功能后续扩展
 */

import { Domain } from '../aggregates/domain.aggregate'
import { DomainRecord } from '../entities/domain-record.entity'
import { DomainEvent } from '../events/domain.event'

/**
 * 域名验证端口
 *
 * 定义Domain层进行域名验证所需的外部能力
 * 实现：Infrastructure层 - DnsVerificationAdapter
 *
 * 当前只支持DNS验证方式，其他验证方式后续扩展
 */
export interface IDomainVerificationPort {
  /**
   * 执行DNS查询
   * @param domain 域名
   * @param recordType 记录类型
   * @returns DNS记录列表
   */
  queryDnsRecords(domain: string, recordType: string): Promise<DnsRecord[]>

  /**
   * 验证域名可达性
   * @param domain 域名
   * @returns 可达性结果
   */
  checkDomainReachability(domain: string): Promise<DomainReachabilityResult>
}

/**
 * 域名事件端口
 *
 * 定义Domain层发布事件所需的外部能力
 * 实现：Infrastructure层 - EventBusAdapter
 *
 * 注意：当前只保留基础事件发布功能，订阅功能后续扩展
 */
export interface IDomainEventPort {
  /**
   * 发布域名事件
   * @param event 域名事件
   * @returns 发布结果
   */
  publishDomainEvent(event: DomainEvent): Promise<boolean>

  /**
   * 批量发布域名事件
   * @param events 域名事件列表
   * @returns 发布结果
   */
  publishDomainEvents(events: DomainEvent[]): Promise<boolean>
}

// ==================== 类型定义 ====================

export interface DnsRecord {
  name: string
  type: string
  value: string
  ttl: number
}

export interface DomainReachabilityResult {
  reachable: boolean
  responseTime?: number
  errorMessage?: string
  ipAddresses?: string[]
  mxRecords?: string[]
}
