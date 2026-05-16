import { Injectable } from '@nestjs/common'
import { normalizeTerminalAccessList } from '../../../domain/constants/terminal-access-terminal'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import {
  AccountTerminalAccessOverrideFact,
  RoleTerminalAccessFact
} from '../../../domain/services/terminal-access-resolver.service'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaTerminalAccessRepository persists role terminal defaults and account override facts for permission-service. */
@Injectable()
export class PrismaTerminalAccessRepository implements TerminalAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoleTerminalAccess(roleIds: readonly string[]): Promise<RoleTerminalAccessFact[]> {
    if (roleIds.length === 0) return []

    const records = await this.prisma.roleTerminalAccess.findMany({
      where: { roleId: { in: [...roleIds] } },
      orderBy: { roleId: 'asc' }
    })

    return records.map((record) => ({
      roleId: record.roleId,
      allowedTerminals: normalizeTerminalAccessList(record.allowedTerminals)
    }))
  }

  async findAccountOverride(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel
  ): Promise<AccountTerminalAccessOverrideFact | null> {
    const record = await this.prisma.accountTerminalAccessOverride.findFirst({
      where: this.buildAccountOverrideWhere(accountId, tenantId, scopeLevel),
      orderBy: { updatedAt: 'desc' }
    })

    return record
      ? {
          accountId: record.accountId,
          allowedTerminals: normalizeTerminalAccessList(record.allowedTerminals)
        }
      : null
  }

  async replaceRoleTerminalAccess(roleId: string, allowedTerminals: readonly string[]): Promise<void> {
    const normalizedAllowedTerminals = normalizeTerminalAccessList(allowedTerminals)

    await this.prisma.roleTerminalAccess.upsert({
      where: { roleId },
      update: { allowedTerminals: normalizedAllowedTerminals },
      create: { roleId, allowedTerminals: normalizedAllowedTerminals }
    })
  }

  async replaceAccountOverride(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel,
    allowedTerminals: readonly string[]
  ): Promise<void> {
    const where = this.buildAccountOverrideWhere(accountId, tenantId, scopeLevel)
    const normalizedAllowedTerminals = normalizeTerminalAccessList(allowedTerminals)

    await this.prisma.$transaction(async (tx) => {
      await tx.accountTerminalAccessOverride.deleteMany({ where })
      await tx.accountTerminalAccessOverride.create({
        data: {
          accountId,
          scopeLevel,
          tenantId,
          allowedTerminals: normalizedAllowedTerminals
        }
      })
    })
  }

  async deleteAccountOverride(
    accountId: string,
    tenantId: string | null,
    scopeLevel: ScopeLevel
  ): Promise<void> {
    await this.prisma.accountTerminalAccessOverride.deleteMany({
      where: this.buildAccountOverrideWhere(accountId, tenantId, scopeLevel)
    })
  }

  private buildAccountOverrideWhere(accountId: string, tenantId: string | null, scopeLevel: ScopeLevel) {
    return {
      accountId,
      scopeLevel,
      tenantId: scopeLevel === ScopeLevel.SYSTEM ? null : tenantId
    }
  }
}
