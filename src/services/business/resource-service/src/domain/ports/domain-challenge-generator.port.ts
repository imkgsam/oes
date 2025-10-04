/**
 * 域名验证挑战生成端口
 *
 * 定义Domain层生成验证挑战所需的外部能力
 * 实现：Infrastructure层 - ChallengeGeneratorAdapter
 *
 * 职责：
 * 1. 生成安全的验证挑战字符串
 * 2. 创建验证挑战信息
 * 3. 提供挑战过期时间管理
 *
 * 设计原则：
 * - 单一职责：专注于挑战生成能力
 * - 依赖倒置：Domain层定义接口，Infrastructure层实现
 * - 可测试性：支持Mock实现
 * - 可扩展性：支持多种挑战生成策略
 */

import { Domain } from '../aggregates/domain.aggregate'

/**
 * 域名验证方法枚举
 */
export enum DomainVerificationMethod {
  DNS_TXT = 'DNS_TXT', // DNS TXT记录验证
  DNS_CNAME = 'DNS_CNAME' // DNS CNAME记录验证
}

/**
 * 域名验证挑战信息
 */
export interface DomainVerificationChallenge {
  method: DomainVerificationMethod
  challenge: string
  instructions: string
  expiresAt: Date
  retryCount: number
  maxRetries: number
}

/**
 * 域名验证挑战生成端口
 *
 * 定义Domain层生成验证挑战所需的外部能力
 * 实现：Infrastructure层 - ChallengeGeneratorAdapter
 *
 * 职责：
 * 1. 生成安全的验证挑战字符串
 * 2. 创建验证挑战信息
 * 3. 提供挑战过期时间管理
 */
export interface IDomainChallengeGeneratorPort {
  /**
   * 生成验证挑战字符串
   *
   * 要求：
   * - 必须是唯一且不可预测的
   * - 应该使用加密安全的随机数生成器
   * - 长度适中，便于用户配置
   *
   * @returns 挑战字符串
   */
  generateChallengeString(): string

  /**
   * 生成域名验证挑战信息
   *
   * 根据不同的验证方法生成相应的挑战指令和配置信息
   *
   * @param domain 域名聚合根
   * @param verificationMethod 验证方法
   * @returns 验证挑战信息
   */
  generateVerificationChallenge(
    domain: Domain,
    verificationMethod: DomainVerificationMethod
  ): DomainVerificationChallenge
}
