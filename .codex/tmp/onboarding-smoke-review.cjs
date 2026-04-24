const { Metadata } = require('@grpc/grpc-js')
const { ClientProxyFactory, Transport } = require('@nestjs/microservices')
const { NestFactory } = require('@nestjs/core')
const { firstValueFrom } = require('rxjs')
const { resolveCommonProtoPath } = require('../../src/common/dist/contracts')
const { HR_MANAGEMENT_SERVICE_NAME } = require('../../src/common/dist/generated/hr_service/hr')
const { AppModule } = require('../../src/services/system/hr-service/dist/app.module')
const { HrOnboardingAccessService } = require('../../src/services/system/hr-service/dist/application/services/hr-onboarding-access.service')
const { PrismaClient: HrPrismaClient } = require('../../src/services/system/hr-service/prisma/generated/prisma')
const { PrismaClient: IdentityPrismaClient } = require('../../src/services/system/identity-service/prisma/generated/prisma')
const { PrismaClient: PermissionPrismaClient } = require('../../src/services/system/permission-service/prisma/generated/prisma')

const URLS = {
  hr: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/hrdb',
  identity: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/identitydb',
  permission: 'postgres://imkgsam:imkgsam@127.0.0.1:5432/permissiondb'
}

const FIXTURES = {
  operatorAccountId: '911a28e9-0d30-4dc8-a391-60bed62f5003',
  success: {
    tenantId: '1c1f7e79-e3d7-476e-9e85-3270d7f52002',
    tenantPartyId: '33f9e787-4ddc-4a6c-b55f-cceca055a193',
    partyId: 'b4e85fce-1663-4189-8871-7f27bdd65403',
    accountId: '0ec31c5c-b3d3-461b-a6e8-e99d2abdd005',
    orgUnitId: '2c1f7e79-e3d7-476e-9e85-3270d7f52002',
    roleId: '46be7eb3-cd06-48c7-bc7f-4e2c853c7005'
  },
  bindingFailure: {
    tenantId: 'ea06d4a0-6990-4ba0-ae13-fb31485c2001',
    tenantPartyId: 'ada4d9ad-05a1-4fc4-8c45-962683195353',
    partyId: '4e3f0504-b344-42fe-952e-7af65a5e18ef',
    accountId: 'cb3f1d5d-1406-4fb0-8d53-75a144093001',
    orgUnitId: 'aa06d4a0-6990-4ba0-ae13-fb31485c2001',
    roleId: '46be7eb3-cd06-48c7-bc7f-4e2c853c7001'
  },
  grantFailure: {
    tenantId: '6c737f64-5a9c-4381-bd5d-c2c7ab2b3003',
    tenantPartyId: '9422341f-c3d4-48ae-bde5-18fa2f880ec9',
    partyId: '105c1e7d-ce09-47ac-b2e9-cd56f7f886c5',
    accountId: '3d1545a0-2f9f-4130-89ea-0e0bd8e45002',
    orgUnitId: '7c737f64-5a9c-4381-bd5d-c2c7ab2b3003',
    roleId: 'missing-role-id'
  }
}

function createHrClient() {
  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      package: 'hr_service',
      protoPath: [resolveCommonProtoPath('hr_service/hr.proto')],
      url: '127.0.0.1:50055'
    }
  })
}

function createHrMetadata(traceId) {
  const metadata = new Metadata()
  metadata.set('operator-id', FIXTURES.operatorAccountId)
  metadata.set('trace-id', traceId)
  return metadata
}

