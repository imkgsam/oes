import { TenantMfaPolicyEntity } from '../entities/tenant-mfa-policy.entity'

export interface TenantMfaPolicyRepository {
  getTenantPolicy(tenantId: string): Promise<TenantMfaPolicyEntity>
  saveTenantPolicy(policy: TenantMfaPolicyEntity): Promise<TenantMfaPolicyEntity>
}
