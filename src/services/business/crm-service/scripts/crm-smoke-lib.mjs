// Builds one deterministic CRM smoke seed so the runtime flow can create and optionally bind one customer account.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    tenantId: process.env.CRM_SMOKE_TENANT_ID || `crm-smoke-tenant-${suffix}`,
    displayName: process.env.CRM_SMOKE_DISPLAY_NAME || `CRM Smoke Customer ${suffix}`,
    customerCategory: process.env.CRM_SMOKE_CUSTOMER_CATEGORY || 'DIRECT',
    tags: (process.env.CRM_SMOKE_TAGS || 'smoke,crm').split(',').map((value) => value.trim()).filter(Boolean),
    operatorContext: {
      operatorId: process.env.CRM_SMOKE_OPERATOR_ID || 'crm-smoke-operator',
      operatorType: process.env.CRM_SMOKE_OPERATOR_TYPE || 'HUMAN',
      orgId: process.env.CRM_SMOKE_ORG_ID || 'crm-smoke-org',
    },
    traceContext: {
      traceId: process.env.CRM_SMOKE_TRACE_ID || `crm-smoke-trace-${suffix}`,
      requestId: process.env.CRM_SMOKE_REQUEST_ID || `crm-smoke-request-${suffix}`,
    },
    auditContext: {
      auditId: process.env.CRM_SMOKE_AUDIT_ID || `crm-smoke-audit-${suffix}`,
      reason: process.env.CRM_SMOKE_AUDIT_REASON || 'crm-service smoke verification',
      source: process.env.CRM_SMOKE_AUDIT_SOURCE || 'crm-smoke',
    },
    partyCanonicalName: process.env.CRM_SMOKE_PARTY_CANONICAL_NAME || `CRM Smoke Organization ${suffix}`,
    partyLocalDisplayName: process.env.CRM_SMOKE_PARTY_LOCAL_DISPLAY_NAME || `CRM Smoke Party ${suffix}`,
    partyLocalCode: process.env.CRM_SMOKE_PARTY_LOCAL_CODE || `CRM-SMOKE-${suffix}`,
    partyRegisteredCountry: process.env.CRM_SMOKE_PARTY_COUNTRY || 'CN',
    partyIdentifierType: process.env.CRM_SMOKE_PARTY_IDENTIFIER_TYPE || 'BUSINESS_REG_NO',
    partyIdentifierValue: process.env.CRM_SMOKE_PARTY_IDENTIFIER_VALUE || `crm-smoke-reg-${suffix}`,
  };
}

