import { TerminalDeviceVersionPolicyEntity } from '../entities/terminal-device-version-policy.entity'
import { TerminalDeviceType } from '../enums/terminal-device.enums'

// TerminalDeviceVersionPolicyRepository defines persistence operations for tenant and terminal-type version policies.
export interface TerminalDeviceVersionPolicyRepository {
  upsert(entity: TerminalDeviceVersionPolicyEntity): Promise<TerminalDeviceVersionPolicyEntity>
  findByTenantAndType(tenantId: string, terminalDeviceType: TerminalDeviceType): Promise<TerminalDeviceVersionPolicyEntity | null>
}
