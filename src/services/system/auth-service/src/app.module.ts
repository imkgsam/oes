import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { authKeyConfig, tokenConfig } from '@oes/common/auth'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [
    RegistryModule,
    LoggingModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [tokenConfig, authKeyConfig]
    }),
    GrpcTransportModule.forRoot({
      services: {
        'identity-service': {
          serviceName: 'identity-service',
          protoPath: 'protos/identity_query.proto',
          packageName: 'identity_service'
        },
        'permission-service': {
          serviceName: 'permission-service',
          protoPath: 'protos/permission_check.proto',
          packageName: 'permission_service'
        }
      }
    }),
    AuthModule
  ]
})
export class AppModule {}
