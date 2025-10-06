import { Injectable } from '@nestjs/common'
import { Domain } from '../../domain/aggregates/domain.aggregate'
import { DomainRecord } from '../../domain/entities/domain-record.entity'
import { IDomainRepository } from '../../domain/repositories/domain.repository'
import { IDomainVerificationService } from '../../domain/services/domain-verification.service'
import { IDomainEventPort } from '../../domain/ports/domain.ports'
import {
  IDomainChallengeGeneratorPort,
  DomainVerificationMethod
} from '../../domain/ports/domain-challenge-generator.port'
import { DomainEvent } from '../../domain/events/domain.event'
import { IIdentityServicePort } from '../ports/identity-service.port'
import { IPermissionServicePort } from '../ports/permission-service.port'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { RESOURCE_SERVICE_EXCEPTION_ERRORS } from '@oes/common/constants/res-codes/resource-service.errors'
import { RecordType } from 'prisma/generated/prisma'
import { v4 as uuidv4 } from 'uuid'
import {
  GenerateVerificationChallengeRequestDto,
  GenerateVerificationChallengeResponseDto,
  VerifyDomainRequestDto,
  VerifyDomainResponseDto,
  VerifyDnsRecordsRequestDto,
  VerifyDnsRecordsResponseDto,
  AddDnsRecordRequestDto,
  AddDnsRecordResponseDto,
  UpdateDnsRecordRequestDto,
  UpdateDnsRecordResponseDto,
  RemoveDnsRecordRequestDto,
  RemoveDnsRecordResponseDto
} from '@oes/common/dtos/resource-service/all.dto'

/**
 * 域名验证服务
 *
 * 职责：
 * 1. 域名验证挑战生成
 * 2. 域名所有权验证
 * 3. DNS记录验证
 * 4. DNS记录管理（添加、更新、删除）
 * 5. 验证状态管理
 * 6. 验证通知发送
 *
 * 业务规则：
 * - 只有待验证状态的域名才能进行验证
 * - 验证成功后域名状态变为已验证
 * - 验证失败后域名状态变为验证失败
 * - 已验证的域名不能重复验证
 * - 记录名称和类型组合必须唯一
 * - 某些记录类型需要域名验证后才能添加
 */
@Injectable()
export class DomainVerificationService {
  constructor(
    private readonly domainRepository: IDomainRepository,
    private readonly domainVerificationService: IDomainVerificationService,
    private readonly domainEventPort: IDomainEventPort,
    private readonly challengeGeneratorPort: IDomainChallengeGeneratorPort,
    private readonly identityServicePort: IIdentityServicePort,
    private readonly permissionServicePort: IPermissionServicePort
  ) {}

  // ==================== 域名验证 ====================

