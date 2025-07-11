import { Body, Controller, Get, Post } from '@nestjs/common'
import { CreatePermissionDto } from 'src/application/dtos/permission.dto'
import { PermissionService } from 'src/application/services/permission.service'
import { CreatePermissionUseCase } from 'src/application/use-cases/permission.use-case'

@Controller('permissions')
export class HttpPermissionController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly permissionService: PermissionService,
  ) {}

  @Post()
  CreatePermission(@Body() dto: CreatePermissionDto) {
    return this.createPermissionUseCase.execute(dto)
  }

  @Get('/permissions')
  async GetAllPermissions() {
    return this.permissionService.getAllPermissions()
  }
}
