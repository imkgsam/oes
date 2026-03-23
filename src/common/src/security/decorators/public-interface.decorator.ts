import { SetMetadata } from '@nestjs/common'
import { PUBLIC_INTERFACE_METADATA_KEY } from '../constants'

export const PublicInterface = () => SetMetadata(PUBLIC_INTERFACE_METADATA_KEY, true)
