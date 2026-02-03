import { Permission } from 'src/domain/aggregates/permission.aggregate'

export class PermissionMapper {
  static toDomain(input: any) {
    return new Permission(input.id, input.code, input.module, input.description)
  }
  static toPersistant(input: Permission) {
    return {
      id: input.id,
      code: input.code,
      module: input.module,
      description: input.description
    }
  }
}
