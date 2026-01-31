import { Permission } from '../entities/permission.entity'

export abstract class PermissionRepository {
  abstract findByAccountIdAndCode(accountId: string, code: string): Promise<Permission | null>
}
