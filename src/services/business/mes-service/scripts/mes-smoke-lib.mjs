const PRODUCTION_SPEC_ACTIVE = 2;
const MOLD_FUNCTION_PRODUCTION = 2;
const MOLD_OUTPUT_SINGLE = 1;
const MOLD_OUTPUT_PRODUCT = 1;
const TOOLING_TYPE_MOLD = 1;

/** createSmokeSeed builds one deterministic MES smoke tenant, fixture, command, and request context bundle. */
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}`;
  const shortSuffix = suffix.slice(-6);

  return {
    tenantId: `mes-smoke-tenant-${suffix}`,
    orgId: 'mes-smoke-org',
    operatorContext: {
      operatorId: 'mes-smoke-operator',
      operatorType: 'HUMAN',
      orgId: 'mes-smoke-org'
    },
    traceContext: {
      traceId: `mes-smoke-trace-${suffix}`,
      requestId: `mes-smoke-request-${suffix}`
    },
    auditSource: 'mes-smoke',
    specCreateCommandId: `mes-smoke-cmd-spec-create-${suffix}`,
    specActivateCommandId: `mes-smoke-cmd-spec-activate-${suffix}`,
    designCommandId: `mes-smoke-cmd-design-${suffix}`,
    moldCommandId: `mes-smoke-cmd-mold-${suffix}`,
    moveCommandId: `mes-smoke-cmd-move-${suffix}`,
    installCommandId: `mes-smoke-cmd-install-${suffix}`,
    usageCommandId: `mes-smoke-cmd-usage-${suffix}`,
    designCode: `MES-SMOKE-${shortSuffix}`,
    moldCode: `PM-MES-SMOKE-${shortSuffix}`,
    conflictMoldCode: `PM-MES-SMOKE-CONFLICT-${shortSuffix}`,
    initialStorageResourceId: `mes-smoke-storage-drying-${suffix}`,
    readyStorageResourceId: `mes-smoke-storage-ready-${suffix}`,
    carrierResourceId: `mes-smoke-carrier-${suffix}`,
    workCenterId: `mes-smoke-wc-${suffix}`,
    workUnitId: `mes-smoke-wu-${suffix}`,
    itemId: `mes-smoke-item-${suffix}`,
    productionSpecCode: `MES-SMOKE-SPEC-${shortSuffix}`,
    lifeLimitValue: '10',
    usageQuantity: '6',
    lifeDelta: '6',
    lifeUnit: 'CASTING_CYCLE'
  };
}

/** runMesSmokeFlow executes the minimum ProductionSpec, Mold, Tooling, usage, idempotency, and outbox path expected from MES. */
export async function runMesSmokeFlow(services, seed, report = () => undefined) {
  assertMesServices(services);

  const spec = requireProductionSpec(
    await services.specManagement.createProductionSpec(buildCreateProductionSpecRequest(seed)),
    'CreateProductionSpec'
  );
  const activatedSpec = requireProductionSpec(
    await services.specManagement.activateProductionSpec(
      buildActivateProductionSpecRequest(seed, spec.productionSpecId, spec.version)
    ),
    'ActivateProductionSpec'
  );
  if (activatedSpec.status !== PRODUCTION_SPEC_ACTIVE) {
    throw new Error('mes-service smoke failed: ActivateProductionSpec did not activate the spec');
  }
  report(`production spec active: ${activatedSpec.productionSpecId}`);

  const designRequest = buildRegisterMoldDesignRequest(seed, activatedSpec);
  const design = requireMoldDesign(await services.management.registerMoldDesign(designRequest), 'RegisterMoldDesign');
  report(`design registered: ${design.moldDesignId}`);

  const moldRequest = buildRegisterProductionMoldRequest(seed, design.moldDesignId);
  const mold = requireProductionMold(await services.management.registerProductionMold(moldRequest), 'RegisterProductionMold');
  report(`production mold registered: ${mold.productionMoldId}`);

  const moved = requirePlacement(
    await services.management.moveTooling(buildMoveToolingRequest(seed, mold.productionMoldId)),
    'MoveTooling'
  );
  report(`tooling moved: ${mold.productionMoldId}`);

  const installed = requireToolingInstallation(
    await services.management.installTooling(buildInstallToolingRequest(seed, mold.productionMoldId)),
    'InstallTooling'
  );
  report(`tooling installed: ${installed.toolingInstallation.toolingInstallationId}`);

  const usage = requireUsage(
    await services.management.recordMoldUsage(
      buildRecordMoldUsageRequest(seed, activatedSpec, mold.productionMoldId, installed.toolingInstallation.toolingInstallationId)
    ),
    'RecordMoldUsage'
  );
  report(`usage recorded: ${usage.moldUsageRecord.moldUsageRecordId}`);

  const currentMolds = requireList(
    await services.query.listCurrentMoldsByWorkCenter({
      ...buildQueryContext(seed),
      workCenterId: seed.workCenterId,
      workUnitId: seed.workUnitId
    }),
    'items',
    'ListCurrentMoldsByWorkCenter'
  );
  const installedMold = currentMolds.items.find(
    (item) => item?.productionMold?.productionMoldId === mold.productionMoldId
  );
  if (!installedMold) {
    throw new Error('mes-service smoke failed: ListCurrentMoldsByWorkCenter did not return the installed mold');
  }
  report(`current work center mold visible: ${seed.workCenterId}`);

  const counters = requireList(
    await services.query.listMoldLifeCounters({
      ...buildQueryContext(seed),
      productionMoldId: mold.productionMoldId,
      page: 1,
      pageSize: 20
    }),
    'counters',
    'ListMoldLifeCounters'
  );
  const counter = counters.counters.find((item) => item?.productionMoldId === mold.productionMoldId);
  if (!counter || counter.usedValue !== seed.lifeDelta) {
    throw new Error('mes-service smoke failed: ListMoldLifeCounters did not return the updated life counter');
  }
  report(`life counter visible: ${counter.moldLifeCounterId}`);

  const idempotency = await services.diagnostics.replaySameCommand(moldRequest);
  if (
    idempotency.productionMoldCount !== 1 ||
    idempotency.commandOutboxCount !== 1 ||
    idempotency.commandAuditCount !== 1
  ) {
    throw new Error('mes-service smoke failed: same command replay duplicated mold facts, audit, or outbox rows');
  }
  report(`idempotent replay verified: ${seed.moldCommandId}`);

  const conflict = await services.diagnostics.conflictSameCommandDifferentPayload({
    ...moldRequest,
    moldCode: seed.conflictMoldCode
  });
  if (!conflict?.conflicted) {
    throw new Error('mes-service smoke failed: same command id with a different payload did not return conflict');
  }
  report(`idempotency conflict verified: ${seed.moldCommandId}`);

  const outbox = await services.diagnostics.verifyOutbox();
  for (const expectedEventType of [
    'ProductionSpecCreated',
    'ProductionSpecActivated',
    'MoldDesignRegistered',
    'ProductionMoldRegistered',
    'ToolingMoved',
    'ToolingInstalled',
    'MoldUsageRecorded'
  ]) {
    if (!outbox.eventTypes.includes(expectedEventType)) {
      throw new Error(`mes-service smoke failed: outbox did not persist ${expectedEventType}`);
    }
  }
  if (outbox.pendingCount < 7) {
    throw new Error('mes-service smoke failed: outbox did not persist the minimum pending event rows');
  }
  report(`outbox pending events verified: ${outbox.pendingCount}`);

  return {
    spec: activatedSpec,
    design,
    mold,
    moved,
    installed,
    usage,
    currentMolds,
    counters,
    idempotency,
    outbox
  };
}

/** buildCreateProductionSpecRequest creates the ProductionSpec command required before registering a MoldDesign. */
function buildCreateProductionSpecRequest(seed) {
  return {
    ...buildManagementContext(seed, seed.specCreateCommandId, 'create production spec'),
    specCode: seed.productionSpecCode,
    name: 'MES Smoke Production Spec',
    revisionCode: 'R1',
    itemRef: {
      itemId: seed.itemId,
      itemCodeSnapshot: 'MES-SMOKE-ITEM',
      itemNameSnapshot: 'MES Smoke Item'
    }
  };
}

/** buildActivateProductionSpecRequest creates the activation command that makes the spec usable by MoldDesign. */
function buildActivateProductionSpecRequest(seed, productionSpecId, expectedVersion) {
  return {
    ...buildManagementContext(seed, seed.specActivateCommandId, 'activate production spec'),
    productionSpecId,
    expectedVersion
  };
}

/** buildRegisterProductionMoldRequest creates the stable production mold command payload reused by idempotency checks. */
export function buildRegisterProductionMoldRequest(seed, moldDesignId) {
  return {
    ...buildManagementContext(seed, seed.moldCommandId, 'register production mold'),
    moldCode: seed.moldCode,
    moldDesignId,
    initialStorageResourceRef: buildStorageResourceRef(seed.initialStorageResourceId, 'DRY')
  };
}

/** buildQueryContext attaches the explicit tenant, operator, and trace payload frozen by the MES query contracts. */
function buildQueryContext(seed) {
  return {
    tenantId: seed.tenantId,
    orgId: seed.orgId,
    operatorContext: seed.operatorContext,
    traceContext: seed.traceContext
  };
}

/** buildManagementContext attaches the explicit tenant, operator, trace, audit, and idempotency payload frozen by MES commands. */
function buildManagementContext(seed, commandId, reason) {
  return {
    ...buildQueryContext(seed),
    auditContext: {
      auditId: `${commandId}-audit`,
      reason,
      source: seed.auditSource
    },
    commandId
  };
}

/** buildRegisterMoldDesignRequest creates the stable mold design command used by smoke verification. */
function buildRegisterMoldDesignRequest(seed, productionSpec) {
  const productionSpecRef = {
    productionSpecId: productionSpec.productionSpecId,
    specCodeSnapshot: productionSpec.specCode || seed.productionSpecCode,
    displayNameSnapshot: productionSpec.name || 'MES Smoke Production Spec'
  };

  return {
    ...buildManagementContext(seed, seed.designCommandId, 'register mold design'),
    designCode: seed.designCode,
    name: 'MES Smoke Mold Design',
    revisionCode: 'R1',
    itemRef: {
      itemId: seed.itemId,
      itemCodeSnapshot: 'MES-SMOKE-ITEM',
      itemNameSnapshot: 'MES Smoke Item'
    },
    productionSpecRefs: [productionSpecRef],
    materialType: 'GYPSUM',
    functionRole: MOLD_FUNCTION_PRODUCTION,
    productionMethodTags: ['HIGH_PRESSURE'],
    outputStructureType: MOLD_OUTPUT_SINGLE,
    outputs: [
      {
        sequenceNo: 1,
        outputCode: 'MES-SMOKE-OUT',
        outputKind: MOLD_OUTPUT_PRODUCT,
        productionSpecRef,
        quantityPerUse: '1',
        isPrimaryOutput: true
      }
    ],
    defaultLifeLimit: seed.lifeLimitValue,
    defaultLifeUnit: seed.lifeUnit
  };
}

/** buildMoveToolingRequest creates the ready-storage movement command after the production mold is registered. */
function buildMoveToolingRequest(seed, productionMoldId) {
  return {
    ...buildManagementContext(seed, seed.moveCommandId, 'move tooling to ready storage'),
    toolingType: TOOLING_TYPE_MOLD,
    toolingId: productionMoldId,
    toStorageResourceRef: buildStorageResourceRef(seed.readyStorageResourceId, 'READY'),
    movementReason: 'drying complete'
  };
}

/** buildInstallToolingRequest creates the work-center installation command for the smoke mold. */
function buildInstallToolingRequest(seed, productionMoldId) {
  return {
    ...buildManagementContext(seed, seed.installCommandId, 'install smoke tooling'),
    toolingType: TOOLING_TYPE_MOLD,
    toolingId: productionMoldId,
    workCenterRef: buildWorkCenterRef(seed),
    workUnitRef: buildWorkUnitRef(seed),
    moldPosition: 'A',
    cavityPosition: '1',
    setupParameters: 'smoke setup'
  };
}

/** buildRecordMoldUsageRequest creates one usage command that increments the independent life counter. */
function buildRecordMoldUsageRequest(seed, productionSpec, productionMoldId, toolingInstallationId) {
  return {
    ...buildManagementContext(seed, seed.usageCommandId, 'record smoke mold usage'),
    productionMoldId,
    toolingInstallationId,
    workCenterRef: buildWorkCenterRef(seed),
    workUnitRef: buildWorkUnitRef(seed),
    usageQuantity: seed.usageQuantity,
    lifeDelta: seed.lifeDelta,
    lifeUnit: seed.lifeUnit,
    productionSpecRef: {
      productionSpecId: productionSpec.productionSpecId,
      specCodeSnapshot: productionSpec.specCode || seed.productionSpecCode,
      displayNameSnapshot: productionSpec.name || 'MES Smoke Production Spec'
    },
    captureSource: 'MES_SMOKE'
  };
}

/** buildStorageResourceRef creates a stable resource snapshot for storage placement commands. */
function buildStorageResourceRef(storageResourceId, codePrefix) {
  return {
    storageResourceId,
    resourceCodeSnapshot: `${codePrefix}-${storageResourceId.slice(-6)}`,
    displayNameSnapshot: `MES Smoke ${codePrefix} Storage`
  };
}

/** buildWorkCenterRef creates the work center snapshot used by install and usage facts. */
function buildWorkCenterRef(seed) {
  return {
    workCenterId: seed.workCenterId,
    workCenterCodeSnapshot: `WC-${seed.designCode.slice(-6)}`,
    displayNameSnapshot: 'MES Smoke Work Center'
  };
}

/** buildWorkUnitRef creates the work unit snapshot used by install and usage facts. */
function buildWorkUnitRef(seed) {
  return {
    workUnitId: seed.workUnitId,
    workUnitCodeSnapshot: 'WU-A',
    displayNameSnapshot: 'MES Smoke Work Unit A'
  };
}

/** assertMesServices verifies the smoke received every RPC wrapper and diagnostic hook it needs. */
function assertMesServices(services) {
  if (
    !services?.specManagement?.createProductionSpec ||
    !services?.specManagement?.activateProductionSpec ||
    !services?.management?.registerMoldDesign ||
    !services?.management?.registerProductionMold ||
    !services?.management?.moveTooling ||
    !services?.management?.installTooling ||
    !services?.management?.recordMoldUsage ||
    !services?.query?.listCurrentMoldsByWorkCenter ||
    !services?.query?.listMoldLifeCounters ||
    !services?.diagnostics?.replaySameCommand ||
    !services?.diagnostics?.conflictSameCommandDifferentPayload ||
    !services?.diagnostics?.verifyOutbox
  ) {
    throw new Error('mes-service smoke failed: management, query, or diagnostic clients are not fully configured');
  }
}

/** requireProductionSpec unwraps one ProductionSpec payload or raises a targeted smoke failure. */
function requireProductionSpec(response, step) {
  const productionSpec = response?.productionSpec;
  if (!productionSpec?.productionSpecId) {
    throw new Error(`mes-service smoke failed: ${step} did not return a production spec payload`);
  }
  return productionSpec;
}

/** requireMoldDesign unwraps one design payload or raises a targeted smoke failure. */
function requireMoldDesign(response, step) {
  const moldDesign = response?.moldDesign;
  if (!moldDesign?.moldDesignId) {
    throw new Error(`mes-service smoke failed: ${step} did not return a mold design payload`);
  }
  return moldDesign;
}

/** requireProductionMold unwraps one production mold payload or raises a targeted smoke failure. */
function requireProductionMold(response, step) {
  const productionMold = response?.productionMold;
  if (!productionMold?.productionMoldId) {
    throw new Error(`mes-service smoke failed: ${step} did not return a production mold payload`);
  }
  return productionMold;
}

/** requirePlacement unwraps one tooling placement response or raises a targeted smoke failure. */
function requirePlacement(response, step) {
  if (!response?.placement?.placementType) {
    throw new Error(`mes-service smoke failed: ${step} did not return placement payload`);
  }
  return response;
}

/** requireToolingInstallation unwraps one installation response or raises a targeted smoke failure. */
function requireToolingInstallation(response, step) {
  if (!response?.toolingInstallation?.toolingInstallationId) {
    throw new Error(`mes-service smoke failed: ${step} did not return tooling installation payload`);
  }
  return response;
}

/** requireUsage unwraps one usage response or raises a targeted smoke failure. */
function requireUsage(response, step) {
  if (!response?.moldUsageRecord?.moldUsageRecordId || !response?.moldLifeCounter?.productionMoldId) {
    throw new Error(`mes-service smoke failed: ${step} did not return usage and life counter payloads`);
  }
  return response;
}

/** requireList unwraps one list payload and ensures the expected list field is present for smoke assertions. */
function requireList(response, field, step) {
  const items = response?.[field];
  if (!Array.isArray(items)) {
    throw new Error(`mes-service smoke failed: ${step} did not return the expected list payload`);
  }
  return response;
}
