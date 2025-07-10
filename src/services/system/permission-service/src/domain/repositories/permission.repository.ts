import { Permission } from '../entities/permission.entity';

export abstract class PermissionRepository {
  abstract findById(id: string): Promise<Permission | null>;
  abstract findByCode(code: string): Promise<Permission | null>;
  abstract create(permission: Permission): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findAllByModule(module: string): Promise<Permission[]>;
}