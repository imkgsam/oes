import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { InjectServiceClient } from '../../rpc/clients/client.decorator'
import { ClientProxy } from '@nestjs/microservices'
import { CommonJwtService } from '../jwt/jwt.service'
import { createSystemException } from '../../core/exceptions'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator'
import { GLOBAL_EXCEPTIONS } from '../../constants/exceptions'

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
export class GatewayJwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: CommonJwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (isPublic) {
      // 当接口标记为public，直接放行，不验证token
      return true
    }
    //获取token
    if (context.getType() !== 'http') return false
    const req = context.switchToHttp().getRequest()
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false
    const token = authHeader.slice(7)
    //token 缺失
    if (!token) {
      throw createSystemException(GLOBAL_EXCEPTIONS.SECURITY_EXCEPTIONS.JWT_EXCEPTIONS.JWT_MISSING)
    }
    try {
      const payload = await this.jwtService.verifyAsync(token)
      req['user'] = payload
    } catch (error) {
      throw createSystemException(GLOBAL_EXCEPTIONS.SECURITY_EXCEPTIONS.JWT_EXCEPTIONS.JWT_INVALID)
    }
    return true
  }
}
