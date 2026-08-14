import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { ExceptionFactory } from '@oes/common/exceptions'
import { ITEM_MASTER_UNAUTHENTICATED } from '../../common/errors/item-master.errors'

/** ItemMasterRpcContextGuard maps only the verified ExecutionToken tenant into the legacy application input shape. */
@Injectable()
export class ItemMasterRpcContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const data = context.switchToRpc().getData()
    const tenantId = getAuthenticatedGrpcRequestContext(data)?.verifiedExecutionToken?.tenantId
    if (!tenantId || !data || typeof data !== 'object') {
      throw ExceptionFactory.application(ITEM_MASTER_UNAUTHENTICATED, {
        reason: 'verified tenant execution context is missing'
      })
    }
    Object.assign(data as object, { tenantId })
    return true
  }
}
