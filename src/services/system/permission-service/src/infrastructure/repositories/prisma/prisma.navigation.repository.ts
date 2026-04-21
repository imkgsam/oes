import { Injectable } from '@nestjs/common'
import { NavigationEntry } from '../../../domain/aggregates/navigation-entry.aggregate'
import { normalizeNavigationTerminalCandidates } from '../../../domain/constants/navigation-terminal'
import {
  NavigationEntryPageQuery,
  NavigationRepository,
  RoleNavigationConfig
} from '../../../domain/repositories/navigation.repository'
import { RoleLandingPolicy } from '../../../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../../../domain/vo/role-navigation-visibility.value-object'
import { NavigationMapper } from '../../mappers/navigation.mapper'
import { PrismaService } from '../../prisma/prisma.service'

/** PrismaNavigationRepository persists navigation governance facts in the permission database. */
@Injectable()
export class PrismaNavigationRepository implements NavigationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEntryByKey(entryKey: string): Promise<NavigationEntry | null> {
    const found = await this.prisma.navigationEntry.findUnique({ where: { entryKey } })
    return found ? NavigationMapper.toEntryDomain(found) : null
  }

  async listEntries(query: NavigationEntryPageQuery) {
    const page = query.page
    const pageSize = query.pageSize
    const skip = (page - 1) * pageSize
    const keyword = query.keyword?.trim()

    const where = {
      ...(query.featureKey ? { featureKey: query.featureKey } : {}),
      ...(query.enabled !== undefined ? { enabled: query.enabled } : {}),
      ...(query.terminal
        ? {
            supportedTerminals: {
              array_contains: query.terminal
            }
          }
        : {}),
      ...(keyword
        ? {
            OR: [
              { entryKey: { contains: keyword, mode: 'insensitive' as const } },
              { name: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }
        : {})
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.navigationEntry.findMany({
        where,
        orderBy: [{ registryPriority: 'desc' }, { entryKey: 'asc' }],
        skip,
        take: pageSize
      }),
      this.prisma.navigationEntry.count({ where })
    ])

    return {
      entries: records.map(NavigationMapper.toEntryDomain),
      total,
      page,
      pageSize
    }
  }

  async saveEntry(entry: NavigationEntry): Promise<NavigationEntry> {
    const saved = await this.prisma.navigationEntry.upsert({
      where: { entryKey: entry.entryKey },
      update: {
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      },
      create: {
        entryKey: entry.entryKey,
        name: entry.name,
        description: entry.description,
        featureKey: entry.featureKey,
        supportedTerminals: entry.supportedTerminals,
        registryPriority: entry.registryPriority,
        enabled: entry.enabled,
        entryType: entry.entryType
      }
    })

    return NavigationMapper.toEntryDomain(saved)
  }

  async findRoleNavigation(roleId: string): Promise<RoleNavigationConfig> {
    const [visibility, landingPolicies] = await this.prisma.$transaction([
      this.prisma.roleNavigationVisibility.findMany({
        where: { roleId },
        orderBy: [{ terminal: 'asc' }, { entryKey: 'asc' }]
      }),
      this.prisma.roleLandingPolicy.findMany({
        where: { roleId },
        orderBy: [{ terminal: 'asc' }, { priority: 'desc' }]
      })
    ])

    return {
      roleId,
      visibility: visibility.map(NavigationMapper.toVisibilityDomain),
      landingPolicies: landingPolicies.map(NavigationMapper.toLandingPolicyDomain)
    }
  }

  async replaceRoleVisibility(
    roleId: string,
    visibility: RoleNavigationVisibility[]
  ): Promise<RoleNavigationConfig> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roleNavigationVisibility.deleteMany({ where: { roleId } })

      if (visibility.length > 0) {
        await tx.roleNavigationVisibility.createMany({
          data: visibility.map((item) => ({
            roleId,
            entryKey: item.entryKey,
            terminal: item.terminal,
            enabled: item.enabled
          }))
        })
      }
    })

    return this.findRoleNavigation(roleId)
  }

  async replaceRoleLandingPolicies(
    roleId: string,
    policies: RoleLandingPolicy[]
  ): Promise<RoleNavigationConfig> {
    await this.prisma.$transaction(async (tx) => {
      await tx.roleLandingPolicy.deleteMany({ where: { roleId } })

      if (policies.length > 0) {
        await tx.roleLandingPolicy.createMany({
          data: policies.map((policy) => ({
            roleId,
            terminal: policy.terminal,
            defaultEntryKey: policy.defaultEntryKey,
            priority: policy.priority,
            enabled: policy.enabled
          }))
        })
      }
    })

    return this.findRoleNavigation(roleId)
  }

  async findVisibleEntriesForRoles(input: {
    roleIds: string[]
    terminal: string
  }): Promise<NavigationEntry[]> {
    if (input.roleIds.length === 0) return []
    const terminalCandidates = normalizeNavigationTerminalCandidates(input.terminal)

    const records = await this.prisma.navigationEntry.findMany({
      where: {
        enabled: true,
        supportedTerminals: {
          array_contains: input.terminal
        },
        roleVisibilities: {
          some: {
            roleId: { in: input.roleIds },
            terminal: { in: terminalCandidates },
            enabled: true
          }
        }
      },
      orderBy: [{ registryPriority: 'desc' }, { entryKey: 'asc' }]
    })

    return records.map(NavigationMapper.toEntryDomain)
  }

  async findLandingPoliciesForRoles(input: {
    roleIds: string[]
    terminal: string
  }): Promise<RoleLandingPolicy[]> {
    if (input.roleIds.length === 0) return []
    const terminalCandidates = normalizeNavigationTerminalCandidates(input.terminal)

    const records = await this.prisma.roleLandingPolicy.findMany({
      where: {
        roleId: { in: input.roleIds },
        terminal: { in: terminalCandidates },
        enabled: true
      },
      orderBy: [{ priority: 'desc' }, { roleId: 'asc' }, { defaultEntryKey: 'asc' }]
    })

    return records.map(NavigationMapper.toLandingPolicyDomain)
  }
}