  /**
   * 生成验证挑战
   */
  async generateVerificationChallenge(
    request: GenerateVerificationChallengeRequestDto
  ): Promise<GenerateVerificationChallengeResponseDto> {
    // 1. 验证输入参数
    this.validateGenerateChallengeRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 检查域名状态
    if (domain.isVerified()) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_ALREADY_VERIFIED, {
        domainId: request.domainId
      })
    }

    // 5. 生成验证挑战
    const challenge = this.challengeGeneratorPort.generateVerificationChallenge(
      domain,
      request.verificationMethod
    )

    // // 6. 发送验证通知
    // await this.notificationServicePort.sendDomainVerificationNotification(
    //   request.userId,
    //   domain.id,
    //   challenge.method,
    //   challenge.challenge
    // )

    // 7. 返回挑战信息
    return {
      domainId: domain.id,
      domainValue: domain.value,
      verificationMethod: challenge.method,
      challenge: challenge.challenge,
      instructions: challenge.instructions,
      expiresAt: challenge.expiresAt,
      retryCount: challenge.retryCount,
      maxRetries: challenge.maxRetries,
      estimatedTime: this.getEstimatedVerificationTime(challenge.method)
    }
  }

  /**
   * 验证域名
   */
  async verifyDomain(request: VerifyDomainRequestDto): Promise<VerifyDomainResponseDto> {
    // 1. 验证输入参数
    this.validateVerifyRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 检查域名状态
    if (domain.isVerified()) {
      return {
        domainId: domain.id,
        success: true,
        message: 'Domain is already verified',
        verificationStatus: domain.getVerificationStatus(),
        verifiedAt: new Date()
      }
    }

    // 5. 执行域名验证
    const verificationResult = await this.domainVerificationService.verifyDomainOwnership(
      domain,
      request.verificationMethod,
      request.challenge
    )

    // 6. 根据验证结果更新域名状态
    if (verificationResult.success) {
      domain.markAsVerified()
    } else {
      domain.markVerificationFailed()
    }

    // 7. 持久化更新后的域名
    const updatedDomain = await this.domainRepository.save(domain)

    // 8. 发布验证结果事件
    const verificationEvent = verificationResult.success
      ? DomainEvent.domainVerified(domain.id, domain.tenantId, domain.value)
      : DomainEvent.domainVerificationFailed(
          domain.id,
          domain.tenantId,
          domain.value,
          verificationResult.errorMessage
        )

    await this.domainEventPort.publishDomainEvent(verificationEvent)

    // // 9. 发送验证结果通知
    // if (verificationResult.success) {
    //   await this.notificationServicePort.sendDomainVerificationSuccessNotification(
    //     request.userId,
    //     domain.id,
    //     domain.value
    //   )
    // } else {
    //   await this.notificationServicePort.sendDomainVerificationFailureNotification(
    //     request.userId,
    //     domain.id,
    //     domain.value,
    //     verificationResult.errorMessage || 'Verification failed'
    //   )
    // }

    // 10. 返回验证结果
    return {
      domainId: updatedDomain.id,
      success: verificationResult.success,
      message: verificationResult.success
        ? 'Domain verification successful'
        : verificationResult.errorMessage || 'Domain verification failed',
      verificationStatus: updatedDomain.getVerificationStatus(),
      verifiedAt: verificationResult.success ? verificationResult.verifiedAt : undefined,
      errorCode: verificationResult.errorCode,
      details: verificationResult.details
    }
  }

  /**
   * 验证DNS记录
   */
  async verifyDnsRecords(
    request: VerifyDnsRecordsRequestDto
  ): Promise<VerifyDnsRecordsResponseDto> {
    // 1. 验证输入参数
    this.validateVerifyDnsRecordsRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 获取要验证的记录
    const records = domain.getRecords()
    const recordsToVerify = records.filter(
      (record) => request.recordIds.length === 0 || request.recordIds.includes(record.id)
    )

    if (recordsToVerify.length === 0) {
      return {
        domainId: domain.id,
        results: [],
        totalCount: 0,
        successCount: 0,
        failureCount: 0
      }
    }

    // 5. 执行DNS记录验证
    const verificationResults = await this.domainVerificationService.verifyDnsRecords(
      domain,
      recordsToVerify
    )

    // 6. 更新记录验证状态
    for (const result of verificationResults) {
      const record = records.find((r) => r.id === result.recordId)
      if (record) {
        if (result.success) {
          record.markVerified()
        } else {
          record.markVerificationFailed()
        }
      }
    }

    // 7. 持久化更新
    await this.domainRepository.save(domain)

    // 8. 返回验证结果
    const successCount = verificationResults.filter((r) => r.success).length
    const failureCount = verificationResults.length - successCount

    return {
      domainId: domain.id,
      results: verificationResults,
      totalCount: verificationResults.length,
      successCount,
      failureCount
    }
  }

  // ==================== DNS记录管理 ====================

  /**
   * 添加DNS记录
   */
  async addDnsRecord(request: AddDnsRecordRequestDto): Promise<AddDnsRecordResponseDto> {
    // 1. 验证输入参数
    this.validateAddRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 检查域名验证状态（某些记录类型需要验证）
    if (this.requiresVerification(request.recordType) && !domain.isVerified()) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_VERIFIED, {
        domainId: request.domainId,
        recordType: request.recordType
      })
    }

    // 5. 检查记录是否已存在
    const existingRecord = domain
      .getRecords()
      .find((r) => r.name === request.recordName && r.type === request.recordType)

    if (existingRecord) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DNS_RECORD_ALREADY_EXISTS, {
        recordName: request.recordName,
        recordType: request.recordType
      })
    }

    // 6. 创建DNS记录实体
    const recordId = uuidv4()
    const record = DomainRecord.create(
      recordId,
      domain.id,
      request.recordType as RecordType,
      request.recordName,
      request.recordValue,
      request.ttl || 600,
      request.required || false,
      request.priority
    )

    // 7. 将记录添加到域名聚合根
    domain.addRecord(record)

    // 8. 持久化更新后的域名
    const updatedDomain = await this.domainRepository.save(domain)

    // 9. 发布记录添加事件
    const recordAddedEvent = DomainEvent.domainRecordAdded(
      domain.id,
      record.id,
      record.type,
      record.name
    )
    await this.domainEventPort.publishDomainEvent(recordAddedEvent)

    // // 10. 发送通知
    // await this.notificationServicePort.sendDnsRecordChangeNotification(
    //   request.userId,
    //   domain.id,
    //   record.id,
    //   'created'
    // )

    // 11. 返回结果
    return {
      recordId: record.id,
      domainId: domain.id,
      recordType: record.type,
      recordName: record.name,
      recordValue: record.value,
      ttl: record.ttl,
      required: record.required,
      priority: record.priority,
      verified: record.isVerified(),
      createdAt: record.createdAt
    }
  }

  /**
   * 更新DNS记录
   */
  async updateDnsRecord(request: UpdateDnsRecordRequestDto): Promise<UpdateDnsRecordResponseDto> {
    // 1. 验证输入参数
    this.validateUpdateRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 查找要更新的记录
    const records = domain.getRecords()
    const record = records.find((r) => r.id === request.recordId)
    if (!record) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DNS_RECORD_NOT_FOUND, {
        recordId: request.recordId
      })
    }

    // 5. 记录更新前的状态
    const oldValue = record.value
    const oldTtl = record.ttl
    const oldPriority = record.priority

    // 6. 执行更新操作
    const changes: Record<string, any> = {}

    if (request.newValue !== undefined && request.newValue !== oldValue) {
      record.updateValue(request.newValue)
      changes.value = { old: oldValue, new: request.newValue }
    }

    if (request.newTtl !== undefined && request.newTtl !== oldTtl) {
      record.updateTtl(request.newTtl)
      changes.ttl = { old: oldTtl, new: request.newTtl }
    }

    if (request.newPriority !== undefined && request.newPriority !== oldPriority) {
      record.updatePriority(request.newPriority)
      changes.priority = { old: oldPriority, new: request.newPriority }
    }

    // 7. 检查是否有实际更新
    if (Object.keys(changes).length === 0) {
      return {
        recordId: record.id,
        domainId: domain.id,
        success: true,
        message: 'No changes made',
        changes: {}
      }
    }

    // 8. 持久化更新后的域名
    const updatedDomain = await this.domainRepository.save(domain)

    // 9. 发布记录更新事件
    const recordUpdatedEvent = DomainEvent.domainRecordUpdated(
      domain.id,
      record.id,
      record.type,
      record.name,
      changes
    )
    await this.domainEventPort.publishDomainEvent(recordUpdatedEvent)

    // // 10. 发送通知
    // await this.notificationServicePort.sendDnsRecordChangeNotification(
    //   request.userId,
    //   domain.id,
    //   record.id,
    //   'updated'
    // )

    // 11. 返回更新结果
    return {
      recordId: record.id,
      domainId: domain.id,
      success: true,
      message: 'Record updated successfully',
      changes,
      updatedRecord: {
        id: record.id,
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: record.ttl,
        required: record.required,
        priority: record.priority,
        verified: record.isVerified(),
        createdAt: record.createdAt
      }
    }
  }

  /**
   * 删除DNS记录
   */
  async removeDnsRecord(request: RemoveDnsRecordRequestDto): Promise<RemoveDnsRecordResponseDto> {
    // 1. 验证输入参数
    this.validateRemoveRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 查找要删除的记录
    const records = domain.getRecords()
    const record = records.find((r) => r.id === request.recordId)
    if (!record) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DNS_RECORD_NOT_FOUND, {
        recordId: request.recordId
      })
    }

    // 5. 记录删除前的信息
    const recordInfo = {
      id: record.id,
      type: record.type,
      name: record.name,
      value: record.value,
      required: record.required
    }

    // 6. 从域名聚合根中删除记录
    domain.removeRecord(request.recordId)

    // 7. 持久化更新后的域名
    const updatedDomain = await this.domainRepository.save(domain)

    // 8. 发布记录删除事件
    const recordRemovedEvent = DomainEvent.domainRecordRemoved(
      domain.id,
      recordInfo.id,
      recordInfo.type,
      recordInfo.name
    )
    await this.domainEventPort.publishDomainEvent(recordRemovedEvent)

    // // 9. 发送通知
    // await this.notificationServicePort.sendDnsRecordChangeNotification(
    //   request.userId,
    //   domain.id,
    //   record.id,
    //   'deleted'
    // )

    // 10. 返回删除结果
    return {
      recordId: recordInfo.id,
      domainId: domain.id,
      success: true,
      message: 'Record removed successfully',
      removedRecord: recordInfo
    }
  }

  // ==================== 私有方法 ====================

  private validateGenerateChallengeRequest(request: GenerateVerificationChallengeRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.verificationMethod) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Verification method is required'
      })
    }
  }

  private validateVerifyRequest(request: VerifyDomainRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.verificationMethod) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Verification method is required'
      })
    }

    if (!request.challenge || typeof request.challenge !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Challenge is required'
      })
    }
  }

  private validateVerifyDnsRecordsRequest(request: VerifyDnsRecordsRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!Array.isArray(request.recordIds)) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record IDs must be an array'
      })
    }
  }

  private validateAddRecordRequest(request: AddDnsRecordRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.recordType || typeof request.recordType !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record type is required'
      })
    }

    if (!request.recordName || typeof request.recordName !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record name is required'
      })
    }

    if (!request.recordValue || typeof request.recordValue !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record value is required'
      })
    }

    if (request.ttl !== undefined && (!Number.isInteger(request.ttl) || request.ttl < 0)) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'TTL must be a non-negative integer'
      })
    }

    if (
      request.priority !== undefined &&
      (!Number.isInteger(request.priority) || request.priority < 0)
    ) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Priority must be a non-negative integer'
      })
    }
  }

  private validateUpdateRecordRequest(request: UpdateDnsRecordRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.recordId || typeof request.recordId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record ID is required'
      })
    }

    if (request.newValue !== undefined && typeof request.newValue !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'New value must be a string'
      })
    }

    if (request.newTtl !== undefined && (!Number.isInteger(request.newTtl) || request.newTtl < 0)) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'New TTL must be a non-negative integer'
      })
    }

    if (
      request.newPriority !== undefined &&
      (!Number.isInteger(request.newPriority) || request.newPriority < 0)
    ) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'New priority must be a non-negative integer'
      })
    }
  }

  private validateRemoveRecordRequest(request: RemoveDnsRecordRequestDto): void {
    if (!request.domainId || typeof request.domainId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.recordId || typeof request.recordId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Record ID is required'
      })
    }
  }

  private requiresVerification(recordType: string): boolean {
    // 某些记录类型需要域名验证后才能添加
    const verificationRequiredTypes = ['MX', 'NS', 'CNAME']
    return verificationRequiredTypes.includes(recordType)
  }

  private async validateDomainAccess(
    domainId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    // 验证用户是否属于该租户
    const accounts = await this.identityServicePort.getAccountsByUserId({ userId })
    const userAccount = accounts.find((account) => account.tenantId === tenantId)
    if (!userAccount) {
      throw createBusinessException(
        RESOURCE_SERVICE_EXCEPTION_ERRORS.INSUFFICIENT_TENANT_PERMISSION,
        { tenantId, userId }
      )
    }

    // 验证用户是否有访问该域名的权限
    const hasPermission = await this.permissionServicePort.checkUserPermission(
      userId,
      'domain:read'
    )
    if (!hasPermission) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.RESOURCE_ACCESS_DENIED, {
        userId,
        resourceType: 'domain',
        resourceId: domainId,
        tenantId
      })
    }
  }

  private getEstimatedVerificationTime(method: DomainVerificationMethod): string {
    switch (method) {
      case DomainVerificationMethod.DNS_TXT:
        return '5-10 minutes (DNS propagation time)'
      case DomainVerificationMethod.DNS_CNAME:
        return '5-10 minutes (DNS propagation time)'
      default:
        return 'Unknown'
    }
  }
}
