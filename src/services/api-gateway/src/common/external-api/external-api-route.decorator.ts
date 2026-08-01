import { SetMetadata } from '@nestjs/common'

/** Marks one Gateway HTTP handler as explicitly eligible for future external API exposure. */
export const EXTERNAL_API_ROUTE_METADATA_KEY = 'oes:external-api-route'
export const ExternalApiRoute = () => SetMetadata(EXTERNAL_API_ROUTE_METADATA_KEY, true)
