import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { DomainService } from '../../application/services/domain.service'
import { DomainVerificationService } from '../../application/services/domain-verification.service'
import { IResourceServiceRpcDomainContract } from '@oes/common/interfaces/services/resource-service/rpc.contract'
import { RESOURCE_SERVICE_MESSAGES } from '@oes/common/constants/messages/resource-service.messages'
import { RpcRequestData } from '@oes/common/decorators/rpc-request-data.decorator'
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
  RemoveDnsRecordResponseDto,
  GetDomainStatisticsRequestDto,
  GetDomainStatisticsResponseDto
} from '@oes/common/dtos/resource-service/all.dto'

/**
 * 域名管理 RPC 控制器
 *
 * 职责：
 * 1. 处理域名管理相关的RPC调用
 * 2. 路由请求到相应的应用服务
 * 3. 处理请求验证和响应格式化
 * 4. 管理错误处理和日志记录
 *
 * 设计原则：
 * - 单一职责：专注于域名管理功能
 * - 错误处理：统一处理异常和错误响应
 * - 日志记录：记录所有RPC调用
 * - 性能：优化RPC调用性能
 *
 * 注意：这是域名管理模块的RPC控制器，不包含管理员功能
 */
@Controller()
export class DomainManagementRpcController implements IResourceServiceRpcDomainContract {
  constructor(
    private readonly domainService: DomainService,
    private readonly domainVerificationService: DomainVerificationService
  ) {}

