/**
 * Resource Service 消息定义
 *
 * 用于 TCP 通信的消息模式定义
 * 每个消息都包含详细的使用场景说明
 */

export const RESOURCE_SERVICE_MESSAGES = {
  // ==================== 域名管理消息 ====================

  /**
   * 创建域名
   * 使用场景：用户创建新的域名
   * 参数：{ tenantId: string, userId: string, domainValue: string, description?: string }
   */
  CREATE_DOMAIN: 'resource.domain.create',

  /**
   * 更新域名描述
   * 使用场景：用户修改域名的描述信息
   * 参数：{ domainId: string, userId: string, tenantId: string, newDescription: string }
   */
  UPDATE_DOMAIN_DESCRIPTION: 'resource.domain.update_description',

  /**
   * 删除域名
   * 使用场景：用户删除不再需要的域名
   * 参数：{ domainId: string, userId: string, tenantId: string }
   */
  DELETE_DOMAIN: 'resource.domain.delete',

  /**
   * 根据ID查找域名
   * 使用场景：通过域名ID获取域名详细信息
   * 参数：{ domainId: string, userId: string, tenantId: string }
   */
  FIND_DOMAIN_BY_ID: 'resource.domain.find_by_id',

  /**
   * 根据域名值查找
   * 使用场景：通过域名值查找域名信息
   * 参数：{ domainValue: string, userId: string, tenantId: string }
   */
  FIND_DOMAIN_BY_VALUE: 'resource.domain.find_by_value',

  /**
   * 根据租户查找域名列表
   * 使用场景：获取指定租户下的所有域名
   * 参数：{ tenantId: string, userId: string }
   */
  FIND_DOMAINS_BY_TENANT: 'resource.domain.find_by_tenant',

  /**
   * 分页查询域名
   * 使用场景：分页获取域名列表，支持过滤条件
   * 参数：{ tenantId: string, userId: string, page: number, pageSize: number, filters?: DomainQueryFilters }
   */
  FIND_DOMAINS_PAGINATED: 'resource.domain.find_paginated',

  /**
   * 搜索域名
   * 使用场景：根据关键词搜索域名
   * 参数：{ tenantId: string, userId: string, searchTerm: string, page: number, pageSize: number, filters?: DomainQueryFilters }
   */
  SEARCH_DOMAINS: 'resource.domain.search',

  /**
   * 获取域名统计信息
   * 使用场景：获取域名的统计数据和概览信息
   * 参数：{ tenantId: string, userId: string }
   */
  GET_DOMAIN_STATISTICS: 'resource.domain.get_statistics',

  // ==================== DNS记录管理消息 ====================

  /**
   * 添加DNS记录
   * 使用场景：为域名添加新的DNS记录
   * 参数：{ domainId: string, userId: string, tenantId: string, recordType: RecordType, recordName: string, recordValue: string, ttl?: number, required?: boolean, priority?: number }
   */
  ADD_DNS_RECORD: 'resource.dns.add_record',

  /**
   * 更新DNS记录
   * 使用场景：修改现有DNS记录的值、TTL或优先级
   * 参数：{ domainId: string, userId: string, tenantId: string, recordId: string, newValue?: string, newTtl?: number, newPriority?: number }
   */
  UPDATE_DNS_RECORD: 'resource.dns.update_record',

  /**
   * 删除DNS记录
   * 使用场景：删除不再需要的DNS记录
   * 参数：{ domainId: string, userId: string, tenantId: string, recordId: string }
   */
  REMOVE_DNS_RECORD: 'resource.dns.remove_record',

  /**
   * 查找DNS记录
   * 使用场景：获取域名的所有DNS记录或按类型过滤
   * 参数：{ domainId: string, userId: string, tenantId: string, recordType?: string }
   */
  FIND_DNS_RECORDS: 'resource.dns.find_records',

  /**
   * 验证DNS记录
   * 使用场景：验证DNS记录是否正确配置
   * 参数：{ domainId: string, userId: string, tenantId: string, recordIds?: string[] }
   */
  VERIFY_DNS_RECORDS: 'resource.dns.verify_records',

  // ==================== 域名验证消息 ====================

  /**
   * 生成验证挑战
   * 使用场景：为域名验证生成挑战字符串和配置指令
   * 参数：{ domainId: string, userId: string, tenantId: string, verificationMethod: DomainVerificationMethod }
   */
  GENERATE_VERIFICATION_CHALLENGE: 'resource.verification.generate_challenge',

  /**
   * 验证域名
   * 使用场景：执行域名所有权验证
   * 参数：{ domainId: string, userId: string, tenantId: string, verificationMethod: DomainVerificationMethod, challenge: string }
   */
  VERIFY_DOMAIN: 'resource.verification.verify_domain',

  /**
   * 获取验证状态
   * 使用场景：查询域名的验证状态和历史
   * 参数：{ domainId: string, userId: string, tenantId: string }
   */
  GET_VERIFICATION_STATUS: 'resource.verification.get_status',

  // ==================== 管理员操作消息 ====================

  /**
   * 管理员创建域名
   * 使用场景：管理员为任何租户创建域名
   * 参数：{ tenantId: string, adminUserId: string, domainValue: string, description?: string }
   */
  ADMIN_CREATE_DOMAIN: 'resource.admin.domain.create',

  /**
   * 管理员更新域名
   * 使用场景：管理员修改任何租户的域名信息
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, updates: any }
   */
  ADMIN_UPDATE_DOMAIN: 'resource.admin.domain.update',

  /**
   * 管理员删除域名
   * 使用场景：管理员删除任何租户的域名
   * 参数：{ domainId: string, adminUserId: string, tenantId: string }
   */
  ADMIN_DELETE_DOMAIN: 'resource.admin.domain.delete',

  /**
   * 管理员查找所有域名
   * 使用场景：管理员查看所有租户的域名列表
   * 参数：{ adminUserId: string, page: number, pageSize: number, filters?: any }
   */
  ADMIN_FIND_ALL_DOMAINS: 'resource.admin.domain.find_all',

  /**
   * 管理员添加DNS记录
   * 使用场景：管理员为任何域名添加DNS记录
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, recordType: RecordType, recordName: string, recordValue: string, ttl?: number, required?: boolean, priority?: number }
   */
  ADMIN_ADD_DNS_RECORD: 'resource.admin.dns.add_record',

  /**
   * 管理员更新DNS记录
   * 使用场景：管理员修改任何域名的DNS记录
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, recordId: string, updates: any }
   */
  ADMIN_UPDATE_DNS_RECORD: 'resource.admin.dns.update_record',

  /**
   * 管理员删除DNS记录
   * 使用场景：管理员删除任何域名的DNS记录
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, recordId: string }
   */
  ADMIN_REMOVE_DNS_RECORD: 'resource.admin.dns.remove_record',

  /**
   * 管理员验证域名
   * 使用场景：管理员为任何域名执行验证
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, verificationMethod: DomainVerificationMethod, challenge: string }
   */
  ADMIN_VERIFY_DOMAIN: 'resource.admin.verification.verify_domain',

  /**
   * 管理员强制验证域名
   * 使用场景：管理员跳过DNS检查，强制标记域名为已验证
   * 参数：{ domainId: string, adminUserId: string, tenantId: string, reason?: string }
   */
  ADMIN_FORCE_VERIFY_DOMAIN: 'resource.admin.verification.force_verify',

  /**
   * 管理员获取所有统计信息
   * 使用场景：管理员查看系统级别的统计信息
   * 参数：{ adminUserId: string }
   */
  ADMIN_GET_ALL_STATISTICS: 'resource.admin.get_all_statistics',

  /**
   * 管理员获取租户统计信息
   * 使用场景：管理员查看特定租户的详细统计信息
   * 参数：{ tenantId: string, adminUserId: string }
   */
  ADMIN_GET_TENANT_STATISTICS: 'resource.admin.get_tenant_statistics',

  // ==================== 系统管理消息 ====================

  /**
   * 健康检查
   * 使用场景：检查资源服务的健康状态
   * 参数：{}
   */
  HEALTH_CHECK: 'resource.system.health',

  /**
   * 获取系统信息
   * 使用场景：获取服务的详细状态和配置信息
   * 参数：{}
   */
  GET_SYSTEM_INFO: 'resource.system.get_info',

  // ==================== 测试消息 ====================

  /**
   * 测试接口
   * 使用场景：服务连通性测试
   * 参数：{}
   */
  TESTING: 'resource.testing'
}

// ==================== 消息类型定义 ====================

export type ResourceServiceMessage =
  (typeof RESOURCE_SERVICE_MESSAGES)[keyof typeof RESOURCE_SERVICE_MESSAGES]
