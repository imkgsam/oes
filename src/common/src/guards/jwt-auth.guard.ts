import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ServiceKeys } from '../modules/clients/service-map'
import { InjectServiceClient } from '../modules/clients/client.decorator'
import { ClientProxy } from '@nestjs/microservices'
import { CommonJwtService } from '../modules/jwt/jwt.service'
import { createSystemException } from '../exceptions/exception.factory'

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
  constructor(private readonly jwtService: CommonJwtService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const token = extractToken(context)
    if (!token) {
    }
  }
}
function extractToken(ctx: ExecutionContext): string | null {
  if (ctx.getType() !== 'http') return null
  const req = ctx.switchToHttp().getRequest()
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
