import { UserRole } from '../entities/user-role.entity';

export abstract class UserRoleRepository {
  abstract findByUserId(userId: string): Promise<UserRole[]>;
  abstract assign(userRole: UserRole): Promise<void>;
  abstract remove(userId: string, roleId: string): Promise<void>;
}