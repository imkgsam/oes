import { TerminalDeviceVersionPolicyEntity } from '../../../domain/entities/terminal-device-version-policy.entity'
import { TerminalDeviceType } from '../../../domain/enums/terminal-device.enums'
import { TerminalDeviceVersionPolicyRepository } from '../../../domain/repositories/terminal-device-version-policy.repository'

// InMemoryTerminalDeviceVersionPolicyRepository stores version policies by tenant and terminal device type for tests.
export class InMemoryTerminalDeviceVersionPolicyRepository implements TerminalDeviceVersionPolicyRepository {
  private readonly policies = new Map<string, TerminalDeviceVersionPolicyEntity>()

  // Creates or replaces a version policy for one tenant and terminal device type.
  async upsert(entity: TerminalDeviceVersionPolicyEntity): Promise<TerminalDeviceVersionPolicyEntity> {
    this.policies.set(this.key(entity.tenantId, entity.terminalDeviceType), entity)
    return entity
  }

  // Loads a version policy by tenant and terminal device type.
  async findByTenantAndType(tenantId: string, terminalDeviceType: TerminalDeviceType): Promise<TerminalDeviceVersionPolicyEntity | null> {
    return this.policies.get(this.key(tenantId, terminalDeviceType)) ?? null
  }

  // Builds the in-memory uniqueness key for version policies.
  private key(tenantId: string, terminalDeviceType: TerminalDeviceType): string {
    return `${tenantId}:${terminalDeviceType}`
  }
}
