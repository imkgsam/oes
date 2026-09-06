import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { loadRuntimeOwnerContext, normalizeTaskKey } from '../local-runtime/src/runtime-context.mjs'

const PUBLIC_READ_CODE = 'public-entry.business-card.read'
const FIXTURE_IDS = Object.freeze({
  roleId: '00000000-0000-4000-8000-000000000711',
  rolePermissionId: '00000000-0000-4000-8000-000000000712',
  bindingId: '00000000-0000-4000-8000-000000000713',
  grantAuditEventId: '00000000-0000-4000-8000-000000000714'
})

/** Builds one exact SYSTEM role/binding for Gateway's anonymous BusinessCard read. */
export function buildPublicBusinessCardPermissionAcceptanceSeed(
  taskKey,
  gatewayMachinePrincipalId
) {
  const normalizedTaskKey = normalizeTaskKey(taskKey)
  const principalId = requireExact(gatewayMachinePrincipalId, 'GATEWAY_MACHINE_PRINCIPAL_ID')
  const fixtureOwner = `fixture:public-business-card:${normalizedTaskKey}`
  const roleCode = `fixture.public-business-card.gateway-read.${normalizedTaskKey}`
  const role = {
    id: FIXTURE_IDS.roleId,
    tenantId: null,
    scopeKey: '__SYSTEM__',
    code: roleCode,
    name: 'Public BusinessCard Gateway read acceptance',
    description: `${fixtureOwner}: exact Gateway MACHINE public read`,
    kind: 'SYSTEM_INSTANCE',
    templateRoleId: null,
    allowTenantPermissionOverride: false,
    isProtected: true,
    isEnabled: true
  }
  const binding = {
    id: FIXTURE_IDS.bindingId,
    principalType: 'MACHINE',
    principalId,
    roleId: role.id,
    tenantId: null,
    scopeLevel: 'SYSTEM',
    effectiveAt: null,
    expiresAt: null,
    revokedAt: null,
    revokedByOperatorId: null,
    revokeReason: null,
    revokeAuditEventId: null,
    createdByOperatorId: fixtureOwner,
    createdRequestId: `public-business-card-${normalizedTaskKey}`,
    createdTraceId: `public-business-card-${normalizedTaskKey}`,
    grantAuditEventId: FIXTURE_IDS.grantAuditEventId
  }
  const projection = {
    version: 1,
    taskKey: normalizedTaskKey,
    fixtureOwner,
    permissionCode: PUBLIC_READ_CODE,
    role,
    rolePermission: { id: FIXTURE_IDS.rolePermissionId, roleId: role.id },
    binding
  }
  return {
    ...projection,
    digest: crypto.createHash('sha256').update(stableJson(projection)).digest('hex')
  }
}

/** Loads the exact manifest-bound Permission database and explicit Gateway selector. */
export function loadPermissionAcceptanceContext(_repositoryRoot, environment = process.env) {
  const runtime = loadRuntimeOwnerContext('permission-service', environment)
  const taskKey = runtime.taskKey
  const databaseUrl = environment.PERMISSION_DATABASE_URL?.trim() || runtime.databaseUrl
  assertTaskOwnedPermissionDatabase(databaseUrl, taskKey, runtime.databaseAllocation)
  const selectorPath = environment.OES_MACHINE_SELECTOR_FILE?.trim() || null
  const gatewayMachinePrincipalId = environment.GATEWAY_MACHINE_PRINCIPAL_ID?.trim() || (selectorPath ? readGatewayMachinePrincipalId(selectorPath) : '')
  if (!gatewayMachinePrincipalId) throw new Error('GATEWAY_MACHINE_PRINCIPAL_ID_REQUIRED')
  return { databaseUrl, databaseAllocation: runtime.databaseAllocation, gatewayMachinePrincipalId, selectorPath, taskKey, manifestPath: runtime.manifestPath }
}

/** Rejects remote, shared, or differently owned Permission databases. */
export function assertTaskOwnedPermissionDatabase(databaseUrl, taskKey, allocation) {
  return assertTaskDatabase(databaseUrl, taskKey, allocation)
}

