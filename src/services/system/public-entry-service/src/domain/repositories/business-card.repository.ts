import { BusinessCardAuditEventRecord, BusinessCardRecord } from '../types/business-card.types'

export type BusinessCardListInput = {
  tenantId: string
  employeeIds?: string[]
  page?: number
  pageSize?: number
}

// BusinessCardRepository persists BusinessCard configuration and audit facts without storing upstream display truth.
export interface BusinessCardRepository {
  findPrimaryByEmployee(tenantId: string, employeeId: string): Promise<BusinessCardRecord | null>
  findById(businessCardId: string): Promise<BusinessCardRecord | null>
  getById(tenantId: string, businessCardId: string): Promise<BusinessCardRecord | null>
  create(record: BusinessCardRecord): Promise<BusinessCardRecord>
  update(record: BusinessCardRecord): Promise<BusinessCardRecord>
  list(input: BusinessCardListInput): Promise<{ items: BusinessCardRecord[]; total: number }>
  recordAudit(record: BusinessCardAuditEventRecord): Promise<void>
}
