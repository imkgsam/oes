import { SetMetadata } from '@nestjs/common'

export const REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY =
  'permission-service:require-management-permission'

export const RequireManagementPermission = (permissionCode: string) =>
  SetMetadata(REQUIRE_MANAGEMENT_PERMISSION_METADATA_KEY, permissionCode)
