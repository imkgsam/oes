import { Body, Controller, Post } from '@nestjs/common';
import { CreateNewUserDto } from 'src/application/dtos/create-new-user.dto';
import { AuthService } from 'src/application/services/auth-service';

@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) { }


  @Post('/create-new-user')
  async createNewUser(@Body() dto: CreateNewUserDto) {
    return this.authService.create(dto)
  }
}
