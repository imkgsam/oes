import { Role } from '../entities/role.entity';

export abstract class RoleRepository {
  abstract findById(id: string): Promise<Role | null>;
  abstract findAll(): Promise<Role[]>;
  abstract save(role: Role): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
