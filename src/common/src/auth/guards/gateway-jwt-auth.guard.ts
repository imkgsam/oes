import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { CommonJwtService } from '../jwt/jwt.service'
import { ExceptionFactory } from '../../core/exceptions'
import {
  JWT_MISSING,
  JWT_INVALID
} from '../../core/exceptions/exception-enums/application-exception.enum'
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator'

export enum AccountHolderType {
  USER = 'USER',
  SERVICE = 'SERVICE'
}

export interface UserAccountContext {
  holderType: AccountHolderType.USER
  holderId: string // identity.UserAccount.id
  userId: string // identity.User.id
  tenantId?: string // identity.Tenant.id; omitted for system-scope contexts
}

@Injectable()
export class GatewayJwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: CommonJwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) return true

    if (context.getType() !== 'http') return false

    const req = context.switchToHttp().getRequest()
    const authHeader = req.headers['authorization'] || req.headers['Authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ExceptionFactory.application(JWT_MISSING)
    }

    const token = authHeader.slice(7)
    if (!token) {
      throw ExceptionFactory.application(JWT_MISSING)
    }

    try {
      const payload = await this.jwtService.verifyAsync(token)
      req['user'] = payload
    } catch {
      throw ExceptionFactory.application(JWT_INVALID)
    }

    return true
  }
}