  // ==================== 域名管理 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.CREATE_DOMAIN)
  async createDomain(
    @RpcRequestData() request: CreateDomainRequestDto
  ): Promise<CreateDomainResponseDto> {
    try {
      console.log('RPC: createDomain called', {
        domainValue: request.domainValue,
        tenantId: request.tenantId
      })
      return await this.domainService.createDomain(request)
    } catch (error) {
      console.error('RPC: createDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.UPDATE_DOMAIN_DESCRIPTION)
  async updateDomainDescription(
    @RpcRequestData() request: UpdateDomainDescriptionRequestDto
  ): Promise<UpdateDomainDescriptionResponseDto> {
    try {
      console.log('RPC: updateDomainDescription called', { domainId: request.domainId })
      return await this.domainService.updateDomainDescription(request)
    } catch (error) {
      console.error('RPC: updateDomainDescription failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.DELETE_DOMAIN)
  async deleteDomain(
    @RpcRequestData() request: DeleteDomainRequestDto
  ): Promise<DeleteDomainResponseDto> {
    try {
      console.log('RPC: deleteDomain called', { domainId: request.domainId })
      return await this.domainService.deleteDomain(request)
    } catch (error) {
      console.error('RPC: deleteDomain failed', error)
      throw error
    }
  }

  // ==================== 域名查询 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.FIND_DOMAIN_BY_ID)
  async findDomainById(
    @RpcRequestData() request: FindDomainByIdRequestDto
  ): Promise<FindDomainByIdResponseDto> {
    try {
      console.log('RPC: findDomainById called', { domainId: request.domainId })
      return await this.domainService.findDomainById(request)
    } catch (error) {
      console.error('RPC: findDomainById failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.FIND_DOMAIN_BY_VALUE)
  async findDomainByValue(
    @RpcRequestData() request: FindDomainByValueRequestDto
  ): Promise<FindDomainByValueResponseDto> {
    try {
      console.log('RPC: findDomainByValue called', { domainValue: request.domainValue })
      return await this.domainService.findDomainByValue(request)
    } catch (error) {
      console.error('RPC: findDomainByValue failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.FIND_DOMAINS_BY_TENANT)
  async findDomainsByTenant(
    @RpcRequestData() request: FindDomainsByTenantRequestDto
  ): Promise<FindDomainsByTenantResponseDto> {
    try {
      console.log('RPC: findDomainsByTenant called', { tenantId: request.tenantId })
      return await this.domainService.findDomainsByTenant(request)
    } catch (error) {
      console.error('RPC: findDomainsByTenant failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.FIND_DOMAINS_PAGINATED)
  async findDomainsPaginated(
    @RpcRequestData() request: FindDomainsPaginatedRequestDto
  ): Promise<FindDomainsPaginatedResponseDto> {
    try {
      console.log('RPC: findDomainsPaginated called', {
        tenantId: request.tenantId,
        page: request.page,
        pageSize: request.pageSize
      })
      return await this.domainService.findDomainsPaginated(request)
    } catch (error) {
      console.error('RPC: findDomainsPaginated failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.SEARCH_DOMAINS)
  async searchDomains(
    @RpcRequestData() request: SearchDomainsRequestDto
  ): Promise<SearchDomainsResponseDto> {
    try {
      console.log('RPC: searchDomains called', {
        tenantId: request.tenantId,
        searchTerm: request.searchTerm
      })
      return await this.domainService.searchDomains(request)
    } catch (error) {
      console.error('RPC: searchDomains failed', error)
      throw error
    }
  }

  // ==================== 域名验证 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.GENERATE_VERIFICATION_CHALLENGE)
  async generateVerificationChallenge(
    @RpcRequestData() request: GenerateVerificationChallengeRequestDto
  ): Promise<GenerateVerificationChallengeResponseDto> {
    try {
      console.log('RPC: generateVerificationChallenge called', {
        domainId: request.domainId,
        verificationMethod: request.verificationMethod
      })
      return await this.domainVerificationService.generateVerificationChallenge(request)
    } catch (error) {
      console.error('RPC: generateVerificationChallenge failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.VERIFY_DOMAIN)
  async verifyDomain(
    @RpcRequestData() request: VerifyDomainRequestDto
  ): Promise<VerifyDomainResponseDto> {
    try {
      console.log('RPC: verifyDomain called', {
        domainId: request.domainId,
        verificationMethod: request.verificationMethod
      })
      return await this.domainVerificationService.verifyDomain(request)
    } catch (error) {
      console.error('RPC: verifyDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.VERIFY_DNS_RECORDS)
  async verifyDnsRecords(
    @RpcRequestData() request: VerifyDnsRecordsRequestDto
  ): Promise<VerifyDnsRecordsResponseDto> {
    try {
      console.log('RPC: verifyDnsRecords called', {
        domainId: request.domainId,
        recordIds: request.recordIds
      })
      return await this.domainVerificationService.verifyDnsRecords(request)
    } catch (error) {
      console.error('RPC: verifyDnsRecords failed', error)
      throw error
    }
  }

  // ==================== DNS记录管理 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADD_DNS_RECORD)
  async addDnsRecord(
    @RpcRequestData() request: AddDnsRecordRequestDto
  ): Promise<AddDnsRecordResponseDto> {
    try {
      console.log('RPC: addDnsRecord called', {
        domainId: request.domainId,
        recordType: request.recordType,
        recordName: request.recordName
      })
      return await this.domainService.addDnsRecord(request)
    } catch (error) {
      console.error('RPC: addDnsRecord failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.UPDATE_DNS_RECORD)
  async updateDnsRecord(
    @RpcRequestData() request: UpdateDnsRecordRequestDto
  ): Promise<UpdateDnsRecordResponseDto> {
    try {
      console.log('RPC: updateDnsRecord called', {
        domainId: request.domainId,
        recordId: request.recordId
      })
      return await this.domainService.updateDnsRecord(request)
    } catch (error) {
      console.error('RPC: updateDnsRecord failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.REMOVE_DNS_RECORD)
  async removeDnsRecord(
    @RpcRequestData() request: RemoveDnsRecordRequestDto
  ): Promise<RemoveDnsRecordResponseDto> {
    try {
      console.log('RPC: removeDnsRecord called', {
        domainId: request.domainId,
        recordId: request.recordId
      })
      return await this.domainService.removeDnsRecord(request)
    } catch (error) {
      console.error('RPC: removeDnsRecord failed', error)
      throw error
    }
  }

  // ==================== 健康检查 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.HEALTH_CHECK)
  health(): Promise<{ status: string; timestamp: Date; service: string }> {
    return Promise.resolve({
      status: 'healthy',
      timestamp: new Date(),
      service: 'domain-management'
    })
  }

  // ==================== 统计信息 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.GET_DOMAIN_STATISTICS)
  async getStatistics(
    @RpcRequestData() request: GetDomainStatisticsRequestDto
  ): Promise<GetDomainStatisticsResponseDto> {
    try {
      console.log('RPC: getStatistics called', { tenantId: request.tenantId })
      return await this.domainService.getStatistics(request)
    } catch (error) {
      console.error('RPC: getStatistics failed', error)
      throw error
    }
  }
}
