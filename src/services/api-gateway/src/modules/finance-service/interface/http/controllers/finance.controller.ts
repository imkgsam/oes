import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  FINANCE_MANAGEMENT_PERMISSION_CODES,
  PermissionCheckAll
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { FinanceService } from '../../../finance.service'
import {
  AllocatePaymentToReceivableDto,
  CreateFinancialAccountDto,
  CreateReceivableScheduleFromSalesOrderDto,
  GetExchangeRateDto,
  ImportAccountTransactionsDto,
  RecordAccountTransactionDto,
  RegisterCustomerFinancialAccountDto,
  SearchAccountTransactionsDto,
  SearchFinancialAccountsDto,
  SearchPaymentAllocationsDto,
  SearchReceivableSchedulesDto,
  SetExchangeRateDto,
  SetFinanceReleaseSignalDto,
  UpdateFinancialAccountBasicsDto
} from '../dtos/finance.dto'

@ApiBearerAuth('JWT')
@ApiTags('finance')
@Controller('finance/tenants/:tenantId')
// Exposes the tenant-scoped finance phase 1A BFF surface without widening the underlying finance-service contract.
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_FINANCIAL_ACCOUNT])
  @ApiOperation({ summary: 'Search finance company accounts for the phase 1A finance workspace' })
  async searchFinancialAccounts(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchFinancialAccountsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchFinancialAccounts(tenantId, query, source)
  }

  @Get('accounts/:financialAccountId')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCIAL_ACCOUNT])
  @ApiOperation({ summary: 'Get one finance company-account detail snapshot' })
  async getFinancialAccount(
    @Param('tenantId') tenantId: string,
    @Param('financialAccountId') financialAccountId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.getFinancialAccount(tenantId, financialAccountId, source)
  }

  @Get('account-transactions')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_ACCOUNT_TRANSACTION])
  @ApiOperation({ summary: 'Search finance real account transactions for the phase 1A finance workspace' })
  async searchAccountTransactions(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchAccountTransactionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchAccountTransactions(tenantId, query, source)
  }

  @Post('accounts')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_FINANCIAL_ACCOUNT])
  @ApiOperation({ summary: 'Create one finance company account' })
  @ApiBody({ type: CreateFinancialAccountDto })
  async createFinancialAccount(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateFinancialAccountDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.createFinancialAccount(tenantId, body, source)
  }

  @Put('accounts/:financialAccountId/basics')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.UPDATE_FINANCIAL_ACCOUNT_BASICS])
  @ApiOperation({ summary: 'Update one finance company-account basic snapshot' })
  @ApiBody({ type: UpdateFinancialAccountBasicsDto })
  async updateFinancialAccountBasics(
    @Param('tenantId') tenantId: string,
    @Param('financialAccountId') financialAccountId: string,
    @Body() body: UpdateFinancialAccountBasicsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.updateFinancialAccountBasics(
      tenantId,
      financialAccountId,
      body,
      source
    )
  }

  @Post('accounts/:financialAccountId/transactions/import')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.IMPORT_ACCOUNT_TRANSACTION])
  @ApiOperation({ summary: 'Import finance real account transactions into one company account' })
  @ApiBody({ type: ImportAccountTransactionsDto })
  async importAccountTransactions(
    @Param('tenantId') tenantId: string,
    @Param('financialAccountId') financialAccountId: string,
    @Body() body: ImportAccountTransactionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.importAccountTransactions(tenantId, financialAccountId, body, source)
  }

  @Post('accounts/:financialAccountId/transactions')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.RECORD_ACCOUNT_TRANSACTION])
  @ApiOperation({ summary: 'Record one finance real account transaction manually' })
  @ApiBody({ type: RecordAccountTransactionDto })
  async recordAccountTransaction(
    @Param('tenantId') tenantId: string,
    @Param('financialAccountId') financialAccountId: string,
    @Body() body: RecordAccountTransactionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.recordAccountTransaction(tenantId, financialAccountId, body, source)
  }

  @Post('customer-financial-accounts')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.REGISTER_CUSTOMER_FINANCIAL_ACCOUNT])
  @ApiOperation({ summary: 'Register one finance customer remittance account reference' })
  @ApiBody({ type: RegisterCustomerFinancialAccountDto })
  async registerCustomerFinancialAccount(
    @Param('tenantId') tenantId: string,
    @Body() body: RegisterCustomerFinancialAccountDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.registerCustomerFinancialAccount(tenantId, body, source)
  }

  @Get('exchange-rate')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.GET_EXCHANGE_RATE])
  @ApiOperation({ summary: 'Get one finance standard exchange rate by currency pair and effective time' })
  async getExchangeRate(
    @Param('tenantId') tenantId: string,
    @Query() query: GetExchangeRateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.getExchangeRate(tenantId, query, source)
  }

  @Post('exchange-rates')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.SET_EXCHANGE_RATE])
  @ApiOperation({ summary: 'Write one finance standard exchange rate record' })
  @ApiBody({ type: SetExchangeRateDto })
  async setExchangeRate(
    @Param('tenantId') tenantId: string,
    @Body() body: SetExchangeRateDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.setExchangeRate(tenantId, body, source)
  }

  @Get('receivable-schedules')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVABLE_SCHEDULE])
  @ApiOperation({ summary: 'Search finance receivable schedules for the phase 1A finance workspace' })
  async searchReceivableSchedules(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchReceivableSchedulesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchReceivableSchedules(tenantId, query, source)
  }

  @Get('receivable-schedules/:receivableScheduleId')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.GET_RECEIVABLE_SCHEDULE])
  @ApiOperation({ summary: 'Get one finance receivable schedule detail snapshot' })
  async getReceivableSchedule(
    @Param('tenantId') tenantId: string,
    @Param('receivableScheduleId') receivableScheduleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.getReceivableSchedule(tenantId, receivableScheduleId, source)
  }

  @Get('finance-release-signals/:salesOrderId')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.GET_FINANCE_RELEASE_SIGNAL])
  @ApiOperation({ summary: 'Get the current finance release signal for one sales order' })
  async getFinanceReleaseSignal(
    @Param('tenantId') tenantId: string,
    @Param('salesOrderId') salesOrderId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.getFinanceReleaseSignal(tenantId, salesOrderId, source)
  }

  @Post('receivable-schedules/from-sales-order')
  @PermissionCheckAll([
    FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVABLE_SCHEDULE_FROM_SALES_ORDER
  ])
  @ApiOperation({ summary: 'Create one finance receivable schedule from an established sales order summary' })
  @ApiBody({ type: CreateReceivableScheduleFromSalesOrderDto })
  async createReceivableScheduleFromSalesOrder(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateReceivableScheduleFromSalesOrderDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.createReceivableScheduleFromSalesOrder(tenantId, body, source)
  }

  @Post('finance-release-signals/:salesOrderId')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.SET_FINANCE_RELEASE_SIGNAL])
  @ApiOperation({ summary: 'Write one finance release signal for a sales order' })
  @ApiBody({ type: SetFinanceReleaseSignalDto })
  async setFinanceReleaseSignal(
    @Param('tenantId') tenantId: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() body: SetFinanceReleaseSignalDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.setFinanceReleaseSignal(tenantId, salesOrderId, body, source)
  }

  @Get('payment-allocations')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.LIST_PAYMENT_ALLOCATION])
  @ApiOperation({ summary: 'Search finance payment allocations linked to receivable schedules' })
  async searchPaymentAllocations(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPaymentAllocationsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchPaymentAllocations(tenantId, query, source)
  }

  @Post('payment-allocations/allocate-to-receivable')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.ALLOCATE_PAYMENT_TO_RECEIVABLE])
  @ApiOperation({ summary: 'Allocate one real inflow transaction to receivable schedule lines' })
  @ApiBody({ type: AllocatePaymentToReceivableDto })
  async allocatePaymentToReceivable(
    @Param('tenantId') tenantId: string,
    @Body() body: AllocatePaymentToReceivableDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.allocatePaymentToReceivable(tenantId, body, source)
  }
}
