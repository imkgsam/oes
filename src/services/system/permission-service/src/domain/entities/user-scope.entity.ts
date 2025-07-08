import { ScopeResourceType } from '../enums/scope-resource-type.enum';

export class UserScope {
  constructor(
    public readonly id: string,
    public userId: string,
    public permissionCode: string,
    public resourceType: ScopeResourceType,
    public resourceId: string,
  ) { }

  matches(resourceType: ScopeResourceType, resourceId: string): boolean {
    return this.resourceType === resourceType && this.resourceId === resourceId;
  }
}
