import { Module } from '@nestjs/common'
import { CommonJwtModule } from '@oes/common/auth'

@Module({
  imports: [CommonJwtModule]
})
export class TokenModule {}
