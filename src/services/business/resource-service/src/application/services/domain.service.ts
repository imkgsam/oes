import { Injectable } from '@nestjs/common'
import { Domain } from '../../domain/aggregates/domain.aggregate'
import { DomainRecord } from '../../domain/entities/domain-record.entity'
import { DomainNameVO } from '../../domain/value-objects/domain-name.vo'
import { DomainVerificationStatusVO } from '../../domain/value-objects/domain-verification-status.vo'
import { IDomainRepository } from '../../domain/repositories/domain.repository'
import { IDomainEventPort } from '../../domain/ports/domain.ports'
import { DomainEvent } from '../../domain/events/domain.event'
import { IIdentityServicePort } from '../ports/identity-service.port'
import { IPermissionServicePort } from '../ports/permission-service.port'
import { createBusinessException } from '@oes/common/exceptions/exception.factory'
import { RESOURCE_SERVICE_EXCEPTION_ERRORS } from '@oes/common/constants/res-codes/resource-service.errors'
import { DomainQueryFilters } from '../../domain/repositories/domain.repository'
import { RecordType } from 'prisma/generated/prisma'
import { v4 as uuidv4 } from 'uuid'
import {
  CreateDomainRequestDto,
  CreateDomainResponseDto,
  UpdateDomainDescriptionRequestDto,
  UpdateDomainDescriptionResponseDto,
  DeleteDomainRequestDto,
  DeleteDomainResponseDto,
  FindDomainByIdRequestDto,
  FindDomainByIdResponseDto,
  FindDomainByValueRequestDto,
  FindDomainByValueResponseDto,
  FindDomainsByTenantRequestDto,
  FindDomainsByTenantResponseDto,
  FindDomainsPaginatedRequestDto,
  FindDomainsPaginatedResponseDto,
  SearchDomainsRequestDto,
  SearchDomainsResponseDto,
  DomainResponseDto,
  AddDnsRecordRequestDto,
  AddDnsRecordResponseDto,
  UpdateDnsRecordRequestDto,
  UpdateDnsRecordResponseDto,
  RemoveDnsRecordRequestDto,
  RemoveDnsRecordResponseDto
} from '@oes/common/dtos/resource-service/all.dto'

/**
 * 域名服务
 *
 * 职责：
 * 1. 域名的创建、更新、删除
 * 2. 域名查询和搜索
 * 3. 权限验证和租户隔离
 * 4. 事件发布和通知
 *
 * 业务规则：
 * - 域名必须属于特定租户
 * - 域名格式必须有效
 * - 域名在租户内必须唯一
 * - 新域名默认为待验证状态
 */
@Injectable()
export class DomainService {
  constructor(
    private readonly domainRepository: IDomainRepository,
    private readonly domainEventPort: IDomainEventPort,
    private readonly identityServicePort: IIdentityServicePort,
    private readonly permissionServicePort: IPermissionServicePort
  ) {}

  // ==================== 域名管理 ====================

  /**
   * 创建域名
   */
  async createDomain(request: CreateDomainRequestDto): Promise<CreateDomainResponseDto> {
    // 1. 验证输入参数
    this.validateCreateRequest(request)

    // 2. 验证租户权限
    await this.validateTenantPermission(request.tenantId, request.userId)

    // 3. 创建域名值对象
    const domainNameVO = new DomainNameVO(request.domainValue)

    // 4. 检查域名是否已存在
    const existingDomain = await this.domainRepository.findByValue(request.domainValue)
    if (existingDomain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_ALREADY_EXISTS, {
        domainValue: request.domainValue
      })
    }

    // 5. 创建域名聚合根
    const domainId = uuidv4()
    const domain = new Domain(
      domainId,
      request.tenantId,
      domainNameVO.getValue(),
      DomainVerificationStatusVO.createPending().getValue(),
      request.description,
      new Date(),
      new Date()
    )

    // 6. 持久化域名
    const savedDomain = await this.domainRepository.save(domain)

    // 7. 发布域名创建事件
    const domainCreatedEvent = DomainEvent.domainCreated(
      savedDomain.id,
      savedDomain.tenantId,
      savedDomain.value,
      savedDomain.description
    )
    await this.domainEventPort.publishDomainEvent(domainCreatedEvent)

    // // 8. 发送通知
    // await this.notificationServicePort.sendDomainVerificationNotification(
    //   request.userId,
    //   savedDomain.id,
    //   'DNS_TXT',
    //   'verification_challenge_placeholder'
    // )

