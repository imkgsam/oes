import { Injectable } from '@nestjs/common'
import { JwtService as NestJwtService } from '@nestjs/jwt'

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async sign(payload: any, options?: any): Promise<string> {
    return this.jwtService.signAsync(payload, options)
  }

  async verify(token: string) {
    return this.jwtService.verifyAsync(token)
  }
}
