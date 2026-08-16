// Builds one deterministic CRM smoke seed so the runtime flow can create and optionally bind one customer account.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`
  return {
    tenantId: process.env.CRM_SMOKE_TENANT_ID || `crm-smoke-tenant-${suffix}`,
    displayName: process.env.CRM_SMOKE_DISPLAY_NAME || `CRM Smoke Customer ${suffix}`,
    customerCategory: process.env.CRM_SMOKE_CUSTOMER_CATEGORY || 'DIRECT',
    tags: (process.env.CRM_SMOKE_TAGS || 'smoke,crm')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    operatorAccountId: process.env.CRM_SMOKE_OPERATOR_ID || 'crm-smoke-operator',
    sourceExternalReference: process.env.CRM_SMOKE_SOURCE_REFERENCE || `crm-smoke-source-${suffix}`,
    partyCanonicalName:
      process.env.CRM_SMOKE_PARTY_CANONICAL_NAME || `CRM Smoke Organization ${suffix}`,
    partyLocalDisplayName:
      process.env.CRM_SMOKE_PARTY_LOCAL_DISPLAY_NAME || `CRM Smoke Party ${suffix}`,
    partyLocalCode: process.env.CRM_SMOKE_PARTY_LOCAL_CODE || `CRM-SMOKE-${suffix}`,
    partyRegisteredCountry: process.env.CRM_SMOKE_PARTY_COUNTRY || 'CN',
    partyIdentifierType: process.env.CRM_SMOKE_PARTY_IDENTIFIER_TYPE || 'BUSINESS_REG_NO',
    partyIdentifierValue: process.env.CRM_SMOKE_PARTY_IDENTIFIER_VALUE || `crm-smoke-reg-${suffix}`,
    leadDomain: process.env.CRM_SMOKE_LEAD_DOMAIN || `crm-smoke-${suffix}.example`,
    leadEmail: process.env.CRM_SMOKE_LEAD_EMAIL || `buyer-${suffix}@crm-smoke.example`,
    leadSourceType: process.env.CRM_SMOKE_LEAD_SOURCE_TYPE || 'WEB_RESEARCH',
    leadPriority: process.env.CRM_SMOKE_LEAD_PRIORITY || 'A'
  }
}

