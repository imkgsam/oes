import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const generatedRoot = join(workspaceRoot, 'src/common/src/generated')

/** Recursively lists generated TypeScript source files for a read-only signature inventory. */
async function listTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory()
        ? listTypeScriptFiles(path)
        : entry.isFile() && path.endsWith('.ts')
          ? [path]
          : []
    })
  )

  return files.flat()
}

/** Counts generated client call signatures so future migration lanes can inventory metadata readiness without changing callers. */
function inspectGeneratedSignature(source) {
  const clientInterfaces = source.match(/export interface \w+Client \{[\s\S]*?\n\}/g) ?? []
  let explicitMetadataSignatures = 0
  let missingExplicitMetadataSignatures = 0

  for (const clientInterface of clientInterfaces) {
    const methods = clientInterface.match(/^\s+\w+\([^;]+?\):\s*Observable<[^;]+>;/gms) ?? []

    for (const method of methods) {
      if (method.includes('metadata: Metadata')) {
        explicitMetadataSignatures += 1
      } else {
        missingExplicitMetadataSignatures += 1
      }
    }
  }

  return { explicitMetadataSignatures, missingExplicitMetadataSignatures }
}

/** Reports whether generated client RPC signatures explicitly require gRPC metadata without enforcing any authorization mode. */
async function main() {
  const files = await listTypeScriptFiles(generatedRoot)
  const results = await Promise.all(
    files.map(async (path) => inspectGeneratedSignature(await readFile(path, 'utf8')))
  )
  const explicitMetadataSignatures = results.reduce(
    (total, result) => total + result.explicitMetadataSignatures,
    0
  )
  const missingExplicitMetadataSignatures = results.reduce(
    (total, result) => total + result.missingExplicitMetadataSignatures,
    0
  )

  if (explicitMetadataSignatures === 0 || missingExplicitMetadataSignatures > 0) {
    throw new Error(
      `Generated gRPC metadata signature inventory failed: explicit=${explicitMetadataSignatures}, missing=${missingExplicitMetadataSignatures}`
    )
  }

  console.log(
    JSON.stringify(
      {
        generatedFiles: files.length,
        explicitMetadataSignatures,
        missingExplicitMetadataSignatures
      },
      null,
      2
    )
  )
}

await main()
