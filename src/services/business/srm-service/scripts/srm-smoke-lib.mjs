// Builds one deterministic SRM smoke seed so the runtime flow can create one supplier profile and optionally bind and offer it.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    tenantId: process.env.SRM_SMOKE_TENANT_ID || `srm-smoke-tenant-${suffix}`,
    displayName: process.env.SRM_SMOKE_DISPLAY_NAME || `SRM Smoke Supplier ${suffix}`,
    supplierCategory: process.env.SRM_SMOKE_SUPPLIER_CATEGORY || 'RAW_MATERIAL',
    tags: (process.env.SRM_SMOKE_TAGS || 'smoke,srm').split(',').map((value) => value.trim()).filter(Boolean),
    operatorContext: {
      operatorId: process.env.SRM_SMOKE_OPERATOR_ID || 'srm-smoke-operator',
      operatorType: process.env.SRM_SMOKE_OPERATOR_TYPE || 'HUMAN',
      orgId: process.env.SRM_SMOKE_ORG_ID || 'srm-smoke-org'
    },
    traceContext: {
      traceId: process.env.SRM_SMOKE_TRACE_ID || `srm-smoke-trace-${suffix}`,
      requestId: process.env.SRM_SMOKE_REQUEST_ID || `srm-smoke-request-${suffix}`
    },
    auditContext: {
      auditId: process.env.SRM_SMOKE_AUDIT_ID || `srm-smoke-audit-${suffix}`,
      reason: process.env.SRM_SMOKE_AUDIT_REASON || 'srm-service smoke verification',
      source: process.env.SRM_SMOKE_AUDIT_SOURCE || 'srm-smoke'
    },
    partyCanonicalName: process.env.SRM_SMOKE_PARTY_CANONICAL_NAME || `SRM Smoke Organization ${suffix}`,
    partyLocalDisplayName: process.env.SRM_SMOKE_PARTY_LOCAL_DISPLAY_NAME || `SRM Smoke Party ${suffix}`,
    partyLocalCode: process.env.SRM_SMOKE_PARTY_LOCAL_CODE || `SRM-SMOKE-${suffix}`,
    partyRegisteredCountry: process.env.SRM_SMOKE_PARTY_COUNTRY || 'CN',
    partyIdentifierType: process.env.SRM_SMOKE_PARTY_IDENTIFIER_TYPE || 'BUSINESS_REG_NO',
    partyIdentifierValue: process.env.SRM_SMOKE_PARTY_IDENTIFIER_VALUE || `srm-smoke-reg-${suffix}`,
    itemCode: process.env.SRM_SMOKE_ITEM_CODE || `SRM-SMOKE-ITEM-${suffix}`,
    itemName: process.env.SRM_SMOKE_ITEM_NAME || `SRM Smoke Item ${suffix}`
  };
}

