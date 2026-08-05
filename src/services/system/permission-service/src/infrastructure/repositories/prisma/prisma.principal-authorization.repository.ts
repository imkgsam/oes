import { Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { PrincipalAuthorizationRepository } from '../../../domain/repositories/principal-authorization.repository'
import { PrismaService } from '../../prisma/prisma.service'

/** Loads current principal grant and policy facts from Permission-owned Prisma tables. */
@Injectable()
export class PrismaPrincipalAuthorizationRepository implements PrincipalAuthorizationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Resolves active scoped bindings and enabled coarse policies without returning a role graph. */
  async resolveAuthorizationFacts(
    input: Parameters<PrincipalAuthorizationRepository['resolveAuthorizationFacts']>[0]
  ) {
    const now = this.now()
    const bindings = await this.prisma.principalRoleBinding.findMany({
      where: {
        principalType: input.principalType,
        principalId: input.principalId,
        scopeLevel: input.scopeLevel,
        ...(input.scopeLevel === 'SYSTEM' ? { tenantId: null } : { tenantId: input.tenantId! }),
        revokedAt: null,
        AND: [
          { OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
        ],
        role: {
          isEnabled: true,
          kind: input.scopeLevel === 'SYSTEM' ? 'SYSTEM_INSTANCE' : 'TENANT_INSTANCE',
          ...(input.scopeLevel === 'TENANT' ? { tenantId: input.tenantId! } : {})
        }
      },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        }
      }
    })
    if (bindings.length === 0) return null

    const policies = await this.prisma.policy.findMany({
      where: {
        permissionCode: { in: input.requestedPermissionCodes },
        isEnabled: true,
        OR: [{ tenantId: null }, ...(input.tenantId ? [{ tenantId: input.tenantId }] : [])]
      },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }]
    })
    const permissionCodes = [
      ...new Set(
        bindings.flatMap((binding) =>
          binding.role.permissions
            .map((rolePermission) => rolePermission.permission)
            .filter((permission) => permission.kind === 'BUSINESS')
            .map((permission) => permission.code)
        )
      )
    ].sort()
    const roleCodes = [...new Set(bindings.map((binding) => binding.role.code))].sort()
    const authzVersion = buildAuthorizationVersion(bindings, policies, permissionCodes)
    return {
      principalType: input.principalType,
      principalId: input.principalId,
      scopeLevel: input.scopeLevel,
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      permissionCodes,
      roleCodes,
      policies: policies.map((policy) => ({
        permissionCode: policy.permissionCode,
        effect: policy.effect,
        subjectType: policy.subjectType,
        ...(policy.subjectId ? { subjectId: policy.subjectId } : {}),
        ...(policy.tenantId ? { tenantId: policy.tenantId } : {}),
        ...(policy.conditionAstJson ? { conditionAstJson: policy.conditionAstJson } : {})
      })),
      authzVersion,
      decisionReference: `principal-grant:${input.principalId}:${authzVersion}`
    }
  }
}

/** Builds an opaque current-version value from binding, role and coarse policy revisions. */
function buildAuthorizationVersion(
  bindings: Array<{
    id: string
    createdAt: Date
    role: { updatedAt: Date }
  }>,
  policies: Array<{ id: string; updatedAt: Date }>,
  permissionCodes: string[]
): string {
  const revisionInput = [
    ...bindings.map(
      (binding) =>
        `b:${binding.id}:${binding.createdAt.toISOString()}:${binding.role.updatedAt.toISOString()}`
    ),
    ...policies.map((policy) => `p:${policy.id}:${policy.updatedAt.toISOString()}`),
    ...permissionCodes.map((code) => `g:${code}`)
  ]
    .sort()
    .join('|')
  return createHash('sha256').update(revisionInput).digest('hex')
}
