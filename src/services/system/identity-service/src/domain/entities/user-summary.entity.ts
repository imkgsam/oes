export class UserSummaryEntity {
  constructor(
    public readonly id: string,
    public readonly username: string | null,
    public readonly personalEmail: string | null,
    public readonly personalPhone: string | null,
    public readonly isActive: boolean
  ) {}
}
