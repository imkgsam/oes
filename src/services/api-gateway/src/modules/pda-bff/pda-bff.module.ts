import { Module } from '@nestjs/common'
import { AuthBffModule } from '../auth-bff/auth-bff.module'
import { PdaDeviceEnrollmentUseCase } from './application/use-cases/pda-device-enrollment.use-case'
import { PdaDeviceHeartbeatUseCase } from './application/use-cases/pda-device-heartbeat.use-case'
import { PdaDeviceLogsUseCase } from './application/use-cases/pda-device-logs.use-case'
import { PdaSessionBootstrapUseCase } from './application/use-cases/pda-session-bootstrap.use-case'
import { PdaTerminalDeviceAdapter } from './infrastructure/downstream/terminal-device-service/pda-terminal-device.adapter'
import { PdaDeviceController } from './interfaces/http/controllers/pda-device.controller'
import { PdaSessionController } from './interfaces/http/controllers/pda-session.controller'
import { PdaDiagnosticsModule } from './pda-diagnostics.module'

@Module({
  imports: [AuthBffModule, PdaDiagnosticsModule],
  controllers: [PdaSessionController, PdaDeviceController],
  providers: [
    PdaTerminalDeviceAdapter,
    PdaDeviceEnrollmentUseCase,
    PdaSessionBootstrapUseCase,
    PdaDeviceHeartbeatUseCase,
    PdaDeviceLogsUseCase
  ]
})
// Wires the PDA-specific BFF surface while reusing existing auth/session application services.
export class PdaBffModule {}
