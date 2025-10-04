import { Domain } from '../aggregates/domain.aggregate'
import { DomainRecord } from '../entities/domain-record.entity'

/**
 * 域名仓储接口
 *
 * 职责：
 * 1. 提供域名的持久化操作
 * 2. 封装数据访问逻辑
 * 3. 支持复杂查询
 * 4. 维护数据一致性
 *
 * 设计原则：
 * - 面向聚合根设计
 * - 提供业务友好的查询方法
 * - 隐藏底层存储细节
 */
export interface IDomainRepository {
  // ==================== 查询方法 ====================

  /**
   * 根据ID查找域名
   * @param id 域名ID
   * @returns 域名聚合根或null
   */
  findById(id: string): Promise<Domain | null>

  /**
   * 根据域名值查找域名
   * @param domainValue 域名值
   * @returns 域名聚合根或null
   */
  findByValue(domainValue: string): Promise<Domain | null>

  /**
   * 根据租户ID查找所有域名
   * @param tenantId 租户ID
   * @returns 域名列表
   */
  findByTenantId(tenantId: string): Promise<Domain[]>

  /**
   * 分页查询域名
   * @param tenantId 租户ID
   * @param page 页码
   * @param pageSize 每页大小
   * @param filters 过滤条件
   * @returns 分页结果
   */
  findPaginated(
    tenantId: string,
    page: number,
    pageSize: number,
    filters?: DomainQueryFilters
  ): Promise<DomainPaginationResult>

  /**
   * 检查域名是否存在
   * @param domainValue 域名值
   * @returns 是否存在
   */
  exists(domainValue: string): Promise<boolean>

  // ==================== 保存方法 ====================

  /**
   * 保存域名聚合根（创建或更新）
   * @param domain 域名聚合根
   * @returns 保存后的域名
   */
  save(domain: Domain): Promise<Domain>

  // ==================== 删除方法 ====================

  /**
   * 删除域名
   * @param id 域名ID
   * @returns 是否删除成功
   */
  delete(id: string): Promise<boolean>

  // ==================== 统计方法 ====================

  /**
   * 统计域名数量
   * @param tenantId 租户ID
   * @param filters 过滤条件
   * @returns 域名数量
   */
  count(tenantId: string, filters?: DomainQueryFilters): Promise<number>
}

/**
 * 域名查询过滤器
 */
export interface DomainQueryFilters {
  verified?: boolean
  searchTerm?: string
  createdAfter?: Date
  createdBefore?: Date
  hasRecords?: boolean
  recordType?: string
}

/**
 * 域名分页结果
 */
export interface DomainPaginationResult {
  domains: Domain[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * 域名记录仓储接口
 *
 * 职责：
 * 1. 管理DNS记录的持久化
 * 2. 支持记录的CRUD操作
 * 3. 提供记录查询功能
 *
 * 注意：虽然违反DDD原则，但保留此接口是为了实用性
 * 主要用于查询和批量操作，修改操作仍应通过Domain聚合根进行
 */
export interface IDomainRecordRepository {
  // ==================== 查询方法 ====================

  /**
   * 根据ID查找DNS记录
   * @param id 记录ID
   * @returns DNS记录或null
   */
  findById(id: string): Promise<DomainRecord | null>

  /**
   * 根据域名ID查找所有DNS记录
   * @param domainId 域名ID
   * @returns DNS记录列表
   */
  findByDomainId(domainId: string): Promise<DomainRecord[]>

  /**
   * 根据域名ID和记录类型查找DNS记录
   * @param domainId 域名ID
   * @param recordType 记录类型
   * @returns DNS记录列表
   */
  findByDomainIdAndType(domainId: string, recordType: string): Promise<DomainRecord[]>

  /**
   * 检查DNS记录是否存在
   * @param domainId 域名ID
   * @param recordName 记录名称
   * @param recordType 记录类型
   * @returns 是否存在
   */
  exists(domainId: string, recordName: string, recordType: string): Promise<boolean>

  // ==================== 保存方法 ====================

  /**
   * 保存DNS记录
   * @param record DNS记录
   * @returns 保存后的记录
   */
  save(record: DomainRecord): Promise<DomainRecord>

  // ==================== 删除方法 ====================

  /**
   * 删除DNS记录
   * @param id 记录ID
   * @returns 是否删除成功
   */
  delete(id: string): Promise<boolean>

  /**
   * 根据域名ID删除所有DNS记录
   * @param domainId 域名ID
   * @returns 删除的记录数量
   */
  deleteByDomainId(domainId: string): Promise<number>

  // ==================== 批量操作方法 ====================

  /**
   * 批量更新DNS记录验证状态
   * @param ids 记录ID列表
   * @param verified 验证状态
   * @returns 更新成功的数量
   */
  updateVerificationStatusBatch(ids: string[], verified: boolean): Promise<number>

  // ==================== 统计方法 ====================

  /**
   * 统计DNS记录数量
   * @param domainId 域名ID
   * @param recordType 记录类型（可选）
   * @returns 记录数量
   */
  count(domainId: string, recordType?: string): Promise<number>
}
