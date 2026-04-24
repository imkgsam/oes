import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { IdentityEmployeeBindingPort } from '../../application/ports'

/** UnavailableIdentityEmployeeBindingAdapter marks identity binding as mock-only until its proto lands. */
@Injectable()
export class UnavailableIdentityEmployeeBindingAdapter implements IdentityEmployeeBindingPort {
  async bindAccountToEmployee(): Promise<{ accountId: string }> {
    throw new ServiceUnavailableException('identity employee binding proto is not realized yet')
  }
}
