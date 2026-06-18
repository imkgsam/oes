export type SiteSyncResourceType = 'product' | 'category' | 'content' | 'blog' | 'news'
export type SiteSyncChangeType = 'create' | 'update' | 'unpublish' | 'locale_activate' | 'locale_disable'

export interface PendingSyncResource {
  resourceType: SiteSyncResourceType
  resourceId: string
  locale: string
  changeType: SiteSyncChangeType
  markedAt: Date
}

export interface SyncBatchPlan {
  siteId: string
  publishVersion: number
  resources: Array<Omit<PendingSyncResource, 'markedAt'>>
}

export interface CreateSyncBatchPlanInput {
  siteId: string
  currentPublishVersion: number
  pendingResources: PendingSyncResource[]
}

/** createSyncBatchPlan advances publishVersion only when pending resources exist and aggregates final changes. */
export function createSyncBatchPlan(input: CreateSyncBatchPlanInput): SyncBatchPlan | null {
  if (input.pendingResources.length === 0) {
    return null
  }

  const latestByResource = new Map<string, PendingSyncResource>()
  for (const resource of [...input.pendingResources].sort((left, right) => left.markedAt.getTime() - right.markedAt.getTime())) {
    latestByResource.set(resourceKey(resource), resource)
  }

  return {
    siteId: input.siteId,
    publishVersion: input.currentPublishVersion + 1,
    resources: Array.from(latestByResource.values()).map(({ markedAt: _markedAt, ...resource }) => resource)
  }
}

/** resourceKey identifies the final public view affected by one sync resource. */
function resourceKey(resource: PendingSyncResource): string {
  return `${resource.resourceType}:${resource.resourceId}:${resource.locale}`
}
