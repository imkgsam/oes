import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { safeGrpcCall } from '@oes/common/transport'
import { TenantOrgReferencePort, TenantOrgReferenceValidationResult } from '../../application/ports'

export const TENANT_ORG_GRPC_CLIENT = Symbol('TENANT_ORG_GRPC_CLIENT')

/** TenantOrgGrpcAdapter validates OrgUnit references through tenant-org-service gRPC contracts. */
@Injectable()
export class TenantOrgGrpcAdapter implements TenantOrgReferencePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient

  constructor(
    @Inject(TENANT_ORG_GRPC_CLIENT) private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.client.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async validateOrgReference(input: {
    tenantId: string
    orgUnitId: string
  }): Promise<TenantOrgReferenceValidationResult> {
    const response = await safeGrpcCall(
      this.tenantOrgQueryService.validateOrgReference(
        {
          tenantId: input.tenantId,
          orgUnitId: input.orgUnitId
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.HR,
        method: 'TenantOrgQueryService.validateOrgReference'
      }
    )
    return {
      valid: Boolean(response.result?.valid),
      rejectionReason: response.result?.rejectionReason || undefined
    }
  }

  /** buildMetadata forwards the current HR operator context to tenant-org reference validation. */
  private buildMetadata() {
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
          tenantId: operator.tenant_id,
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
