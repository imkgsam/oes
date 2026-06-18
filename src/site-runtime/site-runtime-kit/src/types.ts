export type SiteRuntimeStatus = 'healthy' | 'degraded' | 'blocked' | 'failed' | 'unknown'

export type ResourceType = 'product' | 'category' | 'content' | 'blog' | 'news'

export type PublishedResourceStatus = 'published' | 'unpublished' | 'deleted' | 'disabled'

export interface SiteCredential {
  siteId: string
  clientId: string
  credentialId: string
  clientSecret: string
  webhookSigningSecret: string
  oesBaseUrl: string
  environment: string
}

export interface PublicViewEnvelope<TPayload = unknown> {
  siteId: string
  resourceType: ResourceType
  resourceId: string
  locale: string
  slug: string
  status: PublishedResourceStatus | 'draft_preview'
  publishVersion: number
  updatedAt: string
  payload: TPayload
}

export interface StoredPublishedResource {
  siteId: string
  resourceType: ResourceType
  resourceId: string
  slug: string
  locale: string
  status: PublishedResourceStatus
  publishVersion: number
  payloadJson: string
  updatedAt: string
}

export interface PublishState {
  siteId: string
  localPublishVersion: number
  latestSyncId: string | null
  lastSuccessfulSyncAt: string | null
  lastKnownRemotePublishVersion: number | null
}

export interface ListPublishedResourcesQuery {
  siteId: string
  resourceType: ResourceType
  locale?: string
  status?: PublishedResourceStatus
  cursor?: string
  limit?: number
}

export interface GetPublishedResourceBySlugQuery {
  siteId: string
  resourceType: ResourceType
  slug: string
  locale: string
  status?: PublishedResourceStatus
}

export interface SyncRunStart {
  siteId: string
  trigger: string
  fromPublishVersion: number
  toPublishVersion: number | null
}

export interface SyncRunCompletion {
  status: 'completed' | 'failed' | 'degraded' | 'blocked'
  localPublishVersion: number
  errorCode?: string
  errorMessage?: string
}

export interface StoredSyncRun {
  runId: string
  siteId: string
  trigger: string
  fromPublishVersion: number
  toPublishVersion: number | null
  status: string
  startedAt: string
  completedAt: string | null
  localPublishVersion: number | null
  errorCode: string | null
  errorMessage: string | null
}

export interface SnapshotReplacement {
  siteId: string
  publishVersion: number
  resources: StoredPublishedResource[]
}

export interface LocalPublishedStore {
  init(): Promise<void>
  close(): Promise<void>
  getPublishState(siteId: string): Promise<PublishState>
  updatePublishState(state: PublishState): Promise<void>
  beginSyncRun(input: SyncRunStart): Promise<string>
  completeSyncRun(runId: string, completion: SyncRunCompletion): Promise<void>
  getSyncRun(runId: string): Promise<StoredSyncRun | null>
  rememberWebhookEvent(siteId: string, eventId: string, nonce: string): Promise<boolean>
  hasWebhookEvent(siteId: string, eventId: string): Promise<boolean>
  hasWebhookNonce(siteId: string, nonce: string): Promise<boolean>
  rememberWebhookNonce(siteId: string, nonce: string): Promise<void>
  upsertPublishedResources(resources: StoredPublishedResource[]): Promise<void>
  replaceSnapshot(input: SnapshotReplacement): Promise<void>
  listPublishedResources(query: ListPublishedResourcesQuery): Promise<{
    items: StoredPublishedResource[]
    nextCursor: string | null
  }>
  getPublishedResourceBySlug(
    query: GetPublishedResourceBySlugQuery
  ): Promise<StoredPublishedResource | null>
}
