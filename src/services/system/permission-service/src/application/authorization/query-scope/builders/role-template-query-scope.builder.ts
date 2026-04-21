import { Injectable } from '@nestjs/common'
import {
  buildSystemQueryScope,
  SystemQueryScope
} from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

@Injectable()
// Keeps the global template catalog readable for instantiate flows while reserving template-permission reads for system scope.
export class RoleTemplateQueryScopeBuilder
  implements QueryScopeBuilder<Record<string, never> | SystemQueryScope>
{
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return (
      (request.resource === 'role_template' ||
        request.resource === 'role_template_permission') &&
      request.action === 'list'
    )
  }

  build(request: AuthorizationQueryScopeRequest): Record<string, never> | SystemQueryScope {
    if (request.resource === 'role_template') {
      return {}
    }

    return buildSystemQueryScope(
      request.operatorScope,
      'template list requires system scope'
    )
  }
}
