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
  RegisterPersonPartyRequest,
  RegisterPersonPartyResponse
} from '@oes/common/generated/party_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  PartyRegistrationPort,
  RegisterPersonPartyInput,
  RegisterPersonPartyResult
} from '../../application/ports/party-registration.port'

@Injectable()
// This adaptor sends identity-driven person registrations to party-service through the shared gRPC transport boundary.
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

  async registerPersonParty(input: RegisterPersonPartyInput): Promise<RegisterPersonPartyResult> {
    const response = await safeGrpcCall<RegisterPersonPartyResponse>(
      this.partyRegistrationService.registerPersonParty(
        {
          tenantId: input.tenantId ?? '',
          canonicalName: input.canonicalName,
          localDisplayName: input.localDisplayName ?? '',
          identifiers: [],
          idempotencyKey: input.idempotencyKey ?? ''
        } as RegisterPersonPartyRequest,
        this.buildMetadata(input)
      ),
      {
        caller: 'identity-service',
        method: 'PartyRegistrationService.registerPersonParty'
      }
    )

    const partyId = response.party?.id?.trim()
    if (!partyId) {
      this.logger.error('party-service returned an empty party id during person registration', {
        canonicalName: input.canonicalName,
        tenantId: input.tenantId
      })
      throw new Error('party-service did not return party.id')
    }

    return {
      partyId,
      tenantPartyId: response.tenantParty?.id?.trim() || undefined
    }
  }

  private buildMetadata(input: RegisterPersonPartyInput) {
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
