import { Controller, Get } from '@nestjs/common';

@Controller('permission')
export class PermissionController {
  constructor(){

  }


    
  @Get('/permissions')
  async GetAllPermissions(conditions: Object[], page:Number){

  }
}
