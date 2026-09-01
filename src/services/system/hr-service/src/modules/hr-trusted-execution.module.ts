import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Global,
  Injectable,
  Module,
  SetMetadata
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import {
  createLazyTrustedExecutionRuntime,
  ExecutionTokenVerifier,
  getAuthenticatedGrpcRequestContext,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { HrPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { HrPartyMachineSourceCredentialClient } from '../infrastructure/adapters/hr-party-machine-source-credential.client'
import { HrPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/hr-party-machine-source-credential.provider'
import { HrPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/hr-party-execution-token-exchange.client'
import { HrPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/hr-party-trusted-grpc-execution.producer'

export const HR_AUDIENCE = 'urn:oes:service:hr-service'
export const HR_PUBLIC_ENTRY_OWNER_FACT_KEY = 'oes:hr:public-entry-owner-fact'
export const AuthorizeHrPublicEntryOwnerFact = () =>
  SetMetadata(HR_PUBLIC_ENTRY_OWNER_FACT_KEY, true)
const runtime = createLazyTrustedExecutionRuntime(HR_AUDIENCE)

/** Restricts HR calls to Gateway HUMAN, foundation OBO, Auth pre-auth and Public Entry rendering. */
@Injectable()
export class HrFoundationTrustedExecutionGuard
  extends TrustedExecutionGuard
  implements CanActivate
{
  constructor(
    private readonly callerReflector: Reflector,
    verifier: ExecutionTokenVerifier,
    identity: GrpcWorkloadIdentityProvider
  ) {
    super(callerReflector, verifier, identity, HR_AUDIENCE)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const token = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    const workload = readWorkloadName(token?.clientId ?? '')
    const publicEntryOwnerFact = this.callerReflector.getAllAndOverride<boolean>(
      HR_PUBLIC_ENTRY_OWNER_FACT_KEY,
      [context.getHandler(), context.getClass()]
    )
    if (
      publicEntryOwnerFact &&
      !(
        token?.principalType === 'MACHINE' &&
        token.tenantId === undefined &&
        token.orgId === undefined &&
        workload === 'public-entry-service'
      )
    ) {
      throw new ForbiddenException('HR public-card owner fact requires exact Public Entry workload')
    }
    const allowed =
      token?.principalType === 'MACHINE'
        ? ['auth-service', 'public-entry-service'].includes(workload)
        : token?.principalType === 'HUMAN' &&
          token.sessionTerminal === 'WEB' &&
          ['api-gateway', 'identity-service', 'tenant-org-service'].includes(workload)
    if (!allowed) throw new ForbiddenException('HR trusted caller is not permitted')
    return true
  }
}

/** Composes HR token-only ingress together with its preserved Party producer. */
@Global()
@Module({
  providers: [
    HrPartyTrustedGrpcClient,
    HrPartyMachineSourceCredentialClient,
    HrPartyMachineSourceCredentialProvider,
    HrPartyExecutionTokenExchangeClient,
    {
      provide: HrPartyTrustedGrpcExecutionProducer,
      useFactory: (
        source: HrPartyMachineSourceCredentialProvider,
        exchange: HrPartyExecutionTokenExchangeClient
      ) => new HrPartyTrustedGrpcExecutionProducer(source, exchange),
      inject: [HrPartyMachineSourceCredentialProvider, HrPartyExecutionTokenExchangeClient]
    },
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    {
      provide: HrFoundationTrustedExecutionGuard,
      useFactory: (
        reflector: Reflector,
        verifier: ExecutionTokenVerifier,
        identity: GrpcWorkloadIdentityProvider
      ) => new HrFoundationTrustedExecutionGuard(reflector, verifier, identity),
      inject: [Reflector, ExecutionTokenVerifier, GrpcWorkloadIdentityProvider]
    }
  ],
  exports: [
    HrPartyTrustedGrpcClient,
    HrPartyTrustedGrpcExecutionProducer,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    HrFoundationTrustedExecutionGuard
  ]
})
export class HrTrustedExecutionModule {}

/** Extracts one canonical workload name from a verified SPIFFE URI. */
function readWorkloadName(spiffeId: string): string {
  try {
    const value = new URL(spiffeId)
    return value.protocol === 'spiffe:'
      ? (value.pathname.split('/').filter(Boolean).at(-1) ?? '')
      : ''
  } catch {
    return ''
  }
}
