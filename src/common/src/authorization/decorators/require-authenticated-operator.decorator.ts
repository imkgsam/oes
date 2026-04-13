import { applyDecorators, SetMetadata } from '@nestjs/common'
import {
  MANAGEMENT_INTERFACE_METADATA_KEY,
  REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY
} from '../constants'

export const RequireAuthenticatedOperator = () =>
  applyDecorators(
    SetMetadata(MANAGEMENT_INTERFACE_METADATA_KEY, true),
    SetMetadata(REQUIRE_AUTHENTICATED_OPERATOR_METADATA_KEY, true)
  )
