import { Injectable } from '@nestjs/common'
import { OperatorContextPayload, OperatorPermissionResolver } from '../types'

@Injectable()
export class DenyAllOperatorPermissionResolver implements OperatorPermissionResolver {
  async resolvePermissions(operatorContext: OperatorContextPayload): Promise<string[]> {
    void operatorContext
    return []
  }
}
