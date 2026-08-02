import { Permission } from '../../domain/aggregates/permission.aggregate'
import { PermissionKind } from '../../domain/enums/permission-kind.enum'

/** PermissionMapper preserves persisted permission metadata at the domain repository boundary. */
export class PermissionMapper {
  static toDomain(input: any) {
    return new Permission(
      input.id,
      input.code,
      input.module,
      input.description,
      input.kind as PermissionKind,
      input.externalApiEligible
    )
  }
  static toPersistant(input: Permission) {
    return {
      id: input.id,
      code: input.code,
      module: input.module,
      description: input.description,
      kind: input.kind,
      externalApiEligible: input.externalApiEligible
    }
  }
}
