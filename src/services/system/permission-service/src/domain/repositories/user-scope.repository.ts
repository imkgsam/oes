import { UserScope } from '../entities/user-scope.entity';

export abstract class UserScopeRepository {
  abstract findByUserId(userId: string): Promise<UserScope[]>;
  abstract add(scope: UserScope): Promise<void>;
  abstract remove(id: string): Promise<void>;
}