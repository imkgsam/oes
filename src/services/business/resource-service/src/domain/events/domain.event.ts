/**
 * Domain事件基类
 * 用途：
 * 1. 封装domain层发生的重要业务事件
 * 2. 支持事件驱动架构
 * 3. 提供事件溯源能力
 * 4. 解耦业务逻辑和外部系统
 * 事件类型：
 * - DomainCreated: 域名创建
 * - DomainVerified: 域名验证成功
 * - DomainVerificationFailed: 域名验证失败
 * - DomainRecordAdded: DNS记录添加
 * - DomainRecordRemoved: DNS记录删除
 * - DomainRecordUpdated: DNS记录更新
 * - DomainDescriptionUpdated: 域名描述更新
 */
export class DomainEvent {
  public readonly id: string
  public readonly occurredAt: Date
  public readonly version: number

  constructor(
    public readonly eventType: string,
    public readonly payload: Record<string, any>,
    id?: string,
    occurredAt?: Date,
    version: number = 1
  ) {
    this.id = id || this.generateId()
    this.occurredAt = occurredAt || new Date()
    this.version = version
  }

  /**
   * 生成事件ID
   */
  private generateId(): string {
    return `${this.eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取事件数据
   */
  getData(): Record<string, any> {
    return {
      id: this.id,
      eventType: this.eventType,
      payload: this.payload,
      occurredAt: this.occurredAt,
      version: this.version
    }
  }

  /**
   * 序列化为JSON
   */
  toJSON(): string {
    return JSON.stringify(this.getData())
  }

  /**
   * 从JSON反序列化
   */
  static fromJSON(json: string): DomainEvent {
    const data = JSON.parse(json) as {
      eventType: string
      payload: Record<string, any>
      id: string
      occurredAt: string
      version: number
    }
    return new DomainEvent(
      data.eventType,
      data.payload,
      data.id,
      new Date(data.occurredAt),
      data.version
    )
  }

  /**
   * 创建域名创建事件
   */
  static domainCreated(
    domainId: string,
    tenantId: string,
    domainValue: string,
    description?: string
  ): DomainEvent {
    return new DomainEvent('DomainCreated', {
      domainId,
      tenantId,
      domainValue,
      description,
      createdAt: new Date()
    })
  }

  /**
   * 创建域名验证成功事件
   */
  static domainVerified(domainId: string, tenantId: string, domainValue: string): DomainEvent {
    return new DomainEvent('DomainVerified', {
      domainId,
      tenantId,
      domainValue,
      verifiedAt: new Date()
    })
  }

  /**
   * 创建域名验证失败事件
   */
  static domainVerificationFailed(
    domainId: string,
    tenantId: string,
    domainValue: string,
    reason?: string
  ): DomainEvent {
    return new DomainEvent('DomainVerificationFailed', {
      domainId,
      tenantId,
      domainValue,
      reason,
      failedAt: new Date()
    })
  }

  /**
   * 创建DNS记录添加事件
   */
  static domainRecordAdded(
    domainId: string,
    recordId: string,
    recordType: string,
    recordName: string
  ): DomainEvent {
    return new DomainEvent('DomainRecordAdded', {
      domainId,
      recordId,
      recordType,
      recordName,
      addedAt: new Date()
    })
  }

  /**
   * 创建DNS记录删除事件
   */
  static domainRecordRemoved(
    domainId: string,
    recordId: string,
    recordType: string,
    recordName: string
  ): DomainEvent {
    return new DomainEvent('DomainRecordRemoved', {
      domainId,
      recordId,
      recordType,
      recordName,
      removedAt: new Date()
    })
  }

  /**
   * 创建DNS记录更新事件
   */
  static domainRecordUpdated(
    domainId: string,
    recordId: string,
    recordType: string,
    recordName: string,
    changes: Record<string, any>
  ): DomainEvent {
    return new DomainEvent('DomainRecordUpdated', {
      domainId,
      recordId,
      recordType,
      recordName,
      changes,
      updatedAt: new Date()
    })
  }

  /**
   * 创建域名描述更新事件
   */
  static domainDescriptionUpdated(
    domainId: string,
    tenantId: string,
    oldDescription: string,
    newDescription: string
  ): DomainEvent {
    return new DomainEvent('DomainDescriptionUpdated', {
      domainId,
      tenantId,
      oldDescription,
      newDescription,
      updatedAt: new Date()
    })
  }

  /**
   * 创建域名删除事件
   */
  static domainDeleted(domainId: string, tenantId: string, domainValue: string): DomainEvent {
    return new DomainEvent('DomainDeleted', {
      domainId,
      tenantId,
      domainValue,
      deletedAt: new Date()
    })
  }
}
