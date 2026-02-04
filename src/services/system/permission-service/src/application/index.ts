export * from './commands'
export * from './queries'
export * from './cqrs'

import { CommandHandlers } from './commands'
import { QueryHandlers } from './queries'

export const AllHandlers = [...CommandHandlers, ...QueryHandlers]
