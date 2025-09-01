import { Module } from '@nestjs/common'
import { CommonJwtModule } from '@oes/common/modules/jwt/jwt.module'

@Module({
  imports: [CommonJwtModule]
})
export class TokenModule {}
