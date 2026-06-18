import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  AccountContactAsset,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource, toOperatorScopedMetadataInput } from '../../../common/grpc/gateway-downstream-source.mapper'

export type ContactAssetCandidate = {
  contactAssetId: string
  type: string
  provider?: string | null
  displayLabel: string
  displayValue: string
  status: string
  ownership: string
  isPrimary: boolean
}

// IdentityContactAssetGrpcAdapter reads Contact Asset candidates from identity-service for BusinessCard management.
@Injectable()
export class IdentityContactAssetGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  async listContactAssetCandidatesByEmployee(
    input: { tenantId: string; employeeId: string; traceId?: string },
    source: DownstreamRequestSource
  ): Promise<{ assets: ContactAssetCandidate[] }> {
    const accountResult = await safeGrpcCall(
      this.svc.resolveEmployeeLoginAccount(
        { tenantId: input.tenantId, employeeId: input.employeeId },
        this.metadata(source)
      ),
      {
        caller: 'api-gateway',
        method: 'IdentityQueryService.resolveEmployeeLoginAccount'
      }
    )
    const accountId = accountResult.account?.accountId?.trim()
    if (!accountId || accountResult.account?.tenantId !== input.tenantId || accountResult.account?.accountEnabled === false) {
      return { assets: [] }
    }

    const result = await safeGrpcCall(
      this.svc.listAccountContactAssets(
        {
          tenantId: input.tenantId,
          accountId,
          employeeId: input.employeeId,
          statuses: ['ACTIVE'],
          types: [
            'WORK_EMAIL',
            'WORK_PHONE',
            'WECHAT',
            'WHATSAPP',
            'EXTERNAL_COMMUNICATION_ACCOUNT',
            'OTHER_SOCIAL'
          ],
          ownership: ['COMPANY_CONTROLLED', 'EMPLOYEE_OWNED']
        },
        this.metadata(source)
      ),
      {
        caller: 'api-gateway',
        method: 'IdentityQueryService.listAccountContactAssets'
      }
    )

    return {
      assets: (result.assets ?? []).map(toContactAssetCandidate)
    }
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }
}

// toContactAssetCandidate maps identity summaries into the management picker shape without credential fields.
function toContactAssetCandidate(asset: AccountContactAsset): ContactAssetCandidate {
  return {
    contactAssetId: asset.id ?? '',
    type: asset.type ?? '',
    provider: asset.provider || null,
    displayLabel: asset.displayName || defaultLabel(asset.type),
    displayValue: asset.value ?? '',
    status: asset.status ?? '',
    ownership: asset.ownership ?? '',
    isPrimary: Boolean(asset.isPrimary)
  }
}

// defaultLabel gives stable picker labels when identity has no explicit display name.
function defaultLabel(type?: string): string {
  if (type === 'WORK_EMAIL') return 'Work email'
  if (type === 'WORK_PHONE') return 'Work phone'
  if (type === 'WECHAT') return 'WeChat'
  if (type === 'WHATSAPP') return 'WhatsApp'
  if (type === 'EXTERNAL_COMMUNICATION_ACCOUNT') return 'External account'
  return 'Contact asset'
}
