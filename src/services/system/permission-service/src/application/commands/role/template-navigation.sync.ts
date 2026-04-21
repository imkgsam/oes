import { NavigationRepository, RoleNavigationConfig } from '../../../domain/repositories/navigation.repository'
import { RoleLandingPolicy } from '../../../domain/vo/role-landing-policy.value-object'
import { RoleNavigationVisibility } from '../../../domain/vo/role-navigation-visibility.value-object'

/** syncTemplateNavigationToRole snapshots one template's navigation rules onto a target role id. */
export async function syncTemplateNavigationToRole(
  navigationRepo: NavigationRepository,
  templateRoleId: string,
  targetRoleId: string
): Promise<RoleNavigationConfig> {
  const templateNavigation = await navigationRepo.findRoleNavigation(templateRoleId)

  await navigationRepo.replaceRoleVisibility(
    targetRoleId,
    templateNavigation.visibility.map(
      (item) =>
        new RoleNavigationVisibility(
          targetRoleId,
          item.entryKey,
          item.terminal,
          item.enabled
        )
    )
  )

  return navigationRepo.replaceRoleLandingPolicies(
    targetRoleId,
    templateNavigation.landingPolicies.map(
      (policy) =>
        new RoleLandingPolicy(
          targetRoleId,
          policy.terminal,
          policy.defaultEntryKey,
          policy.priority,
          policy.enabled
        )
    )
  )
}
