import * as authorization from '@oes/common/authorization'
import { ResolveExternalMachineAuthorizationSnapshotHandler } from '../application/queries/authorization/resolve-external-machine-authorization-snapshot.handler'
import { ResolveExternalMachineAuthorizationSnapshotQuery } from '../application/queries/authorization/resolve-external-machine-authorization-snapshot.query'
import { Permission } from '../domain/aggregates/permission.aggregate'
import { PermissionKind } from '../domain/enums/permission-kind.enum'
import { PermissionModule } from '../domain/enums/permission-module.enum'
import { ScopeLevel } from '../domain/enums/scope-level.enum'
import {
  PermissionCatalogEligibilityError,
  PermissionCatalogMetadataError
} from '../domain/services/permission-code-eligibility'

jest.mock('@oes/common/authorization', () => {
  const actual = jest.requireActual('@oes/common/authorization')
  return { ...actual, getPermissionCodeDefinition: jest.fn(actual.getPermissionCodeDefinition) }
})

describe('ResolveExternalMachineAuthorizationSnapshotHandler', () => {
  const actualAuthorization = jest.requireActual<typeof authorization>('@oes/common/authorization')
  const mockedGetDefinition = authorization.getPermissionCodeDefinition as jest.MockedFunction<
    typeof authorization.getPermissionCodeDefinition
  >

  afterEach(() => {
    mockedGetDefinition.mockReset()
    mockedGetDefinition.mockImplementation(actualAuthorization.getPermissionCodeDefinition)
  })

  /** Installs one exact test-only external definition and returns its current runtime row. */
  const currentExternalPermission = (
    code: string,
    assignableTo: Array<'HUMAN' | 'MACHINE' | 'WORKLOAD_POLICY'> = ['HUMAN', 'MACHINE']
  ): Permission => {
    const definition = {
      code,
      ownerService: 'permission-service',
      description: 'External snapshot fixture',
      kind: 'BUSINESS' as const,
      assignableTo,
      allowedScopeLevels: ['TENANT'] as const,
      externalApiEligible: true
    }
    mockedGetDefinition.mockImplementation((candidate) =>
      candidate === code ? definition : actualAuthorization.getPermissionCodeDefinition(candidate)
    )
    return new Permission(
      `permission-${code}`,
      code,
      PermissionModule.PERMISSION_SERVICE,
      definition.description,
      PermissionKind.BUSINESS,
      true,
      [ScopeLevel.TENANT],
      authorization.permissionDefinitionFingerprint(definition)
    )
  }

  /** Executes the handler against one repository-owned grant snapshot. */
  const execute = (permissions: Permission[]) => {
    const repository = {
      resolveExternalMachineAuthorizationSnapshot: jest.fn().mockResolvedValue({
        permissions,
        authzVersion: 'binding-1',
        decisionReference: 'permission-snapshot:machine-1:binding-1'
      })
    }
    const handler = new ResolveExternalMachineAuthorizationSnapshotHandler(repository as never)
    return handler.execute(
      new ResolveExternalMachineAuthorizationSnapshotQuery('machine-1', 'tenant-1')
    )
  }

  it('returns only current external-eligible BUSINESS codes for the trusted tenant MACHINE', async () => {
    await expect(execute([currentExternalPermission('inventory.read')])).resolves.toEqual({
      externalBusinessPermissionCodes: ['inventory.read'],
      authzVersion: 'binding-1',
      decisionReference: 'permission-snapshot:machine-1:binding-1'
    })
  })

  it('fails closed when no eligible current machine grant exists', async () => {
    const repository = {
      resolveExternalMachineAuthorizationSnapshot: jest.fn().mockResolvedValue(null)
    }
    const handler = new ResolveExternalMachineAuthorizationSnapshotHandler(repository as never)

    await expect(
      handler.execute(new ResolveExternalMachineAuthorizationSnapshotQuery('machine-1', 'tenant-1'))
    ).resolves.toEqual({
      externalBusinessPermissionCodes: [],
      authzVersion: '',
      decisionReference: ''
    })
  })

  it('rejects the entire snapshot for a stale definition fingerprint', async () => {
    const permission = currentExternalPermission('inventory.read')
    const stale = new Permission(
      permission.id,
      permission.code,
      permission.module,
      permission.description,
      permission.kind,
      permission.externalApiEligible,
      permission.allowedScopeLevels,
      'sha256:stale'
    )
    await expect(execute([stale])).rejects.toBeInstanceOf(PermissionCatalogMetadataError)
  })

  it('rejects the entire snapshot for empty or invalid persisted scope metadata', async () => {
    const permission = currentExternalPermission('inventory.read')
    const invalidScope = new Permission(
      permission.id,
      permission.code,
      permission.module,
      permission.description,
      permission.kind,
      permission.externalApiEligible,
      [],
      permission.definitionFingerprint
    )
    await expect(execute([invalidScope])).rejects.toBeInstanceOf(PermissionCatalogMetadataError)
  })

  it('rejects the entire snapshot for a HUMAN-only external Code', async () => {
    await expect(
      execute([currentExternalPermission('human.only.read', ['HUMAN'])])
    ).rejects.toBeInstanceOf(PermissionCatalogEligibilityError)
  })

  it('rejects the entire snapshot for an unknown granted Code', async () => {
    const unknown = new Permission(
      'permission-unknown',
      'unknown.external.read',
      PermissionModule.PERMISSION_SERVICE,
      'Unknown external fixture',
      PermissionKind.BUSINESS,
      true,
      [ScopeLevel.TENANT],
      'sha256:unknown'
    )
    await expect(execute([unknown])).rejects.toBeInstanceOf(PermissionCatalogMetadataError)
  })
})
