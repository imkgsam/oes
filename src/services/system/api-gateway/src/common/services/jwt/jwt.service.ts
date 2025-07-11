import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService as NestJwtService } from '@nestjs/jwt'

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async verify(token: string) {
    return this.jwtService.verifyAsync(token)
  }
  decodeToken(token: string) {
    return this.jwtService.decode(token)
  }
}
