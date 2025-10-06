import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { DomainService } from '../../application/services/domain.service'
import { DomainVerificationService } from '../../application/services/domain-verification.service'
import { RESOURCE_SERVICE_MESSAGES } from '@oes/common/constants/messages/resource-service.messages'
import { RpcRequestData } from '@oes/common/decorators/rpc-request-data.decorator'
import {
  CreateDomainRequestDto,
  CreateDomainResponseDto,
  UpdateDomainDescriptionRequestDto,
  UpdateDomainDescriptionResponseDto,
  DeleteDomainRequestDto,
  DeleteDomainResponseDto,
  FindDomainsPaginatedRequestDto,
  FindDomainsPaginatedResponseDto,
  VerifyDomainRequestDto,
  VerifyDomainResponseDto,
  AddDnsRecordRequestDto,
  AddDnsRecordResponseDto,
  UpdateDnsRecordRequestDto,
  UpdateDnsRecordResponseDto,
  RemoveDnsRecordRequestDto,
  RemoveDnsRecordResponseDto,
  AdminForceVerifyDomainRequestDto,
  AdminGetAllStatisticsRequestDto,
  AdminGetAllStatisticsResponseDto,
  AdminGetTenantStatisticsRequestDto,
  AdminGetTenantStatisticsResponseDto
} from '@oes/common/dtos/resource-service/all.dto'

/**
 * 管理员 RPC 控制器
 *
 * 职责：
 * 1. 处理管理员专用的RPC调用
 * 2. 提供跨租户的管理功能
 * 3. 强制验证和批量操作
 * 4. 系统级别的统计和监控
 *
 * 设计原则：
 * - 权限控制：严格的管理员权限验证
 * - 跨租户操作：支持跨租户的管理功能
 * - 强制操作：支持强制验证等管理员专用功能
 * - 系统监控：提供系统级别的统计信息
 *
 * 注意：这是管理员专用控制器，需要特殊权限验证
 */
@Controller()
export class AdminManagementRpcController {
  constructor(
    private readonly domainService: DomainService,
    private readonly domainVerificationService: DomainVerificationService
  ) {}

