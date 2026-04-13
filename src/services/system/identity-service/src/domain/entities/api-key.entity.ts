export class ApiKeyEntity {
  constructor(
    public readonly id: string,
    public readonly serviceAccountId: string,
    public readonly keyCode: string,
    public readonly status: string,
    public readonly expiresAt: Date | null,
    public readonly lastUsedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string | null,
    public readonly revokedAt: Date | null,
    public readonly revokedBy: string | null
  ) {}
}
