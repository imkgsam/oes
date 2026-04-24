import { OnboardingGrantRequestEntity } from '../entities/onboarding-grant-request.entity'

export interface OnboardingGrantRequestRepository {
  createPending(input: {
    idempotencyKey: string
    tenantId: string
    accountId: string
    roleIds: string[]
    fingerprint: string
  }): Promise<OnboardingGrantRequestEntity>
  findByIdempotencyKey(idempotencyKey: string): Promise<OnboardingGrantRequestEntity | null>
  markSucceeded(input: {
    idempotencyKey: string
    tenantId: string
    accountId: string
    roleIds: string[]
    fingerprint: string
  }): Promise<OnboardingGrantRequestEntity>
}
