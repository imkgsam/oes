import { Body, Controller, Get, Post } from '@nestjs/common'

import { IdentityServiceService } from '../identity-service.service'

@Controller('identity/admin')
export class AdminController {
  constructor(
    private readonly identityService: IdentityServiceService,
  ) { }

  @Get('/user/all')
  async getAllUsers() {
    return this.identityService.getAllUsers()
  }
}
