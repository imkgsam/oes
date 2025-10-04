import { RecordType } from 'prisma/generated/prisma'
import { DomainRecord as PrismaDomainRecord } from 'prisma/generated/prisma'

/**
 * DNS记录实体
 *
 * 职责：
 * 1. 封装DNS记录的业务逻辑
 * 2. 验证记录格式和内容
 * 3. 管理记录状态
 * 4. 提供记录操作的方法
 *
 * 业务规则：
 * - 记录名称和类型组合必须唯一
 * - 某些记录类型有特定的格式要求
 * - TTL值必须在合理范围内
 * - 优先级仅对MX记录有效
 */
export class DomainRecord {
  constructor(
    public readonly id: string,
    public readonly domainId: string,
    public readonly type: RecordType,
    public readonly name: string,
    public value: string,
    private verified: boolean = false,
    public readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    public ttl: number = 600,
    public required: boolean = false,
    public priority?: number
  ) {
    this.validate()
  }

  /**
   * 检查记录是否已验证
   */
  isVerified(): boolean {
    return this.verified
  }

  /**
   * 标记记录为已验证
   */
  markVerified(): void {
    this.verified = true
    this.updatedAt = new Date()
  }

  /**
   * 标记记录为验证失败
   */
  markVerificationFailed(): void {
    this.verified = false
    this.updatedAt = new Date()
  }

  /**
   * 更新记录值
   * @param newValue 新的记录值
   */
  updateValue(newValue: string): void {
    this.validateValue(newValue)
    this.value = newValue
    this.updatedAt = new Date()
  }

  /**
   * 更新TTL值
   * @param newTtl 新的TTL值
   */
  updateTtl(newTtl: number): void {
    this.validateTtl(newTtl)
    this.ttl = newTtl
    this.updatedAt = new Date()
  }

  /**
   * 更新优先级（仅对MX记录有效）
   * @param newPriority 新的优先级
   */
  updatePriority(newPriority: number): void {
    if (this.type !== 'MX') {
      throw new Error('Priority can only be set for MX records')
    }
    this.validatePriority(newPriority)
    this.priority = newPriority
    this.updatedAt = new Date()
  }

  /**
   * 检查记录是否为必需记录
   */
  isRequired(): boolean {
    return this.required
  }

  /**
   * 标记为必需记录
   */
  markAsRequired(): void {
    this.required = true
    this.updatedAt = new Date()
  }

  /**
   * 取消必需记录标记
   */
  unmarkAsRequired(): void {
    this.required = false
    this.updatedAt = new Date()
  }

  /**
   * 获取完整的记录名称（包含域名）
   */
  getFullName(): string {
    if (this.name === '@' || this.name === '') {
      return this.domainId
    }
    return this.name.endsWith('.') ? this.name : `${this.name}.${this.domainId}`
  }

  /**
   * 检查记录是否匹配指定条件
   * @param name 记录名称
   * @param type 记录类型
   * @returns 是否匹配
   */
  matches(name: string, type: string): boolean {
    return this.name === name && this.type === type
  }

  /**
   * 获取记录的标准格式字符串
   */
  getStandardFormat(): string {
    let record = `${this.getFullName()} ${this.ttl} IN ${this.type}`

    if (this.type === 'MX' && this.priority !== undefined) {
      record += ` ${this.priority}`
    }

    record += ` ${this.value}`

    return record
  }

  /**
   * 验证记录内容
   */
  private validate(): void {
    this.validateName()
    this.validateValue(this.value)
    this.validateTtl(this.ttl)

    if (this.type === 'MX' && this.priority !== undefined) {
      this.validatePriority(this.priority)
    }
  }

  /**
   * 验证记录名称
   */
  private validateName(): void {
    if (!this.name || typeof this.name !== 'string') {
      throw new Error('Record name is required')
    }

    // 检查名称长度
    if (this.name.length > 255) {
      throw new Error('Record name too long (max 255 characters)')
    }

    // 检查特殊字符
    if (this.name.includes(' ')) {
      throw new Error('Record name cannot contain spaces')
    }
  }

