import { PlatformMfaPolicyEntity } from '../entities/platform-mfa-policy.entity'

export interface PlatformMfaPolicyRepository {
  getPlatformPolicy(): Promise<PlatformMfaPolicyEntity>
  savePlatformPolicy(policy: PlatformMfaPolicyEntity): Promise<PlatformMfaPolicyEntity>
}
