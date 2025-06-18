import { Controller, Get,HostParam,Redirect } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({host:':prefix.localhost'})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo(@HostParam('prefix') prefix:string): string {
    console.log(prefix)
    return prefix;
  }

  @Get('/hello2')
  getHello2(): string {
    return this.appService.getHello2();
  }

  @Get('/hello3')
  ttt(): string {
    return this.appService.getHello3();
  }
}
