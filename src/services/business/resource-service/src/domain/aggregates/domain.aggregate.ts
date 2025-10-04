import { DomainRecord } from '../entities/domain-record.entity'
import { DomainEvent } from '../events/domain.event'
import { DomainVerificationStatus } from '../value-objects/domain-verification-status.vo'
import { Domain as PrismaDomain, DomainRecord as PrismaDomainRecord } from 'prisma/generated/prisma'

/**
 * Domain聚合根 - 域名管理核心实体
 *
 * 职责：
 * 1. 管理域名的生命周期（创建、验证、更新、删除）
 * 2. 维护域名记录的完整性约束
 * 3. 处理域名验证状态变更
 * 4. 发布domain事件
 *
 * 业务规则：
 * - 域名必须属于特定租户
 * - 域名验证通过后才能添加某些类型的记录
 */
export class Domain {
  private records: DomainRecord[] = []
  private domainEvents: DomainEvent[] = []

  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly value: string,
    private verificationStatus: DomainVerificationStatus = DomainVerificationStatus.PENDING,
    public description?: string,
    public readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    records?: DomainRecord[]
  ) {
    if (records) {
      this.records = records
    }
  }

  /**
   * 获取域名验证状态
   */
  getVerificationStatus(): DomainVerificationStatus {
    return this.verificationStatus
  }

  /**
   * 检查域名是否已验证
   */
  isVerified(): boolean {
    return this.verificationStatus === DomainVerificationStatus.VERIFIED
  }

  /**
   * 标记域名为已验证状态
   */
  markAsVerified(): void {
    if (this.verificationStatus === DomainVerificationStatus.VERIFIED) {
      return
    }

    this.verificationStatus = DomainVerificationStatus.VERIFIED
    this.updatedAt = new Date()

    this.addDomainEvent(
      new DomainEvent('DomainVerified', {
        domainId: this.id,
        tenantId: this.tenantId,
        domainValue: this.value,
        verifiedAt: new Date()
      })
    )
  }

  /**
   * 标记域名验证失败
   */
  markVerificationFailed(): void {
    this.verificationStatus = DomainVerificationStatus.FAILED
    this.updatedAt = new Date()

    this.addDomainEvent(
      new DomainEvent('DomainVerificationFailed', {
        domainId: this.id,
        tenantId: this.tenantId,
        domainValue: this.value,
        failedAt: new Date()
      })
    )
  }

  /**
   * 添加DNS记录
   */
  addRecord(record: DomainRecord): void {
    // 检查记录是否已存在
    const existingRecord = this.records.find(
      (r) => r.name === record.name && r.type === record.type
    )

    if (existingRecord) {
      throw new Error(`Record ${record.type} ${record.name} already exists`)
    }

    this.records.push(record)
    this.updatedAt = new Date()

    this.addDomainEvent(
      new DomainEvent('DomainRecordAdded', {
        domainId: this.id,
        recordId: record.id,
        recordType: record.type,
        recordName: record.name
      })
    )
  }

  /**
   * 移除DNS记录
   */
  removeRecord(recordId: string): void {
    const recordIndex = this.records.findIndex((r) => r.id === recordId)
    if (recordIndex === -1) {
      throw new Error('Record not found')
    }

    const record = this.records[recordIndex]

    // 检查是否为必需记录
    if (record.required) {
      throw new Error('Cannot remove required record')
    }

    this.records.splice(recordIndex, 1)
    this.updatedAt = new Date()

    this.addDomainEvent(
      new DomainEvent('DomainRecordRemoved', {
        domainId: this.id,
        recordId: record.id,
        recordType: record.type,
        recordName: record.name
      })
    )
  }

  /**
   * 获取所有DNS记录
   */
  getRecords(): readonly DomainRecord[] {
    return [...this.records]
  }

  /**
   * 根据类型获取DNS记录
   */
  getRecordsByType(type: string): DomainRecord[] {
    return this.records.filter((r) => r.type === type)
  }

  /**
   * 更新域名描述
   */
  updateDescription(description: string): void {
    this.description = description
    this.updatedAt = new Date()

    this.addDomainEvent(
      new DomainEvent('DomainDescriptionUpdated', {
        domainId: this.id,
        tenantId: this.tenantId,
        newDescription: description
      })
    )
  }

  /**
   * 添加domain事件
   */
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event)
  }

  /**
   * 获取并清空domain事件
   */
  getDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents = []
    return events
  }

  /**
   * 从Prisma模型创建Domain聚合
   */
  static fromPrisma(prismaDomain: PrismaDomain & { records?: PrismaDomainRecord[] }): Domain {
    const domain = new Domain(
      prismaDomain.id,
      prismaDomain.tenantId,
      prismaDomain.value,
      prismaDomain.isVerified
        ? DomainVerificationStatus.VERIFIED
        : DomainVerificationStatus.PENDING,
      prismaDomain.description,
      prismaDomain.createdAt,
      prismaDomain.updatedAt
    )

    if (prismaDomain.records) {
      domain.records = prismaDomain.records.map((record) => DomainRecord.fromPrisma(record))
    }

    return domain
  }
}
