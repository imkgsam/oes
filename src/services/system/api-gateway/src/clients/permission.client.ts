import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PermissionClient {
  constructor(@Inject("PERMISSION_SERVICE") private readonly client: ClientProxy) {

  }
  async send<T>(pattern: any, data: any): Promise<T> {
    return firstValueFrom(this.client.send<T>(pattern, data))
  }
}