// 临时定义，实际应该从prisma生成
export enum RecordType {
  A = 'A',
  AAAA = 'AAAA',
  CNAME = 'CNAME',
  MX = 'MX',
  TXT = 'TXT',
  NS = 'NS',
  SOA = 'SOA',
  PTR = 'PTR',
  SRV = 'SRV'
}

export enum DomainVerificationMethod {
  DNS_TXT = 'DNS_TXT',
  DNS_CNAME = 'DNS_CNAME'
}

// ==================== 域名管理相关DTO ====================

/**
 * 创建域名请求
 */
export class CreateDomainRequestDto {
  tenantId: string
  userId: string
  domainValue: string
  description?: string
}

/**
 * 创建域名响应
 */
export class CreateDomainResponseDto {
  domainId: string
  domainValue: string
  tenantId: string
  verificationStatus: string
  description?: string
  createdAt: Date
}

/**
 * 更新域名描述请求
 */
export class UpdateDomainDescriptionRequestDto {
  domainId: string
  userId: string
  tenantId: string
  newDescription: string
}

/**
 * 更新域名描述响应
 */
export class UpdateDomainDescriptionResponseDto {
  domainId: string
  oldDescription?: string
  newDescription?: string
  updatedAt: Date
}

/**
 * 删除域名请求
 */
export class DeleteDomainRequestDto {
  domainId: string
  userId: string
  tenantId: string
}

/**
 * 删除域名响应
 */
export class DeleteDomainResponseDto {
  domainId: string
  domainValue: string
  deletedAt: Date
}

// ==================== 域名查询相关DTO ====================

/**
 * 根据ID查询域名请求
 */
export class FindDomainByIdRequestDto {
  domainId: string
  userId: string
  tenantId: string
}

/**
 * 根据域名值查询请求
 */
export class FindDomainByValueRequestDto {
  domainValue: string
  userId: string
  tenantId: string
}

/**
 * 根据租户查询域名请求
 */
export class FindDomainsByTenantRequestDto {
  tenantId: string
  userId: string
}

/**
 * 分页查询域名请求
 */
export class FindDomainsPaginatedRequestDto {
  tenantId: string
  userId: string
  page: number
  pageSize: number
  filters?: DomainQueryFiltersDto
}

/**
 * 搜索域名请求
 */
