import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
} from '@oes/common/generated/party_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  PartyRegistrationPort,
  RegisterTenantPartyInput,
  RegisterTenantPartyResult
} from '../../application/ports/party-registration.port'

type PartyRegistrationMetadataInput = Pick<
  RegisterTenantPartyInput,
  'operatorId' | 'operatorScope'
>

@Injectable()
// This adaptor sends identity-driven tenant person registrations to party-service through the shared gRPC boundary.
export class PartyRegistrationGrpcAdaptor implements PartyRegistrationPort, OnModuleInit {
  private readonly logger = new Logger(PartyRegistrationGrpcAdaptor.name)
  private partyRegistrationService!: PartyRegistrationServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PARTY)
    private readonly partyClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.partyRegistrationService = this.partyClient.getService<PartyRegistrationServiceClient>(
      PARTY_REGISTRATION_SERVICE_NAME
    )
  }

  async registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult> {
    const response = await safeGrpcCall<RegisterTenantPartyResponse>(
      this.partyRegistrationService.registerTenantParty(
        {
          tenantId: input.tenantId,
          type: 'PERSON',
          legalName: input.legalName,
          displayName: input.displayName ?? '',
          identifiers: [],
          idempotencyKey: input.idempotencyKey ?? ''
        } as RegisterTenantPartyRequest,
        this.buildMetadata(input)
      ),
      {
        caller: 'identity-service',
        method: 'PartyRegistrationService.registerTenantParty'
      }
    )

    const tenantPartyId = response.tenantParty?.id?.trim()
    if (!tenantPartyId) {
      this.logger.error('party-service returned an empty tenant party id during tenant person registration', {
        legalName: input.legalName,
        tenantId: input.tenantId
      })
      throw new Error('party-service did not return tenantParty.id')
    }

    return { tenantPartyId }
  }

  private buildMetadata(input: PartyRegistrationMetadataInput) {
    const current = this.requestContextStore.getContext()

    if (input.operatorId) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: SERVICE_NAMES.IDENTITY,
        requestId: current?.requestId,
        traceId: current?.traceId,
        operatorContext: {
          operatorId: input.operatorId,
          operatorType: 'HUMAN',
          tenantId: input.operatorScope?.tenantId
        }
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.IDENTITY,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
