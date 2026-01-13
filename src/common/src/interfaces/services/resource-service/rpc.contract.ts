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
  RemoveDnsRecordResponseDto
} from '../../../dtos/resource-service/all.dto'

/**
 * 域名验证方法枚举
 */
export enum DomainVerificationMethod {
  DNS_TXT = 'DNS_TXT', // DNS TXT记录验证
  DNS_CNAME = 'DNS_CNAME' // DNS CNAME记录验证
}

/**
 * 域名管理 RPC 测试接口
 */
export interface IResourceServiceRpcTestContract {
  testing(): Promise<void>
}

export interface IResourceServiceRpcDomainContract {
  // ==================== 域名管理 ====================

  /**
   * 创建域名
   */
  createDomain(request: CreateDomainRequestDto): Promise<CreateDomainResponseDto>

  /**
   * 更新域名描述
   */
  updateDomainDescription(
    request: UpdateDomainDescriptionRequestDto
  ): Promise<UpdateDomainDescriptionResponseDto>

  /**
   * 删除域名
   */
  deleteDomain(request: DeleteDomainRequestDto): Promise<DeleteDomainResponseDto>

  // ==================== 域名查询 ====================

  /**
   * 根据ID查询域名
   */
  findDomainById(request: FindDomainByIdRequestDto): Promise<FindDomainByIdResponseDto>

  /**
   * 根据域名值查询
   */
  findDomainByValue(request: FindDomainByValueRequestDto): Promise<FindDomainByValueResponseDto>

  /**
   * 根据租户ID查询域名列表
   */
  findDomainsByTenant(
    request: FindDomainsByTenantRequestDto
  ): Promise<FindDomainsByTenantResponseDto>

  /**
   * 分页查询域名
   */
  findDomainsPaginated(
    request: FindDomainsPaginatedRequestDto
  ): Promise<FindDomainsPaginatedResponseDto>

  /**
   * 搜索域名
   */
  searchDomains(request: SearchDomainsRequestDto): Promise<SearchDomainsResponseDto>

  // ==================== 域名验证 ====================

  /**
   * 生成验证挑战
   */
  generateVerificationChallenge(
    request: GenerateVerificationChallengeRequestDto
  ): Promise<GenerateVerificationChallengeResponseDto>

  /**
   * 验证域名
   */
  verifyDomain(request: VerifyDomainRequestDto): Promise<VerifyDomainResponseDto>

  /**
   * 验证DNS记录
   */
  verifyDnsRecords(request: VerifyDnsRecordsRequestDto): Promise<VerifyDnsRecordsResponseDto>

  // ==================== DNS记录管理 ====================

  /**
   * 添加DNS记录
   */
  addDnsRecord(request: AddDnsRecordRequestDto): Promise<AddDnsRecordResponseDto>

  /**
   * 更新DNS记录
   */
  updateDnsRecord(request: UpdateDnsRecordRequestDto): Promise<UpdateDnsRecordResponseDto>

  /**
   * 删除DNS记录
   */
  removeDnsRecord(request: RemoveDnsRecordRequestDto): Promise<RemoveDnsRecordResponseDto>
}

/**
 * 域名管理 RPC 接口
 */
export interface IResourceServiceRpcContract
  extends IResourceServiceRpcTestContract,
    IResourceServiceRpcDomainContract {}