    // 9. 返回结果
    return {
      domainId: savedDomain.id,
      domainValue: savedDomain.value,
      tenantId: savedDomain.tenantId,
      verificationStatus: savedDomain.getVerificationStatus(),
      description: savedDomain.description,
      createdAt: savedDomain.createdAt
    }
  }

  /**
   * 更新域名描述
   */
  async updateDomainDescription(
    request: UpdateDomainDescriptionRequestDto
  ): Promise<UpdateDomainDescriptionResponseDto> {
    // 1. 验证输入参数
    this.validateUpdateDescriptionRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 更新描述
    const oldDescription = domain.description
    domain.updateDescription(request.newDescription)

    // 5. 持久化更新
    const updatedDomain = await this.domainRepository.save(domain)

    // 6. 发布事件
    const descriptionUpdatedEvent = DomainEvent.domainDescriptionUpdated(
      domain.id,
      domain.tenantId,
      oldDescription || '',
      request.newDescription
    )
    await this.domainEventPort.publishDomainEvent(descriptionUpdatedEvent)

    return {
      domainId: updatedDomain.id,
      oldDescription,
      newDescription: updatedDomain.description,
      updatedAt: new Date()
    }
  }

  /**
   * 删除域名
   */
  async deleteDomain(request: DeleteDomainRequestDto): Promise<DeleteDomainResponseDto> {
    // 1. 验证输入参数
    this.validateDeleteRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 查找域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 检查是否可以删除
    if (domain.getRecords().length > 0) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain has DNS records, please delete them first'
      })
    }

    // 5. 删除域名
    const deleted = await this.domainRepository.delete(request.domainId)
    if (!deleted) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_CONFLICT, {
        reason: 'Failed to delete domain'
      })
    }

    // 6. 发布删除事件
    const domainDeletedEvent = DomainEvent.domainDeleted(domain.id, domain.tenantId, domain.value)
    await this.domainEventPort.publishDomainEvent(domainDeletedEvent)

    return {
      domainId: request.domainId,
      domainValue: domain.value,
      deletedAt: new Date()
    }
  }

  // ==================== 域名查询 ====================

  /**
   * 根据ID查询域名
   */
  async findDomainById(request: FindDomainByIdRequestDto): Promise<FindDomainByIdResponseDto> {
    this.validateFindByIdRequest(request)

    // 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    const domain = await this.domainRepository.findById(request.domainId)

    if (!domain) {
      return {
        domain: null,
        found: false
      }
    }

    return {
      domain: this.mapDomainToResponse(domain),
      found: true
    }
  }

  /**
   * 根据域名值查询
   */
  async findDomainByValue(
    request: FindDomainByValueRequestDto
  ): Promise<FindDomainByValueResponseDto> {
    this.validateFindByValueRequest(request)

    const domain = await this.domainRepository.findByValue(request.domainValue)

    if (!domain) {
      return {
        domain: null,
        found: false
      }
    }

    // 验证权限
    await this.validateDomainAccess(domain.id, request.userId, request.tenantId)

    return {
      domain: this.mapDomainToResponse(domain),
      found: true
    }
  }

  /**
   * 根据租户ID查询域名列表
   */
  async findDomainsByTenant(
    request: FindDomainsByTenantRequestDto
  ): Promise<FindDomainsByTenantResponseDto> {
    this.validateFindByTenantRequest(request)

    // 验证租户权限
    await this.validateTenantPermission(request.tenantId, request.userId)

    const domains = await this.domainRepository.findByTenantId(request.tenantId)

    return {
      domains: domains.map((domain) => this.mapDomainToResponse(domain)),
      count: domains.length
    }
  }

  /**
   * 分页查询域名
   */
  async findDomainsPaginated(
    request: FindDomainsPaginatedRequestDto
  ): Promise<FindDomainsPaginatedResponseDto> {
    this.validateFindPaginatedRequest(request)

    // 验证租户权限
    await this.validateTenantPermission(request.tenantId, request.userId)

    const result = await this.domainRepository.findPaginated(
      request.tenantId,
      request.page,
      request.pageSize,
      request.filters
    )

    return {
      domains: result.domains.map((domain) => this.mapDomainToResponse(domain)),
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      }
    }
  }

  /**
   * 搜索域名
   */
  async searchDomains(request: SearchDomainsRequestDto): Promise<SearchDomainsResponseDto> {
    this.validateSearchRequest(request)

    // 验证租户权限
    await this.validateTenantPermission(request.tenantId, request.userId)

    const filters: DomainQueryFilters = {
      searchTerm: request.searchTerm,
      verified: request.verified,
      hasRecords: request.hasRecords,
      recordType: request.recordType,
      createdAfter: request.createdAfter,
      createdBefore: request.createdBefore
    }

    const result = await this.domainRepository.findPaginated(
      request.tenantId,
      request.page,
      request.pageSize,
      filters
    )

    return {
      domains: result.domains.map((domain) => this.mapDomainToResponse(domain)),
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious
      },
      searchTerm: request.searchTerm
    }
  }

  // ==================== 私有方法 ====================

  private validateCreateRequest(request: CreateDomainRequestDto): void {
    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.domainValue || typeof request.domainValue !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain value is required'
      })
    }
  }

  private validateUpdateDescriptionRequest(request: UpdateDomainDescriptionRequestDto): void {
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

    if (typeof request.newDescription !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Description must be a string'
      })
    }
  }

  private validateDeleteRequest(request: DeleteDomainRequestDto): void {
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
  }

  private validateFindByIdRequest(request: FindDomainByIdRequestDto): void {
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
  }

  private validateFindByValueRequest(request: FindDomainByValueRequestDto): void {
    if (!request.domainValue || typeof request.domainValue !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Domain value is required'
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
  }

  private validateFindByTenantRequest(request: FindDomainsByTenantRequestDto): void {
    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }
  }

  private validateFindPaginatedRequest(request: FindDomainsPaginatedRequestDto): void {
    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!Number.isInteger(request.page) || request.page < 1) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Page must be a positive integer'
      })
    }

    if (!Number.isInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > 100) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Page size must be between 1 and 100'
      })
    }
  }

  private validateSearchRequest(request: SearchDomainsRequestDto): void {
    if (!request.tenantId || typeof request.tenantId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Tenant ID is required'
      })
    }

    if (!request.userId || typeof request.userId !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'User ID is required'
      })
    }

    if (!request.searchTerm || typeof request.searchTerm !== 'string') {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Search term is required'
      })
    }

    if (!Number.isInteger(request.page) || request.page < 1) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Page must be a positive integer'
      })
    }

    if (!Number.isInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > 100) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.OPERATION_NOT_SUPPORTED, {
        reason: 'Page size must be between 1 and 100'
      })
    }
  }

  private async validateTenantPermission(tenantId: string, userId: string): Promise<void> {
    // 验证用户是否属于该租户
    const accounts = await this.identityServicePort.getAccountsByUserId({ userId })
    const userAccount = accounts.find((account) => account.tenantId === tenantId)
    if (!userAccount) {
      throw createBusinessException(
        RESOURCE_SERVICE_EXCEPTION_ERRORS.INSUFFICIENT_TENANT_PERMISSION,
        { tenantId, userId }
      )
    }

    // 验证用户是否有创建域名的权限
    const hasPermission = await this.permissionServicePort.checkUserPermission(
      userId,
      'domain:create'
    )
    if (!hasPermission) {
      throw createBusinessException(
        RESOURCE_SERVICE_EXCEPTION_ERRORS.INSUFFICIENT_OPERATION_PERMISSION,
        { userId, operation: 'domain:create', tenantId }
      )
    }
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

  // ==================== DNS记录管理 ====================

  /**
   * 添加DNS记录
   */
  async addDnsRecord(request: AddDnsRecordRequestDto): Promise<AddDnsRecordResponseDto> {
    // 1. 验证输入参数
    this.validateAddDnsRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 获取域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 创建DNS记录
    const recordId = uuidv4()
    const record = DomainRecord.create(
      recordId,
      request.domainId,
      request.recordType as RecordType,
      request.recordName,
      request.recordValue,
      request.ttl || 600,
      request.required || false,
      request.priority
    )

    // 5. 添加到域名聚合根
    domain.addRecord(record)

    // 6. 保存域名
    const savedDomain = await this.domainRepository.save(domain)

    // 7. 发布事件
    const events = savedDomain.getDomainEvents()
    await this.domainEventPort.publishDomainEvents(events)

    return {
      recordId: record.id,
      domainId: record.domainId,
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
    this.validateUpdateDnsRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 获取域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 查找记录
    const records = domain.getRecords()
    const record = records.find((r) => r.id === request.recordId)
    if (!record) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DNS_RECORD_NOT_FOUND, {
        recordId: request.recordId
      })
    }

    // 5. 记录变更
    const changes: Record<string, { old: any; new: any }> = {}

    if (request.newValue !== undefined && request.newValue !== record.value) {
      changes.value = { old: record.value, new: request.newValue }
      record.updateValue(request.newValue)
    }

    if (request.newTtl !== undefined && request.newTtl !== record.ttl) {
      changes.ttl = { old: record.ttl, new: request.newTtl }
      record.updateTtl(request.newTtl)
    }

    if (request.newPriority !== undefined && request.newPriority !== record.priority) {
      changes.priority = { old: record.priority, new: request.newPriority }
      record.updatePriority(request.newPriority)
    }

    // 6. 保存域名
    const savedDomain = await this.domainRepository.save(domain)

    // 7. 发布事件
    const events = savedDomain.getDomainEvents()
    await this.domainEventPort.publishDomainEvents(events)

    return {
      recordId: record.id,
      domainId: record.domainId,
      success: true,
      message: 'DNS记录更新成功',
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
    this.validateRemoveDnsRecordRequest(request)

    // 2. 验证权限
    await this.validateDomainAccess(request.domainId, request.userId, request.tenantId)

    // 3. 获取域名
    const domain = await this.domainRepository.findById(request.domainId)
    if (!domain) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DOMAIN_NOT_FOUND, {
        domainId: request.domainId
      })
    }

    // 4. 查找记录
    const records = domain.getRecords()
    const record = records.find((r) => r.id === request.recordId)
    if (!record) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.DNS_RECORD_NOT_FOUND, {
        recordId: request.recordId
      })
    }

    // 5. 记录要删除的记录信息
    const removedRecord = {
      id: record.id,
      type: record.type,
      name: record.name,
      value: record.value,
      required: record.required
    }

    // 6. 从域名聚合根中移除记录
    domain.removeRecord(request.recordId)

    // 7. 保存域名
    const savedDomain = await this.domainRepository.save(domain)

    // 8. 发布事件
    const events = savedDomain.getDomainEvents()
    await this.domainEventPort.publishDomainEvents(events)

    return {
      recordId: record.id,
      domainId: record.domainId,
      success: true,
      message: 'DNS记录删除成功',
      removedRecord
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取统计信息
   */
  async getStatistics(request: { tenantId: string; userId: string }): Promise<{
    totalDomains: number
    verifiedDomains: number
    totalRecords: number
    verifiedRecords: number
  }> {
    // 1. 验证权限
    await this.validateTenantPermission(request.tenantId, request.userId)

    // 2. 获取域名统计
    const totalDomains = await this.domainRepository.count(request.tenantId)
    const verifiedDomains = await this.domainRepository.count(request.tenantId, { verified: true })

    // 3. 获取所有域名以计算记录统计
    const domains = await this.domainRepository.findByTenantId(request.tenantId)
    const allRecords = domains.flatMap((domain) => domain.getRecords())
    const totalRecords = allRecords.length
    const verifiedRecords = allRecords.filter((record) => record.isVerified()).length

    return {
      totalDomains,
      verifiedDomains,
      totalRecords,
      verifiedRecords
    }
  }

  // ==================== 私有验证方法 ====================

  private validateAddDnsRecordRequest(request: AddDnsRecordRequestDto): void {
    if (!request.domainId || !request.userId || !request.tenantId) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.INVALID_REQUEST_PARAMETERS, {
        missingFields: ['domainId', 'userId', 'tenantId'].filter((field) => !request[field])
      })
    }

    if (!request.recordType || !request.recordName || !request.recordValue) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.INVALID_REQUEST_PARAMETERS, {
        missingFields: ['recordType', 'recordName', 'recordValue'].filter(
          (field) => !request[field]
        )
      })
    }
  }

  private validateUpdateDnsRecordRequest(request: UpdateDnsRecordRequestDto): void {
    if (!request.domainId || !request.userId || !request.tenantId || !request.recordId) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.INVALID_REQUEST_PARAMETERS, {
        missingFields: ['domainId', 'userId', 'tenantId', 'recordId'].filter(
          (field) => !request[field]
        )
      })
    }

    if (
      request.newValue === undefined &&
      request.newTtl === undefined &&
      request.newPriority === undefined
    ) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.INVALID_REQUEST_PARAMETERS, {
        message: 'At least one field must be provided for update'
      })
    }
  }

  private validateRemoveDnsRecordRequest(request: RemoveDnsRecordRequestDto): void {
    if (!request.domainId || !request.userId || !request.tenantId || !request.recordId) {
      throw createBusinessException(RESOURCE_SERVICE_EXCEPTION_ERRORS.INVALID_REQUEST_PARAMETERS, {
        missingFields: ['domainId', 'userId', 'tenantId', 'recordId'].filter(
          (field) => !request[field]
        )
      })
    }
  }

  private mapDomainToResponse(domain: Domain): DomainResponseDto {
    return {
      id: domain.id,
      tenantId: domain.tenantId,
      value: domain.value,
      verificationStatus: domain.getVerificationStatus(),
      description: domain.description,
      createdAt: domain.createdAt,
      records: domain.getRecords().map((record) => ({
        id: record.id,
        type: record.type,
        name: record.name,
        value: record.value,
        ttl: record.ttl,
        required: record.required,
        priority: record.priority,
        verified: record.isVerified(),
        createdAt: record.createdAt
      }))
    }
  }
}
