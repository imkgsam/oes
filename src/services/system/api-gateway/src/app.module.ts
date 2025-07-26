import { Module } from '@nestjs/common'
import { JwtModule } from './common/services/jwt/jwt.module'
import { ConfigModule } from '@nestjs/config'
import { AuthServiceModule } from './modules/auth-service/auth-service.module'
import { PermissionServiceModule } from 'src/modules/permission-service/permission-service.module'
import { TraceModule } from '@oes/common/modules/trace/trace.module'
import { IdentityServiceModule } from './modules/identity-service/identity-service.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule,
    AuthServiceModule,
    PermissionServiceModule,
    TraceModule.forHttp(),
    IdentityServiceModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
