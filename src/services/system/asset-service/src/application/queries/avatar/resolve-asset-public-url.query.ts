import { IQuery } from '@nestjs/cqrs'
import { IsNotEmpty, IsString } from 'class-validator'

// ResolveAssetPublicUrlQuery asks the asset read path for one controlled asset display URL.
export class ResolveAssetPublicUrlQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly assetId: string

  constructor(assetId: string) {
    this.assetId = assetId
  }
}