// Executes the minimal SRM live-smoke flow: empty page, supplier creation, optional tenant-party bind, and optional purchasable offering.
export async function runSrmSmokeFlow(services, seed, log = () => {}) {
  const beforeCreate = await services.srm.query.searchSuppliers(createSearchRequest(seed));
  const beforeCreatePage = assertSupplierPage(beforeCreate, 'initial supplier search');
  if (beforeCreatePage.total !== 0 || beforeCreatePage.suppliers.length !== 0) {
    throw new Error('srm-service smoke failed: SearchSuppliers should return an empty page for a fresh tenant');
  }

  log(`supplier search empty before create for tenant=${seed.tenantId}`);

  const createResponse = await services.srm.management.createSupplierProfile(createCreateRequest(seed));
  const createdSupplier = createResponse?.supplier;
  if (!createdSupplier?.supplierId || !createdSupplier?.displayName) {
    throw new Error('srm-service smoke failed: CreateSupplierProfile did not return a persisted supplier profile');
  }

  log(`created supplier=${createdSupplier.supplierId} no=${createdSupplier.supplierNo ?? '(none)'}`);

  const afterCreate = await services.srm.query.searchSuppliers(createSearchRequest(seed));
  const afterCreatePage = assertSupplierPage(afterCreate, 'post-create supplier search');
  const searchedSupplier = afterCreatePage.suppliers.find((supplier) => supplier?.supplierId === createdSupplier.supplierId);
  if (!searchedSupplier) {
    throw new Error('srm-service smoke failed: created supplier did not appear in SearchSuppliers');
  }

  log(`supplier search returned created supplier=${createdSupplier.supplierId}`);

  const registration = services.party?.registration;
  if (!registration?.registerOrganizationParty) {
    return {
      supplierId: createdSupplier.supplierId,
      supplierNo: createdSupplier.supplierNo ?? null,
      searchTotals: {
        beforeCreate: beforeCreatePage.total,
        afterCreate: afterCreatePage.total
      },
      binding: {
        status: 'skipped',
        reason: 'party-service unavailable',
        tenantPartyId: null
      },
      offering: {
        status: 'skipped',
        reason: 'binding not available',
        supplierOfferingId: null,
        itemId: null
      }
    };
  }

  let registerResponse;
  try {
    registerResponse = await registration.registerOrganizationParty(createPartyRegistrationRequest(seed));
  } catch (error) {
    if (error?.srmSmokeOptionalPartyUnavailable) {
      return {
        supplierId: createdSupplier.supplierId,
        supplierNo: createdSupplier.supplierNo ?? null,
        searchTotals: {
          beforeCreate: beforeCreatePage.total,
          afterCreate: afterCreatePage.total
        },
        binding: {
          status: 'skipped',
          reason: 'party-service unavailable',
          tenantPartyId: null
        },
        offering: {
          status: 'skipped',
          reason: 'binding not available',
          supplierOfferingId: null,
          itemId: null
        }
      };
    }

    throw error;
  }

  const tenantPartyId = registerResponse?.tenantParty?.id;
  if (!tenantPartyId) {
    throw new Error('srm-service smoke failed: party registration did not return tenantParty.id');
  }

  log(`registered tenantParty=${tenantPartyId}`);

  const bindResponse = await services.srm.management.bindSupplierToTenantParty(
    createBindRequest(seed, createdSupplier.supplierId, tenantPartyId)
  );
  const bindingTenantPartyId = bindResponse?.supplier?.partyBinding?.tenantPartyId;
  if (bindingTenantPartyId !== tenantPartyId) {
    throw new Error('srm-service smoke failed: BindSupplierToTenantParty did not return the expected tenantParty binding');
  }

  log(`bound supplier=${createdSupplier.supplierId} tenantParty=${tenantPartyId}`);

  const activationResponse = await services.srm.management.changeSupplierStatus(
    createChangeStatusRequest(seed, createdSupplier.supplierId)
  );
  if (activationResponse?.supplier?.status !== 1) {
    throw new Error('srm-service smoke failed: ChangeSupplierStatus did not activate the bound supplier');
  }

  log(`activated supplier=${createdSupplier.supplierId}`);

  const itemManagement = services.itemMaster?.management;
  if (!itemManagement?.createItem || !itemManagement?.setItemCapabilities) {
    return {
      supplierId: createdSupplier.supplierId,
      supplierNo: createdSupplier.supplierNo ?? null,
      searchTotals: {
        beforeCreate: beforeCreatePage.total,
        afterCreate: afterCreatePage.total
      },
      binding: {
        status: 'bound',
        reason: null,
        tenantPartyId
      },
      offering: {
        status: 'skipped',
        reason: 'item-master-service unavailable',
        supplierOfferingId: null,
        itemId: null
      }
    };
  }

  let createdItemId;
  try {
    const createItemResponse = await itemManagement.createItem(createItemRequest(seed));
    createdItemId = createItemResponse?.item?.itemId ?? createItemResponse?.itemId;
    if (!createdItemId) {
      throw new Error('srm-service smoke failed: item-master createItem did not return itemId');
    }

    log(`created item=${createdItemId} code=${seed.itemCode}`);

    const capabilitiesResponse = await itemManagement.setItemCapabilities(
      createSetCapabilitiesRequest(seed, createdItemId)
    );
    if (!capabilitiesResponse?.item?.capabilities?.purchasable) {
      throw new Error('srm-service smoke failed: item-master setItemCapabilities did not enable purchasable=true');
    }
  } catch (error) {
    if (!error?.srmSmokeOptionalItemMasterUnavailable) {
      throw error;
    }

    return {
      supplierId: createdSupplier.supplierId,
      supplierNo: createdSupplier.supplierNo ?? null,
      searchTotals: {
        beforeCreate: beforeCreatePage.total,
        afterCreate: afterCreatePage.total
      },
      binding: {
        status: 'bound',
        reason: null,
        tenantPartyId
      },
      offering: {
        status: 'skipped',
        reason: 'item-master-service unavailable',
        supplierOfferingId: null,
        itemId: null
      }
    };
  }

  const offeringResponse = await services.srm.management.upsertSupplierOffering(
    createOfferingRequest(seed, createdSupplier.supplierId, createdItemId)
  );
  const createdOffering = offeringResponse?.offering;
  if (!createdOffering?.supplierOfferingId || createdOffering.itemId !== createdItemId || createdOffering.status !== 1) {
    throw new Error('srm-service smoke failed: UpsertSupplierOffering did not return the expected active offering');
  }

  log(`created offering=${createdOffering.supplierOfferingId} item=${createdItemId}`);

  return {
    supplierId: createdSupplier.supplierId,
    supplierNo: createdSupplier.supplierNo ?? null,
    searchTotals: {
      beforeCreate: beforeCreatePage.total,
      afterCreate: afterCreatePage.total
    },
    binding: {
      status: 'bound',
      reason: null,
      tenantPartyId
    },
    offering: {
      status: 'offered',
      reason: null,
      supplierOfferingId: createdOffering.supplierOfferingId,
      itemId: createdItemId
    }
  };
}

