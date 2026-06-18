import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  PartyRegistrationPort,
  RegisterTenantPartyInput,
  RegisterTenantPartyResult
} from '../../application/ports'

export const PARTY_GRPC_CLIENT = Symbol('PARTY_GRPC_CLIENT')
export const PARTY_PROTO_PATH = resolveCommonProtoPath('party_service/party.proto')

/** PartyRegistrationGrpcAdapter delegates employee tenant-party registration to party-service through gRPC. */
@Injectable()
export class PartyRegistrationGrpcAdapter implements PartyRegistrationPort, OnModuleInit {
  private svc!: PartyRegistrationServiceClient

  constructor(
    @Inject(PARTY_GRPC_CLIENT)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PartyRegistrationServiceClient>(
      PARTY_REGISTRATION_SERVICE_NAME
    )
  }

  async registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult> {
    const response = await safeGrpcCall<RegisterTenantPartyResponse>(
      this.svc.registerTenantParty(
        {
          tenantId: input.tenantId,
          type: 'PERSON',
          legalName: input.legalName,
          displayName: input.displayName ?? input.legalName,
          localCode: '',
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            normalizedValue: identifier.normalizedValue,
            rawValue: identifier.rawValue ?? '',
            status: 'DECLARED'
          })),
          idempotencyKey: input.idempotencyKey ?? ''
        } as RegisterTenantPartyRequest,
        this.buildMetadata(input.tenantId)
      ),
      {
        caller: SERVICE_NAMES.HR,
        method: 'PartyRegistrationService.registerTenantParty'
      }
    )

    return {
      tenantPartyId: response.tenantParty?.id ?? ''
    }
  }

  /** buildMetadata forwards the current operator and trace context to party-service. */
  private buildMetadata(tenantId: string) {
    const current = this.requestContextStore.getContext()
    const operator = current?.operatorContext
    if (operator?.operator_id) {
      return this.metadataFactory.createOperatorScopedMetadata({
        callerServiceName: SERVICE_NAMES.HR,
        requestId: current?.requestId,
        traceId: current?.traceId,
        operatorContext: {
          operatorId: operator.operator_id,
          operatorType: operator.operator_type,
          tenantId: operator.tenant_id ?? tenantId,
          orgId: operator.org_id,
          operatorRoles: operator.operator_roles
        }
      })
    }

    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.HR,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
