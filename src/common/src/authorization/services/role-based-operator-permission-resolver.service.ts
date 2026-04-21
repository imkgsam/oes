import { Injectable } from '@nestjs/common'
import { PermissionServicePermissionReadAdaptor } from '../adaptors'
import { OperatorContextPayload, OperatorPermissionResolver } from '../types'

@Injectable()
export class RoleBasedOperatorPermissionResolver implements OperatorPermissionResolver {
  constructor(
    private readonly permissionReadAdaptor: PermissionServicePermissionReadAdaptor
  ) {}

  async resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]> {
    return this.permissionReadAdaptor.listPermissionCodesByOperatorContext(
      operatorContext
    )
  }
}
