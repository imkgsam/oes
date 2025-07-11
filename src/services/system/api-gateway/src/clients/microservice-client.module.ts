import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AuthClient } from './auth.client'
export const AUTH_SERVICE = 'AUTH_SERVICE'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_SERVICE,
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 9202,
        },
      },
    ]),
  ],
  providers: [AuthClient],
  exports: [AuthClient],
})
export class MicroserviceClientModule {}
