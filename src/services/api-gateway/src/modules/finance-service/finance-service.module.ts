import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { FinanceManagementGrpcAdapter } from './adapters/finance-management-grpc.adapter'
import { FinanceQueryGrpcAdapter } from './adapters/finance-query-grpc.adapter'
import { FinanceController } from './interface/http/controllers/finance.controller'
import { FinanceService } from './finance.service'

@Module({
  imports: [AuthorizationModule],
  controllers: [FinanceController],
  providers: [FinanceQueryGrpcAdapter, FinanceManagementGrpcAdapter, FinanceService]
})
// FinanceServiceProxyModule wires the thin tenant finance-management BFF proxy into api-gateway.
export class FinanceServiceProxyModule {}
