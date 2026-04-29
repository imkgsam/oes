
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model SalesSequenceCounter
 * 
 */
export type SalesSequenceCounter = $Result.DefaultSelection<Prisma.$SalesSequenceCounterPayload>
/**
 * Model SalesQuote
 * 
 */
export type SalesQuote = $Result.DefaultSelection<Prisma.$SalesQuotePayload>
/**
 * Model SalesQuoteLine
 * 
 */
export type SalesQuoteLine = $Result.DefaultSelection<Prisma.$SalesQuoteLinePayload>
/**
 * Model SalesQuoteVersion
 * 
 */
export type SalesQuoteVersion = $Result.DefaultSelection<Prisma.$SalesQuoteVersionPayload>
/**
 * Model SalesQuoteVersionLine
 * 
 */
export type SalesQuoteVersionLine = $Result.DefaultSelection<Prisma.$SalesQuoteVersionLinePayload>
/**
 * Model SalesOrder
 * 
 */
export type SalesOrder = $Result.DefaultSelection<Prisma.$SalesOrderPayload>
/**
 * Model SalesOrderCommercialGateSummary
 * 
 */
export type SalesOrderCommercialGateSummary = $Result.DefaultSelection<Prisma.$SalesOrderCommercialGateSummaryPayload>
/**
 * Model SalesOrderFulfillmentHandoffSummary
 * 
 */
export type SalesOrderFulfillmentHandoffSummary = $Result.DefaultSelection<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
/**
 * Model SalesOrderLine
 * 
 */
export type SalesOrderLine = $Result.DefaultSelection<Prisma.$SalesOrderLinePayload>
/**
 * Model SalesPriceList
 * 
 */
export type SalesPriceList = $Result.DefaultSelection<Prisma.$SalesPriceListPayload>
/**
 * Model SalesPriceListLine
 * 
 */
export type SalesPriceListLine = $Result.DefaultSelection<Prisma.$SalesPriceListLinePayload>
/**
 * Model SalesCustomerPriceAgreementVersion
 * 
 */
export type SalesCustomerPriceAgreementVersion = $Result.DefaultSelection<Prisma.$SalesCustomerPriceAgreementVersionPayload>
/**
 * Model SalesCustomerPriceAgreementLine
 * 
 */
export type SalesCustomerPriceAgreementLine = $Result.DefaultSelection<Prisma.$SalesCustomerPriceAgreementLinePayload>
/**
 * Model SalesAuditEnvelope
 * 
 */
export type SalesAuditEnvelope = $Result.DefaultSelection<Prisma.$SalesAuditEnvelopePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SalesQuoteStatus: {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED'
};

export type SalesQuoteStatus = (typeof SalesQuoteStatus)[keyof typeof SalesQuoteStatus]


export const SalesFulfillmentHandoffStatus: {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  SUBMITTED: 'SUBMITTED'
};

export type SalesFulfillmentHandoffStatus = (typeof SalesFulfillmentHandoffStatus)[keyof typeof SalesFulfillmentHandoffStatus]


export const PriceListType: {
  STANDARD: 'STANDARD',
  ACTIVITY: 'ACTIVITY',
  EXHIBITION: 'EXHIBITION'
};

export type PriceListType = (typeof PriceListType)[keyof typeof PriceListType]


export const PriceListStatus: {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type PriceListStatus = (typeof PriceListStatus)[keyof typeof PriceListStatus]


export const CustomerPriceAgreementStatus: {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED'
};

export type CustomerPriceAgreementStatus = (typeof CustomerPriceAgreementStatus)[keyof typeof CustomerPriceAgreementStatus]

}

export type SalesQuoteStatus = $Enums.SalesQuoteStatus

export const SalesQuoteStatus: typeof $Enums.SalesQuoteStatus

export type SalesFulfillmentHandoffStatus = $Enums.SalesFulfillmentHandoffStatus

export const SalesFulfillmentHandoffStatus: typeof $Enums.SalesFulfillmentHandoffStatus

export type PriceListType = $Enums.PriceListType

export const PriceListType: typeof $Enums.PriceListType

export type PriceListStatus = $Enums.PriceListStatus

export const PriceListStatus: typeof $Enums.PriceListStatus

export type CustomerPriceAgreementStatus = $Enums.CustomerPriceAgreementStatus

export const CustomerPriceAgreementStatus: typeof $Enums.CustomerPriceAgreementStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SalesSequenceCounters
 * const salesSequenceCounters = await prisma.salesSequenceCounter.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more SalesSequenceCounters
   * const salesSequenceCounters = await prisma.salesSequenceCounter.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs, $Utils.Call<Prisma.TypeMapCb, {
    extArgs: ExtArgs
  }>, ClientOptions>

      /**
   * `prisma.salesSequenceCounter`: Exposes CRUD operations for the **SalesSequenceCounter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesSequenceCounters
    * const salesSequenceCounters = await prisma.salesSequenceCounter.findMany()
    * ```
    */
  get salesSequenceCounter(): Prisma.SalesSequenceCounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesQuote`: Exposes CRUD operations for the **SalesQuote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesQuotes
    * const salesQuotes = await prisma.salesQuote.findMany()
    * ```
    */
  get salesQuote(): Prisma.SalesQuoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesQuoteLine`: Exposes CRUD operations for the **SalesQuoteLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesQuoteLines
    * const salesQuoteLines = await prisma.salesQuoteLine.findMany()
    * ```
    */
  get salesQuoteLine(): Prisma.SalesQuoteLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesQuoteVersion`: Exposes CRUD operations for the **SalesQuoteVersion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesQuoteVersions
    * const salesQuoteVersions = await prisma.salesQuoteVersion.findMany()
    * ```
    */
  get salesQuoteVersion(): Prisma.SalesQuoteVersionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesQuoteVersionLine`: Exposes CRUD operations for the **SalesQuoteVersionLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesQuoteVersionLines
    * const salesQuoteVersionLines = await prisma.salesQuoteVersionLine.findMany()
    * ```
    */
  get salesQuoteVersionLine(): Prisma.SalesQuoteVersionLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesOrder`: Exposes CRUD operations for the **SalesOrder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesOrders
    * const salesOrders = await prisma.salesOrder.findMany()
    * ```
    */
  get salesOrder(): Prisma.SalesOrderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesOrderCommercialGateSummary`: Exposes CRUD operations for the **SalesOrderCommercialGateSummary** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesOrderCommercialGateSummaries
    * const salesOrderCommercialGateSummaries = await prisma.salesOrderCommercialGateSummary.findMany()
    * ```
    */
  get salesOrderCommercialGateSummary(): Prisma.SalesOrderCommercialGateSummaryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesOrderFulfillmentHandoffSummary`: Exposes CRUD operations for the **SalesOrderFulfillmentHandoffSummary** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesOrderFulfillmentHandoffSummaries
    * const salesOrderFulfillmentHandoffSummaries = await prisma.salesOrderFulfillmentHandoffSummary.findMany()
    * ```
    */
  get salesOrderFulfillmentHandoffSummary(): Prisma.SalesOrderFulfillmentHandoffSummaryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesOrderLine`: Exposes CRUD operations for the **SalesOrderLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesOrderLines
    * const salesOrderLines = await prisma.salesOrderLine.findMany()
    * ```
    */
  get salesOrderLine(): Prisma.SalesOrderLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesPriceList`: Exposes CRUD operations for the **SalesPriceList** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesPriceLists
    * const salesPriceLists = await prisma.salesPriceList.findMany()
    * ```
    */
  get salesPriceList(): Prisma.SalesPriceListDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesPriceListLine`: Exposes CRUD operations for the **SalesPriceListLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesPriceListLines
    * const salesPriceListLines = await prisma.salesPriceListLine.findMany()
    * ```
    */
  get salesPriceListLine(): Prisma.SalesPriceListLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesCustomerPriceAgreementVersion`: Exposes CRUD operations for the **SalesCustomerPriceAgreementVersion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesCustomerPriceAgreementVersions
    * const salesCustomerPriceAgreementVersions = await prisma.salesCustomerPriceAgreementVersion.findMany()
    * ```
    */
  get salesCustomerPriceAgreementVersion(): Prisma.SalesCustomerPriceAgreementVersionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesCustomerPriceAgreementLine`: Exposes CRUD operations for the **SalesCustomerPriceAgreementLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesCustomerPriceAgreementLines
    * const salesCustomerPriceAgreementLines = await prisma.salesCustomerPriceAgreementLine.findMany()
    * ```
    */
  get salesCustomerPriceAgreementLine(): Prisma.SalesCustomerPriceAgreementLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.salesAuditEnvelope`: Exposes CRUD operations for the **SalesAuditEnvelope** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SalesAuditEnvelopes
    * const salesAuditEnvelopes = await prisma.salesAuditEnvelope.findMany()
    * ```
    */
  get salesAuditEnvelope(): Prisma.SalesAuditEnvelopeDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.4.1
   * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    SalesSequenceCounter: 'SalesSequenceCounter',
    SalesQuote: 'SalesQuote',
    SalesQuoteLine: 'SalesQuoteLine',
    SalesQuoteVersion: 'SalesQuoteVersion',
    SalesQuoteVersionLine: 'SalesQuoteVersionLine',
    SalesOrder: 'SalesOrder',
    SalesOrderCommercialGateSummary: 'SalesOrderCommercialGateSummary',
    SalesOrderFulfillmentHandoffSummary: 'SalesOrderFulfillmentHandoffSummary',
    SalesOrderLine: 'SalesOrderLine',
    SalesPriceList: 'SalesPriceList',
    SalesPriceListLine: 'SalesPriceListLine',
    SalesCustomerPriceAgreementVersion: 'SalesCustomerPriceAgreementVersion',
    SalesCustomerPriceAgreementLine: 'SalesCustomerPriceAgreementLine',
    SalesAuditEnvelope: 'SalesAuditEnvelope'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "salesSequenceCounter" | "salesQuote" | "salesQuoteLine" | "salesQuoteVersion" | "salesQuoteVersionLine" | "salesOrder" | "salesOrderCommercialGateSummary" | "salesOrderFulfillmentHandoffSummary" | "salesOrderLine" | "salesPriceList" | "salesPriceListLine" | "salesCustomerPriceAgreementVersion" | "salesCustomerPriceAgreementLine" | "salesAuditEnvelope"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      SalesSequenceCounter: {
        payload: Prisma.$SalesSequenceCounterPayload<ExtArgs>
        fields: Prisma.SalesSequenceCounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesSequenceCounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesSequenceCounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          findFirst: {
            args: Prisma.SalesSequenceCounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesSequenceCounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          findMany: {
            args: Prisma.SalesSequenceCounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>[]
          }
          create: {
            args: Prisma.SalesSequenceCounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          createMany: {
            args: Prisma.SalesSequenceCounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesSequenceCounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>[]
          }
          delete: {
            args: Prisma.SalesSequenceCounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          update: {
            args: Prisma.SalesSequenceCounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          deleteMany: {
            args: Prisma.SalesSequenceCounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesSequenceCounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesSequenceCounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>[]
          }
          upsert: {
            args: Prisma.SalesSequenceCounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesSequenceCounterPayload>
          }
          aggregate: {
            args: Prisma.SalesSequenceCounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesSequenceCounter>
          }
          groupBy: {
            args: Prisma.SalesSequenceCounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesSequenceCounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesSequenceCounterCountArgs<ExtArgs>
            result: $Utils.Optional<SalesSequenceCounterCountAggregateOutputType> | number
          }
        }
      }
      SalesQuote: {
        payload: Prisma.$SalesQuotePayload<ExtArgs>
        fields: Prisma.SalesQuoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesQuoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesQuoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          findFirst: {
            args: Prisma.SalesQuoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesQuoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          findMany: {
            args: Prisma.SalesQuoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>[]
          }
          create: {
            args: Prisma.SalesQuoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          createMany: {
            args: Prisma.SalesQuoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesQuoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>[]
          }
          delete: {
            args: Prisma.SalesQuoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          update: {
            args: Prisma.SalesQuoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          deleteMany: {
            args: Prisma.SalesQuoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesQuoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesQuoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>[]
          }
          upsert: {
            args: Prisma.SalesQuoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuotePayload>
          }
          aggregate: {
            args: Prisma.SalesQuoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesQuote>
          }
          groupBy: {
            args: Prisma.SalesQuoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesQuoteCountArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteCountAggregateOutputType> | number
          }
        }
      }
      SalesQuoteLine: {
        payload: Prisma.$SalesQuoteLinePayload<ExtArgs>
        fields: Prisma.SalesQuoteLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesQuoteLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesQuoteLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          findFirst: {
            args: Prisma.SalesQuoteLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesQuoteLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          findMany: {
            args: Prisma.SalesQuoteLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>[]
          }
          create: {
            args: Prisma.SalesQuoteLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          createMany: {
            args: Prisma.SalesQuoteLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesQuoteLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>[]
          }
          delete: {
            args: Prisma.SalesQuoteLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          update: {
            args: Prisma.SalesQuoteLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          deleteMany: {
            args: Prisma.SalesQuoteLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesQuoteLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesQuoteLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>[]
          }
          upsert: {
            args: Prisma.SalesQuoteLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteLinePayload>
          }
          aggregate: {
            args: Prisma.SalesQuoteLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesQuoteLine>
          }
          groupBy: {
            args: Prisma.SalesQuoteLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesQuoteLineCountArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteLineCountAggregateOutputType> | number
          }
        }
      }
      SalesQuoteVersion: {
        payload: Prisma.$SalesQuoteVersionPayload<ExtArgs>
        fields: Prisma.SalesQuoteVersionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesQuoteVersionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesQuoteVersionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          findFirst: {
            args: Prisma.SalesQuoteVersionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesQuoteVersionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          findMany: {
            args: Prisma.SalesQuoteVersionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>[]
          }
          create: {
            args: Prisma.SalesQuoteVersionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          createMany: {
            args: Prisma.SalesQuoteVersionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesQuoteVersionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>[]
          }
          delete: {
            args: Prisma.SalesQuoteVersionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          update: {
            args: Prisma.SalesQuoteVersionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          deleteMany: {
            args: Prisma.SalesQuoteVersionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesQuoteVersionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesQuoteVersionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>[]
          }
          upsert: {
            args: Prisma.SalesQuoteVersionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionPayload>
          }
          aggregate: {
            args: Prisma.SalesQuoteVersionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesQuoteVersion>
          }
          groupBy: {
            args: Prisma.SalesQuoteVersionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteVersionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesQuoteVersionCountArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteVersionCountAggregateOutputType> | number
          }
        }
      }
      SalesQuoteVersionLine: {
        payload: Prisma.$SalesQuoteVersionLinePayload<ExtArgs>
        fields: Prisma.SalesQuoteVersionLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesQuoteVersionLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesQuoteVersionLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          findFirst: {
            args: Prisma.SalesQuoteVersionLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesQuoteVersionLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          findMany: {
            args: Prisma.SalesQuoteVersionLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>[]
          }
          create: {
            args: Prisma.SalesQuoteVersionLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          createMany: {
            args: Prisma.SalesQuoteVersionLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesQuoteVersionLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>[]
          }
          delete: {
            args: Prisma.SalesQuoteVersionLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          update: {
            args: Prisma.SalesQuoteVersionLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          deleteMany: {
            args: Prisma.SalesQuoteVersionLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesQuoteVersionLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesQuoteVersionLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>[]
          }
          upsert: {
            args: Prisma.SalesQuoteVersionLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesQuoteVersionLinePayload>
          }
          aggregate: {
            args: Prisma.SalesQuoteVersionLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesQuoteVersionLine>
          }
          groupBy: {
            args: Prisma.SalesQuoteVersionLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteVersionLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesQuoteVersionLineCountArgs<ExtArgs>
            result: $Utils.Optional<SalesQuoteVersionLineCountAggregateOutputType> | number
          }
        }
      }
      SalesOrder: {
        payload: Prisma.$SalesOrderPayload<ExtArgs>
        fields: Prisma.SalesOrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesOrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesOrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          findFirst: {
            args: Prisma.SalesOrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesOrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          findMany: {
            args: Prisma.SalesOrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>[]
          }
          create: {
            args: Prisma.SalesOrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          createMany: {
            args: Prisma.SalesOrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesOrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>[]
          }
          delete: {
            args: Prisma.SalesOrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          update: {
            args: Prisma.SalesOrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          deleteMany: {
            args: Prisma.SalesOrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesOrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesOrderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>[]
          }
          upsert: {
            args: Prisma.SalesOrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderPayload>
          }
          aggregate: {
            args: Prisma.SalesOrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesOrder>
          }
          groupBy: {
            args: Prisma.SalesOrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesOrderCountArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderCountAggregateOutputType> | number
          }
        }
      }
      SalesOrderCommercialGateSummary: {
        payload: Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>
        fields: Prisma.SalesOrderCommercialGateSummaryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesOrderCommercialGateSummaryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesOrderCommercialGateSummaryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          findFirst: {
            args: Prisma.SalesOrderCommercialGateSummaryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesOrderCommercialGateSummaryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          findMany: {
            args: Prisma.SalesOrderCommercialGateSummaryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>[]
          }
          create: {
            args: Prisma.SalesOrderCommercialGateSummaryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          createMany: {
            args: Prisma.SalesOrderCommercialGateSummaryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesOrderCommercialGateSummaryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>[]
          }
          delete: {
            args: Prisma.SalesOrderCommercialGateSummaryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          update: {
            args: Prisma.SalesOrderCommercialGateSummaryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          deleteMany: {
            args: Prisma.SalesOrderCommercialGateSummaryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesOrderCommercialGateSummaryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesOrderCommercialGateSummaryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>[]
          }
          upsert: {
            args: Prisma.SalesOrderCommercialGateSummaryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderCommercialGateSummaryPayload>
          }
          aggregate: {
            args: Prisma.SalesOrderCommercialGateSummaryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesOrderCommercialGateSummary>
          }
          groupBy: {
            args: Prisma.SalesOrderCommercialGateSummaryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderCommercialGateSummaryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesOrderCommercialGateSummaryCountArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderCommercialGateSummaryCountAggregateOutputType> | number
          }
        }
      }
      SalesOrderFulfillmentHandoffSummary: {
        payload: Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>
        fields: Prisma.SalesOrderFulfillmentHandoffSummaryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          findFirst: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          findMany: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>[]
          }
          create: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          createMany: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>[]
          }
          delete: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          update: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          deleteMany: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>[]
          }
          upsert: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload>
          }
          aggregate: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesOrderFulfillmentHandoffSummary>
          }
          groupBy: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderFulfillmentHandoffSummaryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesOrderFulfillmentHandoffSummaryCountArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderFulfillmentHandoffSummaryCountAggregateOutputType> | number
          }
        }
      }
      SalesOrderLine: {
        payload: Prisma.$SalesOrderLinePayload<ExtArgs>
        fields: Prisma.SalesOrderLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesOrderLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesOrderLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          findFirst: {
            args: Prisma.SalesOrderLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesOrderLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          findMany: {
            args: Prisma.SalesOrderLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>[]
          }
          create: {
            args: Prisma.SalesOrderLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          createMany: {
            args: Prisma.SalesOrderLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesOrderLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>[]
          }
          delete: {
            args: Prisma.SalesOrderLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          update: {
            args: Prisma.SalesOrderLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          deleteMany: {
            args: Prisma.SalesOrderLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesOrderLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesOrderLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>[]
          }
          upsert: {
            args: Prisma.SalesOrderLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesOrderLinePayload>
          }
          aggregate: {
            args: Prisma.SalesOrderLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesOrderLine>
          }
          groupBy: {
            args: Prisma.SalesOrderLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesOrderLineCountArgs<ExtArgs>
            result: $Utils.Optional<SalesOrderLineCountAggregateOutputType> | number
          }
        }
      }
      SalesPriceList: {
        payload: Prisma.$SalesPriceListPayload<ExtArgs>
        fields: Prisma.SalesPriceListFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesPriceListFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesPriceListFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          findFirst: {
            args: Prisma.SalesPriceListFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesPriceListFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          findMany: {
            args: Prisma.SalesPriceListFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>[]
          }
          create: {
            args: Prisma.SalesPriceListCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          createMany: {
            args: Prisma.SalesPriceListCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesPriceListCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>[]
          }
          delete: {
            args: Prisma.SalesPriceListDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          update: {
            args: Prisma.SalesPriceListUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          deleteMany: {
            args: Prisma.SalesPriceListDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesPriceListUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesPriceListUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>[]
          }
          upsert: {
            args: Prisma.SalesPriceListUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListPayload>
          }
          aggregate: {
            args: Prisma.SalesPriceListAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesPriceList>
          }
          groupBy: {
            args: Prisma.SalesPriceListGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesPriceListGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesPriceListCountArgs<ExtArgs>
            result: $Utils.Optional<SalesPriceListCountAggregateOutputType> | number
          }
        }
      }
      SalesPriceListLine: {
        payload: Prisma.$SalesPriceListLinePayload<ExtArgs>
        fields: Prisma.SalesPriceListLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesPriceListLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesPriceListLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          findFirst: {
            args: Prisma.SalesPriceListLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesPriceListLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          findMany: {
            args: Prisma.SalesPriceListLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>[]
          }
          create: {
            args: Prisma.SalesPriceListLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          createMany: {
            args: Prisma.SalesPriceListLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesPriceListLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>[]
          }
          delete: {
            args: Prisma.SalesPriceListLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          update: {
            args: Prisma.SalesPriceListLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          deleteMany: {
            args: Prisma.SalesPriceListLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesPriceListLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesPriceListLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>[]
          }
          upsert: {
            args: Prisma.SalesPriceListLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesPriceListLinePayload>
          }
          aggregate: {
            args: Prisma.SalesPriceListLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesPriceListLine>
          }
          groupBy: {
            args: Prisma.SalesPriceListLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesPriceListLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesPriceListLineCountArgs<ExtArgs>
            result: $Utils.Optional<SalesPriceListLineCountAggregateOutputType> | number
          }
        }
      }
      SalesCustomerPriceAgreementVersion: {
        payload: Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>
        fields: Prisma.SalesCustomerPriceAgreementVersionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesCustomerPriceAgreementVersionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesCustomerPriceAgreementVersionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          findFirst: {
            args: Prisma.SalesCustomerPriceAgreementVersionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesCustomerPriceAgreementVersionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          findMany: {
            args: Prisma.SalesCustomerPriceAgreementVersionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>[]
          }
          create: {
            args: Prisma.SalesCustomerPriceAgreementVersionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          createMany: {
            args: Prisma.SalesCustomerPriceAgreementVersionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesCustomerPriceAgreementVersionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>[]
          }
          delete: {
            args: Prisma.SalesCustomerPriceAgreementVersionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          update: {
            args: Prisma.SalesCustomerPriceAgreementVersionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          deleteMany: {
            args: Prisma.SalesCustomerPriceAgreementVersionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesCustomerPriceAgreementVersionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesCustomerPriceAgreementVersionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>[]
          }
          upsert: {
            args: Prisma.SalesCustomerPriceAgreementVersionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementVersionPayload>
          }
          aggregate: {
            args: Prisma.SalesCustomerPriceAgreementVersionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesCustomerPriceAgreementVersion>
          }
          groupBy: {
            args: Prisma.SalesCustomerPriceAgreementVersionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesCustomerPriceAgreementVersionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesCustomerPriceAgreementVersionCountArgs<ExtArgs>
            result: $Utils.Optional<SalesCustomerPriceAgreementVersionCountAggregateOutputType> | number
          }
        }
      }
      SalesCustomerPriceAgreementLine: {
        payload: Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>
        fields: Prisma.SalesCustomerPriceAgreementLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesCustomerPriceAgreementLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesCustomerPriceAgreementLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          findFirst: {
            args: Prisma.SalesCustomerPriceAgreementLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesCustomerPriceAgreementLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          findMany: {
            args: Prisma.SalesCustomerPriceAgreementLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>[]
          }
          create: {
            args: Prisma.SalesCustomerPriceAgreementLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          createMany: {
            args: Prisma.SalesCustomerPriceAgreementLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesCustomerPriceAgreementLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>[]
          }
          delete: {
            args: Prisma.SalesCustomerPriceAgreementLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          update: {
            args: Prisma.SalesCustomerPriceAgreementLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          deleteMany: {
            args: Prisma.SalesCustomerPriceAgreementLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesCustomerPriceAgreementLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesCustomerPriceAgreementLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>[]
          }
          upsert: {
            args: Prisma.SalesCustomerPriceAgreementLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesCustomerPriceAgreementLinePayload>
          }
          aggregate: {
            args: Prisma.SalesCustomerPriceAgreementLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesCustomerPriceAgreementLine>
          }
          groupBy: {
            args: Prisma.SalesCustomerPriceAgreementLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesCustomerPriceAgreementLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesCustomerPriceAgreementLineCountArgs<ExtArgs>
            result: $Utils.Optional<SalesCustomerPriceAgreementLineCountAggregateOutputType> | number
          }
        }
      }
      SalesAuditEnvelope: {
        payload: Prisma.$SalesAuditEnvelopePayload<ExtArgs>
        fields: Prisma.SalesAuditEnvelopeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SalesAuditEnvelopeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SalesAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          findFirst: {
            args: Prisma.SalesAuditEnvelopeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SalesAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          findMany: {
            args: Prisma.SalesAuditEnvelopeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>[]
          }
          create: {
            args: Prisma.SalesAuditEnvelopeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          createMany: {
            args: Prisma.SalesAuditEnvelopeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SalesAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>[]
          }
          delete: {
            args: Prisma.SalesAuditEnvelopeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          update: {
            args: Prisma.SalesAuditEnvelopeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          deleteMany: {
            args: Prisma.SalesAuditEnvelopeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SalesAuditEnvelopeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SalesAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>[]
          }
          upsert: {
            args: Prisma.SalesAuditEnvelopeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SalesAuditEnvelopePayload>
          }
          aggregate: {
            args: Prisma.SalesAuditEnvelopeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSalesAuditEnvelope>
          }
          groupBy: {
            args: Prisma.SalesAuditEnvelopeGroupByArgs<ExtArgs>
            result: $Utils.Optional<SalesAuditEnvelopeGroupByOutputType>[]
          }
          count: {
            args: Prisma.SalesAuditEnvelopeCountArgs<ExtArgs>
            result: $Utils.Optional<SalesAuditEnvelopeCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    salesSequenceCounter?: SalesSequenceCounterOmit
    salesQuote?: SalesQuoteOmit
    salesQuoteLine?: SalesQuoteLineOmit
    salesQuoteVersion?: SalesQuoteVersionOmit
    salesQuoteVersionLine?: SalesQuoteVersionLineOmit
    salesOrder?: SalesOrderOmit
    salesOrderCommercialGateSummary?: SalesOrderCommercialGateSummaryOmit
    salesOrderFulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryOmit
    salesOrderLine?: SalesOrderLineOmit
    salesPriceList?: SalesPriceListOmit
    salesPriceListLine?: SalesPriceListLineOmit
    salesCustomerPriceAgreementVersion?: SalesCustomerPriceAgreementVersionOmit
    salesCustomerPriceAgreementLine?: SalesCustomerPriceAgreementLineOmit
    salesAuditEnvelope?: SalesAuditEnvelopeOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type SalesQuoteCountOutputType
   */

  export type SalesQuoteCountOutputType = {
    lines: number
  }

  export type SalesQuoteCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesQuoteCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * SalesQuoteCountOutputType without action
   */
  export type SalesQuoteCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteCountOutputType
     */
    select?: SalesQuoteCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SalesQuoteCountOutputType without action
   */
  export type SalesQuoteCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteLineWhereInput
  }


  /**
   * Count Type SalesQuoteVersionCountOutputType
   */

  export type SalesQuoteVersionCountOutputType = {
    lines: number
  }

  export type SalesQuoteVersionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesQuoteVersionCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * SalesQuoteVersionCountOutputType without action
   */
  export type SalesQuoteVersionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionCountOutputType
     */
    select?: SalesQuoteVersionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SalesQuoteVersionCountOutputType without action
   */
  export type SalesQuoteVersionCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteVersionLineWhereInput
  }


  /**
   * Count Type SalesOrderCountOutputType
   */

  export type SalesOrderCountOutputType = {
    lines: number
  }

  export type SalesOrderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesOrderCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * SalesOrderCountOutputType without action
   */
  export type SalesOrderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCountOutputType
     */
    select?: SalesOrderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SalesOrderCountOutputType without action
   */
  export type SalesOrderCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesOrderLineWhereInput
  }


  /**
   * Count Type SalesPriceListCountOutputType
   */

  export type SalesPriceListCountOutputType = {
    lines: number
  }

  export type SalesPriceListCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesPriceListCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * SalesPriceListCountOutputType without action
   */
  export type SalesPriceListCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListCountOutputType
     */
    select?: SalesPriceListCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SalesPriceListCountOutputType without action
   */
  export type SalesPriceListCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesPriceListLineWhereInput
  }


  /**
   * Count Type SalesCustomerPriceAgreementVersionCountOutputType
   */

  export type SalesCustomerPriceAgreementVersionCountOutputType = {
    lines: number
  }

  export type SalesCustomerPriceAgreementVersionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesCustomerPriceAgreementVersionCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * SalesCustomerPriceAgreementVersionCountOutputType without action
   */
  export type SalesCustomerPriceAgreementVersionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersionCountOutputType
     */
    select?: SalesCustomerPriceAgreementVersionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SalesCustomerPriceAgreementVersionCountOutputType without action
   */
  export type SalesCustomerPriceAgreementVersionCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesCustomerPriceAgreementLineWhereInput
  }


  /**
   * Models
   */

  /**
   * Model SalesSequenceCounter
   */

  export type AggregateSalesSequenceCounter = {
    _count: SalesSequenceCounterCountAggregateOutputType | null
    _avg: SalesSequenceCounterAvgAggregateOutputType | null
    _sum: SalesSequenceCounterSumAggregateOutputType | null
    _min: SalesSequenceCounterMinAggregateOutputType | null
    _max: SalesSequenceCounterMaxAggregateOutputType | null
  }

  export type SalesSequenceCounterAvgAggregateOutputType = {
    nextQuoteNo: number | null
    nextSalesOrderNo: number | null
  }

  export type SalesSequenceCounterSumAggregateOutputType = {
    nextQuoteNo: number | null
    nextSalesOrderNo: number | null
  }

  export type SalesSequenceCounterMinAggregateOutputType = {
    tenantId: string | null
    nextQuoteNo: number | null
    nextSalesOrderNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesSequenceCounterMaxAggregateOutputType = {
    tenantId: string | null
    nextQuoteNo: number | null
    nextSalesOrderNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesSequenceCounterCountAggregateOutputType = {
    tenantId: number
    nextQuoteNo: number
    nextSalesOrderNo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesSequenceCounterAvgAggregateInputType = {
    nextQuoteNo?: true
    nextSalesOrderNo?: true
  }

  export type SalesSequenceCounterSumAggregateInputType = {
    nextQuoteNo?: true
    nextSalesOrderNo?: true
  }

  export type SalesSequenceCounterMinAggregateInputType = {
    tenantId?: true
    nextQuoteNo?: true
    nextSalesOrderNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesSequenceCounterMaxAggregateInputType = {
    tenantId?: true
    nextQuoteNo?: true
    nextSalesOrderNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesSequenceCounterCountAggregateInputType = {
    tenantId?: true
    nextQuoteNo?: true
    nextSalesOrderNo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesSequenceCounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesSequenceCounter to aggregate.
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesSequenceCounters to fetch.
     */
    orderBy?: SalesSequenceCounterOrderByWithRelationInput | SalesSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesSequenceCounters
    **/
    _count?: true | SalesSequenceCounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesSequenceCounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesSequenceCounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesSequenceCounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesSequenceCounterMaxAggregateInputType
  }

  export type GetSalesSequenceCounterAggregateType<T extends SalesSequenceCounterAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesSequenceCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesSequenceCounter[P]>
      : GetScalarType<T[P], AggregateSalesSequenceCounter[P]>
  }




  export type SalesSequenceCounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesSequenceCounterWhereInput
    orderBy?: SalesSequenceCounterOrderByWithAggregationInput | SalesSequenceCounterOrderByWithAggregationInput[]
    by: SalesSequenceCounterScalarFieldEnum[] | SalesSequenceCounterScalarFieldEnum
    having?: SalesSequenceCounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesSequenceCounterCountAggregateInputType | true
    _avg?: SalesSequenceCounterAvgAggregateInputType
    _sum?: SalesSequenceCounterSumAggregateInputType
    _min?: SalesSequenceCounterMinAggregateInputType
    _max?: SalesSequenceCounterMaxAggregateInputType
  }

  export type SalesSequenceCounterGroupByOutputType = {
    tenantId: string
    nextQuoteNo: number
    nextSalesOrderNo: number
    createdAt: Date
    updatedAt: Date
    _count: SalesSequenceCounterCountAggregateOutputType | null
    _avg: SalesSequenceCounterAvgAggregateOutputType | null
    _sum: SalesSequenceCounterSumAggregateOutputType | null
    _min: SalesSequenceCounterMinAggregateOutputType | null
    _max: SalesSequenceCounterMaxAggregateOutputType | null
  }

  type GetSalesSequenceCounterGroupByPayload<T extends SalesSequenceCounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesSequenceCounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesSequenceCounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesSequenceCounterGroupByOutputType[P]>
            : GetScalarType<T[P], SalesSequenceCounterGroupByOutputType[P]>
        }
      >
    >


  export type SalesSequenceCounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextQuoteNo?: boolean
    nextSalesOrderNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesSequenceCounter"]>

  export type SalesSequenceCounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextQuoteNo?: boolean
    nextSalesOrderNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesSequenceCounter"]>

  export type SalesSequenceCounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextQuoteNo?: boolean
    nextSalesOrderNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesSequenceCounter"]>

  export type SalesSequenceCounterSelectScalar = {
    tenantId?: boolean
    nextQuoteNo?: boolean
    nextSalesOrderNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesSequenceCounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenantId" | "nextQuoteNo" | "nextSalesOrderNo" | "createdAt" | "updatedAt", ExtArgs["result"]["salesSequenceCounter"]>

  export type $SalesSequenceCounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesSequenceCounter"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenantId: string
      nextQuoteNo: number
      nextSalesOrderNo: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesSequenceCounter"]>
    composites: {}
  }

  type SalesSequenceCounterGetPayload<S extends boolean | null | undefined | SalesSequenceCounterDefaultArgs> = $Result.GetResult<Prisma.$SalesSequenceCounterPayload, S>

  type SalesSequenceCounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesSequenceCounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesSequenceCounterCountAggregateInputType | true
    }

  export interface SalesSequenceCounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesSequenceCounter'], meta: { name: 'SalesSequenceCounter' } }
    /**
     * Find zero or one SalesSequenceCounter that matches the filter.
     * @param {SalesSequenceCounterFindUniqueArgs} args - Arguments to find a SalesSequenceCounter
     * @example
     * // Get one SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesSequenceCounterFindUniqueArgs>(args: SelectSubset<T, SalesSequenceCounterFindUniqueArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesSequenceCounter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesSequenceCounterFindUniqueOrThrowArgs} args - Arguments to find a SalesSequenceCounter
     * @example
     * // Get one SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesSequenceCounterFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesSequenceCounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesSequenceCounter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterFindFirstArgs} args - Arguments to find a SalesSequenceCounter
     * @example
     * // Get one SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesSequenceCounterFindFirstArgs>(args?: SelectSubset<T, SalesSequenceCounterFindFirstArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesSequenceCounter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterFindFirstOrThrowArgs} args - Arguments to find a SalesSequenceCounter
     * @example
     * // Get one SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesSequenceCounterFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesSequenceCounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesSequenceCounters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesSequenceCounters
     * const salesSequenceCounters = await prisma.salesSequenceCounter.findMany()
     * 
     * // Get first 10 SalesSequenceCounters
     * const salesSequenceCounters = await prisma.salesSequenceCounter.findMany({ take: 10 })
     * 
     * // Only select the `tenantId`
     * const salesSequenceCounterWithTenantIdOnly = await prisma.salesSequenceCounter.findMany({ select: { tenantId: true } })
     * 
     */
    findMany<T extends SalesSequenceCounterFindManyArgs>(args?: SelectSubset<T, SalesSequenceCounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesSequenceCounter.
     * @param {SalesSequenceCounterCreateArgs} args - Arguments to create a SalesSequenceCounter.
     * @example
     * // Create one SalesSequenceCounter
     * const SalesSequenceCounter = await prisma.salesSequenceCounter.create({
     *   data: {
     *     // ... data to create a SalesSequenceCounter
     *   }
     * })
     * 
     */
    create<T extends SalesSequenceCounterCreateArgs>(args: SelectSubset<T, SalesSequenceCounterCreateArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesSequenceCounters.
     * @param {SalesSequenceCounterCreateManyArgs} args - Arguments to create many SalesSequenceCounters.
     * @example
     * // Create many SalesSequenceCounters
     * const salesSequenceCounter = await prisma.salesSequenceCounter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesSequenceCounterCreateManyArgs>(args?: SelectSubset<T, SalesSequenceCounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesSequenceCounters and returns the data saved in the database.
     * @param {SalesSequenceCounterCreateManyAndReturnArgs} args - Arguments to create many SalesSequenceCounters.
     * @example
     * // Create many SalesSequenceCounters
     * const salesSequenceCounter = await prisma.salesSequenceCounter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesSequenceCounters and only return the `tenantId`
     * const salesSequenceCounterWithTenantIdOnly = await prisma.salesSequenceCounter.createManyAndReturn({
     *   select: { tenantId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesSequenceCounterCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesSequenceCounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesSequenceCounter.
     * @param {SalesSequenceCounterDeleteArgs} args - Arguments to delete one SalesSequenceCounter.
     * @example
     * // Delete one SalesSequenceCounter
     * const SalesSequenceCounter = await prisma.salesSequenceCounter.delete({
     *   where: {
     *     // ... filter to delete one SalesSequenceCounter
     *   }
     * })
     * 
     */
    delete<T extends SalesSequenceCounterDeleteArgs>(args: SelectSubset<T, SalesSequenceCounterDeleteArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesSequenceCounter.
     * @param {SalesSequenceCounterUpdateArgs} args - Arguments to update one SalesSequenceCounter.
     * @example
     * // Update one SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesSequenceCounterUpdateArgs>(args: SelectSubset<T, SalesSequenceCounterUpdateArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesSequenceCounters.
     * @param {SalesSequenceCounterDeleteManyArgs} args - Arguments to filter SalesSequenceCounters to delete.
     * @example
     * // Delete a few SalesSequenceCounters
     * const { count } = await prisma.salesSequenceCounter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesSequenceCounterDeleteManyArgs>(args?: SelectSubset<T, SalesSequenceCounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesSequenceCounters
     * const salesSequenceCounter = await prisma.salesSequenceCounter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesSequenceCounterUpdateManyArgs>(args: SelectSubset<T, SalesSequenceCounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesSequenceCounters and returns the data updated in the database.
     * @param {SalesSequenceCounterUpdateManyAndReturnArgs} args - Arguments to update many SalesSequenceCounters.
     * @example
     * // Update many SalesSequenceCounters
     * const salesSequenceCounter = await prisma.salesSequenceCounter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesSequenceCounters and only return the `tenantId`
     * const salesSequenceCounterWithTenantIdOnly = await prisma.salesSequenceCounter.updateManyAndReturn({
     *   select: { tenantId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesSequenceCounterUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesSequenceCounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesSequenceCounter.
     * @param {SalesSequenceCounterUpsertArgs} args - Arguments to update or create a SalesSequenceCounter.
     * @example
     * // Update or create a SalesSequenceCounter
     * const salesSequenceCounter = await prisma.salesSequenceCounter.upsert({
     *   create: {
     *     // ... data to create a SalesSequenceCounter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesSequenceCounter we want to update
     *   }
     * })
     */
    upsert<T extends SalesSequenceCounterUpsertArgs>(args: SelectSubset<T, SalesSequenceCounterUpsertArgs<ExtArgs>>): Prisma__SalesSequenceCounterClient<$Result.GetResult<Prisma.$SalesSequenceCounterPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterCountArgs} args - Arguments to filter SalesSequenceCounters to count.
     * @example
     * // Count the number of SalesSequenceCounters
     * const count = await prisma.salesSequenceCounter.count({
     *   where: {
     *     // ... the filter for the SalesSequenceCounters we want to count
     *   }
     * })
    **/
    count<T extends SalesSequenceCounterCountArgs>(
      args?: Subset<T, SalesSequenceCounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesSequenceCounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesSequenceCounterAggregateArgs>(args: Subset<T, SalesSequenceCounterAggregateArgs>): Prisma.PrismaPromise<GetSalesSequenceCounterAggregateType<T>>

    /**
     * Group by SalesSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesSequenceCounterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesSequenceCounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesSequenceCounterGroupByArgs['orderBy'] }
        : { orderBy?: SalesSequenceCounterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesSequenceCounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesSequenceCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesSequenceCounter model
   */
  readonly fields: SalesSequenceCounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesSequenceCounter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesSequenceCounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesSequenceCounter model
   */ 
  interface SalesSequenceCounterFieldRefs {
    readonly tenantId: FieldRef<"SalesSequenceCounter", 'String'>
    readonly nextQuoteNo: FieldRef<"SalesSequenceCounter", 'Int'>
    readonly nextSalesOrderNo: FieldRef<"SalesSequenceCounter", 'Int'>
    readonly createdAt: FieldRef<"SalesSequenceCounter", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesSequenceCounter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesSequenceCounter findUnique
   */
  export type SalesSequenceCounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SalesSequenceCounter to fetch.
     */
    where: SalesSequenceCounterWhereUniqueInput
  }

  /**
   * SalesSequenceCounter findUniqueOrThrow
   */
  export type SalesSequenceCounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SalesSequenceCounter to fetch.
     */
    where: SalesSequenceCounterWhereUniqueInput
  }

  /**
   * SalesSequenceCounter findFirst
   */
  export type SalesSequenceCounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SalesSequenceCounter to fetch.
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesSequenceCounters to fetch.
     */
    orderBy?: SalesSequenceCounterOrderByWithRelationInput | SalesSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesSequenceCounters.
     */
    cursor?: SalesSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesSequenceCounters.
     */
    distinct?: SalesSequenceCounterScalarFieldEnum | SalesSequenceCounterScalarFieldEnum[]
  }

  /**
   * SalesSequenceCounter findFirstOrThrow
   */
  export type SalesSequenceCounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SalesSequenceCounter to fetch.
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesSequenceCounters to fetch.
     */
    orderBy?: SalesSequenceCounterOrderByWithRelationInput | SalesSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesSequenceCounters.
     */
    cursor?: SalesSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesSequenceCounters.
     */
    distinct?: SalesSequenceCounterScalarFieldEnum | SalesSequenceCounterScalarFieldEnum[]
  }

  /**
   * SalesSequenceCounter findMany
   */
  export type SalesSequenceCounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SalesSequenceCounters to fetch.
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesSequenceCounters to fetch.
     */
    orderBy?: SalesSequenceCounterOrderByWithRelationInput | SalesSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesSequenceCounters.
     */
    cursor?: SalesSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesSequenceCounters.
     */
    skip?: number
    distinct?: SalesSequenceCounterScalarFieldEnum | SalesSequenceCounterScalarFieldEnum[]
  }

  /**
   * SalesSequenceCounter create
   */
  export type SalesSequenceCounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to create a SalesSequenceCounter.
     */
    data: XOR<SalesSequenceCounterCreateInput, SalesSequenceCounterUncheckedCreateInput>
  }

  /**
   * SalesSequenceCounter createMany
   */
  export type SalesSequenceCounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesSequenceCounters.
     */
    data: SalesSequenceCounterCreateManyInput | SalesSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesSequenceCounter createManyAndReturn
   */
  export type SalesSequenceCounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to create many SalesSequenceCounters.
     */
    data: SalesSequenceCounterCreateManyInput | SalesSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesSequenceCounter update
   */
  export type SalesSequenceCounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to update a SalesSequenceCounter.
     */
    data: XOR<SalesSequenceCounterUpdateInput, SalesSequenceCounterUncheckedUpdateInput>
    /**
     * Choose, which SalesSequenceCounter to update.
     */
    where: SalesSequenceCounterWhereUniqueInput
  }

  /**
   * SalesSequenceCounter updateMany
   */
  export type SalesSequenceCounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesSequenceCounters.
     */
    data: XOR<SalesSequenceCounterUpdateManyMutationInput, SalesSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which SalesSequenceCounters to update
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * Limit how many SalesSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * SalesSequenceCounter updateManyAndReturn
   */
  export type SalesSequenceCounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to update SalesSequenceCounters.
     */
    data: XOR<SalesSequenceCounterUpdateManyMutationInput, SalesSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which SalesSequenceCounters to update
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * Limit how many SalesSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * SalesSequenceCounter upsert
   */
  export type SalesSequenceCounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * The filter to search for the SalesSequenceCounter to update in case it exists.
     */
    where: SalesSequenceCounterWhereUniqueInput
    /**
     * In case the SalesSequenceCounter found by the `where` argument doesn't exist, create a new SalesSequenceCounter with this data.
     */
    create: XOR<SalesSequenceCounterCreateInput, SalesSequenceCounterUncheckedCreateInput>
    /**
     * In case the SalesSequenceCounter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesSequenceCounterUpdateInput, SalesSequenceCounterUncheckedUpdateInput>
  }

  /**
   * SalesSequenceCounter delete
   */
  export type SalesSequenceCounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter which SalesSequenceCounter to delete.
     */
    where: SalesSequenceCounterWhereUniqueInput
  }

  /**
   * SalesSequenceCounter deleteMany
   */
  export type SalesSequenceCounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesSequenceCounters to delete
     */
    where?: SalesSequenceCounterWhereInput
    /**
     * Limit how many SalesSequenceCounters to delete.
     */
    limit?: number
  }

  /**
   * SalesSequenceCounter without action
   */
  export type SalesSequenceCounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesSequenceCounter
     */
    select?: SalesSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesSequenceCounter
     */
    omit?: SalesSequenceCounterOmit<ExtArgs> | null
  }


  /**
   * Model SalesQuote
   */

  export type AggregateSalesQuote = {
    _count: SalesQuoteCountAggregateOutputType | null
    _min: SalesQuoteMinAggregateOutputType | null
    _max: SalesQuoteMaxAggregateOutputType | null
  }

  export type SalesQuoteMinAggregateOutputType = {
    id: string | null
    quoteNo: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    opportunityId: string | null
    opportunityNo: string | null
    opportunityName: string | null
    status: $Enums.SalesQuoteStatus | null
    latestPublishedVersionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesQuoteMaxAggregateOutputType = {
    id: string | null
    quoteNo: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    opportunityId: string | null
    opportunityNo: string | null
    opportunityName: string | null
    status: $Enums.SalesQuoteStatus | null
    latestPublishedVersionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesQuoteCountAggregateOutputType = {
    id: number
    quoteNo: number
    tenantId: number
    customerTenantPartyId: number
    opportunityId: number
    opportunityNo: number
    opportunityName: number
    status: number
    latestPublishedVersionId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesQuoteMinAggregateInputType = {
    id?: true
    quoteNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    opportunityId?: true
    opportunityNo?: true
    opportunityName?: true
    status?: true
    latestPublishedVersionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesQuoteMaxAggregateInputType = {
    id?: true
    quoteNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    opportunityId?: true
    opportunityNo?: true
    opportunityName?: true
    status?: true
    latestPublishedVersionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesQuoteCountAggregateInputType = {
    id?: true
    quoteNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    opportunityId?: true
    opportunityNo?: true
    opportunityName?: true
    status?: true
    latestPublishedVersionId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesQuoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuote to aggregate.
     */
    where?: SalesQuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuotes to fetch.
     */
    orderBy?: SalesQuoteOrderByWithRelationInput | SalesQuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesQuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesQuotes
    **/
    _count?: true | SalesQuoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesQuoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesQuoteMaxAggregateInputType
  }

  export type GetSalesQuoteAggregateType<T extends SalesQuoteAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesQuote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesQuote[P]>
      : GetScalarType<T[P], AggregateSalesQuote[P]>
  }




  export type SalesQuoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteWhereInput
    orderBy?: SalesQuoteOrderByWithAggregationInput | SalesQuoteOrderByWithAggregationInput[]
    by: SalesQuoteScalarFieldEnum[] | SalesQuoteScalarFieldEnum
    having?: SalesQuoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesQuoteCountAggregateInputType | true
    _min?: SalesQuoteMinAggregateInputType
    _max?: SalesQuoteMaxAggregateInputType
  }

  export type SalesQuoteGroupByOutputType = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId: string | null
    opportunityNo: string | null
    opportunityName: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId: string | null
    createdAt: Date
    updatedAt: Date
    _count: SalesQuoteCountAggregateOutputType | null
    _min: SalesQuoteMinAggregateOutputType | null
    _max: SalesQuoteMaxAggregateOutputType | null
  }

  type GetSalesQuoteGroupByPayload<T extends SalesQuoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesQuoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesQuoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesQuoteGroupByOutputType[P]>
            : GetScalarType<T[P], SalesQuoteGroupByOutputType[P]>
        }
      >
    >


  export type SalesQuoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    opportunityId?: boolean
    opportunityNo?: boolean
    opportunityName?: boolean
    status?: boolean
    latestPublishedVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lines?: boolean | SalesQuote$linesArgs<ExtArgs>
    _count?: boolean | SalesQuoteCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuote"]>

  export type SalesQuoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    opportunityId?: boolean
    opportunityNo?: boolean
    opportunityName?: boolean
    status?: boolean
    latestPublishedVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesQuote"]>

  export type SalesQuoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    opportunityId?: boolean
    opportunityNo?: boolean
    opportunityName?: boolean
    status?: boolean
    latestPublishedVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesQuote"]>

  export type SalesQuoteSelectScalar = {
    id?: boolean
    quoteNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    opportunityId?: boolean
    opportunityNo?: boolean
    opportunityName?: boolean
    status?: boolean
    latestPublishedVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesQuoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quoteNo" | "tenantId" | "customerTenantPartyId" | "opportunityId" | "opportunityNo" | "opportunityName" | "status" | "latestPublishedVersionId" | "createdAt" | "updatedAt", ExtArgs["result"]["salesQuote"]>
  export type SalesQuoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesQuote$linesArgs<ExtArgs>
    _count?: boolean | SalesQuoteCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SalesQuoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SalesQuoteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalesQuotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesQuote"
    objects: {
      lines: Prisma.$SalesQuoteLinePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteNo: string
      tenantId: string
      customerTenantPartyId: string
      opportunityId: string | null
      opportunityNo: string | null
      opportunityName: string | null
      status: $Enums.SalesQuoteStatus
      latestPublishedVersionId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesQuote"]>
    composites: {}
  }

  type SalesQuoteGetPayload<S extends boolean | null | undefined | SalesQuoteDefaultArgs> = $Result.GetResult<Prisma.$SalesQuotePayload, S>

  type SalesQuoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesQuoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesQuoteCountAggregateInputType | true
    }

  export interface SalesQuoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesQuote'], meta: { name: 'SalesQuote' } }
    /**
     * Find zero or one SalesQuote that matches the filter.
     * @param {SalesQuoteFindUniqueArgs} args - Arguments to find a SalesQuote
     * @example
     * // Get one SalesQuote
     * const salesQuote = await prisma.salesQuote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesQuoteFindUniqueArgs>(args: SelectSubset<T, SalesQuoteFindUniqueArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesQuote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesQuoteFindUniqueOrThrowArgs} args - Arguments to find a SalesQuote
     * @example
     * // Get one SalesQuote
     * const salesQuote = await prisma.salesQuote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesQuoteFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesQuoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteFindFirstArgs} args - Arguments to find a SalesQuote
     * @example
     * // Get one SalesQuote
     * const salesQuote = await prisma.salesQuote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesQuoteFindFirstArgs>(args?: SelectSubset<T, SalesQuoteFindFirstArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteFindFirstOrThrowArgs} args - Arguments to find a SalesQuote
     * @example
     * // Get one SalesQuote
     * const salesQuote = await prisma.salesQuote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesQuoteFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesQuoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesQuotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesQuotes
     * const salesQuotes = await prisma.salesQuote.findMany()
     * 
     * // Get first 10 SalesQuotes
     * const salesQuotes = await prisma.salesQuote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesQuoteWithIdOnly = await prisma.salesQuote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesQuoteFindManyArgs>(args?: SelectSubset<T, SalesQuoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesQuote.
     * @param {SalesQuoteCreateArgs} args - Arguments to create a SalesQuote.
     * @example
     * // Create one SalesQuote
     * const SalesQuote = await prisma.salesQuote.create({
     *   data: {
     *     // ... data to create a SalesQuote
     *   }
     * })
     * 
     */
    create<T extends SalesQuoteCreateArgs>(args: SelectSubset<T, SalesQuoteCreateArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesQuotes.
     * @param {SalesQuoteCreateManyArgs} args - Arguments to create many SalesQuotes.
     * @example
     * // Create many SalesQuotes
     * const salesQuote = await prisma.salesQuote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesQuoteCreateManyArgs>(args?: SelectSubset<T, SalesQuoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesQuotes and returns the data saved in the database.
     * @param {SalesQuoteCreateManyAndReturnArgs} args - Arguments to create many SalesQuotes.
     * @example
     * // Create many SalesQuotes
     * const salesQuote = await prisma.salesQuote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesQuotes and only return the `id`
     * const salesQuoteWithIdOnly = await prisma.salesQuote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesQuoteCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesQuoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesQuote.
     * @param {SalesQuoteDeleteArgs} args - Arguments to delete one SalesQuote.
     * @example
     * // Delete one SalesQuote
     * const SalesQuote = await prisma.salesQuote.delete({
     *   where: {
     *     // ... filter to delete one SalesQuote
     *   }
     * })
     * 
     */
    delete<T extends SalesQuoteDeleteArgs>(args: SelectSubset<T, SalesQuoteDeleteArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesQuote.
     * @param {SalesQuoteUpdateArgs} args - Arguments to update one SalesQuote.
     * @example
     * // Update one SalesQuote
     * const salesQuote = await prisma.salesQuote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesQuoteUpdateArgs>(args: SelectSubset<T, SalesQuoteUpdateArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesQuotes.
     * @param {SalesQuoteDeleteManyArgs} args - Arguments to filter SalesQuotes to delete.
     * @example
     * // Delete a few SalesQuotes
     * const { count } = await prisma.salesQuote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesQuoteDeleteManyArgs>(args?: SelectSubset<T, SalesQuoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesQuotes
     * const salesQuote = await prisma.salesQuote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesQuoteUpdateManyArgs>(args: SelectSubset<T, SalesQuoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuotes and returns the data updated in the database.
     * @param {SalesQuoteUpdateManyAndReturnArgs} args - Arguments to update many SalesQuotes.
     * @example
     * // Update many SalesQuotes
     * const salesQuote = await prisma.salesQuote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesQuotes and only return the `id`
     * const salesQuoteWithIdOnly = await prisma.salesQuote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesQuoteUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesQuoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesQuote.
     * @param {SalesQuoteUpsertArgs} args - Arguments to update or create a SalesQuote.
     * @example
     * // Update or create a SalesQuote
     * const salesQuote = await prisma.salesQuote.upsert({
     *   create: {
     *     // ... data to create a SalesQuote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesQuote we want to update
     *   }
     * })
     */
    upsert<T extends SalesQuoteUpsertArgs>(args: SelectSubset<T, SalesQuoteUpsertArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesQuotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteCountArgs} args - Arguments to filter SalesQuotes to count.
     * @example
     * // Count the number of SalesQuotes
     * const count = await prisma.salesQuote.count({
     *   where: {
     *     // ... the filter for the SalesQuotes we want to count
     *   }
     * })
    **/
    count<T extends SalesQuoteCountArgs>(
      args?: Subset<T, SalesQuoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesQuoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesQuote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesQuoteAggregateArgs>(args: Subset<T, SalesQuoteAggregateArgs>): Prisma.PrismaPromise<GetSalesQuoteAggregateType<T>>

    /**
     * Group by SalesQuote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesQuoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesQuoteGroupByArgs['orderBy'] }
        : { orderBy?: SalesQuoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesQuoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesQuoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesQuote model
   */
  readonly fields: SalesQuoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesQuote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesQuoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends SalesQuote$linesArgs<ExtArgs> = {}>(args?: Subset<T, SalesQuote$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesQuote model
   */ 
  interface SalesQuoteFieldRefs {
    readonly id: FieldRef<"SalesQuote", 'String'>
    readonly quoteNo: FieldRef<"SalesQuote", 'String'>
    readonly tenantId: FieldRef<"SalesQuote", 'String'>
    readonly customerTenantPartyId: FieldRef<"SalesQuote", 'String'>
    readonly opportunityId: FieldRef<"SalesQuote", 'String'>
    readonly opportunityNo: FieldRef<"SalesQuote", 'String'>
    readonly opportunityName: FieldRef<"SalesQuote", 'String'>
    readonly status: FieldRef<"SalesQuote", 'SalesQuoteStatus'>
    readonly latestPublishedVersionId: FieldRef<"SalesQuote", 'String'>
    readonly createdAt: FieldRef<"SalesQuote", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesQuote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesQuote findUnique
   */
  export type SalesQuoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuote to fetch.
     */
    where: SalesQuoteWhereUniqueInput
  }

  /**
   * SalesQuote findUniqueOrThrow
   */
  export type SalesQuoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuote to fetch.
     */
    where: SalesQuoteWhereUniqueInput
  }

  /**
   * SalesQuote findFirst
   */
  export type SalesQuoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuote to fetch.
     */
    where?: SalesQuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuotes to fetch.
     */
    orderBy?: SalesQuoteOrderByWithRelationInput | SalesQuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuotes.
     */
    cursor?: SalesQuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuotes.
     */
    distinct?: SalesQuoteScalarFieldEnum | SalesQuoteScalarFieldEnum[]
  }

  /**
   * SalesQuote findFirstOrThrow
   */
  export type SalesQuoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuote to fetch.
     */
    where?: SalesQuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuotes to fetch.
     */
    orderBy?: SalesQuoteOrderByWithRelationInput | SalesQuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuotes.
     */
    cursor?: SalesQuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuotes.
     */
    distinct?: SalesQuoteScalarFieldEnum | SalesQuoteScalarFieldEnum[]
  }

  /**
   * SalesQuote findMany
   */
  export type SalesQuoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuotes to fetch.
     */
    where?: SalesQuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuotes to fetch.
     */
    orderBy?: SalesQuoteOrderByWithRelationInput | SalesQuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesQuotes.
     */
    cursor?: SalesQuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuotes.
     */
    skip?: number
    distinct?: SalesQuoteScalarFieldEnum | SalesQuoteScalarFieldEnum[]
  }

  /**
   * SalesQuote create
   */
  export type SalesQuoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesQuote.
     */
    data: XOR<SalesQuoteCreateInput, SalesQuoteUncheckedCreateInput>
  }

  /**
   * SalesQuote createMany
   */
  export type SalesQuoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesQuotes.
     */
    data: SalesQuoteCreateManyInput | SalesQuoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuote createManyAndReturn
   */
  export type SalesQuoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * The data used to create many SalesQuotes.
     */
    data: SalesQuoteCreateManyInput | SalesQuoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuote update
   */
  export type SalesQuoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesQuote.
     */
    data: XOR<SalesQuoteUpdateInput, SalesQuoteUncheckedUpdateInput>
    /**
     * Choose, which SalesQuote to update.
     */
    where: SalesQuoteWhereUniqueInput
  }

  /**
   * SalesQuote updateMany
   */
  export type SalesQuoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesQuotes.
     */
    data: XOR<SalesQuoteUpdateManyMutationInput, SalesQuoteUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuotes to update
     */
    where?: SalesQuoteWhereInput
    /**
     * Limit how many SalesQuotes to update.
     */
    limit?: number
  }

  /**
   * SalesQuote updateManyAndReturn
   */
  export type SalesQuoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * The data used to update SalesQuotes.
     */
    data: XOR<SalesQuoteUpdateManyMutationInput, SalesQuoteUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuotes to update
     */
    where?: SalesQuoteWhereInput
    /**
     * Limit how many SalesQuotes to update.
     */
    limit?: number
  }

  /**
   * SalesQuote upsert
   */
  export type SalesQuoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesQuote to update in case it exists.
     */
    where: SalesQuoteWhereUniqueInput
    /**
     * In case the SalesQuote found by the `where` argument doesn't exist, create a new SalesQuote with this data.
     */
    create: XOR<SalesQuoteCreateInput, SalesQuoteUncheckedCreateInput>
    /**
     * In case the SalesQuote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesQuoteUpdateInput, SalesQuoteUncheckedUpdateInput>
  }

  /**
   * SalesQuote delete
   */
  export type SalesQuoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
    /**
     * Filter which SalesQuote to delete.
     */
    where: SalesQuoteWhereUniqueInput
  }

  /**
   * SalesQuote deleteMany
   */
  export type SalesQuoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuotes to delete
     */
    where?: SalesQuoteWhereInput
    /**
     * Limit how many SalesQuotes to delete.
     */
    limit?: number
  }

  /**
   * SalesQuote.lines
   */
  export type SalesQuote$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    where?: SalesQuoteLineWhereInput
    orderBy?: SalesQuoteLineOrderByWithRelationInput | SalesQuoteLineOrderByWithRelationInput[]
    cursor?: SalesQuoteLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SalesQuoteLineScalarFieldEnum | SalesQuoteLineScalarFieldEnum[]
  }

  /**
   * SalesQuote without action
   */
  export type SalesQuoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuote
     */
    select?: SalesQuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuote
     */
    omit?: SalesQuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteInclude<ExtArgs> | null
  }


  /**
   * Model SalesQuoteLine
   */

  export type AggregateSalesQuoteLine = {
    _count: SalesQuoteLineCountAggregateOutputType | null
    _avg: SalesQuoteLineAvgAggregateOutputType | null
    _sum: SalesQuoteLineSumAggregateOutputType | null
    _min: SalesQuoteLineMinAggregateOutputType | null
    _max: SalesQuoteLineMaxAggregateOutputType | null
  }

  export type SalesQuoteLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesQuoteLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesQuoteLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    quoteId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesQuoteLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    quoteId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesQuoteLineCountAggregateOutputType = {
    id: number
    tenantId: number
    quoteId: number
    lineNo: number
    itemId: number
    itemSnapshot: number
    salesConfigSnapshot: number
    packagingRequirementSnapshot: number
    priceQuantityDeliverySnapshot: number
    customerItemSnapshot: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesQuoteLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type SalesQuoteLineSumAggregateInputType = {
    lineNo?: true
  }

  export type SalesQuoteLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    quoteId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesQuoteLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    quoteId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesQuoteLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    quoteId?: true
    lineNo?: true
    itemId?: true
    itemSnapshot?: true
    salesConfigSnapshot?: true
    packagingRequirementSnapshot?: true
    priceQuantityDeliverySnapshot?: true
    customerItemSnapshot?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesQuoteLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteLine to aggregate.
     */
    where?: SalesQuoteLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteLines to fetch.
     */
    orderBy?: SalesQuoteLineOrderByWithRelationInput | SalesQuoteLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesQuoteLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesQuoteLines
    **/
    _count?: true | SalesQuoteLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesQuoteLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesQuoteLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesQuoteLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesQuoteLineMaxAggregateInputType
  }

  export type GetSalesQuoteLineAggregateType<T extends SalesQuoteLineAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesQuoteLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesQuoteLine[P]>
      : GetScalarType<T[P], AggregateSalesQuoteLine[P]>
  }




  export type SalesQuoteLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteLineWhereInput
    orderBy?: SalesQuoteLineOrderByWithAggregationInput | SalesQuoteLineOrderByWithAggregationInput[]
    by: SalesQuoteLineScalarFieldEnum[] | SalesQuoteLineScalarFieldEnum
    having?: SalesQuoteLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesQuoteLineCountAggregateInputType | true
    _avg?: SalesQuoteLineAvgAggregateInputType
    _sum?: SalesQuoteLineSumAggregateInputType
    _min?: SalesQuoteLineMinAggregateInputType
    _max?: SalesQuoteLineMaxAggregateInputType
  }

  export type SalesQuoteLineGroupByOutputType = {
    id: string
    tenantId: string
    quoteId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonValue
    salesConfigSnapshot: JsonValue
    packagingRequirementSnapshot: JsonValue
    priceQuantityDeliverySnapshot: JsonValue
    customerItemSnapshot: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: SalesQuoteLineCountAggregateOutputType | null
    _avg: SalesQuoteLineAvgAggregateOutputType | null
    _sum: SalesQuoteLineSumAggregateOutputType | null
    _min: SalesQuoteLineMinAggregateOutputType | null
    _max: SalesQuoteLineMaxAggregateOutputType | null
  }

  type GetSalesQuoteLineGroupByPayload<T extends SalesQuoteLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesQuoteLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesQuoteLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesQuoteLineGroupByOutputType[P]>
            : GetScalarType<T[P], SalesQuoteLineGroupByOutputType[P]>
        }
      >
    >


  export type SalesQuoteLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteLine"]>

  export type SalesQuoteLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteLine"]>

  export type SalesQuoteLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteLine"]>

  export type SalesQuoteLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    quoteId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesQuoteLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "quoteId" | "lineNo" | "itemId" | "itemSnapshot" | "salesConfigSnapshot" | "packagingRequirementSnapshot" | "priceQuantityDeliverySnapshot" | "customerItemSnapshot" | "createdAt" | "updatedAt", ExtArgs["result"]["salesQuoteLine"]>
  export type SalesQuoteLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }
  export type SalesQuoteLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }
  export type SalesQuoteLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | SalesQuoteDefaultArgs<ExtArgs>
  }

  export type $SalesQuoteLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesQuoteLine"
    objects: {
      quote: Prisma.$SalesQuotePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      quoteId: string
      lineNo: number
      itemId: string
      itemSnapshot: Prisma.JsonValue
      salesConfigSnapshot: Prisma.JsonValue
      packagingRequirementSnapshot: Prisma.JsonValue
      priceQuantityDeliverySnapshot: Prisma.JsonValue
      customerItemSnapshot: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesQuoteLine"]>
    composites: {}
  }

  type SalesQuoteLineGetPayload<S extends boolean | null | undefined | SalesQuoteLineDefaultArgs> = $Result.GetResult<Prisma.$SalesQuoteLinePayload, S>

  type SalesQuoteLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesQuoteLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesQuoteLineCountAggregateInputType | true
    }

  export interface SalesQuoteLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesQuoteLine'], meta: { name: 'SalesQuoteLine' } }
    /**
     * Find zero or one SalesQuoteLine that matches the filter.
     * @param {SalesQuoteLineFindUniqueArgs} args - Arguments to find a SalesQuoteLine
     * @example
     * // Get one SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesQuoteLineFindUniqueArgs>(args: SelectSubset<T, SalesQuoteLineFindUniqueArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesQuoteLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesQuoteLineFindUniqueOrThrowArgs} args - Arguments to find a SalesQuoteLine
     * @example
     * // Get one SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesQuoteLineFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesQuoteLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineFindFirstArgs} args - Arguments to find a SalesQuoteLine
     * @example
     * // Get one SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesQuoteLineFindFirstArgs>(args?: SelectSubset<T, SalesQuoteLineFindFirstArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineFindFirstOrThrowArgs} args - Arguments to find a SalesQuoteLine
     * @example
     * // Get one SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesQuoteLineFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesQuoteLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesQuoteLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesQuoteLines
     * const salesQuoteLines = await prisma.salesQuoteLine.findMany()
     * 
     * // Get first 10 SalesQuoteLines
     * const salesQuoteLines = await prisma.salesQuoteLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesQuoteLineWithIdOnly = await prisma.salesQuoteLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesQuoteLineFindManyArgs>(args?: SelectSubset<T, SalesQuoteLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesQuoteLine.
     * @param {SalesQuoteLineCreateArgs} args - Arguments to create a SalesQuoteLine.
     * @example
     * // Create one SalesQuoteLine
     * const SalesQuoteLine = await prisma.salesQuoteLine.create({
     *   data: {
     *     // ... data to create a SalesQuoteLine
     *   }
     * })
     * 
     */
    create<T extends SalesQuoteLineCreateArgs>(args: SelectSubset<T, SalesQuoteLineCreateArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesQuoteLines.
     * @param {SalesQuoteLineCreateManyArgs} args - Arguments to create many SalesQuoteLines.
     * @example
     * // Create many SalesQuoteLines
     * const salesQuoteLine = await prisma.salesQuoteLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesQuoteLineCreateManyArgs>(args?: SelectSubset<T, SalesQuoteLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesQuoteLines and returns the data saved in the database.
     * @param {SalesQuoteLineCreateManyAndReturnArgs} args - Arguments to create many SalesQuoteLines.
     * @example
     * // Create many SalesQuoteLines
     * const salesQuoteLine = await prisma.salesQuoteLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesQuoteLines and only return the `id`
     * const salesQuoteLineWithIdOnly = await prisma.salesQuoteLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesQuoteLineCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesQuoteLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesQuoteLine.
     * @param {SalesQuoteLineDeleteArgs} args - Arguments to delete one SalesQuoteLine.
     * @example
     * // Delete one SalesQuoteLine
     * const SalesQuoteLine = await prisma.salesQuoteLine.delete({
     *   where: {
     *     // ... filter to delete one SalesQuoteLine
     *   }
     * })
     * 
     */
    delete<T extends SalesQuoteLineDeleteArgs>(args: SelectSubset<T, SalesQuoteLineDeleteArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesQuoteLine.
     * @param {SalesQuoteLineUpdateArgs} args - Arguments to update one SalesQuoteLine.
     * @example
     * // Update one SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesQuoteLineUpdateArgs>(args: SelectSubset<T, SalesQuoteLineUpdateArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesQuoteLines.
     * @param {SalesQuoteLineDeleteManyArgs} args - Arguments to filter SalesQuoteLines to delete.
     * @example
     * // Delete a few SalesQuoteLines
     * const { count } = await prisma.salesQuoteLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesQuoteLineDeleteManyArgs>(args?: SelectSubset<T, SalesQuoteLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesQuoteLines
     * const salesQuoteLine = await prisma.salesQuoteLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesQuoteLineUpdateManyArgs>(args: SelectSubset<T, SalesQuoteLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteLines and returns the data updated in the database.
     * @param {SalesQuoteLineUpdateManyAndReturnArgs} args - Arguments to update many SalesQuoteLines.
     * @example
     * // Update many SalesQuoteLines
     * const salesQuoteLine = await prisma.salesQuoteLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesQuoteLines and only return the `id`
     * const salesQuoteLineWithIdOnly = await prisma.salesQuoteLine.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesQuoteLineUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesQuoteLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesQuoteLine.
     * @param {SalesQuoteLineUpsertArgs} args - Arguments to update or create a SalesQuoteLine.
     * @example
     * // Update or create a SalesQuoteLine
     * const salesQuoteLine = await prisma.salesQuoteLine.upsert({
     *   create: {
     *     // ... data to create a SalesQuoteLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesQuoteLine we want to update
     *   }
     * })
     */
    upsert<T extends SalesQuoteLineUpsertArgs>(args: SelectSubset<T, SalesQuoteLineUpsertArgs<ExtArgs>>): Prisma__SalesQuoteLineClient<$Result.GetResult<Prisma.$SalesQuoteLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesQuoteLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineCountArgs} args - Arguments to filter SalesQuoteLines to count.
     * @example
     * // Count the number of SalesQuoteLines
     * const count = await prisma.salesQuoteLine.count({
     *   where: {
     *     // ... the filter for the SalesQuoteLines we want to count
     *   }
     * })
    **/
    count<T extends SalesQuoteLineCountArgs>(
      args?: Subset<T, SalesQuoteLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesQuoteLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesQuoteLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesQuoteLineAggregateArgs>(args: Subset<T, SalesQuoteLineAggregateArgs>): Prisma.PrismaPromise<GetSalesQuoteLineAggregateType<T>>

    /**
     * Group by SalesQuoteLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteLineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesQuoteLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesQuoteLineGroupByArgs['orderBy'] }
        : { orderBy?: SalesQuoteLineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesQuoteLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesQuoteLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesQuoteLine model
   */
  readonly fields: SalesQuoteLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesQuoteLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesQuoteLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends SalesQuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesQuoteDefaultArgs<ExtArgs>>): Prisma__SalesQuoteClient<$Result.GetResult<Prisma.$SalesQuotePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesQuoteLine model
   */ 
  interface SalesQuoteLineFieldRefs {
    readonly id: FieldRef<"SalesQuoteLine", 'String'>
    readonly tenantId: FieldRef<"SalesQuoteLine", 'String'>
    readonly quoteId: FieldRef<"SalesQuoteLine", 'String'>
    readonly lineNo: FieldRef<"SalesQuoteLine", 'Int'>
    readonly itemId: FieldRef<"SalesQuoteLine", 'String'>
    readonly itemSnapshot: FieldRef<"SalesQuoteLine", 'Json'>
    readonly salesConfigSnapshot: FieldRef<"SalesQuoteLine", 'Json'>
    readonly packagingRequirementSnapshot: FieldRef<"SalesQuoteLine", 'Json'>
    readonly priceQuantityDeliverySnapshot: FieldRef<"SalesQuoteLine", 'Json'>
    readonly customerItemSnapshot: FieldRef<"SalesQuoteLine", 'Json'>
    readonly createdAt: FieldRef<"SalesQuoteLine", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesQuoteLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesQuoteLine findUnique
   */
  export type SalesQuoteLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteLine to fetch.
     */
    where: SalesQuoteLineWhereUniqueInput
  }

  /**
   * SalesQuoteLine findUniqueOrThrow
   */
  export type SalesQuoteLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteLine to fetch.
     */
    where: SalesQuoteLineWhereUniqueInput
  }

  /**
   * SalesQuoteLine findFirst
   */
  export type SalesQuoteLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteLine to fetch.
     */
    where?: SalesQuoteLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteLines to fetch.
     */
    orderBy?: SalesQuoteLineOrderByWithRelationInput | SalesQuoteLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteLines.
     */
    cursor?: SalesQuoteLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteLines.
     */
    distinct?: SalesQuoteLineScalarFieldEnum | SalesQuoteLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteLine findFirstOrThrow
   */
  export type SalesQuoteLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteLine to fetch.
     */
    where?: SalesQuoteLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteLines to fetch.
     */
    orderBy?: SalesQuoteLineOrderByWithRelationInput | SalesQuoteLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteLines.
     */
    cursor?: SalesQuoteLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteLines.
     */
    distinct?: SalesQuoteLineScalarFieldEnum | SalesQuoteLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteLine findMany
   */
  export type SalesQuoteLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteLines to fetch.
     */
    where?: SalesQuoteLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteLines to fetch.
     */
    orderBy?: SalesQuoteLineOrderByWithRelationInput | SalesQuoteLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesQuoteLines.
     */
    cursor?: SalesQuoteLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteLines.
     */
    skip?: number
    distinct?: SalesQuoteLineScalarFieldEnum | SalesQuoteLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteLine create
   */
  export type SalesQuoteLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesQuoteLine.
     */
    data: XOR<SalesQuoteLineCreateInput, SalesQuoteLineUncheckedCreateInput>
  }

  /**
   * SalesQuoteLine createMany
   */
  export type SalesQuoteLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesQuoteLines.
     */
    data: SalesQuoteLineCreateManyInput | SalesQuoteLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuoteLine createManyAndReturn
   */
  export type SalesQuoteLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * The data used to create many SalesQuoteLines.
     */
    data: SalesQuoteLineCreateManyInput | SalesQuoteLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesQuoteLine update
   */
  export type SalesQuoteLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesQuoteLine.
     */
    data: XOR<SalesQuoteLineUpdateInput, SalesQuoteLineUncheckedUpdateInput>
    /**
     * Choose, which SalesQuoteLine to update.
     */
    where: SalesQuoteLineWhereUniqueInput
  }

  /**
   * SalesQuoteLine updateMany
   */
  export type SalesQuoteLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesQuoteLines.
     */
    data: XOR<SalesQuoteLineUpdateManyMutationInput, SalesQuoteLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteLines to update
     */
    where?: SalesQuoteLineWhereInput
    /**
     * Limit how many SalesQuoteLines to update.
     */
    limit?: number
  }

  /**
   * SalesQuoteLine updateManyAndReturn
   */
  export type SalesQuoteLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * The data used to update SalesQuoteLines.
     */
    data: XOR<SalesQuoteLineUpdateManyMutationInput, SalesQuoteLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteLines to update
     */
    where?: SalesQuoteLineWhereInput
    /**
     * Limit how many SalesQuoteLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesQuoteLine upsert
   */
  export type SalesQuoteLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesQuoteLine to update in case it exists.
     */
    where: SalesQuoteLineWhereUniqueInput
    /**
     * In case the SalesQuoteLine found by the `where` argument doesn't exist, create a new SalesQuoteLine with this data.
     */
    create: XOR<SalesQuoteLineCreateInput, SalesQuoteLineUncheckedCreateInput>
    /**
     * In case the SalesQuoteLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesQuoteLineUpdateInput, SalesQuoteLineUncheckedUpdateInput>
  }

  /**
   * SalesQuoteLine delete
   */
  export type SalesQuoteLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
    /**
     * Filter which SalesQuoteLine to delete.
     */
    where: SalesQuoteLineWhereUniqueInput
  }

  /**
   * SalesQuoteLine deleteMany
   */
  export type SalesQuoteLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteLines to delete
     */
    where?: SalesQuoteLineWhereInput
    /**
     * Limit how many SalesQuoteLines to delete.
     */
    limit?: number
  }

  /**
   * SalesQuoteLine without action
   */
  export type SalesQuoteLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteLine
     */
    select?: SalesQuoteLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteLine
     */
    omit?: SalesQuoteLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteLineInclude<ExtArgs> | null
  }


  /**
   * Model SalesQuoteVersion
   */

  export type AggregateSalesQuoteVersion = {
    _count: SalesQuoteVersionCountAggregateOutputType | null
    _avg: SalesQuoteVersionAvgAggregateOutputType | null
    _sum: SalesQuoteVersionSumAggregateOutputType | null
    _min: SalesQuoteVersionMinAggregateOutputType | null
    _max: SalesQuoteVersionMaxAggregateOutputType | null
  }

  export type SalesQuoteVersionAvgAggregateOutputType = {
    versionNo: number | null
  }

  export type SalesQuoteVersionSumAggregateOutputType = {
    versionNo: number | null
  }

  export type SalesQuoteVersionMinAggregateOutputType = {
    id: string | null
    quoteId: string | null
    quoteNo: string | null
    versionNo: number | null
    tenantId: string | null
    customerTenantPartyId: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type SalesQuoteVersionMaxAggregateOutputType = {
    id: string | null
    quoteId: string | null
    quoteNo: string | null
    versionNo: number | null
    tenantId: string | null
    customerTenantPartyId: string | null
    publishedAt: Date | null
    createdAt: Date | null
  }

  export type SalesQuoteVersionCountAggregateOutputType = {
    id: number
    quoteId: number
    quoteNo: number
    versionNo: number
    tenantId: number
    customerTenantPartyId: number
    publishedAt: number
    createdAt: number
    _all: number
  }


  export type SalesQuoteVersionAvgAggregateInputType = {
    versionNo?: true
  }

  export type SalesQuoteVersionSumAggregateInputType = {
    versionNo?: true
  }

  export type SalesQuoteVersionMinAggregateInputType = {
    id?: true
    quoteId?: true
    quoteNo?: true
    versionNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    publishedAt?: true
    createdAt?: true
  }

  export type SalesQuoteVersionMaxAggregateInputType = {
    id?: true
    quoteId?: true
    quoteNo?: true
    versionNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    publishedAt?: true
    createdAt?: true
  }

  export type SalesQuoteVersionCountAggregateInputType = {
    id?: true
    quoteId?: true
    quoteNo?: true
    versionNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    publishedAt?: true
    createdAt?: true
    _all?: true
  }

  export type SalesQuoteVersionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteVersion to aggregate.
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersions to fetch.
     */
    orderBy?: SalesQuoteVersionOrderByWithRelationInput | SalesQuoteVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesQuoteVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesQuoteVersions
    **/
    _count?: true | SalesQuoteVersionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesQuoteVersionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesQuoteVersionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesQuoteVersionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesQuoteVersionMaxAggregateInputType
  }

  export type GetSalesQuoteVersionAggregateType<T extends SalesQuoteVersionAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesQuoteVersion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesQuoteVersion[P]>
      : GetScalarType<T[P], AggregateSalesQuoteVersion[P]>
  }




  export type SalesQuoteVersionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteVersionWhereInput
    orderBy?: SalesQuoteVersionOrderByWithAggregationInput | SalesQuoteVersionOrderByWithAggregationInput[]
    by: SalesQuoteVersionScalarFieldEnum[] | SalesQuoteVersionScalarFieldEnum
    having?: SalesQuoteVersionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesQuoteVersionCountAggregateInputType | true
    _avg?: SalesQuoteVersionAvgAggregateInputType
    _sum?: SalesQuoteVersionSumAggregateInputType
    _min?: SalesQuoteVersionMinAggregateInputType
    _max?: SalesQuoteVersionMaxAggregateInputType
  }

  export type SalesQuoteVersionGroupByOutputType = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date
    createdAt: Date
    _count: SalesQuoteVersionCountAggregateOutputType | null
    _avg: SalesQuoteVersionAvgAggregateOutputType | null
    _sum: SalesQuoteVersionSumAggregateOutputType | null
    _min: SalesQuoteVersionMinAggregateOutputType | null
    _max: SalesQuoteVersionMaxAggregateOutputType | null
  }

  type GetSalesQuoteVersionGroupByPayload<T extends SalesQuoteVersionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesQuoteVersionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesQuoteVersionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesQuoteVersionGroupByOutputType[P]>
            : GetScalarType<T[P], SalesQuoteVersionGroupByOutputType[P]>
        }
      >
    >


  export type SalesQuoteVersionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    quoteNo?: boolean
    versionNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    lines?: boolean | SalesQuoteVersion$linesArgs<ExtArgs>
    _count?: boolean | SalesQuoteVersionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteVersion"]>

  export type SalesQuoteVersionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    quoteNo?: boolean
    versionNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["salesQuoteVersion"]>

  export type SalesQuoteVersionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    quoteNo?: boolean
    versionNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["salesQuoteVersion"]>

  export type SalesQuoteVersionSelectScalar = {
    id?: boolean
    quoteId?: boolean
    quoteNo?: boolean
    versionNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    publishedAt?: boolean
    createdAt?: boolean
  }

  export type SalesQuoteVersionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quoteId" | "quoteNo" | "versionNo" | "tenantId" | "customerTenantPartyId" | "publishedAt" | "createdAt", ExtArgs["result"]["salesQuoteVersion"]>
  export type SalesQuoteVersionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesQuoteVersion$linesArgs<ExtArgs>
    _count?: boolean | SalesQuoteVersionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SalesQuoteVersionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SalesQuoteVersionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalesQuoteVersionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesQuoteVersion"
    objects: {
      lines: Prisma.$SalesQuoteVersionLinePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteId: string
      quoteNo: string
      versionNo: number
      tenantId: string
      customerTenantPartyId: string
      publishedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["salesQuoteVersion"]>
    composites: {}
  }

  type SalesQuoteVersionGetPayload<S extends boolean | null | undefined | SalesQuoteVersionDefaultArgs> = $Result.GetResult<Prisma.$SalesQuoteVersionPayload, S>

  type SalesQuoteVersionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesQuoteVersionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesQuoteVersionCountAggregateInputType | true
    }

  export interface SalesQuoteVersionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesQuoteVersion'], meta: { name: 'SalesQuoteVersion' } }
    /**
     * Find zero or one SalesQuoteVersion that matches the filter.
     * @param {SalesQuoteVersionFindUniqueArgs} args - Arguments to find a SalesQuoteVersion
     * @example
     * // Get one SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesQuoteVersionFindUniqueArgs>(args: SelectSubset<T, SalesQuoteVersionFindUniqueArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesQuoteVersion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesQuoteVersionFindUniqueOrThrowArgs} args - Arguments to find a SalesQuoteVersion
     * @example
     * // Get one SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesQuoteVersionFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesQuoteVersionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteVersion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionFindFirstArgs} args - Arguments to find a SalesQuoteVersion
     * @example
     * // Get one SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesQuoteVersionFindFirstArgs>(args?: SelectSubset<T, SalesQuoteVersionFindFirstArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteVersion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionFindFirstOrThrowArgs} args - Arguments to find a SalesQuoteVersion
     * @example
     * // Get one SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesQuoteVersionFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesQuoteVersionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesQuoteVersions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesQuoteVersions
     * const salesQuoteVersions = await prisma.salesQuoteVersion.findMany()
     * 
     * // Get first 10 SalesQuoteVersions
     * const salesQuoteVersions = await prisma.salesQuoteVersion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesQuoteVersionWithIdOnly = await prisma.salesQuoteVersion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesQuoteVersionFindManyArgs>(args?: SelectSubset<T, SalesQuoteVersionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesQuoteVersion.
     * @param {SalesQuoteVersionCreateArgs} args - Arguments to create a SalesQuoteVersion.
     * @example
     * // Create one SalesQuoteVersion
     * const SalesQuoteVersion = await prisma.salesQuoteVersion.create({
     *   data: {
     *     // ... data to create a SalesQuoteVersion
     *   }
     * })
     * 
     */
    create<T extends SalesQuoteVersionCreateArgs>(args: SelectSubset<T, SalesQuoteVersionCreateArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesQuoteVersions.
     * @param {SalesQuoteVersionCreateManyArgs} args - Arguments to create many SalesQuoteVersions.
     * @example
     * // Create many SalesQuoteVersions
     * const salesQuoteVersion = await prisma.salesQuoteVersion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesQuoteVersionCreateManyArgs>(args?: SelectSubset<T, SalesQuoteVersionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesQuoteVersions and returns the data saved in the database.
     * @param {SalesQuoteVersionCreateManyAndReturnArgs} args - Arguments to create many SalesQuoteVersions.
     * @example
     * // Create many SalesQuoteVersions
     * const salesQuoteVersion = await prisma.salesQuoteVersion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesQuoteVersions and only return the `id`
     * const salesQuoteVersionWithIdOnly = await prisma.salesQuoteVersion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesQuoteVersionCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesQuoteVersionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesQuoteVersion.
     * @param {SalesQuoteVersionDeleteArgs} args - Arguments to delete one SalesQuoteVersion.
     * @example
     * // Delete one SalesQuoteVersion
     * const SalesQuoteVersion = await prisma.salesQuoteVersion.delete({
     *   where: {
     *     // ... filter to delete one SalesQuoteVersion
     *   }
     * })
     * 
     */
    delete<T extends SalesQuoteVersionDeleteArgs>(args: SelectSubset<T, SalesQuoteVersionDeleteArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesQuoteVersion.
     * @param {SalesQuoteVersionUpdateArgs} args - Arguments to update one SalesQuoteVersion.
     * @example
     * // Update one SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesQuoteVersionUpdateArgs>(args: SelectSubset<T, SalesQuoteVersionUpdateArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesQuoteVersions.
     * @param {SalesQuoteVersionDeleteManyArgs} args - Arguments to filter SalesQuoteVersions to delete.
     * @example
     * // Delete a few SalesQuoteVersions
     * const { count } = await prisma.salesQuoteVersion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesQuoteVersionDeleteManyArgs>(args?: SelectSubset<T, SalesQuoteVersionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesQuoteVersions
     * const salesQuoteVersion = await prisma.salesQuoteVersion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesQuoteVersionUpdateManyArgs>(args: SelectSubset<T, SalesQuoteVersionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteVersions and returns the data updated in the database.
     * @param {SalesQuoteVersionUpdateManyAndReturnArgs} args - Arguments to update many SalesQuoteVersions.
     * @example
     * // Update many SalesQuoteVersions
     * const salesQuoteVersion = await prisma.salesQuoteVersion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesQuoteVersions and only return the `id`
     * const salesQuoteVersionWithIdOnly = await prisma.salesQuoteVersion.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesQuoteVersionUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesQuoteVersionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesQuoteVersion.
     * @param {SalesQuoteVersionUpsertArgs} args - Arguments to update or create a SalesQuoteVersion.
     * @example
     * // Update or create a SalesQuoteVersion
     * const salesQuoteVersion = await prisma.salesQuoteVersion.upsert({
     *   create: {
     *     // ... data to create a SalesQuoteVersion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesQuoteVersion we want to update
     *   }
     * })
     */
    upsert<T extends SalesQuoteVersionUpsertArgs>(args: SelectSubset<T, SalesQuoteVersionUpsertArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesQuoteVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionCountArgs} args - Arguments to filter SalesQuoteVersions to count.
     * @example
     * // Count the number of SalesQuoteVersions
     * const count = await prisma.salesQuoteVersion.count({
     *   where: {
     *     // ... the filter for the SalesQuoteVersions we want to count
     *   }
     * })
    **/
    count<T extends SalesQuoteVersionCountArgs>(
      args?: Subset<T, SalesQuoteVersionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesQuoteVersionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesQuoteVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesQuoteVersionAggregateArgs>(args: Subset<T, SalesQuoteVersionAggregateArgs>): Prisma.PrismaPromise<GetSalesQuoteVersionAggregateType<T>>

    /**
     * Group by SalesQuoteVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesQuoteVersionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesQuoteVersionGroupByArgs['orderBy'] }
        : { orderBy?: SalesQuoteVersionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesQuoteVersionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesQuoteVersionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesQuoteVersion model
   */
  readonly fields: SalesQuoteVersionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesQuoteVersion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesQuoteVersionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends SalesQuoteVersion$linesArgs<ExtArgs> = {}>(args?: Subset<T, SalesQuoteVersion$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesQuoteVersion model
   */ 
  interface SalesQuoteVersionFieldRefs {
    readonly id: FieldRef<"SalesQuoteVersion", 'String'>
    readonly quoteId: FieldRef<"SalesQuoteVersion", 'String'>
    readonly quoteNo: FieldRef<"SalesQuoteVersion", 'String'>
    readonly versionNo: FieldRef<"SalesQuoteVersion", 'Int'>
    readonly tenantId: FieldRef<"SalesQuoteVersion", 'String'>
    readonly customerTenantPartyId: FieldRef<"SalesQuoteVersion", 'String'>
    readonly publishedAt: FieldRef<"SalesQuoteVersion", 'DateTime'>
    readonly createdAt: FieldRef<"SalesQuoteVersion", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesQuoteVersion findUnique
   */
  export type SalesQuoteVersionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersion to fetch.
     */
    where: SalesQuoteVersionWhereUniqueInput
  }

  /**
   * SalesQuoteVersion findUniqueOrThrow
   */
  export type SalesQuoteVersionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersion to fetch.
     */
    where: SalesQuoteVersionWhereUniqueInput
  }

  /**
   * SalesQuoteVersion findFirst
   */
  export type SalesQuoteVersionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersion to fetch.
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersions to fetch.
     */
    orderBy?: SalesQuoteVersionOrderByWithRelationInput | SalesQuoteVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteVersions.
     */
    cursor?: SalesQuoteVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteVersions.
     */
    distinct?: SalesQuoteVersionScalarFieldEnum | SalesQuoteVersionScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersion findFirstOrThrow
   */
  export type SalesQuoteVersionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersion to fetch.
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersions to fetch.
     */
    orderBy?: SalesQuoteVersionOrderByWithRelationInput | SalesQuoteVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteVersions.
     */
    cursor?: SalesQuoteVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteVersions.
     */
    distinct?: SalesQuoteVersionScalarFieldEnum | SalesQuoteVersionScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersion findMany
   */
  export type SalesQuoteVersionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersions to fetch.
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersions to fetch.
     */
    orderBy?: SalesQuoteVersionOrderByWithRelationInput | SalesQuoteVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesQuoteVersions.
     */
    cursor?: SalesQuoteVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersions.
     */
    skip?: number
    distinct?: SalesQuoteVersionScalarFieldEnum | SalesQuoteVersionScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersion create
   */
  export type SalesQuoteVersionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesQuoteVersion.
     */
    data: XOR<SalesQuoteVersionCreateInput, SalesQuoteVersionUncheckedCreateInput>
  }

  /**
   * SalesQuoteVersion createMany
   */
  export type SalesQuoteVersionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesQuoteVersions.
     */
    data: SalesQuoteVersionCreateManyInput | SalesQuoteVersionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuoteVersion createManyAndReturn
   */
  export type SalesQuoteVersionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * The data used to create many SalesQuoteVersions.
     */
    data: SalesQuoteVersionCreateManyInput | SalesQuoteVersionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuoteVersion update
   */
  export type SalesQuoteVersionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesQuoteVersion.
     */
    data: XOR<SalesQuoteVersionUpdateInput, SalesQuoteVersionUncheckedUpdateInput>
    /**
     * Choose, which SalesQuoteVersion to update.
     */
    where: SalesQuoteVersionWhereUniqueInput
  }

  /**
   * SalesQuoteVersion updateMany
   */
  export type SalesQuoteVersionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesQuoteVersions.
     */
    data: XOR<SalesQuoteVersionUpdateManyMutationInput, SalesQuoteVersionUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteVersions to update
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * Limit how many SalesQuoteVersions to update.
     */
    limit?: number
  }

  /**
   * SalesQuoteVersion updateManyAndReturn
   */
  export type SalesQuoteVersionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * The data used to update SalesQuoteVersions.
     */
    data: XOR<SalesQuoteVersionUpdateManyMutationInput, SalesQuoteVersionUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteVersions to update
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * Limit how many SalesQuoteVersions to update.
     */
    limit?: number
  }

  /**
   * SalesQuoteVersion upsert
   */
  export type SalesQuoteVersionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesQuoteVersion to update in case it exists.
     */
    where: SalesQuoteVersionWhereUniqueInput
    /**
     * In case the SalesQuoteVersion found by the `where` argument doesn't exist, create a new SalesQuoteVersion with this data.
     */
    create: XOR<SalesQuoteVersionCreateInput, SalesQuoteVersionUncheckedCreateInput>
    /**
     * In case the SalesQuoteVersion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesQuoteVersionUpdateInput, SalesQuoteVersionUncheckedUpdateInput>
  }

  /**
   * SalesQuoteVersion delete
   */
  export type SalesQuoteVersionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
    /**
     * Filter which SalesQuoteVersion to delete.
     */
    where: SalesQuoteVersionWhereUniqueInput
  }

  /**
   * SalesQuoteVersion deleteMany
   */
  export type SalesQuoteVersionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteVersions to delete
     */
    where?: SalesQuoteVersionWhereInput
    /**
     * Limit how many SalesQuoteVersions to delete.
     */
    limit?: number
  }

  /**
   * SalesQuoteVersion.lines
   */
  export type SalesQuoteVersion$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    where?: SalesQuoteVersionLineWhereInput
    orderBy?: SalesQuoteVersionLineOrderByWithRelationInput | SalesQuoteVersionLineOrderByWithRelationInput[]
    cursor?: SalesQuoteVersionLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SalesQuoteVersionLineScalarFieldEnum | SalesQuoteVersionLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersion without action
   */
  export type SalesQuoteVersionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersion
     */
    select?: SalesQuoteVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersion
     */
    omit?: SalesQuoteVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionInclude<ExtArgs> | null
  }


  /**
   * Model SalesQuoteVersionLine
   */

  export type AggregateSalesQuoteVersionLine = {
    _count: SalesQuoteVersionLineCountAggregateOutputType | null
    _avg: SalesQuoteVersionLineAvgAggregateOutputType | null
    _sum: SalesQuoteVersionLineSumAggregateOutputType | null
    _min: SalesQuoteVersionLineMinAggregateOutputType | null
    _max: SalesQuoteVersionLineMaxAggregateOutputType | null
  }

  export type SalesQuoteVersionLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesQuoteVersionLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesQuoteVersionLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    quoteVersionId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
  }

  export type SalesQuoteVersionLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    quoteVersionId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
  }

  export type SalesQuoteVersionLineCountAggregateOutputType = {
    id: number
    tenantId: number
    quoteVersionId: number
    lineNo: number
    itemId: number
    itemSnapshot: number
    salesConfigSnapshot: number
    packagingRequirementSnapshot: number
    priceQuantityDeliverySnapshot: number
    customerItemSnapshot: number
    createdAt: number
    _all: number
  }


  export type SalesQuoteVersionLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type SalesQuoteVersionLineSumAggregateInputType = {
    lineNo?: true
  }

  export type SalesQuoteVersionLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    quoteVersionId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
  }

  export type SalesQuoteVersionLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    quoteVersionId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
  }

  export type SalesQuoteVersionLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    quoteVersionId?: true
    lineNo?: true
    itemId?: true
    itemSnapshot?: true
    salesConfigSnapshot?: true
    packagingRequirementSnapshot?: true
    priceQuantityDeliverySnapshot?: true
    customerItemSnapshot?: true
    createdAt?: true
    _all?: true
  }

  export type SalesQuoteVersionLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteVersionLine to aggregate.
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersionLines to fetch.
     */
    orderBy?: SalesQuoteVersionLineOrderByWithRelationInput | SalesQuoteVersionLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesQuoteVersionLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersionLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersionLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesQuoteVersionLines
    **/
    _count?: true | SalesQuoteVersionLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesQuoteVersionLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesQuoteVersionLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesQuoteVersionLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesQuoteVersionLineMaxAggregateInputType
  }

  export type GetSalesQuoteVersionLineAggregateType<T extends SalesQuoteVersionLineAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesQuoteVersionLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesQuoteVersionLine[P]>
      : GetScalarType<T[P], AggregateSalesQuoteVersionLine[P]>
  }




  export type SalesQuoteVersionLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesQuoteVersionLineWhereInput
    orderBy?: SalesQuoteVersionLineOrderByWithAggregationInput | SalesQuoteVersionLineOrderByWithAggregationInput[]
    by: SalesQuoteVersionLineScalarFieldEnum[] | SalesQuoteVersionLineScalarFieldEnum
    having?: SalesQuoteVersionLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesQuoteVersionLineCountAggregateInputType | true
    _avg?: SalesQuoteVersionLineAvgAggregateInputType
    _sum?: SalesQuoteVersionLineSumAggregateInputType
    _min?: SalesQuoteVersionLineMinAggregateInputType
    _max?: SalesQuoteVersionLineMaxAggregateInputType
  }

  export type SalesQuoteVersionLineGroupByOutputType = {
    id: string
    tenantId: string
    quoteVersionId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonValue
    salesConfigSnapshot: JsonValue
    packagingRequirementSnapshot: JsonValue
    priceQuantityDeliverySnapshot: JsonValue
    customerItemSnapshot: JsonValue
    createdAt: Date
    _count: SalesQuoteVersionLineCountAggregateOutputType | null
    _avg: SalesQuoteVersionLineAvgAggregateOutputType | null
    _sum: SalesQuoteVersionLineSumAggregateOutputType | null
    _min: SalesQuoteVersionLineMinAggregateOutputType | null
    _max: SalesQuoteVersionLineMaxAggregateOutputType | null
  }

  type GetSalesQuoteVersionLineGroupByPayload<T extends SalesQuoteVersionLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesQuoteVersionLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesQuoteVersionLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesQuoteVersionLineGroupByOutputType[P]>
            : GetScalarType<T[P], SalesQuoteVersionLineGroupByOutputType[P]>
        }
      >
    >


  export type SalesQuoteVersionLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteVersionLine"]>

  export type SalesQuoteVersionLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteVersionLine"]>

  export type SalesQuoteVersionLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    quoteVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesQuoteVersionLine"]>

  export type SalesQuoteVersionLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    quoteVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
  }

  export type SalesQuoteVersionLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "quoteVersionId" | "lineNo" | "itemId" | "itemSnapshot" | "salesConfigSnapshot" | "packagingRequirementSnapshot" | "priceQuantityDeliverySnapshot" | "customerItemSnapshot" | "createdAt", ExtArgs["result"]["salesQuoteVersionLine"]>
  export type SalesQuoteVersionLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }
  export type SalesQuoteVersionLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }
  export type SalesQuoteVersionLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteVersion?: boolean | SalesQuoteVersionDefaultArgs<ExtArgs>
  }

  export type $SalesQuoteVersionLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesQuoteVersionLine"
    objects: {
      quoteVersion: Prisma.$SalesQuoteVersionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      quoteVersionId: string
      lineNo: number
      itemId: string
      itemSnapshot: Prisma.JsonValue
      salesConfigSnapshot: Prisma.JsonValue
      packagingRequirementSnapshot: Prisma.JsonValue
      priceQuantityDeliverySnapshot: Prisma.JsonValue
      customerItemSnapshot: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["salesQuoteVersionLine"]>
    composites: {}
  }

  type SalesQuoteVersionLineGetPayload<S extends boolean | null | undefined | SalesQuoteVersionLineDefaultArgs> = $Result.GetResult<Prisma.$SalesQuoteVersionLinePayload, S>

  type SalesQuoteVersionLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesQuoteVersionLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesQuoteVersionLineCountAggregateInputType | true
    }

  export interface SalesQuoteVersionLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesQuoteVersionLine'], meta: { name: 'SalesQuoteVersionLine' } }
    /**
     * Find zero or one SalesQuoteVersionLine that matches the filter.
     * @param {SalesQuoteVersionLineFindUniqueArgs} args - Arguments to find a SalesQuoteVersionLine
     * @example
     * // Get one SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesQuoteVersionLineFindUniqueArgs>(args: SelectSubset<T, SalesQuoteVersionLineFindUniqueArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesQuoteVersionLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesQuoteVersionLineFindUniqueOrThrowArgs} args - Arguments to find a SalesQuoteVersionLine
     * @example
     * // Get one SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesQuoteVersionLineFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesQuoteVersionLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteVersionLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineFindFirstArgs} args - Arguments to find a SalesQuoteVersionLine
     * @example
     * // Get one SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesQuoteVersionLineFindFirstArgs>(args?: SelectSubset<T, SalesQuoteVersionLineFindFirstArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesQuoteVersionLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineFindFirstOrThrowArgs} args - Arguments to find a SalesQuoteVersionLine
     * @example
     * // Get one SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesQuoteVersionLineFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesQuoteVersionLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesQuoteVersionLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesQuoteVersionLines
     * const salesQuoteVersionLines = await prisma.salesQuoteVersionLine.findMany()
     * 
     * // Get first 10 SalesQuoteVersionLines
     * const salesQuoteVersionLines = await prisma.salesQuoteVersionLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesQuoteVersionLineWithIdOnly = await prisma.salesQuoteVersionLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesQuoteVersionLineFindManyArgs>(args?: SelectSubset<T, SalesQuoteVersionLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesQuoteVersionLine.
     * @param {SalesQuoteVersionLineCreateArgs} args - Arguments to create a SalesQuoteVersionLine.
     * @example
     * // Create one SalesQuoteVersionLine
     * const SalesQuoteVersionLine = await prisma.salesQuoteVersionLine.create({
     *   data: {
     *     // ... data to create a SalesQuoteVersionLine
     *   }
     * })
     * 
     */
    create<T extends SalesQuoteVersionLineCreateArgs>(args: SelectSubset<T, SalesQuoteVersionLineCreateArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesQuoteVersionLines.
     * @param {SalesQuoteVersionLineCreateManyArgs} args - Arguments to create many SalesQuoteVersionLines.
     * @example
     * // Create many SalesQuoteVersionLines
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesQuoteVersionLineCreateManyArgs>(args?: SelectSubset<T, SalesQuoteVersionLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesQuoteVersionLines and returns the data saved in the database.
     * @param {SalesQuoteVersionLineCreateManyAndReturnArgs} args - Arguments to create many SalesQuoteVersionLines.
     * @example
     * // Create many SalesQuoteVersionLines
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesQuoteVersionLines and only return the `id`
     * const salesQuoteVersionLineWithIdOnly = await prisma.salesQuoteVersionLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesQuoteVersionLineCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesQuoteVersionLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesQuoteVersionLine.
     * @param {SalesQuoteVersionLineDeleteArgs} args - Arguments to delete one SalesQuoteVersionLine.
     * @example
     * // Delete one SalesQuoteVersionLine
     * const SalesQuoteVersionLine = await prisma.salesQuoteVersionLine.delete({
     *   where: {
     *     // ... filter to delete one SalesQuoteVersionLine
     *   }
     * })
     * 
     */
    delete<T extends SalesQuoteVersionLineDeleteArgs>(args: SelectSubset<T, SalesQuoteVersionLineDeleteArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesQuoteVersionLine.
     * @param {SalesQuoteVersionLineUpdateArgs} args - Arguments to update one SalesQuoteVersionLine.
     * @example
     * // Update one SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesQuoteVersionLineUpdateArgs>(args: SelectSubset<T, SalesQuoteVersionLineUpdateArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesQuoteVersionLines.
     * @param {SalesQuoteVersionLineDeleteManyArgs} args - Arguments to filter SalesQuoteVersionLines to delete.
     * @example
     * // Delete a few SalesQuoteVersionLines
     * const { count } = await prisma.salesQuoteVersionLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesQuoteVersionLineDeleteManyArgs>(args?: SelectSubset<T, SalesQuoteVersionLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteVersionLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesQuoteVersionLines
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesQuoteVersionLineUpdateManyArgs>(args: SelectSubset<T, SalesQuoteVersionLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesQuoteVersionLines and returns the data updated in the database.
     * @param {SalesQuoteVersionLineUpdateManyAndReturnArgs} args - Arguments to update many SalesQuoteVersionLines.
     * @example
     * // Update many SalesQuoteVersionLines
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesQuoteVersionLines and only return the `id`
     * const salesQuoteVersionLineWithIdOnly = await prisma.salesQuoteVersionLine.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesQuoteVersionLineUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesQuoteVersionLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesQuoteVersionLine.
     * @param {SalesQuoteVersionLineUpsertArgs} args - Arguments to update or create a SalesQuoteVersionLine.
     * @example
     * // Update or create a SalesQuoteVersionLine
     * const salesQuoteVersionLine = await prisma.salesQuoteVersionLine.upsert({
     *   create: {
     *     // ... data to create a SalesQuoteVersionLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesQuoteVersionLine we want to update
     *   }
     * })
     */
    upsert<T extends SalesQuoteVersionLineUpsertArgs>(args: SelectSubset<T, SalesQuoteVersionLineUpsertArgs<ExtArgs>>): Prisma__SalesQuoteVersionLineClient<$Result.GetResult<Prisma.$SalesQuoteVersionLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesQuoteVersionLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineCountArgs} args - Arguments to filter SalesQuoteVersionLines to count.
     * @example
     * // Count the number of SalesQuoteVersionLines
     * const count = await prisma.salesQuoteVersionLine.count({
     *   where: {
     *     // ... the filter for the SalesQuoteVersionLines we want to count
     *   }
     * })
    **/
    count<T extends SalesQuoteVersionLineCountArgs>(
      args?: Subset<T, SalesQuoteVersionLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesQuoteVersionLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesQuoteVersionLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesQuoteVersionLineAggregateArgs>(args: Subset<T, SalesQuoteVersionLineAggregateArgs>): Prisma.PrismaPromise<GetSalesQuoteVersionLineAggregateType<T>>

    /**
     * Group by SalesQuoteVersionLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesQuoteVersionLineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesQuoteVersionLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesQuoteVersionLineGroupByArgs['orderBy'] }
        : { orderBy?: SalesQuoteVersionLineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesQuoteVersionLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesQuoteVersionLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesQuoteVersionLine model
   */
  readonly fields: SalesQuoteVersionLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesQuoteVersionLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesQuoteVersionLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quoteVersion<T extends SalesQuoteVersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesQuoteVersionDefaultArgs<ExtArgs>>): Prisma__SalesQuoteVersionClient<$Result.GetResult<Prisma.$SalesQuoteVersionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesQuoteVersionLine model
   */ 
  interface SalesQuoteVersionLineFieldRefs {
    readonly id: FieldRef<"SalesQuoteVersionLine", 'String'>
    readonly tenantId: FieldRef<"SalesQuoteVersionLine", 'String'>
    readonly quoteVersionId: FieldRef<"SalesQuoteVersionLine", 'String'>
    readonly lineNo: FieldRef<"SalesQuoteVersionLine", 'Int'>
    readonly itemId: FieldRef<"SalesQuoteVersionLine", 'String'>
    readonly itemSnapshot: FieldRef<"SalesQuoteVersionLine", 'Json'>
    readonly salesConfigSnapshot: FieldRef<"SalesQuoteVersionLine", 'Json'>
    readonly packagingRequirementSnapshot: FieldRef<"SalesQuoteVersionLine", 'Json'>
    readonly priceQuantityDeliverySnapshot: FieldRef<"SalesQuoteVersionLine", 'Json'>
    readonly customerItemSnapshot: FieldRef<"SalesQuoteVersionLine", 'Json'>
    readonly createdAt: FieldRef<"SalesQuoteVersionLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesQuoteVersionLine findUnique
   */
  export type SalesQuoteVersionLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersionLine to fetch.
     */
    where: SalesQuoteVersionLineWhereUniqueInput
  }

  /**
   * SalesQuoteVersionLine findUniqueOrThrow
   */
  export type SalesQuoteVersionLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersionLine to fetch.
     */
    where: SalesQuoteVersionLineWhereUniqueInput
  }

  /**
   * SalesQuoteVersionLine findFirst
   */
  export type SalesQuoteVersionLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersionLine to fetch.
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersionLines to fetch.
     */
    orderBy?: SalesQuoteVersionLineOrderByWithRelationInput | SalesQuoteVersionLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteVersionLines.
     */
    cursor?: SalesQuoteVersionLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersionLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersionLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteVersionLines.
     */
    distinct?: SalesQuoteVersionLineScalarFieldEnum | SalesQuoteVersionLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersionLine findFirstOrThrow
   */
  export type SalesQuoteVersionLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersionLine to fetch.
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersionLines to fetch.
     */
    orderBy?: SalesQuoteVersionLineOrderByWithRelationInput | SalesQuoteVersionLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesQuoteVersionLines.
     */
    cursor?: SalesQuoteVersionLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersionLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersionLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesQuoteVersionLines.
     */
    distinct?: SalesQuoteVersionLineScalarFieldEnum | SalesQuoteVersionLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersionLine findMany
   */
  export type SalesQuoteVersionLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesQuoteVersionLines to fetch.
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesQuoteVersionLines to fetch.
     */
    orderBy?: SalesQuoteVersionLineOrderByWithRelationInput | SalesQuoteVersionLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesQuoteVersionLines.
     */
    cursor?: SalesQuoteVersionLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesQuoteVersionLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesQuoteVersionLines.
     */
    skip?: number
    distinct?: SalesQuoteVersionLineScalarFieldEnum | SalesQuoteVersionLineScalarFieldEnum[]
  }

  /**
   * SalesQuoteVersionLine create
   */
  export type SalesQuoteVersionLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesQuoteVersionLine.
     */
    data: XOR<SalesQuoteVersionLineCreateInput, SalesQuoteVersionLineUncheckedCreateInput>
  }

  /**
   * SalesQuoteVersionLine createMany
   */
  export type SalesQuoteVersionLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesQuoteVersionLines.
     */
    data: SalesQuoteVersionLineCreateManyInput | SalesQuoteVersionLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesQuoteVersionLine createManyAndReturn
   */
  export type SalesQuoteVersionLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * The data used to create many SalesQuoteVersionLines.
     */
    data: SalesQuoteVersionLineCreateManyInput | SalesQuoteVersionLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesQuoteVersionLine update
   */
  export type SalesQuoteVersionLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesQuoteVersionLine.
     */
    data: XOR<SalesQuoteVersionLineUpdateInput, SalesQuoteVersionLineUncheckedUpdateInput>
    /**
     * Choose, which SalesQuoteVersionLine to update.
     */
    where: SalesQuoteVersionLineWhereUniqueInput
  }

  /**
   * SalesQuoteVersionLine updateMany
   */
  export type SalesQuoteVersionLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesQuoteVersionLines.
     */
    data: XOR<SalesQuoteVersionLineUpdateManyMutationInput, SalesQuoteVersionLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteVersionLines to update
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * Limit how many SalesQuoteVersionLines to update.
     */
    limit?: number
  }

  /**
   * SalesQuoteVersionLine updateManyAndReturn
   */
  export type SalesQuoteVersionLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * The data used to update SalesQuoteVersionLines.
     */
    data: XOR<SalesQuoteVersionLineUpdateManyMutationInput, SalesQuoteVersionLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesQuoteVersionLines to update
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * Limit how many SalesQuoteVersionLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesQuoteVersionLine upsert
   */
  export type SalesQuoteVersionLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesQuoteVersionLine to update in case it exists.
     */
    where: SalesQuoteVersionLineWhereUniqueInput
    /**
     * In case the SalesQuoteVersionLine found by the `where` argument doesn't exist, create a new SalesQuoteVersionLine with this data.
     */
    create: XOR<SalesQuoteVersionLineCreateInput, SalesQuoteVersionLineUncheckedCreateInput>
    /**
     * In case the SalesQuoteVersionLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesQuoteVersionLineUpdateInput, SalesQuoteVersionLineUncheckedUpdateInput>
  }

  /**
   * SalesQuoteVersionLine delete
   */
  export type SalesQuoteVersionLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
    /**
     * Filter which SalesQuoteVersionLine to delete.
     */
    where: SalesQuoteVersionLineWhereUniqueInput
  }

  /**
   * SalesQuoteVersionLine deleteMany
   */
  export type SalesQuoteVersionLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesQuoteVersionLines to delete
     */
    where?: SalesQuoteVersionLineWhereInput
    /**
     * Limit how many SalesQuoteVersionLines to delete.
     */
    limit?: number
  }

  /**
   * SalesQuoteVersionLine without action
   */
  export type SalesQuoteVersionLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesQuoteVersionLine
     */
    select?: SalesQuoteVersionLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesQuoteVersionLine
     */
    omit?: SalesQuoteVersionLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesQuoteVersionLineInclude<ExtArgs> | null
  }


  /**
   * Model SalesOrder
   */

  export type AggregateSalesOrder = {
    _count: SalesOrderCountAggregateOutputType | null
    _min: SalesOrderMinAggregateOutputType | null
    _max: SalesOrderMaxAggregateOutputType | null
  }

  export type SalesOrderMinAggregateOutputType = {
    id: string | null
    salesOrderNo: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    quoteId: string | null
    quoteVersionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderMaxAggregateOutputType = {
    id: string | null
    salesOrderNo: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    quoteId: string | null
    quoteVersionId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderCountAggregateOutputType = {
    id: number
    salesOrderNo: number
    tenantId: number
    customerTenantPartyId: number
    quoteId: number
    quoteVersionId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesOrderMinAggregateInputType = {
    id?: true
    salesOrderNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    quoteId?: true
    quoteVersionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderMaxAggregateInputType = {
    id?: true
    salesOrderNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    quoteId?: true
    quoteVersionId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderCountAggregateInputType = {
    id?: true
    salesOrderNo?: true
    tenantId?: true
    customerTenantPartyId?: true
    quoteId?: true
    quoteVersionId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesOrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrder to aggregate.
     */
    where?: SalesOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrders to fetch.
     */
    orderBy?: SalesOrderOrderByWithRelationInput | SalesOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesOrders
    **/
    _count?: true | SalesOrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesOrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesOrderMaxAggregateInputType
  }

  export type GetSalesOrderAggregateType<T extends SalesOrderAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesOrder[P]>
      : GetScalarType<T[P], AggregateSalesOrder[P]>
  }




  export type SalesOrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesOrderWhereInput
    orderBy?: SalesOrderOrderByWithAggregationInput | SalesOrderOrderByWithAggregationInput[]
    by: SalesOrderScalarFieldEnum[] | SalesOrderScalarFieldEnum
    having?: SalesOrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesOrderCountAggregateInputType | true
    _min?: SalesOrderMinAggregateInputType
    _max?: SalesOrderMaxAggregateInputType
  }

  export type SalesOrderGroupByOutputType = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt: Date
    updatedAt: Date
    _count: SalesOrderCountAggregateOutputType | null
    _min: SalesOrderMinAggregateOutputType | null
    _max: SalesOrderMaxAggregateOutputType | null
  }

  type GetSalesOrderGroupByPayload<T extends SalesOrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesOrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesOrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesOrderGroupByOutputType[P]>
            : GetScalarType<T[P], SalesOrderGroupByOutputType[P]>
        }
      >
    >


  export type SalesOrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    salesOrderNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    quoteId?: boolean
    quoteVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lines?: boolean | SalesOrder$linesArgs<ExtArgs>
    commercialGateSummary?: boolean | SalesOrder$commercialGateSummaryArgs<ExtArgs>
    fulfillmentHandoffSummary?: boolean | SalesOrder$fulfillmentHandoffSummaryArgs<ExtArgs>
    _count?: boolean | SalesOrderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrder"]>

  export type SalesOrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    salesOrderNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    quoteId?: boolean
    quoteVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesOrder"]>

  export type SalesOrderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    salesOrderNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    quoteId?: boolean
    quoteVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesOrder"]>

  export type SalesOrderSelectScalar = {
    id?: boolean
    salesOrderNo?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    quoteId?: boolean
    quoteVersionId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesOrderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "salesOrderNo" | "tenantId" | "customerTenantPartyId" | "quoteId" | "quoteVersionId" | "createdAt" | "updatedAt", ExtArgs["result"]["salesOrder"]>
  export type SalesOrderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesOrder$linesArgs<ExtArgs>
    commercialGateSummary?: boolean | SalesOrder$commercialGateSummaryArgs<ExtArgs>
    fulfillmentHandoffSummary?: boolean | SalesOrder$fulfillmentHandoffSummaryArgs<ExtArgs>
    _count?: boolean | SalesOrderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SalesOrderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SalesOrderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalesOrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesOrder"
    objects: {
      lines: Prisma.$SalesOrderLinePayload<ExtArgs>[]
      commercialGateSummary: Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs> | null
      fulfillmentHandoffSummary: Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      salesOrderNo: string
      tenantId: string
      customerTenantPartyId: string
      quoteId: string
      quoteVersionId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesOrder"]>
    composites: {}
  }

  type SalesOrderGetPayload<S extends boolean | null | undefined | SalesOrderDefaultArgs> = $Result.GetResult<Prisma.$SalesOrderPayload, S>

  type SalesOrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesOrderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesOrderCountAggregateInputType | true
    }

  export interface SalesOrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesOrder'], meta: { name: 'SalesOrder' } }
    /**
     * Find zero or one SalesOrder that matches the filter.
     * @param {SalesOrderFindUniqueArgs} args - Arguments to find a SalesOrder
     * @example
     * // Get one SalesOrder
     * const salesOrder = await prisma.salesOrder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesOrderFindUniqueArgs>(args: SelectSubset<T, SalesOrderFindUniqueArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesOrder that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesOrderFindUniqueOrThrowArgs} args - Arguments to find a SalesOrder
     * @example
     * // Get one SalesOrder
     * const salesOrder = await prisma.salesOrder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesOrderFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesOrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFindFirstArgs} args - Arguments to find a SalesOrder
     * @example
     * // Get one SalesOrder
     * const salesOrder = await prisma.salesOrder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesOrderFindFirstArgs>(args?: SelectSubset<T, SalesOrderFindFirstArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFindFirstOrThrowArgs} args - Arguments to find a SalesOrder
     * @example
     * // Get one SalesOrder
     * const salesOrder = await prisma.salesOrder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesOrderFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesOrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesOrders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesOrders
     * const salesOrders = await prisma.salesOrder.findMany()
     * 
     * // Get first 10 SalesOrders
     * const salesOrders = await prisma.salesOrder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesOrderWithIdOnly = await prisma.salesOrder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesOrderFindManyArgs>(args?: SelectSubset<T, SalesOrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesOrder.
     * @param {SalesOrderCreateArgs} args - Arguments to create a SalesOrder.
     * @example
     * // Create one SalesOrder
     * const SalesOrder = await prisma.salesOrder.create({
     *   data: {
     *     // ... data to create a SalesOrder
     *   }
     * })
     * 
     */
    create<T extends SalesOrderCreateArgs>(args: SelectSubset<T, SalesOrderCreateArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesOrders.
     * @param {SalesOrderCreateManyArgs} args - Arguments to create many SalesOrders.
     * @example
     * // Create many SalesOrders
     * const salesOrder = await prisma.salesOrder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesOrderCreateManyArgs>(args?: SelectSubset<T, SalesOrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesOrders and returns the data saved in the database.
     * @param {SalesOrderCreateManyAndReturnArgs} args - Arguments to create many SalesOrders.
     * @example
     * // Create many SalesOrders
     * const salesOrder = await prisma.salesOrder.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesOrders and only return the `id`
     * const salesOrderWithIdOnly = await prisma.salesOrder.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesOrderCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesOrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesOrder.
     * @param {SalesOrderDeleteArgs} args - Arguments to delete one SalesOrder.
     * @example
     * // Delete one SalesOrder
     * const SalesOrder = await prisma.salesOrder.delete({
     *   where: {
     *     // ... filter to delete one SalesOrder
     *   }
     * })
     * 
     */
    delete<T extends SalesOrderDeleteArgs>(args: SelectSubset<T, SalesOrderDeleteArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesOrder.
     * @param {SalesOrderUpdateArgs} args - Arguments to update one SalesOrder.
     * @example
     * // Update one SalesOrder
     * const salesOrder = await prisma.salesOrder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesOrderUpdateArgs>(args: SelectSubset<T, SalesOrderUpdateArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesOrders.
     * @param {SalesOrderDeleteManyArgs} args - Arguments to filter SalesOrders to delete.
     * @example
     * // Delete a few SalesOrders
     * const { count } = await prisma.salesOrder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesOrderDeleteManyArgs>(args?: SelectSubset<T, SalesOrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesOrders
     * const salesOrder = await prisma.salesOrder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesOrderUpdateManyArgs>(args: SelectSubset<T, SalesOrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrders and returns the data updated in the database.
     * @param {SalesOrderUpdateManyAndReturnArgs} args - Arguments to update many SalesOrders.
     * @example
     * // Update many SalesOrders
     * const salesOrder = await prisma.salesOrder.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesOrders and only return the `id`
     * const salesOrderWithIdOnly = await prisma.salesOrder.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesOrderUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesOrderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesOrder.
     * @param {SalesOrderUpsertArgs} args - Arguments to update or create a SalesOrder.
     * @example
     * // Update or create a SalesOrder
     * const salesOrder = await prisma.salesOrder.upsert({
     *   create: {
     *     // ... data to create a SalesOrder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesOrder we want to update
     *   }
     * })
     */
    upsert<T extends SalesOrderUpsertArgs>(args: SelectSubset<T, SalesOrderUpsertArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCountArgs} args - Arguments to filter SalesOrders to count.
     * @example
     * // Count the number of SalesOrders
     * const count = await prisma.salesOrder.count({
     *   where: {
     *     // ... the filter for the SalesOrders we want to count
     *   }
     * })
    **/
    count<T extends SalesOrderCountArgs>(
      args?: Subset<T, SalesOrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesOrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesOrderAggregateArgs>(args: Subset<T, SalesOrderAggregateArgs>): Prisma.PrismaPromise<GetSalesOrderAggregateType<T>>

    /**
     * Group by SalesOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesOrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesOrderGroupByArgs['orderBy'] }
        : { orderBy?: SalesOrderGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesOrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesOrder model
   */
  readonly fields: SalesOrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesOrder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesOrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends SalesOrder$linesArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrder$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    commercialGateSummary<T extends SalesOrder$commercialGateSummaryArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrder$commercialGateSummaryArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    fulfillmentHandoffSummary<T extends SalesOrder$fulfillmentHandoffSummaryArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrder$fulfillmentHandoffSummaryArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesOrder model
   */ 
  interface SalesOrderFieldRefs {
    readonly id: FieldRef<"SalesOrder", 'String'>
    readonly salesOrderNo: FieldRef<"SalesOrder", 'String'>
    readonly tenantId: FieldRef<"SalesOrder", 'String'>
    readonly customerTenantPartyId: FieldRef<"SalesOrder", 'String'>
    readonly quoteId: FieldRef<"SalesOrder", 'String'>
    readonly quoteVersionId: FieldRef<"SalesOrder", 'String'>
    readonly createdAt: FieldRef<"SalesOrder", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesOrder", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesOrder findUnique
   */
  export type SalesOrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrder to fetch.
     */
    where: SalesOrderWhereUniqueInput
  }

  /**
   * SalesOrder findUniqueOrThrow
   */
  export type SalesOrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrder to fetch.
     */
    where: SalesOrderWhereUniqueInput
  }

  /**
   * SalesOrder findFirst
   */
  export type SalesOrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrder to fetch.
     */
    where?: SalesOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrders to fetch.
     */
    orderBy?: SalesOrderOrderByWithRelationInput | SalesOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrders.
     */
    cursor?: SalesOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrders.
     */
    distinct?: SalesOrderScalarFieldEnum | SalesOrderScalarFieldEnum[]
  }

  /**
   * SalesOrder findFirstOrThrow
   */
  export type SalesOrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrder to fetch.
     */
    where?: SalesOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrders to fetch.
     */
    orderBy?: SalesOrderOrderByWithRelationInput | SalesOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrders.
     */
    cursor?: SalesOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrders.
     */
    distinct?: SalesOrderScalarFieldEnum | SalesOrderScalarFieldEnum[]
  }

  /**
   * SalesOrder findMany
   */
  export type SalesOrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrders to fetch.
     */
    where?: SalesOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrders to fetch.
     */
    orderBy?: SalesOrderOrderByWithRelationInput | SalesOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesOrders.
     */
    cursor?: SalesOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrders.
     */
    skip?: number
    distinct?: SalesOrderScalarFieldEnum | SalesOrderScalarFieldEnum[]
  }

  /**
   * SalesOrder create
   */
  export type SalesOrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesOrder.
     */
    data: XOR<SalesOrderCreateInput, SalesOrderUncheckedCreateInput>
  }

  /**
   * SalesOrder createMany
   */
  export type SalesOrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesOrders.
     */
    data: SalesOrderCreateManyInput | SalesOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesOrder createManyAndReturn
   */
  export type SalesOrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * The data used to create many SalesOrders.
     */
    data: SalesOrderCreateManyInput | SalesOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesOrder update
   */
  export type SalesOrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesOrder.
     */
    data: XOR<SalesOrderUpdateInput, SalesOrderUncheckedUpdateInput>
    /**
     * Choose, which SalesOrder to update.
     */
    where: SalesOrderWhereUniqueInput
  }

  /**
   * SalesOrder updateMany
   */
  export type SalesOrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesOrders.
     */
    data: XOR<SalesOrderUpdateManyMutationInput, SalesOrderUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrders to update
     */
    where?: SalesOrderWhereInput
    /**
     * Limit how many SalesOrders to update.
     */
    limit?: number
  }

  /**
   * SalesOrder updateManyAndReturn
   */
  export type SalesOrderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * The data used to update SalesOrders.
     */
    data: XOR<SalesOrderUpdateManyMutationInput, SalesOrderUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrders to update
     */
    where?: SalesOrderWhereInput
    /**
     * Limit how many SalesOrders to update.
     */
    limit?: number
  }

  /**
   * SalesOrder upsert
   */
  export type SalesOrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesOrder to update in case it exists.
     */
    where: SalesOrderWhereUniqueInput
    /**
     * In case the SalesOrder found by the `where` argument doesn't exist, create a new SalesOrder with this data.
     */
    create: XOR<SalesOrderCreateInput, SalesOrderUncheckedCreateInput>
    /**
     * In case the SalesOrder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesOrderUpdateInput, SalesOrderUncheckedUpdateInput>
  }

  /**
   * SalesOrder delete
   */
  export type SalesOrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
    /**
     * Filter which SalesOrder to delete.
     */
    where: SalesOrderWhereUniqueInput
  }

  /**
   * SalesOrder deleteMany
   */
  export type SalesOrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrders to delete
     */
    where?: SalesOrderWhereInput
    /**
     * Limit how many SalesOrders to delete.
     */
    limit?: number
  }

  /**
   * SalesOrder.lines
   */
  export type SalesOrder$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    where?: SalesOrderLineWhereInput
    orderBy?: SalesOrderLineOrderByWithRelationInput | SalesOrderLineOrderByWithRelationInput[]
    cursor?: SalesOrderLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SalesOrderLineScalarFieldEnum | SalesOrderLineScalarFieldEnum[]
  }

  /**
   * SalesOrder.commercialGateSummary
   */
  export type SalesOrder$commercialGateSummaryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    where?: SalesOrderCommercialGateSummaryWhereInput
  }

  /**
   * SalesOrder.fulfillmentHandoffSummary
   */
  export type SalesOrder$fulfillmentHandoffSummaryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
  }

  /**
   * SalesOrder without action
   */
  export type SalesOrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrder
     */
    select?: SalesOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrder
     */
    omit?: SalesOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderInclude<ExtArgs> | null
  }


  /**
   * Model SalesOrderCommercialGateSummary
   */

  export type AggregateSalesOrderCommercialGateSummary = {
    _count: SalesOrderCommercialGateSummaryCountAggregateOutputType | null
    _min: SalesOrderCommercialGateSummaryMinAggregateOutputType | null
    _max: SalesOrderCommercialGateSummaryMaxAggregateOutputType | null
  }

  export type SalesOrderCommercialGateSummaryMinAggregateOutputType = {
    salesOrderId: string | null
    tenantId: string | null
    orderEstablished: boolean | null
    productionGate: boolean | null
    stockingGate: boolean | null
    shippingGate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderCommercialGateSummaryMaxAggregateOutputType = {
    salesOrderId: string | null
    tenantId: string | null
    orderEstablished: boolean | null
    productionGate: boolean | null
    stockingGate: boolean | null
    shippingGate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderCommercialGateSummaryCountAggregateOutputType = {
    salesOrderId: number
    tenantId: number
    orderEstablished: number
    productionGate: number
    stockingGate: number
    shippingGate: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesOrderCommercialGateSummaryMinAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    orderEstablished?: true
    productionGate?: true
    stockingGate?: true
    shippingGate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderCommercialGateSummaryMaxAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    orderEstablished?: true
    productionGate?: true
    stockingGate?: true
    shippingGate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderCommercialGateSummaryCountAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    orderEstablished?: true
    productionGate?: true
    stockingGate?: true
    shippingGate?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesOrderCommercialGateSummaryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderCommercialGateSummary to aggregate.
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderCommercialGateSummaries to fetch.
     */
    orderBy?: SalesOrderCommercialGateSummaryOrderByWithRelationInput | SalesOrderCommercialGateSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesOrderCommercialGateSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderCommercialGateSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderCommercialGateSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesOrderCommercialGateSummaries
    **/
    _count?: true | SalesOrderCommercialGateSummaryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesOrderCommercialGateSummaryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesOrderCommercialGateSummaryMaxAggregateInputType
  }

  export type GetSalesOrderCommercialGateSummaryAggregateType<T extends SalesOrderCommercialGateSummaryAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesOrderCommercialGateSummary]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesOrderCommercialGateSummary[P]>
      : GetScalarType<T[P], AggregateSalesOrderCommercialGateSummary[P]>
  }




  export type SalesOrderCommercialGateSummaryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesOrderCommercialGateSummaryWhereInput
    orderBy?: SalesOrderCommercialGateSummaryOrderByWithAggregationInput | SalesOrderCommercialGateSummaryOrderByWithAggregationInput[]
    by: SalesOrderCommercialGateSummaryScalarFieldEnum[] | SalesOrderCommercialGateSummaryScalarFieldEnum
    having?: SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesOrderCommercialGateSummaryCountAggregateInputType | true
    _min?: SalesOrderCommercialGateSummaryMinAggregateInputType
    _max?: SalesOrderCommercialGateSummaryMaxAggregateInputType
  }

  export type SalesOrderCommercialGateSummaryGroupByOutputType = {
    salesOrderId: string
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt: Date
    updatedAt: Date
    _count: SalesOrderCommercialGateSummaryCountAggregateOutputType | null
    _min: SalesOrderCommercialGateSummaryMinAggregateOutputType | null
    _max: SalesOrderCommercialGateSummaryMaxAggregateOutputType | null
  }

  type GetSalesOrderCommercialGateSummaryGroupByPayload<T extends SalesOrderCommercialGateSummaryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesOrderCommercialGateSummaryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesOrderCommercialGateSummaryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesOrderCommercialGateSummaryGroupByOutputType[P]>
            : GetScalarType<T[P], SalesOrderCommercialGateSummaryGroupByOutputType[P]>
        }
      >
    >


  export type SalesOrderCommercialGateSummarySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    orderEstablished?: boolean
    productionGate?: boolean
    stockingGate?: boolean
    shippingGate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderCommercialGateSummary"]>

  export type SalesOrderCommercialGateSummarySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    orderEstablished?: boolean
    productionGate?: boolean
    stockingGate?: boolean
    shippingGate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderCommercialGateSummary"]>

  export type SalesOrderCommercialGateSummarySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    orderEstablished?: boolean
    productionGate?: boolean
    stockingGate?: boolean
    shippingGate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderCommercialGateSummary"]>

  export type SalesOrderCommercialGateSummarySelectScalar = {
    salesOrderId?: boolean
    tenantId?: boolean
    orderEstablished?: boolean
    productionGate?: boolean
    stockingGate?: boolean
    shippingGate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesOrderCommercialGateSummaryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"salesOrderId" | "tenantId" | "orderEstablished" | "productionGate" | "stockingGate" | "shippingGate" | "createdAt" | "updatedAt", ExtArgs["result"]["salesOrderCommercialGateSummary"]>
  export type SalesOrderCommercialGateSummaryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderCommercialGateSummaryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderCommercialGateSummaryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }

  export type $SalesOrderCommercialGateSummaryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesOrderCommercialGateSummary"
    objects: {
      salesOrder: Prisma.$SalesOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      salesOrderId: string
      tenantId: string
      orderEstablished: boolean
      productionGate: boolean
      stockingGate: boolean
      shippingGate: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesOrderCommercialGateSummary"]>
    composites: {}
  }

  type SalesOrderCommercialGateSummaryGetPayload<S extends boolean | null | undefined | SalesOrderCommercialGateSummaryDefaultArgs> = $Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload, S>

  type SalesOrderCommercialGateSummaryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesOrderCommercialGateSummaryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesOrderCommercialGateSummaryCountAggregateInputType | true
    }

  export interface SalesOrderCommercialGateSummaryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesOrderCommercialGateSummary'], meta: { name: 'SalesOrderCommercialGateSummary' } }
    /**
     * Find zero or one SalesOrderCommercialGateSummary that matches the filter.
     * @param {SalesOrderCommercialGateSummaryFindUniqueArgs} args - Arguments to find a SalesOrderCommercialGateSummary
     * @example
     * // Get one SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesOrderCommercialGateSummaryFindUniqueArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryFindUniqueArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesOrderCommercialGateSummary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesOrderCommercialGateSummaryFindUniqueOrThrowArgs} args - Arguments to find a SalesOrderCommercialGateSummary
     * @example
     * // Get one SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesOrderCommercialGateSummaryFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderCommercialGateSummary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryFindFirstArgs} args - Arguments to find a SalesOrderCommercialGateSummary
     * @example
     * // Get one SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesOrderCommercialGateSummaryFindFirstArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryFindFirstArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderCommercialGateSummary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryFindFirstOrThrowArgs} args - Arguments to find a SalesOrderCommercialGateSummary
     * @example
     * // Get one SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesOrderCommercialGateSummaryFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesOrderCommercialGateSummaries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummaries = await prisma.salesOrderCommercialGateSummary.findMany()
     * 
     * // Get first 10 SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummaries = await prisma.salesOrderCommercialGateSummary.findMany({ take: 10 })
     * 
     * // Only select the `salesOrderId`
     * const salesOrderCommercialGateSummaryWithSalesOrderIdOnly = await prisma.salesOrderCommercialGateSummary.findMany({ select: { salesOrderId: true } })
     * 
     */
    findMany<T extends SalesOrderCommercialGateSummaryFindManyArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesOrderCommercialGateSummary.
     * @param {SalesOrderCommercialGateSummaryCreateArgs} args - Arguments to create a SalesOrderCommercialGateSummary.
     * @example
     * // Create one SalesOrderCommercialGateSummary
     * const SalesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.create({
     *   data: {
     *     // ... data to create a SalesOrderCommercialGateSummary
     *   }
     * })
     * 
     */
    create<T extends SalesOrderCommercialGateSummaryCreateArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryCreateArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesOrderCommercialGateSummaries.
     * @param {SalesOrderCommercialGateSummaryCreateManyArgs} args - Arguments to create many SalesOrderCommercialGateSummaries.
     * @example
     * // Create many SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesOrderCommercialGateSummaryCreateManyArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesOrderCommercialGateSummaries and returns the data saved in the database.
     * @param {SalesOrderCommercialGateSummaryCreateManyAndReturnArgs} args - Arguments to create many SalesOrderCommercialGateSummaries.
     * @example
     * // Create many SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesOrderCommercialGateSummaries and only return the `salesOrderId`
     * const salesOrderCommercialGateSummaryWithSalesOrderIdOnly = await prisma.salesOrderCommercialGateSummary.createManyAndReturn({
     *   select: { salesOrderId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesOrderCommercialGateSummaryCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesOrderCommercialGateSummary.
     * @param {SalesOrderCommercialGateSummaryDeleteArgs} args - Arguments to delete one SalesOrderCommercialGateSummary.
     * @example
     * // Delete one SalesOrderCommercialGateSummary
     * const SalesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.delete({
     *   where: {
     *     // ... filter to delete one SalesOrderCommercialGateSummary
     *   }
     * })
     * 
     */
    delete<T extends SalesOrderCommercialGateSummaryDeleteArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryDeleteArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesOrderCommercialGateSummary.
     * @param {SalesOrderCommercialGateSummaryUpdateArgs} args - Arguments to update one SalesOrderCommercialGateSummary.
     * @example
     * // Update one SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesOrderCommercialGateSummaryUpdateArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryUpdateArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesOrderCommercialGateSummaries.
     * @param {SalesOrderCommercialGateSummaryDeleteManyArgs} args - Arguments to filter SalesOrderCommercialGateSummaries to delete.
     * @example
     * // Delete a few SalesOrderCommercialGateSummaries
     * const { count } = await prisma.salesOrderCommercialGateSummary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesOrderCommercialGateSummaryDeleteManyArgs>(args?: SelectSubset<T, SalesOrderCommercialGateSummaryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderCommercialGateSummaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesOrderCommercialGateSummaryUpdateManyArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderCommercialGateSummaries and returns the data updated in the database.
     * @param {SalesOrderCommercialGateSummaryUpdateManyAndReturnArgs} args - Arguments to update many SalesOrderCommercialGateSummaries.
     * @example
     * // Update many SalesOrderCommercialGateSummaries
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesOrderCommercialGateSummaries and only return the `salesOrderId`
     * const salesOrderCommercialGateSummaryWithSalesOrderIdOnly = await prisma.salesOrderCommercialGateSummary.updateManyAndReturn({
     *   select: { salesOrderId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesOrderCommercialGateSummaryUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesOrderCommercialGateSummary.
     * @param {SalesOrderCommercialGateSummaryUpsertArgs} args - Arguments to update or create a SalesOrderCommercialGateSummary.
     * @example
     * // Update or create a SalesOrderCommercialGateSummary
     * const salesOrderCommercialGateSummary = await prisma.salesOrderCommercialGateSummary.upsert({
     *   create: {
     *     // ... data to create a SalesOrderCommercialGateSummary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesOrderCommercialGateSummary we want to update
     *   }
     * })
     */
    upsert<T extends SalesOrderCommercialGateSummaryUpsertArgs>(args: SelectSubset<T, SalesOrderCommercialGateSummaryUpsertArgs<ExtArgs>>): Prisma__SalesOrderCommercialGateSummaryClient<$Result.GetResult<Prisma.$SalesOrderCommercialGateSummaryPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesOrderCommercialGateSummaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryCountArgs} args - Arguments to filter SalesOrderCommercialGateSummaries to count.
     * @example
     * // Count the number of SalesOrderCommercialGateSummaries
     * const count = await prisma.salesOrderCommercialGateSummary.count({
     *   where: {
     *     // ... the filter for the SalesOrderCommercialGateSummaries we want to count
     *   }
     * })
    **/
    count<T extends SalesOrderCommercialGateSummaryCountArgs>(
      args?: Subset<T, SalesOrderCommercialGateSummaryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesOrderCommercialGateSummaryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesOrderCommercialGateSummary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesOrderCommercialGateSummaryAggregateArgs>(args: Subset<T, SalesOrderCommercialGateSummaryAggregateArgs>): Prisma.PrismaPromise<GetSalesOrderCommercialGateSummaryAggregateType<T>>

    /**
     * Group by SalesOrderCommercialGateSummary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderCommercialGateSummaryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesOrderCommercialGateSummaryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesOrderCommercialGateSummaryGroupByArgs['orderBy'] }
        : { orderBy?: SalesOrderCommercialGateSummaryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesOrderCommercialGateSummaryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesOrderCommercialGateSummaryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesOrderCommercialGateSummary model
   */
  readonly fields: SalesOrderCommercialGateSummaryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesOrderCommercialGateSummary.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesOrderCommercialGateSummaryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    salesOrder<T extends SalesOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrderDefaultArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesOrderCommercialGateSummary model
   */ 
  interface SalesOrderCommercialGateSummaryFieldRefs {
    readonly salesOrderId: FieldRef<"SalesOrderCommercialGateSummary", 'String'>
    readonly tenantId: FieldRef<"SalesOrderCommercialGateSummary", 'String'>
    readonly orderEstablished: FieldRef<"SalesOrderCommercialGateSummary", 'Boolean'>
    readonly productionGate: FieldRef<"SalesOrderCommercialGateSummary", 'Boolean'>
    readonly stockingGate: FieldRef<"SalesOrderCommercialGateSummary", 'Boolean'>
    readonly shippingGate: FieldRef<"SalesOrderCommercialGateSummary", 'Boolean'>
    readonly createdAt: FieldRef<"SalesOrderCommercialGateSummary", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesOrderCommercialGateSummary", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesOrderCommercialGateSummary findUnique
   */
  export type SalesOrderCommercialGateSummaryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderCommercialGateSummary to fetch.
     */
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  /**
   * SalesOrderCommercialGateSummary findUniqueOrThrow
   */
  export type SalesOrderCommercialGateSummaryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderCommercialGateSummary to fetch.
     */
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  /**
   * SalesOrderCommercialGateSummary findFirst
   */
  export type SalesOrderCommercialGateSummaryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderCommercialGateSummary to fetch.
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderCommercialGateSummaries to fetch.
     */
    orderBy?: SalesOrderCommercialGateSummaryOrderByWithRelationInput | SalesOrderCommercialGateSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderCommercialGateSummaries.
     */
    cursor?: SalesOrderCommercialGateSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderCommercialGateSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderCommercialGateSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderCommercialGateSummaries.
     */
    distinct?: SalesOrderCommercialGateSummaryScalarFieldEnum | SalesOrderCommercialGateSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderCommercialGateSummary findFirstOrThrow
   */
  export type SalesOrderCommercialGateSummaryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderCommercialGateSummary to fetch.
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderCommercialGateSummaries to fetch.
     */
    orderBy?: SalesOrderCommercialGateSummaryOrderByWithRelationInput | SalesOrderCommercialGateSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderCommercialGateSummaries.
     */
    cursor?: SalesOrderCommercialGateSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderCommercialGateSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderCommercialGateSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderCommercialGateSummaries.
     */
    distinct?: SalesOrderCommercialGateSummaryScalarFieldEnum | SalesOrderCommercialGateSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderCommercialGateSummary findMany
   */
  export type SalesOrderCommercialGateSummaryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderCommercialGateSummaries to fetch.
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderCommercialGateSummaries to fetch.
     */
    orderBy?: SalesOrderCommercialGateSummaryOrderByWithRelationInput | SalesOrderCommercialGateSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesOrderCommercialGateSummaries.
     */
    cursor?: SalesOrderCommercialGateSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderCommercialGateSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderCommercialGateSummaries.
     */
    skip?: number
    distinct?: SalesOrderCommercialGateSummaryScalarFieldEnum | SalesOrderCommercialGateSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderCommercialGateSummary create
   */
  export type SalesOrderCommercialGateSummaryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesOrderCommercialGateSummary.
     */
    data: XOR<SalesOrderCommercialGateSummaryCreateInput, SalesOrderCommercialGateSummaryUncheckedCreateInput>
  }

  /**
   * SalesOrderCommercialGateSummary createMany
   */
  export type SalesOrderCommercialGateSummaryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesOrderCommercialGateSummaries.
     */
    data: SalesOrderCommercialGateSummaryCreateManyInput | SalesOrderCommercialGateSummaryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesOrderCommercialGateSummary createManyAndReturn
   */
  export type SalesOrderCommercialGateSummaryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * The data used to create many SalesOrderCommercialGateSummaries.
     */
    data: SalesOrderCommercialGateSummaryCreateManyInput | SalesOrderCommercialGateSummaryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderCommercialGateSummary update
   */
  export type SalesOrderCommercialGateSummaryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesOrderCommercialGateSummary.
     */
    data: XOR<SalesOrderCommercialGateSummaryUpdateInput, SalesOrderCommercialGateSummaryUncheckedUpdateInput>
    /**
     * Choose, which SalesOrderCommercialGateSummary to update.
     */
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  /**
   * SalesOrderCommercialGateSummary updateMany
   */
  export type SalesOrderCommercialGateSummaryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesOrderCommercialGateSummaries.
     */
    data: XOR<SalesOrderCommercialGateSummaryUpdateManyMutationInput, SalesOrderCommercialGateSummaryUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderCommercialGateSummaries to update
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * Limit how many SalesOrderCommercialGateSummaries to update.
     */
    limit?: number
  }

  /**
   * SalesOrderCommercialGateSummary updateManyAndReturn
   */
  export type SalesOrderCommercialGateSummaryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * The data used to update SalesOrderCommercialGateSummaries.
     */
    data: XOR<SalesOrderCommercialGateSummaryUpdateManyMutationInput, SalesOrderCommercialGateSummaryUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderCommercialGateSummaries to update
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * Limit how many SalesOrderCommercialGateSummaries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderCommercialGateSummary upsert
   */
  export type SalesOrderCommercialGateSummaryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesOrderCommercialGateSummary to update in case it exists.
     */
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
    /**
     * In case the SalesOrderCommercialGateSummary found by the `where` argument doesn't exist, create a new SalesOrderCommercialGateSummary with this data.
     */
    create: XOR<SalesOrderCommercialGateSummaryCreateInput, SalesOrderCommercialGateSummaryUncheckedCreateInput>
    /**
     * In case the SalesOrderCommercialGateSummary was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesOrderCommercialGateSummaryUpdateInput, SalesOrderCommercialGateSummaryUncheckedUpdateInput>
  }

  /**
   * SalesOrderCommercialGateSummary delete
   */
  export type SalesOrderCommercialGateSummaryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
    /**
     * Filter which SalesOrderCommercialGateSummary to delete.
     */
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  /**
   * SalesOrderCommercialGateSummary deleteMany
   */
  export type SalesOrderCommercialGateSummaryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderCommercialGateSummaries to delete
     */
    where?: SalesOrderCommercialGateSummaryWhereInput
    /**
     * Limit how many SalesOrderCommercialGateSummaries to delete.
     */
    limit?: number
  }

  /**
   * SalesOrderCommercialGateSummary without action
   */
  export type SalesOrderCommercialGateSummaryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderCommercialGateSummary
     */
    select?: SalesOrderCommercialGateSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderCommercialGateSummary
     */
    omit?: SalesOrderCommercialGateSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderCommercialGateSummaryInclude<ExtArgs> | null
  }


  /**
   * Model SalesOrderFulfillmentHandoffSummary
   */

  export type AggregateSalesOrderFulfillmentHandoffSummary = {
    _count: SalesOrderFulfillmentHandoffSummaryCountAggregateOutputType | null
    _min: SalesOrderFulfillmentHandoffSummaryMinAggregateOutputType | null
    _max: SalesOrderFulfillmentHandoffSummaryMaxAggregateOutputType | null
  }

  export type SalesOrderFulfillmentHandoffSummaryMinAggregateOutputType = {
    salesOrderId: string | null
    tenantId: string | null
    status: $Enums.SalesFulfillmentHandoffStatus | null
    submittedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderFulfillmentHandoffSummaryMaxAggregateOutputType = {
    salesOrderId: string | null
    tenantId: string | null
    status: $Enums.SalesFulfillmentHandoffStatus | null
    submittedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderFulfillmentHandoffSummaryCountAggregateOutputType = {
    salesOrderId: number
    tenantId: number
    status: number
    submittedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesOrderFulfillmentHandoffSummaryMinAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    status?: true
    submittedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderFulfillmentHandoffSummaryMaxAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    status?: true
    submittedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderFulfillmentHandoffSummaryCountAggregateInputType = {
    salesOrderId?: true
    tenantId?: true
    status?: true
    submittedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesOrderFulfillmentHandoffSummaryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderFulfillmentHandoffSummary to aggregate.
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderFulfillmentHandoffSummaries to fetch.
     */
    orderBy?: SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput | SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderFulfillmentHandoffSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderFulfillmentHandoffSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesOrderFulfillmentHandoffSummaries
    **/
    _count?: true | SalesOrderFulfillmentHandoffSummaryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesOrderFulfillmentHandoffSummaryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesOrderFulfillmentHandoffSummaryMaxAggregateInputType
  }

  export type GetSalesOrderFulfillmentHandoffSummaryAggregateType<T extends SalesOrderFulfillmentHandoffSummaryAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesOrderFulfillmentHandoffSummary]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesOrderFulfillmentHandoffSummary[P]>
      : GetScalarType<T[P], AggregateSalesOrderFulfillmentHandoffSummary[P]>
  }




  export type SalesOrderFulfillmentHandoffSummaryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    orderBy?: SalesOrderFulfillmentHandoffSummaryOrderByWithAggregationInput | SalesOrderFulfillmentHandoffSummaryOrderByWithAggregationInput[]
    by: SalesOrderFulfillmentHandoffSummaryScalarFieldEnum[] | SalesOrderFulfillmentHandoffSummaryScalarFieldEnum
    having?: SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesOrderFulfillmentHandoffSummaryCountAggregateInputType | true
    _min?: SalesOrderFulfillmentHandoffSummaryMinAggregateInputType
    _max?: SalesOrderFulfillmentHandoffSummaryMaxAggregateInputType
  }

  export type SalesOrderFulfillmentHandoffSummaryGroupByOutputType = {
    salesOrderId: string
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SalesOrderFulfillmentHandoffSummaryCountAggregateOutputType | null
    _min: SalesOrderFulfillmentHandoffSummaryMinAggregateOutputType | null
    _max: SalesOrderFulfillmentHandoffSummaryMaxAggregateOutputType | null
  }

  type GetSalesOrderFulfillmentHandoffSummaryGroupByPayload<T extends SalesOrderFulfillmentHandoffSummaryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesOrderFulfillmentHandoffSummaryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesOrderFulfillmentHandoffSummaryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesOrderFulfillmentHandoffSummaryGroupByOutputType[P]>
            : GetScalarType<T[P], SalesOrderFulfillmentHandoffSummaryGroupByOutputType[P]>
        }
      >
    >


  export type SalesOrderFulfillmentHandoffSummarySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    status?: boolean
    submittedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderFulfillmentHandoffSummary"]>

  export type SalesOrderFulfillmentHandoffSummarySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    status?: boolean
    submittedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderFulfillmentHandoffSummary"]>

  export type SalesOrderFulfillmentHandoffSummarySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    salesOrderId?: boolean
    tenantId?: boolean
    status?: boolean
    submittedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderFulfillmentHandoffSummary"]>

  export type SalesOrderFulfillmentHandoffSummarySelectScalar = {
    salesOrderId?: boolean
    tenantId?: boolean
    status?: boolean
    submittedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"salesOrderId" | "tenantId" | "status" | "submittedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["salesOrderFulfillmentHandoffSummary"]>
  export type SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderFulfillmentHandoffSummaryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderFulfillmentHandoffSummaryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }

  export type $SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesOrderFulfillmentHandoffSummary"
    objects: {
      salesOrder: Prisma.$SalesOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      salesOrderId: string
      tenantId: string
      status: $Enums.SalesFulfillmentHandoffStatus
      submittedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesOrderFulfillmentHandoffSummary"]>
    composites: {}
  }

  type SalesOrderFulfillmentHandoffSummaryGetPayload<S extends boolean | null | undefined | SalesOrderFulfillmentHandoffSummaryDefaultArgs> = $Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload, S>

  type SalesOrderFulfillmentHandoffSummaryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesOrderFulfillmentHandoffSummaryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesOrderFulfillmentHandoffSummaryCountAggregateInputType | true
    }

  export interface SalesOrderFulfillmentHandoffSummaryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesOrderFulfillmentHandoffSummary'], meta: { name: 'SalesOrderFulfillmentHandoffSummary' } }
    /**
     * Find zero or one SalesOrderFulfillmentHandoffSummary that matches the filter.
     * @param {SalesOrderFulfillmentHandoffSummaryFindUniqueArgs} args - Arguments to find a SalesOrderFulfillmentHandoffSummary
     * @example
     * // Get one SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesOrderFulfillmentHandoffSummaryFindUniqueArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryFindUniqueArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesOrderFulfillmentHandoffSummary that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesOrderFulfillmentHandoffSummaryFindUniqueOrThrowArgs} args - Arguments to find a SalesOrderFulfillmentHandoffSummary
     * @example
     * // Get one SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesOrderFulfillmentHandoffSummaryFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderFulfillmentHandoffSummary that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryFindFirstArgs} args - Arguments to find a SalesOrderFulfillmentHandoffSummary
     * @example
     * // Get one SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesOrderFulfillmentHandoffSummaryFindFirstArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryFindFirstArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderFulfillmentHandoffSummary that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryFindFirstOrThrowArgs} args - Arguments to find a SalesOrderFulfillmentHandoffSummary
     * @example
     * // Get one SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesOrderFulfillmentHandoffSummaryFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesOrderFulfillmentHandoffSummaries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummaries = await prisma.salesOrderFulfillmentHandoffSummary.findMany()
     * 
     * // Get first 10 SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummaries = await prisma.salesOrderFulfillmentHandoffSummary.findMany({ take: 10 })
     * 
     * // Only select the `salesOrderId`
     * const salesOrderFulfillmentHandoffSummaryWithSalesOrderIdOnly = await prisma.salesOrderFulfillmentHandoffSummary.findMany({ select: { salesOrderId: true } })
     * 
     */
    findMany<T extends SalesOrderFulfillmentHandoffSummaryFindManyArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesOrderFulfillmentHandoffSummary.
     * @param {SalesOrderFulfillmentHandoffSummaryCreateArgs} args - Arguments to create a SalesOrderFulfillmentHandoffSummary.
     * @example
     * // Create one SalesOrderFulfillmentHandoffSummary
     * const SalesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.create({
     *   data: {
     *     // ... data to create a SalesOrderFulfillmentHandoffSummary
     *   }
     * })
     * 
     */
    create<T extends SalesOrderFulfillmentHandoffSummaryCreateArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryCreateArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesOrderFulfillmentHandoffSummaries.
     * @param {SalesOrderFulfillmentHandoffSummaryCreateManyArgs} args - Arguments to create many SalesOrderFulfillmentHandoffSummaries.
     * @example
     * // Create many SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesOrderFulfillmentHandoffSummaryCreateManyArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesOrderFulfillmentHandoffSummaries and returns the data saved in the database.
     * @param {SalesOrderFulfillmentHandoffSummaryCreateManyAndReturnArgs} args - Arguments to create many SalesOrderFulfillmentHandoffSummaries.
     * @example
     * // Create many SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesOrderFulfillmentHandoffSummaries and only return the `salesOrderId`
     * const salesOrderFulfillmentHandoffSummaryWithSalesOrderIdOnly = await prisma.salesOrderFulfillmentHandoffSummary.createManyAndReturn({
     *   select: { salesOrderId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesOrderFulfillmentHandoffSummaryCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesOrderFulfillmentHandoffSummary.
     * @param {SalesOrderFulfillmentHandoffSummaryDeleteArgs} args - Arguments to delete one SalesOrderFulfillmentHandoffSummary.
     * @example
     * // Delete one SalesOrderFulfillmentHandoffSummary
     * const SalesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.delete({
     *   where: {
     *     // ... filter to delete one SalesOrderFulfillmentHandoffSummary
     *   }
     * })
     * 
     */
    delete<T extends SalesOrderFulfillmentHandoffSummaryDeleteArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryDeleteArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesOrderFulfillmentHandoffSummary.
     * @param {SalesOrderFulfillmentHandoffSummaryUpdateArgs} args - Arguments to update one SalesOrderFulfillmentHandoffSummary.
     * @example
     * // Update one SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesOrderFulfillmentHandoffSummaryUpdateArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryUpdateArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesOrderFulfillmentHandoffSummaries.
     * @param {SalesOrderFulfillmentHandoffSummaryDeleteManyArgs} args - Arguments to filter SalesOrderFulfillmentHandoffSummaries to delete.
     * @example
     * // Delete a few SalesOrderFulfillmentHandoffSummaries
     * const { count } = await prisma.salesOrderFulfillmentHandoffSummary.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesOrderFulfillmentHandoffSummaryDeleteManyArgs>(args?: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderFulfillmentHandoffSummaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesOrderFulfillmentHandoffSummaryUpdateManyArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderFulfillmentHandoffSummaries and returns the data updated in the database.
     * @param {SalesOrderFulfillmentHandoffSummaryUpdateManyAndReturnArgs} args - Arguments to update many SalesOrderFulfillmentHandoffSummaries.
     * @example
     * // Update many SalesOrderFulfillmentHandoffSummaries
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesOrderFulfillmentHandoffSummaries and only return the `salesOrderId`
     * const salesOrderFulfillmentHandoffSummaryWithSalesOrderIdOnly = await prisma.salesOrderFulfillmentHandoffSummary.updateManyAndReturn({
     *   select: { salesOrderId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesOrderFulfillmentHandoffSummaryUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesOrderFulfillmentHandoffSummary.
     * @param {SalesOrderFulfillmentHandoffSummaryUpsertArgs} args - Arguments to update or create a SalesOrderFulfillmentHandoffSummary.
     * @example
     * // Update or create a SalesOrderFulfillmentHandoffSummary
     * const salesOrderFulfillmentHandoffSummary = await prisma.salesOrderFulfillmentHandoffSummary.upsert({
     *   create: {
     *     // ... data to create a SalesOrderFulfillmentHandoffSummary
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesOrderFulfillmentHandoffSummary we want to update
     *   }
     * })
     */
    upsert<T extends SalesOrderFulfillmentHandoffSummaryUpsertArgs>(args: SelectSubset<T, SalesOrderFulfillmentHandoffSummaryUpsertArgs<ExtArgs>>): Prisma__SalesOrderFulfillmentHandoffSummaryClient<$Result.GetResult<Prisma.$SalesOrderFulfillmentHandoffSummaryPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesOrderFulfillmentHandoffSummaries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryCountArgs} args - Arguments to filter SalesOrderFulfillmentHandoffSummaries to count.
     * @example
     * // Count the number of SalesOrderFulfillmentHandoffSummaries
     * const count = await prisma.salesOrderFulfillmentHandoffSummary.count({
     *   where: {
     *     // ... the filter for the SalesOrderFulfillmentHandoffSummaries we want to count
     *   }
     * })
    **/
    count<T extends SalesOrderFulfillmentHandoffSummaryCountArgs>(
      args?: Subset<T, SalesOrderFulfillmentHandoffSummaryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesOrderFulfillmentHandoffSummaryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesOrderFulfillmentHandoffSummary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesOrderFulfillmentHandoffSummaryAggregateArgs>(args: Subset<T, SalesOrderFulfillmentHandoffSummaryAggregateArgs>): Prisma.PrismaPromise<GetSalesOrderFulfillmentHandoffSummaryAggregateType<T>>

    /**
     * Group by SalesOrderFulfillmentHandoffSummary.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderFulfillmentHandoffSummaryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesOrderFulfillmentHandoffSummaryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesOrderFulfillmentHandoffSummaryGroupByArgs['orderBy'] }
        : { orderBy?: SalesOrderFulfillmentHandoffSummaryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesOrderFulfillmentHandoffSummaryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesOrderFulfillmentHandoffSummaryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesOrderFulfillmentHandoffSummary model
   */
  readonly fields: SalesOrderFulfillmentHandoffSummaryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesOrderFulfillmentHandoffSummary.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesOrderFulfillmentHandoffSummaryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    salesOrder<T extends SalesOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrderDefaultArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesOrderFulfillmentHandoffSummary model
   */ 
  interface SalesOrderFulfillmentHandoffSummaryFieldRefs {
    readonly salesOrderId: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'String'>
    readonly tenantId: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'String'>
    readonly status: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'SalesFulfillmentHandoffStatus'>
    readonly submittedAt: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'DateTime'>
    readonly createdAt: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesOrderFulfillmentHandoffSummary", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesOrderFulfillmentHandoffSummary findUnique
   */
  export type SalesOrderFulfillmentHandoffSummaryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderFulfillmentHandoffSummary to fetch.
     */
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  /**
   * SalesOrderFulfillmentHandoffSummary findUniqueOrThrow
   */
  export type SalesOrderFulfillmentHandoffSummaryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderFulfillmentHandoffSummary to fetch.
     */
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  /**
   * SalesOrderFulfillmentHandoffSummary findFirst
   */
  export type SalesOrderFulfillmentHandoffSummaryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderFulfillmentHandoffSummary to fetch.
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderFulfillmentHandoffSummaries to fetch.
     */
    orderBy?: SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput | SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderFulfillmentHandoffSummaries.
     */
    cursor?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderFulfillmentHandoffSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderFulfillmentHandoffSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderFulfillmentHandoffSummaries.
     */
    distinct?: SalesOrderFulfillmentHandoffSummaryScalarFieldEnum | SalesOrderFulfillmentHandoffSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderFulfillmentHandoffSummary findFirstOrThrow
   */
  export type SalesOrderFulfillmentHandoffSummaryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderFulfillmentHandoffSummary to fetch.
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderFulfillmentHandoffSummaries to fetch.
     */
    orderBy?: SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput | SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderFulfillmentHandoffSummaries.
     */
    cursor?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderFulfillmentHandoffSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderFulfillmentHandoffSummaries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderFulfillmentHandoffSummaries.
     */
    distinct?: SalesOrderFulfillmentHandoffSummaryScalarFieldEnum | SalesOrderFulfillmentHandoffSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderFulfillmentHandoffSummary findMany
   */
  export type SalesOrderFulfillmentHandoffSummaryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderFulfillmentHandoffSummaries to fetch.
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderFulfillmentHandoffSummaries to fetch.
     */
    orderBy?: SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput | SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesOrderFulfillmentHandoffSummaries.
     */
    cursor?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderFulfillmentHandoffSummaries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderFulfillmentHandoffSummaries.
     */
    skip?: number
    distinct?: SalesOrderFulfillmentHandoffSummaryScalarFieldEnum | SalesOrderFulfillmentHandoffSummaryScalarFieldEnum[]
  }

  /**
   * SalesOrderFulfillmentHandoffSummary create
   */
  export type SalesOrderFulfillmentHandoffSummaryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesOrderFulfillmentHandoffSummary.
     */
    data: XOR<SalesOrderFulfillmentHandoffSummaryCreateInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateInput>
  }

  /**
   * SalesOrderFulfillmentHandoffSummary createMany
   */
  export type SalesOrderFulfillmentHandoffSummaryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesOrderFulfillmentHandoffSummaries.
     */
    data: SalesOrderFulfillmentHandoffSummaryCreateManyInput | SalesOrderFulfillmentHandoffSummaryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesOrderFulfillmentHandoffSummary createManyAndReturn
   */
  export type SalesOrderFulfillmentHandoffSummaryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * The data used to create many SalesOrderFulfillmentHandoffSummaries.
     */
    data: SalesOrderFulfillmentHandoffSummaryCreateManyInput | SalesOrderFulfillmentHandoffSummaryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderFulfillmentHandoffSummary update
   */
  export type SalesOrderFulfillmentHandoffSummaryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesOrderFulfillmentHandoffSummary.
     */
    data: XOR<SalesOrderFulfillmentHandoffSummaryUpdateInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateInput>
    /**
     * Choose, which SalesOrderFulfillmentHandoffSummary to update.
     */
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  /**
   * SalesOrderFulfillmentHandoffSummary updateMany
   */
  export type SalesOrderFulfillmentHandoffSummaryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesOrderFulfillmentHandoffSummaries.
     */
    data: XOR<SalesOrderFulfillmentHandoffSummaryUpdateManyMutationInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderFulfillmentHandoffSummaries to update
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * Limit how many SalesOrderFulfillmentHandoffSummaries to update.
     */
    limit?: number
  }

  /**
   * SalesOrderFulfillmentHandoffSummary updateManyAndReturn
   */
  export type SalesOrderFulfillmentHandoffSummaryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * The data used to update SalesOrderFulfillmentHandoffSummaries.
     */
    data: XOR<SalesOrderFulfillmentHandoffSummaryUpdateManyMutationInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderFulfillmentHandoffSummaries to update
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * Limit how many SalesOrderFulfillmentHandoffSummaries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderFulfillmentHandoffSummary upsert
   */
  export type SalesOrderFulfillmentHandoffSummaryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesOrderFulfillmentHandoffSummary to update in case it exists.
     */
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    /**
     * In case the SalesOrderFulfillmentHandoffSummary found by the `where` argument doesn't exist, create a new SalesOrderFulfillmentHandoffSummary with this data.
     */
    create: XOR<SalesOrderFulfillmentHandoffSummaryCreateInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateInput>
    /**
     * In case the SalesOrderFulfillmentHandoffSummary was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesOrderFulfillmentHandoffSummaryUpdateInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateInput>
  }

  /**
   * SalesOrderFulfillmentHandoffSummary delete
   */
  export type SalesOrderFulfillmentHandoffSummaryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
    /**
     * Filter which SalesOrderFulfillmentHandoffSummary to delete.
     */
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  /**
   * SalesOrderFulfillmentHandoffSummary deleteMany
   */
  export type SalesOrderFulfillmentHandoffSummaryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderFulfillmentHandoffSummaries to delete
     */
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    /**
     * Limit how many SalesOrderFulfillmentHandoffSummaries to delete.
     */
    limit?: number
  }

  /**
   * SalesOrderFulfillmentHandoffSummary without action
   */
  export type SalesOrderFulfillmentHandoffSummaryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderFulfillmentHandoffSummary
     */
    select?: SalesOrderFulfillmentHandoffSummarySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderFulfillmentHandoffSummary
     */
    omit?: SalesOrderFulfillmentHandoffSummaryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderFulfillmentHandoffSummaryInclude<ExtArgs> | null
  }


  /**
   * Model SalesOrderLine
   */

  export type AggregateSalesOrderLine = {
    _count: SalesOrderLineCountAggregateOutputType | null
    _avg: SalesOrderLineAvgAggregateOutputType | null
    _sum: SalesOrderLineSumAggregateOutputType | null
    _min: SalesOrderLineMinAggregateOutputType | null
    _max: SalesOrderLineMaxAggregateOutputType | null
  }

  export type SalesOrderLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesOrderLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesOrderLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    salesOrderId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    salesOrderId: string | null
    lineNo: number | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesOrderLineCountAggregateOutputType = {
    id: number
    tenantId: number
    salesOrderId: number
    lineNo: number
    itemId: number
    itemSnapshot: number
    salesConfigSnapshot: number
    packagingRequirementSnapshot: number
    priceQuantityDeliverySnapshot: number
    customerItemSnapshot: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesOrderLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type SalesOrderLineSumAggregateInputType = {
    lineNo?: true
  }

  export type SalesOrderLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    salesOrderId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    salesOrderId?: true
    lineNo?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesOrderLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    salesOrderId?: true
    lineNo?: true
    itemId?: true
    itemSnapshot?: true
    salesConfigSnapshot?: true
    packagingRequirementSnapshot?: true
    priceQuantityDeliverySnapshot?: true
    customerItemSnapshot?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesOrderLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderLine to aggregate.
     */
    where?: SalesOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderLines to fetch.
     */
    orderBy?: SalesOrderLineOrderByWithRelationInput | SalesOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesOrderLines
    **/
    _count?: true | SalesOrderLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesOrderLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesOrderLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesOrderLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesOrderLineMaxAggregateInputType
  }

  export type GetSalesOrderLineAggregateType<T extends SalesOrderLineAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesOrderLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesOrderLine[P]>
      : GetScalarType<T[P], AggregateSalesOrderLine[P]>
  }




  export type SalesOrderLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesOrderLineWhereInput
    orderBy?: SalesOrderLineOrderByWithAggregationInput | SalesOrderLineOrderByWithAggregationInput[]
    by: SalesOrderLineScalarFieldEnum[] | SalesOrderLineScalarFieldEnum
    having?: SalesOrderLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesOrderLineCountAggregateInputType | true
    _avg?: SalesOrderLineAvgAggregateInputType
    _sum?: SalesOrderLineSumAggregateInputType
    _min?: SalesOrderLineMinAggregateInputType
    _max?: SalesOrderLineMaxAggregateInputType
  }

  export type SalesOrderLineGroupByOutputType = {
    id: string
    tenantId: string
    salesOrderId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonValue
    salesConfigSnapshot: JsonValue
    packagingRequirementSnapshot: JsonValue
    priceQuantityDeliverySnapshot: JsonValue
    customerItemSnapshot: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: SalesOrderLineCountAggregateOutputType | null
    _avg: SalesOrderLineAvgAggregateOutputType | null
    _sum: SalesOrderLineSumAggregateOutputType | null
    _min: SalesOrderLineMinAggregateOutputType | null
    _max: SalesOrderLineMaxAggregateOutputType | null
  }

  type GetSalesOrderLineGroupByPayload<T extends SalesOrderLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesOrderLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesOrderLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesOrderLineGroupByOutputType[P]>
            : GetScalarType<T[P], SalesOrderLineGroupByOutputType[P]>
        }
      >
    >


  export type SalesOrderLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    salesOrderId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderLine"]>

  export type SalesOrderLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    salesOrderId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderLine"]>

  export type SalesOrderLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    salesOrderId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesOrderLine"]>

  export type SalesOrderLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    salesOrderId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemSnapshot?: boolean
    salesConfigSnapshot?: boolean
    packagingRequirementSnapshot?: boolean
    priceQuantityDeliverySnapshot?: boolean
    customerItemSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesOrderLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "salesOrderId" | "lineNo" | "itemId" | "itemSnapshot" | "salesConfigSnapshot" | "packagingRequirementSnapshot" | "priceQuantityDeliverySnapshot" | "customerItemSnapshot" | "createdAt" | "updatedAt", ExtArgs["result"]["salesOrderLine"]>
  export type SalesOrderLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }
  export type SalesOrderLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    salesOrder?: boolean | SalesOrderDefaultArgs<ExtArgs>
  }

  export type $SalesOrderLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesOrderLine"
    objects: {
      salesOrder: Prisma.$SalesOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      salesOrderId: string
      lineNo: number
      itemId: string
      itemSnapshot: Prisma.JsonValue
      salesConfigSnapshot: Prisma.JsonValue
      packagingRequirementSnapshot: Prisma.JsonValue
      priceQuantityDeliverySnapshot: Prisma.JsonValue
      customerItemSnapshot: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesOrderLine"]>
    composites: {}
  }

  type SalesOrderLineGetPayload<S extends boolean | null | undefined | SalesOrderLineDefaultArgs> = $Result.GetResult<Prisma.$SalesOrderLinePayload, S>

  type SalesOrderLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesOrderLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesOrderLineCountAggregateInputType | true
    }

  export interface SalesOrderLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesOrderLine'], meta: { name: 'SalesOrderLine' } }
    /**
     * Find zero or one SalesOrderLine that matches the filter.
     * @param {SalesOrderLineFindUniqueArgs} args - Arguments to find a SalesOrderLine
     * @example
     * // Get one SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesOrderLineFindUniqueArgs>(args: SelectSubset<T, SalesOrderLineFindUniqueArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesOrderLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesOrderLineFindUniqueOrThrowArgs} args - Arguments to find a SalesOrderLine
     * @example
     * // Get one SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesOrderLineFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesOrderLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineFindFirstArgs} args - Arguments to find a SalesOrderLine
     * @example
     * // Get one SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesOrderLineFindFirstArgs>(args?: SelectSubset<T, SalesOrderLineFindFirstArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesOrderLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineFindFirstOrThrowArgs} args - Arguments to find a SalesOrderLine
     * @example
     * // Get one SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesOrderLineFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesOrderLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesOrderLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesOrderLines
     * const salesOrderLines = await prisma.salesOrderLine.findMany()
     * 
     * // Get first 10 SalesOrderLines
     * const salesOrderLines = await prisma.salesOrderLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesOrderLineWithIdOnly = await prisma.salesOrderLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesOrderLineFindManyArgs>(args?: SelectSubset<T, SalesOrderLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesOrderLine.
     * @param {SalesOrderLineCreateArgs} args - Arguments to create a SalesOrderLine.
     * @example
     * // Create one SalesOrderLine
     * const SalesOrderLine = await prisma.salesOrderLine.create({
     *   data: {
     *     // ... data to create a SalesOrderLine
     *   }
     * })
     * 
     */
    create<T extends SalesOrderLineCreateArgs>(args: SelectSubset<T, SalesOrderLineCreateArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesOrderLines.
     * @param {SalesOrderLineCreateManyArgs} args - Arguments to create many SalesOrderLines.
     * @example
     * // Create many SalesOrderLines
     * const salesOrderLine = await prisma.salesOrderLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesOrderLineCreateManyArgs>(args?: SelectSubset<T, SalesOrderLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesOrderLines and returns the data saved in the database.
     * @param {SalesOrderLineCreateManyAndReturnArgs} args - Arguments to create many SalesOrderLines.
     * @example
     * // Create many SalesOrderLines
     * const salesOrderLine = await prisma.salesOrderLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesOrderLines and only return the `id`
     * const salesOrderLineWithIdOnly = await prisma.salesOrderLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesOrderLineCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesOrderLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesOrderLine.
     * @param {SalesOrderLineDeleteArgs} args - Arguments to delete one SalesOrderLine.
     * @example
     * // Delete one SalesOrderLine
     * const SalesOrderLine = await prisma.salesOrderLine.delete({
     *   where: {
     *     // ... filter to delete one SalesOrderLine
     *   }
     * })
     * 
     */
    delete<T extends SalesOrderLineDeleteArgs>(args: SelectSubset<T, SalesOrderLineDeleteArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesOrderLine.
     * @param {SalesOrderLineUpdateArgs} args - Arguments to update one SalesOrderLine.
     * @example
     * // Update one SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesOrderLineUpdateArgs>(args: SelectSubset<T, SalesOrderLineUpdateArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesOrderLines.
     * @param {SalesOrderLineDeleteManyArgs} args - Arguments to filter SalesOrderLines to delete.
     * @example
     * // Delete a few SalesOrderLines
     * const { count } = await prisma.salesOrderLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesOrderLineDeleteManyArgs>(args?: SelectSubset<T, SalesOrderLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesOrderLines
     * const salesOrderLine = await prisma.salesOrderLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesOrderLineUpdateManyArgs>(args: SelectSubset<T, SalesOrderLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesOrderLines and returns the data updated in the database.
     * @param {SalesOrderLineUpdateManyAndReturnArgs} args - Arguments to update many SalesOrderLines.
     * @example
     * // Update many SalesOrderLines
     * const salesOrderLine = await prisma.salesOrderLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesOrderLines and only return the `id`
     * const salesOrderLineWithIdOnly = await prisma.salesOrderLine.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesOrderLineUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesOrderLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesOrderLine.
     * @param {SalesOrderLineUpsertArgs} args - Arguments to update or create a SalesOrderLine.
     * @example
     * // Update or create a SalesOrderLine
     * const salesOrderLine = await prisma.salesOrderLine.upsert({
     *   create: {
     *     // ... data to create a SalesOrderLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesOrderLine we want to update
     *   }
     * })
     */
    upsert<T extends SalesOrderLineUpsertArgs>(args: SelectSubset<T, SalesOrderLineUpsertArgs<ExtArgs>>): Prisma__SalesOrderLineClient<$Result.GetResult<Prisma.$SalesOrderLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesOrderLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineCountArgs} args - Arguments to filter SalesOrderLines to count.
     * @example
     * // Count the number of SalesOrderLines
     * const count = await prisma.salesOrderLine.count({
     *   where: {
     *     // ... the filter for the SalesOrderLines we want to count
     *   }
     * })
    **/
    count<T extends SalesOrderLineCountArgs>(
      args?: Subset<T, SalesOrderLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesOrderLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesOrderLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesOrderLineAggregateArgs>(args: Subset<T, SalesOrderLineAggregateArgs>): Prisma.PrismaPromise<GetSalesOrderLineAggregateType<T>>

    /**
     * Group by SalesOrderLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesOrderLineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesOrderLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesOrderLineGroupByArgs['orderBy'] }
        : { orderBy?: SalesOrderLineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesOrderLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesOrderLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesOrderLine model
   */
  readonly fields: SalesOrderLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesOrderLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesOrderLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    salesOrder<T extends SalesOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesOrderDefaultArgs<ExtArgs>>): Prisma__SalesOrderClient<$Result.GetResult<Prisma.$SalesOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesOrderLine model
   */ 
  interface SalesOrderLineFieldRefs {
    readonly id: FieldRef<"SalesOrderLine", 'String'>
    readonly tenantId: FieldRef<"SalesOrderLine", 'String'>
    readonly salesOrderId: FieldRef<"SalesOrderLine", 'String'>
    readonly lineNo: FieldRef<"SalesOrderLine", 'Int'>
    readonly itemId: FieldRef<"SalesOrderLine", 'String'>
    readonly itemSnapshot: FieldRef<"SalesOrderLine", 'Json'>
    readonly salesConfigSnapshot: FieldRef<"SalesOrderLine", 'Json'>
    readonly packagingRequirementSnapshot: FieldRef<"SalesOrderLine", 'Json'>
    readonly priceQuantityDeliverySnapshot: FieldRef<"SalesOrderLine", 'Json'>
    readonly customerItemSnapshot: FieldRef<"SalesOrderLine", 'Json'>
    readonly createdAt: FieldRef<"SalesOrderLine", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesOrderLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesOrderLine findUnique
   */
  export type SalesOrderLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderLine to fetch.
     */
    where: SalesOrderLineWhereUniqueInput
  }

  /**
   * SalesOrderLine findUniqueOrThrow
   */
  export type SalesOrderLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderLine to fetch.
     */
    where: SalesOrderLineWhereUniqueInput
  }

  /**
   * SalesOrderLine findFirst
   */
  export type SalesOrderLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderLine to fetch.
     */
    where?: SalesOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderLines to fetch.
     */
    orderBy?: SalesOrderLineOrderByWithRelationInput | SalesOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderLines.
     */
    cursor?: SalesOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderLines.
     */
    distinct?: SalesOrderLineScalarFieldEnum | SalesOrderLineScalarFieldEnum[]
  }

  /**
   * SalesOrderLine findFirstOrThrow
   */
  export type SalesOrderLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderLine to fetch.
     */
    where?: SalesOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderLines to fetch.
     */
    orderBy?: SalesOrderLineOrderByWithRelationInput | SalesOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesOrderLines.
     */
    cursor?: SalesOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesOrderLines.
     */
    distinct?: SalesOrderLineScalarFieldEnum | SalesOrderLineScalarFieldEnum[]
  }

  /**
   * SalesOrderLine findMany
   */
  export type SalesOrderLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesOrderLines to fetch.
     */
    where?: SalesOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesOrderLines to fetch.
     */
    orderBy?: SalesOrderLineOrderByWithRelationInput | SalesOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesOrderLines.
     */
    cursor?: SalesOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesOrderLines.
     */
    skip?: number
    distinct?: SalesOrderLineScalarFieldEnum | SalesOrderLineScalarFieldEnum[]
  }

  /**
   * SalesOrderLine create
   */
  export type SalesOrderLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesOrderLine.
     */
    data: XOR<SalesOrderLineCreateInput, SalesOrderLineUncheckedCreateInput>
  }

  /**
   * SalesOrderLine createMany
   */
  export type SalesOrderLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesOrderLines.
     */
    data: SalesOrderLineCreateManyInput | SalesOrderLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesOrderLine createManyAndReturn
   */
  export type SalesOrderLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * The data used to create many SalesOrderLines.
     */
    data: SalesOrderLineCreateManyInput | SalesOrderLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderLine update
   */
  export type SalesOrderLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesOrderLine.
     */
    data: XOR<SalesOrderLineUpdateInput, SalesOrderLineUncheckedUpdateInput>
    /**
     * Choose, which SalesOrderLine to update.
     */
    where: SalesOrderLineWhereUniqueInput
  }

  /**
   * SalesOrderLine updateMany
   */
  export type SalesOrderLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesOrderLines.
     */
    data: XOR<SalesOrderLineUpdateManyMutationInput, SalesOrderLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderLines to update
     */
    where?: SalesOrderLineWhereInput
    /**
     * Limit how many SalesOrderLines to update.
     */
    limit?: number
  }

  /**
   * SalesOrderLine updateManyAndReturn
   */
  export type SalesOrderLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * The data used to update SalesOrderLines.
     */
    data: XOR<SalesOrderLineUpdateManyMutationInput, SalesOrderLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesOrderLines to update
     */
    where?: SalesOrderLineWhereInput
    /**
     * Limit how many SalesOrderLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesOrderLine upsert
   */
  export type SalesOrderLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesOrderLine to update in case it exists.
     */
    where: SalesOrderLineWhereUniqueInput
    /**
     * In case the SalesOrderLine found by the `where` argument doesn't exist, create a new SalesOrderLine with this data.
     */
    create: XOR<SalesOrderLineCreateInput, SalesOrderLineUncheckedCreateInput>
    /**
     * In case the SalesOrderLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesOrderLineUpdateInput, SalesOrderLineUncheckedUpdateInput>
  }

  /**
   * SalesOrderLine delete
   */
  export type SalesOrderLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
    /**
     * Filter which SalesOrderLine to delete.
     */
    where: SalesOrderLineWhereUniqueInput
  }

  /**
   * SalesOrderLine deleteMany
   */
  export type SalesOrderLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesOrderLines to delete
     */
    where?: SalesOrderLineWhereInput
    /**
     * Limit how many SalesOrderLines to delete.
     */
    limit?: number
  }

  /**
   * SalesOrderLine without action
   */
  export type SalesOrderLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesOrderLine
     */
    select?: SalesOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesOrderLine
     */
    omit?: SalesOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesOrderLineInclude<ExtArgs> | null
  }


  /**
   * Model SalesPriceList
   */

  export type AggregateSalesPriceList = {
    _count: SalesPriceListCountAggregateOutputType | null
    _min: SalesPriceListMinAggregateOutputType | null
    _max: SalesPriceListMaxAggregateOutputType | null
  }

  export type SalesPriceListMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    priceListName: string | null
    priceListType: $Enums.PriceListType | null
    status: $Enums.PriceListStatus | null
    currencyCode: string | null
    effectiveFrom: Date | null
    effectiveTo: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesPriceListMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    priceListName: string | null
    priceListType: $Enums.PriceListType | null
    status: $Enums.PriceListStatus | null
    currencyCode: string | null
    effectiveFrom: Date | null
    effectiveTo: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesPriceListCountAggregateOutputType = {
    id: number
    tenantId: number
    priceListName: number
    priceListType: number
    status: number
    currencyCode: number
    effectiveFrom: number
    effectiveTo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesPriceListMinAggregateInputType = {
    id?: true
    tenantId?: true
    priceListName?: true
    priceListType?: true
    status?: true
    currencyCode?: true
    effectiveFrom?: true
    effectiveTo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesPriceListMaxAggregateInputType = {
    id?: true
    tenantId?: true
    priceListName?: true
    priceListType?: true
    status?: true
    currencyCode?: true
    effectiveFrom?: true
    effectiveTo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesPriceListCountAggregateInputType = {
    id?: true
    tenantId?: true
    priceListName?: true
    priceListType?: true
    status?: true
    currencyCode?: true
    effectiveFrom?: true
    effectiveTo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesPriceListAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesPriceList to aggregate.
     */
    where?: SalesPriceListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceLists to fetch.
     */
    orderBy?: SalesPriceListOrderByWithRelationInput | SalesPriceListOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesPriceListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceLists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceLists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesPriceLists
    **/
    _count?: true | SalesPriceListCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesPriceListMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesPriceListMaxAggregateInputType
  }

  export type GetSalesPriceListAggregateType<T extends SalesPriceListAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesPriceList]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesPriceList[P]>
      : GetScalarType<T[P], AggregateSalesPriceList[P]>
  }




  export type SalesPriceListGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesPriceListWhereInput
    orderBy?: SalesPriceListOrderByWithAggregationInput | SalesPriceListOrderByWithAggregationInput[]
    by: SalesPriceListScalarFieldEnum[] | SalesPriceListScalarFieldEnum
    having?: SalesPriceListScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesPriceListCountAggregateInputType | true
    _min?: SalesPriceListMinAggregateInputType
    _max?: SalesPriceListMaxAggregateInputType
  }

  export type SalesPriceListGroupByOutputType = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date
    effectiveTo: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SalesPriceListCountAggregateOutputType | null
    _min: SalesPriceListMinAggregateOutputType | null
    _max: SalesPriceListMaxAggregateOutputType | null
  }

  type GetSalesPriceListGroupByPayload<T extends SalesPriceListGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesPriceListGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesPriceListGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesPriceListGroupByOutputType[P]>
            : GetScalarType<T[P], SalesPriceListGroupByOutputType[P]>
        }
      >
    >


  export type SalesPriceListSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListName?: boolean
    priceListType?: boolean
    status?: boolean
    currencyCode?: boolean
    effectiveFrom?: boolean
    effectiveTo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lines?: boolean | SalesPriceList$linesArgs<ExtArgs>
    _count?: boolean | SalesPriceListCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesPriceList"]>

  export type SalesPriceListSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListName?: boolean
    priceListType?: boolean
    status?: boolean
    currencyCode?: boolean
    effectiveFrom?: boolean
    effectiveTo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesPriceList"]>

  export type SalesPriceListSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListName?: boolean
    priceListType?: boolean
    status?: boolean
    currencyCode?: boolean
    effectiveFrom?: boolean
    effectiveTo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesPriceList"]>

  export type SalesPriceListSelectScalar = {
    id?: boolean
    tenantId?: boolean
    priceListName?: boolean
    priceListType?: boolean
    status?: boolean
    currencyCode?: boolean
    effectiveFrom?: boolean
    effectiveTo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesPriceListOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "priceListName" | "priceListType" | "status" | "currencyCode" | "effectiveFrom" | "effectiveTo" | "createdAt" | "updatedAt", ExtArgs["result"]["salesPriceList"]>
  export type SalesPriceListInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesPriceList$linesArgs<ExtArgs>
    _count?: boolean | SalesPriceListCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SalesPriceListIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SalesPriceListIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalesPriceListPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesPriceList"
    objects: {
      lines: Prisma.$SalesPriceListLinePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      priceListName: string
      priceListType: $Enums.PriceListType
      status: $Enums.PriceListStatus
      currencyCode: string
      effectiveFrom: Date
      effectiveTo: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesPriceList"]>
    composites: {}
  }

  type SalesPriceListGetPayload<S extends boolean | null | undefined | SalesPriceListDefaultArgs> = $Result.GetResult<Prisma.$SalesPriceListPayload, S>

  type SalesPriceListCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesPriceListFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesPriceListCountAggregateInputType | true
    }

  export interface SalesPriceListDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesPriceList'], meta: { name: 'SalesPriceList' } }
    /**
     * Find zero or one SalesPriceList that matches the filter.
     * @param {SalesPriceListFindUniqueArgs} args - Arguments to find a SalesPriceList
     * @example
     * // Get one SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesPriceListFindUniqueArgs>(args: SelectSubset<T, SalesPriceListFindUniqueArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesPriceList that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesPriceListFindUniqueOrThrowArgs} args - Arguments to find a SalesPriceList
     * @example
     * // Get one SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesPriceListFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesPriceListFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesPriceList that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListFindFirstArgs} args - Arguments to find a SalesPriceList
     * @example
     * // Get one SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesPriceListFindFirstArgs>(args?: SelectSubset<T, SalesPriceListFindFirstArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesPriceList that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListFindFirstOrThrowArgs} args - Arguments to find a SalesPriceList
     * @example
     * // Get one SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesPriceListFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesPriceListFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesPriceLists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesPriceLists
     * const salesPriceLists = await prisma.salesPriceList.findMany()
     * 
     * // Get first 10 SalesPriceLists
     * const salesPriceLists = await prisma.salesPriceList.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesPriceListWithIdOnly = await prisma.salesPriceList.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesPriceListFindManyArgs>(args?: SelectSubset<T, SalesPriceListFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesPriceList.
     * @param {SalesPriceListCreateArgs} args - Arguments to create a SalesPriceList.
     * @example
     * // Create one SalesPriceList
     * const SalesPriceList = await prisma.salesPriceList.create({
     *   data: {
     *     // ... data to create a SalesPriceList
     *   }
     * })
     * 
     */
    create<T extends SalesPriceListCreateArgs>(args: SelectSubset<T, SalesPriceListCreateArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesPriceLists.
     * @param {SalesPriceListCreateManyArgs} args - Arguments to create many SalesPriceLists.
     * @example
     * // Create many SalesPriceLists
     * const salesPriceList = await prisma.salesPriceList.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesPriceListCreateManyArgs>(args?: SelectSubset<T, SalesPriceListCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesPriceLists and returns the data saved in the database.
     * @param {SalesPriceListCreateManyAndReturnArgs} args - Arguments to create many SalesPriceLists.
     * @example
     * // Create many SalesPriceLists
     * const salesPriceList = await prisma.salesPriceList.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesPriceLists and only return the `id`
     * const salesPriceListWithIdOnly = await prisma.salesPriceList.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesPriceListCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesPriceListCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesPriceList.
     * @param {SalesPriceListDeleteArgs} args - Arguments to delete one SalesPriceList.
     * @example
     * // Delete one SalesPriceList
     * const SalesPriceList = await prisma.salesPriceList.delete({
     *   where: {
     *     // ... filter to delete one SalesPriceList
     *   }
     * })
     * 
     */
    delete<T extends SalesPriceListDeleteArgs>(args: SelectSubset<T, SalesPriceListDeleteArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesPriceList.
     * @param {SalesPriceListUpdateArgs} args - Arguments to update one SalesPriceList.
     * @example
     * // Update one SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesPriceListUpdateArgs>(args: SelectSubset<T, SalesPriceListUpdateArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesPriceLists.
     * @param {SalesPriceListDeleteManyArgs} args - Arguments to filter SalesPriceLists to delete.
     * @example
     * // Delete a few SalesPriceLists
     * const { count } = await prisma.salesPriceList.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesPriceListDeleteManyArgs>(args?: SelectSubset<T, SalesPriceListDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesPriceLists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesPriceLists
     * const salesPriceList = await prisma.salesPriceList.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesPriceListUpdateManyArgs>(args: SelectSubset<T, SalesPriceListUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesPriceLists and returns the data updated in the database.
     * @param {SalesPriceListUpdateManyAndReturnArgs} args - Arguments to update many SalesPriceLists.
     * @example
     * // Update many SalesPriceLists
     * const salesPriceList = await prisma.salesPriceList.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesPriceLists and only return the `id`
     * const salesPriceListWithIdOnly = await prisma.salesPriceList.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesPriceListUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesPriceListUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesPriceList.
     * @param {SalesPriceListUpsertArgs} args - Arguments to update or create a SalesPriceList.
     * @example
     * // Update or create a SalesPriceList
     * const salesPriceList = await prisma.salesPriceList.upsert({
     *   create: {
     *     // ... data to create a SalesPriceList
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesPriceList we want to update
     *   }
     * })
     */
    upsert<T extends SalesPriceListUpsertArgs>(args: SelectSubset<T, SalesPriceListUpsertArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesPriceLists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListCountArgs} args - Arguments to filter SalesPriceLists to count.
     * @example
     * // Count the number of SalesPriceLists
     * const count = await prisma.salesPriceList.count({
     *   where: {
     *     // ... the filter for the SalesPriceLists we want to count
     *   }
     * })
    **/
    count<T extends SalesPriceListCountArgs>(
      args?: Subset<T, SalesPriceListCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesPriceListCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesPriceList.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesPriceListAggregateArgs>(args: Subset<T, SalesPriceListAggregateArgs>): Prisma.PrismaPromise<GetSalesPriceListAggregateType<T>>

    /**
     * Group by SalesPriceList.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesPriceListGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesPriceListGroupByArgs['orderBy'] }
        : { orderBy?: SalesPriceListGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesPriceListGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesPriceListGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesPriceList model
   */
  readonly fields: SalesPriceListFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesPriceList.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesPriceListClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends SalesPriceList$linesArgs<ExtArgs> = {}>(args?: Subset<T, SalesPriceList$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesPriceList model
   */ 
  interface SalesPriceListFieldRefs {
    readonly id: FieldRef<"SalesPriceList", 'String'>
    readonly tenantId: FieldRef<"SalesPriceList", 'String'>
    readonly priceListName: FieldRef<"SalesPriceList", 'String'>
    readonly priceListType: FieldRef<"SalesPriceList", 'PriceListType'>
    readonly status: FieldRef<"SalesPriceList", 'PriceListStatus'>
    readonly currencyCode: FieldRef<"SalesPriceList", 'String'>
    readonly effectiveFrom: FieldRef<"SalesPriceList", 'DateTime'>
    readonly effectiveTo: FieldRef<"SalesPriceList", 'DateTime'>
    readonly createdAt: FieldRef<"SalesPriceList", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesPriceList", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesPriceList findUnique
   */
  export type SalesPriceListFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceList to fetch.
     */
    where: SalesPriceListWhereUniqueInput
  }

  /**
   * SalesPriceList findUniqueOrThrow
   */
  export type SalesPriceListFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceList to fetch.
     */
    where: SalesPriceListWhereUniqueInput
  }

  /**
   * SalesPriceList findFirst
   */
  export type SalesPriceListFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceList to fetch.
     */
    where?: SalesPriceListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceLists to fetch.
     */
    orderBy?: SalesPriceListOrderByWithRelationInput | SalesPriceListOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesPriceLists.
     */
    cursor?: SalesPriceListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceLists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceLists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesPriceLists.
     */
    distinct?: SalesPriceListScalarFieldEnum | SalesPriceListScalarFieldEnum[]
  }

  /**
   * SalesPriceList findFirstOrThrow
   */
  export type SalesPriceListFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceList to fetch.
     */
    where?: SalesPriceListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceLists to fetch.
     */
    orderBy?: SalesPriceListOrderByWithRelationInput | SalesPriceListOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesPriceLists.
     */
    cursor?: SalesPriceListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceLists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceLists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesPriceLists.
     */
    distinct?: SalesPriceListScalarFieldEnum | SalesPriceListScalarFieldEnum[]
  }

  /**
   * SalesPriceList findMany
   */
  export type SalesPriceListFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceLists to fetch.
     */
    where?: SalesPriceListWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceLists to fetch.
     */
    orderBy?: SalesPriceListOrderByWithRelationInput | SalesPriceListOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesPriceLists.
     */
    cursor?: SalesPriceListWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceLists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceLists.
     */
    skip?: number
    distinct?: SalesPriceListScalarFieldEnum | SalesPriceListScalarFieldEnum[]
  }

  /**
   * SalesPriceList create
   */
  export type SalesPriceListCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesPriceList.
     */
    data: XOR<SalesPriceListCreateInput, SalesPriceListUncheckedCreateInput>
  }

  /**
   * SalesPriceList createMany
   */
  export type SalesPriceListCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesPriceLists.
     */
    data: SalesPriceListCreateManyInput | SalesPriceListCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesPriceList createManyAndReturn
   */
  export type SalesPriceListCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * The data used to create many SalesPriceLists.
     */
    data: SalesPriceListCreateManyInput | SalesPriceListCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesPriceList update
   */
  export type SalesPriceListUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesPriceList.
     */
    data: XOR<SalesPriceListUpdateInput, SalesPriceListUncheckedUpdateInput>
    /**
     * Choose, which SalesPriceList to update.
     */
    where: SalesPriceListWhereUniqueInput
  }

  /**
   * SalesPriceList updateMany
   */
  export type SalesPriceListUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesPriceLists.
     */
    data: XOR<SalesPriceListUpdateManyMutationInput, SalesPriceListUncheckedUpdateManyInput>
    /**
     * Filter which SalesPriceLists to update
     */
    where?: SalesPriceListWhereInput
    /**
     * Limit how many SalesPriceLists to update.
     */
    limit?: number
  }

  /**
   * SalesPriceList updateManyAndReturn
   */
  export type SalesPriceListUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * The data used to update SalesPriceLists.
     */
    data: XOR<SalesPriceListUpdateManyMutationInput, SalesPriceListUncheckedUpdateManyInput>
    /**
     * Filter which SalesPriceLists to update
     */
    where?: SalesPriceListWhereInput
    /**
     * Limit how many SalesPriceLists to update.
     */
    limit?: number
  }

  /**
   * SalesPriceList upsert
   */
  export type SalesPriceListUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesPriceList to update in case it exists.
     */
    where: SalesPriceListWhereUniqueInput
    /**
     * In case the SalesPriceList found by the `where` argument doesn't exist, create a new SalesPriceList with this data.
     */
    create: XOR<SalesPriceListCreateInput, SalesPriceListUncheckedCreateInput>
    /**
     * In case the SalesPriceList was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesPriceListUpdateInput, SalesPriceListUncheckedUpdateInput>
  }

  /**
   * SalesPriceList delete
   */
  export type SalesPriceListDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
    /**
     * Filter which SalesPriceList to delete.
     */
    where: SalesPriceListWhereUniqueInput
  }

  /**
   * SalesPriceList deleteMany
   */
  export type SalesPriceListDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesPriceLists to delete
     */
    where?: SalesPriceListWhereInput
    /**
     * Limit how many SalesPriceLists to delete.
     */
    limit?: number
  }

  /**
   * SalesPriceList.lines
   */
  export type SalesPriceList$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    where?: SalesPriceListLineWhereInput
    orderBy?: SalesPriceListLineOrderByWithRelationInput | SalesPriceListLineOrderByWithRelationInput[]
    cursor?: SalesPriceListLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SalesPriceListLineScalarFieldEnum | SalesPriceListLineScalarFieldEnum[]
  }

  /**
   * SalesPriceList without action
   */
  export type SalesPriceListDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceList
     */
    select?: SalesPriceListSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceList
     */
    omit?: SalesPriceListOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListInclude<ExtArgs> | null
  }


  /**
   * Model SalesPriceListLine
   */

  export type AggregateSalesPriceListLine = {
    _count: SalesPriceListLineCountAggregateOutputType | null
    _avg: SalesPriceListLineAvgAggregateOutputType | null
    _sum: SalesPriceListLineSumAggregateOutputType | null
    _min: SalesPriceListLineMinAggregateOutputType | null
    _max: SalesPriceListLineMaxAggregateOutputType | null
  }

  export type SalesPriceListLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesPriceListLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesPriceListLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    priceListId: string | null
    lineNo: number | null
    itemId: string | null
    brandKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesPriceListLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    priceListId: string | null
    lineNo: number | null
    itemId: string | null
    brandKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesPriceListLineCountAggregateOutputType = {
    id: number
    tenantId: number
    priceListId: number
    lineNo: number
    itemId: number
    brandKey: number
    priceSnapshot: number
    moqSnapshot: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesPriceListLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type SalesPriceListLineSumAggregateInputType = {
    lineNo?: true
  }

  export type SalesPriceListLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    priceListId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesPriceListLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    priceListId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesPriceListLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    priceListId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    priceSnapshot?: true
    moqSnapshot?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesPriceListLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesPriceListLine to aggregate.
     */
    where?: SalesPriceListLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceListLines to fetch.
     */
    orderBy?: SalesPriceListLineOrderByWithRelationInput | SalesPriceListLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesPriceListLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceListLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceListLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesPriceListLines
    **/
    _count?: true | SalesPriceListLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesPriceListLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesPriceListLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesPriceListLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesPriceListLineMaxAggregateInputType
  }

  export type GetSalesPriceListLineAggregateType<T extends SalesPriceListLineAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesPriceListLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesPriceListLine[P]>
      : GetScalarType<T[P], AggregateSalesPriceListLine[P]>
  }




  export type SalesPriceListLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesPriceListLineWhereInput
    orderBy?: SalesPriceListLineOrderByWithAggregationInput | SalesPriceListLineOrderByWithAggregationInput[]
    by: SalesPriceListLineScalarFieldEnum[] | SalesPriceListLineScalarFieldEnum
    having?: SalesPriceListLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesPriceListLineCountAggregateInputType | true
    _avg?: SalesPriceListLineAvgAggregateInputType
    _sum?: SalesPriceListLineSumAggregateInputType
    _min?: SalesPriceListLineMinAggregateInputType
    _max?: SalesPriceListLineMaxAggregateInputType
  }

  export type SalesPriceListLineGroupByOutputType = {
    id: string
    tenantId: string
    priceListId: string
    lineNo: number
    itemId: string
    brandKey: string | null
    priceSnapshot: JsonValue
    moqSnapshot: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: SalesPriceListLineCountAggregateOutputType | null
    _avg: SalesPriceListLineAvgAggregateOutputType | null
    _sum: SalesPriceListLineSumAggregateOutputType | null
    _min: SalesPriceListLineMinAggregateOutputType | null
    _max: SalesPriceListLineMaxAggregateOutputType | null
  }

  type GetSalesPriceListLineGroupByPayload<T extends SalesPriceListLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesPriceListLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesPriceListLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesPriceListLineGroupByOutputType[P]>
            : GetScalarType<T[P], SalesPriceListLineGroupByOutputType[P]>
        }
      >
    >


  export type SalesPriceListLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesPriceListLine"]>

  export type SalesPriceListLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesPriceListLine"]>

  export type SalesPriceListLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    priceListId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesPriceListLine"]>

  export type SalesPriceListLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    priceListId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesPriceListLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "priceListId" | "lineNo" | "itemId" | "brandKey" | "priceSnapshot" | "moqSnapshot" | "createdAt" | "updatedAt", ExtArgs["result"]["salesPriceListLine"]>
  export type SalesPriceListLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }
  export type SalesPriceListLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }
  export type SalesPriceListLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    priceList?: boolean | SalesPriceListDefaultArgs<ExtArgs>
  }

  export type $SalesPriceListLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesPriceListLine"
    objects: {
      priceList: Prisma.$SalesPriceListPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      priceListId: string
      lineNo: number
      itemId: string
      brandKey: string | null
      priceSnapshot: Prisma.JsonValue
      moqSnapshot: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesPriceListLine"]>
    composites: {}
  }

  type SalesPriceListLineGetPayload<S extends boolean | null | undefined | SalesPriceListLineDefaultArgs> = $Result.GetResult<Prisma.$SalesPriceListLinePayload, S>

  type SalesPriceListLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesPriceListLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesPriceListLineCountAggregateInputType | true
    }

  export interface SalesPriceListLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesPriceListLine'], meta: { name: 'SalesPriceListLine' } }
    /**
     * Find zero or one SalesPriceListLine that matches the filter.
     * @param {SalesPriceListLineFindUniqueArgs} args - Arguments to find a SalesPriceListLine
     * @example
     * // Get one SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesPriceListLineFindUniqueArgs>(args: SelectSubset<T, SalesPriceListLineFindUniqueArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesPriceListLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesPriceListLineFindUniqueOrThrowArgs} args - Arguments to find a SalesPriceListLine
     * @example
     * // Get one SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesPriceListLineFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesPriceListLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesPriceListLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineFindFirstArgs} args - Arguments to find a SalesPriceListLine
     * @example
     * // Get one SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesPriceListLineFindFirstArgs>(args?: SelectSubset<T, SalesPriceListLineFindFirstArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesPriceListLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineFindFirstOrThrowArgs} args - Arguments to find a SalesPriceListLine
     * @example
     * // Get one SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesPriceListLineFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesPriceListLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesPriceListLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesPriceListLines
     * const salesPriceListLines = await prisma.salesPriceListLine.findMany()
     * 
     * // Get first 10 SalesPriceListLines
     * const salesPriceListLines = await prisma.salesPriceListLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesPriceListLineWithIdOnly = await prisma.salesPriceListLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesPriceListLineFindManyArgs>(args?: SelectSubset<T, SalesPriceListLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesPriceListLine.
     * @param {SalesPriceListLineCreateArgs} args - Arguments to create a SalesPriceListLine.
     * @example
     * // Create one SalesPriceListLine
     * const SalesPriceListLine = await prisma.salesPriceListLine.create({
     *   data: {
     *     // ... data to create a SalesPriceListLine
     *   }
     * })
     * 
     */
    create<T extends SalesPriceListLineCreateArgs>(args: SelectSubset<T, SalesPriceListLineCreateArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesPriceListLines.
     * @param {SalesPriceListLineCreateManyArgs} args - Arguments to create many SalesPriceListLines.
     * @example
     * // Create many SalesPriceListLines
     * const salesPriceListLine = await prisma.salesPriceListLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesPriceListLineCreateManyArgs>(args?: SelectSubset<T, SalesPriceListLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesPriceListLines and returns the data saved in the database.
     * @param {SalesPriceListLineCreateManyAndReturnArgs} args - Arguments to create many SalesPriceListLines.
     * @example
     * // Create many SalesPriceListLines
     * const salesPriceListLine = await prisma.salesPriceListLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesPriceListLines and only return the `id`
     * const salesPriceListLineWithIdOnly = await prisma.salesPriceListLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesPriceListLineCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesPriceListLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesPriceListLine.
     * @param {SalesPriceListLineDeleteArgs} args - Arguments to delete one SalesPriceListLine.
     * @example
     * // Delete one SalesPriceListLine
     * const SalesPriceListLine = await prisma.salesPriceListLine.delete({
     *   where: {
     *     // ... filter to delete one SalesPriceListLine
     *   }
     * })
     * 
     */
    delete<T extends SalesPriceListLineDeleteArgs>(args: SelectSubset<T, SalesPriceListLineDeleteArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesPriceListLine.
     * @param {SalesPriceListLineUpdateArgs} args - Arguments to update one SalesPriceListLine.
     * @example
     * // Update one SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesPriceListLineUpdateArgs>(args: SelectSubset<T, SalesPriceListLineUpdateArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesPriceListLines.
     * @param {SalesPriceListLineDeleteManyArgs} args - Arguments to filter SalesPriceListLines to delete.
     * @example
     * // Delete a few SalesPriceListLines
     * const { count } = await prisma.salesPriceListLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesPriceListLineDeleteManyArgs>(args?: SelectSubset<T, SalesPriceListLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesPriceListLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesPriceListLines
     * const salesPriceListLine = await prisma.salesPriceListLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesPriceListLineUpdateManyArgs>(args: SelectSubset<T, SalesPriceListLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesPriceListLines and returns the data updated in the database.
     * @param {SalesPriceListLineUpdateManyAndReturnArgs} args - Arguments to update many SalesPriceListLines.
     * @example
     * // Update many SalesPriceListLines
     * const salesPriceListLine = await prisma.salesPriceListLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesPriceListLines and only return the `id`
     * const salesPriceListLineWithIdOnly = await prisma.salesPriceListLine.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesPriceListLineUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesPriceListLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesPriceListLine.
     * @param {SalesPriceListLineUpsertArgs} args - Arguments to update or create a SalesPriceListLine.
     * @example
     * // Update or create a SalesPriceListLine
     * const salesPriceListLine = await prisma.salesPriceListLine.upsert({
     *   create: {
     *     // ... data to create a SalesPriceListLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesPriceListLine we want to update
     *   }
     * })
     */
    upsert<T extends SalesPriceListLineUpsertArgs>(args: SelectSubset<T, SalesPriceListLineUpsertArgs<ExtArgs>>): Prisma__SalesPriceListLineClient<$Result.GetResult<Prisma.$SalesPriceListLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesPriceListLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineCountArgs} args - Arguments to filter SalesPriceListLines to count.
     * @example
     * // Count the number of SalesPriceListLines
     * const count = await prisma.salesPriceListLine.count({
     *   where: {
     *     // ... the filter for the SalesPriceListLines we want to count
     *   }
     * })
    **/
    count<T extends SalesPriceListLineCountArgs>(
      args?: Subset<T, SalesPriceListLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesPriceListLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesPriceListLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesPriceListLineAggregateArgs>(args: Subset<T, SalesPriceListLineAggregateArgs>): Prisma.PrismaPromise<GetSalesPriceListLineAggregateType<T>>

    /**
     * Group by SalesPriceListLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesPriceListLineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesPriceListLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesPriceListLineGroupByArgs['orderBy'] }
        : { orderBy?: SalesPriceListLineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesPriceListLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesPriceListLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesPriceListLine model
   */
  readonly fields: SalesPriceListLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesPriceListLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesPriceListLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    priceList<T extends SalesPriceListDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesPriceListDefaultArgs<ExtArgs>>): Prisma__SalesPriceListClient<$Result.GetResult<Prisma.$SalesPriceListPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesPriceListLine model
   */ 
  interface SalesPriceListLineFieldRefs {
    readonly id: FieldRef<"SalesPriceListLine", 'String'>
    readonly tenantId: FieldRef<"SalesPriceListLine", 'String'>
    readonly priceListId: FieldRef<"SalesPriceListLine", 'String'>
    readonly lineNo: FieldRef<"SalesPriceListLine", 'Int'>
    readonly itemId: FieldRef<"SalesPriceListLine", 'String'>
    readonly brandKey: FieldRef<"SalesPriceListLine", 'String'>
    readonly priceSnapshot: FieldRef<"SalesPriceListLine", 'Json'>
    readonly moqSnapshot: FieldRef<"SalesPriceListLine", 'Json'>
    readonly createdAt: FieldRef<"SalesPriceListLine", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesPriceListLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesPriceListLine findUnique
   */
  export type SalesPriceListLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceListLine to fetch.
     */
    where: SalesPriceListLineWhereUniqueInput
  }

  /**
   * SalesPriceListLine findUniqueOrThrow
   */
  export type SalesPriceListLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceListLine to fetch.
     */
    where: SalesPriceListLineWhereUniqueInput
  }

  /**
   * SalesPriceListLine findFirst
   */
  export type SalesPriceListLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceListLine to fetch.
     */
    where?: SalesPriceListLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceListLines to fetch.
     */
    orderBy?: SalesPriceListLineOrderByWithRelationInput | SalesPriceListLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesPriceListLines.
     */
    cursor?: SalesPriceListLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceListLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceListLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesPriceListLines.
     */
    distinct?: SalesPriceListLineScalarFieldEnum | SalesPriceListLineScalarFieldEnum[]
  }

  /**
   * SalesPriceListLine findFirstOrThrow
   */
  export type SalesPriceListLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceListLine to fetch.
     */
    where?: SalesPriceListLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceListLines to fetch.
     */
    orderBy?: SalesPriceListLineOrderByWithRelationInput | SalesPriceListLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesPriceListLines.
     */
    cursor?: SalesPriceListLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceListLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceListLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesPriceListLines.
     */
    distinct?: SalesPriceListLineScalarFieldEnum | SalesPriceListLineScalarFieldEnum[]
  }

  /**
   * SalesPriceListLine findMany
   */
  export type SalesPriceListLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesPriceListLines to fetch.
     */
    where?: SalesPriceListLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesPriceListLines to fetch.
     */
    orderBy?: SalesPriceListLineOrderByWithRelationInput | SalesPriceListLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesPriceListLines.
     */
    cursor?: SalesPriceListLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesPriceListLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesPriceListLines.
     */
    skip?: number
    distinct?: SalesPriceListLineScalarFieldEnum | SalesPriceListLineScalarFieldEnum[]
  }

  /**
   * SalesPriceListLine create
   */
  export type SalesPriceListLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesPriceListLine.
     */
    data: XOR<SalesPriceListLineCreateInput, SalesPriceListLineUncheckedCreateInput>
  }

  /**
   * SalesPriceListLine createMany
   */
  export type SalesPriceListLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesPriceListLines.
     */
    data: SalesPriceListLineCreateManyInput | SalesPriceListLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesPriceListLine createManyAndReturn
   */
  export type SalesPriceListLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * The data used to create many SalesPriceListLines.
     */
    data: SalesPriceListLineCreateManyInput | SalesPriceListLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesPriceListLine update
   */
  export type SalesPriceListLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesPriceListLine.
     */
    data: XOR<SalesPriceListLineUpdateInput, SalesPriceListLineUncheckedUpdateInput>
    /**
     * Choose, which SalesPriceListLine to update.
     */
    where: SalesPriceListLineWhereUniqueInput
  }

  /**
   * SalesPriceListLine updateMany
   */
  export type SalesPriceListLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesPriceListLines.
     */
    data: XOR<SalesPriceListLineUpdateManyMutationInput, SalesPriceListLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesPriceListLines to update
     */
    where?: SalesPriceListLineWhereInput
    /**
     * Limit how many SalesPriceListLines to update.
     */
    limit?: number
  }

  /**
   * SalesPriceListLine updateManyAndReturn
   */
  export type SalesPriceListLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * The data used to update SalesPriceListLines.
     */
    data: XOR<SalesPriceListLineUpdateManyMutationInput, SalesPriceListLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesPriceListLines to update
     */
    where?: SalesPriceListLineWhereInput
    /**
     * Limit how many SalesPriceListLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesPriceListLine upsert
   */
  export type SalesPriceListLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesPriceListLine to update in case it exists.
     */
    where: SalesPriceListLineWhereUniqueInput
    /**
     * In case the SalesPriceListLine found by the `where` argument doesn't exist, create a new SalesPriceListLine with this data.
     */
    create: XOR<SalesPriceListLineCreateInput, SalesPriceListLineUncheckedCreateInput>
    /**
     * In case the SalesPriceListLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesPriceListLineUpdateInput, SalesPriceListLineUncheckedUpdateInput>
  }

  /**
   * SalesPriceListLine delete
   */
  export type SalesPriceListLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
    /**
     * Filter which SalesPriceListLine to delete.
     */
    where: SalesPriceListLineWhereUniqueInput
  }

  /**
   * SalesPriceListLine deleteMany
   */
  export type SalesPriceListLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesPriceListLines to delete
     */
    where?: SalesPriceListLineWhereInput
    /**
     * Limit how many SalesPriceListLines to delete.
     */
    limit?: number
  }

  /**
   * SalesPriceListLine without action
   */
  export type SalesPriceListLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesPriceListLine
     */
    select?: SalesPriceListLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesPriceListLine
     */
    omit?: SalesPriceListLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesPriceListLineInclude<ExtArgs> | null
  }


  /**
   * Model SalesCustomerPriceAgreementVersion
   */

  export type AggregateSalesCustomerPriceAgreementVersion = {
    _count: SalesCustomerPriceAgreementVersionCountAggregateOutputType | null
    _avg: SalesCustomerPriceAgreementVersionAvgAggregateOutputType | null
    _sum: SalesCustomerPriceAgreementVersionSumAggregateOutputType | null
    _min: SalesCustomerPriceAgreementVersionMinAggregateOutputType | null
    _max: SalesCustomerPriceAgreementVersionMaxAggregateOutputType | null
  }

  export type SalesCustomerPriceAgreementVersionAvgAggregateOutputType = {
    versionNo: number | null
  }

  export type SalesCustomerPriceAgreementVersionSumAggregateOutputType = {
    versionNo: number | null
  }

  export type SalesCustomerPriceAgreementVersionMinAggregateOutputType = {
    id: string | null
    customerPriceAgreementId: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    currencyCode: string | null
    versionNo: number | null
    status: $Enums.CustomerPriceAgreementStatus | null
    publishedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesCustomerPriceAgreementVersionMaxAggregateOutputType = {
    id: string | null
    customerPriceAgreementId: string | null
    tenantId: string | null
    customerTenantPartyId: string | null
    currencyCode: string | null
    versionNo: number | null
    status: $Enums.CustomerPriceAgreementStatus | null
    publishedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesCustomerPriceAgreementVersionCountAggregateOutputType = {
    id: number
    customerPriceAgreementId: number
    tenantId: number
    customerTenantPartyId: number
    currencyCode: number
    versionNo: number
    status: number
    publishedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesCustomerPriceAgreementVersionAvgAggregateInputType = {
    versionNo?: true
  }

  export type SalesCustomerPriceAgreementVersionSumAggregateInputType = {
    versionNo?: true
  }

  export type SalesCustomerPriceAgreementVersionMinAggregateInputType = {
    id?: true
    customerPriceAgreementId?: true
    tenantId?: true
    customerTenantPartyId?: true
    currencyCode?: true
    versionNo?: true
    status?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesCustomerPriceAgreementVersionMaxAggregateInputType = {
    id?: true
    customerPriceAgreementId?: true
    tenantId?: true
    customerTenantPartyId?: true
    currencyCode?: true
    versionNo?: true
    status?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesCustomerPriceAgreementVersionCountAggregateInputType = {
    id?: true
    customerPriceAgreementId?: true
    tenantId?: true
    customerTenantPartyId?: true
    currencyCode?: true
    versionNo?: true
    status?: true
    publishedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesCustomerPriceAgreementVersionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesCustomerPriceAgreementVersion to aggregate.
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementVersions to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementVersionOrderByWithRelationInput | SalesCustomerPriceAgreementVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesCustomerPriceAgreementVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesCustomerPriceAgreementVersions
    **/
    _count?: true | SalesCustomerPriceAgreementVersionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesCustomerPriceAgreementVersionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesCustomerPriceAgreementVersionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesCustomerPriceAgreementVersionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesCustomerPriceAgreementVersionMaxAggregateInputType
  }

  export type GetSalesCustomerPriceAgreementVersionAggregateType<T extends SalesCustomerPriceAgreementVersionAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesCustomerPriceAgreementVersion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesCustomerPriceAgreementVersion[P]>
      : GetScalarType<T[P], AggregateSalesCustomerPriceAgreementVersion[P]>
  }




  export type SalesCustomerPriceAgreementVersionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesCustomerPriceAgreementVersionWhereInput
    orderBy?: SalesCustomerPriceAgreementVersionOrderByWithAggregationInput | SalesCustomerPriceAgreementVersionOrderByWithAggregationInput[]
    by: SalesCustomerPriceAgreementVersionScalarFieldEnum[] | SalesCustomerPriceAgreementVersionScalarFieldEnum
    having?: SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesCustomerPriceAgreementVersionCountAggregateInputType | true
    _avg?: SalesCustomerPriceAgreementVersionAvgAggregateInputType
    _sum?: SalesCustomerPriceAgreementVersionSumAggregateInputType
    _min?: SalesCustomerPriceAgreementVersionMinAggregateInputType
    _max?: SalesCustomerPriceAgreementVersionMaxAggregateInputType
  }

  export type SalesCustomerPriceAgreementVersionGroupByOutputType = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SalesCustomerPriceAgreementVersionCountAggregateOutputType | null
    _avg: SalesCustomerPriceAgreementVersionAvgAggregateOutputType | null
    _sum: SalesCustomerPriceAgreementVersionSumAggregateOutputType | null
    _min: SalesCustomerPriceAgreementVersionMinAggregateOutputType | null
    _max: SalesCustomerPriceAgreementVersionMaxAggregateOutputType | null
  }

  type GetSalesCustomerPriceAgreementVersionGroupByPayload<T extends SalesCustomerPriceAgreementVersionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesCustomerPriceAgreementVersionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesCustomerPriceAgreementVersionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesCustomerPriceAgreementVersionGroupByOutputType[P]>
            : GetScalarType<T[P], SalesCustomerPriceAgreementVersionGroupByOutputType[P]>
        }
      >
    >


  export type SalesCustomerPriceAgreementVersionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerPriceAgreementId?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    currencyCode?: boolean
    versionNo?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lines?: boolean | SalesCustomerPriceAgreementVersion$linesArgs<ExtArgs>
    _count?: boolean | SalesCustomerPriceAgreementVersionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesCustomerPriceAgreementVersion"]>

  export type SalesCustomerPriceAgreementVersionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerPriceAgreementId?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    currencyCode?: boolean
    versionNo?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesCustomerPriceAgreementVersion"]>

  export type SalesCustomerPriceAgreementVersionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerPriceAgreementId?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    currencyCode?: boolean
    versionNo?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["salesCustomerPriceAgreementVersion"]>

  export type SalesCustomerPriceAgreementVersionSelectScalar = {
    id?: boolean
    customerPriceAgreementId?: boolean
    tenantId?: boolean
    customerTenantPartyId?: boolean
    currencyCode?: boolean
    versionNo?: boolean
    status?: boolean
    publishedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesCustomerPriceAgreementVersionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "customerPriceAgreementId" | "tenantId" | "customerTenantPartyId" | "currencyCode" | "versionNo" | "status" | "publishedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["salesCustomerPriceAgreementVersion"]>
  export type SalesCustomerPriceAgreementVersionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | SalesCustomerPriceAgreementVersion$linesArgs<ExtArgs>
    _count?: boolean | SalesCustomerPriceAgreementVersionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SalesCustomerPriceAgreementVersionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SalesCustomerPriceAgreementVersionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SalesCustomerPriceAgreementVersionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesCustomerPriceAgreementVersion"
    objects: {
      lines: Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      customerPriceAgreementId: string
      tenantId: string
      customerTenantPartyId: string
      currencyCode: string
      versionNo: number
      status: $Enums.CustomerPriceAgreementStatus
      publishedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesCustomerPriceAgreementVersion"]>
    composites: {}
  }

  type SalesCustomerPriceAgreementVersionGetPayload<S extends boolean | null | undefined | SalesCustomerPriceAgreementVersionDefaultArgs> = $Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload, S>

  type SalesCustomerPriceAgreementVersionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesCustomerPriceAgreementVersionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesCustomerPriceAgreementVersionCountAggregateInputType | true
    }

  export interface SalesCustomerPriceAgreementVersionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesCustomerPriceAgreementVersion'], meta: { name: 'SalesCustomerPriceAgreementVersion' } }
    /**
     * Find zero or one SalesCustomerPriceAgreementVersion that matches the filter.
     * @param {SalesCustomerPriceAgreementVersionFindUniqueArgs} args - Arguments to find a SalesCustomerPriceAgreementVersion
     * @example
     * // Get one SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesCustomerPriceAgreementVersionFindUniqueArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionFindUniqueArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesCustomerPriceAgreementVersion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesCustomerPriceAgreementVersionFindUniqueOrThrowArgs} args - Arguments to find a SalesCustomerPriceAgreementVersion
     * @example
     * // Get one SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesCustomerPriceAgreementVersionFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesCustomerPriceAgreementVersion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionFindFirstArgs} args - Arguments to find a SalesCustomerPriceAgreementVersion
     * @example
     * // Get one SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesCustomerPriceAgreementVersionFindFirstArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionFindFirstArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesCustomerPriceAgreementVersion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionFindFirstOrThrowArgs} args - Arguments to find a SalesCustomerPriceAgreementVersion
     * @example
     * // Get one SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesCustomerPriceAgreementVersionFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesCustomerPriceAgreementVersions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersions = await prisma.salesCustomerPriceAgreementVersion.findMany()
     * 
     * // Get first 10 SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersions = await prisma.salesCustomerPriceAgreementVersion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesCustomerPriceAgreementVersionWithIdOnly = await prisma.salesCustomerPriceAgreementVersion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesCustomerPriceAgreementVersionFindManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesCustomerPriceAgreementVersion.
     * @param {SalesCustomerPriceAgreementVersionCreateArgs} args - Arguments to create a SalesCustomerPriceAgreementVersion.
     * @example
     * // Create one SalesCustomerPriceAgreementVersion
     * const SalesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.create({
     *   data: {
     *     // ... data to create a SalesCustomerPriceAgreementVersion
     *   }
     * })
     * 
     */
    create<T extends SalesCustomerPriceAgreementVersionCreateArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionCreateArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesCustomerPriceAgreementVersions.
     * @param {SalesCustomerPriceAgreementVersionCreateManyArgs} args - Arguments to create many SalesCustomerPriceAgreementVersions.
     * @example
     * // Create many SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesCustomerPriceAgreementVersionCreateManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesCustomerPriceAgreementVersions and returns the data saved in the database.
     * @param {SalesCustomerPriceAgreementVersionCreateManyAndReturnArgs} args - Arguments to create many SalesCustomerPriceAgreementVersions.
     * @example
     * // Create many SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesCustomerPriceAgreementVersions and only return the `id`
     * const salesCustomerPriceAgreementVersionWithIdOnly = await prisma.salesCustomerPriceAgreementVersion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesCustomerPriceAgreementVersionCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesCustomerPriceAgreementVersion.
     * @param {SalesCustomerPriceAgreementVersionDeleteArgs} args - Arguments to delete one SalesCustomerPriceAgreementVersion.
     * @example
     * // Delete one SalesCustomerPriceAgreementVersion
     * const SalesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.delete({
     *   where: {
     *     // ... filter to delete one SalesCustomerPriceAgreementVersion
     *   }
     * })
     * 
     */
    delete<T extends SalesCustomerPriceAgreementVersionDeleteArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionDeleteArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesCustomerPriceAgreementVersion.
     * @param {SalesCustomerPriceAgreementVersionUpdateArgs} args - Arguments to update one SalesCustomerPriceAgreementVersion.
     * @example
     * // Update one SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesCustomerPriceAgreementVersionUpdateArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionUpdateArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesCustomerPriceAgreementVersions.
     * @param {SalesCustomerPriceAgreementVersionDeleteManyArgs} args - Arguments to filter SalesCustomerPriceAgreementVersions to delete.
     * @example
     * // Delete a few SalesCustomerPriceAgreementVersions
     * const { count } = await prisma.salesCustomerPriceAgreementVersion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesCustomerPriceAgreementVersionDeleteManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementVersionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesCustomerPriceAgreementVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesCustomerPriceAgreementVersionUpdateManyArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesCustomerPriceAgreementVersions and returns the data updated in the database.
     * @param {SalesCustomerPriceAgreementVersionUpdateManyAndReturnArgs} args - Arguments to update many SalesCustomerPriceAgreementVersions.
     * @example
     * // Update many SalesCustomerPriceAgreementVersions
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesCustomerPriceAgreementVersions and only return the `id`
     * const salesCustomerPriceAgreementVersionWithIdOnly = await prisma.salesCustomerPriceAgreementVersion.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesCustomerPriceAgreementVersionUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesCustomerPriceAgreementVersion.
     * @param {SalesCustomerPriceAgreementVersionUpsertArgs} args - Arguments to update or create a SalesCustomerPriceAgreementVersion.
     * @example
     * // Update or create a SalesCustomerPriceAgreementVersion
     * const salesCustomerPriceAgreementVersion = await prisma.salesCustomerPriceAgreementVersion.upsert({
     *   create: {
     *     // ... data to create a SalesCustomerPriceAgreementVersion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesCustomerPriceAgreementVersion we want to update
     *   }
     * })
     */
    upsert<T extends SalesCustomerPriceAgreementVersionUpsertArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementVersionUpsertArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesCustomerPriceAgreementVersions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionCountArgs} args - Arguments to filter SalesCustomerPriceAgreementVersions to count.
     * @example
     * // Count the number of SalesCustomerPriceAgreementVersions
     * const count = await prisma.salesCustomerPriceAgreementVersion.count({
     *   where: {
     *     // ... the filter for the SalesCustomerPriceAgreementVersions we want to count
     *   }
     * })
    **/
    count<T extends SalesCustomerPriceAgreementVersionCountArgs>(
      args?: Subset<T, SalesCustomerPriceAgreementVersionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesCustomerPriceAgreementVersionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesCustomerPriceAgreementVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesCustomerPriceAgreementVersionAggregateArgs>(args: Subset<T, SalesCustomerPriceAgreementVersionAggregateArgs>): Prisma.PrismaPromise<GetSalesCustomerPriceAgreementVersionAggregateType<T>>

    /**
     * Group by SalesCustomerPriceAgreementVersion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementVersionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesCustomerPriceAgreementVersionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesCustomerPriceAgreementVersionGroupByArgs['orderBy'] }
        : { orderBy?: SalesCustomerPriceAgreementVersionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesCustomerPriceAgreementVersionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesCustomerPriceAgreementVersionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesCustomerPriceAgreementVersion model
   */
  readonly fields: SalesCustomerPriceAgreementVersionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesCustomerPriceAgreementVersion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesCustomerPriceAgreementVersionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends SalesCustomerPriceAgreementVersion$linesArgs<ExtArgs> = {}>(args?: Subset<T, SalesCustomerPriceAgreementVersion$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesCustomerPriceAgreementVersion model
   */ 
  interface SalesCustomerPriceAgreementVersionFieldRefs {
    readonly id: FieldRef<"SalesCustomerPriceAgreementVersion", 'String'>
    readonly customerPriceAgreementId: FieldRef<"SalesCustomerPriceAgreementVersion", 'String'>
    readonly tenantId: FieldRef<"SalesCustomerPriceAgreementVersion", 'String'>
    readonly customerTenantPartyId: FieldRef<"SalesCustomerPriceAgreementVersion", 'String'>
    readonly currencyCode: FieldRef<"SalesCustomerPriceAgreementVersion", 'String'>
    readonly versionNo: FieldRef<"SalesCustomerPriceAgreementVersion", 'Int'>
    readonly status: FieldRef<"SalesCustomerPriceAgreementVersion", 'CustomerPriceAgreementStatus'>
    readonly publishedAt: FieldRef<"SalesCustomerPriceAgreementVersion", 'DateTime'>
    readonly createdAt: FieldRef<"SalesCustomerPriceAgreementVersion", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesCustomerPriceAgreementVersion", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesCustomerPriceAgreementVersion findUnique
   */
  export type SalesCustomerPriceAgreementVersionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementVersion to fetch.
     */
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementVersion findUniqueOrThrow
   */
  export type SalesCustomerPriceAgreementVersionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementVersion to fetch.
     */
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementVersion findFirst
   */
  export type SalesCustomerPriceAgreementVersionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementVersion to fetch.
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementVersions to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementVersionOrderByWithRelationInput | SalesCustomerPriceAgreementVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesCustomerPriceAgreementVersions.
     */
    cursor?: SalesCustomerPriceAgreementVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesCustomerPriceAgreementVersions.
     */
    distinct?: SalesCustomerPriceAgreementVersionScalarFieldEnum | SalesCustomerPriceAgreementVersionScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementVersion findFirstOrThrow
   */
  export type SalesCustomerPriceAgreementVersionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementVersion to fetch.
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementVersions to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementVersionOrderByWithRelationInput | SalesCustomerPriceAgreementVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesCustomerPriceAgreementVersions.
     */
    cursor?: SalesCustomerPriceAgreementVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementVersions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesCustomerPriceAgreementVersions.
     */
    distinct?: SalesCustomerPriceAgreementVersionScalarFieldEnum | SalesCustomerPriceAgreementVersionScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementVersion findMany
   */
  export type SalesCustomerPriceAgreementVersionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementVersions to fetch.
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementVersions to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementVersionOrderByWithRelationInput | SalesCustomerPriceAgreementVersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesCustomerPriceAgreementVersions.
     */
    cursor?: SalesCustomerPriceAgreementVersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementVersions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementVersions.
     */
    skip?: number
    distinct?: SalesCustomerPriceAgreementVersionScalarFieldEnum | SalesCustomerPriceAgreementVersionScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementVersion create
   */
  export type SalesCustomerPriceAgreementVersionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesCustomerPriceAgreementVersion.
     */
    data: XOR<SalesCustomerPriceAgreementVersionCreateInput, SalesCustomerPriceAgreementVersionUncheckedCreateInput>
  }

  /**
   * SalesCustomerPriceAgreementVersion createMany
   */
  export type SalesCustomerPriceAgreementVersionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesCustomerPriceAgreementVersions.
     */
    data: SalesCustomerPriceAgreementVersionCreateManyInput | SalesCustomerPriceAgreementVersionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesCustomerPriceAgreementVersion createManyAndReturn
   */
  export type SalesCustomerPriceAgreementVersionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * The data used to create many SalesCustomerPriceAgreementVersions.
     */
    data: SalesCustomerPriceAgreementVersionCreateManyInput | SalesCustomerPriceAgreementVersionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesCustomerPriceAgreementVersion update
   */
  export type SalesCustomerPriceAgreementVersionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesCustomerPriceAgreementVersion.
     */
    data: XOR<SalesCustomerPriceAgreementVersionUpdateInput, SalesCustomerPriceAgreementVersionUncheckedUpdateInput>
    /**
     * Choose, which SalesCustomerPriceAgreementVersion to update.
     */
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementVersion updateMany
   */
  export type SalesCustomerPriceAgreementVersionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesCustomerPriceAgreementVersions.
     */
    data: XOR<SalesCustomerPriceAgreementVersionUpdateManyMutationInput, SalesCustomerPriceAgreementVersionUncheckedUpdateManyInput>
    /**
     * Filter which SalesCustomerPriceAgreementVersions to update
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementVersions to update.
     */
    limit?: number
  }

  /**
   * SalesCustomerPriceAgreementVersion updateManyAndReturn
   */
  export type SalesCustomerPriceAgreementVersionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * The data used to update SalesCustomerPriceAgreementVersions.
     */
    data: XOR<SalesCustomerPriceAgreementVersionUpdateManyMutationInput, SalesCustomerPriceAgreementVersionUncheckedUpdateManyInput>
    /**
     * Filter which SalesCustomerPriceAgreementVersions to update
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementVersions to update.
     */
    limit?: number
  }

  /**
   * SalesCustomerPriceAgreementVersion upsert
   */
  export type SalesCustomerPriceAgreementVersionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesCustomerPriceAgreementVersion to update in case it exists.
     */
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
    /**
     * In case the SalesCustomerPriceAgreementVersion found by the `where` argument doesn't exist, create a new SalesCustomerPriceAgreementVersion with this data.
     */
    create: XOR<SalesCustomerPriceAgreementVersionCreateInput, SalesCustomerPriceAgreementVersionUncheckedCreateInput>
    /**
     * In case the SalesCustomerPriceAgreementVersion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesCustomerPriceAgreementVersionUpdateInput, SalesCustomerPriceAgreementVersionUncheckedUpdateInput>
  }

  /**
   * SalesCustomerPriceAgreementVersion delete
   */
  export type SalesCustomerPriceAgreementVersionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
    /**
     * Filter which SalesCustomerPriceAgreementVersion to delete.
     */
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementVersion deleteMany
   */
  export type SalesCustomerPriceAgreementVersionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesCustomerPriceAgreementVersions to delete
     */
    where?: SalesCustomerPriceAgreementVersionWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementVersions to delete.
     */
    limit?: number
  }

  /**
   * SalesCustomerPriceAgreementVersion.lines
   */
  export type SalesCustomerPriceAgreementVersion$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    where?: SalesCustomerPriceAgreementLineWhereInput
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithRelationInput | SalesCustomerPriceAgreementLineOrderByWithRelationInput[]
    cursor?: SalesCustomerPriceAgreementLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SalesCustomerPriceAgreementLineScalarFieldEnum | SalesCustomerPriceAgreementLineScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementVersion without action
   */
  export type SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementVersion
     */
    select?: SalesCustomerPriceAgreementVersionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementVersion
     */
    omit?: SalesCustomerPriceAgreementVersionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementVersionInclude<ExtArgs> | null
  }


  /**
   * Model SalesCustomerPriceAgreementLine
   */

  export type AggregateSalesCustomerPriceAgreementLine = {
    _count: SalesCustomerPriceAgreementLineCountAggregateOutputType | null
    _avg: SalesCustomerPriceAgreementLineAvgAggregateOutputType | null
    _sum: SalesCustomerPriceAgreementLineSumAggregateOutputType | null
    _min: SalesCustomerPriceAgreementLineMinAggregateOutputType | null
    _max: SalesCustomerPriceAgreementLineMaxAggregateOutputType | null
  }

  export type SalesCustomerPriceAgreementLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesCustomerPriceAgreementLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type SalesCustomerPriceAgreementLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerPriceAgreementVersionId: string | null
    lineNo: number | null
    itemId: string | null
    brandKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesCustomerPriceAgreementLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerPriceAgreementVersionId: string | null
    lineNo: number | null
    itemId: string | null
    brandKey: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SalesCustomerPriceAgreementLineCountAggregateOutputType = {
    id: number
    tenantId: number
    customerPriceAgreementVersionId: number
    lineNo: number
    itemId: number
    brandKey: number
    priceSnapshot: number
    moqSnapshot: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SalesCustomerPriceAgreementLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type SalesCustomerPriceAgreementLineSumAggregateInputType = {
    lineNo?: true
  }

  export type SalesCustomerPriceAgreementLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    customerPriceAgreementVersionId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesCustomerPriceAgreementLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    customerPriceAgreementVersionId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SalesCustomerPriceAgreementLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    customerPriceAgreementVersionId?: true
    lineNo?: true
    itemId?: true
    brandKey?: true
    priceSnapshot?: true
    moqSnapshot?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SalesCustomerPriceAgreementLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesCustomerPriceAgreementLine to aggregate.
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementLines to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithRelationInput | SalesCustomerPriceAgreementLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesCustomerPriceAgreementLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesCustomerPriceAgreementLines
    **/
    _count?: true | SalesCustomerPriceAgreementLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SalesCustomerPriceAgreementLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SalesCustomerPriceAgreementLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesCustomerPriceAgreementLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesCustomerPriceAgreementLineMaxAggregateInputType
  }

  export type GetSalesCustomerPriceAgreementLineAggregateType<T extends SalesCustomerPriceAgreementLineAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesCustomerPriceAgreementLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesCustomerPriceAgreementLine[P]>
      : GetScalarType<T[P], AggregateSalesCustomerPriceAgreementLine[P]>
  }




  export type SalesCustomerPriceAgreementLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesCustomerPriceAgreementLineWhereInput
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithAggregationInput | SalesCustomerPriceAgreementLineOrderByWithAggregationInput[]
    by: SalesCustomerPriceAgreementLineScalarFieldEnum[] | SalesCustomerPriceAgreementLineScalarFieldEnum
    having?: SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesCustomerPriceAgreementLineCountAggregateInputType | true
    _avg?: SalesCustomerPriceAgreementLineAvgAggregateInputType
    _sum?: SalesCustomerPriceAgreementLineSumAggregateInputType
    _min?: SalesCustomerPriceAgreementLineMinAggregateInputType
    _max?: SalesCustomerPriceAgreementLineMaxAggregateInputType
  }

  export type SalesCustomerPriceAgreementLineGroupByOutputType = {
    id: string
    tenantId: string
    customerPriceAgreementVersionId: string
    lineNo: number
    itemId: string
    brandKey: string | null
    priceSnapshot: JsonValue
    moqSnapshot: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: SalesCustomerPriceAgreementLineCountAggregateOutputType | null
    _avg: SalesCustomerPriceAgreementLineAvgAggregateOutputType | null
    _sum: SalesCustomerPriceAgreementLineSumAggregateOutputType | null
    _min: SalesCustomerPriceAgreementLineMinAggregateOutputType | null
    _max: SalesCustomerPriceAgreementLineMaxAggregateOutputType | null
  }

  type GetSalesCustomerPriceAgreementLineGroupByPayload<T extends SalesCustomerPriceAgreementLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesCustomerPriceAgreementLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesCustomerPriceAgreementLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesCustomerPriceAgreementLineGroupByOutputType[P]>
            : GetScalarType<T[P], SalesCustomerPriceAgreementLineGroupByOutputType[P]>
        }
      >
    >


  export type SalesCustomerPriceAgreementLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerPriceAgreementVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesCustomerPriceAgreementLine"]>

  export type SalesCustomerPriceAgreementLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerPriceAgreementVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesCustomerPriceAgreementLine"]>

  export type SalesCustomerPriceAgreementLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerPriceAgreementVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["salesCustomerPriceAgreementLine"]>

  export type SalesCustomerPriceAgreementLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    customerPriceAgreementVersionId?: boolean
    lineNo?: boolean
    itemId?: boolean
    brandKey?: boolean
    priceSnapshot?: boolean
    moqSnapshot?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SalesCustomerPriceAgreementLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "customerPriceAgreementVersionId" | "lineNo" | "itemId" | "brandKey" | "priceSnapshot" | "moqSnapshot" | "createdAt" | "updatedAt", ExtArgs["result"]["salesCustomerPriceAgreementLine"]>
  export type SalesCustomerPriceAgreementLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }
  export type SalesCustomerPriceAgreementLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }
  export type SalesCustomerPriceAgreementLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerPriceAgreementVersion?: boolean | SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>
  }

  export type $SalesCustomerPriceAgreementLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesCustomerPriceAgreementLine"
    objects: {
      customerPriceAgreementVersion: Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      customerPriceAgreementVersionId: string
      lineNo: number
      itemId: string
      brandKey: string | null
      priceSnapshot: Prisma.JsonValue
      moqSnapshot: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["salesCustomerPriceAgreementLine"]>
    composites: {}
  }

  type SalesCustomerPriceAgreementLineGetPayload<S extends boolean | null | undefined | SalesCustomerPriceAgreementLineDefaultArgs> = $Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload, S>

  type SalesCustomerPriceAgreementLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesCustomerPriceAgreementLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesCustomerPriceAgreementLineCountAggregateInputType | true
    }

  export interface SalesCustomerPriceAgreementLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesCustomerPriceAgreementLine'], meta: { name: 'SalesCustomerPriceAgreementLine' } }
    /**
     * Find zero or one SalesCustomerPriceAgreementLine that matches the filter.
     * @param {SalesCustomerPriceAgreementLineFindUniqueArgs} args - Arguments to find a SalesCustomerPriceAgreementLine
     * @example
     * // Get one SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesCustomerPriceAgreementLineFindUniqueArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineFindUniqueArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesCustomerPriceAgreementLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesCustomerPriceAgreementLineFindUniqueOrThrowArgs} args - Arguments to find a SalesCustomerPriceAgreementLine
     * @example
     * // Get one SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesCustomerPriceAgreementLineFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesCustomerPriceAgreementLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineFindFirstArgs} args - Arguments to find a SalesCustomerPriceAgreementLine
     * @example
     * // Get one SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesCustomerPriceAgreementLineFindFirstArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineFindFirstArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesCustomerPriceAgreementLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineFindFirstOrThrowArgs} args - Arguments to find a SalesCustomerPriceAgreementLine
     * @example
     * // Get one SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesCustomerPriceAgreementLineFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesCustomerPriceAgreementLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLines = await prisma.salesCustomerPriceAgreementLine.findMany()
     * 
     * // Get first 10 SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLines = await prisma.salesCustomerPriceAgreementLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesCustomerPriceAgreementLineWithIdOnly = await prisma.salesCustomerPriceAgreementLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesCustomerPriceAgreementLineFindManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesCustomerPriceAgreementLine.
     * @param {SalesCustomerPriceAgreementLineCreateArgs} args - Arguments to create a SalesCustomerPriceAgreementLine.
     * @example
     * // Create one SalesCustomerPriceAgreementLine
     * const SalesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.create({
     *   data: {
     *     // ... data to create a SalesCustomerPriceAgreementLine
     *   }
     * })
     * 
     */
    create<T extends SalesCustomerPriceAgreementLineCreateArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineCreateArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesCustomerPriceAgreementLines.
     * @param {SalesCustomerPriceAgreementLineCreateManyArgs} args - Arguments to create many SalesCustomerPriceAgreementLines.
     * @example
     * // Create many SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesCustomerPriceAgreementLineCreateManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesCustomerPriceAgreementLines and returns the data saved in the database.
     * @param {SalesCustomerPriceAgreementLineCreateManyAndReturnArgs} args - Arguments to create many SalesCustomerPriceAgreementLines.
     * @example
     * // Create many SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesCustomerPriceAgreementLines and only return the `id`
     * const salesCustomerPriceAgreementLineWithIdOnly = await prisma.salesCustomerPriceAgreementLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesCustomerPriceAgreementLineCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesCustomerPriceAgreementLine.
     * @param {SalesCustomerPriceAgreementLineDeleteArgs} args - Arguments to delete one SalesCustomerPriceAgreementLine.
     * @example
     * // Delete one SalesCustomerPriceAgreementLine
     * const SalesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.delete({
     *   where: {
     *     // ... filter to delete one SalesCustomerPriceAgreementLine
     *   }
     * })
     * 
     */
    delete<T extends SalesCustomerPriceAgreementLineDeleteArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineDeleteArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesCustomerPriceAgreementLine.
     * @param {SalesCustomerPriceAgreementLineUpdateArgs} args - Arguments to update one SalesCustomerPriceAgreementLine.
     * @example
     * // Update one SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesCustomerPriceAgreementLineUpdateArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineUpdateArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesCustomerPriceAgreementLines.
     * @param {SalesCustomerPriceAgreementLineDeleteManyArgs} args - Arguments to filter SalesCustomerPriceAgreementLines to delete.
     * @example
     * // Delete a few SalesCustomerPriceAgreementLines
     * const { count } = await prisma.salesCustomerPriceAgreementLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesCustomerPriceAgreementLineDeleteManyArgs>(args?: SelectSubset<T, SalesCustomerPriceAgreementLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesCustomerPriceAgreementLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesCustomerPriceAgreementLineUpdateManyArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesCustomerPriceAgreementLines and returns the data updated in the database.
     * @param {SalesCustomerPriceAgreementLineUpdateManyAndReturnArgs} args - Arguments to update many SalesCustomerPriceAgreementLines.
     * @example
     * // Update many SalesCustomerPriceAgreementLines
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesCustomerPriceAgreementLines and only return the `id`
     * const salesCustomerPriceAgreementLineWithIdOnly = await prisma.salesCustomerPriceAgreementLine.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesCustomerPriceAgreementLineUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesCustomerPriceAgreementLine.
     * @param {SalesCustomerPriceAgreementLineUpsertArgs} args - Arguments to update or create a SalesCustomerPriceAgreementLine.
     * @example
     * // Update or create a SalesCustomerPriceAgreementLine
     * const salesCustomerPriceAgreementLine = await prisma.salesCustomerPriceAgreementLine.upsert({
     *   create: {
     *     // ... data to create a SalesCustomerPriceAgreementLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesCustomerPriceAgreementLine we want to update
     *   }
     * })
     */
    upsert<T extends SalesCustomerPriceAgreementLineUpsertArgs>(args: SelectSubset<T, SalesCustomerPriceAgreementLineUpsertArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementLineClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesCustomerPriceAgreementLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineCountArgs} args - Arguments to filter SalesCustomerPriceAgreementLines to count.
     * @example
     * // Count the number of SalesCustomerPriceAgreementLines
     * const count = await prisma.salesCustomerPriceAgreementLine.count({
     *   where: {
     *     // ... the filter for the SalesCustomerPriceAgreementLines we want to count
     *   }
     * })
    **/
    count<T extends SalesCustomerPriceAgreementLineCountArgs>(
      args?: Subset<T, SalesCustomerPriceAgreementLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesCustomerPriceAgreementLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesCustomerPriceAgreementLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesCustomerPriceAgreementLineAggregateArgs>(args: Subset<T, SalesCustomerPriceAgreementLineAggregateArgs>): Prisma.PrismaPromise<GetSalesCustomerPriceAgreementLineAggregateType<T>>

    /**
     * Group by SalesCustomerPriceAgreementLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesCustomerPriceAgreementLineGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesCustomerPriceAgreementLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesCustomerPriceAgreementLineGroupByArgs['orderBy'] }
        : { orderBy?: SalesCustomerPriceAgreementLineGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesCustomerPriceAgreementLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesCustomerPriceAgreementLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesCustomerPriceAgreementLine model
   */
  readonly fields: SalesCustomerPriceAgreementLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesCustomerPriceAgreementLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesCustomerPriceAgreementLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customerPriceAgreementVersion<T extends SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SalesCustomerPriceAgreementVersionDefaultArgs<ExtArgs>>): Prisma__SalesCustomerPriceAgreementVersionClient<$Result.GetResult<Prisma.$SalesCustomerPriceAgreementVersionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesCustomerPriceAgreementLine model
   */ 
  interface SalesCustomerPriceAgreementLineFieldRefs {
    readonly id: FieldRef<"SalesCustomerPriceAgreementLine", 'String'>
    readonly tenantId: FieldRef<"SalesCustomerPriceAgreementLine", 'String'>
    readonly customerPriceAgreementVersionId: FieldRef<"SalesCustomerPriceAgreementLine", 'String'>
    readonly lineNo: FieldRef<"SalesCustomerPriceAgreementLine", 'Int'>
    readonly itemId: FieldRef<"SalesCustomerPriceAgreementLine", 'String'>
    readonly brandKey: FieldRef<"SalesCustomerPriceAgreementLine", 'String'>
    readonly priceSnapshot: FieldRef<"SalesCustomerPriceAgreementLine", 'Json'>
    readonly moqSnapshot: FieldRef<"SalesCustomerPriceAgreementLine", 'Json'>
    readonly createdAt: FieldRef<"SalesCustomerPriceAgreementLine", 'DateTime'>
    readonly updatedAt: FieldRef<"SalesCustomerPriceAgreementLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesCustomerPriceAgreementLine findUnique
   */
  export type SalesCustomerPriceAgreementLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementLine to fetch.
     */
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementLine findUniqueOrThrow
   */
  export type SalesCustomerPriceAgreementLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementLine to fetch.
     */
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementLine findFirst
   */
  export type SalesCustomerPriceAgreementLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementLine to fetch.
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementLines to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithRelationInput | SalesCustomerPriceAgreementLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesCustomerPriceAgreementLines.
     */
    cursor?: SalesCustomerPriceAgreementLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesCustomerPriceAgreementLines.
     */
    distinct?: SalesCustomerPriceAgreementLineScalarFieldEnum | SalesCustomerPriceAgreementLineScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementLine findFirstOrThrow
   */
  export type SalesCustomerPriceAgreementLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementLine to fetch.
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementLines to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithRelationInput | SalesCustomerPriceAgreementLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesCustomerPriceAgreementLines.
     */
    cursor?: SalesCustomerPriceAgreementLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesCustomerPriceAgreementLines.
     */
    distinct?: SalesCustomerPriceAgreementLineScalarFieldEnum | SalesCustomerPriceAgreementLineScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementLine findMany
   */
  export type SalesCustomerPriceAgreementLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter, which SalesCustomerPriceAgreementLines to fetch.
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesCustomerPriceAgreementLines to fetch.
     */
    orderBy?: SalesCustomerPriceAgreementLineOrderByWithRelationInput | SalesCustomerPriceAgreementLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesCustomerPriceAgreementLines.
     */
    cursor?: SalesCustomerPriceAgreementLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesCustomerPriceAgreementLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesCustomerPriceAgreementLines.
     */
    skip?: number
    distinct?: SalesCustomerPriceAgreementLineScalarFieldEnum | SalesCustomerPriceAgreementLineScalarFieldEnum[]
  }

  /**
   * SalesCustomerPriceAgreementLine create
   */
  export type SalesCustomerPriceAgreementLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * The data needed to create a SalesCustomerPriceAgreementLine.
     */
    data: XOR<SalesCustomerPriceAgreementLineCreateInput, SalesCustomerPriceAgreementLineUncheckedCreateInput>
  }

  /**
   * SalesCustomerPriceAgreementLine createMany
   */
  export type SalesCustomerPriceAgreementLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesCustomerPriceAgreementLines.
     */
    data: SalesCustomerPriceAgreementLineCreateManyInput | SalesCustomerPriceAgreementLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesCustomerPriceAgreementLine createManyAndReturn
   */
  export type SalesCustomerPriceAgreementLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * The data used to create many SalesCustomerPriceAgreementLines.
     */
    data: SalesCustomerPriceAgreementLineCreateManyInput | SalesCustomerPriceAgreementLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesCustomerPriceAgreementLine update
   */
  export type SalesCustomerPriceAgreementLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * The data needed to update a SalesCustomerPriceAgreementLine.
     */
    data: XOR<SalesCustomerPriceAgreementLineUpdateInput, SalesCustomerPriceAgreementLineUncheckedUpdateInput>
    /**
     * Choose, which SalesCustomerPriceAgreementLine to update.
     */
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementLine updateMany
   */
  export type SalesCustomerPriceAgreementLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesCustomerPriceAgreementLines.
     */
    data: XOR<SalesCustomerPriceAgreementLineUpdateManyMutationInput, SalesCustomerPriceAgreementLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesCustomerPriceAgreementLines to update
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementLines to update.
     */
    limit?: number
  }

  /**
   * SalesCustomerPriceAgreementLine updateManyAndReturn
   */
  export type SalesCustomerPriceAgreementLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * The data used to update SalesCustomerPriceAgreementLines.
     */
    data: XOR<SalesCustomerPriceAgreementLineUpdateManyMutationInput, SalesCustomerPriceAgreementLineUncheckedUpdateManyInput>
    /**
     * Filter which SalesCustomerPriceAgreementLines to update
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SalesCustomerPriceAgreementLine upsert
   */
  export type SalesCustomerPriceAgreementLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * The filter to search for the SalesCustomerPriceAgreementLine to update in case it exists.
     */
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
    /**
     * In case the SalesCustomerPriceAgreementLine found by the `where` argument doesn't exist, create a new SalesCustomerPriceAgreementLine with this data.
     */
    create: XOR<SalesCustomerPriceAgreementLineCreateInput, SalesCustomerPriceAgreementLineUncheckedCreateInput>
    /**
     * In case the SalesCustomerPriceAgreementLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesCustomerPriceAgreementLineUpdateInput, SalesCustomerPriceAgreementLineUncheckedUpdateInput>
  }

  /**
   * SalesCustomerPriceAgreementLine delete
   */
  export type SalesCustomerPriceAgreementLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
    /**
     * Filter which SalesCustomerPriceAgreementLine to delete.
     */
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
  }

  /**
   * SalesCustomerPriceAgreementLine deleteMany
   */
  export type SalesCustomerPriceAgreementLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesCustomerPriceAgreementLines to delete
     */
    where?: SalesCustomerPriceAgreementLineWhereInput
    /**
     * Limit how many SalesCustomerPriceAgreementLines to delete.
     */
    limit?: number
  }

  /**
   * SalesCustomerPriceAgreementLine without action
   */
  export type SalesCustomerPriceAgreementLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesCustomerPriceAgreementLine
     */
    select?: SalesCustomerPriceAgreementLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesCustomerPriceAgreementLine
     */
    omit?: SalesCustomerPriceAgreementLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SalesCustomerPriceAgreementLineInclude<ExtArgs> | null
  }


  /**
   * Model SalesAuditEnvelope
   */

  export type AggregateSalesAuditEnvelope = {
    _count: SalesAuditEnvelopeCountAggregateOutputType | null
    _min: SalesAuditEnvelopeMinAggregateOutputType | null
    _max: SalesAuditEnvelopeMaxAggregateOutputType | null
  }

  export type SalesAuditEnvelopeMinAggregateOutputType = {
    id: string | null
    service: string | null
    module: string | null
    eventType: string | null
    occurredAt: Date | null
    result: string | null
    operatorId: string | null
    operatorType: string | null
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string | null
    resourceId: string | null
    createdAt: Date | null
  }

  export type SalesAuditEnvelopeMaxAggregateOutputType = {
    id: string | null
    service: string | null
    module: string | null
    eventType: string | null
    occurredAt: Date | null
    result: string | null
    operatorId: string | null
    operatorType: string | null
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string | null
    resourceId: string | null
    createdAt: Date | null
  }

  export type SalesAuditEnvelopeCountAggregateOutputType = {
    id: number
    service: number
    module: number
    eventType: number
    occurredAt: number
    result: number
    operatorId: number
    operatorType: number
    tenantId: number
    orgId: number
    traceId: number
    resourceType: number
    resourceId: number
    details: number
    createdAt: number
    _all: number
  }


  export type SalesAuditEnvelopeMinAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    createdAt?: true
  }

  export type SalesAuditEnvelopeMaxAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    createdAt?: true
  }

  export type SalesAuditEnvelopeCountAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    details?: true
    createdAt?: true
    _all?: true
  }

  export type SalesAuditEnvelopeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesAuditEnvelope to aggregate.
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesAuditEnvelopes to fetch.
     */
    orderBy?: SalesAuditEnvelopeOrderByWithRelationInput | SalesAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SalesAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SalesAuditEnvelopes
    **/
    _count?: true | SalesAuditEnvelopeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SalesAuditEnvelopeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SalesAuditEnvelopeMaxAggregateInputType
  }

  export type GetSalesAuditEnvelopeAggregateType<T extends SalesAuditEnvelopeAggregateArgs> = {
        [P in keyof T & keyof AggregateSalesAuditEnvelope]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSalesAuditEnvelope[P]>
      : GetScalarType<T[P], AggregateSalesAuditEnvelope[P]>
  }




  export type SalesAuditEnvelopeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SalesAuditEnvelopeWhereInput
    orderBy?: SalesAuditEnvelopeOrderByWithAggregationInput | SalesAuditEnvelopeOrderByWithAggregationInput[]
    by: SalesAuditEnvelopeScalarFieldEnum[] | SalesAuditEnvelopeScalarFieldEnum
    having?: SalesAuditEnvelopeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SalesAuditEnvelopeCountAggregateInputType | true
    _min?: SalesAuditEnvelopeMinAggregateInputType
    _max?: SalesAuditEnvelopeMaxAggregateInputType
  }

  export type SalesAuditEnvelopeGroupByOutputType = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date
    result: string
    operatorId: string | null
    operatorType: string
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string
    resourceId: string | null
    details: JsonValue
    createdAt: Date
    _count: SalesAuditEnvelopeCountAggregateOutputType | null
    _min: SalesAuditEnvelopeMinAggregateOutputType | null
    _max: SalesAuditEnvelopeMaxAggregateOutputType | null
  }

  type GetSalesAuditEnvelopeGroupByPayload<T extends SalesAuditEnvelopeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SalesAuditEnvelopeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SalesAuditEnvelopeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SalesAuditEnvelopeGroupByOutputType[P]>
            : GetScalarType<T[P], SalesAuditEnvelopeGroupByOutputType[P]>
        }
      >
    >


  export type SalesAuditEnvelopeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["salesAuditEnvelope"]>

  export type SalesAuditEnvelopeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["salesAuditEnvelope"]>

  export type SalesAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["salesAuditEnvelope"]>

  export type SalesAuditEnvelopeSelectScalar = {
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }

  export type SalesAuditEnvelopeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["salesAuditEnvelope"]>

  export type $SalesAuditEnvelopePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SalesAuditEnvelope"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      service: string
      module: string
      eventType: string
      occurredAt: Date
      result: string
      operatorId: string | null
      operatorType: string
      tenantId: string | null
      orgId: string | null
      traceId: string | null
      resourceType: string
      resourceId: string | null
      details: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["salesAuditEnvelope"]>
    composites: {}
  }

  type SalesAuditEnvelopeGetPayload<S extends boolean | null | undefined | SalesAuditEnvelopeDefaultArgs> = $Result.GetResult<Prisma.$SalesAuditEnvelopePayload, S>

  type SalesAuditEnvelopeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SalesAuditEnvelopeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SalesAuditEnvelopeCountAggregateInputType | true
    }

  export interface SalesAuditEnvelopeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SalesAuditEnvelope'], meta: { name: 'SalesAuditEnvelope' } }
    /**
     * Find zero or one SalesAuditEnvelope that matches the filter.
     * @param {SalesAuditEnvelopeFindUniqueArgs} args - Arguments to find a SalesAuditEnvelope
     * @example
     * // Get one SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SalesAuditEnvelopeFindUniqueArgs>(args: SelectSubset<T, SalesAuditEnvelopeFindUniqueArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SalesAuditEnvelope that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SalesAuditEnvelopeFindUniqueOrThrowArgs} args - Arguments to find a SalesAuditEnvelope
     * @example
     * // Get one SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SalesAuditEnvelopeFindUniqueOrThrowArgs>(args: SelectSubset<T, SalesAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SalesAuditEnvelope that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeFindFirstArgs} args - Arguments to find a SalesAuditEnvelope
     * @example
     * // Get one SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SalesAuditEnvelopeFindFirstArgs>(args?: SelectSubset<T, SalesAuditEnvelopeFindFirstArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SalesAuditEnvelope that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeFindFirstOrThrowArgs} args - Arguments to find a SalesAuditEnvelope
     * @example
     * // Get one SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SalesAuditEnvelopeFindFirstOrThrowArgs>(args?: SelectSubset<T, SalesAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SalesAuditEnvelopes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SalesAuditEnvelopes
     * const salesAuditEnvelopes = await prisma.salesAuditEnvelope.findMany()
     * 
     * // Get first 10 SalesAuditEnvelopes
     * const salesAuditEnvelopes = await prisma.salesAuditEnvelope.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const salesAuditEnvelopeWithIdOnly = await prisma.salesAuditEnvelope.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SalesAuditEnvelopeFindManyArgs>(args?: SelectSubset<T, SalesAuditEnvelopeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SalesAuditEnvelope.
     * @param {SalesAuditEnvelopeCreateArgs} args - Arguments to create a SalesAuditEnvelope.
     * @example
     * // Create one SalesAuditEnvelope
     * const SalesAuditEnvelope = await prisma.salesAuditEnvelope.create({
     *   data: {
     *     // ... data to create a SalesAuditEnvelope
     *   }
     * })
     * 
     */
    create<T extends SalesAuditEnvelopeCreateArgs>(args: SelectSubset<T, SalesAuditEnvelopeCreateArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SalesAuditEnvelopes.
     * @param {SalesAuditEnvelopeCreateManyArgs} args - Arguments to create many SalesAuditEnvelopes.
     * @example
     * // Create many SalesAuditEnvelopes
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SalesAuditEnvelopeCreateManyArgs>(args?: SelectSubset<T, SalesAuditEnvelopeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SalesAuditEnvelopes and returns the data saved in the database.
     * @param {SalesAuditEnvelopeCreateManyAndReturnArgs} args - Arguments to create many SalesAuditEnvelopes.
     * @example
     * // Create many SalesAuditEnvelopes
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SalesAuditEnvelopes and only return the `id`
     * const salesAuditEnvelopeWithIdOnly = await prisma.salesAuditEnvelope.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SalesAuditEnvelopeCreateManyAndReturnArgs>(args?: SelectSubset<T, SalesAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SalesAuditEnvelope.
     * @param {SalesAuditEnvelopeDeleteArgs} args - Arguments to delete one SalesAuditEnvelope.
     * @example
     * // Delete one SalesAuditEnvelope
     * const SalesAuditEnvelope = await prisma.salesAuditEnvelope.delete({
     *   where: {
     *     // ... filter to delete one SalesAuditEnvelope
     *   }
     * })
     * 
     */
    delete<T extends SalesAuditEnvelopeDeleteArgs>(args: SelectSubset<T, SalesAuditEnvelopeDeleteArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SalesAuditEnvelope.
     * @param {SalesAuditEnvelopeUpdateArgs} args - Arguments to update one SalesAuditEnvelope.
     * @example
     * // Update one SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SalesAuditEnvelopeUpdateArgs>(args: SelectSubset<T, SalesAuditEnvelopeUpdateArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SalesAuditEnvelopes.
     * @param {SalesAuditEnvelopeDeleteManyArgs} args - Arguments to filter SalesAuditEnvelopes to delete.
     * @example
     * // Delete a few SalesAuditEnvelopes
     * const { count } = await prisma.salesAuditEnvelope.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SalesAuditEnvelopeDeleteManyArgs>(args?: SelectSubset<T, SalesAuditEnvelopeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SalesAuditEnvelopes
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SalesAuditEnvelopeUpdateManyArgs>(args: SelectSubset<T, SalesAuditEnvelopeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SalesAuditEnvelopes and returns the data updated in the database.
     * @param {SalesAuditEnvelopeUpdateManyAndReturnArgs} args - Arguments to update many SalesAuditEnvelopes.
     * @example
     * // Update many SalesAuditEnvelopes
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SalesAuditEnvelopes and only return the `id`
     * const salesAuditEnvelopeWithIdOnly = await prisma.salesAuditEnvelope.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SalesAuditEnvelopeUpdateManyAndReturnArgs>(args: SelectSubset<T, SalesAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SalesAuditEnvelope.
     * @param {SalesAuditEnvelopeUpsertArgs} args - Arguments to update or create a SalesAuditEnvelope.
     * @example
     * // Update or create a SalesAuditEnvelope
     * const salesAuditEnvelope = await prisma.salesAuditEnvelope.upsert({
     *   create: {
     *     // ... data to create a SalesAuditEnvelope
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SalesAuditEnvelope we want to update
     *   }
     * })
     */
    upsert<T extends SalesAuditEnvelopeUpsertArgs>(args: SelectSubset<T, SalesAuditEnvelopeUpsertArgs<ExtArgs>>): Prisma__SalesAuditEnvelopeClient<$Result.GetResult<Prisma.$SalesAuditEnvelopePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SalesAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeCountArgs} args - Arguments to filter SalesAuditEnvelopes to count.
     * @example
     * // Count the number of SalesAuditEnvelopes
     * const count = await prisma.salesAuditEnvelope.count({
     *   where: {
     *     // ... the filter for the SalesAuditEnvelopes we want to count
     *   }
     * })
    **/
    count<T extends SalesAuditEnvelopeCountArgs>(
      args?: Subset<T, SalesAuditEnvelopeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SalesAuditEnvelopeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SalesAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SalesAuditEnvelopeAggregateArgs>(args: Subset<T, SalesAuditEnvelopeAggregateArgs>): Prisma.PrismaPromise<GetSalesAuditEnvelopeAggregateType<T>>

    /**
     * Group by SalesAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SalesAuditEnvelopeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SalesAuditEnvelopeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SalesAuditEnvelopeGroupByArgs['orderBy'] }
        : { orderBy?: SalesAuditEnvelopeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SalesAuditEnvelopeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSalesAuditEnvelopeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SalesAuditEnvelope model
   */
  readonly fields: SalesAuditEnvelopeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SalesAuditEnvelope.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SalesAuditEnvelopeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SalesAuditEnvelope model
   */ 
  interface SalesAuditEnvelopeFieldRefs {
    readonly id: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly service: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly module: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly eventType: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly occurredAt: FieldRef<"SalesAuditEnvelope", 'DateTime'>
    readonly result: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly operatorId: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly operatorType: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly tenantId: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly orgId: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly traceId: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly resourceType: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly resourceId: FieldRef<"SalesAuditEnvelope", 'String'>
    readonly details: FieldRef<"SalesAuditEnvelope", 'Json'>
    readonly createdAt: FieldRef<"SalesAuditEnvelope", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SalesAuditEnvelope findUnique
   */
  export type SalesAuditEnvelopeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SalesAuditEnvelope to fetch.
     */
    where: SalesAuditEnvelopeWhereUniqueInput
  }

  /**
   * SalesAuditEnvelope findUniqueOrThrow
   */
  export type SalesAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SalesAuditEnvelope to fetch.
     */
    where: SalesAuditEnvelopeWhereUniqueInput
  }

  /**
   * SalesAuditEnvelope findFirst
   */
  export type SalesAuditEnvelopeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SalesAuditEnvelope to fetch.
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesAuditEnvelopes to fetch.
     */
    orderBy?: SalesAuditEnvelopeOrderByWithRelationInput | SalesAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesAuditEnvelopes.
     */
    cursor?: SalesAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesAuditEnvelopes.
     */
    distinct?: SalesAuditEnvelopeScalarFieldEnum | SalesAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SalesAuditEnvelope findFirstOrThrow
   */
  export type SalesAuditEnvelopeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SalesAuditEnvelope to fetch.
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesAuditEnvelopes to fetch.
     */
    orderBy?: SalesAuditEnvelopeOrderByWithRelationInput | SalesAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SalesAuditEnvelopes.
     */
    cursor?: SalesAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SalesAuditEnvelopes.
     */
    distinct?: SalesAuditEnvelopeScalarFieldEnum | SalesAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SalesAuditEnvelope findMany
   */
  export type SalesAuditEnvelopeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SalesAuditEnvelopes to fetch.
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SalesAuditEnvelopes to fetch.
     */
    orderBy?: SalesAuditEnvelopeOrderByWithRelationInput | SalesAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SalesAuditEnvelopes.
     */
    cursor?: SalesAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SalesAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SalesAuditEnvelopes.
     */
    skip?: number
    distinct?: SalesAuditEnvelopeScalarFieldEnum | SalesAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SalesAuditEnvelope create
   */
  export type SalesAuditEnvelopeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to create a SalesAuditEnvelope.
     */
    data: XOR<SalesAuditEnvelopeCreateInput, SalesAuditEnvelopeUncheckedCreateInput>
  }

  /**
   * SalesAuditEnvelope createMany
   */
  export type SalesAuditEnvelopeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SalesAuditEnvelopes.
     */
    data: SalesAuditEnvelopeCreateManyInput | SalesAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesAuditEnvelope createManyAndReturn
   */
  export type SalesAuditEnvelopeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to create many SalesAuditEnvelopes.
     */
    data: SalesAuditEnvelopeCreateManyInput | SalesAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SalesAuditEnvelope update
   */
  export type SalesAuditEnvelopeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to update a SalesAuditEnvelope.
     */
    data: XOR<SalesAuditEnvelopeUpdateInput, SalesAuditEnvelopeUncheckedUpdateInput>
    /**
     * Choose, which SalesAuditEnvelope to update.
     */
    where: SalesAuditEnvelopeWhereUniqueInput
  }

  /**
   * SalesAuditEnvelope updateMany
   */
  export type SalesAuditEnvelopeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SalesAuditEnvelopes.
     */
    data: XOR<SalesAuditEnvelopeUpdateManyMutationInput, SalesAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which SalesAuditEnvelopes to update
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * Limit how many SalesAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * SalesAuditEnvelope updateManyAndReturn
   */
  export type SalesAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to update SalesAuditEnvelopes.
     */
    data: XOR<SalesAuditEnvelopeUpdateManyMutationInput, SalesAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which SalesAuditEnvelopes to update
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * Limit how many SalesAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * SalesAuditEnvelope upsert
   */
  export type SalesAuditEnvelopeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The filter to search for the SalesAuditEnvelope to update in case it exists.
     */
    where: SalesAuditEnvelopeWhereUniqueInput
    /**
     * In case the SalesAuditEnvelope found by the `where` argument doesn't exist, create a new SalesAuditEnvelope with this data.
     */
    create: XOR<SalesAuditEnvelopeCreateInput, SalesAuditEnvelopeUncheckedCreateInput>
    /**
     * In case the SalesAuditEnvelope was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SalesAuditEnvelopeUpdateInput, SalesAuditEnvelopeUncheckedUpdateInput>
  }

  /**
   * SalesAuditEnvelope delete
   */
  export type SalesAuditEnvelopeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter which SalesAuditEnvelope to delete.
     */
    where: SalesAuditEnvelopeWhereUniqueInput
  }

  /**
   * SalesAuditEnvelope deleteMany
   */
  export type SalesAuditEnvelopeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SalesAuditEnvelopes to delete
     */
    where?: SalesAuditEnvelopeWhereInput
    /**
     * Limit how many SalesAuditEnvelopes to delete.
     */
    limit?: number
  }

  /**
   * SalesAuditEnvelope without action
   */
  export type SalesAuditEnvelopeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SalesAuditEnvelope
     */
    select?: SalesAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SalesAuditEnvelope
     */
    omit?: SalesAuditEnvelopeOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const SalesSequenceCounterScalarFieldEnum: {
    tenantId: 'tenantId',
    nextQuoteNo: 'nextQuoteNo',
    nextSalesOrderNo: 'nextSalesOrderNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesSequenceCounterScalarFieldEnum = (typeof SalesSequenceCounterScalarFieldEnum)[keyof typeof SalesSequenceCounterScalarFieldEnum]


  export const SalesQuoteScalarFieldEnum: {
    id: 'id',
    quoteNo: 'quoteNo',
    tenantId: 'tenantId',
    customerTenantPartyId: 'customerTenantPartyId',
    opportunityId: 'opportunityId',
    opportunityNo: 'opportunityNo',
    opportunityName: 'opportunityName',
    status: 'status',
    latestPublishedVersionId: 'latestPublishedVersionId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesQuoteScalarFieldEnum = (typeof SalesQuoteScalarFieldEnum)[keyof typeof SalesQuoteScalarFieldEnum]


  export const SalesQuoteLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    quoteId: 'quoteId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    itemSnapshot: 'itemSnapshot',
    salesConfigSnapshot: 'salesConfigSnapshot',
    packagingRequirementSnapshot: 'packagingRequirementSnapshot',
    priceQuantityDeliverySnapshot: 'priceQuantityDeliverySnapshot',
    customerItemSnapshot: 'customerItemSnapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesQuoteLineScalarFieldEnum = (typeof SalesQuoteLineScalarFieldEnum)[keyof typeof SalesQuoteLineScalarFieldEnum]


  export const SalesQuoteVersionScalarFieldEnum: {
    id: 'id',
    quoteId: 'quoteId',
    quoteNo: 'quoteNo',
    versionNo: 'versionNo',
    tenantId: 'tenantId',
    customerTenantPartyId: 'customerTenantPartyId',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt'
  };

  export type SalesQuoteVersionScalarFieldEnum = (typeof SalesQuoteVersionScalarFieldEnum)[keyof typeof SalesQuoteVersionScalarFieldEnum]


  export const SalesQuoteVersionLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    quoteVersionId: 'quoteVersionId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    itemSnapshot: 'itemSnapshot',
    salesConfigSnapshot: 'salesConfigSnapshot',
    packagingRequirementSnapshot: 'packagingRequirementSnapshot',
    priceQuantityDeliverySnapshot: 'priceQuantityDeliverySnapshot',
    customerItemSnapshot: 'customerItemSnapshot',
    createdAt: 'createdAt'
  };

  export type SalesQuoteVersionLineScalarFieldEnum = (typeof SalesQuoteVersionLineScalarFieldEnum)[keyof typeof SalesQuoteVersionLineScalarFieldEnum]


  export const SalesOrderScalarFieldEnum: {
    id: 'id',
    salesOrderNo: 'salesOrderNo',
    tenantId: 'tenantId',
    customerTenantPartyId: 'customerTenantPartyId',
    quoteId: 'quoteId',
    quoteVersionId: 'quoteVersionId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesOrderScalarFieldEnum = (typeof SalesOrderScalarFieldEnum)[keyof typeof SalesOrderScalarFieldEnum]


  export const SalesOrderCommercialGateSummaryScalarFieldEnum: {
    salesOrderId: 'salesOrderId',
    tenantId: 'tenantId',
    orderEstablished: 'orderEstablished',
    productionGate: 'productionGate',
    stockingGate: 'stockingGate',
    shippingGate: 'shippingGate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesOrderCommercialGateSummaryScalarFieldEnum = (typeof SalesOrderCommercialGateSummaryScalarFieldEnum)[keyof typeof SalesOrderCommercialGateSummaryScalarFieldEnum]


  export const SalesOrderFulfillmentHandoffSummaryScalarFieldEnum: {
    salesOrderId: 'salesOrderId',
    tenantId: 'tenantId',
    status: 'status',
    submittedAt: 'submittedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesOrderFulfillmentHandoffSummaryScalarFieldEnum = (typeof SalesOrderFulfillmentHandoffSummaryScalarFieldEnum)[keyof typeof SalesOrderFulfillmentHandoffSummaryScalarFieldEnum]


  export const SalesOrderLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    salesOrderId: 'salesOrderId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    itemSnapshot: 'itemSnapshot',
    salesConfigSnapshot: 'salesConfigSnapshot',
    packagingRequirementSnapshot: 'packagingRequirementSnapshot',
    priceQuantityDeliverySnapshot: 'priceQuantityDeliverySnapshot',
    customerItemSnapshot: 'customerItemSnapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesOrderLineScalarFieldEnum = (typeof SalesOrderLineScalarFieldEnum)[keyof typeof SalesOrderLineScalarFieldEnum]


  export const SalesPriceListScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    priceListName: 'priceListName',
    priceListType: 'priceListType',
    status: 'status',
    currencyCode: 'currencyCode',
    effectiveFrom: 'effectiveFrom',
    effectiveTo: 'effectiveTo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesPriceListScalarFieldEnum = (typeof SalesPriceListScalarFieldEnum)[keyof typeof SalesPriceListScalarFieldEnum]


  export const SalesPriceListLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    priceListId: 'priceListId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    brandKey: 'brandKey',
    priceSnapshot: 'priceSnapshot',
    moqSnapshot: 'moqSnapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesPriceListLineScalarFieldEnum = (typeof SalesPriceListLineScalarFieldEnum)[keyof typeof SalesPriceListLineScalarFieldEnum]


  export const SalesCustomerPriceAgreementVersionScalarFieldEnum: {
    id: 'id',
    customerPriceAgreementId: 'customerPriceAgreementId',
    tenantId: 'tenantId',
    customerTenantPartyId: 'customerTenantPartyId',
    currencyCode: 'currencyCode',
    versionNo: 'versionNo',
    status: 'status',
    publishedAt: 'publishedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesCustomerPriceAgreementVersionScalarFieldEnum = (typeof SalesCustomerPriceAgreementVersionScalarFieldEnum)[keyof typeof SalesCustomerPriceAgreementVersionScalarFieldEnum]


  export const SalesCustomerPriceAgreementLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    customerPriceAgreementVersionId: 'customerPriceAgreementVersionId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    brandKey: 'brandKey',
    priceSnapshot: 'priceSnapshot',
    moqSnapshot: 'moqSnapshot',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SalesCustomerPriceAgreementLineScalarFieldEnum = (typeof SalesCustomerPriceAgreementLineScalarFieldEnum)[keyof typeof SalesCustomerPriceAgreementLineScalarFieldEnum]


  export const SalesAuditEnvelopeScalarFieldEnum: {
    id: 'id',
    service: 'service',
    module: 'module',
    eventType: 'eventType',
    occurredAt: 'occurredAt',
    result: 'result',
    operatorId: 'operatorId',
    operatorType: 'operatorType',
    tenantId: 'tenantId',
    orgId: 'orgId',
    traceId: 'traceId',
    resourceType: 'resourceType',
    resourceId: 'resourceId',
    details: 'details',
    createdAt: 'createdAt'
  };

  export type SalesAuditEnvelopeScalarFieldEnum = (typeof SalesAuditEnvelopeScalarFieldEnum)[keyof typeof SalesAuditEnvelopeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'SalesQuoteStatus'
   */
  export type EnumSalesQuoteStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SalesQuoteStatus'>
    


  /**
   * Reference to a field of type 'SalesQuoteStatus[]'
   */
  export type ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SalesQuoteStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'SalesFulfillmentHandoffStatus'
   */
  export type EnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SalesFulfillmentHandoffStatus'>
    


  /**
   * Reference to a field of type 'SalesFulfillmentHandoffStatus[]'
   */
  export type ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SalesFulfillmentHandoffStatus[]'>
    


  /**
   * Reference to a field of type 'PriceListType'
   */
  export type EnumPriceListTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceListType'>
    


  /**
   * Reference to a field of type 'PriceListType[]'
   */
  export type ListEnumPriceListTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceListType[]'>
    


  /**
   * Reference to a field of type 'PriceListStatus'
   */
  export type EnumPriceListStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceListStatus'>
    


  /**
   * Reference to a field of type 'PriceListStatus[]'
   */
  export type ListEnumPriceListStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PriceListStatus[]'>
    


  /**
   * Reference to a field of type 'CustomerPriceAgreementStatus'
   */
  export type EnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CustomerPriceAgreementStatus'>
    


  /**
   * Reference to a field of type 'CustomerPriceAgreementStatus[]'
   */
  export type ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CustomerPriceAgreementStatus[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type SalesSequenceCounterWhereInput = {
    AND?: SalesSequenceCounterWhereInput | SalesSequenceCounterWhereInput[]
    OR?: SalesSequenceCounterWhereInput[]
    NOT?: SalesSequenceCounterWhereInput | SalesSequenceCounterWhereInput[]
    tenantId?: StringFilter<"SalesSequenceCounter"> | string
    nextQuoteNo?: IntFilter<"SalesSequenceCounter"> | number
    nextSalesOrderNo?: IntFilter<"SalesSequenceCounter"> | number
    createdAt?: DateTimeFilter<"SalesSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"SalesSequenceCounter"> | Date | string
  }

  export type SalesSequenceCounterOrderByWithRelationInput = {
    tenantId?: SortOrder
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesSequenceCounterWhereUniqueInput = Prisma.AtLeast<{
    tenantId?: string
    AND?: SalesSequenceCounterWhereInput | SalesSequenceCounterWhereInput[]
    OR?: SalesSequenceCounterWhereInput[]
    NOT?: SalesSequenceCounterWhereInput | SalesSequenceCounterWhereInput[]
    nextQuoteNo?: IntFilter<"SalesSequenceCounter"> | number
    nextSalesOrderNo?: IntFilter<"SalesSequenceCounter"> | number
    createdAt?: DateTimeFilter<"SalesSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"SalesSequenceCounter"> | Date | string
  }, "tenantId">

  export type SalesSequenceCounterOrderByWithAggregationInput = {
    tenantId?: SortOrder
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesSequenceCounterCountOrderByAggregateInput
    _avg?: SalesSequenceCounterAvgOrderByAggregateInput
    _max?: SalesSequenceCounterMaxOrderByAggregateInput
    _min?: SalesSequenceCounterMinOrderByAggregateInput
    _sum?: SalesSequenceCounterSumOrderByAggregateInput
  }

  export type SalesSequenceCounterScalarWhereWithAggregatesInput = {
    AND?: SalesSequenceCounterScalarWhereWithAggregatesInput | SalesSequenceCounterScalarWhereWithAggregatesInput[]
    OR?: SalesSequenceCounterScalarWhereWithAggregatesInput[]
    NOT?: SalesSequenceCounterScalarWhereWithAggregatesInput | SalesSequenceCounterScalarWhereWithAggregatesInput[]
    tenantId?: StringWithAggregatesFilter<"SalesSequenceCounter"> | string
    nextQuoteNo?: IntWithAggregatesFilter<"SalesSequenceCounter"> | number
    nextSalesOrderNo?: IntWithAggregatesFilter<"SalesSequenceCounter"> | number
    createdAt?: DateTimeWithAggregatesFilter<"SalesSequenceCounter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesSequenceCounter"> | Date | string
  }

  export type SalesQuoteWhereInput = {
    AND?: SalesQuoteWhereInput | SalesQuoteWhereInput[]
    OR?: SalesQuoteWhereInput[]
    NOT?: SalesQuoteWhereInput | SalesQuoteWhereInput[]
    id?: UuidFilter<"SalesQuote"> | string
    quoteNo?: StringFilter<"SalesQuote"> | string
    tenantId?: StringFilter<"SalesQuote"> | string
    customerTenantPartyId?: StringFilter<"SalesQuote"> | string
    opportunityId?: StringNullableFilter<"SalesQuote"> | string | null
    opportunityNo?: StringNullableFilter<"SalesQuote"> | string | null
    opportunityName?: StringNullableFilter<"SalesQuote"> | string | null
    status?: EnumSalesQuoteStatusFilter<"SalesQuote"> | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: UuidNullableFilter<"SalesQuote"> | string | null
    createdAt?: DateTimeFilter<"SalesQuote"> | Date | string
    updatedAt?: DateTimeFilter<"SalesQuote"> | Date | string
    lines?: SalesQuoteLineListRelationFilter
  }

  export type SalesQuoteOrderByWithRelationInput = {
    id?: SortOrder
    quoteNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    opportunityId?: SortOrderInput | SortOrder
    opportunityNo?: SortOrderInput | SortOrder
    opportunityName?: SortOrderInput | SortOrder
    status?: SortOrder
    latestPublishedVersionId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lines?: SalesQuoteLineOrderByRelationAggregateInput
  }

  export type SalesQuoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quoteNo?: string
    AND?: SalesQuoteWhereInput | SalesQuoteWhereInput[]
    OR?: SalesQuoteWhereInput[]
    NOT?: SalesQuoteWhereInput | SalesQuoteWhereInput[]
    tenantId?: StringFilter<"SalesQuote"> | string
    customerTenantPartyId?: StringFilter<"SalesQuote"> | string
    opportunityId?: StringNullableFilter<"SalesQuote"> | string | null
    opportunityNo?: StringNullableFilter<"SalesQuote"> | string | null
    opportunityName?: StringNullableFilter<"SalesQuote"> | string | null
    status?: EnumSalesQuoteStatusFilter<"SalesQuote"> | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: UuidNullableFilter<"SalesQuote"> | string | null
    createdAt?: DateTimeFilter<"SalesQuote"> | Date | string
    updatedAt?: DateTimeFilter<"SalesQuote"> | Date | string
    lines?: SalesQuoteLineListRelationFilter
  }, "id" | "quoteNo">

  export type SalesQuoteOrderByWithAggregationInput = {
    id?: SortOrder
    quoteNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    opportunityId?: SortOrderInput | SortOrder
    opportunityNo?: SortOrderInput | SortOrder
    opportunityName?: SortOrderInput | SortOrder
    status?: SortOrder
    latestPublishedVersionId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesQuoteCountOrderByAggregateInput
    _max?: SalesQuoteMaxOrderByAggregateInput
    _min?: SalesQuoteMinOrderByAggregateInput
  }

  export type SalesQuoteScalarWhereWithAggregatesInput = {
    AND?: SalesQuoteScalarWhereWithAggregatesInput | SalesQuoteScalarWhereWithAggregatesInput[]
    OR?: SalesQuoteScalarWhereWithAggregatesInput[]
    NOT?: SalesQuoteScalarWhereWithAggregatesInput | SalesQuoteScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesQuote"> | string
    quoteNo?: StringWithAggregatesFilter<"SalesQuote"> | string
    tenantId?: StringWithAggregatesFilter<"SalesQuote"> | string
    customerTenantPartyId?: StringWithAggregatesFilter<"SalesQuote"> | string
    opportunityId?: StringNullableWithAggregatesFilter<"SalesQuote"> | string | null
    opportunityNo?: StringNullableWithAggregatesFilter<"SalesQuote"> | string | null
    opportunityName?: StringNullableWithAggregatesFilter<"SalesQuote"> | string | null
    status?: EnumSalesQuoteStatusWithAggregatesFilter<"SalesQuote"> | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: UuidNullableWithAggregatesFilter<"SalesQuote"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SalesQuote"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesQuote"> | Date | string
  }

  export type SalesQuoteLineWhereInput = {
    AND?: SalesQuoteLineWhereInput | SalesQuoteLineWhereInput[]
    OR?: SalesQuoteLineWhereInput[]
    NOT?: SalesQuoteLineWhereInput | SalesQuoteLineWhereInput[]
    id?: UuidFilter<"SalesQuoteLine"> | string
    tenantId?: StringFilter<"SalesQuoteLine"> | string
    quoteId?: UuidFilter<"SalesQuoteLine"> | string
    lineNo?: IntFilter<"SalesQuoteLine"> | number
    itemId?: StringFilter<"SalesQuoteLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteLine">
    createdAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
    quote?: XOR<SalesQuoteScalarRelationFilter, SalesQuoteWhereInput>
  }

  export type SalesQuoteLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quote?: SalesQuoteOrderByWithRelationInput
  }

  export type SalesQuoteLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quoteId_lineNo?: SalesQuoteLineQuoteIdLineNoCompoundUniqueInput
    AND?: SalesQuoteLineWhereInput | SalesQuoteLineWhereInput[]
    OR?: SalesQuoteLineWhereInput[]
    NOT?: SalesQuoteLineWhereInput | SalesQuoteLineWhereInput[]
    tenantId?: StringFilter<"SalesQuoteLine"> | string
    quoteId?: UuidFilter<"SalesQuoteLine"> | string
    lineNo?: IntFilter<"SalesQuoteLine"> | number
    itemId?: StringFilter<"SalesQuoteLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteLine">
    createdAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
    quote?: XOR<SalesQuoteScalarRelationFilter, SalesQuoteWhereInput>
  }, "id" | "quoteId_lineNo">

  export type SalesQuoteLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesQuoteLineCountOrderByAggregateInput
    _avg?: SalesQuoteLineAvgOrderByAggregateInput
    _max?: SalesQuoteLineMaxOrderByAggregateInput
    _min?: SalesQuoteLineMinOrderByAggregateInput
    _sum?: SalesQuoteLineSumOrderByAggregateInput
  }

  export type SalesQuoteLineScalarWhereWithAggregatesInput = {
    AND?: SalesQuoteLineScalarWhereWithAggregatesInput | SalesQuoteLineScalarWhereWithAggregatesInput[]
    OR?: SalesQuoteLineScalarWhereWithAggregatesInput[]
    NOT?: SalesQuoteLineScalarWhereWithAggregatesInput | SalesQuoteLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesQuoteLine"> | string
    tenantId?: StringWithAggregatesFilter<"SalesQuoteLine"> | string
    quoteId?: UuidWithAggregatesFilter<"SalesQuoteLine"> | string
    lineNo?: IntWithAggregatesFilter<"SalesQuoteLine"> | number
    itemId?: StringWithAggregatesFilter<"SalesQuoteLine"> | string
    itemSnapshot?: JsonWithAggregatesFilter<"SalesQuoteLine">
    salesConfigSnapshot?: JsonWithAggregatesFilter<"SalesQuoteLine">
    packagingRequirementSnapshot?: JsonWithAggregatesFilter<"SalesQuoteLine">
    priceQuantityDeliverySnapshot?: JsonWithAggregatesFilter<"SalesQuoteLine">
    customerItemSnapshot?: JsonWithAggregatesFilter<"SalesQuoteLine">
    createdAt?: DateTimeWithAggregatesFilter<"SalesQuoteLine"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesQuoteLine"> | Date | string
  }

  export type SalesQuoteVersionWhereInput = {
    AND?: SalesQuoteVersionWhereInput | SalesQuoteVersionWhereInput[]
    OR?: SalesQuoteVersionWhereInput[]
    NOT?: SalesQuoteVersionWhereInput | SalesQuoteVersionWhereInput[]
    id?: UuidFilter<"SalesQuoteVersion"> | string
    quoteId?: UuidFilter<"SalesQuoteVersion"> | string
    quoteNo?: StringFilter<"SalesQuoteVersion"> | string
    versionNo?: IntFilter<"SalesQuoteVersion"> | number
    tenantId?: StringFilter<"SalesQuoteVersion"> | string
    customerTenantPartyId?: StringFilter<"SalesQuoteVersion"> | string
    publishedAt?: DateTimeFilter<"SalesQuoteVersion"> | Date | string
    createdAt?: DateTimeFilter<"SalesQuoteVersion"> | Date | string
    lines?: SalesQuoteVersionLineListRelationFilter
  }

  export type SalesQuoteVersionOrderByWithRelationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    quoteNo?: SortOrder
    versionNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    lines?: SalesQuoteVersionLineOrderByRelationAggregateInput
  }

  export type SalesQuoteVersionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quoteId_versionNo?: SalesQuoteVersionQuoteIdVersionNoCompoundUniqueInput
    AND?: SalesQuoteVersionWhereInput | SalesQuoteVersionWhereInput[]
    OR?: SalesQuoteVersionWhereInput[]
    NOT?: SalesQuoteVersionWhereInput | SalesQuoteVersionWhereInput[]
    quoteId?: UuidFilter<"SalesQuoteVersion"> | string
    quoteNo?: StringFilter<"SalesQuoteVersion"> | string
    versionNo?: IntFilter<"SalesQuoteVersion"> | number
    tenantId?: StringFilter<"SalesQuoteVersion"> | string
    customerTenantPartyId?: StringFilter<"SalesQuoteVersion"> | string
    publishedAt?: DateTimeFilter<"SalesQuoteVersion"> | Date | string
    createdAt?: DateTimeFilter<"SalesQuoteVersion"> | Date | string
    lines?: SalesQuoteVersionLineListRelationFilter
  }, "id" | "quoteId_versionNo">

  export type SalesQuoteVersionOrderByWithAggregationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    quoteNo?: SortOrder
    versionNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    _count?: SalesQuoteVersionCountOrderByAggregateInput
    _avg?: SalesQuoteVersionAvgOrderByAggregateInput
    _max?: SalesQuoteVersionMaxOrderByAggregateInput
    _min?: SalesQuoteVersionMinOrderByAggregateInput
    _sum?: SalesQuoteVersionSumOrderByAggregateInput
  }

  export type SalesQuoteVersionScalarWhereWithAggregatesInput = {
    AND?: SalesQuoteVersionScalarWhereWithAggregatesInput | SalesQuoteVersionScalarWhereWithAggregatesInput[]
    OR?: SalesQuoteVersionScalarWhereWithAggregatesInput[]
    NOT?: SalesQuoteVersionScalarWhereWithAggregatesInput | SalesQuoteVersionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesQuoteVersion"> | string
    quoteId?: UuidWithAggregatesFilter<"SalesQuoteVersion"> | string
    quoteNo?: StringWithAggregatesFilter<"SalesQuoteVersion"> | string
    versionNo?: IntWithAggregatesFilter<"SalesQuoteVersion"> | number
    tenantId?: StringWithAggregatesFilter<"SalesQuoteVersion"> | string
    customerTenantPartyId?: StringWithAggregatesFilter<"SalesQuoteVersion"> | string
    publishedAt?: DateTimeWithAggregatesFilter<"SalesQuoteVersion"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"SalesQuoteVersion"> | Date | string
  }

  export type SalesQuoteVersionLineWhereInput = {
    AND?: SalesQuoteVersionLineWhereInput | SalesQuoteVersionLineWhereInput[]
    OR?: SalesQuoteVersionLineWhereInput[]
    NOT?: SalesQuoteVersionLineWhereInput | SalesQuoteVersionLineWhereInput[]
    id?: UuidFilter<"SalesQuoteVersionLine"> | string
    tenantId?: StringFilter<"SalesQuoteVersionLine"> | string
    quoteVersionId?: UuidFilter<"SalesQuoteVersionLine"> | string
    lineNo?: IntFilter<"SalesQuoteVersionLine"> | number
    itemId?: StringFilter<"SalesQuoteVersionLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteVersionLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    createdAt?: DateTimeFilter<"SalesQuoteVersionLine"> | Date | string
    quoteVersion?: XOR<SalesQuoteVersionScalarRelationFilter, SalesQuoteVersionWhereInput>
  }

  export type SalesQuoteVersionLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    quoteVersion?: SalesQuoteVersionOrderByWithRelationInput
  }

  export type SalesQuoteVersionLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quoteVersionId_lineNo?: SalesQuoteVersionLineQuoteVersionIdLineNoCompoundUniqueInput
    AND?: SalesQuoteVersionLineWhereInput | SalesQuoteVersionLineWhereInput[]
    OR?: SalesQuoteVersionLineWhereInput[]
    NOT?: SalesQuoteVersionLineWhereInput | SalesQuoteVersionLineWhereInput[]
    tenantId?: StringFilter<"SalesQuoteVersionLine"> | string
    quoteVersionId?: UuidFilter<"SalesQuoteVersionLine"> | string
    lineNo?: IntFilter<"SalesQuoteVersionLine"> | number
    itemId?: StringFilter<"SalesQuoteVersionLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteVersionLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    createdAt?: DateTimeFilter<"SalesQuoteVersionLine"> | Date | string
    quoteVersion?: XOR<SalesQuoteVersionScalarRelationFilter, SalesQuoteVersionWhereInput>
  }, "id" | "quoteVersionId_lineNo">

  export type SalesQuoteVersionLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    _count?: SalesQuoteVersionLineCountOrderByAggregateInput
    _avg?: SalesQuoteVersionLineAvgOrderByAggregateInput
    _max?: SalesQuoteVersionLineMaxOrderByAggregateInput
    _min?: SalesQuoteVersionLineMinOrderByAggregateInput
    _sum?: SalesQuoteVersionLineSumOrderByAggregateInput
  }

  export type SalesQuoteVersionLineScalarWhereWithAggregatesInput = {
    AND?: SalesQuoteVersionLineScalarWhereWithAggregatesInput | SalesQuoteVersionLineScalarWhereWithAggregatesInput[]
    OR?: SalesQuoteVersionLineScalarWhereWithAggregatesInput[]
    NOT?: SalesQuoteVersionLineScalarWhereWithAggregatesInput | SalesQuoteVersionLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesQuoteVersionLine"> | string
    tenantId?: StringWithAggregatesFilter<"SalesQuoteVersionLine"> | string
    quoteVersionId?: UuidWithAggregatesFilter<"SalesQuoteVersionLine"> | string
    lineNo?: IntWithAggregatesFilter<"SalesQuoteVersionLine"> | number
    itemId?: StringWithAggregatesFilter<"SalesQuoteVersionLine"> | string
    itemSnapshot?: JsonWithAggregatesFilter<"SalesQuoteVersionLine">
    salesConfigSnapshot?: JsonWithAggregatesFilter<"SalesQuoteVersionLine">
    packagingRequirementSnapshot?: JsonWithAggregatesFilter<"SalesQuoteVersionLine">
    priceQuantityDeliverySnapshot?: JsonWithAggregatesFilter<"SalesQuoteVersionLine">
    customerItemSnapshot?: JsonWithAggregatesFilter<"SalesQuoteVersionLine">
    createdAt?: DateTimeWithAggregatesFilter<"SalesQuoteVersionLine"> | Date | string
  }

  export type SalesOrderWhereInput = {
    AND?: SalesOrderWhereInput | SalesOrderWhereInput[]
    OR?: SalesOrderWhereInput[]
    NOT?: SalesOrderWhereInput | SalesOrderWhereInput[]
    id?: UuidFilter<"SalesOrder"> | string
    salesOrderNo?: StringFilter<"SalesOrder"> | string
    tenantId?: StringFilter<"SalesOrder"> | string
    customerTenantPartyId?: StringFilter<"SalesOrder"> | string
    quoteId?: UuidFilter<"SalesOrder"> | string
    quoteVersionId?: UuidFilter<"SalesOrder"> | string
    createdAt?: DateTimeFilter<"SalesOrder"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrder"> | Date | string
    lines?: SalesOrderLineListRelationFilter
    commercialGateSummary?: XOR<SalesOrderCommercialGateSummaryNullableScalarRelationFilter, SalesOrderCommercialGateSummaryWhereInput> | null
    fulfillmentHandoffSummary?: XOR<SalesOrderFulfillmentHandoffSummaryNullableScalarRelationFilter, SalesOrderFulfillmentHandoffSummaryWhereInput> | null
  }

  export type SalesOrderOrderByWithRelationInput = {
    id?: SortOrder
    salesOrderNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    quoteId?: SortOrder
    quoteVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lines?: SalesOrderLineOrderByRelationAggregateInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryOrderByWithRelationInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput
  }

  export type SalesOrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    salesOrderNo?: string
    quoteVersionId?: string
    AND?: SalesOrderWhereInput | SalesOrderWhereInput[]
    OR?: SalesOrderWhereInput[]
    NOT?: SalesOrderWhereInput | SalesOrderWhereInput[]
    tenantId?: StringFilter<"SalesOrder"> | string
    customerTenantPartyId?: StringFilter<"SalesOrder"> | string
    quoteId?: UuidFilter<"SalesOrder"> | string
    createdAt?: DateTimeFilter<"SalesOrder"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrder"> | Date | string
    lines?: SalesOrderLineListRelationFilter
    commercialGateSummary?: XOR<SalesOrderCommercialGateSummaryNullableScalarRelationFilter, SalesOrderCommercialGateSummaryWhereInput> | null
    fulfillmentHandoffSummary?: XOR<SalesOrderFulfillmentHandoffSummaryNullableScalarRelationFilter, SalesOrderFulfillmentHandoffSummaryWhereInput> | null
  }, "id" | "salesOrderNo" | "quoteVersionId">

  export type SalesOrderOrderByWithAggregationInput = {
    id?: SortOrder
    salesOrderNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    quoteId?: SortOrder
    quoteVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesOrderCountOrderByAggregateInput
    _max?: SalesOrderMaxOrderByAggregateInput
    _min?: SalesOrderMinOrderByAggregateInput
  }

  export type SalesOrderScalarWhereWithAggregatesInput = {
    AND?: SalesOrderScalarWhereWithAggregatesInput | SalesOrderScalarWhereWithAggregatesInput[]
    OR?: SalesOrderScalarWhereWithAggregatesInput[]
    NOT?: SalesOrderScalarWhereWithAggregatesInput | SalesOrderScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesOrder"> | string
    salesOrderNo?: StringWithAggregatesFilter<"SalesOrder"> | string
    tenantId?: StringWithAggregatesFilter<"SalesOrder"> | string
    customerTenantPartyId?: StringWithAggregatesFilter<"SalesOrder"> | string
    quoteId?: UuidWithAggregatesFilter<"SalesOrder"> | string
    quoteVersionId?: UuidWithAggregatesFilter<"SalesOrder"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SalesOrder"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesOrder"> | Date | string
  }

  export type SalesOrderCommercialGateSummaryWhereInput = {
    AND?: SalesOrderCommercialGateSummaryWhereInput | SalesOrderCommercialGateSummaryWhereInput[]
    OR?: SalesOrderCommercialGateSummaryWhereInput[]
    NOT?: SalesOrderCommercialGateSummaryWhereInput | SalesOrderCommercialGateSummaryWhereInput[]
    salesOrderId?: UuidFilter<"SalesOrderCommercialGateSummary"> | string
    tenantId?: StringFilter<"SalesOrderCommercialGateSummary"> | string
    orderEstablished?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    productionGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    stockingGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    shippingGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    createdAt?: DateTimeFilter<"SalesOrderCommercialGateSummary"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderCommercialGateSummary"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }

  export type SalesOrderCommercialGateSummaryOrderByWithRelationInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    orderEstablished?: SortOrder
    productionGate?: SortOrder
    stockingGate?: SortOrder
    shippingGate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    salesOrder?: SalesOrderOrderByWithRelationInput
  }

  export type SalesOrderCommercialGateSummaryWhereUniqueInput = Prisma.AtLeast<{
    salesOrderId?: string
    AND?: SalesOrderCommercialGateSummaryWhereInput | SalesOrderCommercialGateSummaryWhereInput[]
    OR?: SalesOrderCommercialGateSummaryWhereInput[]
    NOT?: SalesOrderCommercialGateSummaryWhereInput | SalesOrderCommercialGateSummaryWhereInput[]
    tenantId?: StringFilter<"SalesOrderCommercialGateSummary"> | string
    orderEstablished?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    productionGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    stockingGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    shippingGate?: BoolFilter<"SalesOrderCommercialGateSummary"> | boolean
    createdAt?: DateTimeFilter<"SalesOrderCommercialGateSummary"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderCommercialGateSummary"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }, "salesOrderId">

  export type SalesOrderCommercialGateSummaryOrderByWithAggregationInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    orderEstablished?: SortOrder
    productionGate?: SortOrder
    stockingGate?: SortOrder
    shippingGate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesOrderCommercialGateSummaryCountOrderByAggregateInput
    _max?: SalesOrderCommercialGateSummaryMaxOrderByAggregateInput
    _min?: SalesOrderCommercialGateSummaryMinOrderByAggregateInput
  }

  export type SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput = {
    AND?: SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput | SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput[]
    OR?: SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput[]
    NOT?: SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput | SalesOrderCommercialGateSummaryScalarWhereWithAggregatesInput[]
    salesOrderId?: UuidWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | string
    tenantId?: StringWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | string
    orderEstablished?: BoolWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | boolean
    productionGate?: BoolWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | boolean
    stockingGate?: BoolWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | boolean
    shippingGate?: BoolWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesOrderCommercialGateSummary"> | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryWhereInput = {
    AND?: SalesOrderFulfillmentHandoffSummaryWhereInput | SalesOrderFulfillmentHandoffSummaryWhereInput[]
    OR?: SalesOrderFulfillmentHandoffSummaryWhereInput[]
    NOT?: SalesOrderFulfillmentHandoffSummaryWhereInput | SalesOrderFulfillmentHandoffSummaryWhereInput[]
    salesOrderId?: UuidFilter<"SalesOrderFulfillmentHandoffSummary"> | string
    tenantId?: StringFilter<"SalesOrderFulfillmentHandoffSummary"> | string
    status?: EnumSalesFulfillmentHandoffStatusFilter<"SalesOrderFulfillmentHandoffSummary"> | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: DateTimeNullableFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }

  export type SalesOrderFulfillmentHandoffSummaryOrderByWithRelationInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    salesOrder?: SalesOrderOrderByWithRelationInput
  }

  export type SalesOrderFulfillmentHandoffSummaryWhereUniqueInput = Prisma.AtLeast<{
    salesOrderId?: string
    AND?: SalesOrderFulfillmentHandoffSummaryWhereInput | SalesOrderFulfillmentHandoffSummaryWhereInput[]
    OR?: SalesOrderFulfillmentHandoffSummaryWhereInput[]
    NOT?: SalesOrderFulfillmentHandoffSummaryWhereInput | SalesOrderFulfillmentHandoffSummaryWhereInput[]
    tenantId?: StringFilter<"SalesOrderFulfillmentHandoffSummary"> | string
    status?: EnumSalesFulfillmentHandoffStatusFilter<"SalesOrderFulfillmentHandoffSummary"> | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: DateTimeNullableFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }, "salesOrderId">

  export type SalesOrderFulfillmentHandoffSummaryOrderByWithAggregationInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesOrderFulfillmentHandoffSummaryCountOrderByAggregateInput
    _max?: SalesOrderFulfillmentHandoffSummaryMaxOrderByAggregateInput
    _min?: SalesOrderFulfillmentHandoffSummaryMinOrderByAggregateInput
  }

  export type SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput = {
    AND?: SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput | SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput[]
    OR?: SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput[]
    NOT?: SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput | SalesOrderFulfillmentHandoffSummaryScalarWhereWithAggregatesInput[]
    salesOrderId?: UuidWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | string
    tenantId?: StringWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | string
    status?: EnumSalesFulfillmentHandoffStatusWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: DateTimeNullableWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesOrderFulfillmentHandoffSummary"> | Date | string
  }

  export type SalesOrderLineWhereInput = {
    AND?: SalesOrderLineWhereInput | SalesOrderLineWhereInput[]
    OR?: SalesOrderLineWhereInput[]
    NOT?: SalesOrderLineWhereInput | SalesOrderLineWhereInput[]
    id?: UuidFilter<"SalesOrderLine"> | string
    tenantId?: StringFilter<"SalesOrderLine"> | string
    salesOrderId?: UuidFilter<"SalesOrderLine"> | string
    lineNo?: IntFilter<"SalesOrderLine"> | number
    itemId?: StringFilter<"SalesOrderLine"> | string
    itemSnapshot?: JsonFilter<"SalesOrderLine">
    salesConfigSnapshot?: JsonFilter<"SalesOrderLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesOrderLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesOrderLine">
    customerItemSnapshot?: JsonFilter<"SalesOrderLine">
    createdAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }

  export type SalesOrderLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    salesOrderId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    salesOrder?: SalesOrderOrderByWithRelationInput
  }

  export type SalesOrderLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    salesOrderId_lineNo?: SalesOrderLineSalesOrderIdLineNoCompoundUniqueInput
    AND?: SalesOrderLineWhereInput | SalesOrderLineWhereInput[]
    OR?: SalesOrderLineWhereInput[]
    NOT?: SalesOrderLineWhereInput | SalesOrderLineWhereInput[]
    tenantId?: StringFilter<"SalesOrderLine"> | string
    salesOrderId?: UuidFilter<"SalesOrderLine"> | string
    lineNo?: IntFilter<"SalesOrderLine"> | number
    itemId?: StringFilter<"SalesOrderLine"> | string
    itemSnapshot?: JsonFilter<"SalesOrderLine">
    salesConfigSnapshot?: JsonFilter<"SalesOrderLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesOrderLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesOrderLine">
    customerItemSnapshot?: JsonFilter<"SalesOrderLine">
    createdAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
    salesOrder?: XOR<SalesOrderScalarRelationFilter, SalesOrderWhereInput>
  }, "id" | "salesOrderId_lineNo">

  export type SalesOrderLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    salesOrderId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesOrderLineCountOrderByAggregateInput
    _avg?: SalesOrderLineAvgOrderByAggregateInput
    _max?: SalesOrderLineMaxOrderByAggregateInput
    _min?: SalesOrderLineMinOrderByAggregateInput
    _sum?: SalesOrderLineSumOrderByAggregateInput
  }

  export type SalesOrderLineScalarWhereWithAggregatesInput = {
    AND?: SalesOrderLineScalarWhereWithAggregatesInput | SalesOrderLineScalarWhereWithAggregatesInput[]
    OR?: SalesOrderLineScalarWhereWithAggregatesInput[]
    NOT?: SalesOrderLineScalarWhereWithAggregatesInput | SalesOrderLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesOrderLine"> | string
    tenantId?: StringWithAggregatesFilter<"SalesOrderLine"> | string
    salesOrderId?: UuidWithAggregatesFilter<"SalesOrderLine"> | string
    lineNo?: IntWithAggregatesFilter<"SalesOrderLine"> | number
    itemId?: StringWithAggregatesFilter<"SalesOrderLine"> | string
    itemSnapshot?: JsonWithAggregatesFilter<"SalesOrderLine">
    salesConfigSnapshot?: JsonWithAggregatesFilter<"SalesOrderLine">
    packagingRequirementSnapshot?: JsonWithAggregatesFilter<"SalesOrderLine">
    priceQuantityDeliverySnapshot?: JsonWithAggregatesFilter<"SalesOrderLine">
    customerItemSnapshot?: JsonWithAggregatesFilter<"SalesOrderLine">
    createdAt?: DateTimeWithAggregatesFilter<"SalesOrderLine"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesOrderLine"> | Date | string
  }

  export type SalesPriceListWhereInput = {
    AND?: SalesPriceListWhereInput | SalesPriceListWhereInput[]
    OR?: SalesPriceListWhereInput[]
    NOT?: SalesPriceListWhereInput | SalesPriceListWhereInput[]
    id?: UuidFilter<"SalesPriceList"> | string
    tenantId?: StringFilter<"SalesPriceList"> | string
    priceListName?: StringFilter<"SalesPriceList"> | string
    priceListType?: EnumPriceListTypeFilter<"SalesPriceList"> | $Enums.PriceListType
    status?: EnumPriceListStatusFilter<"SalesPriceList"> | $Enums.PriceListStatus
    currencyCode?: StringFilter<"SalesPriceList"> | string
    effectiveFrom?: DateTimeFilter<"SalesPriceList"> | Date | string
    effectiveTo?: DateTimeNullableFilter<"SalesPriceList"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesPriceList"> | Date | string
    updatedAt?: DateTimeFilter<"SalesPriceList"> | Date | string
    lines?: SalesPriceListLineListRelationFilter
  }

  export type SalesPriceListOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListName?: SortOrder
    priceListType?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    effectiveFrom?: SortOrder
    effectiveTo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lines?: SalesPriceListLineOrderByRelationAggregateInput
  }

  export type SalesPriceListWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SalesPriceListWhereInput | SalesPriceListWhereInput[]
    OR?: SalesPriceListWhereInput[]
    NOT?: SalesPriceListWhereInput | SalesPriceListWhereInput[]
    tenantId?: StringFilter<"SalesPriceList"> | string
    priceListName?: StringFilter<"SalesPriceList"> | string
    priceListType?: EnumPriceListTypeFilter<"SalesPriceList"> | $Enums.PriceListType
    status?: EnumPriceListStatusFilter<"SalesPriceList"> | $Enums.PriceListStatus
    currencyCode?: StringFilter<"SalesPriceList"> | string
    effectiveFrom?: DateTimeFilter<"SalesPriceList"> | Date | string
    effectiveTo?: DateTimeNullableFilter<"SalesPriceList"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesPriceList"> | Date | string
    updatedAt?: DateTimeFilter<"SalesPriceList"> | Date | string
    lines?: SalesPriceListLineListRelationFilter
  }, "id">

  export type SalesPriceListOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListName?: SortOrder
    priceListType?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    effectiveFrom?: SortOrder
    effectiveTo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesPriceListCountOrderByAggregateInput
    _max?: SalesPriceListMaxOrderByAggregateInput
    _min?: SalesPriceListMinOrderByAggregateInput
  }

  export type SalesPriceListScalarWhereWithAggregatesInput = {
    AND?: SalesPriceListScalarWhereWithAggregatesInput | SalesPriceListScalarWhereWithAggregatesInput[]
    OR?: SalesPriceListScalarWhereWithAggregatesInput[]
    NOT?: SalesPriceListScalarWhereWithAggregatesInput | SalesPriceListScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesPriceList"> | string
    tenantId?: StringWithAggregatesFilter<"SalesPriceList"> | string
    priceListName?: StringWithAggregatesFilter<"SalesPriceList"> | string
    priceListType?: EnumPriceListTypeWithAggregatesFilter<"SalesPriceList"> | $Enums.PriceListType
    status?: EnumPriceListStatusWithAggregatesFilter<"SalesPriceList"> | $Enums.PriceListStatus
    currencyCode?: StringWithAggregatesFilter<"SalesPriceList"> | string
    effectiveFrom?: DateTimeWithAggregatesFilter<"SalesPriceList"> | Date | string
    effectiveTo?: DateTimeNullableWithAggregatesFilter<"SalesPriceList"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SalesPriceList"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesPriceList"> | Date | string
  }

  export type SalesPriceListLineWhereInput = {
    AND?: SalesPriceListLineWhereInput | SalesPriceListLineWhereInput[]
    OR?: SalesPriceListLineWhereInput[]
    NOT?: SalesPriceListLineWhereInput | SalesPriceListLineWhereInput[]
    id?: UuidFilter<"SalesPriceListLine"> | string
    tenantId?: StringFilter<"SalesPriceListLine"> | string
    priceListId?: UuidFilter<"SalesPriceListLine"> | string
    lineNo?: IntFilter<"SalesPriceListLine"> | number
    itemId?: StringFilter<"SalesPriceListLine"> | string
    brandKey?: StringNullableFilter<"SalesPriceListLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesPriceListLine">
    moqSnapshot?: JsonFilter<"SalesPriceListLine">
    createdAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
    priceList?: XOR<SalesPriceListScalarRelationFilter, SalesPriceListWhereInput>
  }

  export type SalesPriceListLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrderInput | SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    priceList?: SalesPriceListOrderByWithRelationInput
  }

  export type SalesPriceListLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    priceListId_lineNo?: SalesPriceListLinePriceListIdLineNoCompoundUniqueInput
    AND?: SalesPriceListLineWhereInput | SalesPriceListLineWhereInput[]
    OR?: SalesPriceListLineWhereInput[]
    NOT?: SalesPriceListLineWhereInput | SalesPriceListLineWhereInput[]
    tenantId?: StringFilter<"SalesPriceListLine"> | string
    priceListId?: UuidFilter<"SalesPriceListLine"> | string
    lineNo?: IntFilter<"SalesPriceListLine"> | number
    itemId?: StringFilter<"SalesPriceListLine"> | string
    brandKey?: StringNullableFilter<"SalesPriceListLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesPriceListLine">
    moqSnapshot?: JsonFilter<"SalesPriceListLine">
    createdAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
    priceList?: XOR<SalesPriceListScalarRelationFilter, SalesPriceListWhereInput>
  }, "id" | "priceListId_lineNo">

  export type SalesPriceListLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrderInput | SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesPriceListLineCountOrderByAggregateInput
    _avg?: SalesPriceListLineAvgOrderByAggregateInput
    _max?: SalesPriceListLineMaxOrderByAggregateInput
    _min?: SalesPriceListLineMinOrderByAggregateInput
    _sum?: SalesPriceListLineSumOrderByAggregateInput
  }

  export type SalesPriceListLineScalarWhereWithAggregatesInput = {
    AND?: SalesPriceListLineScalarWhereWithAggregatesInput | SalesPriceListLineScalarWhereWithAggregatesInput[]
    OR?: SalesPriceListLineScalarWhereWithAggregatesInput[]
    NOT?: SalesPriceListLineScalarWhereWithAggregatesInput | SalesPriceListLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesPriceListLine"> | string
    tenantId?: StringWithAggregatesFilter<"SalesPriceListLine"> | string
    priceListId?: UuidWithAggregatesFilter<"SalesPriceListLine"> | string
    lineNo?: IntWithAggregatesFilter<"SalesPriceListLine"> | number
    itemId?: StringWithAggregatesFilter<"SalesPriceListLine"> | string
    brandKey?: StringNullableWithAggregatesFilter<"SalesPriceListLine"> | string | null
    priceSnapshot?: JsonWithAggregatesFilter<"SalesPriceListLine">
    moqSnapshot?: JsonWithAggregatesFilter<"SalesPriceListLine">
    createdAt?: DateTimeWithAggregatesFilter<"SalesPriceListLine"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesPriceListLine"> | Date | string
  }

  export type SalesCustomerPriceAgreementVersionWhereInput = {
    AND?: SalesCustomerPriceAgreementVersionWhereInput | SalesCustomerPriceAgreementVersionWhereInput[]
    OR?: SalesCustomerPriceAgreementVersionWhereInput[]
    NOT?: SalesCustomerPriceAgreementVersionWhereInput | SalesCustomerPriceAgreementVersionWhereInput[]
    id?: UuidFilter<"SalesCustomerPriceAgreementVersion"> | string
    customerPriceAgreementId?: UuidFilter<"SalesCustomerPriceAgreementVersion"> | string
    tenantId?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    customerTenantPartyId?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    currencyCode?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    versionNo?: IntFilter<"SalesCustomerPriceAgreementVersion"> | number
    status?: EnumCustomerPriceAgreementStatusFilter<"SalesCustomerPriceAgreementVersion"> | $Enums.CustomerPriceAgreementStatus
    publishedAt?: DateTimeNullableFilter<"SalesCustomerPriceAgreementVersion"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
    updatedAt?: DateTimeFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
    lines?: SalesCustomerPriceAgreementLineListRelationFilter
  }

  export type SalesCustomerPriceAgreementVersionOrderByWithRelationInput = {
    id?: SortOrder
    customerPriceAgreementId?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    currencyCode?: SortOrder
    versionNo?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lines?: SalesCustomerPriceAgreementLineOrderByRelationAggregateInput
  }

  export type SalesCustomerPriceAgreementVersionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    customerPriceAgreementId_versionNo?: SalesCustomerPriceAgreementVersionCustomerPriceAgreementIdVersionNoCompoundUniqueInput
    AND?: SalesCustomerPriceAgreementVersionWhereInput | SalesCustomerPriceAgreementVersionWhereInput[]
    OR?: SalesCustomerPriceAgreementVersionWhereInput[]
    NOT?: SalesCustomerPriceAgreementVersionWhereInput | SalesCustomerPriceAgreementVersionWhereInput[]
    customerPriceAgreementId?: UuidFilter<"SalesCustomerPriceAgreementVersion"> | string
    tenantId?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    customerTenantPartyId?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    currencyCode?: StringFilter<"SalesCustomerPriceAgreementVersion"> | string
    versionNo?: IntFilter<"SalesCustomerPriceAgreementVersion"> | number
    status?: EnumCustomerPriceAgreementStatusFilter<"SalesCustomerPriceAgreementVersion"> | $Enums.CustomerPriceAgreementStatus
    publishedAt?: DateTimeNullableFilter<"SalesCustomerPriceAgreementVersion"> | Date | string | null
    createdAt?: DateTimeFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
    updatedAt?: DateTimeFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
    lines?: SalesCustomerPriceAgreementLineListRelationFilter
  }, "id" | "customerPriceAgreementId_versionNo">

  export type SalesCustomerPriceAgreementVersionOrderByWithAggregationInput = {
    id?: SortOrder
    customerPriceAgreementId?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    currencyCode?: SortOrder
    versionNo?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesCustomerPriceAgreementVersionCountOrderByAggregateInput
    _avg?: SalesCustomerPriceAgreementVersionAvgOrderByAggregateInput
    _max?: SalesCustomerPriceAgreementVersionMaxOrderByAggregateInput
    _min?: SalesCustomerPriceAgreementVersionMinOrderByAggregateInput
    _sum?: SalesCustomerPriceAgreementVersionSumOrderByAggregateInput
  }

  export type SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput = {
    AND?: SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput | SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput[]
    OR?: SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput[]
    NOT?: SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput | SalesCustomerPriceAgreementVersionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | string
    customerPriceAgreementId?: UuidWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | string
    tenantId?: StringWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | string
    customerTenantPartyId?: StringWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | string
    currencyCode?: StringWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | string
    versionNo?: IntWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | number
    status?: EnumCustomerPriceAgreementStatusWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | $Enums.CustomerPriceAgreementStatus
    publishedAt?: DateTimeNullableWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesCustomerPriceAgreementVersion"> | Date | string
  }

  export type SalesCustomerPriceAgreementLineWhereInput = {
    AND?: SalesCustomerPriceAgreementLineWhereInput | SalesCustomerPriceAgreementLineWhereInput[]
    OR?: SalesCustomerPriceAgreementLineWhereInput[]
    NOT?: SalesCustomerPriceAgreementLineWhereInput | SalesCustomerPriceAgreementLineWhereInput[]
    id?: UuidFilter<"SalesCustomerPriceAgreementLine"> | string
    tenantId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    customerPriceAgreementVersionId?: UuidFilter<"SalesCustomerPriceAgreementLine"> | string
    lineNo?: IntFilter<"SalesCustomerPriceAgreementLine"> | number
    itemId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    brandKey?: StringNullableFilter<"SalesCustomerPriceAgreementLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    moqSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    createdAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    customerPriceAgreementVersion?: XOR<SalesCustomerPriceAgreementVersionScalarRelationFilter, SalesCustomerPriceAgreementVersionWhereInput>
  }

  export type SalesCustomerPriceAgreementLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerPriceAgreementVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrderInput | SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    customerPriceAgreementVersion?: SalesCustomerPriceAgreementVersionOrderByWithRelationInput
  }

  export type SalesCustomerPriceAgreementLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    customerPriceAgreementVersionId_lineNo?: SalesCustomerPriceAgreementLineCustomerPriceAgreementVersionIdLineNoCompoundUniqueInput
    AND?: SalesCustomerPriceAgreementLineWhereInput | SalesCustomerPriceAgreementLineWhereInput[]
    OR?: SalesCustomerPriceAgreementLineWhereInput[]
    NOT?: SalesCustomerPriceAgreementLineWhereInput | SalesCustomerPriceAgreementLineWhereInput[]
    tenantId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    customerPriceAgreementVersionId?: UuidFilter<"SalesCustomerPriceAgreementLine"> | string
    lineNo?: IntFilter<"SalesCustomerPriceAgreementLine"> | number
    itemId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    brandKey?: StringNullableFilter<"SalesCustomerPriceAgreementLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    moqSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    createdAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    customerPriceAgreementVersion?: XOR<SalesCustomerPriceAgreementVersionScalarRelationFilter, SalesCustomerPriceAgreementVersionWhereInput>
  }, "id" | "customerPriceAgreementVersionId_lineNo">

  export type SalesCustomerPriceAgreementLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerPriceAgreementVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrderInput | SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SalesCustomerPriceAgreementLineCountOrderByAggregateInput
    _avg?: SalesCustomerPriceAgreementLineAvgOrderByAggregateInput
    _max?: SalesCustomerPriceAgreementLineMaxOrderByAggregateInput
    _min?: SalesCustomerPriceAgreementLineMinOrderByAggregateInput
    _sum?: SalesCustomerPriceAgreementLineSumOrderByAggregateInput
  }

  export type SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput = {
    AND?: SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput | SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput[]
    OR?: SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput[]
    NOT?: SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput | SalesCustomerPriceAgreementLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | string
    tenantId?: StringWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | string
    customerPriceAgreementVersionId?: UuidWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | string
    lineNo?: IntWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | number
    itemId?: StringWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | string
    brandKey?: StringNullableWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | string | null
    priceSnapshot?: JsonWithAggregatesFilter<"SalesCustomerPriceAgreementLine">
    moqSnapshot?: JsonWithAggregatesFilter<"SalesCustomerPriceAgreementLine">
    createdAt?: DateTimeWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SalesCustomerPriceAgreementLine"> | Date | string
  }

  export type SalesAuditEnvelopeWhereInput = {
    AND?: SalesAuditEnvelopeWhereInput | SalesAuditEnvelopeWhereInput[]
    OR?: SalesAuditEnvelopeWhereInput[]
    NOT?: SalesAuditEnvelopeWhereInput | SalesAuditEnvelopeWhereInput[]
    id?: StringFilter<"SalesAuditEnvelope"> | string
    service?: StringFilter<"SalesAuditEnvelope"> | string
    module?: StringFilter<"SalesAuditEnvelope"> | string
    eventType?: StringFilter<"SalesAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"SalesAuditEnvelope"> | Date | string
    result?: StringFilter<"SalesAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    operatorType?: StringFilter<"SalesAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    resourceType?: StringFilter<"SalesAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    details?: JsonFilter<"SalesAuditEnvelope">
    createdAt?: DateTimeFilter<"SalesAuditEnvelope"> | Date | string
  }

  export type SalesAuditEnvelopeOrderByWithRelationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesAuditEnvelopeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SalesAuditEnvelopeWhereInput | SalesAuditEnvelopeWhereInput[]
    OR?: SalesAuditEnvelopeWhereInput[]
    NOT?: SalesAuditEnvelopeWhereInput | SalesAuditEnvelopeWhereInput[]
    service?: StringFilter<"SalesAuditEnvelope"> | string
    module?: StringFilter<"SalesAuditEnvelope"> | string
    eventType?: StringFilter<"SalesAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"SalesAuditEnvelope"> | Date | string
    result?: StringFilter<"SalesAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    operatorType?: StringFilter<"SalesAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    resourceType?: StringFilter<"SalesAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"SalesAuditEnvelope"> | string | null
    details?: JsonFilter<"SalesAuditEnvelope">
    createdAt?: DateTimeFilter<"SalesAuditEnvelope"> | Date | string
  }, "id">

  export type SalesAuditEnvelopeOrderByWithAggregationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
    _count?: SalesAuditEnvelopeCountOrderByAggregateInput
    _max?: SalesAuditEnvelopeMaxOrderByAggregateInput
    _min?: SalesAuditEnvelopeMinOrderByAggregateInput
  }

  export type SalesAuditEnvelopeScalarWhereWithAggregatesInput = {
    AND?: SalesAuditEnvelopeScalarWhereWithAggregatesInput | SalesAuditEnvelopeScalarWhereWithAggregatesInput[]
    OR?: SalesAuditEnvelopeScalarWhereWithAggregatesInput[]
    NOT?: SalesAuditEnvelopeScalarWhereWithAggregatesInput | SalesAuditEnvelopeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    service?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    module?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    eventType?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"SalesAuditEnvelope"> | Date | string
    result?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    operatorId?: StringNullableWithAggregatesFilter<"SalesAuditEnvelope"> | string | null
    operatorType?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    tenantId?: StringNullableWithAggregatesFilter<"SalesAuditEnvelope"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"SalesAuditEnvelope"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"SalesAuditEnvelope"> | string | null
    resourceType?: StringWithAggregatesFilter<"SalesAuditEnvelope"> | string
    resourceId?: StringNullableWithAggregatesFilter<"SalesAuditEnvelope"> | string | null
    details?: JsonWithAggregatesFilter<"SalesAuditEnvelope">
    createdAt?: DateTimeWithAggregatesFilter<"SalesAuditEnvelope"> | Date | string
  }

  export type SalesSequenceCounterCreateInput = {
    tenantId: string
    nextQuoteNo?: number
    nextSalesOrderNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesSequenceCounterUncheckedCreateInput = {
    tenantId: string
    nextQuoteNo?: number
    nextSalesOrderNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesSequenceCounterUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextQuoteNo?: IntFieldUpdateOperationsInput | number
    nextSalesOrderNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesSequenceCounterUncheckedUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextQuoteNo?: IntFieldUpdateOperationsInput | number
    nextSalesOrderNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesSequenceCounterCreateManyInput = {
    tenantId: string
    nextQuoteNo?: number
    nextSalesOrderNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesSequenceCounterUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextQuoteNo?: IntFieldUpdateOperationsInput | number
    nextSalesOrderNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesSequenceCounterUncheckedUpdateManyInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextQuoteNo?: IntFieldUpdateOperationsInput | number
    nextSalesOrderNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteCreateInput = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId?: string | null
    opportunityNo?: string | null
    opportunityName?: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesQuoteLineCreateNestedManyWithoutQuoteInput
  }

  export type SalesQuoteUncheckedCreateInput = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId?: string | null
    opportunityNo?: string | null
    opportunityName?: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesQuoteLineUncheckedCreateNestedManyWithoutQuoteInput
  }

  export type SalesQuoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesQuoteLineUpdateManyWithoutQuoteNestedInput
  }

  export type SalesQuoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesQuoteLineUncheckedUpdateManyWithoutQuoteNestedInput
  }

  export type SalesQuoteCreateManyInput = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId?: string | null
    opportunityNo?: string | null
    opportunityName?: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: SalesQuoteCreateNestedOneWithoutLinesInput
  }

  export type SalesQuoteLineUncheckedCreateInput = {
    id: string
    tenantId: string
    quoteId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: SalesQuoteUpdateOneRequiredWithoutLinesNestedInput
  }

  export type SalesQuoteLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineCreateManyInput = {
    id: string
    tenantId: string
    quoteId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionCreateInput = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date | string
    createdAt?: Date | string
    lines?: SalesQuoteVersionLineCreateNestedManyWithoutQuoteVersionInput
  }

  export type SalesQuoteVersionUncheckedCreateInput = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date | string
    createdAt?: Date | string
    lines?: SalesQuoteVersionLineUncheckedCreateNestedManyWithoutQuoteVersionInput
  }

  export type SalesQuoteVersionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesQuoteVersionLineUpdateManyWithoutQuoteVersionNestedInput
  }

  export type SalesQuoteVersionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesQuoteVersionLineUncheckedUpdateManyWithoutQuoteVersionNestedInput
  }

  export type SalesQuoteVersionCreateManyInput = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date | string
    createdAt?: Date | string
  }

  export type SalesQuoteVersionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    quoteVersion: SalesQuoteVersionCreateNestedOneWithoutLinesInput
  }

  export type SalesQuoteVersionLineUncheckedCreateInput = {
    id: string
    tenantId: string
    quoteVersionId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesQuoteVersionLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quoteVersion?: SalesQuoteVersionUpdateOneRequiredWithoutLinesNestedInput
  }

  export type SalesQuoteVersionLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineCreateManyInput = {
    id: string
    tenantId: string
    quoteVersionId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesQuoteVersionLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCreateInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineCreateNestedManyWithoutSalesOrderInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryCreateNestedOneWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderUncheckedCreateInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineUncheckedCreateNestedManyWithoutSalesOrderInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUpdateManyWithoutSalesOrderNestedInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUpdateOneWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUncheckedUpdateManyWithoutSalesOrderNestedInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderCreateManyInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCommercialGateSummaryCreateInput = {
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    salesOrder: SalesOrderCreateNestedOneWithoutCommercialGateSummaryInput
  }

  export type SalesOrderCommercialGateSummaryUncheckedCreateInput = {
    salesOrderId: string
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderCommercialGateSummaryUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    salesOrder?: SalesOrderUpdateOneRequiredWithoutCommercialGateSummaryNestedInput
  }

  export type SalesOrderCommercialGateSummaryUncheckedUpdateInput = {
    salesOrderId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCommercialGateSummaryCreateManyInput = {
    salesOrderId: string
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderCommercialGateSummaryUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCommercialGateSummaryUncheckedUpdateManyInput = {
    salesOrderId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryCreateInput = {
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    salesOrder: SalesOrderCreateNestedOneWithoutFulfillmentHandoffSummaryInput
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedCreateInput = {
    salesOrderId: string
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    salesOrder?: SalesOrderUpdateOneRequiredWithoutFulfillmentHandoffSummaryNestedInput
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedUpdateInput = {
    salesOrderId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryCreateManyInput = {
    salesOrderId: string
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedUpdateManyInput = {
    salesOrderId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    salesOrder: SalesOrderCreateNestedOneWithoutLinesInput
  }

  export type SalesOrderLineUncheckedCreateInput = {
    id: string
    tenantId: string
    salesOrderId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    salesOrder?: SalesOrderUpdateOneRequiredWithoutLinesNestedInput
  }

  export type SalesOrderLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    salesOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineCreateManyInput = {
    id: string
    tenantId: string
    salesOrderId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    salesOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListCreateInput = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date | string
    effectiveTo?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesPriceListLineCreateNestedManyWithoutPriceListInput
  }

  export type SalesPriceListUncheckedCreateInput = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date | string
    effectiveTo?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesPriceListLineUncheckedCreateNestedManyWithoutPriceListInput
  }

  export type SalesPriceListUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesPriceListLineUpdateManyWithoutPriceListNestedInput
  }

  export type SalesPriceListUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesPriceListLineUncheckedUpdateManyWithoutPriceListNestedInput
  }

  export type SalesPriceListCreateManyInput = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date | string
    effectiveTo?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    priceList: SalesPriceListCreateNestedOneWithoutLinesInput
  }

  export type SalesPriceListLineUncheckedCreateInput = {
    id: string
    tenantId: string
    priceListId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    priceList?: SalesPriceListUpdateOneRequiredWithoutLinesNestedInput
  }

  export type SalesPriceListLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineCreateManyInput = {
    id: string
    tenantId: string
    priceListId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementVersionCreateInput = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesCustomerPriceAgreementLineCreateNestedManyWithoutCustomerPriceAgreementVersionInput
  }

  export type SalesCustomerPriceAgreementVersionUncheckedCreateInput = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesCustomerPriceAgreementLineUncheckedCreateNestedManyWithoutCustomerPriceAgreementVersionInput
  }

  export type SalesCustomerPriceAgreementVersionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesCustomerPriceAgreementLineUpdateManyWithoutCustomerPriceAgreementVersionNestedInput
  }

  export type SalesCustomerPriceAgreementVersionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesCustomerPriceAgreementLineUncheckedUpdateManyWithoutCustomerPriceAgreementVersionNestedInput
  }

  export type SalesCustomerPriceAgreementVersionCreateManyInput = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementVersionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementVersionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    customerPriceAgreementVersion: SalesCustomerPriceAgreementVersionCreateNestedOneWithoutLinesInput
  }

  export type SalesCustomerPriceAgreementLineUncheckedCreateInput = {
    id: string
    tenantId: string
    customerPriceAgreementVersionId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customerPriceAgreementVersion?: SalesCustomerPriceAgreementVersionUpdateOneRequiredWithoutLinesNestedInput
  }

  export type SalesCustomerPriceAgreementLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementVersionId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineCreateManyInput = {
    id: string
    tenantId: string
    customerPriceAgreementVersionId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementVersionId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesAuditEnvelopeCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesAuditEnvelopeUncheckedCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesAuditEnvelopeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesAuditEnvelopeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesAuditEnvelopeCreateManyInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesAuditEnvelopeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesAuditEnvelopeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SalesSequenceCounterCountOrderByAggregateInput = {
    tenantId?: SortOrder
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesSequenceCounterAvgOrderByAggregateInput = {
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
  }

  export type SalesSequenceCounterMaxOrderByAggregateInput = {
    tenantId?: SortOrder
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesSequenceCounterMinOrderByAggregateInput = {
    tenantId?: SortOrder
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesSequenceCounterSumOrderByAggregateInput = {
    nextQuoteNo?: SortOrder
    nextSalesOrderNo?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumSalesQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesQuoteStatus | EnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesQuoteStatusFilter<$PrismaModel> | $Enums.SalesQuoteStatus
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type SalesQuoteLineListRelationFilter = {
    every?: SalesQuoteLineWhereInput
    some?: SalesQuoteLineWhereInput
    none?: SalesQuoteLineWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SalesQuoteLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SalesQuoteCountOrderByAggregateInput = {
    id?: SortOrder
    quoteNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    opportunityId?: SortOrder
    opportunityNo?: SortOrder
    opportunityName?: SortOrder
    status?: SortOrder
    latestPublishedVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesQuoteMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    opportunityId?: SortOrder
    opportunityNo?: SortOrder
    opportunityName?: SortOrder
    status?: SortOrder
    latestPublishedVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesQuoteMinOrderByAggregateInput = {
    id?: SortOrder
    quoteNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    opportunityId?: SortOrder
    opportunityNo?: SortOrder
    opportunityName?: SortOrder
    status?: SortOrder
    latestPublishedVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumSalesQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesQuoteStatus | EnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.SalesQuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSalesQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumSalesQuoteStatusFilter<$PrismaModel>
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type SalesQuoteScalarRelationFilter = {
    is?: SalesQuoteWhereInput
    isNot?: SalesQuoteWhereInput
  }

  export type SalesQuoteLineQuoteIdLineNoCompoundUniqueInput = {
    quoteId: string
    lineNo: number
  }

  export type SalesQuoteLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesQuoteLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesQuoteLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesQuoteLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesQuoteLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type SalesQuoteVersionLineListRelationFilter = {
    every?: SalesQuoteVersionLineWhereInput
    some?: SalesQuoteVersionLineWhereInput
    none?: SalesQuoteVersionLineWhereInput
  }

  export type SalesQuoteVersionLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SalesQuoteVersionQuoteIdVersionNoCompoundUniqueInput = {
    quoteId: string
    versionNo: number
  }

  export type SalesQuoteVersionCountOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    quoteNo?: SortOrder
    versionNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionAvgOrderByAggregateInput = {
    versionNo?: SortOrder
  }

  export type SalesQuoteVersionMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    quoteNo?: SortOrder
    versionNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionMinOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    quoteNo?: SortOrder
    versionNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionSumOrderByAggregateInput = {
    versionNo?: SortOrder
  }

  export type SalesQuoteVersionScalarRelationFilter = {
    is?: SalesQuoteVersionWhereInput
    isNot?: SalesQuoteVersionWhereInput
  }

  export type SalesQuoteVersionLineQuoteVersionIdLineNoCompoundUniqueInput = {
    quoteVersionId: string
    lineNo: number
  }

  export type SalesQuoteVersionLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesQuoteVersionLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    quoteVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesQuoteVersionLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesOrderLineListRelationFilter = {
    every?: SalesOrderLineWhereInput
    some?: SalesOrderLineWhereInput
    none?: SalesOrderLineWhereInput
  }

  export type SalesOrderCommercialGateSummaryNullableScalarRelationFilter = {
    is?: SalesOrderCommercialGateSummaryWhereInput | null
    isNot?: SalesOrderCommercialGateSummaryWhereInput | null
  }

  export type SalesOrderFulfillmentHandoffSummaryNullableScalarRelationFilter = {
    is?: SalesOrderFulfillmentHandoffSummaryWhereInput | null
    isNot?: SalesOrderFulfillmentHandoffSummaryWhereInput | null
  }

  export type SalesOrderLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SalesOrderCountOrderByAggregateInput = {
    id?: SortOrder
    salesOrderNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    quoteId?: SortOrder
    quoteVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderMaxOrderByAggregateInput = {
    id?: SortOrder
    salesOrderNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    quoteId?: SortOrder
    quoteVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderMinOrderByAggregateInput = {
    id?: SortOrder
    salesOrderNo?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    quoteId?: SortOrder
    quoteVersionId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type SalesOrderScalarRelationFilter = {
    is?: SalesOrderWhereInput
    isNot?: SalesOrderWhereInput
  }

  export type SalesOrderCommercialGateSummaryCountOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    orderEstablished?: SortOrder
    productionGate?: SortOrder
    stockingGate?: SortOrder
    shippingGate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderCommercialGateSummaryMaxOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    orderEstablished?: SortOrder
    productionGate?: SortOrder
    stockingGate?: SortOrder
    shippingGate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderCommercialGateSummaryMinOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    orderEstablished?: SortOrder
    productionGate?: SortOrder
    stockingGate?: SortOrder
    shippingGate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumSalesFulfillmentHandoffStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesFulfillmentHandoffStatus | EnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel> | $Enums.SalesFulfillmentHandoffStatus
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SalesOrderFulfillmentHandoffSummaryCountOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderFulfillmentHandoffSummaryMaxOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderFulfillmentHandoffSummaryMinOrderByAggregateInput = {
    salesOrderId?: SortOrder
    tenantId?: SortOrder
    status?: SortOrder
    submittedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSalesFulfillmentHandoffStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesFulfillmentHandoffStatus | EnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesFulfillmentHandoffStatusWithAggregatesFilter<$PrismaModel> | $Enums.SalesFulfillmentHandoffStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel>
    _max?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type SalesOrderLineSalesOrderIdLineNoCompoundUniqueInput = {
    salesOrderId: string
    lineNo: number
  }

  export type SalesOrderLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    salesOrderId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemSnapshot?: SortOrder
    salesConfigSnapshot?: SortOrder
    packagingRequirementSnapshot?: SortOrder
    priceQuantityDeliverySnapshot?: SortOrder
    customerItemSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesOrderLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    salesOrderId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    salesOrderId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesOrderLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type EnumPriceListTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListType | EnumPriceListTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListTypeFilter<$PrismaModel> | $Enums.PriceListType
  }

  export type EnumPriceListStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListStatus | EnumPriceListStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListStatusFilter<$PrismaModel> | $Enums.PriceListStatus
  }

  export type SalesPriceListLineListRelationFilter = {
    every?: SalesPriceListLineWhereInput
    some?: SalesPriceListLineWhereInput
    none?: SalesPriceListLineWhereInput
  }

  export type SalesPriceListLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SalesPriceListCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListName?: SortOrder
    priceListType?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    effectiveFrom?: SortOrder
    effectiveTo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesPriceListMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListName?: SortOrder
    priceListType?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    effectiveFrom?: SortOrder
    effectiveTo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesPriceListMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListName?: SortOrder
    priceListType?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    effectiveFrom?: SortOrder
    effectiveTo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumPriceListTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListType | EnumPriceListTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListTypeWithAggregatesFilter<$PrismaModel> | $Enums.PriceListType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceListTypeFilter<$PrismaModel>
    _max?: NestedEnumPriceListTypeFilter<$PrismaModel>
  }

  export type EnumPriceListStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListStatus | EnumPriceListStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListStatusWithAggregatesFilter<$PrismaModel> | $Enums.PriceListStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceListStatusFilter<$PrismaModel>
    _max?: NestedEnumPriceListStatusFilter<$PrismaModel>
  }

  export type SalesPriceListScalarRelationFilter = {
    is?: SalesPriceListWhereInput
    isNot?: SalesPriceListWhereInput
  }

  export type SalesPriceListLinePriceListIdLineNoCompoundUniqueInput = {
    priceListId: string
    lineNo: number
  }

  export type SalesPriceListLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesPriceListLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesPriceListLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesPriceListLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    priceListId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesPriceListLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type EnumCustomerPriceAgreementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomerPriceAgreementStatus | EnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel> | $Enums.CustomerPriceAgreementStatus
  }

  export type SalesCustomerPriceAgreementLineListRelationFilter = {
    every?: SalesCustomerPriceAgreementLineWhereInput
    some?: SalesCustomerPriceAgreementLineWhereInput
    none?: SalesCustomerPriceAgreementLineWhereInput
  }

  export type SalesCustomerPriceAgreementLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SalesCustomerPriceAgreementVersionCustomerPriceAgreementIdVersionNoCompoundUniqueInput = {
    customerPriceAgreementId: string
    versionNo: number
  }

  export type SalesCustomerPriceAgreementVersionCountOrderByAggregateInput = {
    id?: SortOrder
    customerPriceAgreementId?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    currencyCode?: SortOrder
    versionNo?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementVersionAvgOrderByAggregateInput = {
    versionNo?: SortOrder
  }

  export type SalesCustomerPriceAgreementVersionMaxOrderByAggregateInput = {
    id?: SortOrder
    customerPriceAgreementId?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    currencyCode?: SortOrder
    versionNo?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementVersionMinOrderByAggregateInput = {
    id?: SortOrder
    customerPriceAgreementId?: SortOrder
    tenantId?: SortOrder
    customerTenantPartyId?: SortOrder
    currencyCode?: SortOrder
    versionNo?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementVersionSumOrderByAggregateInput = {
    versionNo?: SortOrder
  }

  export type EnumCustomerPriceAgreementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomerPriceAgreementStatus | EnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomerPriceAgreementStatusWithAggregatesFilter<$PrismaModel> | $Enums.CustomerPriceAgreementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel>
    _max?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel>
  }

  export type SalesCustomerPriceAgreementVersionScalarRelationFilter = {
    is?: SalesCustomerPriceAgreementVersionWhereInput
    isNot?: SalesCustomerPriceAgreementVersionWhereInput
  }

  export type SalesCustomerPriceAgreementLineCustomerPriceAgreementVersionIdLineNoCompoundUniqueInput = {
    customerPriceAgreementVersionId: string
    lineNo: number
  }

  export type SalesCustomerPriceAgreementLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerPriceAgreementVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    priceSnapshot?: SortOrder
    moqSnapshot?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesCustomerPriceAgreementLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerPriceAgreementVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerPriceAgreementVersionId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    brandKey?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SalesCustomerPriceAgreementLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type SalesAuditEnvelopeCountOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesAuditEnvelopeMaxOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    createdAt?: SortOrder
  }

  export type SalesAuditEnvelopeMinOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    createdAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SalesQuoteLineCreateNestedManyWithoutQuoteInput = {
    create?: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput> | SalesQuoteLineCreateWithoutQuoteInput[] | SalesQuoteLineUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: SalesQuoteLineCreateOrConnectWithoutQuoteInput | SalesQuoteLineCreateOrConnectWithoutQuoteInput[]
    createMany?: SalesQuoteLineCreateManyQuoteInputEnvelope
    connect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
  }

  export type SalesQuoteLineUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput> | SalesQuoteLineCreateWithoutQuoteInput[] | SalesQuoteLineUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: SalesQuoteLineCreateOrConnectWithoutQuoteInput | SalesQuoteLineCreateOrConnectWithoutQuoteInput[]
    createMany?: SalesQuoteLineCreateManyQuoteInputEnvelope
    connect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumSalesQuoteStatusFieldUpdateOperationsInput = {
    set?: $Enums.SalesQuoteStatus
  }

  export type SalesQuoteLineUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput> | SalesQuoteLineCreateWithoutQuoteInput[] | SalesQuoteLineUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: SalesQuoteLineCreateOrConnectWithoutQuoteInput | SalesQuoteLineCreateOrConnectWithoutQuoteInput[]
    upsert?: SalesQuoteLineUpsertWithWhereUniqueWithoutQuoteInput | SalesQuoteLineUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: SalesQuoteLineCreateManyQuoteInputEnvelope
    set?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    disconnect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    delete?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    connect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    update?: SalesQuoteLineUpdateWithWhereUniqueWithoutQuoteInput | SalesQuoteLineUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: SalesQuoteLineUpdateManyWithWhereWithoutQuoteInput | SalesQuoteLineUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: SalesQuoteLineScalarWhereInput | SalesQuoteLineScalarWhereInput[]
  }

  export type SalesQuoteLineUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput> | SalesQuoteLineCreateWithoutQuoteInput[] | SalesQuoteLineUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: SalesQuoteLineCreateOrConnectWithoutQuoteInput | SalesQuoteLineCreateOrConnectWithoutQuoteInput[]
    upsert?: SalesQuoteLineUpsertWithWhereUniqueWithoutQuoteInput | SalesQuoteLineUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: SalesQuoteLineCreateManyQuoteInputEnvelope
    set?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    disconnect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    delete?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    connect?: SalesQuoteLineWhereUniqueInput | SalesQuoteLineWhereUniqueInput[]
    update?: SalesQuoteLineUpdateWithWhereUniqueWithoutQuoteInput | SalesQuoteLineUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: SalesQuoteLineUpdateManyWithWhereWithoutQuoteInput | SalesQuoteLineUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: SalesQuoteLineScalarWhereInput | SalesQuoteLineScalarWhereInput[]
  }

  export type SalesQuoteCreateNestedOneWithoutLinesInput = {
    create?: XOR<SalesQuoteCreateWithoutLinesInput, SalesQuoteUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesQuoteCreateOrConnectWithoutLinesInput
    connect?: SalesQuoteWhereUniqueInput
  }

  export type SalesQuoteUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<SalesQuoteCreateWithoutLinesInput, SalesQuoteUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesQuoteCreateOrConnectWithoutLinesInput
    upsert?: SalesQuoteUpsertWithoutLinesInput
    connect?: SalesQuoteWhereUniqueInput
    update?: XOR<XOR<SalesQuoteUpdateToOneWithWhereWithoutLinesInput, SalesQuoteUpdateWithoutLinesInput>, SalesQuoteUncheckedUpdateWithoutLinesInput>
  }

  export type SalesQuoteVersionLineCreateNestedManyWithoutQuoteVersionInput = {
    create?: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput> | SalesQuoteVersionLineCreateWithoutQuoteVersionInput[] | SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput[]
    connectOrCreate?: SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput | SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput[]
    createMany?: SalesQuoteVersionLineCreateManyQuoteVersionInputEnvelope
    connect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
  }

  export type SalesQuoteVersionLineUncheckedCreateNestedManyWithoutQuoteVersionInput = {
    create?: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput> | SalesQuoteVersionLineCreateWithoutQuoteVersionInput[] | SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput[]
    connectOrCreate?: SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput | SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput[]
    createMany?: SalesQuoteVersionLineCreateManyQuoteVersionInputEnvelope
    connect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
  }

  export type SalesQuoteVersionLineUpdateManyWithoutQuoteVersionNestedInput = {
    create?: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput> | SalesQuoteVersionLineCreateWithoutQuoteVersionInput[] | SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput[]
    connectOrCreate?: SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput | SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput[]
    upsert?: SalesQuoteVersionLineUpsertWithWhereUniqueWithoutQuoteVersionInput | SalesQuoteVersionLineUpsertWithWhereUniqueWithoutQuoteVersionInput[]
    createMany?: SalesQuoteVersionLineCreateManyQuoteVersionInputEnvelope
    set?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    disconnect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    delete?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    connect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    update?: SalesQuoteVersionLineUpdateWithWhereUniqueWithoutQuoteVersionInput | SalesQuoteVersionLineUpdateWithWhereUniqueWithoutQuoteVersionInput[]
    updateMany?: SalesQuoteVersionLineUpdateManyWithWhereWithoutQuoteVersionInput | SalesQuoteVersionLineUpdateManyWithWhereWithoutQuoteVersionInput[]
    deleteMany?: SalesQuoteVersionLineScalarWhereInput | SalesQuoteVersionLineScalarWhereInput[]
  }

  export type SalesQuoteVersionLineUncheckedUpdateManyWithoutQuoteVersionNestedInput = {
    create?: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput> | SalesQuoteVersionLineCreateWithoutQuoteVersionInput[] | SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput[]
    connectOrCreate?: SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput | SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput[]
    upsert?: SalesQuoteVersionLineUpsertWithWhereUniqueWithoutQuoteVersionInput | SalesQuoteVersionLineUpsertWithWhereUniqueWithoutQuoteVersionInput[]
    createMany?: SalesQuoteVersionLineCreateManyQuoteVersionInputEnvelope
    set?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    disconnect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    delete?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    connect?: SalesQuoteVersionLineWhereUniqueInput | SalesQuoteVersionLineWhereUniqueInput[]
    update?: SalesQuoteVersionLineUpdateWithWhereUniqueWithoutQuoteVersionInput | SalesQuoteVersionLineUpdateWithWhereUniqueWithoutQuoteVersionInput[]
    updateMany?: SalesQuoteVersionLineUpdateManyWithWhereWithoutQuoteVersionInput | SalesQuoteVersionLineUpdateManyWithWhereWithoutQuoteVersionInput[]
    deleteMany?: SalesQuoteVersionLineScalarWhereInput | SalesQuoteVersionLineScalarWhereInput[]
  }

  export type SalesQuoteVersionCreateNestedOneWithoutLinesInput = {
    create?: XOR<SalesQuoteVersionCreateWithoutLinesInput, SalesQuoteVersionUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesQuoteVersionCreateOrConnectWithoutLinesInput
    connect?: SalesQuoteVersionWhereUniqueInput
  }

  export type SalesQuoteVersionUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<SalesQuoteVersionCreateWithoutLinesInput, SalesQuoteVersionUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesQuoteVersionCreateOrConnectWithoutLinesInput
    upsert?: SalesQuoteVersionUpsertWithoutLinesInput
    connect?: SalesQuoteVersionWhereUniqueInput
    update?: XOR<XOR<SalesQuoteVersionUpdateToOneWithWhereWithoutLinesInput, SalesQuoteVersionUpdateWithoutLinesInput>, SalesQuoteVersionUncheckedUpdateWithoutLinesInput>
  }

  export type SalesOrderLineCreateNestedManyWithoutSalesOrderInput = {
    create?: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput> | SalesOrderLineCreateWithoutSalesOrderInput[] | SalesOrderLineUncheckedCreateWithoutSalesOrderInput[]
    connectOrCreate?: SalesOrderLineCreateOrConnectWithoutSalesOrderInput | SalesOrderLineCreateOrConnectWithoutSalesOrderInput[]
    createMany?: SalesOrderLineCreateManySalesOrderInputEnvelope
    connect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
  }

  export type SalesOrderCommercialGateSummaryCreateNestedOneWithoutSalesOrderInput = {
    create?: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderCommercialGateSummaryCreateOrConnectWithoutSalesOrderInput
    connect?: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  export type SalesOrderFulfillmentHandoffSummaryCreateNestedOneWithoutSalesOrderInput = {
    create?: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderFulfillmentHandoffSummaryCreateOrConnectWithoutSalesOrderInput
    connect?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  export type SalesOrderLineUncheckedCreateNestedManyWithoutSalesOrderInput = {
    create?: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput> | SalesOrderLineCreateWithoutSalesOrderInput[] | SalesOrderLineUncheckedCreateWithoutSalesOrderInput[]
    connectOrCreate?: SalesOrderLineCreateOrConnectWithoutSalesOrderInput | SalesOrderLineCreateOrConnectWithoutSalesOrderInput[]
    createMany?: SalesOrderLineCreateManySalesOrderInputEnvelope
    connect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
  }

  export type SalesOrderCommercialGateSummaryUncheckedCreateNestedOneWithoutSalesOrderInput = {
    create?: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderCommercialGateSummaryCreateOrConnectWithoutSalesOrderInput
    connect?: SalesOrderCommercialGateSummaryWhereUniqueInput
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedCreateNestedOneWithoutSalesOrderInput = {
    create?: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderFulfillmentHandoffSummaryCreateOrConnectWithoutSalesOrderInput
    connect?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
  }

  export type SalesOrderLineUpdateManyWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput> | SalesOrderLineCreateWithoutSalesOrderInput[] | SalesOrderLineUncheckedCreateWithoutSalesOrderInput[]
    connectOrCreate?: SalesOrderLineCreateOrConnectWithoutSalesOrderInput | SalesOrderLineCreateOrConnectWithoutSalesOrderInput[]
    upsert?: SalesOrderLineUpsertWithWhereUniqueWithoutSalesOrderInput | SalesOrderLineUpsertWithWhereUniqueWithoutSalesOrderInput[]
    createMany?: SalesOrderLineCreateManySalesOrderInputEnvelope
    set?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    disconnect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    delete?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    connect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    update?: SalesOrderLineUpdateWithWhereUniqueWithoutSalesOrderInput | SalesOrderLineUpdateWithWhereUniqueWithoutSalesOrderInput[]
    updateMany?: SalesOrderLineUpdateManyWithWhereWithoutSalesOrderInput | SalesOrderLineUpdateManyWithWhereWithoutSalesOrderInput[]
    deleteMany?: SalesOrderLineScalarWhereInput | SalesOrderLineScalarWhereInput[]
  }

  export type SalesOrderCommercialGateSummaryUpdateOneWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderCommercialGateSummaryCreateOrConnectWithoutSalesOrderInput
    upsert?: SalesOrderCommercialGateSummaryUpsertWithoutSalesOrderInput
    disconnect?: SalesOrderCommercialGateSummaryWhereInput | boolean
    delete?: SalesOrderCommercialGateSummaryWhereInput | boolean
    connect?: SalesOrderCommercialGateSummaryWhereUniqueInput
    update?: XOR<XOR<SalesOrderCommercialGateSummaryUpdateToOneWithWhereWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUpdateWithoutSalesOrderInput>, SalesOrderCommercialGateSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderFulfillmentHandoffSummaryUpdateOneWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderFulfillmentHandoffSummaryCreateOrConnectWithoutSalesOrderInput
    upsert?: SalesOrderFulfillmentHandoffSummaryUpsertWithoutSalesOrderInput
    disconnect?: SalesOrderFulfillmentHandoffSummaryWhereInput | boolean
    delete?: SalesOrderFulfillmentHandoffSummaryWhereInput | boolean
    connect?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    update?: XOR<XOR<SalesOrderFulfillmentHandoffSummaryUpdateToOneWithWhereWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUpdateWithoutSalesOrderInput>, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderLineUncheckedUpdateManyWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput> | SalesOrderLineCreateWithoutSalesOrderInput[] | SalesOrderLineUncheckedCreateWithoutSalesOrderInput[]
    connectOrCreate?: SalesOrderLineCreateOrConnectWithoutSalesOrderInput | SalesOrderLineCreateOrConnectWithoutSalesOrderInput[]
    upsert?: SalesOrderLineUpsertWithWhereUniqueWithoutSalesOrderInput | SalesOrderLineUpsertWithWhereUniqueWithoutSalesOrderInput[]
    createMany?: SalesOrderLineCreateManySalesOrderInputEnvelope
    set?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    disconnect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    delete?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    connect?: SalesOrderLineWhereUniqueInput | SalesOrderLineWhereUniqueInput[]
    update?: SalesOrderLineUpdateWithWhereUniqueWithoutSalesOrderInput | SalesOrderLineUpdateWithWhereUniqueWithoutSalesOrderInput[]
    updateMany?: SalesOrderLineUpdateManyWithWhereWithoutSalesOrderInput | SalesOrderLineUpdateManyWithWhereWithoutSalesOrderInput[]
    deleteMany?: SalesOrderLineScalarWhereInput | SalesOrderLineScalarWhereInput[]
  }

  export type SalesOrderCommercialGateSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderCommercialGateSummaryCreateOrConnectWithoutSalesOrderInput
    upsert?: SalesOrderCommercialGateSummaryUpsertWithoutSalesOrderInput
    disconnect?: SalesOrderCommercialGateSummaryWhereInput | boolean
    delete?: SalesOrderCommercialGateSummaryWhereInput | boolean
    connect?: SalesOrderCommercialGateSummaryWhereUniqueInput
    update?: XOR<XOR<SalesOrderCommercialGateSummaryUpdateToOneWithWhereWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUpdateWithoutSalesOrderInput>, SalesOrderCommercialGateSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput = {
    create?: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
    connectOrCreate?: SalesOrderFulfillmentHandoffSummaryCreateOrConnectWithoutSalesOrderInput
    upsert?: SalesOrderFulfillmentHandoffSummaryUpsertWithoutSalesOrderInput
    disconnect?: SalesOrderFulfillmentHandoffSummaryWhereInput | boolean
    delete?: SalesOrderFulfillmentHandoffSummaryWhereInput | boolean
    connect?: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    update?: XOR<XOR<SalesOrderFulfillmentHandoffSummaryUpdateToOneWithWhereWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUpdateWithoutSalesOrderInput>, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderCreateNestedOneWithoutCommercialGateSummaryInput = {
    create?: XOR<SalesOrderCreateWithoutCommercialGateSummaryInput, SalesOrderUncheckedCreateWithoutCommercialGateSummaryInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutCommercialGateSummaryInput
    connect?: SalesOrderWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type SalesOrderUpdateOneRequiredWithoutCommercialGateSummaryNestedInput = {
    create?: XOR<SalesOrderCreateWithoutCommercialGateSummaryInput, SalesOrderUncheckedCreateWithoutCommercialGateSummaryInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutCommercialGateSummaryInput
    upsert?: SalesOrderUpsertWithoutCommercialGateSummaryInput
    connect?: SalesOrderWhereUniqueInput
    update?: XOR<XOR<SalesOrderUpdateToOneWithWhereWithoutCommercialGateSummaryInput, SalesOrderUpdateWithoutCommercialGateSummaryInput>, SalesOrderUncheckedUpdateWithoutCommercialGateSummaryInput>
  }

  export type SalesOrderCreateNestedOneWithoutFulfillmentHandoffSummaryInput = {
    create?: XOR<SalesOrderCreateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedCreateWithoutFulfillmentHandoffSummaryInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutFulfillmentHandoffSummaryInput
    connect?: SalesOrderWhereUniqueInput
  }

  export type EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput = {
    set?: $Enums.SalesFulfillmentHandoffStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type SalesOrderUpdateOneRequiredWithoutFulfillmentHandoffSummaryNestedInput = {
    create?: XOR<SalesOrderCreateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedCreateWithoutFulfillmentHandoffSummaryInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutFulfillmentHandoffSummaryInput
    upsert?: SalesOrderUpsertWithoutFulfillmentHandoffSummaryInput
    connect?: SalesOrderWhereUniqueInput
    update?: XOR<XOR<SalesOrderUpdateToOneWithWhereWithoutFulfillmentHandoffSummaryInput, SalesOrderUpdateWithoutFulfillmentHandoffSummaryInput>, SalesOrderUncheckedUpdateWithoutFulfillmentHandoffSummaryInput>
  }

  export type SalesOrderCreateNestedOneWithoutLinesInput = {
    create?: XOR<SalesOrderCreateWithoutLinesInput, SalesOrderUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutLinesInput
    connect?: SalesOrderWhereUniqueInput
  }

  export type SalesOrderUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<SalesOrderCreateWithoutLinesInput, SalesOrderUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesOrderCreateOrConnectWithoutLinesInput
    upsert?: SalesOrderUpsertWithoutLinesInput
    connect?: SalesOrderWhereUniqueInput
    update?: XOR<XOR<SalesOrderUpdateToOneWithWhereWithoutLinesInput, SalesOrderUpdateWithoutLinesInput>, SalesOrderUncheckedUpdateWithoutLinesInput>
  }

  export type SalesPriceListLineCreateNestedManyWithoutPriceListInput = {
    create?: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput> | SalesPriceListLineCreateWithoutPriceListInput[] | SalesPriceListLineUncheckedCreateWithoutPriceListInput[]
    connectOrCreate?: SalesPriceListLineCreateOrConnectWithoutPriceListInput | SalesPriceListLineCreateOrConnectWithoutPriceListInput[]
    createMany?: SalesPriceListLineCreateManyPriceListInputEnvelope
    connect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
  }

  export type SalesPriceListLineUncheckedCreateNestedManyWithoutPriceListInput = {
    create?: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput> | SalesPriceListLineCreateWithoutPriceListInput[] | SalesPriceListLineUncheckedCreateWithoutPriceListInput[]
    connectOrCreate?: SalesPriceListLineCreateOrConnectWithoutPriceListInput | SalesPriceListLineCreateOrConnectWithoutPriceListInput[]
    createMany?: SalesPriceListLineCreateManyPriceListInputEnvelope
    connect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
  }

  export type EnumPriceListTypeFieldUpdateOperationsInput = {
    set?: $Enums.PriceListType
  }

  export type EnumPriceListStatusFieldUpdateOperationsInput = {
    set?: $Enums.PriceListStatus
  }

  export type SalesPriceListLineUpdateManyWithoutPriceListNestedInput = {
    create?: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput> | SalesPriceListLineCreateWithoutPriceListInput[] | SalesPriceListLineUncheckedCreateWithoutPriceListInput[]
    connectOrCreate?: SalesPriceListLineCreateOrConnectWithoutPriceListInput | SalesPriceListLineCreateOrConnectWithoutPriceListInput[]
    upsert?: SalesPriceListLineUpsertWithWhereUniqueWithoutPriceListInput | SalesPriceListLineUpsertWithWhereUniqueWithoutPriceListInput[]
    createMany?: SalesPriceListLineCreateManyPriceListInputEnvelope
    set?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    disconnect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    delete?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    connect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    update?: SalesPriceListLineUpdateWithWhereUniqueWithoutPriceListInput | SalesPriceListLineUpdateWithWhereUniqueWithoutPriceListInput[]
    updateMany?: SalesPriceListLineUpdateManyWithWhereWithoutPriceListInput | SalesPriceListLineUpdateManyWithWhereWithoutPriceListInput[]
    deleteMany?: SalesPriceListLineScalarWhereInput | SalesPriceListLineScalarWhereInput[]
  }

  export type SalesPriceListLineUncheckedUpdateManyWithoutPriceListNestedInput = {
    create?: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput> | SalesPriceListLineCreateWithoutPriceListInput[] | SalesPriceListLineUncheckedCreateWithoutPriceListInput[]
    connectOrCreate?: SalesPriceListLineCreateOrConnectWithoutPriceListInput | SalesPriceListLineCreateOrConnectWithoutPriceListInput[]
    upsert?: SalesPriceListLineUpsertWithWhereUniqueWithoutPriceListInput | SalesPriceListLineUpsertWithWhereUniqueWithoutPriceListInput[]
    createMany?: SalesPriceListLineCreateManyPriceListInputEnvelope
    set?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    disconnect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    delete?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    connect?: SalesPriceListLineWhereUniqueInput | SalesPriceListLineWhereUniqueInput[]
    update?: SalesPriceListLineUpdateWithWhereUniqueWithoutPriceListInput | SalesPriceListLineUpdateWithWhereUniqueWithoutPriceListInput[]
    updateMany?: SalesPriceListLineUpdateManyWithWhereWithoutPriceListInput | SalesPriceListLineUpdateManyWithWhereWithoutPriceListInput[]
    deleteMany?: SalesPriceListLineScalarWhereInput | SalesPriceListLineScalarWhereInput[]
  }

  export type SalesPriceListCreateNestedOneWithoutLinesInput = {
    create?: XOR<SalesPriceListCreateWithoutLinesInput, SalesPriceListUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesPriceListCreateOrConnectWithoutLinesInput
    connect?: SalesPriceListWhereUniqueInput
  }

  export type SalesPriceListUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<SalesPriceListCreateWithoutLinesInput, SalesPriceListUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesPriceListCreateOrConnectWithoutLinesInput
    upsert?: SalesPriceListUpsertWithoutLinesInput
    connect?: SalesPriceListWhereUniqueInput
    update?: XOR<XOR<SalesPriceListUpdateToOneWithWhereWithoutLinesInput, SalesPriceListUpdateWithoutLinesInput>, SalesPriceListUncheckedUpdateWithoutLinesInput>
  }

  export type SalesCustomerPriceAgreementLineCreateNestedManyWithoutCustomerPriceAgreementVersionInput = {
    create?: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput> | SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput[] | SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput[]
    connectOrCreate?: SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput[]
    createMany?: SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInputEnvelope
    connect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
  }

  export type SalesCustomerPriceAgreementLineUncheckedCreateNestedManyWithoutCustomerPriceAgreementVersionInput = {
    create?: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput> | SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput[] | SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput[]
    connectOrCreate?: SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput[]
    createMany?: SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInputEnvelope
    connect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
  }

  export type EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput = {
    set?: $Enums.CustomerPriceAgreementStatus
  }

  export type SalesCustomerPriceAgreementLineUpdateManyWithoutCustomerPriceAgreementVersionNestedInput = {
    create?: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput> | SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput[] | SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput[]
    connectOrCreate?: SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput[]
    upsert?: SalesCustomerPriceAgreementLineUpsertWithWhereUniqueWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpsertWithWhereUniqueWithoutCustomerPriceAgreementVersionInput[]
    createMany?: SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInputEnvelope
    set?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    disconnect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    delete?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    connect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    update?: SalesCustomerPriceAgreementLineUpdateWithWhereUniqueWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpdateWithWhereUniqueWithoutCustomerPriceAgreementVersionInput[]
    updateMany?: SalesCustomerPriceAgreementLineUpdateManyWithWhereWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpdateManyWithWhereWithoutCustomerPriceAgreementVersionInput[]
    deleteMany?: SalesCustomerPriceAgreementLineScalarWhereInput | SalesCustomerPriceAgreementLineScalarWhereInput[]
  }

  export type SalesCustomerPriceAgreementLineUncheckedUpdateManyWithoutCustomerPriceAgreementVersionNestedInput = {
    create?: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput> | SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput[] | SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput[]
    connectOrCreate?: SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput[]
    upsert?: SalesCustomerPriceAgreementLineUpsertWithWhereUniqueWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpsertWithWhereUniqueWithoutCustomerPriceAgreementVersionInput[]
    createMany?: SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInputEnvelope
    set?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    disconnect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    delete?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    connect?: SalesCustomerPriceAgreementLineWhereUniqueInput | SalesCustomerPriceAgreementLineWhereUniqueInput[]
    update?: SalesCustomerPriceAgreementLineUpdateWithWhereUniqueWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpdateWithWhereUniqueWithoutCustomerPriceAgreementVersionInput[]
    updateMany?: SalesCustomerPriceAgreementLineUpdateManyWithWhereWithoutCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineUpdateManyWithWhereWithoutCustomerPriceAgreementVersionInput[]
    deleteMany?: SalesCustomerPriceAgreementLineScalarWhereInput | SalesCustomerPriceAgreementLineScalarWhereInput[]
  }

  export type SalesCustomerPriceAgreementVersionCreateNestedOneWithoutLinesInput = {
    create?: XOR<SalesCustomerPriceAgreementVersionCreateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesCustomerPriceAgreementVersionCreateOrConnectWithoutLinesInput
    connect?: SalesCustomerPriceAgreementVersionWhereUniqueInput
  }

  export type SalesCustomerPriceAgreementVersionUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<SalesCustomerPriceAgreementVersionCreateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedCreateWithoutLinesInput>
    connectOrCreate?: SalesCustomerPriceAgreementVersionCreateOrConnectWithoutLinesInput
    upsert?: SalesCustomerPriceAgreementVersionUpsertWithoutLinesInput
    connect?: SalesCustomerPriceAgreementVersionWhereUniqueInput
    update?: XOR<XOR<SalesCustomerPriceAgreementVersionUpdateToOneWithWhereWithoutLinesInput, SalesCustomerPriceAgreementVersionUpdateWithoutLinesInput>, SalesCustomerPriceAgreementVersionUncheckedUpdateWithoutLinesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumSalesQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesQuoteStatus | EnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesQuoteStatusFilter<$PrismaModel> | $Enums.SalesQuoteStatus
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumSalesQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesQuoteStatus | EnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesQuoteStatus[] | ListEnumSalesQuoteStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.SalesQuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSalesQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumSalesQuoteStatusFilter<$PrismaModel>
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesFulfillmentHandoffStatus | EnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel> | $Enums.SalesFulfillmentHandoffStatus
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumSalesFulfillmentHandoffStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SalesFulfillmentHandoffStatus | EnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SalesFulfillmentHandoffStatus[] | ListEnumSalesFulfillmentHandoffStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSalesFulfillmentHandoffStatusWithAggregatesFilter<$PrismaModel> | $Enums.SalesFulfillmentHandoffStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel>
    _max?: NestedEnumSalesFulfillmentHandoffStatusFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumPriceListTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListType | EnumPriceListTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListTypeFilter<$PrismaModel> | $Enums.PriceListType
  }

  export type NestedEnumPriceListStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListStatus | EnumPriceListStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListStatusFilter<$PrismaModel> | $Enums.PriceListStatus
  }

  export type NestedEnumPriceListTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListType | EnumPriceListTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListType[] | ListEnumPriceListTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListTypeWithAggregatesFilter<$PrismaModel> | $Enums.PriceListType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceListTypeFilter<$PrismaModel>
    _max?: NestedEnumPriceListTypeFilter<$PrismaModel>
  }

  export type NestedEnumPriceListStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PriceListStatus | EnumPriceListStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PriceListStatus[] | ListEnumPriceListStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPriceListStatusWithAggregatesFilter<$PrismaModel> | $Enums.PriceListStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPriceListStatusFilter<$PrismaModel>
    _max?: NestedEnumPriceListStatusFilter<$PrismaModel>
  }

  export type NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomerPriceAgreementStatus | EnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel> | $Enums.CustomerPriceAgreementStatus
  }

  export type NestedEnumCustomerPriceAgreementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CustomerPriceAgreementStatus | EnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CustomerPriceAgreementStatus[] | ListEnumCustomerPriceAgreementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCustomerPriceAgreementStatusWithAggregatesFilter<$PrismaModel> | $Enums.CustomerPriceAgreementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel>
    _max?: NestedEnumCustomerPriceAgreementStatusFilter<$PrismaModel>
  }

  export type SalesQuoteLineCreateWithoutQuoteInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteLineUncheckedCreateWithoutQuoteInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteLineCreateOrConnectWithoutQuoteInput = {
    where: SalesQuoteLineWhereUniqueInput
    create: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput>
  }

  export type SalesQuoteLineCreateManyQuoteInputEnvelope = {
    data: SalesQuoteLineCreateManyQuoteInput | SalesQuoteLineCreateManyQuoteInput[]
    skipDuplicates?: boolean
  }

  export type SalesQuoteLineUpsertWithWhereUniqueWithoutQuoteInput = {
    where: SalesQuoteLineWhereUniqueInput
    update: XOR<SalesQuoteLineUpdateWithoutQuoteInput, SalesQuoteLineUncheckedUpdateWithoutQuoteInput>
    create: XOR<SalesQuoteLineCreateWithoutQuoteInput, SalesQuoteLineUncheckedCreateWithoutQuoteInput>
  }

  export type SalesQuoteLineUpdateWithWhereUniqueWithoutQuoteInput = {
    where: SalesQuoteLineWhereUniqueInput
    data: XOR<SalesQuoteLineUpdateWithoutQuoteInput, SalesQuoteLineUncheckedUpdateWithoutQuoteInput>
  }

  export type SalesQuoteLineUpdateManyWithWhereWithoutQuoteInput = {
    where: SalesQuoteLineScalarWhereInput
    data: XOR<SalesQuoteLineUpdateManyMutationInput, SalesQuoteLineUncheckedUpdateManyWithoutQuoteInput>
  }

  export type SalesQuoteLineScalarWhereInput = {
    AND?: SalesQuoteLineScalarWhereInput | SalesQuoteLineScalarWhereInput[]
    OR?: SalesQuoteLineScalarWhereInput[]
    NOT?: SalesQuoteLineScalarWhereInput | SalesQuoteLineScalarWhereInput[]
    id?: UuidFilter<"SalesQuoteLine"> | string
    tenantId?: StringFilter<"SalesQuoteLine"> | string
    quoteId?: UuidFilter<"SalesQuoteLine"> | string
    lineNo?: IntFilter<"SalesQuoteLine"> | number
    itemId?: StringFilter<"SalesQuoteLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteLine">
    createdAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesQuoteLine"> | Date | string
  }

  export type SalesQuoteCreateWithoutLinesInput = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId?: string | null
    opportunityNo?: string | null
    opportunityName?: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteUncheckedCreateWithoutLinesInput = {
    id: string
    quoteNo: string
    tenantId: string
    customerTenantPartyId: string
    opportunityId?: string | null
    opportunityNo?: string | null
    opportunityName?: string | null
    status: $Enums.SalesQuoteStatus
    latestPublishedVersionId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteCreateOrConnectWithoutLinesInput = {
    where: SalesQuoteWhereUniqueInput
    create: XOR<SalesQuoteCreateWithoutLinesInput, SalesQuoteUncheckedCreateWithoutLinesInput>
  }

  export type SalesQuoteUpsertWithoutLinesInput = {
    update: XOR<SalesQuoteUpdateWithoutLinesInput, SalesQuoteUncheckedUpdateWithoutLinesInput>
    create: XOR<SalesQuoteCreateWithoutLinesInput, SalesQuoteUncheckedCreateWithoutLinesInput>
    where?: SalesQuoteWhereInput
  }

  export type SalesQuoteUpdateToOneWithWhereWithoutLinesInput = {
    where?: SalesQuoteWhereInput
    data: XOR<SalesQuoteUpdateWithoutLinesInput, SalesQuoteUncheckedUpdateWithoutLinesInput>
  }

  export type SalesQuoteUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    opportunityId?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityNo?: NullableStringFieldUpdateOperationsInput | string | null
    opportunityName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSalesQuoteStatusFieldUpdateOperationsInput | $Enums.SalesQuoteStatus
    latestPublishedVersionId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineCreateWithoutQuoteVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesQuoteVersionLineCreateOrConnectWithoutQuoteVersionInput = {
    where: SalesQuoteVersionLineWhereUniqueInput
    create: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput>
  }

  export type SalesQuoteVersionLineCreateManyQuoteVersionInputEnvelope = {
    data: SalesQuoteVersionLineCreateManyQuoteVersionInput | SalesQuoteVersionLineCreateManyQuoteVersionInput[]
    skipDuplicates?: boolean
  }

  export type SalesQuoteVersionLineUpsertWithWhereUniqueWithoutQuoteVersionInput = {
    where: SalesQuoteVersionLineWhereUniqueInput
    update: XOR<SalesQuoteVersionLineUpdateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedUpdateWithoutQuoteVersionInput>
    create: XOR<SalesQuoteVersionLineCreateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedCreateWithoutQuoteVersionInput>
  }

  export type SalesQuoteVersionLineUpdateWithWhereUniqueWithoutQuoteVersionInput = {
    where: SalesQuoteVersionLineWhereUniqueInput
    data: XOR<SalesQuoteVersionLineUpdateWithoutQuoteVersionInput, SalesQuoteVersionLineUncheckedUpdateWithoutQuoteVersionInput>
  }

  export type SalesQuoteVersionLineUpdateManyWithWhereWithoutQuoteVersionInput = {
    where: SalesQuoteVersionLineScalarWhereInput
    data: XOR<SalesQuoteVersionLineUpdateManyMutationInput, SalesQuoteVersionLineUncheckedUpdateManyWithoutQuoteVersionInput>
  }

  export type SalesQuoteVersionLineScalarWhereInput = {
    AND?: SalesQuoteVersionLineScalarWhereInput | SalesQuoteVersionLineScalarWhereInput[]
    OR?: SalesQuoteVersionLineScalarWhereInput[]
    NOT?: SalesQuoteVersionLineScalarWhereInput | SalesQuoteVersionLineScalarWhereInput[]
    id?: UuidFilter<"SalesQuoteVersionLine"> | string
    tenantId?: StringFilter<"SalesQuoteVersionLine"> | string
    quoteVersionId?: UuidFilter<"SalesQuoteVersionLine"> | string
    lineNo?: IntFilter<"SalesQuoteVersionLine"> | number
    itemId?: StringFilter<"SalesQuoteVersionLine"> | string
    itemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    salesConfigSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesQuoteVersionLine">
    customerItemSnapshot?: JsonFilter<"SalesQuoteVersionLine">
    createdAt?: DateTimeFilter<"SalesQuoteVersionLine"> | Date | string
  }

  export type SalesQuoteVersionCreateWithoutLinesInput = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date | string
    createdAt?: Date | string
  }

  export type SalesQuoteVersionUncheckedCreateWithoutLinesInput = {
    id: string
    quoteId: string
    quoteNo: string
    versionNo: number
    tenantId: string
    customerTenantPartyId: string
    publishedAt: Date | string
    createdAt?: Date | string
  }

  export type SalesQuoteVersionCreateOrConnectWithoutLinesInput = {
    where: SalesQuoteVersionWhereUniqueInput
    create: XOR<SalesQuoteVersionCreateWithoutLinesInput, SalesQuoteVersionUncheckedCreateWithoutLinesInput>
  }

  export type SalesQuoteVersionUpsertWithoutLinesInput = {
    update: XOR<SalesQuoteVersionUpdateWithoutLinesInput, SalesQuoteVersionUncheckedUpdateWithoutLinesInput>
    create: XOR<SalesQuoteVersionCreateWithoutLinesInput, SalesQuoteVersionUncheckedCreateWithoutLinesInput>
    where?: SalesQuoteVersionWhereInput
  }

  export type SalesQuoteVersionUpdateToOneWithWhereWithoutLinesInput = {
    where?: SalesQuoteVersionWhereInput
    data: XOR<SalesQuoteVersionUpdateWithoutLinesInput, SalesQuoteVersionUncheckedUpdateWithoutLinesInput>
  }

  export type SalesQuoteVersionUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteNo?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    publishedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineCreateWithoutSalesOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderLineUncheckedCreateWithoutSalesOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderLineCreateOrConnectWithoutSalesOrderInput = {
    where: SalesOrderLineWhereUniqueInput
    create: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput>
  }

  export type SalesOrderLineCreateManySalesOrderInputEnvelope = {
    data: SalesOrderLineCreateManySalesOrderInput | SalesOrderLineCreateManySalesOrderInput[]
    skipDuplicates?: boolean
  }

  export type SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput = {
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput = {
    tenantId: string
    orderEstablished: boolean
    productionGate: boolean
    stockingGate: boolean
    shippingGate: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderCommercialGateSummaryCreateOrConnectWithoutSalesOrderInput = {
    where: SalesOrderCommercialGateSummaryWhereUniqueInput
    create: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
  }

  export type SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput = {
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput = {
    tenantId: string
    status: $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryCreateOrConnectWithoutSalesOrderInput = {
    where: SalesOrderFulfillmentHandoffSummaryWhereUniqueInput
    create: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
  }

  export type SalesOrderLineUpsertWithWhereUniqueWithoutSalesOrderInput = {
    where: SalesOrderLineWhereUniqueInput
    update: XOR<SalesOrderLineUpdateWithoutSalesOrderInput, SalesOrderLineUncheckedUpdateWithoutSalesOrderInput>
    create: XOR<SalesOrderLineCreateWithoutSalesOrderInput, SalesOrderLineUncheckedCreateWithoutSalesOrderInput>
  }

  export type SalesOrderLineUpdateWithWhereUniqueWithoutSalesOrderInput = {
    where: SalesOrderLineWhereUniqueInput
    data: XOR<SalesOrderLineUpdateWithoutSalesOrderInput, SalesOrderLineUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderLineUpdateManyWithWhereWithoutSalesOrderInput = {
    where: SalesOrderLineScalarWhereInput
    data: XOR<SalesOrderLineUpdateManyMutationInput, SalesOrderLineUncheckedUpdateManyWithoutSalesOrderInput>
  }

  export type SalesOrderLineScalarWhereInput = {
    AND?: SalesOrderLineScalarWhereInput | SalesOrderLineScalarWhereInput[]
    OR?: SalesOrderLineScalarWhereInput[]
    NOT?: SalesOrderLineScalarWhereInput | SalesOrderLineScalarWhereInput[]
    id?: UuidFilter<"SalesOrderLine"> | string
    tenantId?: StringFilter<"SalesOrderLine"> | string
    salesOrderId?: UuidFilter<"SalesOrderLine"> | string
    lineNo?: IntFilter<"SalesOrderLine"> | number
    itemId?: StringFilter<"SalesOrderLine"> | string
    itemSnapshot?: JsonFilter<"SalesOrderLine">
    salesConfigSnapshot?: JsonFilter<"SalesOrderLine">
    packagingRequirementSnapshot?: JsonFilter<"SalesOrderLine">
    priceQuantityDeliverySnapshot?: JsonFilter<"SalesOrderLine">
    customerItemSnapshot?: JsonFilter<"SalesOrderLine">
    createdAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesOrderLine"> | Date | string
  }

  export type SalesOrderCommercialGateSummaryUpsertWithoutSalesOrderInput = {
    update: XOR<SalesOrderCommercialGateSummaryUpdateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedUpdateWithoutSalesOrderInput>
    create: XOR<SalesOrderCommercialGateSummaryCreateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedCreateWithoutSalesOrderInput>
    where?: SalesOrderCommercialGateSummaryWhereInput
  }

  export type SalesOrderCommercialGateSummaryUpdateToOneWithWhereWithoutSalesOrderInput = {
    where?: SalesOrderCommercialGateSummaryWhereInput
    data: XOR<SalesOrderCommercialGateSummaryUpdateWithoutSalesOrderInput, SalesOrderCommercialGateSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderCommercialGateSummaryUpdateWithoutSalesOrderInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCommercialGateSummaryUncheckedUpdateWithoutSalesOrderInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    orderEstablished?: BoolFieldUpdateOperationsInput | boolean
    productionGate?: BoolFieldUpdateOperationsInput | boolean
    stockingGate?: BoolFieldUpdateOperationsInput | boolean
    shippingGate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUpsertWithoutSalesOrderInput = {
    update: XOR<SalesOrderFulfillmentHandoffSummaryUpdateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateWithoutSalesOrderInput>
    create: XOR<SalesOrderFulfillmentHandoffSummaryCreateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedCreateWithoutSalesOrderInput>
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
  }

  export type SalesOrderFulfillmentHandoffSummaryUpdateToOneWithWhereWithoutSalesOrderInput = {
    where?: SalesOrderFulfillmentHandoffSummaryWhereInput
    data: XOR<SalesOrderFulfillmentHandoffSummaryUpdateWithoutSalesOrderInput, SalesOrderFulfillmentHandoffSummaryUncheckedUpdateWithoutSalesOrderInput>
  }

  export type SalesOrderFulfillmentHandoffSummaryUpdateWithoutSalesOrderInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderFulfillmentHandoffSummaryUncheckedUpdateWithoutSalesOrderInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    status?: EnumSalesFulfillmentHandoffStatusFieldUpdateOperationsInput | $Enums.SalesFulfillmentHandoffStatus
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderCreateWithoutCommercialGateSummaryInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineCreateNestedManyWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderUncheckedCreateWithoutCommercialGateSummaryInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineUncheckedCreateNestedManyWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderCreateOrConnectWithoutCommercialGateSummaryInput = {
    where: SalesOrderWhereUniqueInput
    create: XOR<SalesOrderCreateWithoutCommercialGateSummaryInput, SalesOrderUncheckedCreateWithoutCommercialGateSummaryInput>
  }

  export type SalesOrderUpsertWithoutCommercialGateSummaryInput = {
    update: XOR<SalesOrderUpdateWithoutCommercialGateSummaryInput, SalesOrderUncheckedUpdateWithoutCommercialGateSummaryInput>
    create: XOR<SalesOrderCreateWithoutCommercialGateSummaryInput, SalesOrderUncheckedCreateWithoutCommercialGateSummaryInput>
    where?: SalesOrderWhereInput
  }

  export type SalesOrderUpdateToOneWithWhereWithoutCommercialGateSummaryInput = {
    where?: SalesOrderWhereInput
    data: XOR<SalesOrderUpdateWithoutCommercialGateSummaryInput, SalesOrderUncheckedUpdateWithoutCommercialGateSummaryInput>
  }

  export type SalesOrderUpdateWithoutCommercialGateSummaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUpdateManyWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderUncheckedUpdateWithoutCommercialGateSummaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUncheckedUpdateManyWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderCreateWithoutFulfillmentHandoffSummaryInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineCreateNestedManyWithoutSalesOrderInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderUncheckedCreateWithoutFulfillmentHandoffSummaryInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lines?: SalesOrderLineUncheckedCreateNestedManyWithoutSalesOrderInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderCreateOrConnectWithoutFulfillmentHandoffSummaryInput = {
    where: SalesOrderWhereUniqueInput
    create: XOR<SalesOrderCreateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedCreateWithoutFulfillmentHandoffSummaryInput>
  }

  export type SalesOrderUpsertWithoutFulfillmentHandoffSummaryInput = {
    update: XOR<SalesOrderUpdateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedUpdateWithoutFulfillmentHandoffSummaryInput>
    create: XOR<SalesOrderCreateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedCreateWithoutFulfillmentHandoffSummaryInput>
    where?: SalesOrderWhereInput
  }

  export type SalesOrderUpdateToOneWithWhereWithoutFulfillmentHandoffSummaryInput = {
    where?: SalesOrderWhereInput
    data: XOR<SalesOrderUpdateWithoutFulfillmentHandoffSummaryInput, SalesOrderUncheckedUpdateWithoutFulfillmentHandoffSummaryInput>
  }

  export type SalesOrderUpdateWithoutFulfillmentHandoffSummaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUpdateManyWithoutSalesOrderNestedInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderUncheckedUpdateWithoutFulfillmentHandoffSummaryInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: SalesOrderLineUncheckedUpdateManyWithoutSalesOrderNestedInput
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderCreateWithoutLinesInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    commercialGateSummary?: SalesOrderCommercialGateSummaryCreateNestedOneWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderUncheckedCreateWithoutLinesInput = {
    id: string
    salesOrderNo: string
    tenantId: string
    customerTenantPartyId: string
    quoteId: string
    quoteVersionId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedCreateNestedOneWithoutSalesOrderInput
  }

  export type SalesOrderCreateOrConnectWithoutLinesInput = {
    where: SalesOrderWhereUniqueInput
    create: XOR<SalesOrderCreateWithoutLinesInput, SalesOrderUncheckedCreateWithoutLinesInput>
  }

  export type SalesOrderUpsertWithoutLinesInput = {
    update: XOR<SalesOrderUpdateWithoutLinesInput, SalesOrderUncheckedUpdateWithoutLinesInput>
    create: XOR<SalesOrderCreateWithoutLinesInput, SalesOrderUncheckedCreateWithoutLinesInput>
    where?: SalesOrderWhereInput
  }

  export type SalesOrderUpdateToOneWithWhereWithoutLinesInput = {
    where?: SalesOrderWhereInput
    data: XOR<SalesOrderUpdateWithoutLinesInput, SalesOrderUncheckedUpdateWithoutLinesInput>
  }

  export type SalesOrderUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    commercialGateSummary?: SalesOrderCommercialGateSummaryUpdateOneWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesOrderUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    salesOrderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    quoteVersionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    commercialGateSummary?: SalesOrderCommercialGateSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
    fulfillmentHandoffSummary?: SalesOrderFulfillmentHandoffSummaryUncheckedUpdateOneWithoutSalesOrderNestedInput
  }

  export type SalesPriceListLineCreateWithoutPriceListInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListLineUncheckedCreateWithoutPriceListInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListLineCreateOrConnectWithoutPriceListInput = {
    where: SalesPriceListLineWhereUniqueInput
    create: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput>
  }

  export type SalesPriceListLineCreateManyPriceListInputEnvelope = {
    data: SalesPriceListLineCreateManyPriceListInput | SalesPriceListLineCreateManyPriceListInput[]
    skipDuplicates?: boolean
  }

  export type SalesPriceListLineUpsertWithWhereUniqueWithoutPriceListInput = {
    where: SalesPriceListLineWhereUniqueInput
    update: XOR<SalesPriceListLineUpdateWithoutPriceListInput, SalesPriceListLineUncheckedUpdateWithoutPriceListInput>
    create: XOR<SalesPriceListLineCreateWithoutPriceListInput, SalesPriceListLineUncheckedCreateWithoutPriceListInput>
  }

  export type SalesPriceListLineUpdateWithWhereUniqueWithoutPriceListInput = {
    where: SalesPriceListLineWhereUniqueInput
    data: XOR<SalesPriceListLineUpdateWithoutPriceListInput, SalesPriceListLineUncheckedUpdateWithoutPriceListInput>
  }

  export type SalesPriceListLineUpdateManyWithWhereWithoutPriceListInput = {
    where: SalesPriceListLineScalarWhereInput
    data: XOR<SalesPriceListLineUpdateManyMutationInput, SalesPriceListLineUncheckedUpdateManyWithoutPriceListInput>
  }

  export type SalesPriceListLineScalarWhereInput = {
    AND?: SalesPriceListLineScalarWhereInput | SalesPriceListLineScalarWhereInput[]
    OR?: SalesPriceListLineScalarWhereInput[]
    NOT?: SalesPriceListLineScalarWhereInput | SalesPriceListLineScalarWhereInput[]
    id?: UuidFilter<"SalesPriceListLine"> | string
    tenantId?: StringFilter<"SalesPriceListLine"> | string
    priceListId?: UuidFilter<"SalesPriceListLine"> | string
    lineNo?: IntFilter<"SalesPriceListLine"> | number
    itemId?: StringFilter<"SalesPriceListLine"> | string
    brandKey?: StringNullableFilter<"SalesPriceListLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesPriceListLine">
    moqSnapshot?: JsonFilter<"SalesPriceListLine">
    createdAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesPriceListLine"> | Date | string
  }

  export type SalesPriceListCreateWithoutLinesInput = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date | string
    effectiveTo?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListUncheckedCreateWithoutLinesInput = {
    id: string
    tenantId: string
    priceListName: string
    priceListType: $Enums.PriceListType
    status: $Enums.PriceListStatus
    currencyCode: string
    effectiveFrom: Date | string
    effectiveTo?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListCreateOrConnectWithoutLinesInput = {
    where: SalesPriceListWhereUniqueInput
    create: XOR<SalesPriceListCreateWithoutLinesInput, SalesPriceListUncheckedCreateWithoutLinesInput>
  }

  export type SalesPriceListUpsertWithoutLinesInput = {
    update: XOR<SalesPriceListUpdateWithoutLinesInput, SalesPriceListUncheckedUpdateWithoutLinesInput>
    create: XOR<SalesPriceListCreateWithoutLinesInput, SalesPriceListUncheckedCreateWithoutLinesInput>
    where?: SalesPriceListWhereInput
  }

  export type SalesPriceListUpdateToOneWithWhereWithoutLinesInput = {
    where?: SalesPriceListWhereInput
    data: XOR<SalesPriceListUpdateWithoutLinesInput, SalesPriceListUncheckedUpdateWithoutLinesInput>
  }

  export type SalesPriceListUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    priceListName?: StringFieldUpdateOperationsInput | string
    priceListType?: EnumPriceListTypeFieldUpdateOperationsInput | $Enums.PriceListType
    status?: EnumPriceListStatusFieldUpdateOperationsInput | $Enums.PriceListStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    effectiveFrom?: DateTimeFieldUpdateOperationsInput | Date | string
    effectiveTo?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementLineCreateOrConnectWithoutCustomerPriceAgreementVersionInput = {
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
    create: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput>
  }

  export type SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInputEnvelope = {
    data: SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInput | SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInput[]
    skipDuplicates?: boolean
  }

  export type SalesCustomerPriceAgreementLineUpsertWithWhereUniqueWithoutCustomerPriceAgreementVersionInput = {
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
    update: XOR<SalesCustomerPriceAgreementLineUpdateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedUpdateWithoutCustomerPriceAgreementVersionInput>
    create: XOR<SalesCustomerPriceAgreementLineCreateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedCreateWithoutCustomerPriceAgreementVersionInput>
  }

  export type SalesCustomerPriceAgreementLineUpdateWithWhereUniqueWithoutCustomerPriceAgreementVersionInput = {
    where: SalesCustomerPriceAgreementLineWhereUniqueInput
    data: XOR<SalesCustomerPriceAgreementLineUpdateWithoutCustomerPriceAgreementVersionInput, SalesCustomerPriceAgreementLineUncheckedUpdateWithoutCustomerPriceAgreementVersionInput>
  }

  export type SalesCustomerPriceAgreementLineUpdateManyWithWhereWithoutCustomerPriceAgreementVersionInput = {
    where: SalesCustomerPriceAgreementLineScalarWhereInput
    data: XOR<SalesCustomerPriceAgreementLineUpdateManyMutationInput, SalesCustomerPriceAgreementLineUncheckedUpdateManyWithoutCustomerPriceAgreementVersionInput>
  }

  export type SalesCustomerPriceAgreementLineScalarWhereInput = {
    AND?: SalesCustomerPriceAgreementLineScalarWhereInput | SalesCustomerPriceAgreementLineScalarWhereInput[]
    OR?: SalesCustomerPriceAgreementLineScalarWhereInput[]
    NOT?: SalesCustomerPriceAgreementLineScalarWhereInput | SalesCustomerPriceAgreementLineScalarWhereInput[]
    id?: UuidFilter<"SalesCustomerPriceAgreementLine"> | string
    tenantId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    customerPriceAgreementVersionId?: UuidFilter<"SalesCustomerPriceAgreementLine"> | string
    lineNo?: IntFilter<"SalesCustomerPriceAgreementLine"> | number
    itemId?: StringFilter<"SalesCustomerPriceAgreementLine"> | string
    brandKey?: StringNullableFilter<"SalesCustomerPriceAgreementLine"> | string | null
    priceSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    moqSnapshot?: JsonFilter<"SalesCustomerPriceAgreementLine">
    createdAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
    updatedAt?: DateTimeFilter<"SalesCustomerPriceAgreementLine"> | Date | string
  }

  export type SalesCustomerPriceAgreementVersionCreateWithoutLinesInput = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementVersionUncheckedCreateWithoutLinesInput = {
    id: string
    customerPriceAgreementId: string
    tenantId: string
    customerTenantPartyId: string
    currencyCode: string
    versionNo: number
    status: $Enums.CustomerPriceAgreementStatus
    publishedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementVersionCreateOrConnectWithoutLinesInput = {
    where: SalesCustomerPriceAgreementVersionWhereUniqueInput
    create: XOR<SalesCustomerPriceAgreementVersionCreateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedCreateWithoutLinesInput>
  }

  export type SalesCustomerPriceAgreementVersionUpsertWithoutLinesInput = {
    update: XOR<SalesCustomerPriceAgreementVersionUpdateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedUpdateWithoutLinesInput>
    create: XOR<SalesCustomerPriceAgreementVersionCreateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedCreateWithoutLinesInput>
    where?: SalesCustomerPriceAgreementVersionWhereInput
  }

  export type SalesCustomerPriceAgreementVersionUpdateToOneWithWhereWithoutLinesInput = {
    where?: SalesCustomerPriceAgreementVersionWhereInput
    data: XOR<SalesCustomerPriceAgreementVersionUpdateWithoutLinesInput, SalesCustomerPriceAgreementVersionUncheckedUpdateWithoutLinesInput>
  }

  export type SalesCustomerPriceAgreementVersionUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementVersionUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerPriceAgreementId?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerTenantPartyId?: StringFieldUpdateOperationsInput | string
    currencyCode?: StringFieldUpdateOperationsInput | string
    versionNo?: IntFieldUpdateOperationsInput | number
    status?: EnumCustomerPriceAgreementStatusFieldUpdateOperationsInput | $Enums.CustomerPriceAgreementStatus
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineCreateManyQuoteInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesQuoteLineUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteLineUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineCreateManyQuoteVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type SalesQuoteVersionLineUpdateWithoutQuoteVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineUncheckedUpdateWithoutQuoteVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesQuoteVersionLineUncheckedUpdateManyWithoutQuoteVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineCreateManySalesOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemSnapshot: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot: JsonNullValueInput | InputJsonValue
    customerItemSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesOrderLineUpdateWithoutSalesOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineUncheckedUpdateWithoutSalesOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesOrderLineUncheckedUpdateManyWithoutSalesOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemSnapshot?: JsonNullValueInput | InputJsonValue
    salesConfigSnapshot?: JsonNullValueInput | InputJsonValue
    packagingRequirementSnapshot?: JsonNullValueInput | InputJsonValue
    priceQuantityDeliverySnapshot?: JsonNullValueInput | InputJsonValue
    customerItemSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineCreateManyPriceListInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesPriceListLineUpdateWithoutPriceListInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineUncheckedUpdateWithoutPriceListInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesPriceListLineUncheckedUpdateManyWithoutPriceListInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineCreateManyCustomerPriceAgreementVersionInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    brandKey?: string | null
    priceSnapshot: JsonNullValueInput | InputJsonValue
    moqSnapshot: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SalesCustomerPriceAgreementLineUpdateWithoutCustomerPriceAgreementVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineUncheckedUpdateWithoutCustomerPriceAgreementVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SalesCustomerPriceAgreementLineUncheckedUpdateManyWithoutCustomerPriceAgreementVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    brandKey?: NullableStringFieldUpdateOperationsInput | string | null
    priceSnapshot?: JsonNullValueInput | InputJsonValue
    moqSnapshot?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}