import { Metadata } from '@grpc/grpc-js'
import { Injectable } from '@nestjs/common'
import {
  PermissionCheckServiceControllerMethods,
  PermissionCheckServiceController,
  CheckPermissionRequest,
  CheckPermissionResponse
} from '@oes/common/generated/permission_service/permission_check'
import { CheckAccountPermissionQuery } from '../../application/index'
import { ValidatingQueryBus } from '@oes/common/cqrs/validating-query-bus'
import { CheckAccountPermissionWithScopeQuery } from 'src/application/queries/authorization/check-account-permission-with-scope.query'

@Injectable()
@PermissionCheckServiceControllerMethods()
export class PermissionCheckController implements PermissionCheckServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async checkPermission(
    request: CheckPermissionRequest,
    metadata: Metadata,
    ...rest: any
  ): Promise<CheckPermissionResponse> {
    const pass = await this.queryBus.execute(
      new CheckAccountPermissionQuery(request.accountId, request.permissionCode)
    )
    return {
      pass,
      scopes: []
    }
  }
  async checkPermissionScope(
    request: CheckPermissionRequest,
    metadata: Metadata,
    ...rest: any
  ): Promise<CheckPermissionResponse> {
    const pass = await this.queryBus.execute(
      new CheckAccountPermissionWithScopeQuery(request.accountId, request.permissionCode)
    )
    return {
      pass,
      scopes: 
    }
  }
}