// createSearchRequest builds the minimal paged SRM supplier query request used for empty-page and post-create checks.
function createSearchRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    keyword: seed.displayName,
    page: 1,
    pageSize: 20
  };
}

// createCreateRequest builds the minimal SRM supplier-profile creation request from the deterministic smoke seed.
function createCreateRequest(seed) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    displayName: seed.displayName,
    supplierCategory: seed.supplierCategory,
    tags: seed.tags
  };
}

// createPartyRegistrationRequest builds one downstream party registration request for the optional SRM binding path.
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
        issuerCountryOrRegion: seed.partyRegisteredCountry
      }
    ]
  };
}

// createBindRequest builds one SRM bind command so the supplier can point at a formal tenantPartyId.
function createBindRequest(seed, supplierId, tenantPartyId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    tenantPartyId
  };
}

// createChangeStatusRequest activates the newly bound supplier so active offerings become valid.
function createChangeStatusRequest(seed, supplierId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    targetStatus: 1
  };
}

// createItemRequest builds one minimal PHYSICAL+SINGLE item-master creation request for the optional offering path.
function createItemRequest(seed) {
  return {
    tenantId: seed.tenantId,
    itemCode: seed.itemCode,
    itemName: seed.itemName,
    structureType: 1,
    natureType: 1
  };
}

// createSetCapabilitiesRequest marks the smoke item as purchasable so SRM offering validation can succeed.
function createSetCapabilitiesRequest(seed, itemId) {
  return {
    tenantId: seed.tenantId,
    itemId,
    capabilities: {
      purchasable: true
    }
  };
}

// createOfferingRequest builds one active supplier-offering upsert against the purchasable smoke item.
function createOfferingRequest(seed, supplierId, itemId) {
  return {
    tenantId: seed.tenantId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext,
    auditContext: seed.auditContext,
    supplierId,
    itemId,
    targetStatus: 1
  };
}

// assertSupplierPage validates the gRPC page payload shape expected from SearchSuppliers.
function assertSupplierPage(response, step) {
  if (
    !response ||
    typeof response.total !== 'number' ||
    typeof response.page !== 'number' ||
    typeof response.pageSize !== 'number'
  ) {
    throw new Error(`srm-service smoke failed: ${step} did not return the expected page payload`);
  }

  return {
    suppliers: Array.isArray(response.suppliers) ? response.suppliers : [],
    total: response.total,
    page: response.page,
    pageSize: response.pageSize
  };
}
