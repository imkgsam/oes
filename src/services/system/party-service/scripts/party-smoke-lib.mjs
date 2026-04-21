// Builds one deterministic smoke seed so the gRPC smoke flow can be asserted and repeated locally.
export function createSmokeSeed(now = Date.now()) {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    tenantId: `smoke-tenant-${suffix}`,
    canonicalName: `Smoke Organization ${suffix}`,
    localDisplayName: `Smoke Local ${suffix}`,
    localCode: `SMOKE-${suffix}`,
    registeredCountry: 'CN',
    identifierType: 'BUSINESS_REG_NO',
    identifierValue: `smoke-reg-${suffix}`,
  };
}

// Executes the minimal party-service smoke scenario against injected gRPC service stubs.
export async function runPartySmokeFlow(services, seed, log = () => {}) {
  const registerResponse = await services.registration.registerOrganizationParty({
    tenantId: seed.tenantId,
    canonicalName: seed.canonicalName,
    localDisplayName: seed.localDisplayName,
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
  const partyId = registerResponse?.party?.id;

  if (!tenantPartyId || !partyId) {
    throw new Error('party-service smoke failed: registerOrganizationParty did not return party and tenantParty ids');
  }

  log(`registered tenantParty=${tenantPartyId} party=${partyId}`);

  const candidateResponse = await services.query.searchPartyCandidates({
    tenantId: seed.tenantId,
    keyword: seed.canonicalName,
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

  const matchedCandidate = candidateResponse?.candidates?.find((candidate) => candidate?.party?.id === partyId);
  if (!matchedCandidate) {
    throw new Error('party-service smoke failed: searchPartyCandidates did not return the registered party');
  }

  log(`candidate matched party=${partyId}`);

  const tenantPartyResponse = await services.query.getTenantPartyById({
    tenantId: seed.tenantId,
    tenantPartyId,
  });

  if (tenantPartyResponse?.tenantParty?.partyId !== partyId) {
    throw new Error('party-service smoke failed: getTenantPartyById did not resolve the registered tenant party');
  }

  log(`tenant party lookup resolved party=${partyId}`);

  return {
    partyId,
    tenantPartyId,
    matchResult: registerResponse?.matchResult ?? '',
  };
}
