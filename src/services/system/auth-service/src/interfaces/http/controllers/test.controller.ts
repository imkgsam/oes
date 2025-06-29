import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {

  @Get()
  ping() {
    return "pong"
  }

  @Get("/2")
  ping2() {
    return "pong2"
  }
}
