// Builds one deterministic smoke seed so the gRPC smoke flow can be asserted and repeated locally.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    tenantId: `smoke-tenant-${suffix}`,
    legalName: `Smoke Organization ${suffix}`,
    displayName: `Smoke Local ${suffix}`,
    localCode: `SMOKE-${suffix}`,
    registeredCountry: 'CN',
    identifierType: 'BUSINESS_REG_NO',
    identifierValue: `smoke-reg-${suffix}`,
  };
}

// Executes the minimal party-service smoke scenario against injected gRPC service stubs.
export async function runPartySmokeFlow(services, seed, log = () => {}) {
  const registerResponse = await services.registration.registerTenantParty({
    tenantId: seed.tenantId,
    type: 'ORGANIZATION',
    legalName: seed.legalName,
    displayName: seed.displayName,
    localCode: seed.localCode,
    registeredCountry: seed.registeredCountry,
    identifiers: [
      {
        identifierType: seed.identifierType,
        normalizedValue: seed.identifierValue,
        rawValue: seed.identifierValue,
        issuerCountryOrRegion: seed.registeredCountry,
      },
    ],
  });

  const tenantPartyId = registerResponse?.tenantParty?.id;

  if (!tenantPartyId) {
    throw new Error('party-service smoke failed: registerTenantParty did not return tenantParty id');
  }

  log(`registered tenantParty=${tenantPartyId}`);

  const candidateResponse = await services.query.searchTenantPartyCandidates({
    tenantId: seed.tenantId,
    keyword: seed.legalName,
    partyType: 'ORGANIZATION',
    registeredCountry: seed.registeredCountry,
    identifiers: [
      {
        identifierType: seed.identifierType,
        normalizedValue: seed.identifierValue,
        rawValue: seed.identifierValue,
        issuerCountryOrRegion: seed.registeredCountry,
      },
    ],
  });

  const matchedCandidate = candidateResponse?.candidates?.find(
    (candidate) => candidate?.tenantParty?.id === tenantPartyId,
  );
  if (!matchedCandidate) {
    throw new Error('party-service smoke failed: searchTenantPartyCandidates did not return the registered tenant party');
  }

  log(`candidate matched tenantParty=${tenantPartyId}`);

  const tenantPartyResponse = await services.query.getTenantPartyById({
    tenantId: seed.tenantId,
    tenantPartyId,
  });

  if (tenantPartyResponse?.tenantParty?.id !== tenantPartyId) {
    throw new Error('party-service smoke failed: getTenantPartyById did not resolve the registered tenant party');
  }

  log(`tenant party lookup resolved tenantParty=${tenantPartyId}`);

  return {
    tenantPartyId,
    matchResult: registerResponse?.matchResult ?? '',
  };
}