// Executes the minimal CRM live-smoke flow: empty selector, customer creation, and optional party-backed binding.
export async function runCrmSmokeFlow(services, seed, log = () => {}) {
  const beforeCreate = await services.crm.query.searchSelectableCustomers(createSelectableRequest(seed));
  const beforeCreatePage = assertSelectablePage(beforeCreate, 'initial selector check');
  if (beforeCreatePage.total !== 0 || beforeCreatePage.customers.length !== 0) {
    throw new Error('crm-service smoke failed: SearchSelectableCustomers should return an empty page for a fresh tenant');
  }

  log(`selector empty before create for tenant=${seed.tenantId}`);

  const createResponse = await services.crm.management.createCustomerAccount(createCreateRequest(seed));
  const createdAccount = createResponse?.customerAccount;
  if (!createdAccount?.customerAccountId || !createdAccount?.customerAccountNo) {
    throw new Error('crm-service smoke failed: CreateCustomerAccount did not return a persisted customer account');
  }

  log(`created customerAccount=${createdAccount.customerAccountId} no=${createdAccount.customerAccountNo}`);

  const afterCreate = await services.crm.query.searchSelectableCustomers(createSelectableRequest(seed));
  const afterCreatePage = assertSelectablePage(afterCreate, 'post-create selector check');
  if (afterCreatePage.total !== 0 || afterCreatePage.customers.length !== 0) {
    throw new Error('crm-service smoke failed: unbound customer unexpectedly appeared in SearchSelectableCustomers');
  }

  log(`selector still empty after create for customerAccount=${createdAccount.customerAccountId}`);

  const registration = services.party?.registration;
  if (!registration?.registerOrganizationParty) {
    return {
      customerAccountId: createdAccount.customerAccountId,
      customerAccountNo: createdAccount.customerAccountNo,
      binding: {
        status: 'skipped',
        reason: 'party-service unavailable',
        tenantPartyId: null,
      },
      selectableTotals: {
        beforeCreate: beforeCreatePage.total,
        afterCreate: afterCreatePage.total,
        afterBind: null,
      },
    };
  }

  let registerResponse;
  try {
    registerResponse = await registration.registerOrganizationParty(createPartyRegistrationRequest(seed));
  } catch (error) {
    if (error?.crmSmokeOptionalPartyUnavailable) {
      return {
        customerAccountId: createdAccount.customerAccountId,
        customerAccountNo: createdAccount.customerAccountNo,
        binding: {
          status: 'skipped',
          reason: 'party-service unavailable',
          tenantPartyId: null,
        },
        selectableTotals: {
          beforeCreate: beforeCreatePage.total,
          afterCreate: afterCreatePage.total,
          afterBind: null,
        },
      };
    }

    throw error;
  }

  const tenantPartyId = registerResponse?.tenantParty?.id;
  if (!tenantPartyId) {
    throw new Error('crm-service smoke failed: party registration did not return tenantParty.id');
  }

  log(`registered tenantParty=${tenantPartyId}`);

  const bindResponse = await services.crm.management.bindCustomerAccountToTenantParty(
    createBindRequest(seed, createdAccount.customerAccountId, tenantPartyId),
  );
  const bindingTenantPartyId = bindResponse?.customerAccount?.primaryBinding?.tenantPartyId;
  if (bindingTenantPartyId !== tenantPartyId) {
    throw new Error('crm-service smoke failed: BindCustomerAccountToTenantParty did not return the expected active primary binding');
  }

  log(`bound customerAccount=${createdAccount.customerAccountId} tenantParty=${tenantPartyId}`);

  const afterBind = await services.crm.query.searchSelectableCustomers(createSelectableRequest(seed));
  const afterBindPage = assertSelectablePage(afterBind, 'post-bind selector check');
  const boundCustomer = afterBindPage.customers.find((customer) => customer?.customerAccountId === createdAccount.customerAccountId);
  if (!boundCustomer || boundCustomer.primaryTenantPartyId !== tenantPartyId) {
    throw new Error('crm-service smoke failed: bound customer did not appear in SearchSelectableCustomers');
  }

  log(`selector returned bound customerAccount=${createdAccount.customerAccountId}`);

  return {
    customerAccountId: createdAccount.customerAccountId,
    customerAccountNo: createdAccount.customerAccountNo,
    binding: {
      status: 'bound',
      reason: null,
      tenantPartyId,
    },
    selectableTotals: {
      beforeCreate: beforeCreatePage.total,
      afterCreate: afterCreatePage.total,
      afterBind: afterBindPage.total,
    },
  };
}

function createSelectableRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    page: 1,
    pageSize: 20,
    keyword: seed.displayName,
  };
}

function createCreateRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    displayName: seed.displayName,
    customerCategory: seed.customerCategory,
    tags: seed.tags,
  };
}

function createPartyRegistrationRequest(seed) {
  return {
    tenantId: seed.tenantId,
    legalName: seed.partyCanonicalName,
    localDisplayName: seed.partyLocalDisplayName,
    localCode: seed.partyLocalCode,
    registeredCountry: seed.partyRegisteredCountry,
    identifiers: [
      {
        identifierType: seed.partyIdentifierType,
        normalizedValue: seed.partyIdentifierValue,
        rawValue: seed.partyIdentifierValue,
        issuerCountryOrRegion: seed.partyRegisteredCountry,
      },
    ],
  };
}

function createBindRequest(seed, customerAccountId, tenantPartyId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    customerAccountId,
    tenantPartyId,
  };
}

function assertSelectablePage(response, step) {
  if (!response || typeof response.total !== 'number' || typeof response.page !== 'number' || typeof response.pageSize !== 'number') {
    throw new Error(`crm-service smoke failed: ${step} did not return the expected page payload`);
  }

  return {
    customers: Array.isArray(response.customers) ? response.customers : [],
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}
