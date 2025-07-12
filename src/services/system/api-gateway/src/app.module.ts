import { Module } from '@nestjs/common'
import { JwtModule } from './common/services/jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { AuthServiceModule } from './modules/auth-service.module'
import { PermissionServiceModule } from 'src/modules/permission-service.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule,
    AuthServiceModule,
    PermissionServiceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
