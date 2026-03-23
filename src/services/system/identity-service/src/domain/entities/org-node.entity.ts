export class OrgNodeEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly parentId: string | null,
    public readonly name: string,
    public readonly code: string | null,
    public readonly type: string,
    public readonly sortOrder: number,
    public readonly children: OrgNodeEntity[] = []
  ) {}
}
