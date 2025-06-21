import { Injectable } from "@nestjs/common";
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) { }

  sign(payload: any, options?: any): string {
    return this.jwtService.sign(payload, options)
  }

  verify(token: string): any {
    return this.jwtService.verify(token)
  }
}