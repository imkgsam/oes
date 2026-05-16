import { Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { AuthBffModule } from '../auth-bff/auth-bff.module'
import { TerminalDeviceAdminUseCase } from './application/use-cases/terminal-device-admin.use-case'
import { TerminalDeviceAdminAdapter } from './infrastructure/downstream/terminal-device-admin.adapter'
import { TerminalDeviceAdminController } from './interfaces/http/controllers/terminal-device-admin.controller'

@Module({
  imports: [
    AuthBffModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.AUTH, SERVICE_NAMES.TERMINAL_DEVICE])
  ],
  controllers: [TerminalDeviceAdminController],
  providers: [TerminalDeviceAdminUseCase, TerminalDeviceAdminAdapter]
})
// Wires the tenant-web Admin Terminal Device BFF surface to auth and terminal-device downstream services.
export class TerminalDeviceAdminBffModule {}
