import { Metadata } from '@grpc/grpc-js'
import { Injectable } from '@nestjs/common'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  CheckPermissionResponse
} from '@oes/common/generated/permission_service/permission_check'
import { PermissionService } from 'src/application/services/permission.service'

@Injectable()
@PermissionCheckServiceControllerMethods()
export class PermissionCheckController implements PermissionCheckServiceController {

  constructor(private readonly permissionService: PermissionService) {}

  checkPermission(
    request: CheckPermissionRequest,
    metadata: Metadata,
    ...rest: any
  ): Promise<CheckPermissionResponse> {
    throw new Error('Method not implemented.')
  }
  checkPermissionScope(
    request: CheckPermissionRequest,
    metadata: Metadata,
    ...rest: any
  ): Promise<CheckPermissionResponse> {
    throw new Error('Method not implemented.')
  }
}
