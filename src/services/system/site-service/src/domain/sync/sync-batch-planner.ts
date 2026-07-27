export type SiteSyncResourceType = 'product' | 'category' | 'content' | 'blog' | 'news' | 'article-category' | 'faq' | 'site-exposure'
export type SiteSyncChangeType = 'create' | 'update' | 'unpublish' | 'locale_activate' | 'locale_disable'

export interface PendingSyncResource {
  resourceType: SiteSyncResourceType
  resourceId: string
  locale: string
  changeType: SiteSyncChangeType
  markedAt: Date
  syncRevision: number
}

export interface SyncBatchPlan {
  siteId: string
  publishVersion: number
  resources: Array<
    Omit<PendingSyncResource, 'markedAt' | 'syncRevision'> & { expectedRevision: number }
  >
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
  for (const resource of input.pendingResources) {
    const key = resourceKey(resource)
    const current = latestByResource.get(key)
    if (!current || resource.syncRevision > current.syncRevision) {
      latestByResource.set(key, resource)
    }
  }

  const resources = Array.from(latestByResource.values()).map(
    ({ markedAt: _markedAt, syncRevision, ...resource }) => {
      const planned = { ...resource } as Omit<
        PendingSyncResource,
        'markedAt' | 'syncRevision'
      > & { expectedRevision: number }
      // Keep the revision internal to the planner result so existing public batch shapes stay stable.
      Object.defineProperty(planned, 'expectedRevision', {
        value: syncRevision,
        enumerable: false,
        writable: false
      })
      return planned
    }
  )

  return {
    siteId: input.siteId,
    publishVersion: input.currentPublishVersion + 1,
    resources
  }
}

/** resourceKey identifies the final public view affected by one sync resource. */
function resourceKey(resource: PendingSyncResource): string {
  return `${resource.resourceType}:${resource.resourceId}:${resource.locale}`
}
