import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Global,
  Injectable,
  Module
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Metadata } from '@grpc/grpc-js'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  getGrpcMetadataValue,
  PROCUREMENT_INTERNAL_PERMISSION_CODES,
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { ProcurementRpcContextValidator } from '../interfaces/grpc/procurement-rpc-context.validator'
import { ProcurementItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { ProcurementItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/procurement-item-master-execution-token-exchange.client'
import { ProcurementItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/procurement-item-master-trusted-grpc-execution.producer'
import { ProcurementSrmExecutionTokenExchangeClient } from '../infrastructure/adapters/procurement-srm-execution-token-exchange.client'
import { ProcurementSrmTrustedGrpcExecutionProducer } from '../infrastructure/adapters/procurement-srm-trusted-grpc-execution.producer'
import { ProcurementSrmInternalTrustedGrpcClient } from '../infrastructure/adapters/srm-internal-trusted-grpc.client'

export const PROCUREMENT_AUDIENCE = 'urn:oes:service:procurement-service'
const runtime = createLazyTrustedExecutionRuntime(PROCUREMENT_AUDIENCE)

/** Freezes the receipt eligibility Code to WMS as its sole direct workload caller. */
export const PROCUREMENT_INTERNAL_WORKLOAD_ALLOWLIST: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    [PROCUREMENT_INTERNAL_PERMISSION_CODES.RESOLVE_RECEIVING_EXPECTATION_FOR_RECEIPT]: [
      'wms-service'
    ]
  })

/** Restricts every Procurement BUSINESS RPC to the direct api-gateway workload. */
@Injectable()
export class ProcurementTrustedBusinessExecutionGuard
  extends TrustedExecutionGuard
  implements CanActivate
{
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    if (readDirectWorkloadName(verified?.clientId ?? '') !== 'api-gateway' || verified?.actor) {
      throw new ForbiddenException('Procurement BUSINESS execution requires direct api-gateway')
    }
    return true
  }
}

/** Narrows Procurement INTERNAL calls to exact-tenant HUMAN OBO execution from WMS's SYSTEM actor. */
@Injectable()
export class ProcurementTrustedInternalExecutionGuard
  extends TrustedInternalExecutionGuard
  implements CanActivate
{
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const authenticated = getAuthenticatedGrpcRequestContext(context.switchToRpc().getData())
    if (authenticated) {
      Object.assign(authenticated as object, {
        requestId: getGrpcMetadataValue(
          context.switchToRpc().getContext<Metadata>(),
          'x-request-id'
        ),
        traceId: getGrpcMetadataValue(context.switchToRpc().getContext<Metadata>(), 'x-trace-id')
      })
    }
    if (
      verified?.principalType !== 'HUMAN' ||
      !verified.tenantId?.trim() ||
      verified.tenantId === 'SYSTEM' ||
      verified.tenantId === '*' ||
      !isSystemMachineActor(verified.actor)
    ) {
      throw new ForbiddenException(
        'Procurement INTERNAL execution requires an exact-tenant HUMAN subject and SYSTEM MACHINE actor'
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
        (code) => !PROCUREMENT_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(workloadServiceName)
      )
    ) {
      throw new ForbiddenException('Procurement INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

/** Supplies Procurement's inbound token-only guards and verified request-context validator. */
@Global()
@Module({
  providers: [
    ProcurementRpcContextValidator,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () => runtime.workloadIdentityProvider
    },
    { provide: String, useValue: PROCUREMENT_AUDIENCE },
    {
      provide: ProcurementTrustedBusinessExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new ProcurementTrustedBusinessExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          PROCUREMENT_AUDIENCE
        ),
      inject: [Reflector]
    },
    {
      provide: ProcurementTrustedInternalExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new ProcurementTrustedInternalExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          PROCUREMENT_AUDIENCE
        ),
      inject: [Reflector]
    },
    ProcurementItemMasterTrustedGrpcClient,
    ProcurementItemMasterExecutionTokenExchangeClient,
    {
      provide: ProcurementItemMasterTrustedGrpcExecutionProducer,
      useFactory: (exchange: ProcurementItemMasterExecutionTokenExchangeClient) =>
        new ProcurementItemMasterTrustedGrpcExecutionProducer(exchange),
      inject: [ProcurementItemMasterExecutionTokenExchangeClient]
    },
    ProcurementSrmInternalTrustedGrpcClient,
    ProcurementSrmExecutionTokenExchangeClient,
    {
      provide: ProcurementSrmTrustedGrpcExecutionProducer,
      useFactory: (exchange: ProcurementSrmExecutionTokenExchangeClient) =>
        new ProcurementSrmTrustedGrpcExecutionProducer(exchange),
      inject: [ProcurementSrmExecutionTokenExchangeClient]
    }
  ],
  exports: [
    ProcurementRpcContextValidator,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    String,
    ProcurementTrustedBusinessExecutionGuard,
    ProcurementTrustedInternalExecutionGuard,
    ProcurementItemMasterTrustedGrpcClient,
    ProcurementItemMasterTrustedGrpcExecutionProducer,
    ProcurementSrmInternalTrustedGrpcClient,
    ProcurementSrmTrustedGrpcExecutionProducer
  ]
})
export class ProcurementTrustedExecutionModule {}

/** Derives a frozen service name only from Common-verified SPIFFE workload identity. */
function readWorkloadServiceName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    const serviceName = value.pathname.split('/').filter(Boolean).at(-1) ?? ''
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

/** Derives the exact direct caller name from a canonical Common-verified SPIFFE id. */
function readDirectWorkloadName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    const workloadName = value.pathname.split('/').filter(Boolean).at(-1) ?? ''
    if (
      value.protocol !== 'spiffe:' ||
      value.username ||
      value.password ||
      value.search ||
      value.hash ||
      !/^[a-z0-9][a-z0-9-]*$/u.test(workloadName)
    ) {
      return ''
    }
    return workloadName
  } catch {
    return ''
  }
}

/** Accepts only Auth's frozen direct SYSTEM MACHINE actor object with no recursive chain. */
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
