import { Injectable } from '@nestjs/common'
import {
  MfaBindingType,
  TerminalMfaPolicyEntity
} from '../../../domain/entities/terminal-mfa-policy.entity'
import { TerminalMfaPolicyRepository } from '../../../domain/repositories/terminal-mfa-policy.repository'
import { PrismaService } from '../../prisma/prisma.service'

// Persists terminal MFA platform defaults and tenant overrides without applying effective-policy defaults.
@Injectable()
export class PrismaTerminalMfaPolicyRepository implements TerminalMfaPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Loads one persisted platform terminal MFA default row or null when no row exists yet.
  async findPlatformDefaultByTerminal(terminal: string): Promise<TerminalMfaPolicyEntity | null> {
    const normalizedTerminal = this.normalizeTerminal(terminal)
    const record = await this.prisma.platformTerminalMfaPolicy.findUnique({
      where: { terminal: normalizedTerminal }
    })

    if (!record) {
      return null
    }

    return this.toEntity(record)
  }

  // Persists one platform terminal MFA default row using JSON arrays for factor policy fields.
  async savePlatformDefault(
    policy: TerminalMfaPolicyEntity,
    updatedBy?: string
  ): Promise<TerminalMfaPolicyEntity> {
    const snapshot = policy.toSnapshot()
    const record = await this.prisma.platformTerminalMfaPolicy.upsert({
      where: { terminal: snapshot.terminal },
      update: {
        loginMfaRequired: snapshot.loginMfaRequired,
        newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
        allowedFactors: snapshot.allowedFactors,
        factorPriority: snapshot.factorPriority,
        updatedBy: updatedBy ?? null
      },
      create: {
        terminal: snapshot.terminal,
        loginMfaRequired: snapshot.loginMfaRequired,
        newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
        allowedFactors: snapshot.allowedFactors,
        factorPriority: snapshot.factorPriority,
        updatedBy: updatedBy ?? null
      }
    })

    return this.toEntity(record)
  }

  // Loads a tenant-owned terminal MFA override without falling back to platform policy.
  async findTenantOverride(
    tenantId: string,
    terminal: string
  ): Promise<TerminalMfaPolicyEntity | null> {
    const normalizedTerminal = this.normalizeTerminal(terminal)
    const record = await this.prisma.tenantTerminalMfaPolicy.findUnique({
      where: {
        tenantId_terminal: {
          tenantId,
          terminal: normalizedTerminal
        }
      }
    })

    if (!record) {
      return null
    }

    return this.toEntity(record)
  }

  // Persists one tenant-owned terminal MFA override row using JSON arrays for factor policy fields.
  async saveTenantOverride(
    policy: TerminalMfaPolicyEntity,
    updatedBy?: string
  ): Promise<TerminalMfaPolicyEntity> {
    if (!policy.tenantId) {
      throw new Error('Tenant terminal MFA override requires tenantId')
    }

    const snapshot = policy.toSnapshot()
    const record = await this.prisma.tenantTerminalMfaPolicy.upsert({
      where: {
        tenantId_terminal: {
          tenantId: policy.tenantId,
          terminal: snapshot.terminal
        }
      },
      update: {
        loginMfaRequired: snapshot.loginMfaRequired,
        newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
        allowedFactors: snapshot.allowedFactors,
        factorPriority: snapshot.factorPriority,
        updatedBy: updatedBy ?? null
      },
      create: {
        tenantId: policy.tenantId,
        terminal: snapshot.terminal,
        loginMfaRequired: snapshot.loginMfaRequired,
        newDeviceMfaRequired: snapshot.newDeviceMfaRequired,
        allowedFactors: snapshot.allowedFactors,
        factorPriority: snapshot.factorPriority,
        updatedBy: updatedBy ?? null
      }
    })

    return this.toEntity(record)
  }

  // Hydrates a terminal MFA policy from Prisma while defensively coercing JSON array values.
  private toEntity(record: {
    tenantId?: null | string
    terminal: string
    loginMfaRequired: boolean
    newDeviceMfaRequired: boolean
    allowedFactors: unknown
    factorPriority: unknown
  }): TerminalMfaPolicyEntity {
    const allowedFactors = Array.isArray(record.allowedFactors)
      ? record.allowedFactors.map(String)
      : []
    const factorPriority = Array.isArray(record.factorPriority)
      ? record.factorPriority.map(String)
      : []
    return new TerminalMfaPolicyEntity({
      tenantId: record.tenantId ?? undefined,
      terminal: record.terminal,
      loginMfaRequired: Boolean(record.loginMfaRequired),
      newDeviceMfaRequired: Boolean(record.newDeviceMfaRequired),
      allowedFactors: allowedFactors as MfaBindingType[],
      factorPriority: factorPriority as MfaBindingType[]
    })
  }

  // Normalizes terminal identifiers to the stored uppercase policy key.
  private normalizeTerminal(terminal: string): string {
    return terminal.trim().toUpperCase()
  }
}
