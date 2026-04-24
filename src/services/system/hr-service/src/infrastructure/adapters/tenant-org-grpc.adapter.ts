import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { firstValueFrom } from 'rxjs'
import { TenantOrgReferencePort, TenantOrgReferenceValidationResult } from '../../application/ports'

export const TENANT_ORG_GRPC_CLIENT = Symbol('TENANT_ORG_GRPC_CLIENT')

/** TenantOrgGrpcAdapter validates OrgUnit references through tenant-org-service gRPC contracts. */
@Injectable()
export class TenantOrgGrpcAdapter implements TenantOrgReferencePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient

  constructor(@Inject(TENANT_ORG_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.client.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async validateOrgReference(input: {
    tenantId: string
    orgUnitId: string
  }): Promise<TenantOrgReferenceValidationResult> {
    const response = await firstValueFrom(
      this.tenantOrgQueryService.validateOrgReference({
        tenantId: input.tenantId,
        orgUnitId: input.orgUnitId
      })
    )
    return {
      valid: Boolean(response.result?.valid),
      rejectionReason: response.result?.rejectionReason || undefined
    }
  }
}
