import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Global,
  Injectable,
  Module
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  getAuthenticatedGrpcRequestContext,
  ITEM_MASTER_INTERNAL_PERMISSION_CODES,
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'

const ITEM_MASTER_AUDIENCE = 'urn:oes:service:item-master-service'
const runtime = createLazyTrustedExecutionRuntime(ITEM_MASTER_AUDIENCE)

/** Binds Item Master BUSINESS RPC authorization to its exact target audience. */
@Injectable()
export class ItemMasterTrustedExecutionGuard extends TrustedExecutionGuard {
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, ITEM_MASTER_AUDIENCE)
  }
}

/** Freezes each Item Master INTERNAL Code to its only admitted workload names. */
export const ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_MANUFACTURABLE_ITEM]: ['mes-service'],
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_STOCKABLE_ITEM]: ['wms-service'],
    [ITEM_MASTER_INTERNAL_PERMISSION_CODES.RESOLVE_PURCHASABLE_ITEM]: [
      'procurement-service',
      'srm-service'
    ]
  })

/** Narrows Item Master INTERNAL calls to exact-tenant HUMAN OBO execution with one SYSTEM MACHINE actor. */
@Injectable()
export class ItemMasterTrustedInternalExecutionGuard
  extends TrustedInternalExecutionGuard
  implements CanActivate
{
  constructor(reflector: Reflector) {
    super(reflector, runtime.verifier, runtime.workloadIdentityProvider, ITEM_MASTER_AUDIENCE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    if (
      verified?.principalType !== 'HUMAN' ||
      !verified.tenantId?.trim() ||
      verified.tenantId === 'SYSTEM' ||
      !isSystemMachineActor(verified.actor)
    ) {
      throw new ForbiddenException(
        'Item Master INTERNAL execution requires an exact-tenant HUMAN subject and SYSTEM MACHINE actor'
      )
    }
    const declaration = Reflect.getMetadata(
      RPC_AUTHORIZATION_MODE_METADATA_KEY,
      context.getHandler()
    ) as { mode?: string; permissions?: { all?: readonly string[] } } | undefined
    const requiredCodes =
      declaration?.mode === 'INTERNAL' ? (declaration.permissions?.all ?? []) : []
    const workloadServiceName = readWorkloadServiceName(verified.clientId)
    if (
      !requiredCodes.length ||
      requiredCodes.some(
        (code) => !ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(workloadServiceName)
      )
    ) {
      throw new ForbiddenException('Item Master INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

/** Derives the exact final service-id component only after Common has verified the full registered SPIFFE URI. */
function readWorkloadServiceName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    const segments = value.pathname.split('/').filter(Boolean)
    const serviceName = segments.at(-1) ?? ''
    if (
      value.protocol !== 'spiffe:' ||
      value.username ||
      value.password ||
      value.search ||
      value.hash ||
      !/^[a-z0-9][a-z0-9-]*-service$/u.test(serviceName)
    ) {
      return ''
    }
    return serviceName
  } catch {
    return ''
  }
}

/** Accepts only the frozen direct SYSTEM MACHINE actor object with no recursive chain. */
function isSystemMachineActor(actor: unknown): boolean {
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return false
  const value = actor as Record<string, unknown>
  return (
    Object.keys(value).length === 3 &&
    typeof value.sub === 'string' &&
    value.sub.length > 0 &&
    value.sub.trim() === value.sub &&
    value.principal_type === 'MACHINE' &&
    value.scope_level === 'SYSTEM'
  )
}

/** Supplies Item Master's audience-bound verifier and token-only trusted execution guard. */
@Global()
@Module({
  providers: [
    ItemMasterTrustedExecutionGuard,
    ItemMasterTrustedInternalExecutionGuard
  ],
  exports: [ItemMasterTrustedExecutionGuard, ItemMasterTrustedInternalExecutionGuard]
})
export class ItemMasterTrustedExecutionModule {}
