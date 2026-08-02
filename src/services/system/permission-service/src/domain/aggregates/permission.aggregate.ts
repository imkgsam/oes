// File: src/services/system/permission-service/src/domain/aggregates/permission.aggregate.ts

import { PermissionModule } from '../enums/permission-module.enum'
import { PermissionKind } from '../enums/permission-kind.enum'

/** Permission is the role-assignability-aware domain representation of a stable permission code. */
export class Permission {
  constructor(
    public readonly id: string,
    public code: string,
    public module: PermissionModule,
    public description?: string,
    public readonly kind: PermissionKind = PermissionKind.BUSINESS,
    public readonly externalApiEligible = false
  ) {}

  matchesModule(module: PermissionModule): boolean {
    return this.module === module
  }

  moveToModule(module: PermissionModule): void {
    this.module = module
  }

  updateDescription(description?: string): void {
    this.description = description
  }
}
