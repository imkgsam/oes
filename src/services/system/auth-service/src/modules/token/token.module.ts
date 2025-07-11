import { Module } from '@nestjs/common'
import { JwtModule } from '../../infrastructure/jwt/jwt.module'

@Module({
  imports: [JwtModule],
})
export class TokenModule {}