// Executes the CRM P1 smoke flow: create a Lead, verify the workspace list, formalize, list again, and read back the account.
export async function runCrmP1SmokeFlow(services, seed, log = () => {}) {
  const createResponse = await services.crm.management.createLead(createLeadRequest(seed))
  const createdAccount = createResponse?.crmAccount
  if (createResponse?.resultType !== 'CREATED' || !createdAccount?.crmAccountId) {
    throw new Error('crm-service smoke failed: CreateLead did not return a persisted CRM account')
  }

  log(`created lead crmAccount=${createdAccount.crmAccountId}`)

  const afterCreate = await services.crm.query.listCrmAccounts(createP1ListRequest(seed, 'LEAD'))
  const afterCreatePage = assertCrmAccountPage(afterCreate, 'post-create P1 account list')
  const createdLead = afterCreatePage.crmAccounts.find(
    (account) => account?.crmAccountId === createdAccount.crmAccountId
  )
  if (!createdLead || createdLead.lifecycleStage !== 'LEAD') {
    throw new Error('crm-service smoke failed: created Lead did not appear in ListCrmAccounts')
  }

  log(`listed lead crmAccount=${createdAccount.crmAccountId}`)

  const conversionResponse = await services.crm.management.convertLeadToProspectCustomer(
    createConvertLeadRequest(seed, createdAccount.crmAccountId)
  )
  if (conversionResponse?.resultType !== 'CONVERTED') {
    throw new Error(
      `crm-service smoke failed: ConvertLeadToProspectCustomer returned ${conversionResponse?.resultType || 'EMPTY'}`
    )
  }

  const convertedAccount = conversionResponse.crmAccount
  if (
    !convertedAccount?.crmAccountId ||
    convertedAccount.lifecycleStage !== 'PROSPECT_CUSTOMER' ||
    !convertedAccount.tenantPartyId
  ) {
    throw new Error(
      'crm-service smoke failed: conversion did not return a tenant-party-bound prospect customer'
    )
  }

  log(
    `formalized crmAccount=${convertedAccount.crmAccountId} tenantParty=${convertedAccount.tenantPartyId}`
  )

  const afterConvert = await services.crm.query.listCrmAccounts(
    createP1ListRequest(seed, 'PROSPECT_CUSTOMER')
  )
  const afterConvertPage = assertCrmAccountPage(afterConvert, 'post-convert P1 account list')
  const listedProspect = afterConvertPage.crmAccounts.find(
    (account) => account?.crmAccountId === convertedAccount.crmAccountId
  )
  if (!listedProspect || listedProspect.tenantPartyId !== convertedAccount.tenantPartyId) {
    throw new Error(
      'crm-service smoke failed: converted Prospect Customer did not appear in ListCrmAccounts'
    )
  }

  log(`listed prospect crmAccount=${convertedAccount.crmAccountId}`)

  const detail = await services.crm.query.getCrmAccount(
    createGetCrmAccountRequest(seed, convertedAccount.crmAccountId)
  )
  if (detail?.crmAccount?.tenantPartyId !== convertedAccount.tenantPartyId) {
    throw new Error('crm-service smoke failed: GetCrmAccount did not return the converted account')
  }

  log(`read prospect detail crmAccount=${convertedAccount.crmAccountId}`)

  return {
    crmAccountId: convertedAccount.crmAccountId,
    conversionResultType: conversionResponse.resultType,
    tenantPartyId: convertedAccount.tenantPartyId,
    listTotals: {
      afterCreate: afterCreatePage.total,
      afterConvert: afterConvertPage.total
    }
  }
}

function createLeadRequest(seed) {
  return {
    displayName: seed.displayName,
    partyTypeHint: 'ORGANIZATION',
    leadCompanyName: seed.partyCanonicalName,
    leadDomain: seed.leadDomain,
    leadEmail: seed.leadEmail,
    leadCountry: seed.partyRegisteredCountry,
    leadIdentifiers: [
      {
        identifierType: seed.partyIdentifierType,
        normalizedValue: seed.partyIdentifierValue,
        rawValue: seed.partyIdentifierValue,
        issuerCountryOrRegion: seed.partyRegisteredCountry
      }
    ],
    assignmentIntent: 'OWNED_BY_OPERATOR',
    priority: seed.leadPriority,
    duplicateWarningAcknowledged: false,
    sourceType: seed.leadSourceType,
    sourceName: 'CRM smoke source',
    sourceCapturedByAccountId: seed.operatorAccountId,
    sourceExternalReference: seed.sourceExternalReference,
    sourceRawPayloadJson: JSON.stringify({ smoke: true }),
    sourceNote: 'CRM P1 smoke lead'
  }
}

function createP1ListRequest(seed, lifecycleStage) {
  return {
    keyword: seed.displayName,
    lifecycleStage,
    recordStatus: 'ACTIVE',
    ownerAccountId: seed.operatorAccountId,
    page: 1,
    pageSize: 20
  }
}

function createConvertLeadRequest(_seed, crmAccountId) {
  return { crmAccountId }
}

function createGetCrmAccountRequest(_seed, crmAccountId) {
  return { crmAccountId }
}

function assertCrmAccountPage(response, step) {
  if (
    !response ||
    typeof response.total !== 'number' ||
    typeof response.page !== 'number' ||
    typeof response.pageSize !== 'number'
  ) {
    throw new Error(`crm-service smoke failed: ${step} did not return the expected page payload`)
  }

  return {
    crmAccounts: Array.isArray(response.crmAccounts) ? response.crmAccounts : [],
    total: response.total,
    page: response.page,
    pageSize: response.pageSize
  }
}
