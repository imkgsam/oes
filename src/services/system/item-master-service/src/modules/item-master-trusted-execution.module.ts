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

/** Narrows Item Master INTERNAL calls to exact-tenant SYSTEM MACHINE execution and per-Code workloads. */
@Injectable()
export class ItemMasterTrustedInternalExecutionGuard
  extends TrustedInternalExecutionGuard
  implements CanActivate
{
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    if (
      verified?.principalType !== 'MACHINE' ||
      !verified.tenantId?.trim() ||
      verified.tenantId === 'SYSTEM'
    ) {
      throw new ForbiddenException(
        'Item Master INTERNAL execution requires an exact-tenant SYSTEM MACHINE principal'
      )
    }
    const declaration = Reflect.getMetadata(
      RPC_AUTHORIZATION_MODE_METADATA_KEY,
      context.getHandler()
    ) as { mode?: string; permissions?: { all?: readonly string[] } } | undefined
    const requiredCodes =
      declaration?.mode === 'INTERNAL' ? (declaration.permissions?.all ?? []) : []
    if (
      !requiredCodes.length ||
      requiredCodes.some(
        (code) => !ITEM_MASTER_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(verified.clientId)
      )
    ) {
      throw new ForbiddenException('Item Master INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

/** Supplies Item Master's audience-bound verifier and token-only trusted execution guard. */
@Global()
@Module({
  providers: [
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new TrustedExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          ITEM_MASTER_AUDIENCE
        ),
      inject: [Reflector]
    },
    {
      provide: ItemMasterTrustedInternalExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new ItemMasterTrustedInternalExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          ITEM_MASTER_AUDIENCE
        ),
      inject: [Reflector]
    }
  ],
  exports: [TrustedExecutionGuard, ItemMasterTrustedInternalExecutionGuard]
})
export class ItemMasterTrustedExecutionModule {}