async function createEmployeeAndEmployment(service, scenarioKey, fixture, created, hrDb) {
  const suffix = `${scenarioKey}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const employeeCode = `smoke_${suffix}`
  const employeeResponse = await firstValueFrom(
    service.createEmployee(
      {
        tenantId: fixture.tenantId,
        tenantPartyId: fixture.tenantPartyId,
        partyId: fixture.partyId,
        employeeCode
      },
      createHrMetadata(`trace_${scenarioKey}_create_employee`)
    )
  )

  const employmentResponse = await firstValueFrom(
    service.createEmployment(
      {
        tenantId: fixture.tenantId,
        employeeId: employeeResponse.employee.id,
        orgUnitId: fixture.orgUnitId,
        effectiveFrom: new Date().toISOString()
      },
      createHrMetadata(`trace_${scenarioKey}_create_employment`)
    )
  )

  created.employees.push(employeeResponse.employee.id)
  created.employments.push(employmentResponse.employment.id)

  const employeeRow = await hrDb.employee.findUnique({ where: { id: employeeResponse.employee.id } })
  const employmentRow = await hrDb.employment.findUnique({ where: { id: employmentResponse.employment.id } })

  return {
    employeeId: employeeResponse.employee.id,
    employmentId: employmentResponse.employment.id,
    employeeCode,
    employeeLifecycleStatus: employeeResponse.employee.lifecycleStatus,
    employmentStatus: employmentResponse.employment.status,
    employeePersisted: Boolean(employeeRow),
    employmentPersisted: Boolean(employmentRow)
  }
}

async function loadScenarioState({ hrDb, identityDb, permissionDb, fixture, employeeId, employmentId, accountId, roleId, idempotencyKey }) {
  const [access, binding, grantRequest, roleBinding, membershipCount] = await Promise.all([
    hrDb.employeeOnboardingAccess.findFirst({ where: { employeeId, employmentId } }),
    identityDb.userAccountEmployeeBinding.findFirst({ where: { employeeId, accountId } }),
    permissionDb.onboardingGrantRequest.findUnique({ where: { idempotencyKey } }),
    roleId === 'missing-role-id'
      ? Promise.resolve(null)
      : permissionDb.accountRole.findFirst({ where: { accountId, roleId, tenantId: fixture.tenantId } }),
    identityDb.userAccountOrgMembership.count({ where: { accountId } })
  ])

  return {
    access: access
      ? {
          status: access.status,
          failureReason: access.failureReason,
          accountId: access.accountId,
          grantIdempotencyKey: access.grantIdempotencyKey
        }
      : null,
    binding: binding
      ? {
          id: binding.id,
          tenantId: binding.tenantId,
          accountId: binding.accountId,
          employeeId: binding.employeeId
        }
      : null,
    grantRequest: grantRequest
      ? {
          id: grantRequest.id,
          status: grantRequest.status,
          tenantId: grantRequest.tenantId,
          accountId: grantRequest.accountId,
          roleIds: grantRequest.roleIds,
          idempotencyKey: grantRequest.idempotencyKey
        }
      : null,
    roleBinding: roleBinding
      ? {
          id: roleBinding.id,
          accountId: roleBinding.accountId,
          roleId: roleBinding.roleId,
          tenantId: roleBinding.tenantId
        }
      : null,
    membershipCount
  }
}

async function main() {
  process.env.DATABASE_URL = URLS.hr
  process.env.IDENTITY_GRPC_URL = '127.0.0.1:50052'
  process.env.PERMISSION_GRPC_URL = '127.0.0.1:50051'
  process.env.TENANT_ORG_GRPC_URL = '127.0.0.1:50054'
  process.env.NODE_ENV = 'development'

  const hrDb = new HrPrismaClient({ datasources: { db: { url: URLS.hr } } })
  const identityDb = new IdentityPrismaClient({ datasources: { db: { url: URLS.identity } } })
  const permissionDb = new PermissionPrismaClient({ datasources: { db: { url: URLS.permission } } })
  const created = { employees: [], employments: [], grantKeys: [], roleBindings: [], bindingEmployeeIds: [] }

  let app
  let hrClient

  try {
    await Promise.all([hrDb.$connect(), identityDb.$connect(), permissionDb.$connect()])
    hrClient = createHrClient()
    const hrService = hrClient.getService(HR_MANAGEMENT_SERVICE_NAME)
    app = await NestFactory.createApplicationContext(AppModule, { logger: false })
    const onboardingAccessService = app.get(HrOnboardingAccessService)

    const before = {
      successMemberships: await identityDb.userAccountOrgMembership.count({ where: { accountId: FIXTURES.success.accountId } }),
      bindingFailureMemberships: await identityDb.userAccountOrgMembership.count({ where: { accountId: FIXTURES.bindingFailure.accountId } }),
      grantFailureMemberships: await identityDb.userAccountOrgMembership.count({ where: { accountId: FIXTURES.grantFailure.accountId } })
    }

    const successBase = await createEmployeeAndEmployment(hrService, 'success', FIXTURES.success, created, hrDb)
    const successIdempotencyKey = `smoke_success_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    created.grantKeys.push(successIdempotencyKey)
    const successAccess = await onboardingAccessService.completeAccess({
      tenantId: FIXTURES.success.tenantId,
      employeeId: successBase.employeeId,
      employmentId: successBase.employmentId,
      accountId: FIXTURES.success.accountId,
      roleIds: [FIXTURES.success.roleId],
      idempotencyKey: successIdempotencyKey,
      reason: 'shared-env smoke success',
      operatorContext: { operatorId: FIXTURES.operatorAccountId, operatorType: 'HUMAN' },
      requestId: `req_${successIdempotencyKey}`,
      traceId: `trace_${successIdempotencyKey}`
    })
    const successState = await loadScenarioState({ hrDb, identityDb, permissionDb, fixture: FIXTURES.success, employeeId: successBase.employeeId, employmentId: successBase.employmentId, accountId: FIXTURES.success.accountId, roleId: FIXTURES.success.roleId, idempotencyKey: successIdempotencyKey })
    if (successState.binding) created.bindingEmployeeIds.push(successBase.employeeId)
    if (successState.roleBinding) created.roleBindings.push({ accountId: FIXTURES.success.accountId, roleId: FIXTURES.success.roleId })

    const bindingFailureBase = await createEmployeeAndEmployment(hrService, 'binding_failure', FIXTURES.bindingFailure, created, hrDb)
    const bindingFailureIdempotencyKey = `smoke_binding_failure_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    created.grantKeys.push(bindingFailureIdempotencyKey)
    const bindingFailureAccess = await onboardingAccessService.completeAccess({
      tenantId: FIXTURES.bindingFailure.tenantId,
      employeeId: bindingFailureBase.employeeId,
      employmentId: bindingFailureBase.employmentId,
      accountId: FIXTURES.bindingFailure.accountId,
      roleIds: [FIXTURES.bindingFailure.roleId],
      idempotencyKey: bindingFailureIdempotencyKey,
      reason: 'shared-env smoke binding failure',
      operatorContext: { operatorId: FIXTURES.operatorAccountId, operatorType: 'HUMAN' },
      requestId: `req_${bindingFailureIdempotencyKey}`,
      traceId: `trace_${bindingFailureIdempotencyKey}`
    })
    const bindingFailureState = await loadScenarioState({ hrDb, identityDb, permissionDb, fixture: FIXTURES.bindingFailure, employeeId: bindingFailureBase.employeeId, employmentId: bindingFailureBase.employmentId, accountId: FIXTURES.bindingFailure.accountId, roleId: FIXTURES.bindingFailure.roleId, idempotencyKey: bindingFailureIdempotencyKey })

    const grantFailureBase = await createEmployeeAndEmployment(hrService, 'grant_failure', FIXTURES.grantFailure, created, hrDb)
    const grantFailureIdempotencyKey = `smoke_grant_failure_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    created.grantKeys.push(grantFailureIdempotencyKey)
    const grantFailureAccess = await onboardingAccessService.completeAccess({
      tenantId: FIXTURES.grantFailure.tenantId,
      employeeId: grantFailureBase.employeeId,
      employmentId: grantFailureBase.employmentId,
      accountId: FIXTURES.grantFailure.accountId,
      roleIds: [FIXTURES.grantFailure.roleId],
      idempotencyKey: grantFailureIdempotencyKey,
      reason: 'shared-env smoke grant failure',
      operatorContext: { operatorId: FIXTURES.operatorAccountId, operatorType: 'HUMAN' },
      requestId: `req_${grantFailureIdempotencyKey}`,
      traceId: `trace_${grantFailureIdempotencyKey}`
    })
    const grantFailureState = await loadScenarioState({ hrDb, identityDb, permissionDb, fixture: FIXTURES.grantFailure, employeeId: grantFailureBase.employeeId, employmentId: grantFailureBase.employmentId, accountId: FIXTURES.grantFailure.accountId, roleId: FIXTURES.grantFailure.roleId, idempotencyKey: grantFailureIdempotencyKey })
    if (grantFailureState.binding) created.bindingEmployeeIds.push(grantFailureBase.employeeId)

    const result = {
      environment: {
        hrGrpcTarget: '127.0.0.1:50055',
        identityGrpcTarget: '127.0.0.1:50052',
        permissionGrpcTarget: '127.0.0.1:50051',
        operatorAccountId: FIXTURES.operatorAccountId
      },
      success: {
        ...successBase,
        returnedStatus: successAccess.status,
        state: successState,
        membershipDelta: successState.membershipCount - before.successMemberships
      },
      bindingFailure: {
        ...bindingFailureBase,
        returnedStatus: bindingFailureAccess.status,
        state: bindingFailureState,
        membershipDelta: bindingFailureState.membershipCount - before.bindingFailureMemberships
      },
      grantFailure: {
        ...grantFailureBase,
        returnedStatus: grantFailureAccess.status,
        state: grantFailureState,
        membershipDelta: grantFailureState.membershipCount - before.grantFailureMemberships
      }
    }

    console.log(JSON.stringify(result, null, 2))
  } finally {
    try {
      if (created.roleBindings.length > 0) {
        await permissionDb.accountRole.deleteMany({ where: { OR: created.roleBindings.map((item) => ({ accountId: item.accountId, roleId: item.roleId })) } })
      }
    } catch {}
    try {
      if (created.grantKeys.length > 0) {
        await permissionDb.onboardingGrantRequest.deleteMany({ where: { idempotencyKey: { in: created.grantKeys } } })
      }
    } catch {}
    try {
      if (created.bindingEmployeeIds.length > 0) {
        await identityDb.userAccountEmployeeBinding.deleteMany({ where: { employeeId: { in: created.bindingEmployeeIds } } })
      }
    } catch {}
    try {
      if (created.employees.length > 0) {
        await hrDb.employeeOnboardingAccess.deleteMany({ where: { employeeId: { in: created.employees } } })
      }
    } catch {}
    try {
      if (created.employments.length > 0) {
        await hrDb.employment.deleteMany({ where: { id: { in: created.employments } } })
      }
    } catch {}
    try {
      if (created.employees.length > 0) {
        await hrDb.employee.deleteMany({ where: { id: { in: created.employees } } })
      }
    } catch {}
    try { if (app) await app.close() } catch {}
    try { if (hrClient) await hrClient.close() } catch {}
    await Promise.allSettled([hrDb.$disconnect(), identityDb.$disconnect(), permissionDb.$disconnect()])
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
