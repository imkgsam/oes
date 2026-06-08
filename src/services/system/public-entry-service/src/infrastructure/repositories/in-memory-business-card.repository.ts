import {
  BusinessCardAuditEventRecord,
  BusinessCardRecord
} from '../../domain/types/business-card.types'
import {
  BusinessCardListInput,
  BusinessCardRepository
} from '../../domain/repositories/business-card.repository'

// InMemoryBusinessCardRepository supports focused application tests without database coupling.
export class InMemoryBusinessCardRepository implements BusinessCardRepository {
  readonly businessCards: BusinessCardRecord[] = []
  readonly auditEvents: BusinessCardAuditEventRecord[] = []

  findPrimaryByEmployee(tenantId: string, employeeId: string): Promise<BusinessCardRecord | null> {
    return Promise.resolve(
      this.businessCards.find(
        (card) =>
          card.tenantId === tenantId && card.employeeId === employeeId && card.status !== 'ARCHIVED'
      ) ?? null
    )
  }

  getById(tenantId: string, businessCardId: string): Promise<BusinessCardRecord | null> {
    return Promise.resolve(
      this.businessCards.find((card) => card.tenantId === tenantId && card.id === businessCardId) ??
        null
    )
  }

  findById(businessCardId: string): Promise<BusinessCardRecord | null> {
    return Promise.resolve(
      this.businessCards.find((card) => card.id === businessCardId) ?? null
    )
  }

  create(record: BusinessCardRecord): Promise<BusinessCardRecord> {
    if (
      this.businessCards.some(
        (card) =>
          card.tenantId === record.tenantId &&
          card.employeeId === record.employeeId &&
          card.status !== 'ARCHIVED'
      )
    ) {
      return Promise.reject(new Error('Primary BusinessCard already exists for employee'))
    }
    this.businessCards.push(cloneCard(record))
    return Promise.resolve(cloneCard(record))
  }

  update(record: BusinessCardRecord): Promise<BusinessCardRecord> {
    const index = this.businessCards.findIndex(
      (card) => card.tenantId === record.tenantId && card.id === record.id
    )
    if (index < 0) return Promise.reject(new Error('BusinessCard not found'))
    this.businessCards[index] = cloneCard(record)
    return Promise.resolve(cloneCard(record))
  }

  list(input: BusinessCardListInput): Promise<{ items: BusinessCardRecord[]; total: number }> {
    const employeeFilter = new Set(input.employeeIds ?? [])
    const matches = this.businessCards.filter((card) => {
      if (card.tenantId !== input.tenantId) return false
      if (employeeFilter.size > 0 && !employeeFilter.has(card.employeeId)) return false
      return true
    })
    const page = input.page ?? 1
    const pageSize = input.pageSize ?? 20
    return Promise.resolve({
      items: matches.slice((page - 1) * pageSize, page * pageSize).map(cloneCard),
      total: matches.length
    })
  }

  recordAudit(record: BusinessCardAuditEventRecord): Promise<void> {
    this.auditEvents.push({ ...record })
    return Promise.resolve()
  }
}

// cloneCard returns detached card records so tests cannot mutate repository state accidentally.
function cloneCard(record: BusinessCardRecord): BusinessCardRecord {
  return {
    ...record,
    publicEntryRef: record.publicEntryRef ? { ...record.publicEntryRef } : null,
    contactActionConfigs: record.contactActionConfigs.map((config) => ({ ...config })),
    visibilityConfig: { ...record.visibilityConfig }
  }
}