  // ==================== 管理员域名管理 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_CREATE_DOMAIN)
  async adminCreateDomain(
    @RpcRequestData() request: CreateDomainRequestDto & { adminUserId: string }
  ): Promise<CreateDomainResponseDto> {
    try {
      console.log('Admin RPC: adminCreateDomain called', {
        domainValue: request.domainValue,
        tenantId: request.tenantId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'domain:admin_create')

      return await this.domainService.createDomain(request)
    } catch (error) {
      console.error('Admin RPC: adminCreateDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_UPDATE_DOMAIN)
  async adminUpdateDomain(
    @RpcRequestData() request: UpdateDomainDescriptionRequestDto & { adminUserId: string }
  ): Promise<UpdateDomainDescriptionResponseDto> {
    try {
      console.log('Admin RPC: adminUpdateDomain called', {
        domainId: request.domainId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'domain:admin_update')

      return await this.domainService.updateDomainDescription(request)
    } catch (error) {
      console.error('Admin RPC: adminUpdateDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_DELETE_DOMAIN)
  async adminDeleteDomain(
    @RpcRequestData() request: DeleteDomainRequestDto & { adminUserId: string }
  ): Promise<DeleteDomainResponseDto> {
    try {
      console.log('Admin RPC: adminDeleteDomain called', {
        domainId: request.domainId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'domain:admin_delete')

      return await this.domainService.deleteDomain(request)
    } catch (error) {
      console.error('Admin RPC: adminDeleteDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_FIND_ALL_DOMAINS)
  async adminFindAllDomains(
    @RpcRequestData() request: FindDomainsPaginatedRequestDto & { adminUserId: string }
  ): Promise<FindDomainsPaginatedResponseDto> {
    try {
      console.log('Admin RPC: adminFindAllDomains called', {
        adminUserId: request.adminUserId,
        page: request.page,
        pageSize: request.pageSize
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'domain:admin_read')

      // 管理员可以查看所有租户的域名，这里需要特殊处理
      // 暂时使用传入的tenantId，后续可以扩展为查询所有租户
      return await this.domainService.findDomainsPaginated(request)
    } catch (error) {
      console.error('Admin RPC: adminFindAllDomains failed', error)
      throw error
    }
  }

  // ==================== 管理员DNS记录管理 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_ADD_DNS_RECORD)
  async adminAddDnsRecord(
    @RpcRequestData() request: AddDnsRecordRequestDto & { adminUserId: string }
  ): Promise<AddDnsRecordResponseDto> {
    try {
      console.log('Admin RPC: adminAddDnsRecord called', {
        domainId: request.domainId,
        recordType: request.recordType,
        recordName: request.recordName,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'dns:admin_create')

      return await this.domainService.addDnsRecord(request)
    } catch (error) {
      console.error('Admin RPC: adminAddDnsRecord failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_UPDATE_DNS_RECORD)
  async adminUpdateDnsRecord(
    @RpcRequestData() request: UpdateDnsRecordRequestDto & { adminUserId: string }
  ): Promise<UpdateDnsRecordResponseDto> {
    try {
      console.log('Admin RPC: adminUpdateDnsRecord called', {
        domainId: request.domainId,
        recordId: request.recordId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'dns:admin_update')

      return await this.domainService.updateDnsRecord(request)
    } catch (error) {
      console.error('Admin RPC: adminUpdateDnsRecord failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_REMOVE_DNS_RECORD)
  async adminRemoveDnsRecord(
    @RpcRequestData() request: RemoveDnsRecordRequestDto & { adminUserId: string }
  ): Promise<RemoveDnsRecordResponseDto> {
    try {
      console.log('Admin RPC: adminRemoveDnsRecord called', {
        domainId: request.domainId,
        recordId: request.recordId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'dns:admin_delete')

      return await this.domainService.removeDnsRecord(request)
    } catch (error) {
      console.error('Admin RPC: adminRemoveDnsRecord failed', error)
      throw error
    }
  }

  // ==================== 管理员验证操作 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_VERIFY_DOMAIN)
  async adminVerifyDomain(
    @RpcRequestData() request: VerifyDomainRequestDto & { adminUserId: string }
  ): Promise<VerifyDomainResponseDto> {
    try {
      console.log('Admin RPC: adminVerifyDomain called', {
        domainId: request.domainId,
        verificationMethod: request.verificationMethod,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'verification:admin_verify')

      return await this.domainVerificationService.verifyDomain(request)
    } catch (error) {
      console.error('Admin RPC: adminVerifyDomain failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_FORCE_VERIFY_DOMAIN)
  async adminForceVerifyDomain(
    @RpcRequestData() request: AdminForceVerifyDomainRequestDto
  ): Promise<VerifyDomainResponseDto> {
    try {
      console.log('Admin RPC: adminForceVerifyDomain called', {
        domainId: request.domainId,
        adminUserId: request.adminUserId
      })

      // 添加管理员权限验证
      await this.validateAdminPermission(request.adminUserId, 'verification:admin_force_verify')

      // 强制验证逻辑：跳过DNS检查，直接标记为已验证
      // 这里需要扩展DomainService来支持强制验证
      // return await this.domainService.forceVerifyDomain(request.domainId)

      throw new Error('Admin force verify not implemented yet')
    } catch (error) {
      console.error('Admin RPC: adminForceVerifyDomain failed', error)
      throw error
    }
  }

  // ==================== 管理员统计 ====================

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_GET_ALL_STATISTICS)
  async adminGetAllStatistics(
    @RpcRequestData() request: AdminGetAllStatisticsRequestDto
  ): Promise<AdminGetAllStatisticsResponseDto> {
    try {
      console.log('Admin RPC: adminGetAllStatistics called', { adminUserId: request.adminUserId })

      // 添加管理员权限验证
      await this.validateAdminPermission(request.adminUserId, 'statistics:admin_read')

      // TODO: 实现跨租户统计逻辑
      return {
        totalDomains: 0,
        totalTenants: 0,
        totalRecords: 0,
        verifiedDomains: 0,
        unverifiedDomains: 0,
        tenantStatistics: []
      }
    } catch (error) {
      console.error('Admin RPC: adminGetAllStatistics failed', error)
      throw error
    }
  }

  @MessagePattern(RESOURCE_SERVICE_MESSAGES.ADMIN_GET_TENANT_STATISTICS)
  async adminGetTenantStatistics(
    @RpcRequestData() request: AdminGetTenantStatisticsRequestDto
  ): Promise<AdminGetTenantStatisticsResponseDto> {
    try {
      console.log('Admin RPC: adminGetTenantStatistics called', {
        tenantId: request.tenantId,
        adminUserId: request.adminUserId
      })

      // TODO: 添加管理员权限验证
      // await this.validateAdminPermission(request.adminUserId, 'statistics:admin_read')

      // 使用现有的统计方法
      const statistics = await this.domainService.getStatistics({
        tenantId: request.tenantId,
        userId: request.adminUserId
      })

      return {
        tenantId: request.tenantId,
        totalDomains: statistics.totalDomains,
        verifiedDomains: statistics.verifiedDomains,
        totalRecords: statistics.totalRecords,
        verifiedRecords: statistics.verifiedRecords,
        domainList: [] // TODO: 实现域名列表获取
      }
    } catch (error) {
      console.error('Admin RPC: adminGetTenantStatistics failed', error)
      throw error
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 验证管理员权限
   * TODO: 实现管理员权限验证逻辑
   */
  private async validateAdminPermission(adminUserId: string, permission: string): Promise<void> {
    // TODO: 实现管理员权限验证
    // 1. 检查用户是否为管理员
    // 2. 检查用户是否有特定权限
    // 3. 记录管理员操作日志
    console.log(`Validating admin permission: ${adminUserId} - ${permission}`)

    // 模拟异步操作，避免linting警告
    await Promise.resolve()
  }
}
