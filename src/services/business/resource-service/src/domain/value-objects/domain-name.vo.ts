/**
 * 域名值对象
 *
 * 用途：
 * 1. 封装域名的业务规则和验证逻辑
 * 2. 确保域名的格式正确性
 * 3. 提供域名的标准化处理
 *
 * 业务规则：
 * - 域名必须符合RFC标准
 * - 域名长度限制
 * - 域名字符限制
 * - 子域名层级限制
 */
export class DomainNameVO {
  private readonly value: string

  constructor(domainName: string) {
    this.validate(domainName)
    this.value = this.normalize(domainName)
  }

  /**
   * 获取域名值
   */
  getValue(): string {
    return this.value
  }

  /**
   * 获取域名的主域名部分（去掉子域名）
   * 例如：api.example.com -> example.com
   */
  getMainDomain(): string {
    const parts = this.value.split('.')
    if (parts.length < 2) {
      return this.value
    }
    return parts.slice(-2).join('.')
  }

  /**
   * 获取域名的顶级域名
   * 例如：api.example.com -> com
   */
  getTopLevelDomain(): string {
    const parts = this.value.split('.')
    return parts[parts.length - 1] || ''
  }

  /**
   * 检查是否为子域名
   */
  isSubdomain(): boolean {
    return this.value.split('.').length > 2
  }

  /**
   * 获取子域名部分
   * 例如：api.example.com -> api
   */
  getSubdomain(): string | null {
    if (!this.isSubdomain()) {
      return null
    }
    const parts = this.value.split('.')
    return parts.slice(0, -2).join('.')
  }

  /**
   * 检查是否为通配符域名
   */
  isWildcard(): boolean {
    return this.value.startsWith('*.')
  }

  /**
   * 获取通配符域名的基础域名
   * 例如：*.example.com -> example.com
   */
  getWildcardBase(): string | null {
    if (!this.isWildcard()) {
      return null
    }
    return this.value.substring(2)
  }

  /**
   * 检查域名是否匹配（支持通配符）
   */
  matches(other: DomainNameVO): boolean {
    if (this.value === other.value) {
      return true
    }

    // 检查通配符匹配
    if (this.isWildcard()) {
      const base = this.getWildcardBase()
      return other.value.endsWith(base || '')
    }

    if (other.isWildcard()) {
      const base = other.getWildcardBase()
      return this.value.endsWith(base || '')
    }

    return false
  }

  /**
   * 验证域名格式
   */
  private validate(domainName: string): void {
    if (!domainName || typeof domainName !== 'string') {
      throw new Error('Domain name is required')
    }

    // 长度检查
    if (domainName.length > 253) {
      throw new Error('Domain name too long (max 253 characters)')
    }

    if (domainName.length < 1) {
      throw new Error('Domain name too short')
    }

    // 基本格式检查
    const domainRegex =
      /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
    if (!domainRegex.test(domainName)) {
      throw new Error('Invalid domain name format')
    }

    // 检查标签长度
    const labels = domainName.split('.')
    for (const label of labels) {
      if (label.length > 63) {
        throw new Error(`Domain label too long: ${label}`)
      }
      if (label.length === 0) {
        throw new Error('Empty domain label not allowed')
      }
    }

    // 检查层级深度
    if (labels.length > 127) {
      throw new Error('Too many domain levels')
    }

    // 检查特殊字符
    if (domainName.includes('..')) {
      throw new Error('Consecutive dots not allowed')
    }

    if (domainName.startsWith('.') || domainName.endsWith('.')) {
      throw new Error('Domain name cannot start or end with dot')
    }
  }

  /**
   * 标准化域名
   */
  private normalize(domainName: string): string {
    return domainName.toLowerCase().trim()
  }

  /**
   * 比较两个域名是否相等
   */
  equals(other: DomainNameVO): boolean {
    return this.value === other.value
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return this.value
  }

  /**
   * 从字符串创建域名对象
   */
  static fromString(domainName: string): DomainNameVO {
    return new DomainNameVO(domainName)
  }

  /**
   * 创建通配符域名
   */
  static createWildcard(baseDomain: string): DomainNameVO {
    return new DomainNameVO(`*.${baseDomain}`)
  }

  /**
   * 检查域名是否为有效的顶级域名
   */
  static isValidTLD(tld: string): boolean {
    // 这里可以集成真实的TLD列表
    const commonTLDs = [
      'com',
      'org',
      'net',
      'edu',
      'gov',
      'mil',
      'int',
      'cn',
      'uk',
      'de',
      'fr',
      'jp',
      'au',
      'ca',
      'us',
      'io',
      'co',
      'me',
      'info',
      'biz',
      'name',
      'pro'
    ]
    return commonTLDs.includes(tld.toLowerCase())
  }
}