/** Applies the owned role, one permission edge, and one active machine binding. */
export async function applyPermissionAcceptanceFixture(prisma, fixture) {
  const permission = await requireSystemPublicReadPermission(prisma)
  await assertNoForeignPermissionConflicts(prisma, fixture, permission.id)
  await prisma.$transaction(async (tx) => {
    await tx.role.upsert({
      where: { id: fixture.role.id },
      create: fixture.role,
      update: omit(fixture.role, ['id', 'tenantId', 'scopeKey', 'code', 'kind'])
    })
    await tx.rolePermission.upsert({
      where: { id: fixture.rolePermission.id },
      create: { ...fixture.rolePermission, permissionId: permission.id },
      update: { roleId: fixture.role.id, permissionId: permission.id }
    })
    await tx.principalRoleBinding.upsert({
      where: { id: fixture.binding.id },
      create: fixture.binding,
      update: omit(fixture.binding, [
        'id',
        'principalType',
        'principalId',
        'roleId',
        'tenantId',
        'scopeLevel'
      ])
    })
  })
  return checkPermissionAcceptanceFixture(prisma, fixture)
}

/** Verifies the exact one-Code SYSTEM grant and rejects privilege growth. */
export async function checkPermissionAcceptanceFixture(prisma, fixture) {
  const permission = await requireSystemPublicReadPermission(prisma)
  const [role, rolePermissions, binding] = await Promise.all([
    prisma.role.findUnique({ where: { id: fixture.role.id } }),
    prisma.rolePermission.findMany({
      where: { roleId: fixture.role.id },
      include: { permission: true },
      orderBy: { id: 'asc' }
    }),
    prisma.principalRoleBinding.findUnique({ where: { id: fixture.binding.id } })
  ])
  if (stableJson(toRoleProjection(role)) !== stableJson(fixture.role)) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_ROLE_MISMATCH')
  }
  if (
    rolePermissions.length !== 1 ||
    rolePermissions[0]?.id !== fixture.rolePermission.id ||
    rolePermissions[0]?.permissionId !== permission.id ||
    rolePermissions[0]?.permission.code !== PUBLIC_READ_CODE
  ) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_EDGE_MISMATCH')
  }
  if (stableJson(toBindingProjection(binding)) !== stableJson(fixture.binding)) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_BINDING_MISMATCH')
  }
  return {
    result: 'PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_VERIFIED',
    taskKey: fixture.taskKey,
    principalId: fixture.binding.principalId,
    permissionCode: PUBLIC_READ_CODE,
    roleCount: 1,
    rolePermissionCount: 1,
    bindingCount: 1,
    digest: fixture.digest
  }
}

/** Removes only the task-owned binding and role; Permission catalog truth remains intact. */
export async function cleanupPermissionAcceptanceFixture(prisma, fixture) {
  const permission = await requireSystemPublicReadPermission(prisma)
  await assertNoForeignPermissionConflicts(prisma, fixture, permission.id)
  const result = await prisma.$transaction(async (tx) => {
    const binding = await tx.principalRoleBinding.deleteMany({ where: { id: fixture.binding.id } })
    const edge = await tx.rolePermission.deleteMany({ where: { id: fixture.rolePermission.id } })
    const role = await tx.role.deleteMany({ where: { id: fixture.role.id } })
    return {
      deletedBindings: binding.count,
      deletedRolePermissions: edge.count,
      deletedRoles: role.count
    }
  })
  const [roles, edges, bindings] = await Promise.all([
    prisma.role.count({ where: { id: fixture.role.id } }),
    prisma.rolePermission.count({ where: { id: fixture.rolePermission.id } }),
    prisma.principalRoleBinding.count({ where: { id: fixture.binding.id } })
  ])
  if (roles + edges + bindings !== 0) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_CLEANUP_INCOMPLETE')
  }
  return {
    result: 'PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_CLEANED',
    taskKey: fixture.taskKey,
    ...result
  }
}

/** Requires Permission foundation metadata to reflect the frozen Gateway SYSTEM read contract. */
async function requireSystemPublicReadPermission(prisma) {
  const permission = await prisma.permission.findUnique({ where: { code: PUBLIC_READ_CODE } })
  if (
    !permission ||
    permission.kind !== 'BUSINESS' ||
    permission.module !== 'PUBLIC_ENTRY_SERVICE' ||
    !permission.allowedScopeLevels.includes('SYSTEM') ||
    !permission.allowedScopeLevels.includes('TENANT')
  ) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_CATALOG_NOT_SYNCED')
  }
  return permission
}

