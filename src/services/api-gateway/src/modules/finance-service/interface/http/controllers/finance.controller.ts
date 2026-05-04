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
  AllocatePaymentToPayableDto,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeDto,
  CreateFinancialAccountDto,
  CreatePayableScheduleFromPurchaseOrderDto,
  CreatePaymentRequestDto,
  CreateReceivableScheduleFromSalesOrderDto,
  DecidePaymentRequestDto,
  ExecutePaymentRequestDto,
  GetExchangeRateDto,
  ImportAccountTransactionsDto,
  RecordAccountTransactionDto,
  RegisterCustomerFinancialAccountDto,
  SearchAccountTransactionsDto,
  SearchFinancialAccountsDto,
  SearchPayableSchedulesDto,
  SearchPaymentAllocationsDto,
  SearchPaymentExecutionsDto,
  SearchPaymentRequestsDto,
  SearchReceivableSchedulesDto,
  SetExchangeRateDto,
  SetFinanceReleaseSignalDto,
  UpdateFinancialAccountBasicsDto
} from '../dtos/finance.dto'

@ApiBearerAuth('JWT')
@ApiTags('finance')
@Controller('finance/tenants/:tenantId')
// Exposes the tenant-scoped finance phase 1A/1B BFF surface without widening the underlying finance-service contract.
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
  @ApiOperation({ summary: 'Search finance payment allocations linked to receivable or payable schedules' })
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

  @Get('payable-schedules')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.READ_PAYABLE])
  @ApiOperation({ summary: 'Search finance payable schedules for the phase 1B finance workspace' })
  // searchPayableSchedules exposes finance-owned payable summaries without leaking finance-service internals.
  async searchPayableSchedules(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPayableSchedulesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchPayableSchedules(tenantId, query, source)
  }

  @Get('payable-schedules/:payableScheduleId')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.READ_PAYABLE])
  @ApiOperation({ summary: 'Get one finance payable schedule detail snapshot' })
  // getPayableSchedule exposes one payable schedule detail while preserving payable truth ownership in finance-service.
  async getPayableSchedule(
    @Param('tenantId') tenantId: string,
    @Param('payableScheduleId') payableScheduleId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.getPayableSchedule(tenantId, payableScheduleId, source)
  }

  @Get('payment-requests')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.READ_PAYABLE])
  @ApiOperation({ summary: 'Search finance payment requests for phase 1B payment governance' })
  // searchPaymentRequests exposes payment request summaries as governance records, not payable truth.
  async searchPaymentRequests(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPaymentRequestsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchPaymentRequests(tenantId, query, source)
  }

  @Get('payment-executions')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.READ_PAYABLE])
  @ApiOperation({ summary: 'Search finance payment execution records without exposing account balances' })
  // searchPaymentExecutions exposes payment execution records without turning them into real account transactions.
  async searchPaymentExecutions(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPaymentExecutionsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.searchPaymentExecutions(tenantId, query, source)
  }

  @Post('payable-schedules/from-purchase-order')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYABLE_FROM_PURCHASE_ORDER])
  @ApiOperation({ summary: 'Create one finance payable schedule from a controlled purchase-order summary' })
  @ApiBody({ type: CreatePayableScheduleFromPurchaseOrderDto })
  // createPayableScheduleFromPurchaseOrder forwards PO-derived payable creation to finance-service without touching Procurement runtime.
  async createPayableScheduleFromPurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Body() body: CreatePayableScheduleFromPurchaseOrderDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.createPayableScheduleFromPurchaseOrder(tenantId, body, source)
  }

  @Post('payable-schedules/from-purchase-order-change')
  @PermissionCheckAll([
    FINANCE_MANAGEMENT_PERMISSION_CODES.ADJUST_PAYABLE_FROM_PURCHASE_ORDER_CHANGE
  ])
  @ApiOperation({ summary: 'Apply one controlled purchase-order change to finance payable schedules' })
  @ApiBody({ type: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeDto })
  // applyPayableScheduleAdjustmentFromPurchaseOrderChange forwards PO-change adjustments without mutating PO owner truth.
  async applyPayableScheduleAdjustmentFromPurchaseOrderChange(
    @Param('tenantId') tenantId: string,
    @Body() body: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.applyPayableScheduleAdjustmentFromPurchaseOrderChange(
      tenantId,
      body,
      source
    )
  }

  @Post('payment-requests')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_REQUEST])
  @ApiOperation({ summary: 'Create one phase 1B payment request without changing payable truth' })
  @ApiBody({ type: CreatePaymentRequestDto })
  // createPaymentRequest forwards a payment governance command without making PaymentRequest the payable source of truth.
  async createPaymentRequest(
    @Param('tenantId') tenantId: string,
    @Body() body: CreatePaymentRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.createPaymentRequest(tenantId, body, source)
  }

  @Post('payment-requests/:paymentRequestId/decisions')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.DECIDE_PAYMENT_REQUEST])
  @ApiOperation({ summary: 'Approve or reject one phase 1B payment request' })
  @ApiBody({ type: DecidePaymentRequestDto })
  // decidePaymentRequest forwards approval decisions without implying money has moved.
  async decidePaymentRequest(
    @Param('tenantId') tenantId: string,
    @Param('paymentRequestId') paymentRequestId: string,
    @Body() body: DecidePaymentRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.decidePaymentRequest(tenantId, paymentRequestId, body, source)
  }

  @Post('payment-requests/:paymentRequestId/executions')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_EXECUTION])
  @ApiOperation({ summary: 'Record one phase 1B payment execution without creating account-transaction truth' })
  @ApiBody({ type: ExecutePaymentRequestDto })
  // executePaymentRequest forwards execution records while keeping AccountTransaction as separate funds truth.
  async executePaymentRequest(
    @Param('tenantId') tenantId: string,
    @Param('paymentRequestId') paymentRequestId: string,
    @Body() body: ExecutePaymentRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.executePaymentRequest(tenantId, paymentRequestId, body, source)
  }

  @Post('payment-allocations/allocate-to-payable')
  @PermissionCheckAll([FINANCE_MANAGEMENT_PERMISSION_CODES.CREATE_PAYMENT_ALLOCATION])
  @ApiOperation({ summary: 'Allocate one real outflow transaction to payable schedule lines' })
  @ApiBody({ type: AllocatePaymentToPayableDto })
  // allocatePaymentToPayable forwards real outflow allocations to finance-service payable lines.
  async allocatePaymentToPayable(
    @Param('tenantId') tenantId: string,
    @Body() body: AllocatePaymentToPayableDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.financeService.allocatePaymentToPayable(tenantId, body, source)
  }
}
