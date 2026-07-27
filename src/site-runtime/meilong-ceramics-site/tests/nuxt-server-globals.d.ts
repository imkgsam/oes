declare function defineEventHandler<T>(handler: (event: any) => T): (event: any) => T
declare function getQuery(event: any): Record<string, string | string[] | undefined>
declare function getRouterParam(event: any, name: string): string | undefined
declare function createError(input: {
  statusCode: number
  statusMessage: string
}): Error & { statusCode: number }
