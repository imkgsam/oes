import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { PermissionOnboardingGrantPort } from '../../application/ports'

/** UnavailablePermissionOnboardingGrantAdapter marks permission grant as mock-only until its proto lands. */
@Injectable()
export class UnavailablePermissionOnboardingGrantAdapter implements PermissionOnboardingGrantPort {
  async grantInitialAccessForEmployeeAccount(): Promise<{ grantId?: string }> {
    throw new ServiceUnavailableException('permission onboarding grant proto is not realized yet')
  }
}
