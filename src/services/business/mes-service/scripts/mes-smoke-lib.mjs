const REF_PRODUCT_FAMILY = 1;
const REF_MANUFACTURING_SPEC = 2;
const MOLD_FUNCTION_PRODUCTION = 2;
const MOLD_OUTPUT_SINGLE = 1;
const MOLD_OUTPUT_PRODUCT = 1;
const PRODUCTION_MOLD_PENDING_INSTALLATION = 3;
const MOLD_RESOURCE_PRODUCTION_INSTANCE = 2;
const MOLD_USAGE_MANUAL_CHECKLIST = 1;
const MOLD_WARNING_STATUS_OPEN = 1;

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
    designCommandId: `mes-smoke-cmd-design-${suffix}`,
    instanceCommandId: `mes-smoke-cmd-instance-${suffix}`,
    moveCommandId: `mes-smoke-cmd-move-${suffix}`,
    installCommandId: `mes-smoke-cmd-install-${suffix}`,
    usageCommandId: `mes-smoke-cmd-usage-${suffix}`,
    moldDesignId: `mes-smoke-design-${suffix}`,
    productionMoldInstanceId: `mes-smoke-mold-${suffix}`,
    movementEventId: `mes-smoke-move-${suffix}`,
    moldInstallationId: `mes-smoke-install-${suffix}`,
    moldUsageEventId: `mes-smoke-usage-${suffix}`,
    moldWarningEventId: `mes-smoke-warning-${suffix}`,
    designCode: `MES-SMOKE-${shortSuffix}`,
    moldInstanceCode: `PM-MES-SMOKE-${shortSuffix}`,
    conflictMoldInstanceCode: `PM-MES-SMOKE-CONFLICT-${shortSuffix}`,
    dryingLocationId: `mes-smoke-drying-${suffix}`,
    readyLocationId: `mes-smoke-ready-${suffix}`,
    workCenterId: `mes-smoke-wc-${suffix}`,
    resourcePositionId: `mes-smoke-pos-${suffix}`,
    productFamilyRefId: `mes-smoke-pf-${suffix}`,
    manufacturingSpecRefId: `mes-smoke-spec-${suffix}`,
    lifeLimitValue: '10',
    warningThresholdValue: '5',
    usageQuantity: '6',
    lifeDelta: '6',
    lifeUnit: 'USE'
  };
}

/** runMesSmokeFlow executes the minimum phase 1 mold command, query, idempotency, and outbox path expected from MES. */
export async function runMesSmokeFlow(services, seed, report = () => undefined) {
  assertMesServices(services);

  const designRequest = buildRegisterMoldDesignRequest(seed);
  const design = requireMoldDesign(
    await services.management.registerMoldDesign(designRequest),
    'RegisterMoldDesign'
  );
  report(`design registered: ${design.moldDesignId}`);

  const instanceRequest = buildRegisterProductionMoldInstanceRequest(seed, design.moldDesignId);
  const instance = requireProductionMoldInstance(
    await services.management.registerProductionMoldInstance(instanceRequest),
    'RegisterProductionMoldInstance'
  );
  report(`production mold registered: ${instance.productionMoldInstanceId}`);

  const moved = requireMovement(
    await services.management.moveMold(buildMoveMoldRequest(seed, instance.productionMoldInstanceId)),
    'MoveMold'
  );
  report(`mold moved: ${moved.movementEvent.moldMovementEventId}`);

  const installed = requireInstallation(
    await services.management.installMold(buildInstallMoldRequest(seed, instance.productionMoldInstanceId)),
    'InstallMold'
  );
  report(`mold installed: ${installed.moldInstallation.moldInstallationId}`);

  const usage = requireUsage(
    await services.management.recordMoldUsage(
      buildRecordMoldUsageRequest(seed, instance.productionMoldInstanceId, installed.moldInstallation.moldInstallationId)
    ),
    'RecordMoldUsage'
  );
  if (!usage.raisedWarning?.moldWarningEventId) {
    throw new Error('mes-service smoke failed: RecordMoldUsage did not raise the expected life warning');
  }
  report(`usage recorded: ${usage.usageEvent.moldUsageEventId}`);

  const currentMolds = requirePage(
    await services.query.listCurrentMoldsByWorkCenter({
      ...buildQueryContext(seed),
      workCenterId: seed.workCenterId,
      page: 1,
      pageSize: 20
    }),
    'installedMolds',
    'ListCurrentMoldsByWorkCenter'
  );
  const installedMold = currentMolds.installedMolds.find(
    (item) => item?.productionMoldInstance?.productionMoldInstanceId === instance.productionMoldInstanceId
  );
  if (!installedMold) {
    throw new Error('mes-service smoke failed: ListCurrentMoldsByWorkCenter did not return the installed mold');
  }
  report(`current work center mold visible: ${seed.workCenterId}`);

  const warnings = requirePage(
    await services.query.listMoldLifeWarnings({
      ...buildQueryContext(seed),
      status: MOLD_WARNING_STATUS_OPEN,
      workCenterId: seed.workCenterId,
      page: 1,
      pageSize: 20
    }),
    'warnings',
    'ListMoldLifeWarnings'
  );
  const warning = warnings.warnings.find(
    (item) => item?.productionMoldInstanceSummary?.productionMoldInstanceId === instance.productionMoldInstanceId
  );
  if (!warning) {
    throw new Error('mes-service smoke failed: ListMoldLifeWarnings did not return the raised life warning');
  }
  report(`life warning visible: ${warning.moldWarningEventId}`);

  const idempotency = await services.diagnostics.replaySameCommand(instanceRequest);
  if (
    idempotency.productionMoldInstanceCount !== 1 ||
    idempotency.commandOutboxCount !== 1 ||
    idempotency.commandAuditCount !== 1
  ) {
    throw new Error('mes-service smoke failed: same command replay duplicated mold facts, audit, or outbox rows');
  }
  report(`idempotent replay verified: ${seed.instanceCommandId}`);

  const conflict = await services.diagnostics.conflictSameCommandDifferentPayload({
    ...instanceRequest,
    moldInstanceCode: seed.conflictMoldInstanceCode
  });
  if (!conflict?.conflicted) {
    throw new Error('mes-service smoke failed: same command id with a different payload did not return conflict');
  }
  report(`idempotency conflict verified: ${seed.instanceCommandId}`);

  const outbox = await services.diagnostics.verifyOutbox();
  for (const expectedEventType of [
    'MoldRegistered',
    'MoldMoved',
    'MoldInstalled',
    'MoldUsageRecorded',
    'MoldLifeWarningRaised'
  ]) {
    if (!outbox.eventTypes.includes(expectedEventType)) {
      throw new Error(`mes-service smoke failed: outbox did not persist ${expectedEventType}`);
    }
  }
  if (outbox.pendingCount < 6) {
    throw new Error('mes-service smoke failed: outbox did not persist the minimum pending event rows');
  }
  report(`outbox pending events verified: ${outbox.pendingCount}`);

  return {
    design,
    instance,
    moved,
    installed,
    usage,
    currentMolds,
    warnings,
    idempotency,
    outbox
  };
}

