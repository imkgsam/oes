import { ServiceAccountEntity } from '../entities/service-account.entity'

export interface ServiceAccountRepository {
  findById(serviceAccountId: string): Promise<ServiceAccountEntity | null>
  list(input?: {
    tenantId?: string
    scopeLevel?: string
    type?: string
    status?: string
  }): Promise<ServiceAccountEntity[]>
  create(input: {
    tenantId?: string
    scopeLevel: string
    type: string
    name: string
    description?: string
    createdBy?: string
  }): Promise<ServiceAccountEntity>
  setStatus(input: {
    serviceAccountId: string
    status: string
    operatorId?: string
  }): Promise<ServiceAccountEntity>
}
