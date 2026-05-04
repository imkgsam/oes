"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDomainStatisticsResponseDto = exports.GetDomainStatisticsRequestDto = exports.AdminGetTenantStatisticsResponseDto = exports.AdminGetTenantStatisticsRequestDto = exports.AdminGetAllStatisticsResponseDto = exports.AdminGetAllStatisticsRequestDto = exports.AdminForceVerifyDomainRequestDto = exports.RemoveDnsRecordResponseDto = exports.RemoveDnsRecordRequestDto = exports.UpdateDnsRecordResponseDto = exports.UpdateDnsRecordRequestDto = exports.AddDnsRecordResponseDto = exports.AddDnsRecordRequestDto = exports.VerifyDnsRecordsResponseDto = exports.DnsRecordVerificationResultDto = exports.VerifyDnsRecordsRequestDto = exports.VerifyDomainResponseDto = exports.VerifyDomainRequestDto = exports.GenerateVerificationChallengeResponseDto = exports.GenerateVerificationChallengeRequestDto = exports.SearchDomainsResponseDto = exports.FindDomainsPaginatedResponseDto = exports.FindDomainsByTenantResponseDto = exports.FindDomainByValueResponseDto = exports.FindDomainByIdResponseDto = exports.DomainRecordResponseDto = exports.DomainResponseDto = exports.PaginationDto = exports.DomainQueryFiltersDto = exports.SearchDomainsRequestDto = exports.FindDomainsPaginatedRequestDto = exports.FindDomainsByTenantRequestDto = exports.FindDomainByValueRequestDto = exports.FindDomainByIdRequestDto = exports.DeleteDomainResponseDto = exports.DeleteDomainRequestDto = exports.UpdateDomainDescriptionResponseDto = exports.UpdateDomainDescriptionRequestDto = exports.CreateDomainResponseDto = exports.CreateDomainRequestDto = exports.DomainVerificationMethod = exports.RecordType = void 0;
// 临时定义，实际应该从prisma生成
var RecordType;
(function (RecordType) {
    RecordType["A"] = "A";
    RecordType["AAAA"] = "AAAA";
    RecordType["CNAME"] = "CNAME";
    RecordType["MX"] = "MX";
    RecordType["TXT"] = "TXT";
    RecordType["NS"] = "NS";
    RecordType["SOA"] = "SOA";
    RecordType["PTR"] = "PTR";
    RecordType["SRV"] = "SRV";
})(RecordType || (exports.RecordType = RecordType = {}));
var DomainVerificationMethod;
(function (DomainVerificationMethod) {
    DomainVerificationMethod["DNS_TXT"] = "DNS_TXT";
    DomainVerificationMethod["DNS_CNAME"] = "DNS_CNAME";
})(DomainVerificationMethod || (exports.DomainVerificationMethod = DomainVerificationMethod = {}));
// ==================== 域名管理相关DTO ====================
/**
 * 创建域名请求
 */
class CreateDomainRequestDto {
    tenantId;
    userId;
    domainValue;
    description;
}
exports.CreateDomainRequestDto = CreateDomainRequestDto;
/**
 * 创建域名响应
 */
class CreateDomainResponseDto {
    domainId;
    domainValue;
    tenantId;
    verificationStatus;
    description;
    createdAt;
}
exports.CreateDomainResponseDto = CreateDomainResponseDto;
/**
 * 更新域名描述请求
 */
class UpdateDomainDescriptionRequestDto {
    domainId;
    userId;
    tenantId;
    newDescription;
}
exports.UpdateDomainDescriptionRequestDto = UpdateDomainDescriptionRequestDto;
/**
 * 更新域名描述响应
 */
class UpdateDomainDescriptionResponseDto {
    domainId;
    oldDescription;
    newDescription;
    updatedAt;
}
exports.UpdateDomainDescriptionResponseDto = UpdateDomainDescriptionResponseDto;
/**
 * 删除域名请求
 */
class DeleteDomainRequestDto {
    domainId;
    userId;
    tenantId;
}
exports.DeleteDomainRequestDto = DeleteDomainRequestDto;
/**
 * 删除域名响应
 */
class DeleteDomainResponseDto {
    domainId;
    domainValue;
    deletedAt;
}
exports.DeleteDomainResponseDto = DeleteDomainResponseDto;
// ==================== 域名查询相关DTO ====================
/**
 * 根据ID查询域名请求
 */
class FindDomainByIdRequestDto {
    domainId;
    userId;
    tenantId;
}
exports.FindDomainByIdRequestDto = FindDomainByIdRequestDto;
/**
 * 根据域名值查询请求
 */
