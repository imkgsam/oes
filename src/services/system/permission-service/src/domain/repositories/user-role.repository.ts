import { UserRole } from '../entities/user-role.entity'

export abstract class UserRoleRepository {
  abstract findByUserId(userId: string): Promise<UserRole[]>
  abstract add(userRole: UserRole): Promise<UserRole>
  abstract remove(userId: string, roleId: string): Promise<UserRole>
}
