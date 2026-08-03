import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  AssetServiceClient,
  BindEmployeeOfficialPhotoRequest,
  BindEmployeeOfficialPhotoResponse,
  UploadEmployeeOfficialPhotoRequest,
  UploadEmployeeOfficialPhotoResponse
} from '@oes/common/generated/asset_service'
import { SafeGrpcCallOptions, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewayAssetGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../common/grpc'

const CALLER = 'api-gateway'
const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const EMPLOYEE_PHOTO_PERMISSION = 'hr.employee.create'

@Injectable()
// Proxies HR-owned employee official photo asset operations to asset-service without reusing account avatar ownership.
export class EmployeeOfficialPhotoAssetGrpcAdapter implements OnModuleInit {
  private svc!: AssetServiceClient

  constructor(
    private readonly client: GatewayAssetGrpcClient,
    private readonly trustedExecutionProducer: GatewayTrustedGrpcExecutionProducer
  ) {}

  /** uploadEmployeeOfficialPhoto stores one pending official employee photo asset candidate. */
  async uploadEmployeeOfficialPhoto(
    request: UploadEmployeeOfficialPhotoRequest,
    source: DownstreamRequestSource
  ): Promise<UploadEmployeeOfficialPhotoResponse> {
    const metadata = await this.trustedExecutionProducer.forBusinessCall(source, ASSET_AUDIENCE, [
      EMPLOYEE_PHOTO_PERMISSION
    ])
    return this.call(
      'uploadEmployeeOfficialPhoto',
      this.svc.uploadEmployeeOfficialPhoto(request, metadata)
    )
  }

  /** bindEmployeeOfficialPhoto marks the HR-updated official photo asset as active for the employee. */
  async bindEmployeeOfficialPhoto(
    request: BindEmployeeOfficialPhotoRequest,
    source: DownstreamRequestSource
  ): Promise<BindEmployeeOfficialPhotoResponse> {
    const metadata = await this.trustedExecutionProducer.forBusinessCall(source, ASSET_AUDIENCE, [
      EMPLOYEE_PHOTO_PERMISSION
    ])
    return this.call(
      'bindEmployeeOfficialPhoto',
      this.svc.bindEmployeeOfficialPhoto(request, metadata)
    )
  }

  onModuleInit(): void {
    this.svc = this.client.getService()
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `AssetService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