export class SearchDomainsRequestDto {
  tenantId: string
  userId: string
  searchTerm: string
  page: number
  pageSize: number
  verified?: boolean
  hasRecords?: boolean
  recordType?: string
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * 域名查询过滤器
 */
export class DomainQueryFiltersDto {
  verified?: boolean
  searchTerm?: string
  createdAfter?: Date
  createdBefore?: Date
  hasRecords?: boolean
  recordType?: string
}

/**
 * 分页信息
 */
export class PaginationDto {
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * 域名响应
 */
export class DomainResponseDto {
  id: string
  tenantId: string
  value: string
  verificationStatus: string
  description?: string
  createdAt: Date
  records: DomainRecordResponseDto[]
}

/**
 * 域名记录响应
 */
export class DomainRecordResponseDto {
  id: string
  type: string
  name: string
  value: string
  ttl: number
  required: boolean
  priority?: number
  verified: boolean
  createdAt: Date
}

/**
 * 查询域名响应
 */
export class FindDomainByIdResponseDto {
  domain: DomainResponseDto | null
  found: boolean
}

/**
 * 根据域名值查询响应
 */
export class FindDomainByValueResponseDto {
  domain: DomainResponseDto | null
  found: boolean
}

/**
 * 查询域名列表响应
 */
export class FindDomainsByTenantResponseDto {
  domains: DomainResponseDto[]
  count: number
}

/**
 * 分页查询域名响应
 */
export class FindDomainsPaginatedResponseDto {
  domains: DomainResponseDto[]
  pagination: PaginationDto
}

/**
 * 搜索域名响应
 */
export class SearchDomainsResponseDto {
  domains: DomainResponseDto[]
  pagination: PaginationDto
  searchTerm: string
}

// ==================== 域名验证相关DTO ====================

/**
 * 生成验证挑战请求
 */
export class GenerateVerificationChallengeRequestDto {
  domainId: string
  userId: string
  tenantId: string
  verificationMethod: DomainVerificationMethod
}

/**
 * 生成验证挑战响应
 */
export class GenerateVerificationChallengeResponseDto {
  domainId: string
  domainValue: string
  verificationMethod: DomainVerificationMethod
  challenge: string
  instructions: string
  expiresAt: Date
  retryCount: number
  maxRetries: number
  estimatedTime: string
}

/**
 * 验证域名请求
 */
export class VerifyDomainRequestDto {
  domainId: string
  userId: string
  tenantId: string
  verificationMethod: DomainVerificationMethod
  challenge: string
}

/**
 * 验证域名响应
 */
export class VerifyDomainResponseDto {
  domainId: string
  success: boolean
  message: string
  verificationStatus: string
  verifiedAt?: Date
  errorCode?: string
  details?: Record<string, any>
}

/**
 * 验证DNS记录请求
 */
export class VerifyDnsRecordsRequestDto {
  domainId: string
  userId: string
  tenantId: string
  recordIds: string[] // 空数组表示验证所有记录
}

/**
 * DNS记录验证结果
 */
export class DnsRecordVerificationResultDto {
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
 * 验证DNS记录响应
 */
export class VerifyDnsRecordsResponseDto {
  domainId: string
  results: DnsRecordVerificationResultDto[]
  totalCount: number
  successCount: number
  failureCount: number
}

// ==================== DNS记录管理相关DTO ====================

/**
 * 添加DNS记录请求
 */
export class AddDnsRecordRequestDto {
  domainId: string
  userId: string
  tenantId: string
  recordType: RecordType
  recordName: string
  recordValue: string
  ttl?: number
  required?: boolean
  priority?: number
}

/**
 * 添加DNS记录响应
 */
export class AddDnsRecordResponseDto {
  recordId: string
  domainId: string
  recordType: string
  recordName: string
  recordValue: string
  ttl: number
  required: boolean
  priority?: number
  verified: boolean
  createdAt: Date
}

/**
 * 更新DNS记录请求
 */
export class UpdateDnsRecordRequestDto {
  domainId: string
  userId: string
  tenantId: string
  recordId: string
  newValue?: string
  newTtl?: number
  newPriority?: number
}

/**
 * 更新DNS记录响应
 */
export class UpdateDnsRecordResponseDto {
  recordId: string
  domainId: string
  success: boolean
  message: string
  changes: Record<string, { old: any; new: any }>
  updatedRecord?: {
    id: string
    type: string
    name: string
    value: string
    ttl: number
    required: boolean
    priority?: number
    verified: boolean
    createdAt: Date
  }
}

/**
 * 删除DNS记录请求
 */
export class RemoveDnsRecordRequestDto {
  domainId: string
  userId: string
  tenantId: string
  recordId: string
}

/**
 * 删除DNS记录响应
 */
export class RemoveDnsRecordResponseDto {
  recordId: string
  domainId: string
  success: boolean
  message: string
  removedRecord: {
    id: string
    type: string
    name: string
    value: string
    required: boolean
  }
}

// ==================== 管理员操作相关DTO ====================

/**
 * 管理员强制验证域名请求
 */
export class AdminForceVerifyDomainRequestDto {
  domainId: string
  adminUserId: string
}

/**
 * 管理员获取所有统计信息请求
 */
export class AdminGetAllStatisticsRequestDto {
  adminUserId: string
}

/**
 * 管理员获取所有统计信息响应
 */
export class AdminGetAllStatisticsResponseDto {
  totalDomains: number
  totalTenants: number
  totalRecords: number
  verifiedDomains: number
  unverifiedDomains: number
  tenantStatistics: Array<{
    tenantId: string
    domainCount: number
    recordCount: number
    verifiedCount: number
  }>
}

/**
 * 管理员获取租户统计信息请求
 */
export class AdminGetTenantStatisticsRequestDto {
  tenantId: string
  adminUserId: string
}

/**
 * 管理员获取租户统计信息响应
 */
export class AdminGetTenantStatisticsResponseDto {
  tenantId: string
  totalDomains: number
  verifiedDomains: number
  totalRecords: number
  verifiedRecords: number
  domainList: Array<{
    id: string
    value: string
    isVerified: boolean
    recordCount: number
  }>
}

// ==================== 统计信息相关DTO ====================

/**
 * 获取域名统计信息请求
 */
export class GetDomainStatisticsRequestDto {
  tenantId: string
  userId: string
}

/**
 * 获取域名统计信息响应
 */
export class GetDomainStatisticsResponseDto {
  totalDomains: number
  verifiedDomains: number
  totalRecords: number
  verifiedRecords: number
}
