// common/clients/permission-client.provider.ts
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Provider } from '@nestjs/common';
import { MicroservicesList } from '../constants/microservices-list';


export const PermissionClientProvider: Provider = {
  provide: MicroservicesList.PERMISSION_SERVICE,
  useFactory: () =>
    ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: process.env.PERMISSION_HOST || 'localhost',
        port: parseInt(process.env.PERMISSION_TCP_PORT || '9302'),
      },
    }),
};
