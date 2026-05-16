import { TerminalLoginPolicyEntity } from '../entities/terminal-login-policy.entity'

// Provides persistence access for platform-owned terminal entry login policies.
export interface TerminalLoginPolicyRepository {
  findByTerminal(terminal: string): Promise<TerminalLoginPolicyEntity | null>
  save(policy: TerminalLoginPolicyEntity, updatedBy?: string): Promise<TerminalLoginPolicyEntity>
}
