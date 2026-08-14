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
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  SRM_INTERNAL_PERMISSION_CODES,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { SrmItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/srm-item-master-execution-token-exchange.client'
import { SrmItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { SrmItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer'
import { SrmPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/srm-party-execution-token-exchange.client'
import { SrmPartyMachineSourceCredentialClient } from '../infrastructure/adapters/srm-party-machine-source-credential.client'
import { SrmPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/srm-party-machine-source-credential.provider'
import { SrmPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { SrmPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/srm-party-trusted-grpc-execution.producer'
import { SupplierRpcContextValidator } from '../interfaces/grpc/supplier-rpc-context.validator'

export const SRM_AUDIENCE = 'urn:oes:service:srm-service'
const runtime = createLazyTrustedExecutionRuntime(SRM_AUDIENCE)

/** Freezes both SRM INTERNAL Codes to Procurement as their sole direct workload caller. */
export const SRM_INTERNAL_WORKLOAD_ALLOWLIST: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER]: ['procurement-service'],
    [SRM_INTERNAL_PERMISSION_CODES.RESOLVE_ACTIVE_SUPPLIER_OFFERING]: ['procurement-service']
  })

/** Narrows SRM INTERNAL calls to exact-tenant HUMAN OBO execution from Procurement's SYSTEM actor. */
@Injectable()
export class SrmTrustedInternalExecutionGuard
  extends TrustedInternalExecutionGuard
  implements CanActivate
{
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
        'SRM INTERNAL execution requires an exact-tenant HUMAN subject and SYSTEM MACHINE actor'
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
        (code) => !SRM_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(workloadServiceName)
      )
    ) {
      throw new ForbiddenException('SRM INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

/** Supplies SRM inbound token-only guards plus its two intentionally distinct outbound trust stacks. */
@Global()
@Module({
  providers: [
    SupplierRpcContextValidator,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    {
      provide: GrpcWorkloadIdentityProvider,
      useFactory: () => runtime.workloadIdentityProvider
    },
    { provide: String, useValue: SRM_AUDIENCE },
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new TrustedExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          SRM_AUDIENCE
        ),
      inject: [Reflector]
    },
    {
      provide: SrmTrustedInternalExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new SrmTrustedInternalExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          SRM_AUDIENCE
        ),
      inject: [Reflector]
    },
    SrmItemMasterTrustedGrpcClient,
    SrmItemMasterExecutionTokenExchangeClient,
    {
      provide: SrmItemMasterTrustedGrpcExecutionProducer,
      useFactory: (exchange: SrmItemMasterExecutionTokenExchangeClient) =>
        new SrmItemMasterTrustedGrpcExecutionProducer(exchange),
      inject: [SrmItemMasterExecutionTokenExchangeClient]
    },
    SrmPartyTrustedGrpcClient,
    SrmPartyMachineSourceCredentialClient,
    SrmPartyMachineSourceCredentialProvider,
    SrmPartyExecutionTokenExchangeClient,
    {
      provide: SrmPartyTrustedGrpcExecutionProducer,
      useFactory: (
        source: SrmPartyMachineSourceCredentialProvider,
        exchange: SrmPartyExecutionTokenExchangeClient
      ) => new SrmPartyTrustedGrpcExecutionProducer(source, exchange),
      inject: [SrmPartyMachineSourceCredentialProvider, SrmPartyExecutionTokenExchangeClient]
    }
  ],
  exports: [
    SupplierRpcContextValidator,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    String,
    TrustedExecutionGuard,
    SrmTrustedInternalExecutionGuard,
    SrmItemMasterTrustedGrpcClient,
    SrmItemMasterTrustedGrpcExecutionProducer,
    SrmPartyTrustedGrpcClient,
    SrmPartyTrustedGrpcExecutionProducer
  ]
})
export class SrmTrustedExecutionModule {}

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