class FindDomainByValueRequestDto {
    domainValue;
    userId;
    tenantId;
}
exports.FindDomainByValueRequestDto = FindDomainByValueRequestDto;
/**
 * 根据租户查询域名请求
 */
class FindDomainsByTenantRequestDto {
    tenantId;
    userId;
}
exports.FindDomainsByTenantRequestDto = FindDomainsByTenantRequestDto;
/**
 * 分页查询域名请求
 */
class FindDomainsPaginatedRequestDto {
    tenantId;
    userId;
    page;
    pageSize;
    filters;
}
exports.FindDomainsPaginatedRequestDto = FindDomainsPaginatedRequestDto;
/**
 * 搜索域名请求
 */
class SearchDomainsRequestDto {
    tenantId;
    userId;
    searchTerm;
    page;
    pageSize;
    verified;
    hasRecords;
    recordType;
    createdAfter;
    createdBefore;
}
exports.SearchDomainsRequestDto = SearchDomainsRequestDto;
/**
 * 域名查询过滤器
 */
class DomainQueryFiltersDto {
    verified;
    searchTerm;
    createdAfter;
    createdBefore;
    hasRecords;
    recordType;
}
exports.DomainQueryFiltersDto = DomainQueryFiltersDto;
/**
 * 分页信息
 */
class PaginationDto {
    totalCount;
    page;
    pageSize;
    totalPages;
    hasNext;
    hasPrevious;
}
exports.PaginationDto = PaginationDto;
/**
 * 域名响应
 */
class DomainResponseDto {
    id;
    tenantId;
    value;
    verificationStatus;
    description;
    createdAt;
    records;
}
exports.DomainResponseDto = DomainResponseDto;
/**
 * 域名记录响应
 */
class DomainRecordResponseDto {
    id;
    type;
    name;
    value;
    ttl;
    required;
    priority;
    verified;
    createdAt;
}
exports.DomainRecordResponseDto = DomainRecordResponseDto;
/**
 * 查询域名响应
 */
class FindDomainByIdResponseDto {
    domain;
    found;
}
exports.FindDomainByIdResponseDto = FindDomainByIdResponseDto;
/**
 * 根据域名值查询响应
 */
class FindDomainByValueResponseDto {
    domain;
    found;
}
exports.FindDomainByValueResponseDto = FindDomainByValueResponseDto;
/**
 * 查询域名列表响应
 */
class FindDomainsByTenantResponseDto {
    domains;
    count;
}
exports.FindDomainsByTenantResponseDto = FindDomainsByTenantResponseDto;
/**
 * 分页查询域名响应
 */
class FindDomainsPaginatedResponseDto {
    domains;
    pagination;
}
exports.FindDomainsPaginatedResponseDto = FindDomainsPaginatedResponseDto;
/**
 * 搜索域名响应
 */
class SearchDomainsResponseDto {
    domains;
    pagination;
    searchTerm;
}
exports.SearchDomainsResponseDto = SearchDomainsResponseDto;
// ==================== 域名验证相关DTO ====================
/**
 * 生成验证挑战请求
 */
class GenerateVerificationChallengeRequestDto {
    domainId;
    userId;
    tenantId;
    verificationMethod;
}
exports.GenerateVerificationChallengeRequestDto = GenerateVerificationChallengeRequestDto;
/**
 * 生成验证挑战响应
 */
class GenerateVerificationChallengeResponseDto {
    domainId;
    domainValue;
    verificationMethod;
    challenge;
    instructions;
    expiresAt;
    retryCount;
    maxRetries;
    estimatedTime;
}
exports.GenerateVerificationChallengeResponseDto = GenerateVerificationChallengeResponseDto;
/**
 * 验证域名请求
 */
class VerifyDomainRequestDto {
    domainId;
    userId;
    tenantId;
    verificationMethod;
    challenge;
}
exports.VerifyDomainRequestDto = VerifyDomainRequestDto;
/**
 * 验证域名响应
 */
class VerifyDomainResponseDto {
    domainId;
    success;
    message;
    verificationStatus;
    verifiedAt;
    errorCode;
    details;
}
exports.VerifyDomainResponseDto = VerifyDomainResponseDto;
/**
 * 验证DNS记录请求
 */
class VerifyDnsRecordsRequestDto {
    domainId;
    userId;
    tenantId;
    recordIds; // 空数组表示验证所有记录
}
exports.VerifyDnsRecordsRequestDto = VerifyDnsRecordsRequestDto;
/**
 * DNS记录验证结果
 */
