import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminCreateUserDto } from 'src/application/dtos/admin-create-user.dto';
import { AdminService } from 'src/application/services/account.service';
import { AdminCreateUserUseCase } from 'src/application/user-cases/admin/admin-create-user.use-case';

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminCreateUserUseCase: AdminCreateUserUseCase
  ) { }


  @Get('/')
  async listAllUsers(){
  }

  @Post('/create')
  async createNewUser(@Body() dto: AdminCreateUserDto) {
    return this.adminCreateUserUseCase.execute(dto)
  }
}
