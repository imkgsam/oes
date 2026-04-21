/** RoleLandingPolicy records a role's preferred default entry in a terminal. */
export class RoleLandingPolicy {
  constructor(
    public readonly roleId: string,
    public readonly terminal: string,
    public readonly defaultEntryKey: string,
    public readonly priority: number,
    public readonly enabled: boolean
  ) {}
}
