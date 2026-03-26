import { Injectable } from '@nestjs/common'
import { OperatorContextPayload, OperatorPermissionResolver } from '@oes/common/security'

@Injectable()
export class AuthOperatorPermissionResolver implements OperatorPermissionResolver {
  async resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]> {
    return operatorContext.operator_permissions ?? []
  }
}

