/** RoleNavigationVisibility records whether a role can see an entry in a terminal. */
export class RoleNavigationVisibility {
  constructor(
    public readonly roleId: string,
    public readonly entryKey: string,
    public readonly terminal: string,
    public readonly enabled: boolean
  ) {}
}
