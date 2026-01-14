import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ServiceKeys } from '../modules/clients/service-map'
import { InjectServiceClient } from '../modules/clients/client.decorator'
import { ClientProxy } from '@nestjs/microservices'

export enum AccountHolderType {
  USER = 'USER',
  SERVICE = 'SERVICE'
}
export interface UserAccountContext {
  holderType: AccountHolderType.USER
  holderId: string // identity.UserAccount.id
  userId: string // identity.User.id
  tenantId: string // identity.Tenant.id
}
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @InjectServiceClient(ServiceKeys.AUTH_TCP)
    private readonly authServiceClient: ClientProxy
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return true
  }
}
