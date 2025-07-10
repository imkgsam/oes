
import { Permission as PrismaPermission } from "prisma/generated/prisma";

export class Permission {
  constructor(
    public readonly id: string,
    public code: string,
    public module: string,
    public description?: string | "",
  ) { }

  static fromPrisma(prismaPermission: PrismaPermission): Permission {
    return new Permission(
      prismaPermission.id,
      prismaPermission.code,
      prismaPermission.module,
      prismaPermission.description || "",
    )
  }

  matchesModule(module: string): boolean {
    return this.module === module;
  }

}
