import net from 'node:net'

export type BusinessCardLiveStackEndpoint = {
  name: string
  host: string
  port: number
}

export type BusinessCardLiveStackFixtureInput = {
  name: string
  present: boolean
}

export type BusinessCardLiveStackServiceCheck = BusinessCardLiveStackEndpoint & {
  reachable: boolean
}

export type BusinessCardLiveStackPreflightReport = {
  fixtureInputs: BusinessCardLiveStackFixtureInput[]
  missing: string[]
  ready: boolean
  services: BusinessCardLiveStackServiceCheck[]
}

export const BUSINESS_CARD_LIVE_STACK_REQUIRED_SERVICES: BusinessCardLiveStackEndpoint[] = [
  { name: 'permission-service', host: '127.0.0.1', port: 50051 },
  { name: 'identity-service', host: '127.0.0.1', port: 50052 },
  { name: 'tenant-org-service', host: '127.0.0.1', port: 50054 },
  { name: 'hr-service', host: '127.0.0.1', port: 50055 },
  { name: 'public-entry-service', host: '127.0.0.1', port: 50067 },
  { name: 'api-gateway', host: '127.0.0.1', port: 9101 }
]

export const BUSINESS_CARD_LIVE_STACK_REQUIRED_FIXTURE_ENVS = [
  'BUSINESS_CARD_LIVE_TENANT_ID',
  'BUSINESS_CARD_LIVE_EMPLOYEE_ID',
  'BUSINESS_CARD_LIVE_OPERATOR_ACCOUNT_ID',
  'BUSINESS_CARD_LIVE_SELF_ACCOUNT_ID',
  'BUSINESS_CARD_LIVE_WORK_EMAIL_CONTACT_ASSET_ID'
] as const

type PreflightOptions = {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>
  probeEndpoint?: (endpoint: BusinessCardLiveStackEndpoint) => Promise<boolean>
  services?: BusinessCardLiveStackEndpoint[]
}

// buildBusinessCardLiveStackPreflightReport checks whether the real Phase 1 service chain and fixtures are available.
export async function buildBusinessCardLiveStackPreflightReport(
  options: PreflightOptions = {}
): Promise<BusinessCardLiveStackPreflightReport> {
  const env = options.env ?? process.env
  const probeEndpoint = options.probeEndpoint ?? probeTcpEndpoint
  const services = await Promise.all(
    (options.services ?? BUSINESS_CARD_LIVE_STACK_REQUIRED_SERVICES).map(async (endpoint) => ({
      ...endpoint,
      reachable: await probeEndpoint(endpoint)
    }))
  )
  const fixtureInputs = BUSINESS_CARD_LIVE_STACK_REQUIRED_FIXTURE_ENVS.map((name) => ({
    name,
    present: Boolean(env[name]?.trim())
  }))
  const missing = [
    ...services
      .filter((service) => !service.reachable)
      .map((service) => `${service.name} endpoint ${service.host}:${service.port} is not reachable`),
    ...fixtureInputs
      .filter((fixture) => !fixture.present)
      .map((fixture) => `fixture env ${fixture.name} is missing`)
  ]

  return {
    fixtureInputs,
    missing,
    ready: missing.length === 0,
    services
  }
}

// probeTcpEndpoint opens a short TCP connection to one local service endpoint.
export function probeTcpEndpoint(endpoint: BusinessCardLiveStackEndpoint): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: endpoint.host, port: endpoint.port })
    const finish = (reachable: boolean) => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(reachable)
    }
    socket.setTimeout(1000)
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.once('timeout', () => finish(false))
  })
}

// renderBusinessCardLiveStackPreflightReport formats the readiness result for local smoke execution.
export function renderBusinessCardLiveStackPreflightReport(report: BusinessCardLiveStackPreflightReport): string {
  const lines = [
    `[business-card-live-stack] ready=${report.ready}`,
    ...report.services.map((service) =>
      `[business-card-live-stack] service ${service.name} ${service.host}:${service.port} reachable=${service.reachable}`
    ),
    ...report.fixtureInputs.map((fixture) =>
      `[business-card-live-stack] fixture ${fixture.name} present=${fixture.present}`
    )
  ]
  if (report.missing.length > 0) {
    lines.push('[business-card-live-stack] missing:')
    lines.push(...report.missing.map((item) => `- ${item}`))
  }
  return lines.join('\n')
}

// runBusinessCardLiveStackPreflightCli exits non-zero until the real service chain and fixtures are ready.
export async function runBusinessCardLiveStackPreflightCli() {
  const report = await buildBusinessCardLiveStackPreflightReport()
  console.log(renderBusinessCardLiveStackPreflightReport(report))
  if (!report.ready) {
    process.exitCode = 1
  }
}

if (require.main === module) {
  void runBusinessCardLiveStackPreflightCli()
}
