import { Metadata } from '@grpc/grpc-js'
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
  CRM_INTERNAL_PERMISSION_CODES,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  getGrpcMetadataValue,
  RPC_AUTHORIZATION_MODE_METADATA_KEY,
  TrustedExecutionGuard,
  TrustedInternalExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { CrmPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/crm-party-execution-token-exchange.client'
import { CrmPartyMachineSourceCredentialClient } from '../infrastructure/adapters/crm-party-machine-source-credential.client'
import { CrmPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/crm-party-machine-source-credential.provider'
import { CrmPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/crm-party-trusted-grpc-execution.producer'
import { PartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { CustomerRpcContextValidator } from '../interfaces/grpc/customer-rpc-context.validator'

export const CRM_AUDIENCE = 'urn:oes:service:crm-service'
const runtime = createLazyTrustedExecutionRuntime(CRM_AUDIENCE)

/** Freezes CRM's sole INTERNAL Code to Collaboration's exact HUMAN_OBO workload. */
export const CRM_INTERNAL_WORKLOAD_ALLOWLIST: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    [CRM_INTERNAL_PERMISSION_CODES.VALIDATE_OBJECT_REFERENCE]: ['collaboration-service']
  })

/** Restricts all CRM BUSINESS RPCs to direct api-gateway HUMAN execution. */
@Injectable()
export class CrmTrustedBusinessExecutionGuard extends TrustedExecutionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    if (readWorkloadServiceName(verified?.clientId ?? '') !== 'api-gateway' || verified?.actor) {
      throw new ForbiddenException('CRM BUSINESS execution requires direct api-gateway')
    }
    return true
  }
}

/** Narrows CRM INTERNAL admission to Collaboration's exact SYSTEM actor and HUMAN subject. */
@Injectable()
export class CrmTrustedInternalExecutionGuard
  extends TrustedInternalExecutionGuard
  implements CanActivate
{
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const authenticated = getAuthenticatedGrpcRequestContext(context.switchToRpc().getData())
    const verified = authenticated?.verifiedExecutionToken
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
      !verified.sessionId?.trim() ||
      verified.sessionTerminal !== 'WEB' ||
      !isCollaborationSystemMachineActor(verified.actor)
    ) {
      throw new ForbiddenException(
        'CRM INTERNAL execution requires Collaboration HUMAN_OBO execution'
      )
    }
    const declaration = Reflect.getMetadata(
      RPC_AUTHORIZATION_MODE_METADATA_KEY,
      context.getHandler()
    ) as { mode?: string; permissions?: { all?: readonly string[] } } | undefined
    const requiredCodes =
      declaration?.mode === 'INTERNAL' ? (declaration.permissions?.all ?? []) : []
    const workload = readWorkloadServiceName(verified.clientId)
    if (
      !requiredCodes.length ||
      requiredCodes.some((code) => !CRM_INTERNAL_WORKLOAD_ALLOWLIST[code]?.includes(workload))
    ) {
      throw new ForbiddenException('CRM INTERNAL workload is not permitted for this RPC')
    }
    return true
  }
}

/** Supplies CRM token-only ingress while preserving CRM-owned Party MACHINE_ROOT composition. */
@Global()
@Module({
  providers: [
    CustomerRpcContextValidator,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: String, useValue: CRM_AUDIENCE },
    {
      provide: CrmTrustedBusinessExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new CrmTrustedBusinessExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          CRM_AUDIENCE
        ),
      inject: [Reflector]
    },
    {
      provide: CrmTrustedInternalExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new CrmTrustedInternalExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          CRM_AUDIENCE
        ),
      inject: [Reflector]
    },
    PartyTrustedGrpcClient,
    CrmPartyMachineSourceCredentialClient,
    CrmPartyMachineSourceCredentialProvider,
    CrmPartyExecutionTokenExchangeClient,
    {
      provide: CrmPartyTrustedGrpcExecutionProducer,
      useFactory: (
        source: CrmPartyMachineSourceCredentialProvider,
        exchange: CrmPartyExecutionTokenExchangeClient
      ) => new CrmPartyTrustedGrpcExecutionProducer(source, exchange),
      inject: [CrmPartyMachineSourceCredentialProvider, CrmPartyExecutionTokenExchangeClient]
    }
  ],
  exports: [
    CustomerRpcContextValidator,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    String,
    CrmTrustedBusinessExecutionGuard,
    CrmTrustedInternalExecutionGuard,
    PartyTrustedGrpcClient,
    CrmPartyTrustedGrpcExecutionProducer
  ]
})
export class CrmTrustedExecutionModule {}

/** Derives one exact service name from a Common-verified SPIFFE identity. */
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
      !/^[a-z0-9][a-z0-9-]*$/u.test(serviceName)
    ) {
      return ''
    }
    return serviceName
  } catch {
    return ''
  }
}

/** Accepts only Auth's exact Collaboration SYSTEM MACHINE actor object. */
function isCollaborationSystemMachineActor(actor: unknown): boolean {
  if (!actor || typeof actor !== 'object' || Array.isArray(actor)) return false
  const value = actor as Record<string, unknown>
  return (
    Object.keys(value).length === 3 &&
    value.sub === 'machine-principal:collaboration-service' &&
    value.principal_type === 'MACHINE' &&
    value.scope_level === 'SYSTEM'
  )
}
