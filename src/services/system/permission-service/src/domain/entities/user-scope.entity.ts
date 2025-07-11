import { ScopeResourceType } from '../enums/scope-resource-type.enum'
import { UserScope as PrismaUserScope } from 'prisma/generated/prisma'
export class UserScope {
  constructor(
    public readonly id: string,
    public userId: string,
    public permissionCode: string,
    public resourceType: ScopeResourceType,
    public resourceId: string,
  ) {}

  static fromPrisma(prisma: PrismaUserScope): UserScope {
    return new UserScope(
      prisma.id,
      prisma.userId,
      prisma.permissionCode,
      prisma.resourceType as ScopeResourceType,
      prisma.resourceId,
    )
  }
  // matches(resourceType: ScopeResourceType, resourceId: string): boolean {
  //   return this.resourceType === resourceType && this.resourceId === resourceId;
  // }
}
