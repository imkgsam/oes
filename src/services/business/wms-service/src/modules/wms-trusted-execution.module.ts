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
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { GrpcWorkloadIdentityProvider } from '@oes/common/transport'
import { WmsRpcContextValidator } from '../interfaces/grpc/wms-rpc-context.validator'
import { WmsItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { WmsItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/wms-item-master-execution-token-exchange.client'
import { WmsItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer'
import { WmsProcurementInternalTrustedGrpcClient } from '../infrastructure/adapters/procurement-internal-trusted-grpc.client'
import { WmsProcurementExecutionTokenExchangeClient } from '../infrastructure/adapters/wms-procurement-execution-token-exchange.client'
import { WmsProcurementTrustedGrpcExecutionProducer } from '../infrastructure/adapters/wms-procurement-trusted-grpc-execution.producer'

export const WMS_AUDIENCE = 'urn:oes:service:wms-service'
const runtime = createLazyTrustedExecutionRuntime(WMS_AUDIENCE)

/** Restricts every WMS BUSINESS RPC to a direct api-gateway workload and HUMAN subject. */
@Injectable()
export class WmsTrustedBusinessExecutionGuard extends TrustedExecutionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const verified = getAuthenticatedGrpcRequestContext(
      context.switchToRpc().getData()
    )?.verifiedExecutionToken
    if (readDirectWorkloadName(verified?.clientId ?? '') !== 'api-gateway' || verified?.actor) {
      throw new ForbiddenException('WMS BUSINESS execution requires direct api-gateway')
    }
    return true
  }
}

/** Supplies WMS token-only ingress and both verified-HUMAN OBO outbound compositions. */
@Global()
@Module({
  providers: [
    WmsRpcContextValidator,
    { provide: ExecutionTokenVerifier, useFactory: () => runtime.verifier },
    { provide: GrpcWorkloadIdentityProvider, useFactory: () => runtime.workloadIdentityProvider },
    { provide: String, useValue: WMS_AUDIENCE },
    {
      provide: WmsTrustedBusinessExecutionGuard,
      useFactory: (reflector: Reflector) =>
        new WmsTrustedBusinessExecutionGuard(
          reflector,
          runtime.verifier,
          runtime.workloadIdentityProvider,
          WMS_AUDIENCE
        ),
      inject: [Reflector]
    },
    WmsItemMasterTrustedGrpcClient,
    WmsItemMasterExecutionTokenExchangeClient,
    {
      provide: WmsItemMasterTrustedGrpcExecutionProducer,
      useFactory: (exchange: WmsItemMasterExecutionTokenExchangeClient) =>
        new WmsItemMasterTrustedGrpcExecutionProducer(exchange),
      inject: [WmsItemMasterExecutionTokenExchangeClient]
    },
    WmsProcurementInternalTrustedGrpcClient,
    WmsProcurementExecutionTokenExchangeClient,
    {
      provide: WmsProcurementTrustedGrpcExecutionProducer,
      useFactory: (exchange: WmsProcurementExecutionTokenExchangeClient) =>
        new WmsProcurementTrustedGrpcExecutionProducer(exchange),
      inject: [WmsProcurementExecutionTokenExchangeClient]
    }
  ],
  exports: [
    WmsRpcContextValidator,
    ExecutionTokenVerifier,
    GrpcWorkloadIdentityProvider,
    String,
    WmsTrustedBusinessExecutionGuard,
    WmsItemMasterTrustedGrpcClient,
    WmsItemMasterTrustedGrpcExecutionProducer,
    WmsProcurementInternalTrustedGrpcClient,
    WmsProcurementTrustedGrpcExecutionProducer
  ]
})
export class WmsTrustedExecutionModule {}

/** Derives the exact direct caller name from a Common-verified SPIFFE identity. */
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
    )
      return ''
    return workloadName
  } catch {
    return ''
  }
}
