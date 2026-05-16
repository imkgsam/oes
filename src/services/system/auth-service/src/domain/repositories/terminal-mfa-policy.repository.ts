import { TerminalMfaPolicyEntity } from '../entities/terminal-mfa-policy.entity'

// Provides persistence access for platform default and tenant override terminal MFA policies.
export interface TerminalMfaPolicyRepository {
  findPlatformDefaultByTerminal(terminal: string): Promise<TerminalMfaPolicyEntity | null>
  savePlatformDefault(policy: TerminalMfaPolicyEntity, updatedBy?: string): Promise<TerminalMfaPolicyEntity>
  findTenantOverride(tenantId: string, terminal: string): Promise<TerminalMfaPolicyEntity | null>
  saveTenantOverride(policy: TerminalMfaPolicyEntity, updatedBy?: string): Promise<TerminalMfaPolicyEntity>
}
