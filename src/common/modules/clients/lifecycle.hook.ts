// 作用: 管理微服务客户端连接的生命周期
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { closeAllClients } from './connection-manager';

@Injectable()
export class ClientConnectionLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown(signal: string) {
    try {
      console.log(`Shutdown signal received: ${signal}`);
      await closeAllClients();
    } catch (e) {
      console.error('Error during client shutdown', e);
    }
  }
}