/** buildRegisterProductionMoldInstanceRequest creates the stable production mold command payload reused by idempotency checks. */
export function buildRegisterProductionMoldInstanceRequest(seed, moldDesignId) {
  return {
    ...buildManagementContext(seed, seed.instanceCommandId, 'register production mold'),
    moldInstanceCode: seed.moldInstanceCode,
    moldDesignId,
    initialStatus: PRODUCTION_MOLD_PENDING_INSTALLATION,
    initialMesLocationId: seed.dryingLocationId,
    lifeLimitValue: seed.lifeLimitValue,
    lifeUnit: seed.lifeUnit,
    warningThresholdValue: seed.warningThresholdValue,
    reason: 'register production mold'
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

/** buildRegisterMoldDesignRequest creates the stable phase 1 mold design command used by smoke verification. */
function buildRegisterMoldDesignRequest(seed) {
  return {
    ...buildManagementContext(seed, seed.designCommandId, 'register mold design'),
    designCode: seed.designCode,
    name: 'MES Smoke Mold Design',
    revisionCode: 'R1',
    productFamilyRef: {
      refType: REF_PRODUCT_FAMILY,
      refId: seed.productFamilyRefId,
      refCodeSnapshot: 'MES-SMOKE-PF',
      displayNameSnapshot: 'MES Smoke Product Family'
    },
    manufacturingSpecRefs: [
      {
        refType: REF_MANUFACTURING_SPEC,
        refId: seed.manufacturingSpecRefId,
        refCodeSnapshot: 'MES-SMOKE-SPEC',
        displayNameSnapshot: 'MES Smoke Manufacturing Spec'
      }
    ],
    materialType: 'GYPSUM',
    functionRole: MOLD_FUNCTION_PRODUCTION,
    productionMethodTags: ['HIGH_PRESSURE'],
    outputStructureType: MOLD_OUTPUT_SINGLE,
    outputs: [
      {
        sequenceNo: 1,
        outputCode: 'MES-SMOKE-OUT',
        outputKind: MOLD_OUTPUT_PRODUCT,
        productFamilyRef: {
          refType: REF_PRODUCT_FAMILY,
          refId: seed.productFamilyRefId,
          refCodeSnapshot: 'MES-SMOKE-PF',
          displayNameSnapshot: 'MES Smoke Product Family'
        },
        manufacturingSpecRef: {
          refType: REF_MANUFACTURING_SPEC,
          refId: seed.manufacturingSpecRefId,
          refCodeSnapshot: 'MES-SMOKE-SPEC',
          displayNameSnapshot: 'MES Smoke Manufacturing Spec'
        },
        quantityPerUse: '1',
        isPrimaryOutput: true
      }
    ],
    defaultLifeLimit: seed.lifeLimitValue,
    defaultLifeUnit: seed.lifeUnit,
    reason: 'register mold design'
  };
}

/** buildMoveMoldRequest creates the ready-rack movement command after the production mold is registered. */
function buildMoveMoldRequest(seed, productionMoldInstanceId) {
  return {
    ...buildManagementContext(seed, seed.moveCommandId, 'move mold to ready rack'),
    moldResourceType: MOLD_RESOURCE_PRODUCTION_INSTANCE,
    moldResourceId: productionMoldInstanceId,
    fromMesLocationId: seed.dryingLocationId,
    toMesLocationId: seed.readyLocationId,
    movementReason: 'drying complete'
  };
}

/** buildInstallMoldRequest creates the work-center installation command for the smoke mold. */
function buildInstallMoldRequest(seed, productionMoldInstanceId) {
  return {
    ...buildManagementContext(seed, seed.installCommandId, 'install smoke mold'),
    productionMoldInstanceId,
    workCenterId: seed.workCenterId,
    resourcePositionId: seed.resourcePositionId,
    reason: 'install smoke mold'
  };
}

/** buildRecordMoldUsageRequest creates one usage command that crosses the configured warning threshold. */
function buildRecordMoldUsageRequest(seed, productionMoldInstanceId, moldInstallationId) {
  return {
    ...buildManagementContext(seed, seed.usageCommandId, 'record smoke mold usage'),
    productionMoldInstanceId,
    moldInstallationId,
    workCenterId: seed.workCenterId,
    resourcePositionId: seed.resourcePositionId,
    usageMode: MOLD_USAGE_MANUAL_CHECKLIST,
    usageQuantity: seed.usageQuantity,
    lifeDelta: seed.lifeDelta,
    lifeUnit: seed.lifeUnit,
    productFamilyRef: {
      refType: REF_PRODUCT_FAMILY,
      refId: seed.productFamilyRefId,
      refCodeSnapshot: 'MES-SMOKE-PF',
      displayNameSnapshot: 'MES Smoke Product Family'
    },
    manufacturingSpecRef: {
      refType: REF_MANUFACTURING_SPEC,
      refId: seed.manufacturingSpecRefId,
      refCodeSnapshot: 'MES-SMOKE-SPEC',
      displayNameSnapshot: 'MES Smoke Manufacturing Spec'
    },
    captureSource: 'MES_SMOKE',
    reason: 'record smoke mold usage'
  };
}

/** assertMesServices verifies the smoke received every RPC wrapper and diagnostic hook it needs. */
function assertMesServices(services) {
  if (
    !services?.management?.registerMoldDesign ||
    !services?.management?.registerProductionMoldInstance ||
    !services?.management?.moveMold ||
    !services?.management?.installMold ||
    !services?.management?.recordMoldUsage ||
    !services?.query?.listCurrentMoldsByWorkCenter ||
    !services?.query?.listMoldLifeWarnings ||
    !services?.diagnostics?.replaySameCommand ||
    !services?.diagnostics?.conflictSameCommandDifferentPayload ||
    !services?.diagnostics?.verifyOutbox
  ) {
    throw new Error('mes-service smoke failed: management, query, or diagnostic clients are not fully configured');
  }
}

/** requireMoldDesign unwraps one design payload or raises a targeted smoke failure. */
function requireMoldDesign(response, step) {
  const moldDesign = response?.moldDesign;
  if (!moldDesign?.moldDesignId) {
    throw new Error(`mes-service smoke failed: ${step} did not return a mold design payload`);
  }
  return moldDesign;
}

/** requireProductionMoldInstance unwraps one production mold payload or raises a targeted smoke failure. */
function requireProductionMoldInstance(response, step) {
  const productionMoldInstance = response?.productionMoldInstance;
  if (!productionMoldInstance?.productionMoldInstanceId) {
    throw new Error(`mes-service smoke failed: ${step} did not return a production mold payload`);
  }
  return productionMoldInstance;
}

/** requireMovement unwraps one movement response or raises a targeted smoke failure. */
function requireMovement(response, step) {
  if (!response?.movementEvent?.moldMovementEventId || !response?.moldCurrentLocation?.moldResourceId) {
    throw new Error(`mes-service smoke failed: ${step} did not return movement and current location payloads`);
  }
  return response;
}

/** requireInstallation unwraps one installation response or raises a targeted smoke failure. */
function requireInstallation(response, step) {
  if (!response?.moldInstallation?.moldInstallationId || !response?.productionMoldInstance?.productionMoldInstanceId) {
    throw new Error(`mes-service smoke failed: ${step} did not return installation and production mold payloads`);
  }
  return response;
}

/** requireUsage unwraps one usage response or raises a targeted smoke failure. */
function requireUsage(response, step) {
  if (!response?.usageEvent?.moldUsageEventId || !response?.moldLifeCounter?.productionMoldInstanceId) {
    throw new Error(`mes-service smoke failed: ${step} did not return usage and life counter payloads`);
  }
  return response;
}

/** requirePage unwraps one page payload and ensures the expected list field is present for smoke assertions. */
function requirePage(response, field, step) {
  const items = response?.[field];
  if (!Array.isArray(items)) {
    throw new Error(`mes-service smoke failed: ${step} did not return the expected page payload`);
  }
  return response;
}