class DnsRecordVerificationResultDto {
    recordId;
    recordType;
    recordName;
    success;
    verifiedAt;
    errorMessage;
    actualValue;
    expectedValue;
    ttl;
}
exports.DnsRecordVerificationResultDto = DnsRecordVerificationResultDto;
/**
 * 验证DNS记录响应
 */
class VerifyDnsRecordsResponseDto {
    domainId;
    results;
    totalCount;
    successCount;
    failureCount;
}
exports.VerifyDnsRecordsResponseDto = VerifyDnsRecordsResponseDto;
// ==================== DNS记录管理相关DTO ====================
/**
 * 添加DNS记录请求
 */
class AddDnsRecordRequestDto {
    domainId;
    userId;
    tenantId;
    recordType;
    recordName;
    recordValue;
    ttl;
    required;
    priority;
}
exports.AddDnsRecordRequestDto = AddDnsRecordRequestDto;
/**
 * 添加DNS记录响应
 */
class AddDnsRecordResponseDto {
    recordId;
    domainId;
    recordType;
    recordName;
    recordValue;
    ttl;
    required;
    priority;
    verified;
    createdAt;
}
exports.AddDnsRecordResponseDto = AddDnsRecordResponseDto;
/**
 * 更新DNS记录请求
 */
class UpdateDnsRecordRequestDto {
    domainId;
    userId;
    tenantId;
    recordId;
    newValue;
    newTtl;
    newPriority;
}
exports.UpdateDnsRecordRequestDto = UpdateDnsRecordRequestDto;
/**
 * 更新DNS记录响应
 */
class UpdateDnsRecordResponseDto {
    recordId;
    domainId;
    success;
    message;
    changes;
    updatedRecord;
}
exports.UpdateDnsRecordResponseDto = UpdateDnsRecordResponseDto;
/**
 * 删除DNS记录请求
 */
class RemoveDnsRecordRequestDto {
    domainId;
    userId;
    tenantId;
    recordId;
}
exports.RemoveDnsRecordRequestDto = RemoveDnsRecordRequestDto;
/**
 * 删除DNS记录响应
 */
class RemoveDnsRecordResponseDto {
    recordId;
    domainId;
    success;
    message;
    removedRecord;
}
exports.RemoveDnsRecordResponseDto = RemoveDnsRecordResponseDto;
// ==================== 管理员操作相关DTO ====================
/**
 * 管理员强制验证域名请求
 */
class AdminForceVerifyDomainRequestDto {
    domainId;
    adminUserId;
}
exports.AdminForceVerifyDomainRequestDto = AdminForceVerifyDomainRequestDto;
/**
 * 管理员获取所有统计信息请求
 */
class AdminGetAllStatisticsRequestDto {
    adminUserId;
}
exports.AdminGetAllStatisticsRequestDto = AdminGetAllStatisticsRequestDto;
/**
 * 管理员获取所有统计信息响应
 */
class AdminGetAllStatisticsResponseDto {
    totalDomains;
    totalTenants;
    totalRecords;
    verifiedDomains;
    unverifiedDomains;
    tenantStatistics;
}
exports.AdminGetAllStatisticsResponseDto = AdminGetAllStatisticsResponseDto;
/**
 * 管理员获取租户统计信息请求
 */
class AdminGetTenantStatisticsRequestDto {
    tenantId;
    adminUserId;
}
exports.AdminGetTenantStatisticsRequestDto = AdminGetTenantStatisticsRequestDto;
/**
 * 管理员获取租户统计信息响应
 */
class AdminGetTenantStatisticsResponseDto {
    tenantId;
    totalDomains;
    verifiedDomains;
    totalRecords;
    verifiedRecords;
    domainList;
}
exports.AdminGetTenantStatisticsResponseDto = AdminGetTenantStatisticsResponseDto;
// ==================== 统计信息相关DTO ====================
/**
 * 获取域名统计信息请求
 */
class GetDomainStatisticsRequestDto {
    tenantId;
    userId;
}
exports.GetDomainStatisticsRequestDto = GetDomainStatisticsRequestDto;
/**
 * 获取域名统计信息响应
 */
class GetDomainStatisticsResponseDto {
    totalDomains;
    verifiedDomains;
    totalRecords;
    verifiedRecords;
}
exports.GetDomainStatisticsResponseDto = GetDomainStatisticsResponseDto;
//# sourceMappingURL=all.dto.js.map