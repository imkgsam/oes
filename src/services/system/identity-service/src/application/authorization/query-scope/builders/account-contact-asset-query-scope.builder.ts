import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

@Injectable()
export class AccountContactAssetQueryScopeBuilder
  implements QueryScopeBuilder<TenantQueryScope>
{
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'account_contact_asset' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
