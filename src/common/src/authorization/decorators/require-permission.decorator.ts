import { applyDecorators, SetMetadata } from '@nestjs/common'
import { REQUIRE_PERMISSION_METADATA_KEY } from '../constants'
import { RequireAuthenticatedOperator } from './require-authenticated-operator.decorator'

export const RequirePermission = (permission: string) =>
  applyDecorators(
    RequireAuthenticatedOperator(),
    SetMetadata(REQUIRE_PERMISSION_METADATA_KEY, permission)
  )
