import { Inject, Injectable } from '@nestjs/common'
import { QueryScopeBuilder } from './query-scope-builder.interface'
import {
  AUTHORIZATION_QUERY_SCOPE_BUILDERS,
  AuthorizationQueryScopeRequest
} from './query-scope.types'

// Routes auth-service query scope requests to the matching resource-specific builder.
@Injectable()
export class AuthorizationQueryScopeService {
  constructor(
    @Inject(AUTHORIZATION_QUERY_SCOPE_BUILDERS)
    private readonly builders: QueryScopeBuilder[]
  ) {}

  build<TScope>(request: AuthorizationQueryScopeRequest): TScope {
    const builder = this.builders.find((candidate) => candidate.supports(request))

    if (!builder) {
      throw new Error(
        `No query scope builder registered for ${request.resource}:${request.action}`
      )
    }

    return builder.build(request) as TScope
  }
}
