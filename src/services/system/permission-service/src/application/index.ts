export * from './commands'
export * from './queries'

import { CommandHandlers } from './commands'
import { QueryHandlers } from './queries'

export const AllHandlers = [...CommandHandlers, ...QueryHandlers]
