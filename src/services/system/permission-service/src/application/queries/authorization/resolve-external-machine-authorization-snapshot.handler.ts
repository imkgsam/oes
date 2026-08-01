import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { ResolveExternalMachineAuthorizationSnapshotQuery } from './resolve-external-machine-authorization-snapshot.query'

/** Returns Auth's strictly limited external-safe machine permission snapshot, defaulting to deny. */
@QueryHandler(ResolveExternalMachineAuthorizationSnapshotQuery)
export class ResolveExternalMachineAuthorizationSnapshotHandler implements IQueryHandler<ResolveExternalMachineAuthorizationSnapshotQuery> {
  constructor(@Inject(SYMBOLS.REPO.ROLE) private readonly roleRepository: RoleRepository) {}
  async execute(query: ResolveExternalMachineAuthorizationSnapshotQuery) {
    const snapshot = await this.roleRepository.resolveExternalMachineAuthorizationSnapshot({ principalId: query.integrationMachineId, tenantId: query.tenantId })
    return snapshot
      ? { externalBusinessPermissionCodes: snapshot.permissionCodes, authzVersion: snapshot.authzVersion, decisionReference: snapshot.decisionReference }
      : { externalBusinessPermissionCodes: [], authzVersion: '', decisionReference: '' }
  }
}
