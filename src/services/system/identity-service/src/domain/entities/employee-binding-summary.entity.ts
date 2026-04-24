/** EmployeeBindingSummaryEntity represents the identity-owned account-to-employee binding fact. */
export class EmployeeBindingSummaryEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly employeeId: string
  ) {}
}
