import { Module } from '@nestjs/common';
import { PermissionController } from './controllers/permission.controller';
import { MicroserviceClientModule } from './clients/microservice-client.module';
import { JwtModule } from './common/services/jwt/jwt.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './controllers/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
