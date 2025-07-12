import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [],
  controllers: [],
  exports: [],
})
export class RoleModule {}
