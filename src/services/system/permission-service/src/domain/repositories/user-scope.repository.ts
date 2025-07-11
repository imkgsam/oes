import { UserScope } from '../entities/user-scope.entity'

export abstract class UserScopeRepository {
  abstract findByUserId(userId: string): Promise<UserScope[]>
  abstract add(scope: UserScope): Promise<UserScope>
  abstract remove(id: string): Promise<UserScope>
}
