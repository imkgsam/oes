import { Injectable } from '@nestjs/common'
import { TerminalLoginFlow } from '@oes/common/auth'
import { TerminalLoginPolicyEntity } from '../../../domain/entities/terminal-login-policy.entity'
import { TerminalLoginPolicyRepository } from '../../../domain/repositories/terminal-login-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'

// Persists platform terminal login flow allowlists without applying effective-policy defaults.
@Injectable()
export class PrismaTerminalLoginPolicyRepository implements TerminalLoginPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Loads one persisted terminal login policy row or null when no row exists yet.
  async findByTerminal(terminal: string): Promise<TerminalLoginPolicyEntity | null> {
    const normalizedTerminal = this.normalizeTerminal(terminal)
    const record = await this.prisma.terminalLoginPolicy.findUnique({
      where: { terminal: normalizedTerminal }
    })

    if (!record) {
      return null
    }

    return this.toEntity(record)
  }

  // Persists one terminal login policy row using a JSON array for enabled login flows.
  async save(
    policy: TerminalLoginPolicyEntity,
    updatedBy?: string
  ): Promise<TerminalLoginPolicyEntity> {
    const snapshot = policy.toSnapshot()
    const record = await this.prisma.terminalLoginPolicy.upsert({
      where: { terminal: snapshot.terminal },
      update: {
        enabledLoginFlows: snapshot.enabledLoginFlows,
        updatedBy: updatedBy ?? null
      },
      create: {
        terminal: snapshot.terminal,
        enabledLoginFlows: snapshot.enabledLoginFlows,
        updatedBy: updatedBy ?? null
      }
    })

    return this.toEntity(record)
  }

  // Hydrates a terminal login policy from Prisma while defensively coercing JSON array values.
  private toEntity(record: { terminal: string; enabledLoginFlows: unknown }): TerminalLoginPolicyEntity {
    const flows = Array.isArray(record.enabledLoginFlows)
      ? record.enabledLoginFlows.map(String)
      : []
    return new TerminalLoginPolicyEntity(record.terminal, flows as TerminalLoginFlow[])
  }

  // Normalizes terminal identifiers to the stored uppercase policy key.
  private normalizeTerminal(terminal: string): string {
    return terminal.trim().toUpperCase()
  }
}
