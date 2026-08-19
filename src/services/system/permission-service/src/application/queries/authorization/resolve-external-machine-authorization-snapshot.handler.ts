import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import {
  matchesPermissionDecisionEligibility,
  PermissionCatalogEligibilityError,
  PermissionCatalogMetadataError,
  toPermissionDecisionCatalogEntry
} from '../../../domain/services/permission-code-eligibility'
import { ResolveExternalMachineAuthorizationSnapshotQuery } from './resolve-external-machine-authorization-snapshot.query'

/** Returns Auth's strictly limited external-safe machine permission snapshot, defaulting to deny. */
@QueryHandler(ResolveExternalMachineAuthorizationSnapshotQuery)
export class ResolveExternalMachineAuthorizationSnapshotHandler implements IQueryHandler<ResolveExternalMachineAuthorizationSnapshotQuery> {
  constructor(@Inject(SYMBOLS.REPO.ROLE) private readonly roleRepository: RoleRepository) {}
  async execute(query: ResolveExternalMachineAuthorizationSnapshotQuery) {
    const snapshot = await this.roleRepository.resolveExternalMachineAuthorizationSnapshot({
      principalId: query.integrationMachineId,
      tenantId: query.tenantId
    })
    if (!snapshot) return deniedSnapshot()

    const externalBusinessPermissionCodes: string[] = []
    for (const permission of snapshot.permissions) {
      const eligibility = toPermissionDecisionCatalogEntry(permission)
      if (!eligibility.metadataCurrent) {
        throw new PermissionCatalogMetadataError(permission.code)
      }
      if (!permission.externalApiEligible) continue
      if (
        !matchesPermissionDecisionEligibility(eligibility, {
          kind: 'BUSINESS',
          scopeLevel: 'TENANT',
          assignee: 'MACHINE'
        })
      ) {
        throw new PermissionCatalogEligibilityError(permission.code)
      }
      externalBusinessPermissionCodes.push(permission.code)
    }
    if (externalBusinessPermissionCodes.length === 0) return deniedSnapshot()
    return {
      externalBusinessPermissionCodes: [...new Set(externalBusinessPermissionCodes)].sort(),
      authzVersion: snapshot.authzVersion,
      decisionReference: snapshot.decisionReference
    }
  }
}

/** Produces the stable empty fail-closed snapshot returned for missing or empty eligible grants. */
function deniedSnapshot() {
  return { externalBusinessPermissionCodes: [], authzVersion: '', decisionReference: '' }
}
