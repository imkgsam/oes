import { Injectable } from '@nestjs/common'
import {
  buildSystemQueryScope,
  SystemQueryScope
} from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

@Injectable()
export class RoleTemplateQueryScopeBuilder implements QueryScopeBuilder<SystemQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return (
      (request.resource === 'role_template' ||
        request.resource === 'role_template_permission') &&
      request.action === 'list'
    )
  }

  build(request: AuthorizationQueryScopeRequest): SystemQueryScope {
    return buildSystemQueryScope(
      request.operatorScope,
      'template list requires system scope'
    )
  }
}
