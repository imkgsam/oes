import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ASSET_SERVICE_NAME,
  AssetServiceClient,
  BindEmployeeOfficialPhotoRequest,
  BindEmployeeOfficialPhotoResponse,
  UploadEmployeeOfficialPhotoRequest,
  UploadEmployeeOfficialPhotoResponse
} from '@oes/common/generated/asset_service'
import { InjectGrpcClient, SafeGrpcCallOptions, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Proxies HR-owned employee official photo asset operations to asset-service without reusing account avatar ownership.
export class EmployeeOfficialPhotoAssetGrpcAdapter implements OnModuleInit {
  private svc!: AssetServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ASSET)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  /** uploadEmployeeOfficialPhoto stores one pending official employee photo asset candidate. */
  uploadEmployeeOfficialPhoto(
    request: UploadEmployeeOfficialPhotoRequest,
    source: DownstreamRequestSource
  ): Promise<UploadEmployeeOfficialPhotoResponse> {
    return this.call(
      'uploadEmployeeOfficialPhoto',
      this.svc.uploadEmployeeOfficialPhoto(request, this.operatorMetadata(source))
    )
  }

  /** bindEmployeeOfficialPhoto marks the HR-updated official photo asset as active for the employee. */
  bindEmployeeOfficialPhoto(
    request: BindEmployeeOfficialPhotoRequest,
    source: DownstreamRequestSource
  ): Promise<BindEmployeeOfficialPhotoResponse> {
    return this.call(
      'bindEmployeeOfficialPhoto',
      this.svc.bindEmployeeOfficialPhoto(request, this.operatorMetadata(source))
    )
  }

  onModuleInit(): void {
    this.svc = this.client.getService<AssetServiceClient>(ASSET_SERVICE_NAME)
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `AssetService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
