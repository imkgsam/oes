import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AssetGrpcAdapter } from '../../infrastructure/downstream/asset-service/asset-grpc.adapter'
import { AvatarAssetUploadViewModel } from '../../interfaces/http/view-models/personal-center.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

export interface AccountAvatarUploadFile {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

@Injectable()
// AccountAvatarUploadUseCase uploads one current-account avatar candidate through asset-service.
export class AccountAvatarUploadUseCase {
  constructor(private readonly assetAdapter: AssetGrpcAdapter) {}

  async execute(
    file: AccountAvatarUploadFile | undefined,
    source: DownstreamRequestSource
  ): Promise<AvatarAssetUploadViewModel> {
    if (!file) {
      throw new BadRequestException('avatar file is required')
    }

    const result = await this.assetAdapter.uploadAccountAvatar(
      {
        contentType: file.mimetype,
        file: file.buffer,
        fileName: file.originalname
      },
      source
    )

    return {
      avatarAsset: {
        assetId: result.asset?.assetId ?? '',
        publicUrl: result.asset?.publicUrl ?? '',
        mimeType: result.asset?.mimeType ?? file.mimetype,
        size: Number.parseInt(result.asset?.size ?? `${file.size}`, 10),
        status: result.asset?.status ?? 'PENDING_BIND'
      }
    }
  }
}
