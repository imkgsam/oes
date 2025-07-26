import { Body, Controller, Get, Post } from '@nestjs/common'
import { AuthServiceService } from '../auth-service.service'


@Controller('auth/admin')
export class AdminController {
  constructor(
    private readonly authService: AuthServiceService,
  ) { }

  @Get('/loginmethod/all')
  async getAllLoginMethods() {
    return this.authService.getAllLoginMethods()
  }
  @Get('/credential/all')
  async getAllCredentials() {
    return this.authService.getAllCredentials()
  }
  @Get('/otp/all')
  async getAllOtps() {
    return this.authService.getAllOTPs()
  }
}
