/** OnboardingGrantRequestEntity records one permission-owned onboarding grant request and its idempotent outcome. */
export class OnboardingGrantRequestEntity {
  constructor(
    public readonly id: string | null,
    public readonly idempotencyKey: string,
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly roleIds: string[],
    public readonly fingerprint: string,
    public readonly status: 'PENDING' | 'SUCCEEDED',
    public readonly bindingIds: string[] = []
  ) {}
}
