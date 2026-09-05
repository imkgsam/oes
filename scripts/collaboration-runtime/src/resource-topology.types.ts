export const RESOURCE_TOPOLOGY_VERSIONS = ['owner-exclusive-v2'] as const

export type ResourceTopologyVersion = (typeof RESOURCE_TOPOLOGY_VERSIONS)[number]

export interface OwnerResourceReference {
  path: string
  sha256: string
  fingerprint: string
}

export interface OwnerResourceBinding {
  schemaVersion: 1
  kind: 'OES_OWNER_RESOURCE_BINDING'
  bindingFingerprint: string
  resourceTopologyVersion: ResourceTopologyVersion
  ownerTaskId: string
  directParentTaskId: string
  transitionId: string
  repositoryRoot: string
  repositoryRemoteUrl?: string
  ownerClone: string
  ownerGitDirectory: string
  ownerRef: string
  artifactRoot: string
  taskTempRoot: string
  deliveryPackagePath: string
  currentEvidenceManifestPath: string
  checkpointBundlePath: string
  gitBundlePath: string | null
}

export interface OwnerResourceObservation {
  ownerCloneExists: boolean
  ownerGitDirectory: string | null
  ownerGitCommonDirectory: string | null
  ownerRepositoryRemoteUrl: string | null
  ownerRef: string | null
  ownerHeadSha: string | null
  artifactRootExists: boolean
  taskTempRootExists: boolean
  deliveryPackageExists: boolean
  currentEvidenceManifestExists: boolean
  checkpointBundleExists: boolean
  gitBundleExists: boolean
}

export interface OwnerEvidenceReference {
  path: string
  sha256: string
}

export interface OwnerCurrentEvidenceManifest {
  schemaVersion: 1
  kind: 'OES_OWNER_CURRENT_EVIDENCE_MANIFEST'
  manifestFingerprint: string
  ownerTaskId: string
  transitionId: string
  stateVersion: number
  resourceBindingFingerprint: string
  deliveryPackage: OwnerEvidenceReference
  candidateSha: string | null
  evidence: OwnerEvidenceReference[]
  scratchPaths: string[]
}

export interface OwnerCheckpointBundle {
  schemaVersion: 1
  kind: 'OES_OWNER_CHECKPOINT_BUNDLE'
  bundleFingerprint: string
  ownerTaskId: string
  transitionId: string
  resourceBindingFingerprint: string
  ownerRef: string
  headSha: string
  deliveryPackage: OwnerEvidenceReference
  currentEvidenceManifest: OwnerResourceReference
  gitBundle: OwnerEvidenceReference | null
}

export interface OwnerDurabilityArtifacts {
  manifest: OwnerCurrentEvidenceManifest
  checkpointBundle: OwnerCheckpointBundle
}

export type OwnerRecoveryDecision =
  | 'REUSE_EXACT'
  | 'RESTORE_EXACT_OWNER_CLONE'
  | 'REBUILD_SCRATCH'
  | 'RESOURCE_BINDING_MISMATCH'

export interface OwnerRecoveryRequest {
  ownerTaskId: string
  transitionId: string
  ownerRef: string
  binding: OwnerResourceBinding
  manifest: OwnerCurrentEvidenceManifest
  checkpointBundle: OwnerCheckpointBundle
  observation: OwnerResourceObservation
}

export interface OwnerRecoveryPlan {
  decision: OwnerRecoveryDecision
  preserveBinding: true
  operations: Array<'RESTORE_CLONE_FROM_BUNDLE' | 'REBUILD_TASK_TEMP_FROM_MANIFEST'>
  reason: string
}

export interface OwnerRecoveryAdapter {
  restoreCloneFromBundle(
    binding: OwnerResourceBinding,
    checkpointBundle: OwnerCheckpointBundle
  ): Promise<void> | void
  rebuildTaskTemp(
    binding: OwnerResourceBinding,
    manifest: OwnerCurrentEvidenceManifest
  ): Promise<void> | void
  observe(
    binding: OwnerResourceBinding
  ): Promise<OwnerResourceObservation> | OwnerResourceObservation
}

export interface EffectiveOwnerResourceTopology {
  resourceTopologyVersion: ResourceTopologyVersion
  ownerResourceBinding: OwnerResourceReference | null
}

// V2 owner-resource fields are shared by remote and cleanup envelopes.
declare module './types.ts' {
  interface RemoteTrustRoots {
    resourceTopologyVersion?: ResourceTopologyVersion
    ownerResourceBinding?: OwnerResourceReference | null
  }

  interface RemoteAuthorizationRoot {
    resourceTopologyVersion?: 'owner-exclusive-v2'
    ownerResourceBinding?: OwnerResourceReference
  }

  interface RemoteActionAuthorization {
    resourceTopologyVersion?: 'owner-exclusive-v2'
    ownerResourceBinding?: OwnerResourceReference
  }

  interface RemoteDriverBinding {
    resourceTopologyVersion?: 'owner-exclusive-v2'
    ownerResourceBinding?: OwnerResourceReference
  }

  interface EffectiveProfileReport {
    resourceTopology?: EffectiveOwnerResourceTopology
  }
}
