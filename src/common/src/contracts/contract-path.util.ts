import { dirname, join } from 'path'

const commonPackageRoot = dirname(dirname(require.resolve('@oes/common')))

/**
 * Resolve an absolute path under the shared contracts directory in @oes/common.
 */
export function resolveCommonContractPath(...segments: string[]): string {
  return join(commonPackageRoot, 'src', 'contracts', ...segments)
}

/**
 * Resolve an absolute proto file path under the shared contracts directory.
 */
export function resolveCommonProtoPath(relativePath: string): string {
  return resolveCommonContractPath(relativePath)
}
