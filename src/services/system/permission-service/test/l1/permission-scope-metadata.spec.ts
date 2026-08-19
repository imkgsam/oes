import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionKind } from '../../src/domain/enums/permission-kind.enum'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { ScopeLevel } from '../../src/domain/enums/scope-level.enum'
import { PermissionMapper } from '../../src/infrastructure/mappers/permission.mapper'
import { toPermissionResponse } from '../../src/interfaces/grpc/permission-management.grpc.presenter'

/** Verifies scope metadata survives persistence and management-read mapping without a permissive fallback. */
describe('Permission scope metadata pipeline', () => {
  it('round-trips exact allowed scopes and definition fingerprint through the Prisma mapper', () => {
    const definition = getPermissionCodeDefinition('permission.list')!
    const permission = new Permission(
      'permission-id',
      definition.code,
      PermissionModule.PERMISSION_SERVICE,
      definition.description,
      PermissionKind.BUSINESS,
      false,
      [ScopeLevel.SYSTEM, ScopeLevel.TENANT],
      permissionDefinitionFingerprint(definition)
    )
    const persisted = PermissionMapper.toPersistant(permission)
    const restored = PermissionMapper.toDomain(persisted)
    expect(restored.allowedScopeLevels).toEqual([ScopeLevel.SYSTEM, ScopeLevel.TENANT])
    expect(restored.definitionFingerprint).toBe(permission.definitionFingerprint)
    expect(toPermissionResponse(restored).allowedScopeLevels).toEqual(['SYSTEM', 'TENANT'])
  })

  it('normalizes malformed persisted scopes to an empty fail-closed list', () => {
    const restored = PermissionMapper.toDomain({
      id: 'permission-id',
      code: 'permission.list',
      module: 'PERMISSION_SERVICE',
      kind: 'BUSINESS',
      externalApiEligible: false,
      allowedScopeLevels: ['SYSTEM', 'INVALID'],
      definitionFingerprint: ''
    })
    expect(restored.allowedScopeLevels).toEqual([])
    expect(restored.definitionFingerprint).toBe('')
  })

  it('migrates existing rows to empty scope and fingerprint until deterministic catalog sync', () => {
    const sql = readFileSync(
      resolve(
        __dirname,
        '../../prisma/migrations/20260819_permission_scope_metadata/migration.sql'
      ),
      'utf8'
    )
    expect(sql).toContain('DEFAULT ARRAY[]::"PermissionScopeLevel"[]')
    expect(sql).toContain('"definitionFingerprint" TEXT NOT NULL DEFAULT \'\'')
    expect(sql).not.toMatch(/DEFAULT ARRAY\['SYSTEM'|DEFAULT ARRAY\['TENANT'/)
  })

  it.each([
    ['collaboration.task.create', 'BUSINESS', ['HUMAN'], ['TENANT']],
    ['collaboration.task.assign', 'BUSINESS', ['HUMAN'], ['TENANT']],
    ['collaboration.annotation.create', 'BUSINESS', ['HUMAN'], ['TENANT']],
    ['collaboration.annotation.manage', 'BUSINESS', ['HUMAN'], ['TENANT']],
    ['crm.internal.object_reference.validate', 'INTERNAL', ['WORKLOAD_POLICY'], ['TENANT']],
    [
      'item_master.internal.manufacturable_item.resolve',
      'INTERNAL',
      ['WORKLOAD_POLICY'],
      ['SYSTEM']
    ],
    ['item_master.internal.stockable_item.resolve', 'INTERNAL', ['WORKLOAD_POLICY'], ['SYSTEM']],
    ['item_master.internal.purchasable_item.resolve', 'INTERNAL', ['WORKLOAD_POLICY'], ['SYSTEM']],
    ['auth.internal.external_api_key.exchange', 'INTERNAL', ['WORKLOAD_POLICY'], ['SYSTEM']],
    ['identity.internal.integration_machine.resolve', 'INTERNAL', ['WORKLOAD_POLICY'], ['SYSTEM']],
    [
      'permission.internal.external_machine.snapshot.resolve',
      'INTERNAL',
      ['WORKLOAD_POLICY'],
      ['SYSTEM']
    ],
    ['collaboration.internal.ai_action.resolve', 'INTERNAL', ['WORKLOAD_POLICY'], ['SYSTEM']],
    [
      'auth.machine_workload_source_credential.revoke',
      'BUSINESS',
      ['HUMAN', 'MACHINE'],
      ['SYSTEM', 'TENANT']
    ],
    [
      'identity.machine.workload_binding.manage',
      'BUSINESS',
      ['HUMAN', 'MACHINE'],
      ['SYSTEM', 'TENANT']
    ]
  ] as const)(
    'preserves frozen eligibility metadata for %s',
    (code, kind, assignableTo, allowedScopeLevels) => {
      expect(getPermissionCodeDefinition(code)).toMatchObject({
        kind,
        assignableTo,
        allowedScopeLevels,
        externalApiEligible: false
      })
    }
  )
})