  /**
   * 验证记录值
   */
  private validateValue(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('Record value is required')
    }

    // 检查值长度
    if (value.length > 1024) {
      throw new Error('Record value too long (max 1024 characters)')
    }

    // 根据记录类型验证格式
    switch (this.type) {
      case 'A':
        this.validateIpv4Address(value)
        break
      case 'AAAA':
        this.validateIpv6Address(value)
        break
      case 'CNAME':
        this.validateDomainName(value)
        break
      case 'MX':
        this.validateMxValue(value)
        break
      case 'TXT':
        this.validateTxtValue(value)
        break
      case 'SRV':
        this.validateSrvValue(value)
        break
      case 'NS':
        this.validateDomainName(value)
        break
    }
  }

  /**
   * 验证TTL值
   */
  private validateTtl(ttl: number): void {
    if (!Number.isInteger(ttl) || ttl < 0) {
      throw new Error('TTL must be a non-negative integer')
    }

    if (ttl > 2147483647) {
      throw new Error('TTL too large (max 2147483647)')
    }

    // 建议的TTL范围
    if (ttl < 60) {
      console.warn('TTL less than 60 seconds is not recommended')
    }
  }

  /**
   * 验证优先级值（MX记录）
   */
  private validatePriority(priority: number): void {
    if (!Number.isInteger(priority) || priority < 0 || priority > 65535) {
      throw new Error('MX priority must be an integer between 0 and 65535')
    }
  }

  /**
   * 验证IPv4地址
   */
  private validateIpv4Address(value: string): void {
    const ipv4Regex =
      /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipv4Regex.test(value)) {
      throw new Error('Invalid IPv4 address format')
    }
  }

  /**
   * 验证IPv6地址
   */
  private validateIpv6Address(value: string): void {
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
    if (!ipv6Regex.test(value)) {
      throw new Error('Invalid IPv6 address format')
    }
  }

  /**
   * 验证域名格式
   */
  private validateDomainName(value: string): void {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(value)) {
      throw new Error('Invalid domain name format')
    }
  }

  /**
   * 验证MX记录值
   */
  private validateMxValue(value: string): void {
    this.validateDomainName(value)
  }

  /**
   * 验证TXT记录值
   */
  private validateTxtValue(value: string): void {
    // TXT记录值通常用引号包围
    if (value.length > 255) {
      throw new Error('TXT record value too long (max 255 characters)')
    }
  }

  /**
   * 验证SRV记录值
   */
  private validateSrvValue(value: string): void {
    const srvRegex = /^\d+\s+\d+\s+\d+\s+.+$/
    if (!srvRegex.test(value)) {
      throw new Error('Invalid SRV record format (priority weight port target)')
    }
  }

  /**
   * 验证CAA记录值
   */
  private validateCaaValue(value: string): void {
    const caaRegex = /^\d+\s+(issue|issuewild|iodef)\s+.+$/
    if (!caaRegex.test(value)) {
      throw new Error('Invalid CAA record format (flags tag value)')
    }
  }

  /**
   * 从Prisma模型创建DomainRecord
   */
  static fromPrisma(prismaDomainRecord: PrismaDomainRecord): DomainRecord {
    return new DomainRecord(
      prismaDomainRecord.id,
      prismaDomainRecord.domainId,
      prismaDomainRecord.type,
      prismaDomainRecord.name,
      prismaDomainRecord.value,
      prismaDomainRecord.verified,
      prismaDomainRecord.createdAt,
      prismaDomainRecord.updatedAt,
      prismaDomainRecord.ttl,
      prismaDomainRecord.required,
      prismaDomainRecord.priority
    )
  }

  /**
   * 创建新的DNS记录
   */
  static create(
    id: string,
    domainId: string,
    type: RecordType,
    name: string,
    value: string,
    ttl: number = 600,
    required: boolean = false,
    priority?: number
  ): DomainRecord {
    return new DomainRecord(
      id,
      domainId,
      type,
      name,
      value,
      false, // 新记录默认未验证
      new Date(),
      new Date(),
      ttl,
      required,
      priority
    )
  }
}