/** Fails closed when an exact id, role identity, edge, or binding is not fixture-owned. */
async function assertNoForeignPermissionConflicts(prisma, fixture, permissionId) {
  const [roles, edges, bindings] = await Promise.all([
    prisma.role.findMany({
      where: {
        OR: [
          { id: fixture.role.id },
          { scopeKey: fixture.role.scopeKey, kind: fixture.role.kind, code: fixture.role.code }
        ]
      }
    }),
    prisma.rolePermission.findMany({
      where: {
        OR: [{ id: fixture.rolePermission.id }, { roleId: fixture.role.id, permissionId }]
      }
    }),
    prisma.principalRoleBinding.findMany({
      where: {
        OR: [
          { id: fixture.binding.id },
          {
            principalType: 'MACHINE',
            principalId: fixture.binding.principalId,
            roleId: fixture.role.id
          },
          { roleId: fixture.role.id }
        ]
      }
    })
  ])
  if (roles.some((role) => stableJson(toRoleProjection(role)) !== stableJson(fixture.role))) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_FOREIGN_ROLE_CONFLICT')
  }
  if (
    edges.some(
      (edge) =>
        edge.id !== fixture.rolePermission.id ||
        edge.roleId !== fixture.role.id ||
        edge.permissionId !== permissionId
    )
  ) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_FOREIGN_EDGE_CONFLICT')
  }
  if (
    bindings.some(
      (binding) => stableJson(toBindingProjection(binding)) !== stableJson(fixture.binding)
    )
  ) {
    throw new Error('PUBLIC_BUSINESS_CARD_PERMISSION_FIXTURE_FOREIGN_BINDING_CONFLICT')
  }
}

/** Resolves exactly the Gateway machine principal from the task-owned selector inventory. */
function readGatewayMachinePrincipalId(selectorPath) {
  const parsed = JSON.parse(fs.readFileSync(selectorPath, 'utf8'))
  const matches = (parsed.selectors ?? []).filter(
    (selector) => selector.inventoryEntryKey === 'api-gateway'
  )
  if (matches.length !== 1) throw new Error('PUBLIC_BUSINESS_CARD_GATEWAY_SELECTOR_NOT_EXACT')
  return requireExact(matches[0].machinePrincipalId, 'GATEWAY_MACHINE_PRINCIPAL_ID')
}

/** Validates one exact loopback database name for the task and service suffix. */
function assertTaskDatabase(databaseUrl, taskKey, allocation) {
  const parsed = new URL(databaseUrl)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_PROTOCOL_INVALID')
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_NOT_LOOPBACK')
  }
  const database = decodeURIComponent(parsed.pathname.slice(1))
  normalizeTaskKey(taskKey)
  if (!allocation || allocation.kind !== 'database' || allocation.database !== database || !/^[a-f0-9]{64}$/u.test(allocation.containerObjectId || '')) {
    throw new Error('PUBLIC_BUSINESS_CARD_FIXTURE_DATABASE_NOT_TASK_OWNED')
  }
  return { database, host: parsed.hostname, port: parsed.port || '5432' }
}

/** Reduces a persisted role to the fields owned by this fixture. */
function toRoleProjection(role) {
  if (!role) return null
  return {
    id: role.id,
    tenantId: role.tenantId,
    scopeKey: role.scopeKey,
    code: role.code,
    name: role.name,
    description: role.description,
    kind: role.kind,
    templateRoleId: role.templateRoleId,
    allowTenantPermissionOverride: role.allowTenantPermissionOverride,
    isProtected: role.isProtected,
    isEnabled: role.isEnabled
  }
}

/** Reduces a persisted principal binding to the fields owned by this fixture. */
function toBindingProjection(binding) {
  if (!binding) return null
  return {
    id: binding.id,
    principalType: binding.principalType,
    principalId: binding.principalId,
    roleId: binding.roleId,
    tenantId: binding.tenantId,
    scopeLevel: binding.scopeLevel,
    effectiveAt: binding.effectiveAt,
    expiresAt: binding.expiresAt,
    revokedAt: binding.revokedAt,
    revokedByOperatorId: binding.revokedByOperatorId,
    revokeReason: binding.revokeReason,
    revokeAuditEventId: binding.revokeAuditEventId,
    createdByOperatorId: binding.createdByOperatorId,
    createdRequestId: binding.createdRequestId,
    createdTraceId: binding.createdTraceId,
    grantAuditEventId: binding.grantAuditEventId
  }
}

/** Requires a non-empty selector value without hidden surrounding whitespace. */
function requireExact(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value) {
    throw new Error(`PUBLIC_BUSINESS_CARD_${label}_INVALID`)
  }
  return value
}

/** Copies an object while excluding immutable Prisma update fields. */
function omit(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)))
}

/** Serializes fixture projections with deterministic object-key ordering. */
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
