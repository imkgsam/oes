// Resolves tenant-scoped local auth seed rows against pre-existing tenant codes so repeated seeds stay idempotent across local fixture revisions.
export function resolveTenantWebAuthSeedState({
  existingIdentityTenants,
  existingPermissionRoles = [],
  existingTenantOrgTenants,
  seededAccountRoleBindings,
  seededAccounts,
  seededCompanies,
  seededContactAssets,
  seededTenantOrgRootUnits,
  seededTenantOrgTenants,
  seededTenantRoles,
}) {
  const identityTenantByCode = new Map(
    existingIdentityTenants.map((tenant) => [tenant.code, tenant]),
  );
  const tenantOrgTenantByCode = new Map(
    existingTenantOrgTenants.map((tenant) => [tenant.code, tenant]),
  );

  const effectiveCompanyByOriginalId = new Map();
  const effectiveCompanies = seededCompanies.map((company) => {
    const tenantOrgTenant = tenantOrgTenantByCode.get(company.code);
    const identityTenant = identityTenantByCode.get(company.code);
    const effectiveCompany = {
      ...company,
      id: tenantOrgTenant?.id ?? identityTenant?.id ?? company.id,
      rootOrgId: tenantOrgTenant?.rootOrgId ?? company.rootOrgId,
    };

    effectiveCompanyByOriginalId.set(company.id, effectiveCompany);
    return effectiveCompany;
  });

  const remapTenantId = (tenantId) =>
    tenantId ? (effectiveCompanyByOriginalId.get(tenantId)?.id ?? tenantId) : tenantId;
  const remapRootOrgId = (tenantId, rootOrgId) =>
    effectiveCompanyByOriginalId.get(tenantId)?.rootOrgId ?? rootOrgId;
  const remappedTenantRoles = seededTenantRoles.map((role) => ({
    ...role,
    scopeKey: remapTenantId(role.scopeKey),
    tenantId: remapTenantId(role.tenantId),
  }));
  const existingPermissionRoleByKey = new Map(
    existingPermissionRoles.map((role) => [
      `${role.scopeKey}|${role.kind}|${role.code}`,
      role,
    ]),
  );
  const effectiveRoleIdByOriginalRoleId = new Map();
  const effectiveTenantRoles = remappedTenantRoles.map((role) => {
    const existingRole = existingPermissionRoleByKey.get(
      `${role.scopeKey}|${role.kind}|${role.code}`,
    );
    const effectiveRole = {
      ...role,
      id: existingRole?.id ?? role.id,
    };

    effectiveRoleIdByOriginalRoleId.set(role.id, effectiveRole.id);
    return effectiveRole;
  });

  return {
    seededAccountRoleBindings: seededAccountRoleBindings.map((binding) => ({
      ...binding,
      roleId: effectiveRoleIdByOriginalRoleId.get(binding.roleId) ?? binding.roleId,
      tenantId: remapTenantId(binding.tenantId),
    })),
    seededAccounts: seededAccounts.map((account) => ({
      ...account,
      contextKey: remapTenantId(account.contextKey) ?? account.contextKey,
      tenantId: remapTenantId(account.tenantId),
    })),
    seededCompanies: effectiveCompanies,
    seededContactAssets: seededContactAssets.map((asset) => ({
      ...asset,
      tenantId: remapTenantId(asset.tenantId),
    })),
    seededTenantOrgRootUnits: seededTenantOrgRootUnits.map((orgUnit) => {
      const nextTenantId = remapTenantId(orgUnit.tenantId);
      const nextRootOrgId = remapRootOrgId(orgUnit.tenantId, orgUnit.id);

      return {
        ...orgUnit,
        id: nextRootOrgId,
        path: `/${nextRootOrgId}`,
        tenantId: nextTenantId,
      };
    }),
    seededTenantOrgTenants: seededTenantOrgTenants.map((tenant) => ({
      ...tenant,
      id: remapTenantId(tenant.id),
      rootOrgId: remapRootOrgId(tenant.id, tenant.rootOrgId),
    })),
    seededTenantRoles: effectiveTenantRoles,
  };
}

// Identifies stale identity users that still occupy managed usernames, emails, or phones from older local seed revisions.
export function buildConflictingIdentityUserIds({
  existingUsers,
  managedUserIds,
  seededUsers,
}) {
  const managedUserIdSet = new Set(managedUserIds);
  const seededUsernames = new Set(
    seededUsers.map((user) => user.username).filter(Boolean),
  );
  const seededEmails = new Set(
    seededUsers.map((user) => user.email).filter(Boolean),
  );
  const seededPhones = new Set(
    seededUsers.map((user) => user.phone).filter(Boolean),
  );

  return existingUsers
    .filter((user) => !managedUserIdSet.has(user.id))
    .filter(
      (user) =>
        seededUsernames.has(user.username) ||
        seededEmails.has(user.email) ||
        seededPhones.has(user.phone),
    )
    .map((user) => user.id);
}
