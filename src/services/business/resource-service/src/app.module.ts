import { Module } from '@nestjs/common'
import { ResourceModule } from './modules/resource.module'

@Module({
  imports: [ResourceModule],
  controllers: [],
  providers: []
})
export class AppModule {}
