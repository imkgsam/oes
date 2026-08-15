import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { safeGrpcCall } from '@oes/common/transport'
import { TenantOrgReferencePort, TenantOrgReferenceValidationResult } from '../../application/ports'
import { HrFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

export const TENANT_ORG_GRPC_CLIENT = Symbol('TENANT_ORG_GRPC_CLIENT')

/** TenantOrgGrpcAdapter validates OrgUnit references through tenant-org-service gRPC contracts. */
@Injectable()
export class TenantOrgGrpcAdapter implements TenantOrgReferencePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new HrFoundationTrustedGrpcExecutionProducer()

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
    const response = await safeGrpcCall(
      this.tenantOrgQueryService.validateOrgReference(
        {
          tenantId: input.tenantId,
          orgUnitId: input.orgUnitId
        },
        await this.trusted.forBusinessCall('tenant-org-service', ['tenant_org.org_unit.list_tree'])
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

  async getTenantEmployeeCodePrefix(tenantId: string): Promise<string> {
    const response = await safeGrpcCall(
      this.tenantOrgQueryService.getTenantById(
        {
          tenantId
        },
        await this.trusted.forBusinessCall('tenant-org-service', ['tenant_org.tenant.get_by_id'])
      ),
      {
        caller: SERVICE_NAMES.HR,
        method: 'TenantOrgQueryService.getTenantById'
      }
    )
    const prefix = response.tenant?.employeeCodePrefix?.trim().toUpperCase()
    if (!prefix) {
      throw new NotFoundException(`Tenant ${tenantId} employee code prefix not found`)
    }
    return prefix
  }
}
