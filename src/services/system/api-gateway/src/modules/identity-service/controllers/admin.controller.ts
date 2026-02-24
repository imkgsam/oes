import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IdentityServiceService } from '../identity-service.service'

@ApiBearerAuth('JWT')
@ApiTags('identity')
@Controller('identity/admin')
export class AdminController {
  constructor(private readonly identityService: IdentityServiceService) {}

  @Get('user/all')
  @ApiOperation({ summary: 'List all users (admin)' })
  async getAllUsers() {
    return this.identityService.getAllUsers()
  }
}
