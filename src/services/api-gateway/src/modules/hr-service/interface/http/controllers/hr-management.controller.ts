import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RequirePermissions,
  HR_MANAGEMENT_PERMISSION_CODES,
  IDENTITY_ACCOUNT_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import {
  EmployeeOfficialPhotoUploadFile,
  HrManagementService
} from '../../../hr-management.service'
import { ChangePrimaryEmploymentDto } from '../dtos/change-primary-employment.dto'
import { CreateEmployeeDto } from '../dtos/create-employee.dto'
import { CreateEmploymentDto } from '../dtos/create-employment.dto'
import { CompleteEmployeeAccessDto } from '../dtos/employee-account-access.dto'
import { EMPLOYEE_OFFICIAL_PHOTO_UPLOAD_OPTIONS } from '../dtos/employee-official-photo.dto'
import { EndEmploymentDto } from '../dtos/end-employment.dto'
import { ListEmployeesDto } from '../dtos/list-employees.dto'

@ApiBearerAuth('JWT')
@ApiTags('hr-management')
@Controller('hr-management/tenants/:tenantId')
// Exposes tenant-scoped employee and employment management endpoints through the gateway HR proxy.
export class HrManagementController {
  constructor(private readonly hrManagementService: HrManagementService) {}

  @Get('employees')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.LIST_EMPLOYEE] })
  @ApiOperation({ summary: 'List employees for the tenant HR entry' })
  async listEmployees(
    @Param('tenantId') tenantId: string,
    @Query() query: ListEmployeesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.listEmployees(
      tenantId,
      {
        keyword: query.keyword,
        lifecycleStatus: query.lifecycleStatus,
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('employees/next-code')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] })
  @ApiOperation({ summary: 'Preview the next system-owned employee code' })
  async previewNextEmployeeCode(
    @Param('tenantId') tenantId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.previewNextEmployeeCode(tenantId, source)
  }

  @Get('employees/:employeeId')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.VIEW_EMPLOYEE_DETAIL] })
  @ApiOperation({
    summary: 'Get one employee detail and employment history for the tenant HR entry'
  })
  async getEmployeeDetail(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.getEmployeeDetail(tenantId, employeeId, source)
  }

  @Get('employees/:employeeId/account-access')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.VIEW_EMPLOYEE_DETAIL] })
  @ApiOperation({ summary: 'Get one employee account and access summary in member context' })
  async getEmployeeAccountAccess(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.getEmployeeAccountAccess(tenantId, employeeId, source)
  }

  @Get('employee-user-candidates')
  @RequirePermissions({
    all: [
      HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE,
      IDENTITY_ACCOUNT_PERMISSION_CODES.CREATE_ACCOUNT
    ]
  })
  @ApiOperation({ summary: 'Find an existing user candidate for employee account binding' })
  async searchEmployeeUserCandidates(
    @Param('tenantId') tenantId: string,
    @Query('keyword') keyword: string,
    @Query('countryOrRegion') countryOrRegion: string | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.searchEmployeeUserCandidates(
      tenantId,
      { countryOrRegion, keyword },
      source
    )
  }

  @Post('employees')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] })
  @ApiOperation({ summary: 'Create one employee master record' })
  @ApiBody({ type: CreateEmployeeDto })
  async createEmployee(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateEmployeeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.createEmployee(tenantId, body, source)
  }

  @Post('employees/:employeeId/official-photo')
  @UseInterceptors(FileInterceptor('file', EMPLOYEE_OFFICIAL_PHOTO_UPLOAD_OPTIONS))
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] })
  @ApiOperation({ summary: 'Upload one HR-owned employee official photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  async uploadEmployeeOfficialPhoto(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @UploadedFile() file: EmployeeOfficialPhotoUploadFile | undefined,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.uploadEmployeeOfficialPhoto(tenantId, employeeId, file, source)
  }

  @Delete('employees/:employeeId/official-photo')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] })
  @ApiOperation({ summary: 'Remove the HR-owned employee official photo reference' })
  async removeEmployeeOfficialPhoto(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.removeEmployeeOfficialPhoto(tenantId, employeeId, source)
  }

  @Post('employees/:employeeId/employments')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYMENT] })
  @ApiOperation({ summary: 'Create one employment under the selected employee' })
  @ApiBody({ type: CreateEmploymentDto })
  async createEmployment(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateEmploymentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.createEmployment(tenantId, employeeId, body, source)
  }

  @Post('employees/:employeeId/employments/:employmentId/end')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.END_EMPLOYMENT] })
  @ApiOperation({ summary: 'End one active employment in the current tenant employee scope' })
  @ApiBody({ type: EndEmploymentDto })
  async endEmployment(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('employmentId') employmentId: string,
    @Body() body: EndEmploymentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.endEmployment(tenantId, employeeId, employmentId, body, source)
  }

  @Post('employees/:employeeId/employments/change-primary')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CHANGE_PRIMARY_EMPLOYMENT] })
  @ApiOperation({ summary: 'Change the selected employee primary employment' })
  @ApiBody({ type: ChangePrimaryEmploymentDto })
  async changePrimaryEmployment(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: ChangePrimaryEmploymentDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.changePrimaryEmployment(tenantId, employeeId, body, source)
  }

  @Post('employees/:employeeId/account-access')
  @RequirePermissions({ all: [HR_MANAGEMENT_PERMISSION_CODES.CREATE_EMPLOYEE] })
  @ApiOperation({
    summary: 'Complete one member login enablement flow through the HR onboarding owner'
  })
  @ApiBody({ type: CompleteEmployeeAccessDto })
  async completeEmployeeAccess(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CompleteEmployeeAccessDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.hrManagementService.completeEmployeeAccess(tenantId, employeeId, body, source)
  }
}
