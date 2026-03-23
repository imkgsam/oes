export class AccountOrgMembershipEntity {
  constructor(
    public readonly id: string,
    public readonly accountId: string,
    public readonly orgId: string,
    public readonly orgName: string | null,
    public readonly orgType: string | null,
    public readonly relationType: string,
    public readonly isPrimary: boolean
  ) {}
}
