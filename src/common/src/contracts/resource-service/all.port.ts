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
} from '../../dtos/resource-service/all.dto'

export interface DomainPort {
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
