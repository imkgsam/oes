
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
 * Model WmsSequenceCounter
 * 
 */
export type WmsSequenceCounter = $Result.DefaultSelection<Prisma.$WmsSequenceCounterPayload>
/**
 * Model Warehouse
 * 
 */
export type Warehouse = $Result.DefaultSelection<Prisma.$WarehousePayload>
/**
 * Model Location
 * 
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>
/**
 * Model Receipt
 * 
 */
export type Receipt = $Result.DefaultSelection<Prisma.$ReceiptPayload>
/**
 * Model ReceiptLine
 * 
 */
export type ReceiptLine = $Result.DefaultSelection<Prisma.$ReceiptLinePayload>
/**
 * Model StockLedgerEntry
 * 
 */
export type StockLedgerEntry = $Result.DefaultSelection<Prisma.$StockLedgerEntryPayload>
/**
 * Model InventoryBalance
 * 
 */
export type InventoryBalance = $Result.DefaultSelection<Prisma.$InventoryBalancePayload>
/**
 * Model WmsAuditEnvelope
 * 
 */
export type WmsAuditEnvelope = $Result.DefaultSelection<Prisma.$WmsAuditEnvelopePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const WmsWarehouseScope: {
  INTERNAL: 'INTERNAL'
};

export type WmsWarehouseScope = (typeof WmsWarehouseScope)[keyof typeof WmsWarehouseScope]


export const WmsWarehouseStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type WmsWarehouseStatus = (typeof WmsWarehouseStatus)[keyof typeof WmsWarehouseStatus]


export const WmsLocationScope: {
  INTERNAL: 'INTERNAL'
};

export type WmsLocationScope = (typeof WmsLocationScope)[keyof typeof WmsLocationScope]


export const WmsLocationType: {
  RECEIVING: 'RECEIVING',
  STORAGE: 'STORAGE',
  STAGING: 'STAGING',
  RESTRICTED: 'RESTRICTED'
};

export type WmsLocationType = (typeof WmsLocationType)[keyof typeof WmsLocationType]


export const WmsLocationStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type WmsLocationStatus = (typeof WmsLocationStatus)[keyof typeof WmsLocationStatus]


export const WmsReceiptStatus: {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  CANCELLED: 'CANCELLED'
};

export type WmsReceiptStatus = (typeof WmsReceiptStatus)[keyof typeof WmsReceiptStatus]


export const WmsReceiptSourceType: {
  MANUAL: 'MANUAL',
  RECEIVING_EXPECTATION_REFERENCE: 'RECEIVING_EXPECTATION_REFERENCE'
};

export type WmsReceiptSourceType = (typeof WmsReceiptSourceType)[keyof typeof WmsReceiptSourceType]


export const WmsInventoryStatus: {
  AVAILABLE: 'AVAILABLE',
  RESTRICTED: 'RESTRICTED'
};

export type WmsInventoryStatus = (typeof WmsInventoryStatus)[keyof typeof WmsInventoryStatus]


export const WmsStockLedgerEntryType: {
  RECEIPT_POSTED: 'RECEIPT_POSTED'
};

export type WmsStockLedgerEntryType = (typeof WmsStockLedgerEntryType)[keyof typeof WmsStockLedgerEntryType]


export const WmsStockLedgerDirection: {
  IN: 'IN'
};

export type WmsStockLedgerDirection = (typeof WmsStockLedgerDirection)[keyof typeof WmsStockLedgerDirection]


export const WmsStockLedgerSourceDocumentType: {
  RECEIPT: 'RECEIPT'
};

export type WmsStockLedgerSourceDocumentType = (typeof WmsStockLedgerSourceDocumentType)[keyof typeof WmsStockLedgerSourceDocumentType]

}

export type WmsWarehouseScope = $Enums.WmsWarehouseScope

export const WmsWarehouseScope: typeof $Enums.WmsWarehouseScope

export type WmsWarehouseStatus = $Enums.WmsWarehouseStatus

export const WmsWarehouseStatus: typeof $Enums.WmsWarehouseStatus

export type WmsLocationScope = $Enums.WmsLocationScope

export const WmsLocationScope: typeof $Enums.WmsLocationScope

export type WmsLocationType = $Enums.WmsLocationType

export const WmsLocationType: typeof $Enums.WmsLocationType

export type WmsLocationStatus = $Enums.WmsLocationStatus

export const WmsLocationStatus: typeof $Enums.WmsLocationStatus

export type WmsReceiptStatus = $Enums.WmsReceiptStatus

export const WmsReceiptStatus: typeof $Enums.WmsReceiptStatus

export type WmsReceiptSourceType = $Enums.WmsReceiptSourceType

export const WmsReceiptSourceType: typeof $Enums.WmsReceiptSourceType

export type WmsInventoryStatus = $Enums.WmsInventoryStatus

export const WmsInventoryStatus: typeof $Enums.WmsInventoryStatus

export type WmsStockLedgerEntryType = $Enums.WmsStockLedgerEntryType

export const WmsStockLedgerEntryType: typeof $Enums.WmsStockLedgerEntryType

export type WmsStockLedgerDirection = $Enums.WmsStockLedgerDirection

export const WmsStockLedgerDirection: typeof $Enums.WmsStockLedgerDirection

export type WmsStockLedgerSourceDocumentType = $Enums.WmsStockLedgerSourceDocumentType

export const WmsStockLedgerSourceDocumentType: typeof $Enums.WmsStockLedgerSourceDocumentType

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more WmsSequenceCounters
 * const wmsSequenceCounters = await prisma.wmsSequenceCounter.findMany()
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
   * // Fetch zero or more WmsSequenceCounters
   * const wmsSequenceCounters = await prisma.wmsSequenceCounter.findMany()
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
   * `prisma.wmsSequenceCounter`: Exposes CRUD operations for the **WmsSequenceCounter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WmsSequenceCounters
    * const wmsSequenceCounters = await prisma.wmsSequenceCounter.findMany()
    * ```
    */
  get wmsSequenceCounter(): Prisma.WmsSequenceCounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.warehouse`: Exposes CRUD operations for the **Warehouse** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Warehouses
    * const warehouses = await prisma.warehouse.findMany()
    * ```
    */
  get warehouse(): Prisma.WarehouseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locations
    * const locations = await prisma.location.findMany()
    * ```
    */
  get location(): Prisma.LocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.receipt`: Exposes CRUD operations for the **Receipt** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Receipts
    * const receipts = await prisma.receipt.findMany()
    * ```
    */
  get receipt(): Prisma.ReceiptDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.receiptLine`: Exposes CRUD operations for the **ReceiptLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReceiptLines
    * const receiptLines = await prisma.receiptLine.findMany()
    * ```
    */
  get receiptLine(): Prisma.ReceiptLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.stockLedgerEntry`: Exposes CRUD operations for the **StockLedgerEntry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more StockLedgerEntries
    * const stockLedgerEntries = await prisma.stockLedgerEntry.findMany()
    * ```
    */
  get stockLedgerEntry(): Prisma.StockLedgerEntryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inventoryBalance`: Exposes CRUD operations for the **InventoryBalance** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryBalances
    * const inventoryBalances = await prisma.inventoryBalance.findMany()
    * ```
    */
  get inventoryBalance(): Prisma.InventoryBalanceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.wmsAuditEnvelope`: Exposes CRUD operations for the **WmsAuditEnvelope** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WmsAuditEnvelopes
    * const wmsAuditEnvelopes = await prisma.wmsAuditEnvelope.findMany()
    * ```
    */
  get wmsAuditEnvelope(): Prisma.WmsAuditEnvelopeDelegate<ExtArgs, ClientOptions>;
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
    WmsSequenceCounter: 'WmsSequenceCounter',
    Warehouse: 'Warehouse',
    Location: 'Location',
    Receipt: 'Receipt',
    ReceiptLine: 'ReceiptLine',
    StockLedgerEntry: 'StockLedgerEntry',
    InventoryBalance: 'InventoryBalance',
    WmsAuditEnvelope: 'WmsAuditEnvelope'
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
      modelProps: "wmsSequenceCounter" | "warehouse" | "location" | "receipt" | "receiptLine" | "stockLedgerEntry" | "inventoryBalance" | "wmsAuditEnvelope"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      WmsSequenceCounter: {
        payload: Prisma.$WmsSequenceCounterPayload<ExtArgs>
        fields: Prisma.WmsSequenceCounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WmsSequenceCounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WmsSequenceCounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          findFirst: {
            args: Prisma.WmsSequenceCounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WmsSequenceCounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          findMany: {
            args: Prisma.WmsSequenceCounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>[]
          }
          create: {
            args: Prisma.WmsSequenceCounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          createMany: {
            args: Prisma.WmsSequenceCounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WmsSequenceCounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>[]
          }
          delete: {
            args: Prisma.WmsSequenceCounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          update: {
            args: Prisma.WmsSequenceCounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          deleteMany: {
            args: Prisma.WmsSequenceCounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WmsSequenceCounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WmsSequenceCounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>[]
          }
          upsert: {
            args: Prisma.WmsSequenceCounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsSequenceCounterPayload>
          }
          aggregate: {
            args: Prisma.WmsSequenceCounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWmsSequenceCounter>
          }
          groupBy: {
            args: Prisma.WmsSequenceCounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<WmsSequenceCounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.WmsSequenceCounterCountArgs<ExtArgs>
            result: $Utils.Optional<WmsSequenceCounterCountAggregateOutputType> | number
          }
        }
      }
      Warehouse: {
        payload: Prisma.$WarehousePayload<ExtArgs>
        fields: Prisma.WarehouseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WarehouseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WarehouseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          findFirst: {
            args: Prisma.WarehouseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WarehouseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          findMany: {
            args: Prisma.WarehouseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>[]
          }
          create: {
            args: Prisma.WarehouseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          createMany: {
            args: Prisma.WarehouseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WarehouseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>[]
          }
          delete: {
            args: Prisma.WarehouseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          update: {
            args: Prisma.WarehouseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          deleteMany: {
            args: Prisma.WarehouseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WarehouseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WarehouseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>[]
          }
          upsert: {
            args: Prisma.WarehouseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WarehousePayload>
          }
          aggregate: {
            args: Prisma.WarehouseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWarehouse>
          }
          groupBy: {
            args: Prisma.WarehouseGroupByArgs<ExtArgs>
            result: $Utils.Optional<WarehouseGroupByOutputType>[]
          }
          count: {
            args: Prisma.WarehouseCountArgs<ExtArgs>
            result: $Utils.Optional<WarehouseCountAggregateOutputType> | number
          }
        }
      }
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>
        fields: Prisma.LocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LocationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[]
          }
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>
          }
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocation>
          }
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>
            result: $Utils.Optional<LocationCountAggregateOutputType> | number
          }
        }
      }
      Receipt: {
        payload: Prisma.$ReceiptPayload<ExtArgs>
        fields: Prisma.ReceiptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReceiptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReceiptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          findFirst: {
            args: Prisma.ReceiptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReceiptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          findMany: {
            args: Prisma.ReceiptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>[]
          }
          create: {
            args: Prisma.ReceiptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          createMany: {
            args: Prisma.ReceiptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReceiptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>[]
          }
          delete: {
            args: Prisma.ReceiptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          update: {
            args: Prisma.ReceiptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          deleteMany: {
            args: Prisma.ReceiptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReceiptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReceiptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>[]
          }
          upsert: {
            args: Prisma.ReceiptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptPayload>
          }
          aggregate: {
            args: Prisma.ReceiptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReceipt>
          }
          groupBy: {
            args: Prisma.ReceiptGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReceiptGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReceiptCountArgs<ExtArgs>
            result: $Utils.Optional<ReceiptCountAggregateOutputType> | number
          }
        }
      }
      ReceiptLine: {
        payload: Prisma.$ReceiptLinePayload<ExtArgs>
        fields: Prisma.ReceiptLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReceiptLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReceiptLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          findFirst: {
            args: Prisma.ReceiptLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReceiptLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          findMany: {
            args: Prisma.ReceiptLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>[]
          }
          create: {
            args: Prisma.ReceiptLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          createMany: {
            args: Prisma.ReceiptLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReceiptLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>[]
          }
          delete: {
            args: Prisma.ReceiptLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          update: {
            args: Prisma.ReceiptLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          deleteMany: {
            args: Prisma.ReceiptLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReceiptLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReceiptLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>[]
          }
          upsert: {
            args: Prisma.ReceiptLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceiptLinePayload>
          }
          aggregate: {
            args: Prisma.ReceiptLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReceiptLine>
          }
          groupBy: {
            args: Prisma.ReceiptLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReceiptLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReceiptLineCountArgs<ExtArgs>
            result: $Utils.Optional<ReceiptLineCountAggregateOutputType> | number
          }
        }
      }
      StockLedgerEntry: {
        payload: Prisma.$StockLedgerEntryPayload<ExtArgs>
        fields: Prisma.StockLedgerEntryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.StockLedgerEntryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.StockLedgerEntryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          findFirst: {
            args: Prisma.StockLedgerEntryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.StockLedgerEntryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          findMany: {
            args: Prisma.StockLedgerEntryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>[]
          }
          create: {
            args: Prisma.StockLedgerEntryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          createMany: {
            args: Prisma.StockLedgerEntryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.StockLedgerEntryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>[]
          }
          delete: {
            args: Prisma.StockLedgerEntryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          update: {
            args: Prisma.StockLedgerEntryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          deleteMany: {
            args: Prisma.StockLedgerEntryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.StockLedgerEntryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.StockLedgerEntryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>[]
          }
          upsert: {
            args: Prisma.StockLedgerEntryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$StockLedgerEntryPayload>
          }
          aggregate: {
            args: Prisma.StockLedgerEntryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateStockLedgerEntry>
          }
          groupBy: {
            args: Prisma.StockLedgerEntryGroupByArgs<ExtArgs>
            result: $Utils.Optional<StockLedgerEntryGroupByOutputType>[]
          }
          count: {
            args: Prisma.StockLedgerEntryCountArgs<ExtArgs>
            result: $Utils.Optional<StockLedgerEntryCountAggregateOutputType> | number
          }
        }
      }
      InventoryBalance: {
        payload: Prisma.$InventoryBalancePayload<ExtArgs>
        fields: Prisma.InventoryBalanceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryBalanceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryBalanceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          findFirst: {
            args: Prisma.InventoryBalanceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryBalanceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          findMany: {
            args: Prisma.InventoryBalanceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>[]
          }
          create: {
            args: Prisma.InventoryBalanceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          createMany: {
            args: Prisma.InventoryBalanceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryBalanceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>[]
          }
          delete: {
            args: Prisma.InventoryBalanceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          update: {
            args: Prisma.InventoryBalanceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          deleteMany: {
            args: Prisma.InventoryBalanceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryBalanceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InventoryBalanceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>[]
          }
          upsert: {
            args: Prisma.InventoryBalanceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryBalancePayload>
          }
          aggregate: {
            args: Prisma.InventoryBalanceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryBalance>
          }
          groupBy: {
            args: Prisma.InventoryBalanceGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryBalanceGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryBalanceCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryBalanceCountAggregateOutputType> | number
          }
        }
      }
      WmsAuditEnvelope: {
        payload: Prisma.$WmsAuditEnvelopePayload<ExtArgs>
        fields: Prisma.WmsAuditEnvelopeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WmsAuditEnvelopeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WmsAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          findFirst: {
            args: Prisma.WmsAuditEnvelopeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WmsAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          findMany: {
            args: Prisma.WmsAuditEnvelopeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>[]
          }
          create: {
            args: Prisma.WmsAuditEnvelopeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          createMany: {
            args: Prisma.WmsAuditEnvelopeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WmsAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>[]
          }
          delete: {
            args: Prisma.WmsAuditEnvelopeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          update: {
            args: Prisma.WmsAuditEnvelopeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          deleteMany: {
            args: Prisma.WmsAuditEnvelopeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WmsAuditEnvelopeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WmsAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>[]
          }
          upsert: {
            args: Prisma.WmsAuditEnvelopeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WmsAuditEnvelopePayload>
          }
          aggregate: {
            args: Prisma.WmsAuditEnvelopeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWmsAuditEnvelope>
          }
          groupBy: {
            args: Prisma.WmsAuditEnvelopeGroupByArgs<ExtArgs>
            result: $Utils.Optional<WmsAuditEnvelopeGroupByOutputType>[]
          }
          count: {
            args: Prisma.WmsAuditEnvelopeCountArgs<ExtArgs>
            result: $Utils.Optional<WmsAuditEnvelopeCountAggregateOutputType> | number
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
    wmsSequenceCounter?: WmsSequenceCounterOmit
    warehouse?: WarehouseOmit
    location?: LocationOmit
    receipt?: ReceiptOmit
    receiptLine?: ReceiptLineOmit
    stockLedgerEntry?: StockLedgerEntryOmit
    inventoryBalance?: InventoryBalanceOmit
    wmsAuditEnvelope?: WmsAuditEnvelopeOmit
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
   * Count Type ReceiptCountOutputType
   */

  export type ReceiptCountOutputType = {
    lines: number
  }

  export type ReceiptCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | ReceiptCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * ReceiptCountOutputType without action
   */
  export type ReceiptCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptCountOutputType
     */
    select?: ReceiptCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ReceiptCountOutputType without action
   */
  export type ReceiptCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceiptLineWhereInput
  }


  /**
   * Models
   */

  /**
   * Model WmsSequenceCounter
   */

  export type AggregateWmsSequenceCounter = {
    _count: WmsSequenceCounterCountAggregateOutputType | null
    _avg: WmsSequenceCounterAvgAggregateOutputType | null
    _sum: WmsSequenceCounterSumAggregateOutputType | null
    _min: WmsSequenceCounterMinAggregateOutputType | null
    _max: WmsSequenceCounterMaxAggregateOutputType | null
  }

  export type WmsSequenceCounterAvgAggregateOutputType = {
    nextReceiptNo: number | null
  }

  export type WmsSequenceCounterSumAggregateOutputType = {
    nextReceiptNo: number | null
  }

  export type WmsSequenceCounterMinAggregateOutputType = {
    tenantId: string | null
    nextReceiptNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WmsSequenceCounterMaxAggregateOutputType = {
    tenantId: string | null
    nextReceiptNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WmsSequenceCounterCountAggregateOutputType = {
    tenantId: number
    nextReceiptNo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WmsSequenceCounterAvgAggregateInputType = {
    nextReceiptNo?: true
  }

  export type WmsSequenceCounterSumAggregateInputType = {
    nextReceiptNo?: true
  }

  export type WmsSequenceCounterMinAggregateInputType = {
    tenantId?: true
    nextReceiptNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WmsSequenceCounterMaxAggregateInputType = {
    tenantId?: true
    nextReceiptNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WmsSequenceCounterCountAggregateInputType = {
    tenantId?: true
    nextReceiptNo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WmsSequenceCounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WmsSequenceCounter to aggregate.
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsSequenceCounters to fetch.
     */
    orderBy?: WmsSequenceCounterOrderByWithRelationInput | WmsSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WmsSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WmsSequenceCounters
    **/
    _count?: true | WmsSequenceCounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WmsSequenceCounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WmsSequenceCounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WmsSequenceCounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WmsSequenceCounterMaxAggregateInputType
  }

  export type GetWmsSequenceCounterAggregateType<T extends WmsSequenceCounterAggregateArgs> = {
        [P in keyof T & keyof AggregateWmsSequenceCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWmsSequenceCounter[P]>
      : GetScalarType<T[P], AggregateWmsSequenceCounter[P]>
  }




  export type WmsSequenceCounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WmsSequenceCounterWhereInput
    orderBy?: WmsSequenceCounterOrderByWithAggregationInput | WmsSequenceCounterOrderByWithAggregationInput[]
    by: WmsSequenceCounterScalarFieldEnum[] | WmsSequenceCounterScalarFieldEnum
    having?: WmsSequenceCounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WmsSequenceCounterCountAggregateInputType | true
    _avg?: WmsSequenceCounterAvgAggregateInputType
    _sum?: WmsSequenceCounterSumAggregateInputType
    _min?: WmsSequenceCounterMinAggregateInputType
    _max?: WmsSequenceCounterMaxAggregateInputType
  }

  export type WmsSequenceCounterGroupByOutputType = {
    tenantId: string
    nextReceiptNo: number
    createdAt: Date
    updatedAt: Date
    _count: WmsSequenceCounterCountAggregateOutputType | null
    _avg: WmsSequenceCounterAvgAggregateOutputType | null
    _sum: WmsSequenceCounterSumAggregateOutputType | null
    _min: WmsSequenceCounterMinAggregateOutputType | null
    _max: WmsSequenceCounterMaxAggregateOutputType | null
  }

  type GetWmsSequenceCounterGroupByPayload<T extends WmsSequenceCounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WmsSequenceCounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WmsSequenceCounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WmsSequenceCounterGroupByOutputType[P]>
            : GetScalarType<T[P], WmsSequenceCounterGroupByOutputType[P]>
        }
      >
    >


  export type WmsSequenceCounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextReceiptNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["wmsSequenceCounter"]>

  export type WmsSequenceCounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextReceiptNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["wmsSequenceCounter"]>

  export type WmsSequenceCounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextReceiptNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["wmsSequenceCounter"]>

  export type WmsSequenceCounterSelectScalar = {
    tenantId?: boolean
    nextReceiptNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WmsSequenceCounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenantId" | "nextReceiptNo" | "createdAt" | "updatedAt", ExtArgs["result"]["wmsSequenceCounter"]>

  export type $WmsSequenceCounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WmsSequenceCounter"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenantId: string
      nextReceiptNo: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["wmsSequenceCounter"]>
    composites: {}
  }

  type WmsSequenceCounterGetPayload<S extends boolean | null | undefined | WmsSequenceCounterDefaultArgs> = $Result.GetResult<Prisma.$WmsSequenceCounterPayload, S>

  type WmsSequenceCounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WmsSequenceCounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WmsSequenceCounterCountAggregateInputType | true
    }

  export interface WmsSequenceCounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WmsSequenceCounter'], meta: { name: 'WmsSequenceCounter' } }
    /**
     * Find zero or one WmsSequenceCounter that matches the filter.
     * @param {WmsSequenceCounterFindUniqueArgs} args - Arguments to find a WmsSequenceCounter
     * @example
     * // Get one WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WmsSequenceCounterFindUniqueArgs>(args: SelectSubset<T, WmsSequenceCounterFindUniqueArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one WmsSequenceCounter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WmsSequenceCounterFindUniqueOrThrowArgs} args - Arguments to find a WmsSequenceCounter
     * @example
     * // Get one WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WmsSequenceCounterFindUniqueOrThrowArgs>(args: SelectSubset<T, WmsSequenceCounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first WmsSequenceCounter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterFindFirstArgs} args - Arguments to find a WmsSequenceCounter
     * @example
     * // Get one WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WmsSequenceCounterFindFirstArgs>(args?: SelectSubset<T, WmsSequenceCounterFindFirstArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first WmsSequenceCounter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterFindFirstOrThrowArgs} args - Arguments to find a WmsSequenceCounter
     * @example
     * // Get one WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WmsSequenceCounterFindFirstOrThrowArgs>(args?: SelectSubset<T, WmsSequenceCounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more WmsSequenceCounters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WmsSequenceCounters
     * const wmsSequenceCounters = await prisma.wmsSequenceCounter.findMany()
     * 
     * // Get first 10 WmsSequenceCounters
     * const wmsSequenceCounters = await prisma.wmsSequenceCounter.findMany({ take: 10 })
     * 
     * // Only select the `tenantId`
     * const wmsSequenceCounterWithTenantIdOnly = await prisma.wmsSequenceCounter.findMany({ select: { tenantId: true } })
     * 
     */
    findMany<T extends WmsSequenceCounterFindManyArgs>(args?: SelectSubset<T, WmsSequenceCounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a WmsSequenceCounter.
     * @param {WmsSequenceCounterCreateArgs} args - Arguments to create a WmsSequenceCounter.
     * @example
     * // Create one WmsSequenceCounter
     * const WmsSequenceCounter = await prisma.wmsSequenceCounter.create({
     *   data: {
     *     // ... data to create a WmsSequenceCounter
     *   }
     * })
     * 
     */
    create<T extends WmsSequenceCounterCreateArgs>(args: SelectSubset<T, WmsSequenceCounterCreateArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many WmsSequenceCounters.
     * @param {WmsSequenceCounterCreateManyArgs} args - Arguments to create many WmsSequenceCounters.
     * @example
     * // Create many WmsSequenceCounters
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WmsSequenceCounterCreateManyArgs>(args?: SelectSubset<T, WmsSequenceCounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WmsSequenceCounters and returns the data saved in the database.
     * @param {WmsSequenceCounterCreateManyAndReturnArgs} args - Arguments to create many WmsSequenceCounters.
     * @example
     * // Create many WmsSequenceCounters
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WmsSequenceCounters and only return the `tenantId`
     * const wmsSequenceCounterWithTenantIdOnly = await prisma.wmsSequenceCounter.createManyAndReturn({
     *   select: { tenantId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WmsSequenceCounterCreateManyAndReturnArgs>(args?: SelectSubset<T, WmsSequenceCounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a WmsSequenceCounter.
     * @param {WmsSequenceCounterDeleteArgs} args - Arguments to delete one WmsSequenceCounter.
     * @example
     * // Delete one WmsSequenceCounter
     * const WmsSequenceCounter = await prisma.wmsSequenceCounter.delete({
     *   where: {
     *     // ... filter to delete one WmsSequenceCounter
     *   }
     * })
     * 
     */
    delete<T extends WmsSequenceCounterDeleteArgs>(args: SelectSubset<T, WmsSequenceCounterDeleteArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one WmsSequenceCounter.
     * @param {WmsSequenceCounterUpdateArgs} args - Arguments to update one WmsSequenceCounter.
     * @example
     * // Update one WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WmsSequenceCounterUpdateArgs>(args: SelectSubset<T, WmsSequenceCounterUpdateArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more WmsSequenceCounters.
     * @param {WmsSequenceCounterDeleteManyArgs} args - Arguments to filter WmsSequenceCounters to delete.
     * @example
     * // Delete a few WmsSequenceCounters
     * const { count } = await prisma.wmsSequenceCounter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WmsSequenceCounterDeleteManyArgs>(args?: SelectSubset<T, WmsSequenceCounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WmsSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WmsSequenceCounters
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WmsSequenceCounterUpdateManyArgs>(args: SelectSubset<T, WmsSequenceCounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WmsSequenceCounters and returns the data updated in the database.
     * @param {WmsSequenceCounterUpdateManyAndReturnArgs} args - Arguments to update many WmsSequenceCounters.
     * @example
     * // Update many WmsSequenceCounters
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WmsSequenceCounters and only return the `tenantId`
     * const wmsSequenceCounterWithTenantIdOnly = await prisma.wmsSequenceCounter.updateManyAndReturn({
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
    updateManyAndReturn<T extends WmsSequenceCounterUpdateManyAndReturnArgs>(args: SelectSubset<T, WmsSequenceCounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one WmsSequenceCounter.
     * @param {WmsSequenceCounterUpsertArgs} args - Arguments to update or create a WmsSequenceCounter.
     * @example
     * // Update or create a WmsSequenceCounter
     * const wmsSequenceCounter = await prisma.wmsSequenceCounter.upsert({
     *   create: {
     *     // ... data to create a WmsSequenceCounter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WmsSequenceCounter we want to update
     *   }
     * })
     */
    upsert<T extends WmsSequenceCounterUpsertArgs>(args: SelectSubset<T, WmsSequenceCounterUpsertArgs<ExtArgs>>): Prisma__WmsSequenceCounterClient<$Result.GetResult<Prisma.$WmsSequenceCounterPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of WmsSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterCountArgs} args - Arguments to filter WmsSequenceCounters to count.
     * @example
     * // Count the number of WmsSequenceCounters
     * const count = await prisma.wmsSequenceCounter.count({
     *   where: {
     *     // ... the filter for the WmsSequenceCounters we want to count
     *   }
     * })
    **/
    count<T extends WmsSequenceCounterCountArgs>(
      args?: Subset<T, WmsSequenceCounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WmsSequenceCounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WmsSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends WmsSequenceCounterAggregateArgs>(args: Subset<T, WmsSequenceCounterAggregateArgs>): Prisma.PrismaPromise<GetWmsSequenceCounterAggregateType<T>>

    /**
     * Group by WmsSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsSequenceCounterGroupByArgs} args - Group by arguments.
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
      T extends WmsSequenceCounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WmsSequenceCounterGroupByArgs['orderBy'] }
        : { orderBy?: WmsSequenceCounterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, WmsSequenceCounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWmsSequenceCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WmsSequenceCounter model
   */
  readonly fields: WmsSequenceCounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WmsSequenceCounter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WmsSequenceCounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the WmsSequenceCounter model
   */ 
  interface WmsSequenceCounterFieldRefs {
    readonly tenantId: FieldRef<"WmsSequenceCounter", 'String'>
    readonly nextReceiptNo: FieldRef<"WmsSequenceCounter", 'Int'>
    readonly createdAt: FieldRef<"WmsSequenceCounter", 'DateTime'>
    readonly updatedAt: FieldRef<"WmsSequenceCounter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WmsSequenceCounter findUnique
   */
  export type WmsSequenceCounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which WmsSequenceCounter to fetch.
     */
    where: WmsSequenceCounterWhereUniqueInput
  }

  /**
   * WmsSequenceCounter findUniqueOrThrow
   */
  export type WmsSequenceCounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which WmsSequenceCounter to fetch.
     */
    where: WmsSequenceCounterWhereUniqueInput
  }

  /**
   * WmsSequenceCounter findFirst
   */
  export type WmsSequenceCounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which WmsSequenceCounter to fetch.
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsSequenceCounters to fetch.
     */
    orderBy?: WmsSequenceCounterOrderByWithRelationInput | WmsSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WmsSequenceCounters.
     */
    cursor?: WmsSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WmsSequenceCounters.
     */
    distinct?: WmsSequenceCounterScalarFieldEnum | WmsSequenceCounterScalarFieldEnum[]
  }

  /**
   * WmsSequenceCounter findFirstOrThrow
   */
  export type WmsSequenceCounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which WmsSequenceCounter to fetch.
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsSequenceCounters to fetch.
     */
    orderBy?: WmsSequenceCounterOrderByWithRelationInput | WmsSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WmsSequenceCounters.
     */
    cursor?: WmsSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WmsSequenceCounters.
     */
    distinct?: WmsSequenceCounterScalarFieldEnum | WmsSequenceCounterScalarFieldEnum[]
  }

  /**
   * WmsSequenceCounter findMany
   */
  export type WmsSequenceCounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which WmsSequenceCounters to fetch.
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsSequenceCounters to fetch.
     */
    orderBy?: WmsSequenceCounterOrderByWithRelationInput | WmsSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WmsSequenceCounters.
     */
    cursor?: WmsSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsSequenceCounters.
     */
    skip?: number
    distinct?: WmsSequenceCounterScalarFieldEnum | WmsSequenceCounterScalarFieldEnum[]
  }

  /**
   * WmsSequenceCounter create
   */
  export type WmsSequenceCounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to create a WmsSequenceCounter.
     */
    data: XOR<WmsSequenceCounterCreateInput, WmsSequenceCounterUncheckedCreateInput>
  }

  /**
   * WmsSequenceCounter createMany
   */
  export type WmsSequenceCounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WmsSequenceCounters.
     */
    data: WmsSequenceCounterCreateManyInput | WmsSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WmsSequenceCounter createManyAndReturn
   */
  export type WmsSequenceCounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to create many WmsSequenceCounters.
     */
    data: WmsSequenceCounterCreateManyInput | WmsSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WmsSequenceCounter update
   */
  export type WmsSequenceCounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to update a WmsSequenceCounter.
     */
    data: XOR<WmsSequenceCounterUpdateInput, WmsSequenceCounterUncheckedUpdateInput>
    /**
     * Choose, which WmsSequenceCounter to update.
     */
    where: WmsSequenceCounterWhereUniqueInput
  }

  /**
   * WmsSequenceCounter updateMany
   */
  export type WmsSequenceCounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WmsSequenceCounters.
     */
    data: XOR<WmsSequenceCounterUpdateManyMutationInput, WmsSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which WmsSequenceCounters to update
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * Limit how many WmsSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * WmsSequenceCounter updateManyAndReturn
   */
  export type WmsSequenceCounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to update WmsSequenceCounters.
     */
    data: XOR<WmsSequenceCounterUpdateManyMutationInput, WmsSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which WmsSequenceCounters to update
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * Limit how many WmsSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * WmsSequenceCounter upsert
   */
  export type WmsSequenceCounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * The filter to search for the WmsSequenceCounter to update in case it exists.
     */
    where: WmsSequenceCounterWhereUniqueInput
    /**
     * In case the WmsSequenceCounter found by the `where` argument doesn't exist, create a new WmsSequenceCounter with this data.
     */
    create: XOR<WmsSequenceCounterCreateInput, WmsSequenceCounterUncheckedCreateInput>
    /**
     * In case the WmsSequenceCounter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WmsSequenceCounterUpdateInput, WmsSequenceCounterUncheckedUpdateInput>
  }

  /**
   * WmsSequenceCounter delete
   */
  export type WmsSequenceCounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter which WmsSequenceCounter to delete.
     */
    where: WmsSequenceCounterWhereUniqueInput
  }

  /**
   * WmsSequenceCounter deleteMany
   */
  export type WmsSequenceCounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WmsSequenceCounters to delete
     */
    where?: WmsSequenceCounterWhereInput
    /**
     * Limit how many WmsSequenceCounters to delete.
     */
    limit?: number
  }

  /**
   * WmsSequenceCounter without action
   */
  export type WmsSequenceCounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsSequenceCounter
     */
    select?: WmsSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsSequenceCounter
     */
    omit?: WmsSequenceCounterOmit<ExtArgs> | null
  }


  /**
   * Model Warehouse
   */

  export type AggregateWarehouse = {
    _count: WarehouseCountAggregateOutputType | null
    _min: WarehouseMinAggregateOutputType | null
    _max: WarehouseMaxAggregateOutputType | null
  }

  export type WarehouseMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    orgId: string | null
    warehouseCode: string | null
    warehouseName: string | null
    warehouseScope: $Enums.WmsWarehouseScope | null
    status: $Enums.WmsWarehouseStatus | null
    defaultReceivingLocationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WarehouseMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    orgId: string | null
    warehouseCode: string | null
    warehouseName: string | null
    warehouseScope: $Enums.WmsWarehouseScope | null
    status: $Enums.WmsWarehouseStatus | null
    defaultReceivingLocationId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type WarehouseCountAggregateOutputType = {
    id: number
    tenantId: number
    orgId: number
    warehouseCode: number
    warehouseName: number
    warehouseScope: number
    status: number
    defaultReceivingLocationId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type WarehouseMinAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    warehouseCode?: true
    warehouseName?: true
    warehouseScope?: true
    status?: true
    defaultReceivingLocationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WarehouseMaxAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    warehouseCode?: true
    warehouseName?: true
    warehouseScope?: true
    status?: true
    defaultReceivingLocationId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type WarehouseCountAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    warehouseCode?: true
    warehouseName?: true
    warehouseScope?: true
    status?: true
    defaultReceivingLocationId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type WarehouseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Warehouse to aggregate.
     */
    where?: WarehouseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Warehouses to fetch.
     */
    orderBy?: WarehouseOrderByWithRelationInput | WarehouseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WarehouseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Warehouses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Warehouses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Warehouses
    **/
    _count?: true | WarehouseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WarehouseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WarehouseMaxAggregateInputType
  }

  export type GetWarehouseAggregateType<T extends WarehouseAggregateArgs> = {
        [P in keyof T & keyof AggregateWarehouse]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWarehouse[P]>
      : GetScalarType<T[P], AggregateWarehouse[P]>
  }




  export type WarehouseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WarehouseWhereInput
    orderBy?: WarehouseOrderByWithAggregationInput | WarehouseOrderByWithAggregationInput[]
    by: WarehouseScalarFieldEnum[] | WarehouseScalarFieldEnum
    having?: WarehouseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WarehouseCountAggregateInputType | true
    _min?: WarehouseMinAggregateInputType
    _max?: WarehouseMaxAggregateInputType
  }

  export type WarehouseGroupByOutputType = {
    id: string
    tenantId: string
    orgId: string | null
    warehouseCode: string
    warehouseName: string
    warehouseScope: $Enums.WmsWarehouseScope
    status: $Enums.WmsWarehouseStatus
    defaultReceivingLocationId: string | null
    createdAt: Date
    updatedAt: Date
    _count: WarehouseCountAggregateOutputType | null
    _min: WarehouseMinAggregateOutputType | null
    _max: WarehouseMaxAggregateOutputType | null
  }

  type GetWarehouseGroupByPayload<T extends WarehouseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WarehouseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WarehouseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WarehouseGroupByOutputType[P]>
            : GetScalarType<T[P], WarehouseGroupByOutputType[P]>
        }
      >
    >


  export type WarehouseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseCode?: boolean
    warehouseName?: boolean
    warehouseScope?: boolean
    status?: boolean
    defaultReceivingLocationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["warehouse"]>

  export type WarehouseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseCode?: boolean
    warehouseName?: boolean
    warehouseScope?: boolean
    status?: boolean
    defaultReceivingLocationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["warehouse"]>

  export type WarehouseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseCode?: boolean
    warehouseName?: boolean
    warehouseScope?: boolean
    status?: boolean
    defaultReceivingLocationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["warehouse"]>

  export type WarehouseSelectScalar = {
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseCode?: boolean
    warehouseName?: boolean
    warehouseScope?: boolean
    status?: boolean
    defaultReceivingLocationId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type WarehouseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "orgId" | "warehouseCode" | "warehouseName" | "warehouseScope" | "status" | "defaultReceivingLocationId" | "createdAt" | "updatedAt", ExtArgs["result"]["warehouse"]>

  export type $WarehousePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Warehouse"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      orgId: string | null
      warehouseCode: string
      warehouseName: string
      warehouseScope: $Enums.WmsWarehouseScope
      status: $Enums.WmsWarehouseStatus
      defaultReceivingLocationId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["warehouse"]>
    composites: {}
  }

  type WarehouseGetPayload<S extends boolean | null | undefined | WarehouseDefaultArgs> = $Result.GetResult<Prisma.$WarehousePayload, S>

  type WarehouseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WarehouseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WarehouseCountAggregateInputType | true
    }

  export interface WarehouseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Warehouse'], meta: { name: 'Warehouse' } }
    /**
     * Find zero or one Warehouse that matches the filter.
     * @param {WarehouseFindUniqueArgs} args - Arguments to find a Warehouse
     * @example
     * // Get one Warehouse
     * const warehouse = await prisma.warehouse.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WarehouseFindUniqueArgs>(args: SelectSubset<T, WarehouseFindUniqueArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Warehouse that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WarehouseFindUniqueOrThrowArgs} args - Arguments to find a Warehouse
     * @example
     * // Get one Warehouse
     * const warehouse = await prisma.warehouse.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WarehouseFindUniqueOrThrowArgs>(args: SelectSubset<T, WarehouseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Warehouse that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseFindFirstArgs} args - Arguments to find a Warehouse
     * @example
     * // Get one Warehouse
     * const warehouse = await prisma.warehouse.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WarehouseFindFirstArgs>(args?: SelectSubset<T, WarehouseFindFirstArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Warehouse that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseFindFirstOrThrowArgs} args - Arguments to find a Warehouse
     * @example
     * // Get one Warehouse
     * const warehouse = await prisma.warehouse.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WarehouseFindFirstOrThrowArgs>(args?: SelectSubset<T, WarehouseFindFirstOrThrowArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Warehouses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Warehouses
     * const warehouses = await prisma.warehouse.findMany()
     * 
     * // Get first 10 Warehouses
     * const warehouses = await prisma.warehouse.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const warehouseWithIdOnly = await prisma.warehouse.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WarehouseFindManyArgs>(args?: SelectSubset<T, WarehouseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Warehouse.
     * @param {WarehouseCreateArgs} args - Arguments to create a Warehouse.
     * @example
     * // Create one Warehouse
     * const Warehouse = await prisma.warehouse.create({
     *   data: {
     *     // ... data to create a Warehouse
     *   }
     * })
     * 
     */
    create<T extends WarehouseCreateArgs>(args: SelectSubset<T, WarehouseCreateArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Warehouses.
     * @param {WarehouseCreateManyArgs} args - Arguments to create many Warehouses.
     * @example
     * // Create many Warehouses
     * const warehouse = await prisma.warehouse.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WarehouseCreateManyArgs>(args?: SelectSubset<T, WarehouseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Warehouses and returns the data saved in the database.
     * @param {WarehouseCreateManyAndReturnArgs} args - Arguments to create many Warehouses.
     * @example
     * // Create many Warehouses
     * const warehouse = await prisma.warehouse.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Warehouses and only return the `id`
     * const warehouseWithIdOnly = await prisma.warehouse.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WarehouseCreateManyAndReturnArgs>(args?: SelectSubset<T, WarehouseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Warehouse.
     * @param {WarehouseDeleteArgs} args - Arguments to delete one Warehouse.
     * @example
     * // Delete one Warehouse
     * const Warehouse = await prisma.warehouse.delete({
     *   where: {
     *     // ... filter to delete one Warehouse
     *   }
     * })
     * 
     */
    delete<T extends WarehouseDeleteArgs>(args: SelectSubset<T, WarehouseDeleteArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Warehouse.
     * @param {WarehouseUpdateArgs} args - Arguments to update one Warehouse.
     * @example
     * // Update one Warehouse
     * const warehouse = await prisma.warehouse.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WarehouseUpdateArgs>(args: SelectSubset<T, WarehouseUpdateArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Warehouses.
     * @param {WarehouseDeleteManyArgs} args - Arguments to filter Warehouses to delete.
     * @example
     * // Delete a few Warehouses
     * const { count } = await prisma.warehouse.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WarehouseDeleteManyArgs>(args?: SelectSubset<T, WarehouseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Warehouses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Warehouses
     * const warehouse = await prisma.warehouse.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WarehouseUpdateManyArgs>(args: SelectSubset<T, WarehouseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Warehouses and returns the data updated in the database.
     * @param {WarehouseUpdateManyAndReturnArgs} args - Arguments to update many Warehouses.
     * @example
     * // Update many Warehouses
     * const warehouse = await prisma.warehouse.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Warehouses and only return the `id`
     * const warehouseWithIdOnly = await prisma.warehouse.updateManyAndReturn({
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
    updateManyAndReturn<T extends WarehouseUpdateManyAndReturnArgs>(args: SelectSubset<T, WarehouseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Warehouse.
     * @param {WarehouseUpsertArgs} args - Arguments to update or create a Warehouse.
     * @example
     * // Update or create a Warehouse
     * const warehouse = await prisma.warehouse.upsert({
     *   create: {
     *     // ... data to create a Warehouse
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Warehouse we want to update
     *   }
     * })
     */
    upsert<T extends WarehouseUpsertArgs>(args: SelectSubset<T, WarehouseUpsertArgs<ExtArgs>>): Prisma__WarehouseClient<$Result.GetResult<Prisma.$WarehousePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Warehouses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseCountArgs} args - Arguments to filter Warehouses to count.
     * @example
     * // Count the number of Warehouses
     * const count = await prisma.warehouse.count({
     *   where: {
     *     // ... the filter for the Warehouses we want to count
     *   }
     * })
    **/
    count<T extends WarehouseCountArgs>(
      args?: Subset<T, WarehouseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WarehouseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Warehouse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends WarehouseAggregateArgs>(args: Subset<T, WarehouseAggregateArgs>): Prisma.PrismaPromise<GetWarehouseAggregateType<T>>

    /**
     * Group by Warehouse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WarehouseGroupByArgs} args - Group by arguments.
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
      T extends WarehouseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WarehouseGroupByArgs['orderBy'] }
        : { orderBy?: WarehouseGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, WarehouseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWarehouseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Warehouse model
   */
  readonly fields: WarehouseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Warehouse.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WarehouseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Warehouse model
   */ 
  interface WarehouseFieldRefs {
    readonly id: FieldRef<"Warehouse", 'String'>
    readonly tenantId: FieldRef<"Warehouse", 'String'>
    readonly orgId: FieldRef<"Warehouse", 'String'>
    readonly warehouseCode: FieldRef<"Warehouse", 'String'>
    readonly warehouseName: FieldRef<"Warehouse", 'String'>
    readonly warehouseScope: FieldRef<"Warehouse", 'WmsWarehouseScope'>
    readonly status: FieldRef<"Warehouse", 'WmsWarehouseStatus'>
    readonly defaultReceivingLocationId: FieldRef<"Warehouse", 'String'>
    readonly createdAt: FieldRef<"Warehouse", 'DateTime'>
    readonly updatedAt: FieldRef<"Warehouse", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Warehouse findUnique
   */
  export type WarehouseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter, which Warehouse to fetch.
     */
    where: WarehouseWhereUniqueInput
  }

  /**
   * Warehouse findUniqueOrThrow
   */
  export type WarehouseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter, which Warehouse to fetch.
     */
    where: WarehouseWhereUniqueInput
  }

  /**
   * Warehouse findFirst
   */
  export type WarehouseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter, which Warehouse to fetch.
     */
    where?: WarehouseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Warehouses to fetch.
     */
    orderBy?: WarehouseOrderByWithRelationInput | WarehouseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Warehouses.
     */
    cursor?: WarehouseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Warehouses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Warehouses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Warehouses.
     */
    distinct?: WarehouseScalarFieldEnum | WarehouseScalarFieldEnum[]
  }

  /**
   * Warehouse findFirstOrThrow
   */
  export type WarehouseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter, which Warehouse to fetch.
     */
    where?: WarehouseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Warehouses to fetch.
     */
    orderBy?: WarehouseOrderByWithRelationInput | WarehouseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Warehouses.
     */
    cursor?: WarehouseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Warehouses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Warehouses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Warehouses.
     */
    distinct?: WarehouseScalarFieldEnum | WarehouseScalarFieldEnum[]
  }

  /**
   * Warehouse findMany
   */
  export type WarehouseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter, which Warehouses to fetch.
     */
    where?: WarehouseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Warehouses to fetch.
     */
    orderBy?: WarehouseOrderByWithRelationInput | WarehouseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Warehouses.
     */
    cursor?: WarehouseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Warehouses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Warehouses.
     */
    skip?: number
    distinct?: WarehouseScalarFieldEnum | WarehouseScalarFieldEnum[]
  }

  /**
   * Warehouse create
   */
  export type WarehouseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * The data needed to create a Warehouse.
     */
    data: XOR<WarehouseCreateInput, WarehouseUncheckedCreateInput>
  }

  /**
   * Warehouse createMany
   */
  export type WarehouseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Warehouses.
     */
    data: WarehouseCreateManyInput | WarehouseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Warehouse createManyAndReturn
   */
  export type WarehouseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * The data used to create many Warehouses.
     */
    data: WarehouseCreateManyInput | WarehouseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Warehouse update
   */
  export type WarehouseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * The data needed to update a Warehouse.
     */
    data: XOR<WarehouseUpdateInput, WarehouseUncheckedUpdateInput>
    /**
     * Choose, which Warehouse to update.
     */
    where: WarehouseWhereUniqueInput
  }

  /**
   * Warehouse updateMany
   */
  export type WarehouseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Warehouses.
     */
    data: XOR<WarehouseUpdateManyMutationInput, WarehouseUncheckedUpdateManyInput>
    /**
     * Filter which Warehouses to update
     */
    where?: WarehouseWhereInput
    /**
     * Limit how many Warehouses to update.
     */
    limit?: number
  }

  /**
   * Warehouse updateManyAndReturn
   */
  export type WarehouseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * The data used to update Warehouses.
     */
    data: XOR<WarehouseUpdateManyMutationInput, WarehouseUncheckedUpdateManyInput>
    /**
     * Filter which Warehouses to update
     */
    where?: WarehouseWhereInput
    /**
     * Limit how many Warehouses to update.
     */
    limit?: number
  }

  /**
   * Warehouse upsert
   */
  export type WarehouseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * The filter to search for the Warehouse to update in case it exists.
     */
    where: WarehouseWhereUniqueInput
    /**
     * In case the Warehouse found by the `where` argument doesn't exist, create a new Warehouse with this data.
     */
    create: XOR<WarehouseCreateInput, WarehouseUncheckedCreateInput>
    /**
     * In case the Warehouse was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WarehouseUpdateInput, WarehouseUncheckedUpdateInput>
  }

  /**
   * Warehouse delete
   */
  export type WarehouseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
    /**
     * Filter which Warehouse to delete.
     */
    where: WarehouseWhereUniqueInput
  }

  /**
   * Warehouse deleteMany
   */
  export type WarehouseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Warehouses to delete
     */
    where?: WarehouseWhereInput
    /**
     * Limit how many Warehouses to delete.
     */
    limit?: number
  }

  /**
   * Warehouse without action
   */
  export type WarehouseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Warehouse
     */
    select?: WarehouseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Warehouse
     */
    omit?: WarehouseOmit<ExtArgs> | null
  }


  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  export type LocationMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    warehouseId: string | null
    parentLocationId: string | null
    locationCode: string | null
    locationName: string | null
    locationScope: $Enums.WmsLocationScope | null
    locationType: $Enums.WmsLocationType | null
    status: $Enums.WmsLocationStatus | null
    supportsReceipt: boolean | null
    supportsStorage: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    warehouseId: string | null
    parentLocationId: string | null
    locationCode: string | null
    locationName: string | null
    locationScope: $Enums.WmsLocationScope | null
    locationType: $Enums.WmsLocationType | null
    status: $Enums.WmsLocationStatus | null
    supportsReceipt: boolean | null
    supportsStorage: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocationCountAggregateOutputType = {
    id: number
    tenantId: number
    warehouseId: number
    parentLocationId: number
    locationCode: number
    locationName: number
    locationScope: number
    locationType: number
    status: number
    supportsReceipt: number
    supportsStorage: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LocationMinAggregateInputType = {
    id?: true
    tenantId?: true
    warehouseId?: true
    parentLocationId?: true
    locationCode?: true
    locationName?: true
    locationScope?: true
    locationType?: true
    status?: true
    supportsReceipt?: true
    supportsStorage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationMaxAggregateInputType = {
    id?: true
    tenantId?: true
    warehouseId?: true
    parentLocationId?: true
    locationCode?: true
    locationName?: true
    locationScope?: true
    locationType?: true
    status?: true
    supportsReceipt?: true
    supportsStorage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocationCountAggregateInputType = {
    id?: true
    tenantId?: true
    warehouseId?: true
    parentLocationId?: true
    locationCode?: true
    locationName?: true
    locationScope?: true
    locationType?: true
    status?: true
    supportsReceipt?: true
    supportsStorage?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locations
    **/
    _count?: true | LocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocationMaxAggregateInputType
  }

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
        [P in keyof T & keyof AggregateLocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>
  }




  export type LocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocationWhereInput
    orderBy?: LocationOrderByWithAggregationInput | LocationOrderByWithAggregationInput[]
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum
    having?: LocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocationCountAggregateInputType | true
    _min?: LocationMinAggregateInputType
    _max?: LocationMaxAggregateInputType
  }

  export type LocationGroupByOutputType = {
    id: string
    tenantId: string
    warehouseId: string
    parentLocationId: string | null
    locationCode: string
    locationName: string
    locationScope: $Enums.WmsLocationScope
    locationType: $Enums.WmsLocationType
    status: $Enums.WmsLocationStatus
    supportsReceipt: boolean
    supportsStorage: boolean
    createdAt: Date
    updatedAt: Date
    _count: LocationCountAggregateOutputType | null
    _min: LocationMinAggregateOutputType | null
    _max: LocationMaxAggregateOutputType | null
  }

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>
        }
      >
    >


  export type LocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    warehouseId?: boolean
    parentLocationId?: boolean
    locationCode?: boolean
    locationName?: boolean
    locationScope?: boolean
    locationType?: boolean
    status?: boolean
    supportsReceipt?: boolean
    supportsStorage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    warehouseId?: boolean
    parentLocationId?: boolean
    locationCode?: boolean
    locationName?: boolean
    locationScope?: boolean
    locationType?: boolean
    status?: boolean
    supportsReceipt?: boolean
    supportsStorage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    warehouseId?: boolean
    parentLocationId?: boolean
    locationCode?: boolean
    locationName?: boolean
    locationScope?: boolean
    locationType?: boolean
    status?: boolean
    supportsReceipt?: boolean
    supportsStorage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["location"]>

  export type LocationSelectScalar = {
    id?: boolean
    tenantId?: boolean
    warehouseId?: boolean
    parentLocationId?: boolean
    locationCode?: boolean
    locationName?: boolean
    locationScope?: boolean
    locationType?: boolean
    status?: boolean
    supportsReceipt?: boolean
    supportsStorage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LocationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "warehouseId" | "parentLocationId" | "locationCode" | "locationName" | "locationScope" | "locationType" | "status" | "supportsReceipt" | "supportsStorage" | "createdAt" | "updatedAt", ExtArgs["result"]["location"]>

  export type $LocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Location"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      warehouseId: string
      parentLocationId: string | null
      locationCode: string
      locationName: string
      locationScope: $Enums.WmsLocationScope
      locationType: $Enums.WmsLocationType
      status: $Enums.WmsLocationStatus
      supportsReceipt: boolean
      supportsStorage: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["location"]>
    composites: {}
  }

  type LocationGetPayload<S extends boolean | null | undefined | LocationDefaultArgs> = $Result.GetResult<Prisma.$LocationPayload, S>

  type LocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LocationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LocationCountAggregateInputType | true
    }

  export interface LocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Location'], meta: { name: 'Location' } }
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     * 
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const locationWithIdOnly = await prisma.location.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocationFindManyArgs>(args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     * 
     */
    create<T extends LocationCreateArgs>(args: SelectSubset<T, LocationCreateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocationCreateManyArgs>(args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     * 
     */
    delete<T extends LocationDeleteArgs>(args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocationUpdateArgs>(args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocationDeleteManyArgs>(args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocationUpdateManyArgs>(args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locations and returns the data updated in the database.
     * @param {LocationUpdateManyAndReturnArgs} args - Arguments to update many Locations.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Locations and only return the `id`
     * const locationWithIdOnly = await prisma.location.updateManyAndReturn({
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
    updateManyAndReturn<T extends LocationUpdateManyAndReturnArgs>(args: SelectSubset<T, LocationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>): Prisma__LocationClient<$Result.GetResult<Prisma.$LocationPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
    **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LocationAggregateArgs>(args: Subset<T, LocationAggregateArgs>): Prisma.PrismaPromise<GetLocationAggregateType<T>>

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
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
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs['orderBy'] }
        : { orderBy?: LocationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Location model
   */
  readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Location model
   */ 
  interface LocationFieldRefs {
    readonly id: FieldRef<"Location", 'String'>
    readonly tenantId: FieldRef<"Location", 'String'>
    readonly warehouseId: FieldRef<"Location", 'String'>
    readonly parentLocationId: FieldRef<"Location", 'String'>
    readonly locationCode: FieldRef<"Location", 'String'>
    readonly locationName: FieldRef<"Location", 'String'>
    readonly locationScope: FieldRef<"Location", 'WmsLocationScope'>
    readonly locationType: FieldRef<"Location", 'WmsLocationType'>
    readonly status: FieldRef<"Location", 'WmsLocationStatus'>
    readonly supportsReceipt: FieldRef<"Location", 'Boolean'>
    readonly supportsStorage: FieldRef<"Location", 'Boolean'>
    readonly createdAt: FieldRef<"Location", 'DateTime'>
    readonly updatedAt: FieldRef<"Location", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locations to fetch.
     */
    orderBy?: LocationOrderByWithRelationInput | LocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locations.
     */
    skip?: number
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[]
  }

  /**
   * Location create
   */
  export type LocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>
  }

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Location update
   */
  export type LocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location updateManyAndReturn
   */
  export type LocationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The data used to update Locations.
     */
    data: XOR<LocationUpdateManyMutationInput, LocationUncheckedUpdateManyInput>
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to update.
     */
    limit?: number
  }

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>
  }

  /**
   * Location delete
   */
  export type LocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput
  }

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput
    /**
     * Limit how many Locations to delete.
     */
    limit?: number
  }

  /**
   * Location without action
   */
  export type LocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null
  }


  /**
   * Model Receipt
   */

  export type AggregateReceipt = {
    _count: ReceiptCountAggregateOutputType | null
    _avg: ReceiptAvgAggregateOutputType | null
    _sum: ReceiptSumAggregateOutputType | null
    _min: ReceiptMinAggregateOutputType | null
    _max: ReceiptMaxAggregateOutputType | null
  }

  export type ReceiptAvgAggregateOutputType = {
    lineCount: number | null
  }

  export type ReceiptSumAggregateOutputType = {
    lineCount: number | null
  }

  export type ReceiptMinAggregateOutputType = {
    id: string | null
    receiptNo: string | null
    tenantId: string | null
    orgId: string | null
    warehouseId: string | null
    status: $Enums.WmsReceiptStatus | null
    receiptSourceType: $Enums.WmsReceiptSourceType | null
    receiptDate: string | null
    note: string | null
    lineCount: number | null
    postedAt: Date | null
    cancelledAt: Date | null
    cancelReason: string | null
    postComment: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceiptMaxAggregateOutputType = {
    id: string | null
    receiptNo: string | null
    tenantId: string | null
    orgId: string | null
    warehouseId: string | null
    status: $Enums.WmsReceiptStatus | null
    receiptSourceType: $Enums.WmsReceiptSourceType | null
    receiptDate: string | null
    note: string | null
    lineCount: number | null
    postedAt: Date | null
    cancelledAt: Date | null
    cancelReason: string | null
    postComment: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceiptCountAggregateOutputType = {
    id: number
    receiptNo: number
    tenantId: number
    orgId: number
    warehouseId: number
    status: number
    receiptSourceType: number
    referencedReceivingExpectationIds: number
    receiptDate: number
    note: number
    attachmentRefs: number
    lineCount: number
    postedAt: number
    cancelledAt: number
    cancelReason: number
    postComment: number
    procurementReceiptSummary: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReceiptAvgAggregateInputType = {
    lineCount?: true
  }

  export type ReceiptSumAggregateInputType = {
    lineCount?: true
  }

  export type ReceiptMinAggregateInputType = {
    id?: true
    receiptNo?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    status?: true
    receiptSourceType?: true
    receiptDate?: true
    note?: true
    lineCount?: true
    postedAt?: true
    cancelledAt?: true
    cancelReason?: true
    postComment?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceiptMaxAggregateInputType = {
    id?: true
    receiptNo?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    status?: true
    receiptSourceType?: true
    receiptDate?: true
    note?: true
    lineCount?: true
    postedAt?: true
    cancelledAt?: true
    cancelReason?: true
    postComment?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceiptCountAggregateInputType = {
    id?: true
    receiptNo?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    status?: true
    receiptSourceType?: true
    referencedReceivingExpectationIds?: true
    receiptDate?: true
    note?: true
    attachmentRefs?: true
    lineCount?: true
    postedAt?: true
    cancelledAt?: true
    cancelReason?: true
    postComment?: true
    procurementReceiptSummary?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReceiptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Receipt to aggregate.
     */
    where?: ReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Receipts to fetch.
     */
    orderBy?: ReceiptOrderByWithRelationInput | ReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Receipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Receipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Receipts
    **/
    _count?: true | ReceiptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReceiptAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReceiptSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReceiptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReceiptMaxAggregateInputType
  }

  export type GetReceiptAggregateType<T extends ReceiptAggregateArgs> = {
        [P in keyof T & keyof AggregateReceipt]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReceipt[P]>
      : GetScalarType<T[P], AggregateReceipt[P]>
  }




  export type ReceiptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceiptWhereInput
    orderBy?: ReceiptOrderByWithAggregationInput | ReceiptOrderByWithAggregationInput[]
    by: ReceiptScalarFieldEnum[] | ReceiptScalarFieldEnum
    having?: ReceiptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReceiptCountAggregateInputType | true
    _avg?: ReceiptAvgAggregateInputType
    _sum?: ReceiptSumAggregateInputType
    _min?: ReceiptMinAggregateInputType
    _max?: ReceiptMaxAggregateInputType
  }

  export type ReceiptGroupByOutputType = {
    id: string
    receiptNo: string
    tenantId: string
    orgId: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonValue
    receiptDate: string
    note: string | null
    attachmentRefs: JsonValue
    lineCount: number
    postedAt: Date | null
    cancelledAt: Date | null
    cancelReason: string | null
    postComment: string | null
    procurementReceiptSummary: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ReceiptCountAggregateOutputType | null
    _avg: ReceiptAvgAggregateOutputType | null
    _sum: ReceiptSumAggregateOutputType | null
    _min: ReceiptMinAggregateOutputType | null
    _max: ReceiptMaxAggregateOutputType | null
  }

  type GetReceiptGroupByPayload<T extends ReceiptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReceiptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReceiptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReceiptGroupByOutputType[P]>
            : GetScalarType<T[P], ReceiptGroupByOutputType[P]>
        }
      >
    >


  export type ReceiptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    receiptNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    status?: boolean
    receiptSourceType?: boolean
    referencedReceivingExpectationIds?: boolean
    receiptDate?: boolean
    note?: boolean
    attachmentRefs?: boolean
    lineCount?: boolean
    postedAt?: boolean
    cancelledAt?: boolean
    cancelReason?: boolean
    postComment?: boolean
    procurementReceiptSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lines?: boolean | Receipt$linesArgs<ExtArgs>
    _count?: boolean | ReceiptCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receipt"]>

  export type ReceiptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    receiptNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    status?: boolean
    receiptSourceType?: boolean
    referencedReceivingExpectationIds?: boolean
    receiptDate?: boolean
    note?: boolean
    attachmentRefs?: boolean
    lineCount?: boolean
    postedAt?: boolean
    cancelledAt?: boolean
    cancelReason?: boolean
    postComment?: boolean
    procurementReceiptSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["receipt"]>

  export type ReceiptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    receiptNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    status?: boolean
    receiptSourceType?: boolean
    referencedReceivingExpectationIds?: boolean
    receiptDate?: boolean
    note?: boolean
    attachmentRefs?: boolean
    lineCount?: boolean
    postedAt?: boolean
    cancelledAt?: boolean
    cancelReason?: boolean
    postComment?: boolean
    procurementReceiptSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["receipt"]>

  export type ReceiptSelectScalar = {
    id?: boolean
    receiptNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    status?: boolean
    receiptSourceType?: boolean
    referencedReceivingExpectationIds?: boolean
    receiptDate?: boolean
    note?: boolean
    attachmentRefs?: boolean
    lineCount?: boolean
    postedAt?: boolean
    cancelledAt?: boolean
    cancelReason?: boolean
    postComment?: boolean
    procurementReceiptSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReceiptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "receiptNo" | "tenantId" | "orgId" | "warehouseId" | "status" | "receiptSourceType" | "referencedReceivingExpectationIds" | "receiptDate" | "note" | "attachmentRefs" | "lineCount" | "postedAt" | "cancelledAt" | "cancelReason" | "postComment" | "procurementReceiptSummary" | "createdAt" | "updatedAt", ExtArgs["result"]["receipt"]>
  export type ReceiptInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | Receipt$linesArgs<ExtArgs>
    _count?: boolean | ReceiptCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ReceiptIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ReceiptIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ReceiptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Receipt"
    objects: {
      lines: Prisma.$ReceiptLinePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      receiptNo: string
      tenantId: string
      orgId: string | null
      warehouseId: string
      status: $Enums.WmsReceiptStatus
      receiptSourceType: $Enums.WmsReceiptSourceType
      referencedReceivingExpectationIds: Prisma.JsonValue
      receiptDate: string
      note: string | null
      attachmentRefs: Prisma.JsonValue
      lineCount: number
      postedAt: Date | null
      cancelledAt: Date | null
      cancelReason: string | null
      postComment: string | null
      procurementReceiptSummary: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["receipt"]>
    composites: {}
  }

  type ReceiptGetPayload<S extends boolean | null | undefined | ReceiptDefaultArgs> = $Result.GetResult<Prisma.$ReceiptPayload, S>

  type ReceiptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReceiptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReceiptCountAggregateInputType | true
    }

  export interface ReceiptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Receipt'], meta: { name: 'Receipt' } }
    /**
     * Find zero or one Receipt that matches the filter.
     * @param {ReceiptFindUniqueArgs} args - Arguments to find a Receipt
     * @example
     * // Get one Receipt
     * const receipt = await prisma.receipt.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReceiptFindUniqueArgs>(args: SelectSubset<T, ReceiptFindUniqueArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Receipt that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReceiptFindUniqueOrThrowArgs} args - Arguments to find a Receipt
     * @example
     * // Get one Receipt
     * const receipt = await prisma.receipt.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReceiptFindUniqueOrThrowArgs>(args: SelectSubset<T, ReceiptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Receipt that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptFindFirstArgs} args - Arguments to find a Receipt
     * @example
     * // Get one Receipt
     * const receipt = await prisma.receipt.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReceiptFindFirstArgs>(args?: SelectSubset<T, ReceiptFindFirstArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Receipt that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptFindFirstOrThrowArgs} args - Arguments to find a Receipt
     * @example
     * // Get one Receipt
     * const receipt = await prisma.receipt.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReceiptFindFirstOrThrowArgs>(args?: SelectSubset<T, ReceiptFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Receipts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Receipts
     * const receipts = await prisma.receipt.findMany()
     * 
     * // Get first 10 Receipts
     * const receipts = await prisma.receipt.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const receiptWithIdOnly = await prisma.receipt.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReceiptFindManyArgs>(args?: SelectSubset<T, ReceiptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Receipt.
     * @param {ReceiptCreateArgs} args - Arguments to create a Receipt.
     * @example
     * // Create one Receipt
     * const Receipt = await prisma.receipt.create({
     *   data: {
     *     // ... data to create a Receipt
     *   }
     * })
     * 
     */
    create<T extends ReceiptCreateArgs>(args: SelectSubset<T, ReceiptCreateArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Receipts.
     * @param {ReceiptCreateManyArgs} args - Arguments to create many Receipts.
     * @example
     * // Create many Receipts
     * const receipt = await prisma.receipt.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReceiptCreateManyArgs>(args?: SelectSubset<T, ReceiptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Receipts and returns the data saved in the database.
     * @param {ReceiptCreateManyAndReturnArgs} args - Arguments to create many Receipts.
     * @example
     * // Create many Receipts
     * const receipt = await prisma.receipt.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Receipts and only return the `id`
     * const receiptWithIdOnly = await prisma.receipt.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReceiptCreateManyAndReturnArgs>(args?: SelectSubset<T, ReceiptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Receipt.
     * @param {ReceiptDeleteArgs} args - Arguments to delete one Receipt.
     * @example
     * // Delete one Receipt
     * const Receipt = await prisma.receipt.delete({
     *   where: {
     *     // ... filter to delete one Receipt
     *   }
     * })
     * 
     */
    delete<T extends ReceiptDeleteArgs>(args: SelectSubset<T, ReceiptDeleteArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Receipt.
     * @param {ReceiptUpdateArgs} args - Arguments to update one Receipt.
     * @example
     * // Update one Receipt
     * const receipt = await prisma.receipt.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReceiptUpdateArgs>(args: SelectSubset<T, ReceiptUpdateArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Receipts.
     * @param {ReceiptDeleteManyArgs} args - Arguments to filter Receipts to delete.
     * @example
     * // Delete a few Receipts
     * const { count } = await prisma.receipt.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReceiptDeleteManyArgs>(args?: SelectSubset<T, ReceiptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Receipts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Receipts
     * const receipt = await prisma.receipt.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReceiptUpdateManyArgs>(args: SelectSubset<T, ReceiptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Receipts and returns the data updated in the database.
     * @param {ReceiptUpdateManyAndReturnArgs} args - Arguments to update many Receipts.
     * @example
     * // Update many Receipts
     * const receipt = await prisma.receipt.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Receipts and only return the `id`
     * const receiptWithIdOnly = await prisma.receipt.updateManyAndReturn({
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
    updateManyAndReturn<T extends ReceiptUpdateManyAndReturnArgs>(args: SelectSubset<T, ReceiptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Receipt.
     * @param {ReceiptUpsertArgs} args - Arguments to update or create a Receipt.
     * @example
     * // Update or create a Receipt
     * const receipt = await prisma.receipt.upsert({
     *   create: {
     *     // ... data to create a Receipt
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Receipt we want to update
     *   }
     * })
     */
    upsert<T extends ReceiptUpsertArgs>(args: SelectSubset<T, ReceiptUpsertArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Receipts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptCountArgs} args - Arguments to filter Receipts to count.
     * @example
     * // Count the number of Receipts
     * const count = await prisma.receipt.count({
     *   where: {
     *     // ... the filter for the Receipts we want to count
     *   }
     * })
    **/
    count<T extends ReceiptCountArgs>(
      args?: Subset<T, ReceiptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReceiptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Receipt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReceiptAggregateArgs>(args: Subset<T, ReceiptAggregateArgs>): Prisma.PrismaPromise<GetReceiptAggregateType<T>>

    /**
     * Group by Receipt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptGroupByArgs} args - Group by arguments.
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
      T extends ReceiptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReceiptGroupByArgs['orderBy'] }
        : { orderBy?: ReceiptGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReceiptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReceiptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Receipt model
   */
  readonly fields: ReceiptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Receipt.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReceiptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends Receipt$linesArgs<ExtArgs> = {}>(args?: Subset<T, Receipt$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
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
   * Fields of the Receipt model
   */ 
  interface ReceiptFieldRefs {
    readonly id: FieldRef<"Receipt", 'String'>
    readonly receiptNo: FieldRef<"Receipt", 'String'>
    readonly tenantId: FieldRef<"Receipt", 'String'>
    readonly orgId: FieldRef<"Receipt", 'String'>
    readonly warehouseId: FieldRef<"Receipt", 'String'>
    readonly status: FieldRef<"Receipt", 'WmsReceiptStatus'>
    readonly receiptSourceType: FieldRef<"Receipt", 'WmsReceiptSourceType'>
    readonly referencedReceivingExpectationIds: FieldRef<"Receipt", 'Json'>
    readonly receiptDate: FieldRef<"Receipt", 'String'>
    readonly note: FieldRef<"Receipt", 'String'>
    readonly attachmentRefs: FieldRef<"Receipt", 'Json'>
    readonly lineCount: FieldRef<"Receipt", 'Int'>
    readonly postedAt: FieldRef<"Receipt", 'DateTime'>
    readonly cancelledAt: FieldRef<"Receipt", 'DateTime'>
    readonly cancelReason: FieldRef<"Receipt", 'String'>
    readonly postComment: FieldRef<"Receipt", 'String'>
    readonly procurementReceiptSummary: FieldRef<"Receipt", 'Json'>
    readonly createdAt: FieldRef<"Receipt", 'DateTime'>
    readonly updatedAt: FieldRef<"Receipt", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Receipt findUnique
   */
  export type ReceiptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter, which Receipt to fetch.
     */
    where: ReceiptWhereUniqueInput
  }

  /**
   * Receipt findUniqueOrThrow
   */
  export type ReceiptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter, which Receipt to fetch.
     */
    where: ReceiptWhereUniqueInput
  }

  /**
   * Receipt findFirst
   */
  export type ReceiptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter, which Receipt to fetch.
     */
    where?: ReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Receipts to fetch.
     */
    orderBy?: ReceiptOrderByWithRelationInput | ReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Receipts.
     */
    cursor?: ReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Receipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Receipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Receipts.
     */
    distinct?: ReceiptScalarFieldEnum | ReceiptScalarFieldEnum[]
  }

  /**
   * Receipt findFirstOrThrow
   */
  export type ReceiptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter, which Receipt to fetch.
     */
    where?: ReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Receipts to fetch.
     */
    orderBy?: ReceiptOrderByWithRelationInput | ReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Receipts.
     */
    cursor?: ReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Receipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Receipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Receipts.
     */
    distinct?: ReceiptScalarFieldEnum | ReceiptScalarFieldEnum[]
  }

  /**
   * Receipt findMany
   */
  export type ReceiptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter, which Receipts to fetch.
     */
    where?: ReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Receipts to fetch.
     */
    orderBy?: ReceiptOrderByWithRelationInput | ReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Receipts.
     */
    cursor?: ReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Receipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Receipts.
     */
    skip?: number
    distinct?: ReceiptScalarFieldEnum | ReceiptScalarFieldEnum[]
  }

  /**
   * Receipt create
   */
  export type ReceiptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * The data needed to create a Receipt.
     */
    data: XOR<ReceiptCreateInput, ReceiptUncheckedCreateInput>
  }

  /**
   * Receipt createMany
   */
  export type ReceiptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Receipts.
     */
    data: ReceiptCreateManyInput | ReceiptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Receipt createManyAndReturn
   */
  export type ReceiptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * The data used to create many Receipts.
     */
    data: ReceiptCreateManyInput | ReceiptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Receipt update
   */
  export type ReceiptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * The data needed to update a Receipt.
     */
    data: XOR<ReceiptUpdateInput, ReceiptUncheckedUpdateInput>
    /**
     * Choose, which Receipt to update.
     */
    where: ReceiptWhereUniqueInput
  }

  /**
   * Receipt updateMany
   */
  export type ReceiptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Receipts.
     */
    data: XOR<ReceiptUpdateManyMutationInput, ReceiptUncheckedUpdateManyInput>
    /**
     * Filter which Receipts to update
     */
    where?: ReceiptWhereInput
    /**
     * Limit how many Receipts to update.
     */
    limit?: number
  }

  /**
   * Receipt updateManyAndReturn
   */
  export type ReceiptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * The data used to update Receipts.
     */
    data: XOR<ReceiptUpdateManyMutationInput, ReceiptUncheckedUpdateManyInput>
    /**
     * Filter which Receipts to update
     */
    where?: ReceiptWhereInput
    /**
     * Limit how many Receipts to update.
     */
    limit?: number
  }

  /**
   * Receipt upsert
   */
  export type ReceiptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * The filter to search for the Receipt to update in case it exists.
     */
    where: ReceiptWhereUniqueInput
    /**
     * In case the Receipt found by the `where` argument doesn't exist, create a new Receipt with this data.
     */
    create: XOR<ReceiptCreateInput, ReceiptUncheckedCreateInput>
    /**
     * In case the Receipt was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReceiptUpdateInput, ReceiptUncheckedUpdateInput>
  }

  /**
   * Receipt delete
   */
  export type ReceiptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
    /**
     * Filter which Receipt to delete.
     */
    where: ReceiptWhereUniqueInput
  }

  /**
   * Receipt deleteMany
   */
  export type ReceiptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Receipts to delete
     */
    where?: ReceiptWhereInput
    /**
     * Limit how many Receipts to delete.
     */
    limit?: number
  }

  /**
   * Receipt.lines
   */
  export type Receipt$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    where?: ReceiptLineWhereInput
    orderBy?: ReceiptLineOrderByWithRelationInput | ReceiptLineOrderByWithRelationInput[]
    cursor?: ReceiptLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReceiptLineScalarFieldEnum | ReceiptLineScalarFieldEnum[]
  }

  /**
   * Receipt without action
   */
  export type ReceiptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Receipt
     */
    select?: ReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Receipt
     */
    omit?: ReceiptOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptInclude<ExtArgs> | null
  }


  /**
   * Model ReceiptLine
   */

  export type AggregateReceiptLine = {
    _count: ReceiptLineCountAggregateOutputType | null
    _avg: ReceiptLineAvgAggregateOutputType | null
    _sum: ReceiptLineSumAggregateOutputType | null
    _min: ReceiptLineMinAggregateOutputType | null
    _max: ReceiptLineMaxAggregateOutputType | null
  }

  export type ReceiptLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type ReceiptLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type ReceiptLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    receiptId: string | null
    lineNo: number | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    receivingExpectationId: string | null
    targetLocationId: string | null
    confirmedQuantity: string | null
    uom: string | null
    inventoryStatus: $Enums.WmsInventoryStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceiptLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    receiptId: string | null
    lineNo: number | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    receivingExpectationId: string | null
    targetLocationId: string | null
    confirmedQuantity: string | null
    uom: string | null
    inventoryStatus: $Enums.WmsInventoryStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceiptLineCountAggregateOutputType = {
    id: number
    tenantId: number
    receiptId: number
    lineNo: number
    itemId: number
    itemCode: number
    itemName: number
    receivingExpectationId: number
    targetLocationId: number
    confirmedQuantity: number
    uom: number
    inventoryStatus: number
    restrictedReason: number
    trackingRefs: number
    physicalDiscrepancy: number
    evidenceAttachmentRefs: number
    postedStockLedgerEntryIds: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReceiptLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type ReceiptLineSumAggregateInputType = {
    lineNo?: true
  }

  export type ReceiptLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    receiptId?: true
    lineNo?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    receivingExpectationId?: true
    targetLocationId?: true
    confirmedQuantity?: true
    uom?: true
    inventoryStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceiptLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    receiptId?: true
    lineNo?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    receivingExpectationId?: true
    targetLocationId?: true
    confirmedQuantity?: true
    uom?: true
    inventoryStatus?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceiptLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    receiptId?: true
    lineNo?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    receivingExpectationId?: true
    targetLocationId?: true
    confirmedQuantity?: true
    uom?: true
    inventoryStatus?: true
    restrictedReason?: true
    trackingRefs?: true
    physicalDiscrepancy?: true
    evidenceAttachmentRefs?: true
    postedStockLedgerEntryIds?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReceiptLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceiptLine to aggregate.
     */
    where?: ReceiptLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceiptLines to fetch.
     */
    orderBy?: ReceiptLineOrderByWithRelationInput | ReceiptLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReceiptLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceiptLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceiptLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReceiptLines
    **/
    _count?: true | ReceiptLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReceiptLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReceiptLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReceiptLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReceiptLineMaxAggregateInputType
  }

  export type GetReceiptLineAggregateType<T extends ReceiptLineAggregateArgs> = {
        [P in keyof T & keyof AggregateReceiptLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReceiptLine[P]>
      : GetScalarType<T[P], AggregateReceiptLine[P]>
  }




  export type ReceiptLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceiptLineWhereInput
    orderBy?: ReceiptLineOrderByWithAggregationInput | ReceiptLineOrderByWithAggregationInput[]
    by: ReceiptLineScalarFieldEnum[] | ReceiptLineScalarFieldEnum
    having?: ReceiptLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReceiptLineCountAggregateInputType | true
    _avg?: ReceiptLineAvgAggregateInputType
    _sum?: ReceiptLineSumAggregateInputType
    _min?: ReceiptLineMinAggregateInputType
    _max?: ReceiptLineMaxAggregateInputType
  }

  export type ReceiptLineGroupByOutputType = {
    id: string
    tenantId: string
    receiptId: string
    lineNo: number
    itemId: string
    itemCode: string | null
    itemName: string | null
    receivingExpectationId: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason: JsonValue | null
    trackingRefs: JsonValue
    physicalDiscrepancy: JsonValue | null
    evidenceAttachmentRefs: JsonValue
    postedStockLedgerEntryIds: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: ReceiptLineCountAggregateOutputType | null
    _avg: ReceiptLineAvgAggregateOutputType | null
    _sum: ReceiptLineSumAggregateOutputType | null
    _min: ReceiptLineMinAggregateOutputType | null
    _max: ReceiptLineMaxAggregateOutputType | null
  }

  type GetReceiptLineGroupByPayload<T extends ReceiptLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReceiptLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReceiptLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReceiptLineGroupByOutputType[P]>
            : GetScalarType<T[P], ReceiptLineGroupByOutputType[P]>
        }
      >
    >


  export type ReceiptLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receiptId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    receivingExpectationId?: boolean
    targetLocationId?: boolean
    confirmedQuantity?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    trackingRefs?: boolean
    physicalDiscrepancy?: boolean
    evidenceAttachmentRefs?: boolean
    postedStockLedgerEntryIds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receiptLine"]>

  export type ReceiptLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receiptId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    receivingExpectationId?: boolean
    targetLocationId?: boolean
    confirmedQuantity?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    trackingRefs?: boolean
    physicalDiscrepancy?: boolean
    evidenceAttachmentRefs?: boolean
    postedStockLedgerEntryIds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receiptLine"]>

  export type ReceiptLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receiptId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    receivingExpectationId?: boolean
    targetLocationId?: boolean
    confirmedQuantity?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    trackingRefs?: boolean
    physicalDiscrepancy?: boolean
    evidenceAttachmentRefs?: boolean
    postedStockLedgerEntryIds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receiptLine"]>

  export type ReceiptLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    receiptId?: boolean
    lineNo?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    receivingExpectationId?: boolean
    targetLocationId?: boolean
    confirmedQuantity?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    trackingRefs?: boolean
    physicalDiscrepancy?: boolean
    evidenceAttachmentRefs?: boolean
    postedStockLedgerEntryIds?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReceiptLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "receiptId" | "lineNo" | "itemId" | "itemCode" | "itemName" | "receivingExpectationId" | "targetLocationId" | "confirmedQuantity" | "uom" | "inventoryStatus" | "restrictedReason" | "trackingRefs" | "physicalDiscrepancy" | "evidenceAttachmentRefs" | "postedStockLedgerEntryIds" | "createdAt" | "updatedAt", ExtArgs["result"]["receiptLine"]>
  export type ReceiptLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }
  export type ReceiptLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }
  export type ReceiptLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receipt?: boolean | ReceiptDefaultArgs<ExtArgs>
  }

  export type $ReceiptLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReceiptLine"
    objects: {
      receipt: Prisma.$ReceiptPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      receiptId: string
      lineNo: number
      itemId: string
      itemCode: string | null
      itemName: string | null
      receivingExpectationId: string | null
      targetLocationId: string
      confirmedQuantity: string
      uom: string
      inventoryStatus: $Enums.WmsInventoryStatus
      restrictedReason: Prisma.JsonValue | null
      trackingRefs: Prisma.JsonValue
      physicalDiscrepancy: Prisma.JsonValue | null
      evidenceAttachmentRefs: Prisma.JsonValue
      postedStockLedgerEntryIds: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["receiptLine"]>
    composites: {}
  }

  type ReceiptLineGetPayload<S extends boolean | null | undefined | ReceiptLineDefaultArgs> = $Result.GetResult<Prisma.$ReceiptLinePayload, S>

  type ReceiptLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReceiptLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReceiptLineCountAggregateInputType | true
    }

  export interface ReceiptLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReceiptLine'], meta: { name: 'ReceiptLine' } }
    /**
     * Find zero or one ReceiptLine that matches the filter.
     * @param {ReceiptLineFindUniqueArgs} args - Arguments to find a ReceiptLine
     * @example
     * // Get one ReceiptLine
     * const receiptLine = await prisma.receiptLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReceiptLineFindUniqueArgs>(args: SelectSubset<T, ReceiptLineFindUniqueArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ReceiptLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReceiptLineFindUniqueOrThrowArgs} args - Arguments to find a ReceiptLine
     * @example
     * // Get one ReceiptLine
     * const receiptLine = await prisma.receiptLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReceiptLineFindUniqueOrThrowArgs>(args: SelectSubset<T, ReceiptLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ReceiptLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineFindFirstArgs} args - Arguments to find a ReceiptLine
     * @example
     * // Get one ReceiptLine
     * const receiptLine = await prisma.receiptLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReceiptLineFindFirstArgs>(args?: SelectSubset<T, ReceiptLineFindFirstArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ReceiptLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineFindFirstOrThrowArgs} args - Arguments to find a ReceiptLine
     * @example
     * // Get one ReceiptLine
     * const receiptLine = await prisma.receiptLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReceiptLineFindFirstOrThrowArgs>(args?: SelectSubset<T, ReceiptLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ReceiptLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReceiptLines
     * const receiptLines = await prisma.receiptLine.findMany()
     * 
     * // Get first 10 ReceiptLines
     * const receiptLines = await prisma.receiptLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const receiptLineWithIdOnly = await prisma.receiptLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReceiptLineFindManyArgs>(args?: SelectSubset<T, ReceiptLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ReceiptLine.
     * @param {ReceiptLineCreateArgs} args - Arguments to create a ReceiptLine.
     * @example
     * // Create one ReceiptLine
     * const ReceiptLine = await prisma.receiptLine.create({
     *   data: {
     *     // ... data to create a ReceiptLine
     *   }
     * })
     * 
     */
    create<T extends ReceiptLineCreateArgs>(args: SelectSubset<T, ReceiptLineCreateArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ReceiptLines.
     * @param {ReceiptLineCreateManyArgs} args - Arguments to create many ReceiptLines.
     * @example
     * // Create many ReceiptLines
     * const receiptLine = await prisma.receiptLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReceiptLineCreateManyArgs>(args?: SelectSubset<T, ReceiptLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReceiptLines and returns the data saved in the database.
     * @param {ReceiptLineCreateManyAndReturnArgs} args - Arguments to create many ReceiptLines.
     * @example
     * // Create many ReceiptLines
     * const receiptLine = await prisma.receiptLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReceiptLines and only return the `id`
     * const receiptLineWithIdOnly = await prisma.receiptLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReceiptLineCreateManyAndReturnArgs>(args?: SelectSubset<T, ReceiptLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ReceiptLine.
     * @param {ReceiptLineDeleteArgs} args - Arguments to delete one ReceiptLine.
     * @example
     * // Delete one ReceiptLine
     * const ReceiptLine = await prisma.receiptLine.delete({
     *   where: {
     *     // ... filter to delete one ReceiptLine
     *   }
     * })
     * 
     */
    delete<T extends ReceiptLineDeleteArgs>(args: SelectSubset<T, ReceiptLineDeleteArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ReceiptLine.
     * @param {ReceiptLineUpdateArgs} args - Arguments to update one ReceiptLine.
     * @example
     * // Update one ReceiptLine
     * const receiptLine = await prisma.receiptLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReceiptLineUpdateArgs>(args: SelectSubset<T, ReceiptLineUpdateArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ReceiptLines.
     * @param {ReceiptLineDeleteManyArgs} args - Arguments to filter ReceiptLines to delete.
     * @example
     * // Delete a few ReceiptLines
     * const { count } = await prisma.receiptLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReceiptLineDeleteManyArgs>(args?: SelectSubset<T, ReceiptLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceiptLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReceiptLines
     * const receiptLine = await prisma.receiptLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReceiptLineUpdateManyArgs>(args: SelectSubset<T, ReceiptLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceiptLines and returns the data updated in the database.
     * @param {ReceiptLineUpdateManyAndReturnArgs} args - Arguments to update many ReceiptLines.
     * @example
     * // Update many ReceiptLines
     * const receiptLine = await prisma.receiptLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ReceiptLines and only return the `id`
     * const receiptLineWithIdOnly = await prisma.receiptLine.updateManyAndReturn({
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
    updateManyAndReturn<T extends ReceiptLineUpdateManyAndReturnArgs>(args: SelectSubset<T, ReceiptLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ReceiptLine.
     * @param {ReceiptLineUpsertArgs} args - Arguments to update or create a ReceiptLine.
     * @example
     * // Update or create a ReceiptLine
     * const receiptLine = await prisma.receiptLine.upsert({
     *   create: {
     *     // ... data to create a ReceiptLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReceiptLine we want to update
     *   }
     * })
     */
    upsert<T extends ReceiptLineUpsertArgs>(args: SelectSubset<T, ReceiptLineUpsertArgs<ExtArgs>>): Prisma__ReceiptLineClient<$Result.GetResult<Prisma.$ReceiptLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ReceiptLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineCountArgs} args - Arguments to filter ReceiptLines to count.
     * @example
     * // Count the number of ReceiptLines
     * const count = await prisma.receiptLine.count({
     *   where: {
     *     // ... the filter for the ReceiptLines we want to count
     *   }
     * })
    **/
    count<T extends ReceiptLineCountArgs>(
      args?: Subset<T, ReceiptLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReceiptLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReceiptLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReceiptLineAggregateArgs>(args: Subset<T, ReceiptLineAggregateArgs>): Prisma.PrismaPromise<GetReceiptLineAggregateType<T>>

    /**
     * Group by ReceiptLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceiptLineGroupByArgs} args - Group by arguments.
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
      T extends ReceiptLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReceiptLineGroupByArgs['orderBy'] }
        : { orderBy?: ReceiptLineGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReceiptLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReceiptLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReceiptLine model
   */
  readonly fields: ReceiptLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReceiptLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReceiptLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    receipt<T extends ReceiptDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ReceiptDefaultArgs<ExtArgs>>): Prisma__ReceiptClient<$Result.GetResult<Prisma.$ReceiptPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the ReceiptLine model
   */ 
  interface ReceiptLineFieldRefs {
    readonly id: FieldRef<"ReceiptLine", 'String'>
    readonly tenantId: FieldRef<"ReceiptLine", 'String'>
    readonly receiptId: FieldRef<"ReceiptLine", 'String'>
    readonly lineNo: FieldRef<"ReceiptLine", 'Int'>
    readonly itemId: FieldRef<"ReceiptLine", 'String'>
    readonly itemCode: FieldRef<"ReceiptLine", 'String'>
    readonly itemName: FieldRef<"ReceiptLine", 'String'>
    readonly receivingExpectationId: FieldRef<"ReceiptLine", 'String'>
    readonly targetLocationId: FieldRef<"ReceiptLine", 'String'>
    readonly confirmedQuantity: FieldRef<"ReceiptLine", 'String'>
    readonly uom: FieldRef<"ReceiptLine", 'String'>
    readonly inventoryStatus: FieldRef<"ReceiptLine", 'WmsInventoryStatus'>
    readonly restrictedReason: FieldRef<"ReceiptLine", 'Json'>
    readonly trackingRefs: FieldRef<"ReceiptLine", 'Json'>
    readonly physicalDiscrepancy: FieldRef<"ReceiptLine", 'Json'>
    readonly evidenceAttachmentRefs: FieldRef<"ReceiptLine", 'Json'>
    readonly postedStockLedgerEntryIds: FieldRef<"ReceiptLine", 'Json'>
    readonly createdAt: FieldRef<"ReceiptLine", 'DateTime'>
    readonly updatedAt: FieldRef<"ReceiptLine", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReceiptLine findUnique
   */
  export type ReceiptLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter, which ReceiptLine to fetch.
     */
    where: ReceiptLineWhereUniqueInput
  }

  /**
   * ReceiptLine findUniqueOrThrow
   */
  export type ReceiptLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter, which ReceiptLine to fetch.
     */
    where: ReceiptLineWhereUniqueInput
  }

  /**
   * ReceiptLine findFirst
   */
  export type ReceiptLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter, which ReceiptLine to fetch.
     */
    where?: ReceiptLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceiptLines to fetch.
     */
    orderBy?: ReceiptLineOrderByWithRelationInput | ReceiptLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceiptLines.
     */
    cursor?: ReceiptLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceiptLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceiptLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceiptLines.
     */
    distinct?: ReceiptLineScalarFieldEnum | ReceiptLineScalarFieldEnum[]
  }

  /**
   * ReceiptLine findFirstOrThrow
   */
  export type ReceiptLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter, which ReceiptLine to fetch.
     */
    where?: ReceiptLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceiptLines to fetch.
     */
    orderBy?: ReceiptLineOrderByWithRelationInput | ReceiptLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceiptLines.
     */
    cursor?: ReceiptLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceiptLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceiptLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceiptLines.
     */
    distinct?: ReceiptLineScalarFieldEnum | ReceiptLineScalarFieldEnum[]
  }

  /**
   * ReceiptLine findMany
   */
  export type ReceiptLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter, which ReceiptLines to fetch.
     */
    where?: ReceiptLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceiptLines to fetch.
     */
    orderBy?: ReceiptLineOrderByWithRelationInput | ReceiptLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReceiptLines.
     */
    cursor?: ReceiptLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceiptLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceiptLines.
     */
    skip?: number
    distinct?: ReceiptLineScalarFieldEnum | ReceiptLineScalarFieldEnum[]
  }

  /**
   * ReceiptLine create
   */
  export type ReceiptLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * The data needed to create a ReceiptLine.
     */
    data: XOR<ReceiptLineCreateInput, ReceiptLineUncheckedCreateInput>
  }

  /**
   * ReceiptLine createMany
   */
  export type ReceiptLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReceiptLines.
     */
    data: ReceiptLineCreateManyInput | ReceiptLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReceiptLine createManyAndReturn
   */
  export type ReceiptLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * The data used to create many ReceiptLines.
     */
    data: ReceiptLineCreateManyInput | ReceiptLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceiptLine update
   */
  export type ReceiptLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * The data needed to update a ReceiptLine.
     */
    data: XOR<ReceiptLineUpdateInput, ReceiptLineUncheckedUpdateInput>
    /**
     * Choose, which ReceiptLine to update.
     */
    where: ReceiptLineWhereUniqueInput
  }

  /**
   * ReceiptLine updateMany
   */
  export type ReceiptLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReceiptLines.
     */
    data: XOR<ReceiptLineUpdateManyMutationInput, ReceiptLineUncheckedUpdateManyInput>
    /**
     * Filter which ReceiptLines to update
     */
    where?: ReceiptLineWhereInput
    /**
     * Limit how many ReceiptLines to update.
     */
    limit?: number
  }

  /**
   * ReceiptLine updateManyAndReturn
   */
  export type ReceiptLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * The data used to update ReceiptLines.
     */
    data: XOR<ReceiptLineUpdateManyMutationInput, ReceiptLineUncheckedUpdateManyInput>
    /**
     * Filter which ReceiptLines to update
     */
    where?: ReceiptLineWhereInput
    /**
     * Limit how many ReceiptLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceiptLine upsert
   */
  export type ReceiptLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * The filter to search for the ReceiptLine to update in case it exists.
     */
    where: ReceiptLineWhereUniqueInput
    /**
     * In case the ReceiptLine found by the `where` argument doesn't exist, create a new ReceiptLine with this data.
     */
    create: XOR<ReceiptLineCreateInput, ReceiptLineUncheckedCreateInput>
    /**
     * In case the ReceiptLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReceiptLineUpdateInput, ReceiptLineUncheckedUpdateInput>
  }

  /**
   * ReceiptLine delete
   */
  export type ReceiptLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
    /**
     * Filter which ReceiptLine to delete.
     */
    where: ReceiptLineWhereUniqueInput
  }

  /**
   * ReceiptLine deleteMany
   */
  export type ReceiptLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceiptLines to delete
     */
    where?: ReceiptLineWhereInput
    /**
     * Limit how many ReceiptLines to delete.
     */
    limit?: number
  }

  /**
   * ReceiptLine without action
   */
  export type ReceiptLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceiptLine
     */
    select?: ReceiptLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceiptLine
     */
    omit?: ReceiptLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceiptLineInclude<ExtArgs> | null
  }


  /**
   * Model StockLedgerEntry
   */

  export type AggregateStockLedgerEntry = {
    _count: StockLedgerEntryCountAggregateOutputType | null
    _min: StockLedgerEntryMinAggregateOutputType | null
    _max: StockLedgerEntryMaxAggregateOutputType | null
  }

  export type StockLedgerEntryMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    orgId: string | null
    entryType: $Enums.WmsStockLedgerEntryType | null
    direction: $Enums.WmsStockLedgerDirection | null
    warehouseId: string | null
    locationId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    quantityDelta: string | null
    uom: string | null
    inventoryStatus: $Enums.WmsInventoryStatus | null
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType | null
    sourceDocumentId: string | null
    sourceDocumentLineId: string | null
    receivingExpectationId: string | null
    postedAt: Date | null
  }

  export type StockLedgerEntryMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    orgId: string | null
    entryType: $Enums.WmsStockLedgerEntryType | null
    direction: $Enums.WmsStockLedgerDirection | null
    warehouseId: string | null
    locationId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    quantityDelta: string | null
    uom: string | null
    inventoryStatus: $Enums.WmsInventoryStatus | null
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType | null
    sourceDocumentId: string | null
    sourceDocumentLineId: string | null
    receivingExpectationId: string | null
    postedAt: Date | null
  }

  export type StockLedgerEntryCountAggregateOutputType = {
    id: number
    tenantId: number
    orgId: number
    entryType: number
    direction: number
    warehouseId: number
    locationId: number
    itemId: number
    itemCode: number
    itemName: number
    quantityDelta: number
    uom: number
    inventoryStatus: number
    restrictedReason: number
    sourceDocumentType: number
    sourceDocumentId: number
    sourceDocumentLineId: number
    receivingExpectationId: number
    trackingRefs: number
    postedAt: number
    _all: number
  }


  export type StockLedgerEntryMinAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    entryType?: true
    direction?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    quantityDelta?: true
    uom?: true
    inventoryStatus?: true
    sourceDocumentType?: true
    sourceDocumentId?: true
    sourceDocumentLineId?: true
    receivingExpectationId?: true
    postedAt?: true
  }

  export type StockLedgerEntryMaxAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    entryType?: true
    direction?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    quantityDelta?: true
    uom?: true
    inventoryStatus?: true
    sourceDocumentType?: true
    sourceDocumentId?: true
    sourceDocumentLineId?: true
    receivingExpectationId?: true
    postedAt?: true
  }

  export type StockLedgerEntryCountAggregateInputType = {
    id?: true
    tenantId?: true
    orgId?: true
    entryType?: true
    direction?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    quantityDelta?: true
    uom?: true
    inventoryStatus?: true
    restrictedReason?: true
    sourceDocumentType?: true
    sourceDocumentId?: true
    sourceDocumentLineId?: true
    receivingExpectationId?: true
    trackingRefs?: true
    postedAt?: true
    _all?: true
  }

  export type StockLedgerEntryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLedgerEntry to aggregate.
     */
    where?: StockLedgerEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLedgerEntries to fetch.
     */
    orderBy?: StockLedgerEntryOrderByWithRelationInput | StockLedgerEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: StockLedgerEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLedgerEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLedgerEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned StockLedgerEntries
    **/
    _count?: true | StockLedgerEntryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: StockLedgerEntryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: StockLedgerEntryMaxAggregateInputType
  }

  export type GetStockLedgerEntryAggregateType<T extends StockLedgerEntryAggregateArgs> = {
        [P in keyof T & keyof AggregateStockLedgerEntry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateStockLedgerEntry[P]>
      : GetScalarType<T[P], AggregateStockLedgerEntry[P]>
  }




  export type StockLedgerEntryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: StockLedgerEntryWhereInput
    orderBy?: StockLedgerEntryOrderByWithAggregationInput | StockLedgerEntryOrderByWithAggregationInput[]
    by: StockLedgerEntryScalarFieldEnum[] | StockLedgerEntryScalarFieldEnum
    having?: StockLedgerEntryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: StockLedgerEntryCountAggregateInputType | true
    _min?: StockLedgerEntryMinAggregateInputType
    _max?: StockLedgerEntryMaxAggregateInputType
  }

  export type StockLedgerEntryGroupByOutputType = {
    id: string
    tenantId: string
    orgId: string | null
    entryType: $Enums.WmsStockLedgerEntryType
    direction: $Enums.WmsStockLedgerDirection
    warehouseId: string
    locationId: string
    itemId: string
    itemCode: string | null
    itemName: string | null
    quantityDelta: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason: JsonValue | null
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId: string
    sourceDocumentLineId: string
    receivingExpectationId: string | null
    trackingRefs: JsonValue
    postedAt: Date
    _count: StockLedgerEntryCountAggregateOutputType | null
    _min: StockLedgerEntryMinAggregateOutputType | null
    _max: StockLedgerEntryMaxAggregateOutputType | null
  }

  type GetStockLedgerEntryGroupByPayload<T extends StockLedgerEntryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<StockLedgerEntryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof StockLedgerEntryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], StockLedgerEntryGroupByOutputType[P]>
            : GetScalarType<T[P], StockLedgerEntryGroupByOutputType[P]>
        }
      >
    >


  export type StockLedgerEntrySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    entryType?: boolean
    direction?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    quantityDelta?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    sourceDocumentType?: boolean
    sourceDocumentId?: boolean
    sourceDocumentLineId?: boolean
    receivingExpectationId?: boolean
    trackingRefs?: boolean
    postedAt?: boolean
  }, ExtArgs["result"]["stockLedgerEntry"]>

  export type StockLedgerEntrySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    entryType?: boolean
    direction?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    quantityDelta?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    sourceDocumentType?: boolean
    sourceDocumentId?: boolean
    sourceDocumentLineId?: boolean
    receivingExpectationId?: boolean
    trackingRefs?: boolean
    postedAt?: boolean
  }, ExtArgs["result"]["stockLedgerEntry"]>

  export type StockLedgerEntrySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    entryType?: boolean
    direction?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    quantityDelta?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    sourceDocumentType?: boolean
    sourceDocumentId?: boolean
    sourceDocumentLineId?: boolean
    receivingExpectationId?: boolean
    trackingRefs?: boolean
    postedAt?: boolean
  }, ExtArgs["result"]["stockLedgerEntry"]>

  export type StockLedgerEntrySelectScalar = {
    id?: boolean
    tenantId?: boolean
    orgId?: boolean
    entryType?: boolean
    direction?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    quantityDelta?: boolean
    uom?: boolean
    inventoryStatus?: boolean
    restrictedReason?: boolean
    sourceDocumentType?: boolean
    sourceDocumentId?: boolean
    sourceDocumentLineId?: boolean
    receivingExpectationId?: boolean
    trackingRefs?: boolean
    postedAt?: boolean
  }

  export type StockLedgerEntryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "orgId" | "entryType" | "direction" | "warehouseId" | "locationId" | "itemId" | "itemCode" | "itemName" | "quantityDelta" | "uom" | "inventoryStatus" | "restrictedReason" | "sourceDocumentType" | "sourceDocumentId" | "sourceDocumentLineId" | "receivingExpectationId" | "trackingRefs" | "postedAt", ExtArgs["result"]["stockLedgerEntry"]>

  export type $StockLedgerEntryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "StockLedgerEntry"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      orgId: string | null
      entryType: $Enums.WmsStockLedgerEntryType
      direction: $Enums.WmsStockLedgerDirection
      warehouseId: string
      locationId: string
      itemId: string
      itemCode: string | null
      itemName: string | null
      quantityDelta: string
      uom: string
      inventoryStatus: $Enums.WmsInventoryStatus
      restrictedReason: Prisma.JsonValue | null
      sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType
      sourceDocumentId: string
      sourceDocumentLineId: string
      receivingExpectationId: string | null
      trackingRefs: Prisma.JsonValue
      postedAt: Date
    }, ExtArgs["result"]["stockLedgerEntry"]>
    composites: {}
  }

  type StockLedgerEntryGetPayload<S extends boolean | null | undefined | StockLedgerEntryDefaultArgs> = $Result.GetResult<Prisma.$StockLedgerEntryPayload, S>

  type StockLedgerEntryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<StockLedgerEntryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: StockLedgerEntryCountAggregateInputType | true
    }

  export interface StockLedgerEntryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['StockLedgerEntry'], meta: { name: 'StockLedgerEntry' } }
    /**
     * Find zero or one StockLedgerEntry that matches the filter.
     * @param {StockLedgerEntryFindUniqueArgs} args - Arguments to find a StockLedgerEntry
     * @example
     * // Get one StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends StockLedgerEntryFindUniqueArgs>(args: SelectSubset<T, StockLedgerEntryFindUniqueArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one StockLedgerEntry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {StockLedgerEntryFindUniqueOrThrowArgs} args - Arguments to find a StockLedgerEntry
     * @example
     * // Get one StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends StockLedgerEntryFindUniqueOrThrowArgs>(args: SelectSubset<T, StockLedgerEntryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first StockLedgerEntry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryFindFirstArgs} args - Arguments to find a StockLedgerEntry
     * @example
     * // Get one StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends StockLedgerEntryFindFirstArgs>(args?: SelectSubset<T, StockLedgerEntryFindFirstArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first StockLedgerEntry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryFindFirstOrThrowArgs} args - Arguments to find a StockLedgerEntry
     * @example
     * // Get one StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends StockLedgerEntryFindFirstOrThrowArgs>(args?: SelectSubset<T, StockLedgerEntryFindFirstOrThrowArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more StockLedgerEntries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all StockLedgerEntries
     * const stockLedgerEntries = await prisma.stockLedgerEntry.findMany()
     * 
     * // Get first 10 StockLedgerEntries
     * const stockLedgerEntries = await prisma.stockLedgerEntry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const stockLedgerEntryWithIdOnly = await prisma.stockLedgerEntry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends StockLedgerEntryFindManyArgs>(args?: SelectSubset<T, StockLedgerEntryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a StockLedgerEntry.
     * @param {StockLedgerEntryCreateArgs} args - Arguments to create a StockLedgerEntry.
     * @example
     * // Create one StockLedgerEntry
     * const StockLedgerEntry = await prisma.stockLedgerEntry.create({
     *   data: {
     *     // ... data to create a StockLedgerEntry
     *   }
     * })
     * 
     */
    create<T extends StockLedgerEntryCreateArgs>(args: SelectSubset<T, StockLedgerEntryCreateArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many StockLedgerEntries.
     * @param {StockLedgerEntryCreateManyArgs} args - Arguments to create many StockLedgerEntries.
     * @example
     * // Create many StockLedgerEntries
     * const stockLedgerEntry = await prisma.stockLedgerEntry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends StockLedgerEntryCreateManyArgs>(args?: SelectSubset<T, StockLedgerEntryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many StockLedgerEntries and returns the data saved in the database.
     * @param {StockLedgerEntryCreateManyAndReturnArgs} args - Arguments to create many StockLedgerEntries.
     * @example
     * // Create many StockLedgerEntries
     * const stockLedgerEntry = await prisma.stockLedgerEntry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many StockLedgerEntries and only return the `id`
     * const stockLedgerEntryWithIdOnly = await prisma.stockLedgerEntry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends StockLedgerEntryCreateManyAndReturnArgs>(args?: SelectSubset<T, StockLedgerEntryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a StockLedgerEntry.
     * @param {StockLedgerEntryDeleteArgs} args - Arguments to delete one StockLedgerEntry.
     * @example
     * // Delete one StockLedgerEntry
     * const StockLedgerEntry = await prisma.stockLedgerEntry.delete({
     *   where: {
     *     // ... filter to delete one StockLedgerEntry
     *   }
     * })
     * 
     */
    delete<T extends StockLedgerEntryDeleteArgs>(args: SelectSubset<T, StockLedgerEntryDeleteArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one StockLedgerEntry.
     * @param {StockLedgerEntryUpdateArgs} args - Arguments to update one StockLedgerEntry.
     * @example
     * // Update one StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends StockLedgerEntryUpdateArgs>(args: SelectSubset<T, StockLedgerEntryUpdateArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more StockLedgerEntries.
     * @param {StockLedgerEntryDeleteManyArgs} args - Arguments to filter StockLedgerEntries to delete.
     * @example
     * // Delete a few StockLedgerEntries
     * const { count } = await prisma.stockLedgerEntry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends StockLedgerEntryDeleteManyArgs>(args?: SelectSubset<T, StockLedgerEntryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockLedgerEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many StockLedgerEntries
     * const stockLedgerEntry = await prisma.stockLedgerEntry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends StockLedgerEntryUpdateManyArgs>(args: SelectSubset<T, StockLedgerEntryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more StockLedgerEntries and returns the data updated in the database.
     * @param {StockLedgerEntryUpdateManyAndReturnArgs} args - Arguments to update many StockLedgerEntries.
     * @example
     * // Update many StockLedgerEntries
     * const stockLedgerEntry = await prisma.stockLedgerEntry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more StockLedgerEntries and only return the `id`
     * const stockLedgerEntryWithIdOnly = await prisma.stockLedgerEntry.updateManyAndReturn({
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
    updateManyAndReturn<T extends StockLedgerEntryUpdateManyAndReturnArgs>(args: SelectSubset<T, StockLedgerEntryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one StockLedgerEntry.
     * @param {StockLedgerEntryUpsertArgs} args - Arguments to update or create a StockLedgerEntry.
     * @example
     * // Update or create a StockLedgerEntry
     * const stockLedgerEntry = await prisma.stockLedgerEntry.upsert({
     *   create: {
     *     // ... data to create a StockLedgerEntry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the StockLedgerEntry we want to update
     *   }
     * })
     */
    upsert<T extends StockLedgerEntryUpsertArgs>(args: SelectSubset<T, StockLedgerEntryUpsertArgs<ExtArgs>>): Prisma__StockLedgerEntryClient<$Result.GetResult<Prisma.$StockLedgerEntryPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of StockLedgerEntries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryCountArgs} args - Arguments to filter StockLedgerEntries to count.
     * @example
     * // Count the number of StockLedgerEntries
     * const count = await prisma.stockLedgerEntry.count({
     *   where: {
     *     // ... the filter for the StockLedgerEntries we want to count
     *   }
     * })
    **/
    count<T extends StockLedgerEntryCountArgs>(
      args?: Subset<T, StockLedgerEntryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], StockLedgerEntryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a StockLedgerEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends StockLedgerEntryAggregateArgs>(args: Subset<T, StockLedgerEntryAggregateArgs>): Prisma.PrismaPromise<GetStockLedgerEntryAggregateType<T>>

    /**
     * Group by StockLedgerEntry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {StockLedgerEntryGroupByArgs} args - Group by arguments.
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
      T extends StockLedgerEntryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: StockLedgerEntryGroupByArgs['orderBy'] }
        : { orderBy?: StockLedgerEntryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, StockLedgerEntryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetStockLedgerEntryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the StockLedgerEntry model
   */
  readonly fields: StockLedgerEntryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for StockLedgerEntry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__StockLedgerEntryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the StockLedgerEntry model
   */ 
  interface StockLedgerEntryFieldRefs {
    readonly id: FieldRef<"StockLedgerEntry", 'String'>
    readonly tenantId: FieldRef<"StockLedgerEntry", 'String'>
    readonly orgId: FieldRef<"StockLedgerEntry", 'String'>
    readonly entryType: FieldRef<"StockLedgerEntry", 'WmsStockLedgerEntryType'>
    readonly direction: FieldRef<"StockLedgerEntry", 'WmsStockLedgerDirection'>
    readonly warehouseId: FieldRef<"StockLedgerEntry", 'String'>
    readonly locationId: FieldRef<"StockLedgerEntry", 'String'>
    readonly itemId: FieldRef<"StockLedgerEntry", 'String'>
    readonly itemCode: FieldRef<"StockLedgerEntry", 'String'>
    readonly itemName: FieldRef<"StockLedgerEntry", 'String'>
    readonly quantityDelta: FieldRef<"StockLedgerEntry", 'String'>
    readonly uom: FieldRef<"StockLedgerEntry", 'String'>
    readonly inventoryStatus: FieldRef<"StockLedgerEntry", 'WmsInventoryStatus'>
    readonly restrictedReason: FieldRef<"StockLedgerEntry", 'Json'>
    readonly sourceDocumentType: FieldRef<"StockLedgerEntry", 'WmsStockLedgerSourceDocumentType'>
    readonly sourceDocumentId: FieldRef<"StockLedgerEntry", 'String'>
    readonly sourceDocumentLineId: FieldRef<"StockLedgerEntry", 'String'>
    readonly receivingExpectationId: FieldRef<"StockLedgerEntry", 'String'>
    readonly trackingRefs: FieldRef<"StockLedgerEntry", 'Json'>
    readonly postedAt: FieldRef<"StockLedgerEntry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * StockLedgerEntry findUnique
   */
  export type StockLedgerEntryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter, which StockLedgerEntry to fetch.
     */
    where: StockLedgerEntryWhereUniqueInput
  }

  /**
   * StockLedgerEntry findUniqueOrThrow
   */
  export type StockLedgerEntryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter, which StockLedgerEntry to fetch.
     */
    where: StockLedgerEntryWhereUniqueInput
  }

  /**
   * StockLedgerEntry findFirst
   */
  export type StockLedgerEntryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter, which StockLedgerEntry to fetch.
     */
    where?: StockLedgerEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLedgerEntries to fetch.
     */
    orderBy?: StockLedgerEntryOrderByWithRelationInput | StockLedgerEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLedgerEntries.
     */
    cursor?: StockLedgerEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLedgerEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLedgerEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLedgerEntries.
     */
    distinct?: StockLedgerEntryScalarFieldEnum | StockLedgerEntryScalarFieldEnum[]
  }

  /**
   * StockLedgerEntry findFirstOrThrow
   */
  export type StockLedgerEntryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter, which StockLedgerEntry to fetch.
     */
    where?: StockLedgerEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLedgerEntries to fetch.
     */
    orderBy?: StockLedgerEntryOrderByWithRelationInput | StockLedgerEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for StockLedgerEntries.
     */
    cursor?: StockLedgerEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLedgerEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLedgerEntries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of StockLedgerEntries.
     */
    distinct?: StockLedgerEntryScalarFieldEnum | StockLedgerEntryScalarFieldEnum[]
  }

  /**
   * StockLedgerEntry findMany
   */
  export type StockLedgerEntryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter, which StockLedgerEntries to fetch.
     */
    where?: StockLedgerEntryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of StockLedgerEntries to fetch.
     */
    orderBy?: StockLedgerEntryOrderByWithRelationInput | StockLedgerEntryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing StockLedgerEntries.
     */
    cursor?: StockLedgerEntryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` StockLedgerEntries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` StockLedgerEntries.
     */
    skip?: number
    distinct?: StockLedgerEntryScalarFieldEnum | StockLedgerEntryScalarFieldEnum[]
  }

  /**
   * StockLedgerEntry create
   */
  export type StockLedgerEntryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * The data needed to create a StockLedgerEntry.
     */
    data: XOR<StockLedgerEntryCreateInput, StockLedgerEntryUncheckedCreateInput>
  }

  /**
   * StockLedgerEntry createMany
   */
  export type StockLedgerEntryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many StockLedgerEntries.
     */
    data: StockLedgerEntryCreateManyInput | StockLedgerEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockLedgerEntry createManyAndReturn
   */
  export type StockLedgerEntryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * The data used to create many StockLedgerEntries.
     */
    data: StockLedgerEntryCreateManyInput | StockLedgerEntryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * StockLedgerEntry update
   */
  export type StockLedgerEntryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * The data needed to update a StockLedgerEntry.
     */
    data: XOR<StockLedgerEntryUpdateInput, StockLedgerEntryUncheckedUpdateInput>
    /**
     * Choose, which StockLedgerEntry to update.
     */
    where: StockLedgerEntryWhereUniqueInput
  }

  /**
   * StockLedgerEntry updateMany
   */
  export type StockLedgerEntryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update StockLedgerEntries.
     */
    data: XOR<StockLedgerEntryUpdateManyMutationInput, StockLedgerEntryUncheckedUpdateManyInput>
    /**
     * Filter which StockLedgerEntries to update
     */
    where?: StockLedgerEntryWhereInput
    /**
     * Limit how many StockLedgerEntries to update.
     */
    limit?: number
  }

  /**
   * StockLedgerEntry updateManyAndReturn
   */
  export type StockLedgerEntryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * The data used to update StockLedgerEntries.
     */
    data: XOR<StockLedgerEntryUpdateManyMutationInput, StockLedgerEntryUncheckedUpdateManyInput>
    /**
     * Filter which StockLedgerEntries to update
     */
    where?: StockLedgerEntryWhereInput
    /**
     * Limit how many StockLedgerEntries to update.
     */
    limit?: number
  }

  /**
   * StockLedgerEntry upsert
   */
  export type StockLedgerEntryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * The filter to search for the StockLedgerEntry to update in case it exists.
     */
    where: StockLedgerEntryWhereUniqueInput
    /**
     * In case the StockLedgerEntry found by the `where` argument doesn't exist, create a new StockLedgerEntry with this data.
     */
    create: XOR<StockLedgerEntryCreateInput, StockLedgerEntryUncheckedCreateInput>
    /**
     * In case the StockLedgerEntry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<StockLedgerEntryUpdateInput, StockLedgerEntryUncheckedUpdateInput>
  }

  /**
   * StockLedgerEntry delete
   */
  export type StockLedgerEntryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
    /**
     * Filter which StockLedgerEntry to delete.
     */
    where: StockLedgerEntryWhereUniqueInput
  }

  /**
   * StockLedgerEntry deleteMany
   */
  export type StockLedgerEntryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which StockLedgerEntries to delete
     */
    where?: StockLedgerEntryWhereInput
    /**
     * Limit how many StockLedgerEntries to delete.
     */
    limit?: number
  }

  /**
   * StockLedgerEntry without action
   */
  export type StockLedgerEntryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the StockLedgerEntry
     */
    select?: StockLedgerEntrySelect<ExtArgs> | null
    /**
     * Omit specific fields from the StockLedgerEntry
     */
    omit?: StockLedgerEntryOmit<ExtArgs> | null
  }


  /**
   * Model InventoryBalance
   */

  export type AggregateInventoryBalance = {
    _count: InventoryBalanceCountAggregateOutputType | null
    _min: InventoryBalanceMinAggregateOutputType | null
    _max: InventoryBalanceMaxAggregateOutputType | null
  }

  export type InventoryBalanceMinAggregateOutputType = {
    balanceKey: string | null
    tenantId: string | null
    orgId: string | null
    warehouseId: string | null
    locationId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    uom: string | null
    onHandQuantity: string | null
    availableQuantity: string | null
    restrictedQuantity: string | null
    lastLedgerEntryId: string | null
    lastPostedAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryBalanceMaxAggregateOutputType = {
    balanceKey: string | null
    tenantId: string | null
    orgId: string | null
    warehouseId: string | null
    locationId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    uom: string | null
    onHandQuantity: string | null
    availableQuantity: string | null
    restrictedQuantity: string | null
    lastLedgerEntryId: string | null
    lastPostedAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryBalanceCountAggregateOutputType = {
    balanceKey: number
    tenantId: number
    orgId: number
    warehouseId: number
    locationId: number
    itemId: number
    itemCode: number
    itemName: number
    uom: number
    onHandQuantity: number
    availableQuantity: number
    restrictedQuantity: number
    restrictedQuantities: number
    lastLedgerEntryId: number
    lastPostedAt: number
    updatedAt: number
    _all: number
  }


  export type InventoryBalanceMinAggregateInputType = {
    balanceKey?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    uom?: true
    onHandQuantity?: true
    availableQuantity?: true
    restrictedQuantity?: true
    lastLedgerEntryId?: true
    lastPostedAt?: true
    updatedAt?: true
  }

  export type InventoryBalanceMaxAggregateInputType = {
    balanceKey?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    uom?: true
    onHandQuantity?: true
    availableQuantity?: true
    restrictedQuantity?: true
    lastLedgerEntryId?: true
    lastPostedAt?: true
    updatedAt?: true
  }

  export type InventoryBalanceCountAggregateInputType = {
    balanceKey?: true
    tenantId?: true
    orgId?: true
    warehouseId?: true
    locationId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    uom?: true
    onHandQuantity?: true
    availableQuantity?: true
    restrictedQuantity?: true
    restrictedQuantities?: true
    lastLedgerEntryId?: true
    lastPostedAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InventoryBalanceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryBalance to aggregate.
     */
    where?: InventoryBalanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBalances to fetch.
     */
    orderBy?: InventoryBalanceOrderByWithRelationInput | InventoryBalanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryBalanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBalances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBalances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryBalances
    **/
    _count?: true | InventoryBalanceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryBalanceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryBalanceMaxAggregateInputType
  }

  export type GetInventoryBalanceAggregateType<T extends InventoryBalanceAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryBalance]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryBalance[P]>
      : GetScalarType<T[P], AggregateInventoryBalance[P]>
  }




  export type InventoryBalanceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryBalanceWhereInput
    orderBy?: InventoryBalanceOrderByWithAggregationInput | InventoryBalanceOrderByWithAggregationInput[]
    by: InventoryBalanceScalarFieldEnum[] | InventoryBalanceScalarFieldEnum
    having?: InventoryBalanceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryBalanceCountAggregateInputType | true
    _min?: InventoryBalanceMinAggregateInputType
    _max?: InventoryBalanceMaxAggregateInputType
  }

  export type InventoryBalanceGroupByOutputType = {
    balanceKey: string
    tenantId: string
    orgId: string | null
    warehouseId: string
    locationId: string | null
    itemId: string
    itemCode: string | null
    itemName: string | null
    uom: string
    onHandQuantity: string
    availableQuantity: string
    restrictedQuantity: string
    restrictedQuantities: JsonValue
    lastLedgerEntryId: string
    lastPostedAt: Date
    updatedAt: Date
    _count: InventoryBalanceCountAggregateOutputType | null
    _min: InventoryBalanceMinAggregateOutputType | null
    _max: InventoryBalanceMaxAggregateOutputType | null
  }

  type GetInventoryBalanceGroupByPayload<T extends InventoryBalanceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryBalanceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryBalanceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryBalanceGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryBalanceGroupByOutputType[P]>
        }
      >
    >


  export type InventoryBalanceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    balanceKey?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    uom?: boolean
    onHandQuantity?: boolean
    availableQuantity?: boolean
    restrictedQuantity?: boolean
    restrictedQuantities?: boolean
    lastLedgerEntryId?: boolean
    lastPostedAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventoryBalance"]>

  export type InventoryBalanceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    balanceKey?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    uom?: boolean
    onHandQuantity?: boolean
    availableQuantity?: boolean
    restrictedQuantity?: boolean
    restrictedQuantities?: boolean
    lastLedgerEntryId?: boolean
    lastPostedAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventoryBalance"]>

  export type InventoryBalanceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    balanceKey?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    uom?: boolean
    onHandQuantity?: boolean
    availableQuantity?: boolean
    restrictedQuantity?: boolean
    restrictedQuantities?: boolean
    lastLedgerEntryId?: boolean
    lastPostedAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventoryBalance"]>

  export type InventoryBalanceSelectScalar = {
    balanceKey?: boolean
    tenantId?: boolean
    orgId?: boolean
    warehouseId?: boolean
    locationId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    uom?: boolean
    onHandQuantity?: boolean
    availableQuantity?: boolean
    restrictedQuantity?: boolean
    restrictedQuantities?: boolean
    lastLedgerEntryId?: boolean
    lastPostedAt?: boolean
    updatedAt?: boolean
  }

  export type InventoryBalanceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"balanceKey" | "tenantId" | "orgId" | "warehouseId" | "locationId" | "itemId" | "itemCode" | "itemName" | "uom" | "onHandQuantity" | "availableQuantity" | "restrictedQuantity" | "restrictedQuantities" | "lastLedgerEntryId" | "lastPostedAt" | "updatedAt", ExtArgs["result"]["inventoryBalance"]>

  export type $InventoryBalancePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryBalance"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      balanceKey: string
      tenantId: string
      orgId: string | null
      warehouseId: string
      locationId: string | null
      itemId: string
      itemCode: string | null
      itemName: string | null
      uom: string
      onHandQuantity: string
      availableQuantity: string
      restrictedQuantity: string
      restrictedQuantities: Prisma.JsonValue
      lastLedgerEntryId: string
      lastPostedAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["inventoryBalance"]>
    composites: {}
  }

  type InventoryBalanceGetPayload<S extends boolean | null | undefined | InventoryBalanceDefaultArgs> = $Result.GetResult<Prisma.$InventoryBalancePayload, S>

  type InventoryBalanceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InventoryBalanceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InventoryBalanceCountAggregateInputType | true
    }

  export interface InventoryBalanceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryBalance'], meta: { name: 'InventoryBalance' } }
    /**
     * Find zero or one InventoryBalance that matches the filter.
     * @param {InventoryBalanceFindUniqueArgs} args - Arguments to find a InventoryBalance
     * @example
     * // Get one InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryBalanceFindUniqueArgs>(args: SelectSubset<T, InventoryBalanceFindUniqueArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one InventoryBalance that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryBalanceFindUniqueOrThrowArgs} args - Arguments to find a InventoryBalance
     * @example
     * // Get one InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryBalanceFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryBalanceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first InventoryBalance that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceFindFirstArgs} args - Arguments to find a InventoryBalance
     * @example
     * // Get one InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryBalanceFindFirstArgs>(args?: SelectSubset<T, InventoryBalanceFindFirstArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first InventoryBalance that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceFindFirstOrThrowArgs} args - Arguments to find a InventoryBalance
     * @example
     * // Get one InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryBalanceFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryBalanceFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more InventoryBalances that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryBalances
     * const inventoryBalances = await prisma.inventoryBalance.findMany()
     * 
     * // Get first 10 InventoryBalances
     * const inventoryBalances = await prisma.inventoryBalance.findMany({ take: 10 })
     * 
     * // Only select the `balanceKey`
     * const inventoryBalanceWithBalanceKeyOnly = await prisma.inventoryBalance.findMany({ select: { balanceKey: true } })
     * 
     */
    findMany<T extends InventoryBalanceFindManyArgs>(args?: SelectSubset<T, InventoryBalanceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a InventoryBalance.
     * @param {InventoryBalanceCreateArgs} args - Arguments to create a InventoryBalance.
     * @example
     * // Create one InventoryBalance
     * const InventoryBalance = await prisma.inventoryBalance.create({
     *   data: {
     *     // ... data to create a InventoryBalance
     *   }
     * })
     * 
     */
    create<T extends InventoryBalanceCreateArgs>(args: SelectSubset<T, InventoryBalanceCreateArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many InventoryBalances.
     * @param {InventoryBalanceCreateManyArgs} args - Arguments to create many InventoryBalances.
     * @example
     * // Create many InventoryBalances
     * const inventoryBalance = await prisma.inventoryBalance.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryBalanceCreateManyArgs>(args?: SelectSubset<T, InventoryBalanceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryBalances and returns the data saved in the database.
     * @param {InventoryBalanceCreateManyAndReturnArgs} args - Arguments to create many InventoryBalances.
     * @example
     * // Create many InventoryBalances
     * const inventoryBalance = await prisma.inventoryBalance.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryBalances and only return the `balanceKey`
     * const inventoryBalanceWithBalanceKeyOnly = await prisma.inventoryBalance.createManyAndReturn({
     *   select: { balanceKey: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryBalanceCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryBalanceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a InventoryBalance.
     * @param {InventoryBalanceDeleteArgs} args - Arguments to delete one InventoryBalance.
     * @example
     * // Delete one InventoryBalance
     * const InventoryBalance = await prisma.inventoryBalance.delete({
     *   where: {
     *     // ... filter to delete one InventoryBalance
     *   }
     * })
     * 
     */
    delete<T extends InventoryBalanceDeleteArgs>(args: SelectSubset<T, InventoryBalanceDeleteArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one InventoryBalance.
     * @param {InventoryBalanceUpdateArgs} args - Arguments to update one InventoryBalance.
     * @example
     * // Update one InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryBalanceUpdateArgs>(args: SelectSubset<T, InventoryBalanceUpdateArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more InventoryBalances.
     * @param {InventoryBalanceDeleteManyArgs} args - Arguments to filter InventoryBalances to delete.
     * @example
     * // Delete a few InventoryBalances
     * const { count } = await prisma.inventoryBalance.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryBalanceDeleteManyArgs>(args?: SelectSubset<T, InventoryBalanceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryBalances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryBalances
     * const inventoryBalance = await prisma.inventoryBalance.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryBalanceUpdateManyArgs>(args: SelectSubset<T, InventoryBalanceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryBalances and returns the data updated in the database.
     * @param {InventoryBalanceUpdateManyAndReturnArgs} args - Arguments to update many InventoryBalances.
     * @example
     * // Update many InventoryBalances
     * const inventoryBalance = await prisma.inventoryBalance.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more InventoryBalances and only return the `balanceKey`
     * const inventoryBalanceWithBalanceKeyOnly = await prisma.inventoryBalance.updateManyAndReturn({
     *   select: { balanceKey: true },
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
    updateManyAndReturn<T extends InventoryBalanceUpdateManyAndReturnArgs>(args: SelectSubset<T, InventoryBalanceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one InventoryBalance.
     * @param {InventoryBalanceUpsertArgs} args - Arguments to update or create a InventoryBalance.
     * @example
     * // Update or create a InventoryBalance
     * const inventoryBalance = await prisma.inventoryBalance.upsert({
     *   create: {
     *     // ... data to create a InventoryBalance
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryBalance we want to update
     *   }
     * })
     */
    upsert<T extends InventoryBalanceUpsertArgs>(args: SelectSubset<T, InventoryBalanceUpsertArgs<ExtArgs>>): Prisma__InventoryBalanceClient<$Result.GetResult<Prisma.$InventoryBalancePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of InventoryBalances.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceCountArgs} args - Arguments to filter InventoryBalances to count.
     * @example
     * // Count the number of InventoryBalances
     * const count = await prisma.inventoryBalance.count({
     *   where: {
     *     // ... the filter for the InventoryBalances we want to count
     *   }
     * })
    **/
    count<T extends InventoryBalanceCountArgs>(
      args?: Subset<T, InventoryBalanceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryBalanceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryBalance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryBalanceAggregateArgs>(args: Subset<T, InventoryBalanceAggregateArgs>): Prisma.PrismaPromise<GetInventoryBalanceAggregateType<T>>

    /**
     * Group by InventoryBalance.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryBalanceGroupByArgs} args - Group by arguments.
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
      T extends InventoryBalanceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryBalanceGroupByArgs['orderBy'] }
        : { orderBy?: InventoryBalanceGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, InventoryBalanceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryBalanceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryBalance model
   */
  readonly fields: InventoryBalanceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryBalance.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryBalanceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the InventoryBalance model
   */ 
  interface InventoryBalanceFieldRefs {
    readonly balanceKey: FieldRef<"InventoryBalance", 'String'>
    readonly tenantId: FieldRef<"InventoryBalance", 'String'>
    readonly orgId: FieldRef<"InventoryBalance", 'String'>
    readonly warehouseId: FieldRef<"InventoryBalance", 'String'>
    readonly locationId: FieldRef<"InventoryBalance", 'String'>
    readonly itemId: FieldRef<"InventoryBalance", 'String'>
    readonly itemCode: FieldRef<"InventoryBalance", 'String'>
    readonly itemName: FieldRef<"InventoryBalance", 'String'>
    readonly uom: FieldRef<"InventoryBalance", 'String'>
    readonly onHandQuantity: FieldRef<"InventoryBalance", 'String'>
    readonly availableQuantity: FieldRef<"InventoryBalance", 'String'>
    readonly restrictedQuantity: FieldRef<"InventoryBalance", 'String'>
    readonly restrictedQuantities: FieldRef<"InventoryBalance", 'Json'>
    readonly lastLedgerEntryId: FieldRef<"InventoryBalance", 'String'>
    readonly lastPostedAt: FieldRef<"InventoryBalance", 'DateTime'>
    readonly updatedAt: FieldRef<"InventoryBalance", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InventoryBalance findUnique
   */
  export type InventoryBalanceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter, which InventoryBalance to fetch.
     */
    where: InventoryBalanceWhereUniqueInput
  }

  /**
   * InventoryBalance findUniqueOrThrow
   */
  export type InventoryBalanceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter, which InventoryBalance to fetch.
     */
    where: InventoryBalanceWhereUniqueInput
  }

  /**
   * InventoryBalance findFirst
   */
  export type InventoryBalanceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter, which InventoryBalance to fetch.
     */
    where?: InventoryBalanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBalances to fetch.
     */
    orderBy?: InventoryBalanceOrderByWithRelationInput | InventoryBalanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryBalances.
     */
    cursor?: InventoryBalanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBalances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBalances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryBalances.
     */
    distinct?: InventoryBalanceScalarFieldEnum | InventoryBalanceScalarFieldEnum[]
  }

  /**
   * InventoryBalance findFirstOrThrow
   */
  export type InventoryBalanceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter, which InventoryBalance to fetch.
     */
    where?: InventoryBalanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBalances to fetch.
     */
    orderBy?: InventoryBalanceOrderByWithRelationInput | InventoryBalanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryBalances.
     */
    cursor?: InventoryBalanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBalances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBalances.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryBalances.
     */
    distinct?: InventoryBalanceScalarFieldEnum | InventoryBalanceScalarFieldEnum[]
  }

  /**
   * InventoryBalance findMany
   */
  export type InventoryBalanceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter, which InventoryBalances to fetch.
     */
    where?: InventoryBalanceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryBalances to fetch.
     */
    orderBy?: InventoryBalanceOrderByWithRelationInput | InventoryBalanceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryBalances.
     */
    cursor?: InventoryBalanceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryBalances from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryBalances.
     */
    skip?: number
    distinct?: InventoryBalanceScalarFieldEnum | InventoryBalanceScalarFieldEnum[]
  }

  /**
   * InventoryBalance create
   */
  export type InventoryBalanceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * The data needed to create a InventoryBalance.
     */
    data: XOR<InventoryBalanceCreateInput, InventoryBalanceUncheckedCreateInput>
  }

  /**
   * InventoryBalance createMany
   */
  export type InventoryBalanceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryBalances.
     */
    data: InventoryBalanceCreateManyInput | InventoryBalanceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryBalance createManyAndReturn
   */
  export type InventoryBalanceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * The data used to create many InventoryBalances.
     */
    data: InventoryBalanceCreateManyInput | InventoryBalanceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryBalance update
   */
  export type InventoryBalanceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * The data needed to update a InventoryBalance.
     */
    data: XOR<InventoryBalanceUpdateInput, InventoryBalanceUncheckedUpdateInput>
    /**
     * Choose, which InventoryBalance to update.
     */
    where: InventoryBalanceWhereUniqueInput
  }

  /**
   * InventoryBalance updateMany
   */
  export type InventoryBalanceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryBalances.
     */
    data: XOR<InventoryBalanceUpdateManyMutationInput, InventoryBalanceUncheckedUpdateManyInput>
    /**
     * Filter which InventoryBalances to update
     */
    where?: InventoryBalanceWhereInput
    /**
     * Limit how many InventoryBalances to update.
     */
    limit?: number
  }

  /**
   * InventoryBalance updateManyAndReturn
   */
  export type InventoryBalanceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * The data used to update InventoryBalances.
     */
    data: XOR<InventoryBalanceUpdateManyMutationInput, InventoryBalanceUncheckedUpdateManyInput>
    /**
     * Filter which InventoryBalances to update
     */
    where?: InventoryBalanceWhereInput
    /**
     * Limit how many InventoryBalances to update.
     */
    limit?: number
  }

  /**
   * InventoryBalance upsert
   */
  export type InventoryBalanceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * The filter to search for the InventoryBalance to update in case it exists.
     */
    where: InventoryBalanceWhereUniqueInput
    /**
     * In case the InventoryBalance found by the `where` argument doesn't exist, create a new InventoryBalance with this data.
     */
    create: XOR<InventoryBalanceCreateInput, InventoryBalanceUncheckedCreateInput>
    /**
     * In case the InventoryBalance was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryBalanceUpdateInput, InventoryBalanceUncheckedUpdateInput>
  }

  /**
   * InventoryBalance delete
   */
  export type InventoryBalanceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
    /**
     * Filter which InventoryBalance to delete.
     */
    where: InventoryBalanceWhereUniqueInput
  }

  /**
   * InventoryBalance deleteMany
   */
  export type InventoryBalanceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryBalances to delete
     */
    where?: InventoryBalanceWhereInput
    /**
     * Limit how many InventoryBalances to delete.
     */
    limit?: number
  }

  /**
   * InventoryBalance without action
   */
  export type InventoryBalanceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryBalance
     */
    select?: InventoryBalanceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryBalance
     */
    omit?: InventoryBalanceOmit<ExtArgs> | null
  }


  /**
   * Model WmsAuditEnvelope
   */

  export type AggregateWmsAuditEnvelope = {
    _count: WmsAuditEnvelopeCountAggregateOutputType | null
    _min: WmsAuditEnvelopeMinAggregateOutputType | null
    _max: WmsAuditEnvelopeMaxAggregateOutputType | null
  }

  export type WmsAuditEnvelopeMinAggregateOutputType = {
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

  export type WmsAuditEnvelopeMaxAggregateOutputType = {
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

  export type WmsAuditEnvelopeCountAggregateOutputType = {
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


  export type WmsAuditEnvelopeMinAggregateInputType = {
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

  export type WmsAuditEnvelopeMaxAggregateInputType = {
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

  export type WmsAuditEnvelopeCountAggregateInputType = {
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

  export type WmsAuditEnvelopeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WmsAuditEnvelope to aggregate.
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsAuditEnvelopes to fetch.
     */
    orderBy?: WmsAuditEnvelopeOrderByWithRelationInput | WmsAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WmsAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WmsAuditEnvelopes
    **/
    _count?: true | WmsAuditEnvelopeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WmsAuditEnvelopeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WmsAuditEnvelopeMaxAggregateInputType
  }

  export type GetWmsAuditEnvelopeAggregateType<T extends WmsAuditEnvelopeAggregateArgs> = {
        [P in keyof T & keyof AggregateWmsAuditEnvelope]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWmsAuditEnvelope[P]>
      : GetScalarType<T[P], AggregateWmsAuditEnvelope[P]>
  }




  export type WmsAuditEnvelopeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WmsAuditEnvelopeWhereInput
    orderBy?: WmsAuditEnvelopeOrderByWithAggregationInput | WmsAuditEnvelopeOrderByWithAggregationInput[]
    by: WmsAuditEnvelopeScalarFieldEnum[] | WmsAuditEnvelopeScalarFieldEnum
    having?: WmsAuditEnvelopeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WmsAuditEnvelopeCountAggregateInputType | true
    _min?: WmsAuditEnvelopeMinAggregateInputType
    _max?: WmsAuditEnvelopeMaxAggregateInputType
  }

  export type WmsAuditEnvelopeGroupByOutputType = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date
    result: string
    operatorId: string | null
    operatorType: string | null
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string | null
    resourceId: string | null
    details: JsonValue
    createdAt: Date
    _count: WmsAuditEnvelopeCountAggregateOutputType | null
    _min: WmsAuditEnvelopeMinAggregateOutputType | null
    _max: WmsAuditEnvelopeMaxAggregateOutputType | null
  }

  type GetWmsAuditEnvelopeGroupByPayload<T extends WmsAuditEnvelopeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WmsAuditEnvelopeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WmsAuditEnvelopeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WmsAuditEnvelopeGroupByOutputType[P]>
            : GetScalarType<T[P], WmsAuditEnvelopeGroupByOutputType[P]>
        }
      >
    >


  export type WmsAuditEnvelopeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["wmsAuditEnvelope"]>

  export type WmsAuditEnvelopeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["wmsAuditEnvelope"]>

  export type WmsAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["wmsAuditEnvelope"]>

  export type WmsAuditEnvelopeSelectScalar = {
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

  export type WmsAuditEnvelopeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["wmsAuditEnvelope"]>

  export type $WmsAuditEnvelopePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WmsAuditEnvelope"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      service: string
      module: string
      eventType: string
      occurredAt: Date
      result: string
      operatorId: string | null
      operatorType: string | null
      tenantId: string | null
      orgId: string | null
      traceId: string | null
      resourceType: string | null
      resourceId: string | null
      details: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["wmsAuditEnvelope"]>
    composites: {}
  }

  type WmsAuditEnvelopeGetPayload<S extends boolean | null | undefined | WmsAuditEnvelopeDefaultArgs> = $Result.GetResult<Prisma.$WmsAuditEnvelopePayload, S>

  type WmsAuditEnvelopeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WmsAuditEnvelopeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WmsAuditEnvelopeCountAggregateInputType | true
    }

  export interface WmsAuditEnvelopeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WmsAuditEnvelope'], meta: { name: 'WmsAuditEnvelope' } }
    /**
     * Find zero or one WmsAuditEnvelope that matches the filter.
     * @param {WmsAuditEnvelopeFindUniqueArgs} args - Arguments to find a WmsAuditEnvelope
     * @example
     * // Get one WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WmsAuditEnvelopeFindUniqueArgs>(args: SelectSubset<T, WmsAuditEnvelopeFindUniqueArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one WmsAuditEnvelope that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WmsAuditEnvelopeFindUniqueOrThrowArgs} args - Arguments to find a WmsAuditEnvelope
     * @example
     * // Get one WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WmsAuditEnvelopeFindUniqueOrThrowArgs>(args: SelectSubset<T, WmsAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first WmsAuditEnvelope that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeFindFirstArgs} args - Arguments to find a WmsAuditEnvelope
     * @example
     * // Get one WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WmsAuditEnvelopeFindFirstArgs>(args?: SelectSubset<T, WmsAuditEnvelopeFindFirstArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first WmsAuditEnvelope that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeFindFirstOrThrowArgs} args - Arguments to find a WmsAuditEnvelope
     * @example
     * // Get one WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WmsAuditEnvelopeFindFirstOrThrowArgs>(args?: SelectSubset<T, WmsAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more WmsAuditEnvelopes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WmsAuditEnvelopes
     * const wmsAuditEnvelopes = await prisma.wmsAuditEnvelope.findMany()
     * 
     * // Get first 10 WmsAuditEnvelopes
     * const wmsAuditEnvelopes = await prisma.wmsAuditEnvelope.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const wmsAuditEnvelopeWithIdOnly = await prisma.wmsAuditEnvelope.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WmsAuditEnvelopeFindManyArgs>(args?: SelectSubset<T, WmsAuditEnvelopeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a WmsAuditEnvelope.
     * @param {WmsAuditEnvelopeCreateArgs} args - Arguments to create a WmsAuditEnvelope.
     * @example
     * // Create one WmsAuditEnvelope
     * const WmsAuditEnvelope = await prisma.wmsAuditEnvelope.create({
     *   data: {
     *     // ... data to create a WmsAuditEnvelope
     *   }
     * })
     * 
     */
    create<T extends WmsAuditEnvelopeCreateArgs>(args: SelectSubset<T, WmsAuditEnvelopeCreateArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many WmsAuditEnvelopes.
     * @param {WmsAuditEnvelopeCreateManyArgs} args - Arguments to create many WmsAuditEnvelopes.
     * @example
     * // Create many WmsAuditEnvelopes
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WmsAuditEnvelopeCreateManyArgs>(args?: SelectSubset<T, WmsAuditEnvelopeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WmsAuditEnvelopes and returns the data saved in the database.
     * @param {WmsAuditEnvelopeCreateManyAndReturnArgs} args - Arguments to create many WmsAuditEnvelopes.
     * @example
     * // Create many WmsAuditEnvelopes
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WmsAuditEnvelopes and only return the `id`
     * const wmsAuditEnvelopeWithIdOnly = await prisma.wmsAuditEnvelope.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WmsAuditEnvelopeCreateManyAndReturnArgs>(args?: SelectSubset<T, WmsAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a WmsAuditEnvelope.
     * @param {WmsAuditEnvelopeDeleteArgs} args - Arguments to delete one WmsAuditEnvelope.
     * @example
     * // Delete one WmsAuditEnvelope
     * const WmsAuditEnvelope = await prisma.wmsAuditEnvelope.delete({
     *   where: {
     *     // ... filter to delete one WmsAuditEnvelope
     *   }
     * })
     * 
     */
    delete<T extends WmsAuditEnvelopeDeleteArgs>(args: SelectSubset<T, WmsAuditEnvelopeDeleteArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one WmsAuditEnvelope.
     * @param {WmsAuditEnvelopeUpdateArgs} args - Arguments to update one WmsAuditEnvelope.
     * @example
     * // Update one WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WmsAuditEnvelopeUpdateArgs>(args: SelectSubset<T, WmsAuditEnvelopeUpdateArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more WmsAuditEnvelopes.
     * @param {WmsAuditEnvelopeDeleteManyArgs} args - Arguments to filter WmsAuditEnvelopes to delete.
     * @example
     * // Delete a few WmsAuditEnvelopes
     * const { count } = await prisma.wmsAuditEnvelope.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WmsAuditEnvelopeDeleteManyArgs>(args?: SelectSubset<T, WmsAuditEnvelopeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WmsAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WmsAuditEnvelopes
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WmsAuditEnvelopeUpdateManyArgs>(args: SelectSubset<T, WmsAuditEnvelopeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WmsAuditEnvelopes and returns the data updated in the database.
     * @param {WmsAuditEnvelopeUpdateManyAndReturnArgs} args - Arguments to update many WmsAuditEnvelopes.
     * @example
     * // Update many WmsAuditEnvelopes
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WmsAuditEnvelopes and only return the `id`
     * const wmsAuditEnvelopeWithIdOnly = await prisma.wmsAuditEnvelope.updateManyAndReturn({
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
    updateManyAndReturn<T extends WmsAuditEnvelopeUpdateManyAndReturnArgs>(args: SelectSubset<T, WmsAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one WmsAuditEnvelope.
     * @param {WmsAuditEnvelopeUpsertArgs} args - Arguments to update or create a WmsAuditEnvelope.
     * @example
     * // Update or create a WmsAuditEnvelope
     * const wmsAuditEnvelope = await prisma.wmsAuditEnvelope.upsert({
     *   create: {
     *     // ... data to create a WmsAuditEnvelope
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WmsAuditEnvelope we want to update
     *   }
     * })
     */
    upsert<T extends WmsAuditEnvelopeUpsertArgs>(args: SelectSubset<T, WmsAuditEnvelopeUpsertArgs<ExtArgs>>): Prisma__WmsAuditEnvelopeClient<$Result.GetResult<Prisma.$WmsAuditEnvelopePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of WmsAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeCountArgs} args - Arguments to filter WmsAuditEnvelopes to count.
     * @example
     * // Count the number of WmsAuditEnvelopes
     * const count = await prisma.wmsAuditEnvelope.count({
     *   where: {
     *     // ... the filter for the WmsAuditEnvelopes we want to count
     *   }
     * })
    **/
    count<T extends WmsAuditEnvelopeCountArgs>(
      args?: Subset<T, WmsAuditEnvelopeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WmsAuditEnvelopeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WmsAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends WmsAuditEnvelopeAggregateArgs>(args: Subset<T, WmsAuditEnvelopeAggregateArgs>): Prisma.PrismaPromise<GetWmsAuditEnvelopeAggregateType<T>>

    /**
     * Group by WmsAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WmsAuditEnvelopeGroupByArgs} args - Group by arguments.
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
      T extends WmsAuditEnvelopeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WmsAuditEnvelopeGroupByArgs['orderBy'] }
        : { orderBy?: WmsAuditEnvelopeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, WmsAuditEnvelopeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWmsAuditEnvelopeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WmsAuditEnvelope model
   */
  readonly fields: WmsAuditEnvelopeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WmsAuditEnvelope.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WmsAuditEnvelopeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the WmsAuditEnvelope model
   */ 
  interface WmsAuditEnvelopeFieldRefs {
    readonly id: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly service: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly module: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly eventType: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly occurredAt: FieldRef<"WmsAuditEnvelope", 'DateTime'>
    readonly result: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly operatorId: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly operatorType: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly tenantId: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly orgId: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly traceId: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly resourceType: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly resourceId: FieldRef<"WmsAuditEnvelope", 'String'>
    readonly details: FieldRef<"WmsAuditEnvelope", 'Json'>
    readonly createdAt: FieldRef<"WmsAuditEnvelope", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WmsAuditEnvelope findUnique
   */
  export type WmsAuditEnvelopeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which WmsAuditEnvelope to fetch.
     */
    where: WmsAuditEnvelopeWhereUniqueInput
  }

  /**
   * WmsAuditEnvelope findUniqueOrThrow
   */
  export type WmsAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which WmsAuditEnvelope to fetch.
     */
    where: WmsAuditEnvelopeWhereUniqueInput
  }

  /**
   * WmsAuditEnvelope findFirst
   */
  export type WmsAuditEnvelopeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which WmsAuditEnvelope to fetch.
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsAuditEnvelopes to fetch.
     */
    orderBy?: WmsAuditEnvelopeOrderByWithRelationInput | WmsAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WmsAuditEnvelopes.
     */
    cursor?: WmsAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WmsAuditEnvelopes.
     */
    distinct?: WmsAuditEnvelopeScalarFieldEnum | WmsAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * WmsAuditEnvelope findFirstOrThrow
   */
  export type WmsAuditEnvelopeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which WmsAuditEnvelope to fetch.
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsAuditEnvelopes to fetch.
     */
    orderBy?: WmsAuditEnvelopeOrderByWithRelationInput | WmsAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WmsAuditEnvelopes.
     */
    cursor?: WmsAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WmsAuditEnvelopes.
     */
    distinct?: WmsAuditEnvelopeScalarFieldEnum | WmsAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * WmsAuditEnvelope findMany
   */
  export type WmsAuditEnvelopeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which WmsAuditEnvelopes to fetch.
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WmsAuditEnvelopes to fetch.
     */
    orderBy?: WmsAuditEnvelopeOrderByWithRelationInput | WmsAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WmsAuditEnvelopes.
     */
    cursor?: WmsAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WmsAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WmsAuditEnvelopes.
     */
    skip?: number
    distinct?: WmsAuditEnvelopeScalarFieldEnum | WmsAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * WmsAuditEnvelope create
   */
  export type WmsAuditEnvelopeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to create a WmsAuditEnvelope.
     */
    data: XOR<WmsAuditEnvelopeCreateInput, WmsAuditEnvelopeUncheckedCreateInput>
  }

  /**
   * WmsAuditEnvelope createMany
   */
  export type WmsAuditEnvelopeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WmsAuditEnvelopes.
     */
    data: WmsAuditEnvelopeCreateManyInput | WmsAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WmsAuditEnvelope createManyAndReturn
   */
  export type WmsAuditEnvelopeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to create many WmsAuditEnvelopes.
     */
    data: WmsAuditEnvelopeCreateManyInput | WmsAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WmsAuditEnvelope update
   */
  export type WmsAuditEnvelopeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to update a WmsAuditEnvelope.
     */
    data: XOR<WmsAuditEnvelopeUpdateInput, WmsAuditEnvelopeUncheckedUpdateInput>
    /**
     * Choose, which WmsAuditEnvelope to update.
     */
    where: WmsAuditEnvelopeWhereUniqueInput
  }

  /**
   * WmsAuditEnvelope updateMany
   */
  export type WmsAuditEnvelopeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WmsAuditEnvelopes.
     */
    data: XOR<WmsAuditEnvelopeUpdateManyMutationInput, WmsAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which WmsAuditEnvelopes to update
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * Limit how many WmsAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * WmsAuditEnvelope updateManyAndReturn
   */
  export type WmsAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to update WmsAuditEnvelopes.
     */
    data: XOR<WmsAuditEnvelopeUpdateManyMutationInput, WmsAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which WmsAuditEnvelopes to update
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * Limit how many WmsAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * WmsAuditEnvelope upsert
   */
  export type WmsAuditEnvelopeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The filter to search for the WmsAuditEnvelope to update in case it exists.
     */
    where: WmsAuditEnvelopeWhereUniqueInput
    /**
     * In case the WmsAuditEnvelope found by the `where` argument doesn't exist, create a new WmsAuditEnvelope with this data.
     */
    create: XOR<WmsAuditEnvelopeCreateInput, WmsAuditEnvelopeUncheckedCreateInput>
    /**
     * In case the WmsAuditEnvelope was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WmsAuditEnvelopeUpdateInput, WmsAuditEnvelopeUncheckedUpdateInput>
  }

  /**
   * WmsAuditEnvelope delete
   */
  export type WmsAuditEnvelopeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter which WmsAuditEnvelope to delete.
     */
    where: WmsAuditEnvelopeWhereUniqueInput
  }

  /**
   * WmsAuditEnvelope deleteMany
   */
  export type WmsAuditEnvelopeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WmsAuditEnvelopes to delete
     */
    where?: WmsAuditEnvelopeWhereInput
    /**
     * Limit how many WmsAuditEnvelopes to delete.
     */
    limit?: number
  }

  /**
   * WmsAuditEnvelope without action
   */
  export type WmsAuditEnvelopeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WmsAuditEnvelope
     */
    select?: WmsAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WmsAuditEnvelope
     */
    omit?: WmsAuditEnvelopeOmit<ExtArgs> | null
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


  export const WmsSequenceCounterScalarFieldEnum: {
    tenantId: 'tenantId',
    nextReceiptNo: 'nextReceiptNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WmsSequenceCounterScalarFieldEnum = (typeof WmsSequenceCounterScalarFieldEnum)[keyof typeof WmsSequenceCounterScalarFieldEnum]


  export const WarehouseScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    orgId: 'orgId',
    warehouseCode: 'warehouseCode',
    warehouseName: 'warehouseName',
    warehouseScope: 'warehouseScope',
    status: 'status',
    defaultReceivingLocationId: 'defaultReceivingLocationId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type WarehouseScalarFieldEnum = (typeof WarehouseScalarFieldEnum)[keyof typeof WarehouseScalarFieldEnum]


  export const LocationScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    warehouseId: 'warehouseId',
    parentLocationId: 'parentLocationId',
    locationCode: 'locationCode',
    locationName: 'locationName',
    locationScope: 'locationScope',
    locationType: 'locationType',
    status: 'status',
    supportsReceipt: 'supportsReceipt',
    supportsStorage: 'supportsStorage',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LocationScalarFieldEnum = (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum]


  export const ReceiptScalarFieldEnum: {
    id: 'id',
    receiptNo: 'receiptNo',
    tenantId: 'tenantId',
    orgId: 'orgId',
    warehouseId: 'warehouseId',
    status: 'status',
    receiptSourceType: 'receiptSourceType',
    referencedReceivingExpectationIds: 'referencedReceivingExpectationIds',
    receiptDate: 'receiptDate',
    note: 'note',
    attachmentRefs: 'attachmentRefs',
    lineCount: 'lineCount',
    postedAt: 'postedAt',
    cancelledAt: 'cancelledAt',
    cancelReason: 'cancelReason',
    postComment: 'postComment',
    procurementReceiptSummary: 'procurementReceiptSummary',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReceiptScalarFieldEnum = (typeof ReceiptScalarFieldEnum)[keyof typeof ReceiptScalarFieldEnum]


  export const ReceiptLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    receiptId: 'receiptId',
    lineNo: 'lineNo',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    receivingExpectationId: 'receivingExpectationId',
    targetLocationId: 'targetLocationId',
    confirmedQuantity: 'confirmedQuantity',
    uom: 'uom',
    inventoryStatus: 'inventoryStatus',
    restrictedReason: 'restrictedReason',
    trackingRefs: 'trackingRefs',
    physicalDiscrepancy: 'physicalDiscrepancy',
    evidenceAttachmentRefs: 'evidenceAttachmentRefs',
    postedStockLedgerEntryIds: 'postedStockLedgerEntryIds',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReceiptLineScalarFieldEnum = (typeof ReceiptLineScalarFieldEnum)[keyof typeof ReceiptLineScalarFieldEnum]


  export const StockLedgerEntryScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    orgId: 'orgId',
    entryType: 'entryType',
    direction: 'direction',
    warehouseId: 'warehouseId',
    locationId: 'locationId',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    quantityDelta: 'quantityDelta',
    uom: 'uom',
    inventoryStatus: 'inventoryStatus',
    restrictedReason: 'restrictedReason',
    sourceDocumentType: 'sourceDocumentType',
    sourceDocumentId: 'sourceDocumentId',
    sourceDocumentLineId: 'sourceDocumentLineId',
    receivingExpectationId: 'receivingExpectationId',
    trackingRefs: 'trackingRefs',
    postedAt: 'postedAt'
  };

  export type StockLedgerEntryScalarFieldEnum = (typeof StockLedgerEntryScalarFieldEnum)[keyof typeof StockLedgerEntryScalarFieldEnum]


  export const InventoryBalanceScalarFieldEnum: {
    balanceKey: 'balanceKey',
    tenantId: 'tenantId',
    orgId: 'orgId',
    warehouseId: 'warehouseId',
    locationId: 'locationId',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    uom: 'uom',
    onHandQuantity: 'onHandQuantity',
    availableQuantity: 'availableQuantity',
    restrictedQuantity: 'restrictedQuantity',
    restrictedQuantities: 'restrictedQuantities',
    lastLedgerEntryId: 'lastLedgerEntryId',
    lastPostedAt: 'lastPostedAt',
    updatedAt: 'updatedAt'
  };

  export type InventoryBalanceScalarFieldEnum = (typeof InventoryBalanceScalarFieldEnum)[keyof typeof InventoryBalanceScalarFieldEnum]


  export const WmsAuditEnvelopeScalarFieldEnum: {
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

  export type WmsAuditEnvelopeScalarFieldEnum = (typeof WmsAuditEnvelopeScalarFieldEnum)[keyof typeof WmsAuditEnvelopeScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


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
   * Reference to a field of type 'WmsWarehouseScope'
   */
  export type EnumWmsWarehouseScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsWarehouseScope'>
    


  /**
   * Reference to a field of type 'WmsWarehouseScope[]'
   */
  export type ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsWarehouseScope[]'>
    


  /**
   * Reference to a field of type 'WmsWarehouseStatus'
   */
  export type EnumWmsWarehouseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsWarehouseStatus'>
    


  /**
   * Reference to a field of type 'WmsWarehouseStatus[]'
   */
  export type ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsWarehouseStatus[]'>
    


  /**
   * Reference to a field of type 'WmsLocationScope'
   */
  export type EnumWmsLocationScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationScope'>
    


  /**
   * Reference to a field of type 'WmsLocationScope[]'
   */
  export type ListEnumWmsLocationScopeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationScope[]'>
    


  /**
   * Reference to a field of type 'WmsLocationType'
   */
  export type EnumWmsLocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationType'>
    


  /**
   * Reference to a field of type 'WmsLocationType[]'
   */
  export type ListEnumWmsLocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationType[]'>
    


  /**
   * Reference to a field of type 'WmsLocationStatus'
   */
  export type EnumWmsLocationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationStatus'>
    


  /**
   * Reference to a field of type 'WmsLocationStatus[]'
   */
  export type ListEnumWmsLocationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsLocationStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'WmsReceiptStatus'
   */
  export type EnumWmsReceiptStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsReceiptStatus'>
    


  /**
   * Reference to a field of type 'WmsReceiptStatus[]'
   */
  export type ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsReceiptStatus[]'>
    


  /**
   * Reference to a field of type 'WmsReceiptSourceType'
   */
  export type EnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsReceiptSourceType'>
    


  /**
   * Reference to a field of type 'WmsReceiptSourceType[]'
   */
  export type ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsReceiptSourceType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'WmsInventoryStatus'
   */
  export type EnumWmsInventoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsInventoryStatus'>
    


  /**
   * Reference to a field of type 'WmsInventoryStatus[]'
   */
  export type ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsInventoryStatus[]'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerEntryType'
   */
  export type EnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerEntryType'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerEntryType[]'
   */
  export type ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerEntryType[]'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerDirection'
   */
  export type EnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerDirection'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerDirection[]'
   */
  export type ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerDirection[]'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerSourceDocumentType'
   */
  export type EnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerSourceDocumentType'>
    


  /**
   * Reference to a field of type 'WmsStockLedgerSourceDocumentType[]'
   */
  export type ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'WmsStockLedgerSourceDocumentType[]'>
    


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


  export type WmsSequenceCounterWhereInput = {
    AND?: WmsSequenceCounterWhereInput | WmsSequenceCounterWhereInput[]
    OR?: WmsSequenceCounterWhereInput[]
    NOT?: WmsSequenceCounterWhereInput | WmsSequenceCounterWhereInput[]
    tenantId?: StringFilter<"WmsSequenceCounter"> | string
    nextReceiptNo?: IntFilter<"WmsSequenceCounter"> | number
    createdAt?: DateTimeFilter<"WmsSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"WmsSequenceCounter"> | Date | string
  }

  export type WmsSequenceCounterOrderByWithRelationInput = {
    tenantId?: SortOrder
    nextReceiptNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WmsSequenceCounterWhereUniqueInput = Prisma.AtLeast<{
    tenantId?: string
    AND?: WmsSequenceCounterWhereInput | WmsSequenceCounterWhereInput[]
    OR?: WmsSequenceCounterWhereInput[]
    NOT?: WmsSequenceCounterWhereInput | WmsSequenceCounterWhereInput[]
    nextReceiptNo?: IntFilter<"WmsSequenceCounter"> | number
    createdAt?: DateTimeFilter<"WmsSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"WmsSequenceCounter"> | Date | string
  }, "tenantId">

  export type WmsSequenceCounterOrderByWithAggregationInput = {
    tenantId?: SortOrder
    nextReceiptNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WmsSequenceCounterCountOrderByAggregateInput
    _avg?: WmsSequenceCounterAvgOrderByAggregateInput
    _max?: WmsSequenceCounterMaxOrderByAggregateInput
    _min?: WmsSequenceCounterMinOrderByAggregateInput
    _sum?: WmsSequenceCounterSumOrderByAggregateInput
  }

  export type WmsSequenceCounterScalarWhereWithAggregatesInput = {
    AND?: WmsSequenceCounterScalarWhereWithAggregatesInput | WmsSequenceCounterScalarWhereWithAggregatesInput[]
    OR?: WmsSequenceCounterScalarWhereWithAggregatesInput[]
    NOT?: WmsSequenceCounterScalarWhereWithAggregatesInput | WmsSequenceCounterScalarWhereWithAggregatesInput[]
    tenantId?: StringWithAggregatesFilter<"WmsSequenceCounter"> | string
    nextReceiptNo?: IntWithAggregatesFilter<"WmsSequenceCounter"> | number
    createdAt?: DateTimeWithAggregatesFilter<"WmsSequenceCounter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"WmsSequenceCounter"> | Date | string
  }

  export type WarehouseWhereInput = {
    AND?: WarehouseWhereInput | WarehouseWhereInput[]
    OR?: WarehouseWhereInput[]
    NOT?: WarehouseWhereInput | WarehouseWhereInput[]
    id?: StringFilter<"Warehouse"> | string
    tenantId?: StringFilter<"Warehouse"> | string
    orgId?: StringNullableFilter<"Warehouse"> | string | null
    warehouseCode?: StringFilter<"Warehouse"> | string
    warehouseName?: StringFilter<"Warehouse"> | string
    warehouseScope?: EnumWmsWarehouseScopeFilter<"Warehouse"> | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFilter<"Warehouse"> | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: StringNullableFilter<"Warehouse"> | string | null
    createdAt?: DateTimeFilter<"Warehouse"> | Date | string
    updatedAt?: DateTimeFilter<"Warehouse"> | Date | string
  }

  export type WarehouseOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseCode?: SortOrder
    warehouseName?: SortOrder
    warehouseScope?: SortOrder
    status?: SortOrder
    defaultReceivingLocationId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WarehouseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_warehouseCode?: WarehouseTenantIdWarehouseCodeCompoundUniqueInput
    AND?: WarehouseWhereInput | WarehouseWhereInput[]
    OR?: WarehouseWhereInput[]
    NOT?: WarehouseWhereInput | WarehouseWhereInput[]
    tenantId?: StringFilter<"Warehouse"> | string
    orgId?: StringNullableFilter<"Warehouse"> | string | null
    warehouseCode?: StringFilter<"Warehouse"> | string
    warehouseName?: StringFilter<"Warehouse"> | string
    warehouseScope?: EnumWmsWarehouseScopeFilter<"Warehouse"> | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFilter<"Warehouse"> | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: StringNullableFilter<"Warehouse"> | string | null
    createdAt?: DateTimeFilter<"Warehouse"> | Date | string
    updatedAt?: DateTimeFilter<"Warehouse"> | Date | string
  }, "id" | "tenantId_warehouseCode">

  export type WarehouseOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseCode?: SortOrder
    warehouseName?: SortOrder
    warehouseScope?: SortOrder
    status?: SortOrder
    defaultReceivingLocationId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: WarehouseCountOrderByAggregateInput
    _max?: WarehouseMaxOrderByAggregateInput
    _min?: WarehouseMinOrderByAggregateInput
  }

  export type WarehouseScalarWhereWithAggregatesInput = {
    AND?: WarehouseScalarWhereWithAggregatesInput | WarehouseScalarWhereWithAggregatesInput[]
    OR?: WarehouseScalarWhereWithAggregatesInput[]
    NOT?: WarehouseScalarWhereWithAggregatesInput | WarehouseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Warehouse"> | string
    tenantId?: StringWithAggregatesFilter<"Warehouse"> | string
    orgId?: StringNullableWithAggregatesFilter<"Warehouse"> | string | null
    warehouseCode?: StringWithAggregatesFilter<"Warehouse"> | string
    warehouseName?: StringWithAggregatesFilter<"Warehouse"> | string
    warehouseScope?: EnumWmsWarehouseScopeWithAggregatesFilter<"Warehouse"> | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusWithAggregatesFilter<"Warehouse"> | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: StringNullableWithAggregatesFilter<"Warehouse"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Warehouse"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Warehouse"> | Date | string
  }

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    id?: StringFilter<"Location"> | string
    tenantId?: StringFilter<"Location"> | string
    warehouseId?: StringFilter<"Location"> | string
    parentLocationId?: StringNullableFilter<"Location"> | string | null
    locationCode?: StringFilter<"Location"> | string
    locationName?: StringFilter<"Location"> | string
    locationScope?: EnumWmsLocationScopeFilter<"Location"> | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFilter<"Location"> | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFilter<"Location"> | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFilter<"Location"> | boolean
    supportsStorage?: BoolFilter<"Location"> | boolean
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
  }

  export type LocationOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    warehouseId?: SortOrder
    parentLocationId?: SortOrderInput | SortOrder
    locationCode?: SortOrder
    locationName?: SortOrder
    locationScope?: SortOrder
    locationType?: SortOrder
    status?: SortOrder
    supportsReceipt?: SortOrder
    supportsStorage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    warehouseId_locationCode?: LocationWarehouseIdLocationCodeCompoundUniqueInput
    AND?: LocationWhereInput | LocationWhereInput[]
    OR?: LocationWhereInput[]
    NOT?: LocationWhereInput | LocationWhereInput[]
    tenantId?: StringFilter<"Location"> | string
    warehouseId?: StringFilter<"Location"> | string
    parentLocationId?: StringNullableFilter<"Location"> | string | null
    locationCode?: StringFilter<"Location"> | string
    locationName?: StringFilter<"Location"> | string
    locationScope?: EnumWmsLocationScopeFilter<"Location"> | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFilter<"Location"> | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFilter<"Location"> | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFilter<"Location"> | boolean
    supportsStorage?: BoolFilter<"Location"> | boolean
    createdAt?: DateTimeFilter<"Location"> | Date | string
    updatedAt?: DateTimeFilter<"Location"> | Date | string
  }, "id" | "warehouseId_locationCode">

  export type LocationOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    warehouseId?: SortOrder
    parentLocationId?: SortOrderInput | SortOrder
    locationCode?: SortOrder
    locationName?: SortOrder
    locationScope?: SortOrder
    locationType?: SortOrder
    status?: SortOrder
    supportsReceipt?: SortOrder
    supportsStorage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LocationCountOrderByAggregateInput
    _max?: LocationMaxOrderByAggregateInput
    _min?: LocationMinOrderByAggregateInput
  }

  export type LocationScalarWhereWithAggregatesInput = {
    AND?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    OR?: LocationScalarWhereWithAggregatesInput[]
    NOT?: LocationScalarWhereWithAggregatesInput | LocationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Location"> | string
    tenantId?: StringWithAggregatesFilter<"Location"> | string
    warehouseId?: StringWithAggregatesFilter<"Location"> | string
    parentLocationId?: StringNullableWithAggregatesFilter<"Location"> | string | null
    locationCode?: StringWithAggregatesFilter<"Location"> | string
    locationName?: StringWithAggregatesFilter<"Location"> | string
    locationScope?: EnumWmsLocationScopeWithAggregatesFilter<"Location"> | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeWithAggregatesFilter<"Location"> | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusWithAggregatesFilter<"Location"> | $Enums.WmsLocationStatus
    supportsReceipt?: BoolWithAggregatesFilter<"Location"> | boolean
    supportsStorage?: BoolWithAggregatesFilter<"Location"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Location"> | Date | string
  }

  export type ReceiptWhereInput = {
    AND?: ReceiptWhereInput | ReceiptWhereInput[]
    OR?: ReceiptWhereInput[]
    NOT?: ReceiptWhereInput | ReceiptWhereInput[]
    id?: StringFilter<"Receipt"> | string
    receiptNo?: StringFilter<"Receipt"> | string
    tenantId?: StringFilter<"Receipt"> | string
    orgId?: StringNullableFilter<"Receipt"> | string | null
    warehouseId?: StringFilter<"Receipt"> | string
    status?: EnumWmsReceiptStatusFilter<"Receipt"> | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFilter<"Receipt"> | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonFilter<"Receipt">
    receiptDate?: StringFilter<"Receipt"> | string
    note?: StringNullableFilter<"Receipt"> | string | null
    attachmentRefs?: JsonFilter<"Receipt">
    lineCount?: IntFilter<"Receipt"> | number
    postedAt?: DateTimeNullableFilter<"Receipt"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Receipt"> | Date | string | null
    cancelReason?: StringNullableFilter<"Receipt"> | string | null
    postComment?: StringNullableFilter<"Receipt"> | string | null
    procurementReceiptSummary?: JsonNullableFilter<"Receipt">
    createdAt?: DateTimeFilter<"Receipt"> | Date | string
    updatedAt?: DateTimeFilter<"Receipt"> | Date | string
    lines?: ReceiptLineListRelationFilter
  }

  export type ReceiptOrderByWithRelationInput = {
    id?: SortOrder
    receiptNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseId?: SortOrder
    status?: SortOrder
    receiptSourceType?: SortOrder
    referencedReceivingExpectationIds?: SortOrder
    receiptDate?: SortOrder
    note?: SortOrderInput | SortOrder
    attachmentRefs?: SortOrder
    lineCount?: SortOrder
    postedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    postComment?: SortOrderInput | SortOrder
    procurementReceiptSummary?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lines?: ReceiptLineOrderByRelationAggregateInput
  }

  export type ReceiptWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    receiptNo?: string
    AND?: ReceiptWhereInput | ReceiptWhereInput[]
    OR?: ReceiptWhereInput[]
    NOT?: ReceiptWhereInput | ReceiptWhereInput[]
    tenantId?: StringFilter<"Receipt"> | string
    orgId?: StringNullableFilter<"Receipt"> | string | null
    warehouseId?: StringFilter<"Receipt"> | string
    status?: EnumWmsReceiptStatusFilter<"Receipt"> | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFilter<"Receipt"> | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonFilter<"Receipt">
    receiptDate?: StringFilter<"Receipt"> | string
    note?: StringNullableFilter<"Receipt"> | string | null
    attachmentRefs?: JsonFilter<"Receipt">
    lineCount?: IntFilter<"Receipt"> | number
    postedAt?: DateTimeNullableFilter<"Receipt"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Receipt"> | Date | string | null
    cancelReason?: StringNullableFilter<"Receipt"> | string | null
    postComment?: StringNullableFilter<"Receipt"> | string | null
    procurementReceiptSummary?: JsonNullableFilter<"Receipt">
    createdAt?: DateTimeFilter<"Receipt"> | Date | string
    updatedAt?: DateTimeFilter<"Receipt"> | Date | string
    lines?: ReceiptLineListRelationFilter
  }, "id" | "receiptNo">

  export type ReceiptOrderByWithAggregationInput = {
    id?: SortOrder
    receiptNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseId?: SortOrder
    status?: SortOrder
    receiptSourceType?: SortOrder
    referencedReceivingExpectationIds?: SortOrder
    receiptDate?: SortOrder
    note?: SortOrderInput | SortOrder
    attachmentRefs?: SortOrder
    lineCount?: SortOrder
    postedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    postComment?: SortOrderInput | SortOrder
    procurementReceiptSummary?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReceiptCountOrderByAggregateInput
    _avg?: ReceiptAvgOrderByAggregateInput
    _max?: ReceiptMaxOrderByAggregateInput
    _min?: ReceiptMinOrderByAggregateInput
    _sum?: ReceiptSumOrderByAggregateInput
  }

  export type ReceiptScalarWhereWithAggregatesInput = {
    AND?: ReceiptScalarWhereWithAggregatesInput | ReceiptScalarWhereWithAggregatesInput[]
    OR?: ReceiptScalarWhereWithAggregatesInput[]
    NOT?: ReceiptScalarWhereWithAggregatesInput | ReceiptScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Receipt"> | string
    receiptNo?: StringWithAggregatesFilter<"Receipt"> | string
    tenantId?: StringWithAggregatesFilter<"Receipt"> | string
    orgId?: StringNullableWithAggregatesFilter<"Receipt"> | string | null
    warehouseId?: StringWithAggregatesFilter<"Receipt"> | string
    status?: EnumWmsReceiptStatusWithAggregatesFilter<"Receipt"> | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeWithAggregatesFilter<"Receipt"> | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonWithAggregatesFilter<"Receipt">
    receiptDate?: StringWithAggregatesFilter<"Receipt"> | string
    note?: StringNullableWithAggregatesFilter<"Receipt"> | string | null
    attachmentRefs?: JsonWithAggregatesFilter<"Receipt">
    lineCount?: IntWithAggregatesFilter<"Receipt"> | number
    postedAt?: DateTimeNullableWithAggregatesFilter<"Receipt"> | Date | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"Receipt"> | Date | string | null
    cancelReason?: StringNullableWithAggregatesFilter<"Receipt"> | string | null
    postComment?: StringNullableWithAggregatesFilter<"Receipt"> | string | null
    procurementReceiptSummary?: JsonNullableWithAggregatesFilter<"Receipt">
    createdAt?: DateTimeWithAggregatesFilter<"Receipt"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Receipt"> | Date | string
  }

  export type ReceiptLineWhereInput = {
    AND?: ReceiptLineWhereInput | ReceiptLineWhereInput[]
    OR?: ReceiptLineWhereInput[]
    NOT?: ReceiptLineWhereInput | ReceiptLineWhereInput[]
    id?: StringFilter<"ReceiptLine"> | string
    tenantId?: StringFilter<"ReceiptLine"> | string
    receiptId?: StringFilter<"ReceiptLine"> | string
    lineNo?: IntFilter<"ReceiptLine"> | number
    itemId?: StringFilter<"ReceiptLine"> | string
    itemCode?: StringNullableFilter<"ReceiptLine"> | string | null
    itemName?: StringNullableFilter<"ReceiptLine"> | string | null
    receivingExpectationId?: StringNullableFilter<"ReceiptLine"> | string | null
    targetLocationId?: StringFilter<"ReceiptLine"> | string
    confirmedQuantity?: StringFilter<"ReceiptLine"> | string
    uom?: StringFilter<"ReceiptLine"> | string
    inventoryStatus?: EnumWmsInventoryStatusFilter<"ReceiptLine"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableFilter<"ReceiptLine">
    trackingRefs?: JsonFilter<"ReceiptLine">
    physicalDiscrepancy?: JsonNullableFilter<"ReceiptLine">
    evidenceAttachmentRefs?: JsonFilter<"ReceiptLine">
    postedStockLedgerEntryIds?: JsonFilter<"ReceiptLine">
    createdAt?: DateTimeFilter<"ReceiptLine"> | Date | string
    updatedAt?: DateTimeFilter<"ReceiptLine"> | Date | string
    receipt?: XOR<ReceiptScalarRelationFilter, ReceiptWhereInput>
  }

  export type ReceiptLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receiptId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    receivingExpectationId?: SortOrderInput | SortOrder
    targetLocationId?: SortOrder
    confirmedQuantity?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrderInput | SortOrder
    trackingRefs?: SortOrder
    physicalDiscrepancy?: SortOrderInput | SortOrder
    evidenceAttachmentRefs?: SortOrder
    postedStockLedgerEntryIds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    receipt?: ReceiptOrderByWithRelationInput
  }

  export type ReceiptLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    receiptId_lineNo?: ReceiptLineReceiptIdLineNoCompoundUniqueInput
    AND?: ReceiptLineWhereInput | ReceiptLineWhereInput[]
    OR?: ReceiptLineWhereInput[]
    NOT?: ReceiptLineWhereInput | ReceiptLineWhereInput[]
    tenantId?: StringFilter<"ReceiptLine"> | string
    receiptId?: StringFilter<"ReceiptLine"> | string
    lineNo?: IntFilter<"ReceiptLine"> | number
    itemId?: StringFilter<"ReceiptLine"> | string
    itemCode?: StringNullableFilter<"ReceiptLine"> | string | null
    itemName?: StringNullableFilter<"ReceiptLine"> | string | null
    receivingExpectationId?: StringNullableFilter<"ReceiptLine"> | string | null
    targetLocationId?: StringFilter<"ReceiptLine"> | string
    confirmedQuantity?: StringFilter<"ReceiptLine"> | string
    uom?: StringFilter<"ReceiptLine"> | string
    inventoryStatus?: EnumWmsInventoryStatusFilter<"ReceiptLine"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableFilter<"ReceiptLine">
    trackingRefs?: JsonFilter<"ReceiptLine">
    physicalDiscrepancy?: JsonNullableFilter<"ReceiptLine">
    evidenceAttachmentRefs?: JsonFilter<"ReceiptLine">
    postedStockLedgerEntryIds?: JsonFilter<"ReceiptLine">
    createdAt?: DateTimeFilter<"ReceiptLine"> | Date | string
    updatedAt?: DateTimeFilter<"ReceiptLine"> | Date | string
    receipt?: XOR<ReceiptScalarRelationFilter, ReceiptWhereInput>
  }, "id" | "receiptId_lineNo">

  export type ReceiptLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receiptId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    receivingExpectationId?: SortOrderInput | SortOrder
    targetLocationId?: SortOrder
    confirmedQuantity?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrderInput | SortOrder
    trackingRefs?: SortOrder
    physicalDiscrepancy?: SortOrderInput | SortOrder
    evidenceAttachmentRefs?: SortOrder
    postedStockLedgerEntryIds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReceiptLineCountOrderByAggregateInput
    _avg?: ReceiptLineAvgOrderByAggregateInput
    _max?: ReceiptLineMaxOrderByAggregateInput
    _min?: ReceiptLineMinOrderByAggregateInput
    _sum?: ReceiptLineSumOrderByAggregateInput
  }

  export type ReceiptLineScalarWhereWithAggregatesInput = {
    AND?: ReceiptLineScalarWhereWithAggregatesInput | ReceiptLineScalarWhereWithAggregatesInput[]
    OR?: ReceiptLineScalarWhereWithAggregatesInput[]
    NOT?: ReceiptLineScalarWhereWithAggregatesInput | ReceiptLineScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReceiptLine"> | string
    tenantId?: StringWithAggregatesFilter<"ReceiptLine"> | string
    receiptId?: StringWithAggregatesFilter<"ReceiptLine"> | string
    lineNo?: IntWithAggregatesFilter<"ReceiptLine"> | number
    itemId?: StringWithAggregatesFilter<"ReceiptLine"> | string
    itemCode?: StringNullableWithAggregatesFilter<"ReceiptLine"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"ReceiptLine"> | string | null
    receivingExpectationId?: StringNullableWithAggregatesFilter<"ReceiptLine"> | string | null
    targetLocationId?: StringWithAggregatesFilter<"ReceiptLine"> | string
    confirmedQuantity?: StringWithAggregatesFilter<"ReceiptLine"> | string
    uom?: StringWithAggregatesFilter<"ReceiptLine"> | string
    inventoryStatus?: EnumWmsInventoryStatusWithAggregatesFilter<"ReceiptLine"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableWithAggregatesFilter<"ReceiptLine">
    trackingRefs?: JsonWithAggregatesFilter<"ReceiptLine">
    physicalDiscrepancy?: JsonNullableWithAggregatesFilter<"ReceiptLine">
    evidenceAttachmentRefs?: JsonWithAggregatesFilter<"ReceiptLine">
    postedStockLedgerEntryIds?: JsonWithAggregatesFilter<"ReceiptLine">
    createdAt?: DateTimeWithAggregatesFilter<"ReceiptLine"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReceiptLine"> | Date | string
  }

  export type StockLedgerEntryWhereInput = {
    AND?: StockLedgerEntryWhereInput | StockLedgerEntryWhereInput[]
    OR?: StockLedgerEntryWhereInput[]
    NOT?: StockLedgerEntryWhereInput | StockLedgerEntryWhereInput[]
    id?: StringFilter<"StockLedgerEntry"> | string
    tenantId?: StringFilter<"StockLedgerEntry"> | string
    orgId?: StringNullableFilter<"StockLedgerEntry"> | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFilter<"StockLedgerEntry"> | string
    locationId?: StringFilter<"StockLedgerEntry"> | string
    itemId?: StringFilter<"StockLedgerEntry"> | string
    itemCode?: StringNullableFilter<"StockLedgerEntry"> | string | null
    itemName?: StringNullableFilter<"StockLedgerEntry"> | string | null
    quantityDelta?: StringFilter<"StockLedgerEntry"> | string
    uom?: StringFilter<"StockLedgerEntry"> | string
    inventoryStatus?: EnumWmsInventoryStatusFilter<"StockLedgerEntry"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableFilter<"StockLedgerEntry">
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFilter<"StockLedgerEntry"> | string
    sourceDocumentLineId?: StringFilter<"StockLedgerEntry"> | string
    receivingExpectationId?: StringNullableFilter<"StockLedgerEntry"> | string | null
    trackingRefs?: JsonFilter<"StockLedgerEntry">
    postedAt?: DateTimeFilter<"StockLedgerEntry"> | Date | string
  }

  export type StockLedgerEntryOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    entryType?: SortOrder
    direction?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    quantityDelta?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrderInput | SortOrder
    sourceDocumentType?: SortOrder
    sourceDocumentId?: SortOrder
    sourceDocumentLineId?: SortOrder
    receivingExpectationId?: SortOrderInput | SortOrder
    trackingRefs?: SortOrder
    postedAt?: SortOrder
  }

  export type StockLedgerEntryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: StockLedgerEntryWhereInput | StockLedgerEntryWhereInput[]
    OR?: StockLedgerEntryWhereInput[]
    NOT?: StockLedgerEntryWhereInput | StockLedgerEntryWhereInput[]
    tenantId?: StringFilter<"StockLedgerEntry"> | string
    orgId?: StringNullableFilter<"StockLedgerEntry"> | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFilter<"StockLedgerEntry"> | string
    locationId?: StringFilter<"StockLedgerEntry"> | string
    itemId?: StringFilter<"StockLedgerEntry"> | string
    itemCode?: StringNullableFilter<"StockLedgerEntry"> | string | null
    itemName?: StringNullableFilter<"StockLedgerEntry"> | string | null
    quantityDelta?: StringFilter<"StockLedgerEntry"> | string
    uom?: StringFilter<"StockLedgerEntry"> | string
    inventoryStatus?: EnumWmsInventoryStatusFilter<"StockLedgerEntry"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableFilter<"StockLedgerEntry">
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFilter<"StockLedgerEntry"> | string
    sourceDocumentLineId?: StringFilter<"StockLedgerEntry"> | string
    receivingExpectationId?: StringNullableFilter<"StockLedgerEntry"> | string | null
    trackingRefs?: JsonFilter<"StockLedgerEntry">
    postedAt?: DateTimeFilter<"StockLedgerEntry"> | Date | string
  }, "id">

  export type StockLedgerEntryOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    entryType?: SortOrder
    direction?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    quantityDelta?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrderInput | SortOrder
    sourceDocumentType?: SortOrder
    sourceDocumentId?: SortOrder
    sourceDocumentLineId?: SortOrder
    receivingExpectationId?: SortOrderInput | SortOrder
    trackingRefs?: SortOrder
    postedAt?: SortOrder
    _count?: StockLedgerEntryCountOrderByAggregateInput
    _max?: StockLedgerEntryMaxOrderByAggregateInput
    _min?: StockLedgerEntryMinOrderByAggregateInput
  }

  export type StockLedgerEntryScalarWhereWithAggregatesInput = {
    AND?: StockLedgerEntryScalarWhereWithAggregatesInput | StockLedgerEntryScalarWhereWithAggregatesInput[]
    OR?: StockLedgerEntryScalarWhereWithAggregatesInput[]
    NOT?: StockLedgerEntryScalarWhereWithAggregatesInput | StockLedgerEntryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    tenantId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    orgId?: StringNullableWithAggregatesFilter<"StockLedgerEntry"> | string | null
    entryType?: EnumWmsStockLedgerEntryTypeWithAggregatesFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionWithAggregatesFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerDirection
    warehouseId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    locationId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    itemId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    itemCode?: StringNullableWithAggregatesFilter<"StockLedgerEntry"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"StockLedgerEntry"> | string | null
    quantityDelta?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    uom?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    inventoryStatus?: EnumWmsInventoryStatusWithAggregatesFilter<"StockLedgerEntry"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableWithAggregatesFilter<"StockLedgerEntry">
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeWithAggregatesFilter<"StockLedgerEntry"> | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    sourceDocumentLineId?: StringWithAggregatesFilter<"StockLedgerEntry"> | string
    receivingExpectationId?: StringNullableWithAggregatesFilter<"StockLedgerEntry"> | string | null
    trackingRefs?: JsonWithAggregatesFilter<"StockLedgerEntry">
    postedAt?: DateTimeWithAggregatesFilter<"StockLedgerEntry"> | Date | string
  }

  export type InventoryBalanceWhereInput = {
    AND?: InventoryBalanceWhereInput | InventoryBalanceWhereInput[]
    OR?: InventoryBalanceWhereInput[]
    NOT?: InventoryBalanceWhereInput | InventoryBalanceWhereInput[]
    balanceKey?: StringFilter<"InventoryBalance"> | string
    tenantId?: StringFilter<"InventoryBalance"> | string
    orgId?: StringNullableFilter<"InventoryBalance"> | string | null
    warehouseId?: StringFilter<"InventoryBalance"> | string
    locationId?: StringNullableFilter<"InventoryBalance"> | string | null
    itemId?: StringFilter<"InventoryBalance"> | string
    itemCode?: StringNullableFilter<"InventoryBalance"> | string | null
    itemName?: StringNullableFilter<"InventoryBalance"> | string | null
    uom?: StringFilter<"InventoryBalance"> | string
    onHandQuantity?: StringFilter<"InventoryBalance"> | string
    availableQuantity?: StringFilter<"InventoryBalance"> | string
    restrictedQuantity?: StringFilter<"InventoryBalance"> | string
    restrictedQuantities?: JsonFilter<"InventoryBalance">
    lastLedgerEntryId?: StringFilter<"InventoryBalance"> | string
    lastPostedAt?: DateTimeFilter<"InventoryBalance"> | Date | string
    updatedAt?: DateTimeFilter<"InventoryBalance"> | Date | string
  }

  export type InventoryBalanceOrderByWithRelationInput = {
    balanceKey?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrderInput | SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    uom?: SortOrder
    onHandQuantity?: SortOrder
    availableQuantity?: SortOrder
    restrictedQuantity?: SortOrder
    restrictedQuantities?: SortOrder
    lastLedgerEntryId?: SortOrder
    lastPostedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryBalanceWhereUniqueInput = Prisma.AtLeast<{
    balanceKey?: string
    AND?: InventoryBalanceWhereInput | InventoryBalanceWhereInput[]
    OR?: InventoryBalanceWhereInput[]
    NOT?: InventoryBalanceWhereInput | InventoryBalanceWhereInput[]
    tenantId?: StringFilter<"InventoryBalance"> | string
    orgId?: StringNullableFilter<"InventoryBalance"> | string | null
    warehouseId?: StringFilter<"InventoryBalance"> | string
    locationId?: StringNullableFilter<"InventoryBalance"> | string | null
    itemId?: StringFilter<"InventoryBalance"> | string
    itemCode?: StringNullableFilter<"InventoryBalance"> | string | null
    itemName?: StringNullableFilter<"InventoryBalance"> | string | null
    uom?: StringFilter<"InventoryBalance"> | string
    onHandQuantity?: StringFilter<"InventoryBalance"> | string
    availableQuantity?: StringFilter<"InventoryBalance"> | string
    restrictedQuantity?: StringFilter<"InventoryBalance"> | string
    restrictedQuantities?: JsonFilter<"InventoryBalance">
    lastLedgerEntryId?: StringFilter<"InventoryBalance"> | string
    lastPostedAt?: DateTimeFilter<"InventoryBalance"> | Date | string
    updatedAt?: DateTimeFilter<"InventoryBalance"> | Date | string
  }, "balanceKey">

  export type InventoryBalanceOrderByWithAggregationInput = {
    balanceKey?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrderInput | SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    uom?: SortOrder
    onHandQuantity?: SortOrder
    availableQuantity?: SortOrder
    restrictedQuantity?: SortOrder
    restrictedQuantities?: SortOrder
    lastLedgerEntryId?: SortOrder
    lastPostedAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InventoryBalanceCountOrderByAggregateInput
    _max?: InventoryBalanceMaxOrderByAggregateInput
    _min?: InventoryBalanceMinOrderByAggregateInput
  }

  export type InventoryBalanceScalarWhereWithAggregatesInput = {
    AND?: InventoryBalanceScalarWhereWithAggregatesInput | InventoryBalanceScalarWhereWithAggregatesInput[]
    OR?: InventoryBalanceScalarWhereWithAggregatesInput[]
    NOT?: InventoryBalanceScalarWhereWithAggregatesInput | InventoryBalanceScalarWhereWithAggregatesInput[]
    balanceKey?: StringWithAggregatesFilter<"InventoryBalance"> | string
    tenantId?: StringWithAggregatesFilter<"InventoryBalance"> | string
    orgId?: StringNullableWithAggregatesFilter<"InventoryBalance"> | string | null
    warehouseId?: StringWithAggregatesFilter<"InventoryBalance"> | string
    locationId?: StringNullableWithAggregatesFilter<"InventoryBalance"> | string | null
    itemId?: StringWithAggregatesFilter<"InventoryBalance"> | string
    itemCode?: StringNullableWithAggregatesFilter<"InventoryBalance"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"InventoryBalance"> | string | null
    uom?: StringWithAggregatesFilter<"InventoryBalance"> | string
    onHandQuantity?: StringWithAggregatesFilter<"InventoryBalance"> | string
    availableQuantity?: StringWithAggregatesFilter<"InventoryBalance"> | string
    restrictedQuantity?: StringWithAggregatesFilter<"InventoryBalance"> | string
    restrictedQuantities?: JsonWithAggregatesFilter<"InventoryBalance">
    lastLedgerEntryId?: StringWithAggregatesFilter<"InventoryBalance"> | string
    lastPostedAt?: DateTimeWithAggregatesFilter<"InventoryBalance"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"InventoryBalance"> | Date | string
  }

  export type WmsAuditEnvelopeWhereInput = {
    AND?: WmsAuditEnvelopeWhereInput | WmsAuditEnvelopeWhereInput[]
    OR?: WmsAuditEnvelopeWhereInput[]
    NOT?: WmsAuditEnvelopeWhereInput | WmsAuditEnvelopeWhereInput[]
    id?: StringFilter<"WmsAuditEnvelope"> | string
    service?: StringFilter<"WmsAuditEnvelope"> | string
    module?: StringFilter<"WmsAuditEnvelope"> | string
    eventType?: StringFilter<"WmsAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"WmsAuditEnvelope"> | Date | string
    result?: StringFilter<"WmsAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    operatorType?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    tenantId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    resourceType?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    resourceId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    details?: JsonFilter<"WmsAuditEnvelope">
    createdAt?: DateTimeFilter<"WmsAuditEnvelope"> | Date | string
  }

  export type WmsAuditEnvelopeOrderByWithRelationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrderInput | SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrderInput | SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type WmsAuditEnvelopeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WmsAuditEnvelopeWhereInput | WmsAuditEnvelopeWhereInput[]
    OR?: WmsAuditEnvelopeWhereInput[]
    NOT?: WmsAuditEnvelopeWhereInput | WmsAuditEnvelopeWhereInput[]
    service?: StringFilter<"WmsAuditEnvelope"> | string
    module?: StringFilter<"WmsAuditEnvelope"> | string
    eventType?: StringFilter<"WmsAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"WmsAuditEnvelope"> | Date | string
    result?: StringFilter<"WmsAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    operatorType?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    tenantId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    resourceType?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    resourceId?: StringNullableFilter<"WmsAuditEnvelope"> | string | null
    details?: JsonFilter<"WmsAuditEnvelope">
    createdAt?: DateTimeFilter<"WmsAuditEnvelope"> | Date | string
  }, "id">

  export type WmsAuditEnvelopeOrderByWithAggregationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrderInput | SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrderInput | SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
    _count?: WmsAuditEnvelopeCountOrderByAggregateInput
    _max?: WmsAuditEnvelopeMaxOrderByAggregateInput
    _min?: WmsAuditEnvelopeMinOrderByAggregateInput
  }

  export type WmsAuditEnvelopeScalarWhereWithAggregatesInput = {
    AND?: WmsAuditEnvelopeScalarWhereWithAggregatesInput | WmsAuditEnvelopeScalarWhereWithAggregatesInput[]
    OR?: WmsAuditEnvelopeScalarWhereWithAggregatesInput[]
    NOT?: WmsAuditEnvelopeScalarWhereWithAggregatesInput | WmsAuditEnvelopeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WmsAuditEnvelope"> | string
    service?: StringWithAggregatesFilter<"WmsAuditEnvelope"> | string
    module?: StringWithAggregatesFilter<"WmsAuditEnvelope"> | string
    eventType?: StringWithAggregatesFilter<"WmsAuditEnvelope"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"WmsAuditEnvelope"> | Date | string
    result?: StringWithAggregatesFilter<"WmsAuditEnvelope"> | string
    operatorId?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    operatorType?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    tenantId?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    resourceType?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    resourceId?: StringNullableWithAggregatesFilter<"WmsAuditEnvelope"> | string | null
    details?: JsonWithAggregatesFilter<"WmsAuditEnvelope">
    createdAt?: DateTimeWithAggregatesFilter<"WmsAuditEnvelope"> | Date | string
  }

  export type WmsSequenceCounterCreateInput = {
    tenantId: string
    nextReceiptNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WmsSequenceCounterUncheckedCreateInput = {
    tenantId: string
    nextReceiptNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WmsSequenceCounterUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextReceiptNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsSequenceCounterUncheckedUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextReceiptNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsSequenceCounterCreateManyInput = {
    tenantId: string
    nextReceiptNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type WmsSequenceCounterUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextReceiptNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsSequenceCounterUncheckedUpdateManyInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextReceiptNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WarehouseCreateInput = {
    id: string
    tenantId: string
    orgId?: string | null
    warehouseCode: string
    warehouseName: string
    warehouseScope: $Enums.WmsWarehouseScope
    status: $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type WarehouseUncheckedCreateInput = {
    id: string
    tenantId: string
    orgId?: string | null
    warehouseCode: string
    warehouseName: string
    warehouseScope: $Enums.WmsWarehouseScope
    status: $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type WarehouseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseCode?: StringFieldUpdateOperationsInput | string
    warehouseName?: StringFieldUpdateOperationsInput | string
    warehouseScope?: EnumWmsWarehouseScopeFieldUpdateOperationsInput | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFieldUpdateOperationsInput | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WarehouseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseCode?: StringFieldUpdateOperationsInput | string
    warehouseName?: StringFieldUpdateOperationsInput | string
    warehouseScope?: EnumWmsWarehouseScopeFieldUpdateOperationsInput | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFieldUpdateOperationsInput | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WarehouseCreateManyInput = {
    id: string
    tenantId: string
    orgId?: string | null
    warehouseCode: string
    warehouseName: string
    warehouseScope: $Enums.WmsWarehouseScope
    status: $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type WarehouseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseCode?: StringFieldUpdateOperationsInput | string
    warehouseName?: StringFieldUpdateOperationsInput | string
    warehouseScope?: EnumWmsWarehouseScopeFieldUpdateOperationsInput | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFieldUpdateOperationsInput | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WarehouseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseCode?: StringFieldUpdateOperationsInput | string
    warehouseName?: StringFieldUpdateOperationsInput | string
    warehouseScope?: EnumWmsWarehouseScopeFieldUpdateOperationsInput | $Enums.WmsWarehouseScope
    status?: EnumWmsWarehouseStatusFieldUpdateOperationsInput | $Enums.WmsWarehouseStatus
    defaultReceivingLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateInput = {
    id: string
    tenantId: string
    warehouseId: string
    parentLocationId?: string | null
    locationCode: string
    locationName: string
    locationScope: $Enums.WmsLocationScope
    locationType: $Enums.WmsLocationType
    status: $Enums.WmsLocationStatus
    supportsReceipt: boolean
    supportsStorage: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LocationUncheckedCreateInput = {
    id: string
    tenantId: string
    warehouseId: string
    parentLocationId?: string | null
    locationCode: string
    locationName: string
    locationScope: $Enums.WmsLocationScope
    locationType: $Enums.WmsLocationType
    status: $Enums.WmsLocationStatus
    supportsReceipt: boolean
    supportsStorage: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    warehouseId?: StringFieldUpdateOperationsInput | string
    parentLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    locationCode?: StringFieldUpdateOperationsInput | string
    locationName?: StringFieldUpdateOperationsInput | string
    locationScope?: EnumWmsLocationScopeFieldUpdateOperationsInput | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFieldUpdateOperationsInput | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFieldUpdateOperationsInput | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFieldUpdateOperationsInput | boolean
    supportsStorage?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    warehouseId?: StringFieldUpdateOperationsInput | string
    parentLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    locationCode?: StringFieldUpdateOperationsInput | string
    locationName?: StringFieldUpdateOperationsInput | string
    locationScope?: EnumWmsLocationScopeFieldUpdateOperationsInput | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFieldUpdateOperationsInput | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFieldUpdateOperationsInput | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFieldUpdateOperationsInput | boolean
    supportsStorage?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationCreateManyInput = {
    id: string
    tenantId: string
    warehouseId: string
    parentLocationId?: string | null
    locationCode: string
    locationName: string
    locationScope: $Enums.WmsLocationScope
    locationType: $Enums.WmsLocationType
    status: $Enums.WmsLocationStatus
    supportsReceipt: boolean
    supportsStorage: boolean
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type LocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    warehouseId?: StringFieldUpdateOperationsInput | string
    parentLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    locationCode?: StringFieldUpdateOperationsInput | string
    locationName?: StringFieldUpdateOperationsInput | string
    locationScope?: EnumWmsLocationScopeFieldUpdateOperationsInput | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFieldUpdateOperationsInput | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFieldUpdateOperationsInput | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFieldUpdateOperationsInput | boolean
    supportsStorage?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    warehouseId?: StringFieldUpdateOperationsInput | string
    parentLocationId?: NullableStringFieldUpdateOperationsInput | string | null
    locationCode?: StringFieldUpdateOperationsInput | string
    locationName?: StringFieldUpdateOperationsInput | string
    locationScope?: EnumWmsLocationScopeFieldUpdateOperationsInput | $Enums.WmsLocationScope
    locationType?: EnumWmsLocationTypeFieldUpdateOperationsInput | $Enums.WmsLocationType
    status?: EnumWmsLocationStatusFieldUpdateOperationsInput | $Enums.WmsLocationStatus
    supportsReceipt?: BoolFieldUpdateOperationsInput | boolean
    supportsStorage?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptCreateInput = {
    id: string
    receiptNo: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonNullValueInput | InputJsonValue
    receiptDate: string
    note?: string | null
    attachmentRefs: JsonNullValueInput | InputJsonValue
    lineCount: number
    postedAt?: Date | string | null
    cancelledAt?: Date | string | null
    cancelReason?: string | null
    postComment?: string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
    lines?: ReceiptLineCreateNestedManyWithoutReceiptInput
  }

  export type ReceiptUncheckedCreateInput = {
    id: string
    receiptNo: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonNullValueInput | InputJsonValue
    receiptDate: string
    note?: string | null
    attachmentRefs: JsonNullValueInput | InputJsonValue
    lineCount: number
    postedAt?: Date | string | null
    cancelledAt?: Date | string | null
    cancelReason?: string | null
    postComment?: string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
    lines?: ReceiptLineUncheckedCreateNestedManyWithoutReceiptInput
  }

  export type ReceiptUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: ReceiptLineUpdateManyWithoutReceiptNestedInput
  }

  export type ReceiptUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lines?: ReceiptLineUncheckedUpdateManyWithoutReceiptNestedInput
  }

  export type ReceiptCreateManyInput = {
    id: string
    receiptNo: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonNullValueInput | InputJsonValue
    receiptDate: string
    note?: string | null
    attachmentRefs: JsonNullValueInput | InputJsonValue
    lineCount: number
    postedAt?: Date | string | null
    cancelledAt?: Date | string | null
    cancelReason?: string | null
    postComment?: string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
    receipt: ReceiptCreateNestedOneWithoutLinesInput
  }

  export type ReceiptLineUncheckedCreateInput = {
    id: string
    tenantId: string
    receiptId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    receipt?: ReceiptUpdateOneRequiredWithoutLinesNestedInput
  }

  export type ReceiptLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    receiptId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineCreateManyInput = {
    id: string
    tenantId: string
    receiptId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    receiptId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLedgerEntryCreateInput = {
    id: string
    tenantId: string
    orgId?: string | null
    entryType: $Enums.WmsStockLedgerEntryType
    direction: $Enums.WmsStockLedgerDirection
    warehouseId: string
    locationId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    quantityDelta: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId: string
    sourceDocumentLineId: string
    receivingExpectationId?: string | null
    trackingRefs: JsonNullValueInput | InputJsonValue
    postedAt: Date | string
  }

  export type StockLedgerEntryUncheckedCreateInput = {
    id: string
    tenantId: string
    orgId?: string | null
    entryType: $Enums.WmsStockLedgerEntryType
    direction: $Enums.WmsStockLedgerDirection
    warehouseId: string
    locationId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    quantityDelta: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId: string
    sourceDocumentLineId: string
    receivingExpectationId?: string | null
    trackingRefs: JsonNullValueInput | InputJsonValue
    postedAt: Date | string
  }

  export type StockLedgerEntryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFieldUpdateOperationsInput | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    quantityDelta?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFieldUpdateOperationsInput | string
    sourceDocumentLineId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    trackingRefs?: JsonNullValueInput | InputJsonValue
    postedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLedgerEntryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFieldUpdateOperationsInput | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    quantityDelta?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFieldUpdateOperationsInput | string
    sourceDocumentLineId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    trackingRefs?: JsonNullValueInput | InputJsonValue
    postedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLedgerEntryCreateManyInput = {
    id: string
    tenantId: string
    orgId?: string | null
    entryType: $Enums.WmsStockLedgerEntryType
    direction: $Enums.WmsStockLedgerDirection
    warehouseId: string
    locationId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    quantityDelta: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType: $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId: string
    sourceDocumentLineId: string
    receivingExpectationId?: string | null
    trackingRefs: JsonNullValueInput | InputJsonValue
    postedAt: Date | string
  }

  export type StockLedgerEntryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFieldUpdateOperationsInput | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    quantityDelta?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFieldUpdateOperationsInput | string
    sourceDocumentLineId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    trackingRefs?: JsonNullValueInput | InputJsonValue
    postedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StockLedgerEntryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    entryType?: EnumWmsStockLedgerEntryTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerEntryType
    direction?: EnumWmsStockLedgerDirectionFieldUpdateOperationsInput | $Enums.WmsStockLedgerDirection
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    quantityDelta?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    sourceDocumentType?: EnumWmsStockLedgerSourceDocumentTypeFieldUpdateOperationsInput | $Enums.WmsStockLedgerSourceDocumentType
    sourceDocumentId?: StringFieldUpdateOperationsInput | string
    sourceDocumentLineId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    trackingRefs?: JsonNullValueInput | InputJsonValue
    postedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBalanceCreateInput = {
    balanceKey: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    locationId?: string | null
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    uom: string
    onHandQuantity: string
    availableQuantity: string
    restrictedQuantity: string
    restrictedQuantities: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId: string
    lastPostedAt: Date | string
    updatedAt: Date | string
  }

  export type InventoryBalanceUncheckedCreateInput = {
    balanceKey: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    locationId?: string | null
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    uom: string
    onHandQuantity: string
    availableQuantity: string
    restrictedQuantity: string
    restrictedQuantities: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId: string
    lastPostedAt: Date | string
    updatedAt: Date | string
  }

  export type InventoryBalanceUpdateInput = {
    balanceKey?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    uom?: StringFieldUpdateOperationsInput | string
    onHandQuantity?: StringFieldUpdateOperationsInput | string
    availableQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantities?: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId?: StringFieldUpdateOperationsInput | string
    lastPostedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBalanceUncheckedUpdateInput = {
    balanceKey?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    uom?: StringFieldUpdateOperationsInput | string
    onHandQuantity?: StringFieldUpdateOperationsInput | string
    availableQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantities?: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId?: StringFieldUpdateOperationsInput | string
    lastPostedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBalanceCreateManyInput = {
    balanceKey: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    locationId?: string | null
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    uom: string
    onHandQuantity: string
    availableQuantity: string
    restrictedQuantity: string
    restrictedQuantities: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId: string
    lastPostedAt: Date | string
    updatedAt: Date | string
  }

  export type InventoryBalanceUpdateManyMutationInput = {
    balanceKey?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    uom?: StringFieldUpdateOperationsInput | string
    onHandQuantity?: StringFieldUpdateOperationsInput | string
    availableQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantities?: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId?: StringFieldUpdateOperationsInput | string
    lastPostedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryBalanceUncheckedUpdateManyInput = {
    balanceKey?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    locationId?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    uom?: StringFieldUpdateOperationsInput | string
    onHandQuantity?: StringFieldUpdateOperationsInput | string
    availableQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantity?: StringFieldUpdateOperationsInput | string
    restrictedQuantities?: JsonNullValueInput | InputJsonValue
    lastLedgerEntryId?: StringFieldUpdateOperationsInput | string
    lastPostedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsAuditEnvelopeCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType?: string | null
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType?: string | null
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
  }

  export type WmsAuditEnvelopeUncheckedCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType?: string | null
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType?: string | null
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
  }

  export type WmsAuditEnvelopeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: NullableStringFieldUpdateOperationsInput | string | null
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: NullableStringFieldUpdateOperationsInput | string | null
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsAuditEnvelopeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: NullableStringFieldUpdateOperationsInput | string | null
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: NullableStringFieldUpdateOperationsInput | string | null
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsAuditEnvelopeCreateManyInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType?: string | null
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType?: string | null
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
  }

  export type WmsAuditEnvelopeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: NullableStringFieldUpdateOperationsInput | string | null
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: NullableStringFieldUpdateOperationsInput | string | null
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WmsAuditEnvelopeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: NullableStringFieldUpdateOperationsInput | string | null
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: NullableStringFieldUpdateOperationsInput | string | null
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

  export type WmsSequenceCounterCountOrderByAggregateInput = {
    tenantId?: SortOrder
    nextReceiptNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WmsSequenceCounterAvgOrderByAggregateInput = {
    nextReceiptNo?: SortOrder
  }

  export type WmsSequenceCounterMaxOrderByAggregateInput = {
    tenantId?: SortOrder
    nextReceiptNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WmsSequenceCounterMinOrderByAggregateInput = {
    tenantId?: SortOrder
    nextReceiptNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WmsSequenceCounterSumOrderByAggregateInput = {
    nextReceiptNo?: SortOrder
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

  export type EnumWmsWarehouseScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseScope | EnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel> | $Enums.WmsWarehouseScope
  }

  export type EnumWmsWarehouseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseStatus | EnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel> | $Enums.WmsWarehouseStatus
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type WarehouseTenantIdWarehouseCodeCompoundUniqueInput = {
    tenantId: string
    warehouseCode: string
  }

  export type WarehouseCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseCode?: SortOrder
    warehouseName?: SortOrder
    warehouseScope?: SortOrder
    status?: SortOrder
    defaultReceivingLocationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WarehouseMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseCode?: SortOrder
    warehouseName?: SortOrder
    warehouseScope?: SortOrder
    status?: SortOrder
    defaultReceivingLocationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WarehouseMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseCode?: SortOrder
    warehouseName?: SortOrder
    warehouseScope?: SortOrder
    status?: SortOrder
    defaultReceivingLocationId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type EnumWmsWarehouseScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseScope | EnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseScopeWithAggregatesFilter<$PrismaModel> | $Enums.WmsWarehouseScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel>
    _max?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel>
  }

  export type EnumWmsWarehouseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseStatus | EnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsWarehouseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel>
  }

  export type EnumWmsLocationScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationScope | EnumWmsLocationScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationScopeFilter<$PrismaModel> | $Enums.WmsLocationScope
  }

  export type EnumWmsLocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationType | EnumWmsLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationTypeFilter<$PrismaModel> | $Enums.WmsLocationType
  }

  export type EnumWmsLocationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationStatus | EnumWmsLocationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationStatusFilter<$PrismaModel> | $Enums.WmsLocationStatus
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type LocationWarehouseIdLocationCodeCompoundUniqueInput = {
    warehouseId: string
    locationCode: string
  }

  export type LocationCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    warehouseId?: SortOrder
    parentLocationId?: SortOrder
    locationCode?: SortOrder
    locationName?: SortOrder
    locationScope?: SortOrder
    locationType?: SortOrder
    status?: SortOrder
    supportsReceipt?: SortOrder
    supportsStorage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    warehouseId?: SortOrder
    parentLocationId?: SortOrder
    locationCode?: SortOrder
    locationName?: SortOrder
    locationScope?: SortOrder
    locationType?: SortOrder
    status?: SortOrder
    supportsReceipt?: SortOrder
    supportsStorage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocationMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    warehouseId?: SortOrder
    parentLocationId?: SortOrder
    locationCode?: SortOrder
    locationName?: SortOrder
    locationScope?: SortOrder
    locationType?: SortOrder
    status?: SortOrder
    supportsReceipt?: SortOrder
    supportsStorage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumWmsLocationScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationScope | EnumWmsLocationScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationScopeWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationScopeFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationScopeFilter<$PrismaModel>
  }

  export type EnumWmsLocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationType | EnumWmsLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationTypeFilter<$PrismaModel>
  }

  export type EnumWmsLocationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationStatus | EnumWmsLocationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationStatusFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EnumWmsReceiptStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptStatus | EnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptStatusFilter<$PrismaModel> | $Enums.WmsReceiptStatus
  }

  export type EnumWmsReceiptSourceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptSourceType | EnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel> | $Enums.WmsReceiptSourceType
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
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
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

  export type ReceiptLineListRelationFilter = {
    every?: ReceiptLineWhereInput
    some?: ReceiptLineWhereInput
    none?: ReceiptLineWhereInput
  }

  export type ReceiptLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ReceiptCountOrderByAggregateInput = {
    id?: SortOrder
    receiptNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    status?: SortOrder
    receiptSourceType?: SortOrder
    referencedReceivingExpectationIds?: SortOrder
    receiptDate?: SortOrder
    note?: SortOrder
    attachmentRefs?: SortOrder
    lineCount?: SortOrder
    postedAt?: SortOrder
    cancelledAt?: SortOrder
    cancelReason?: SortOrder
    postComment?: SortOrder
    procurementReceiptSummary?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptAvgOrderByAggregateInput = {
    lineCount?: SortOrder
  }

  export type ReceiptMaxOrderByAggregateInput = {
    id?: SortOrder
    receiptNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    status?: SortOrder
    receiptSourceType?: SortOrder
    receiptDate?: SortOrder
    note?: SortOrder
    lineCount?: SortOrder
    postedAt?: SortOrder
    cancelledAt?: SortOrder
    cancelReason?: SortOrder
    postComment?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptMinOrderByAggregateInput = {
    id?: SortOrder
    receiptNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    status?: SortOrder
    receiptSourceType?: SortOrder
    receiptDate?: SortOrder
    note?: SortOrder
    lineCount?: SortOrder
    postedAt?: SortOrder
    cancelledAt?: SortOrder
    cancelReason?: SortOrder
    postComment?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptSumOrderByAggregateInput = {
    lineCount?: SortOrder
  }

  export type EnumWmsReceiptStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptStatus | EnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsReceiptStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsReceiptStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsReceiptStatusFilter<$PrismaModel>
  }

  export type EnumWmsReceiptSourceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptSourceType | EnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptSourceTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsReceiptSourceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel>
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
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
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
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumWmsInventoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsInventoryStatus | EnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsInventoryStatusFilter<$PrismaModel> | $Enums.WmsInventoryStatus
  }

  export type ReceiptScalarRelationFilter = {
    is?: ReceiptWhereInput
    isNot?: ReceiptWhereInput
  }

  export type ReceiptLineReceiptIdLineNoCompoundUniqueInput = {
    receiptId: string
    lineNo: number
  }

  export type ReceiptLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receiptId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    receivingExpectationId?: SortOrder
    targetLocationId?: SortOrder
    confirmedQuantity?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrder
    trackingRefs?: SortOrder
    physicalDiscrepancy?: SortOrder
    evidenceAttachmentRefs?: SortOrder
    postedStockLedgerEntryIds?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type ReceiptLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receiptId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    receivingExpectationId?: SortOrder
    targetLocationId?: SortOrder
    confirmedQuantity?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receiptId?: SortOrder
    lineNo?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    receivingExpectationId?: SortOrder
    targetLocationId?: SortOrder
    confirmedQuantity?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceiptLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type EnumWmsInventoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsInventoryStatus | EnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsInventoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsInventoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsInventoryStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsInventoryStatusFilter<$PrismaModel>
  }

  export type EnumWmsStockLedgerEntryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerEntryType | EnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel> | $Enums.WmsStockLedgerEntryType
  }

  export type EnumWmsStockLedgerDirectionFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerDirection | EnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel> | $Enums.WmsStockLedgerDirection
  }

  export type EnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerSourceDocumentType | EnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel> | $Enums.WmsStockLedgerSourceDocumentType
  }

  export type StockLedgerEntryCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    entryType?: SortOrder
    direction?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    quantityDelta?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    restrictedReason?: SortOrder
    sourceDocumentType?: SortOrder
    sourceDocumentId?: SortOrder
    sourceDocumentLineId?: SortOrder
    receivingExpectationId?: SortOrder
    trackingRefs?: SortOrder
    postedAt?: SortOrder
  }

  export type StockLedgerEntryMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    entryType?: SortOrder
    direction?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    quantityDelta?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    sourceDocumentType?: SortOrder
    sourceDocumentId?: SortOrder
    sourceDocumentLineId?: SortOrder
    receivingExpectationId?: SortOrder
    postedAt?: SortOrder
  }

  export type StockLedgerEntryMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    entryType?: SortOrder
    direction?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    quantityDelta?: SortOrder
    uom?: SortOrder
    inventoryStatus?: SortOrder
    sourceDocumentType?: SortOrder
    sourceDocumentId?: SortOrder
    sourceDocumentLineId?: SortOrder
    receivingExpectationId?: SortOrder
    postedAt?: SortOrder
  }

  export type EnumWmsStockLedgerEntryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerEntryType | EnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerEntryTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerEntryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel>
  }

  export type EnumWmsStockLedgerDirectionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerDirection | EnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerDirectionWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerDirection
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel>
  }

  export type EnumWmsStockLedgerSourceDocumentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerSourceDocumentType | EnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerSourceDocumentTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerSourceDocumentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel>
  }

  export type InventoryBalanceCountOrderByAggregateInput = {
    balanceKey?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    uom?: SortOrder
    onHandQuantity?: SortOrder
    availableQuantity?: SortOrder
    restrictedQuantity?: SortOrder
    restrictedQuantities?: SortOrder
    lastLedgerEntryId?: SortOrder
    lastPostedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryBalanceMaxOrderByAggregateInput = {
    balanceKey?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    uom?: SortOrder
    onHandQuantity?: SortOrder
    availableQuantity?: SortOrder
    restrictedQuantity?: SortOrder
    lastLedgerEntryId?: SortOrder
    lastPostedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryBalanceMinOrderByAggregateInput = {
    balanceKey?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    warehouseId?: SortOrder
    locationId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    uom?: SortOrder
    onHandQuantity?: SortOrder
    availableQuantity?: SortOrder
    restrictedQuantity?: SortOrder
    lastLedgerEntryId?: SortOrder
    lastPostedAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type WmsAuditEnvelopeCountOrderByAggregateInput = {
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

  export type WmsAuditEnvelopeMaxOrderByAggregateInput = {
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

  export type WmsAuditEnvelopeMinOrderByAggregateInput = {
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

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumWmsWarehouseScopeFieldUpdateOperationsInput = {
    set?: $Enums.WmsWarehouseScope
  }

  export type EnumWmsWarehouseStatusFieldUpdateOperationsInput = {
    set?: $Enums.WmsWarehouseStatus
  }

  export type EnumWmsLocationScopeFieldUpdateOperationsInput = {
    set?: $Enums.WmsLocationScope
  }

  export type EnumWmsLocationTypeFieldUpdateOperationsInput = {
    set?: $Enums.WmsLocationType
  }

  export type EnumWmsLocationStatusFieldUpdateOperationsInput = {
    set?: $Enums.WmsLocationStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ReceiptLineCreateNestedManyWithoutReceiptInput = {
    create?: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput> | ReceiptLineCreateWithoutReceiptInput[] | ReceiptLineUncheckedCreateWithoutReceiptInput[]
    connectOrCreate?: ReceiptLineCreateOrConnectWithoutReceiptInput | ReceiptLineCreateOrConnectWithoutReceiptInput[]
    createMany?: ReceiptLineCreateManyReceiptInputEnvelope
    connect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
  }

  export type ReceiptLineUncheckedCreateNestedManyWithoutReceiptInput = {
    create?: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput> | ReceiptLineCreateWithoutReceiptInput[] | ReceiptLineUncheckedCreateWithoutReceiptInput[]
    connectOrCreate?: ReceiptLineCreateOrConnectWithoutReceiptInput | ReceiptLineCreateOrConnectWithoutReceiptInput[]
    createMany?: ReceiptLineCreateManyReceiptInputEnvelope
    connect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
  }

  export type EnumWmsReceiptStatusFieldUpdateOperationsInput = {
    set?: $Enums.WmsReceiptStatus
  }

  export type EnumWmsReceiptSourceTypeFieldUpdateOperationsInput = {
    set?: $Enums.WmsReceiptSourceType
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type ReceiptLineUpdateManyWithoutReceiptNestedInput = {
    create?: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput> | ReceiptLineCreateWithoutReceiptInput[] | ReceiptLineUncheckedCreateWithoutReceiptInput[]
    connectOrCreate?: ReceiptLineCreateOrConnectWithoutReceiptInput | ReceiptLineCreateOrConnectWithoutReceiptInput[]
    upsert?: ReceiptLineUpsertWithWhereUniqueWithoutReceiptInput | ReceiptLineUpsertWithWhereUniqueWithoutReceiptInput[]
    createMany?: ReceiptLineCreateManyReceiptInputEnvelope
    set?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    disconnect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    delete?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    connect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    update?: ReceiptLineUpdateWithWhereUniqueWithoutReceiptInput | ReceiptLineUpdateWithWhereUniqueWithoutReceiptInput[]
    updateMany?: ReceiptLineUpdateManyWithWhereWithoutReceiptInput | ReceiptLineUpdateManyWithWhereWithoutReceiptInput[]
    deleteMany?: ReceiptLineScalarWhereInput | ReceiptLineScalarWhereInput[]
  }

  export type ReceiptLineUncheckedUpdateManyWithoutReceiptNestedInput = {
    create?: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput> | ReceiptLineCreateWithoutReceiptInput[] | ReceiptLineUncheckedCreateWithoutReceiptInput[]
    connectOrCreate?: ReceiptLineCreateOrConnectWithoutReceiptInput | ReceiptLineCreateOrConnectWithoutReceiptInput[]
    upsert?: ReceiptLineUpsertWithWhereUniqueWithoutReceiptInput | ReceiptLineUpsertWithWhereUniqueWithoutReceiptInput[]
    createMany?: ReceiptLineCreateManyReceiptInputEnvelope
    set?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    disconnect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    delete?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    connect?: ReceiptLineWhereUniqueInput | ReceiptLineWhereUniqueInput[]
    update?: ReceiptLineUpdateWithWhereUniqueWithoutReceiptInput | ReceiptLineUpdateWithWhereUniqueWithoutReceiptInput[]
    updateMany?: ReceiptLineUpdateManyWithWhereWithoutReceiptInput | ReceiptLineUpdateManyWithWhereWithoutReceiptInput[]
    deleteMany?: ReceiptLineScalarWhereInput | ReceiptLineScalarWhereInput[]
  }

  export type ReceiptCreateNestedOneWithoutLinesInput = {
    create?: XOR<ReceiptCreateWithoutLinesInput, ReceiptUncheckedCreateWithoutLinesInput>
    connectOrCreate?: ReceiptCreateOrConnectWithoutLinesInput
    connect?: ReceiptWhereUniqueInput
  }

  export type EnumWmsInventoryStatusFieldUpdateOperationsInput = {
    set?: $Enums.WmsInventoryStatus
  }

  export type ReceiptUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<ReceiptCreateWithoutLinesInput, ReceiptUncheckedCreateWithoutLinesInput>
    connectOrCreate?: ReceiptCreateOrConnectWithoutLinesInput
    upsert?: ReceiptUpsertWithoutLinesInput
    connect?: ReceiptWhereUniqueInput
    update?: XOR<XOR<ReceiptUpdateToOneWithWhereWithoutLinesInput, ReceiptUpdateWithoutLinesInput>, ReceiptUncheckedUpdateWithoutLinesInput>
  }

  export type EnumWmsStockLedgerEntryTypeFieldUpdateOperationsInput = {
    set?: $Enums.WmsStockLedgerEntryType
  }

  export type EnumWmsStockLedgerDirectionFieldUpdateOperationsInput = {
    set?: $Enums.WmsStockLedgerDirection
  }

  export type EnumWmsStockLedgerSourceDocumentTypeFieldUpdateOperationsInput = {
    set?: $Enums.WmsStockLedgerSourceDocumentType
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

  export type NestedEnumWmsWarehouseScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseScope | EnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel> | $Enums.WmsWarehouseScope
  }

  export type NestedEnumWmsWarehouseStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseStatus | EnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel> | $Enums.WmsWarehouseStatus
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

  export type NestedEnumWmsWarehouseScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseScope | EnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseScope[] | ListEnumWmsWarehouseScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseScopeWithAggregatesFilter<$PrismaModel> | $Enums.WmsWarehouseScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel>
    _max?: NestedEnumWmsWarehouseScopeFilter<$PrismaModel>
  }

  export type NestedEnumWmsWarehouseStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsWarehouseStatus | EnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsWarehouseStatus[] | ListEnumWmsWarehouseStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsWarehouseStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsWarehouseStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsWarehouseStatusFilter<$PrismaModel>
  }

  export type NestedEnumWmsLocationScopeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationScope | EnumWmsLocationScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationScopeFilter<$PrismaModel> | $Enums.WmsLocationScope
  }

  export type NestedEnumWmsLocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationType | EnumWmsLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationTypeFilter<$PrismaModel> | $Enums.WmsLocationType
  }

  export type NestedEnumWmsLocationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationStatus | EnumWmsLocationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationStatusFilter<$PrismaModel> | $Enums.WmsLocationStatus
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumWmsLocationScopeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationScope | EnumWmsLocationScopeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationScope[] | ListEnumWmsLocationScopeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationScopeWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationScope
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationScopeFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationScopeFilter<$PrismaModel>
  }

  export type NestedEnumWmsLocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationType | EnumWmsLocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationType[] | ListEnumWmsLocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationTypeFilter<$PrismaModel>
  }

  export type NestedEnumWmsLocationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsLocationStatus | EnumWmsLocationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsLocationStatus[] | ListEnumWmsLocationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsLocationStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsLocationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsLocationStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsLocationStatusFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumWmsReceiptStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptStatus | EnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptStatusFilter<$PrismaModel> | $Enums.WmsReceiptStatus
  }

  export type NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptSourceType | EnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel> | $Enums.WmsReceiptSourceType
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

  export type NestedEnumWmsReceiptStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptStatus | EnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptStatus[] | ListEnumWmsReceiptStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsReceiptStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsReceiptStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsReceiptStatusFilter<$PrismaModel>
  }

  export type NestedEnumWmsReceiptSourceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsReceiptSourceType | EnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsReceiptSourceType[] | ListEnumWmsReceiptSourceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsReceiptSourceTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsReceiptSourceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsReceiptSourceTypeFilter<$PrismaModel>
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
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
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

  export type NestedEnumWmsInventoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsInventoryStatus | EnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsInventoryStatusFilter<$PrismaModel> | $Enums.WmsInventoryStatus
  }

  export type NestedEnumWmsInventoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsInventoryStatus | EnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsInventoryStatus[] | ListEnumWmsInventoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsInventoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.WmsInventoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsInventoryStatusFilter<$PrismaModel>
    _max?: NestedEnumWmsInventoryStatusFilter<$PrismaModel>
  }

  export type NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerEntryType | EnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel> | $Enums.WmsStockLedgerEntryType
  }

  export type NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerDirection | EnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel> | $Enums.WmsStockLedgerDirection
  }

  export type NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerSourceDocumentType | EnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel> | $Enums.WmsStockLedgerSourceDocumentType
  }

  export type NestedEnumWmsStockLedgerEntryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerEntryType | EnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerEntryType[] | ListEnumWmsStockLedgerEntryTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerEntryTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerEntryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerEntryTypeFilter<$PrismaModel>
  }

  export type NestedEnumWmsStockLedgerDirectionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerDirection | EnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerDirection[] | ListEnumWmsStockLedgerDirectionFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerDirectionWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerDirection
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerDirectionFilter<$PrismaModel>
  }

  export type NestedEnumWmsStockLedgerSourceDocumentTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WmsStockLedgerSourceDocumentType | EnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    in?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.WmsStockLedgerSourceDocumentType[] | ListEnumWmsStockLedgerSourceDocumentTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumWmsStockLedgerSourceDocumentTypeWithAggregatesFilter<$PrismaModel> | $Enums.WmsStockLedgerSourceDocumentType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel>
    _max?: NestedEnumWmsStockLedgerSourceDocumentTypeFilter<$PrismaModel>
  }

  export type ReceiptLineCreateWithoutReceiptInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptLineUncheckedCreateWithoutReceiptInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptLineCreateOrConnectWithoutReceiptInput = {
    where: ReceiptLineWhereUniqueInput
    create: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput>
  }

  export type ReceiptLineCreateManyReceiptInputEnvelope = {
    data: ReceiptLineCreateManyReceiptInput | ReceiptLineCreateManyReceiptInput[]
    skipDuplicates?: boolean
  }

  export type ReceiptLineUpsertWithWhereUniqueWithoutReceiptInput = {
    where: ReceiptLineWhereUniqueInput
    update: XOR<ReceiptLineUpdateWithoutReceiptInput, ReceiptLineUncheckedUpdateWithoutReceiptInput>
    create: XOR<ReceiptLineCreateWithoutReceiptInput, ReceiptLineUncheckedCreateWithoutReceiptInput>
  }

  export type ReceiptLineUpdateWithWhereUniqueWithoutReceiptInput = {
    where: ReceiptLineWhereUniqueInput
    data: XOR<ReceiptLineUpdateWithoutReceiptInput, ReceiptLineUncheckedUpdateWithoutReceiptInput>
  }

  export type ReceiptLineUpdateManyWithWhereWithoutReceiptInput = {
    where: ReceiptLineScalarWhereInput
    data: XOR<ReceiptLineUpdateManyMutationInput, ReceiptLineUncheckedUpdateManyWithoutReceiptInput>
  }

  export type ReceiptLineScalarWhereInput = {
    AND?: ReceiptLineScalarWhereInput | ReceiptLineScalarWhereInput[]
    OR?: ReceiptLineScalarWhereInput[]
    NOT?: ReceiptLineScalarWhereInput | ReceiptLineScalarWhereInput[]
    id?: StringFilter<"ReceiptLine"> | string
    tenantId?: StringFilter<"ReceiptLine"> | string
    receiptId?: StringFilter<"ReceiptLine"> | string
    lineNo?: IntFilter<"ReceiptLine"> | number
    itemId?: StringFilter<"ReceiptLine"> | string
    itemCode?: StringNullableFilter<"ReceiptLine"> | string | null
    itemName?: StringNullableFilter<"ReceiptLine"> | string | null
    receivingExpectationId?: StringNullableFilter<"ReceiptLine"> | string | null
    targetLocationId?: StringFilter<"ReceiptLine"> | string
    confirmedQuantity?: StringFilter<"ReceiptLine"> | string
    uom?: StringFilter<"ReceiptLine"> | string
    inventoryStatus?: EnumWmsInventoryStatusFilter<"ReceiptLine"> | $Enums.WmsInventoryStatus
    restrictedReason?: JsonNullableFilter<"ReceiptLine">
    trackingRefs?: JsonFilter<"ReceiptLine">
    physicalDiscrepancy?: JsonNullableFilter<"ReceiptLine">
    evidenceAttachmentRefs?: JsonFilter<"ReceiptLine">
    postedStockLedgerEntryIds?: JsonFilter<"ReceiptLine">
    createdAt?: DateTimeFilter<"ReceiptLine"> | Date | string
    updatedAt?: DateTimeFilter<"ReceiptLine"> | Date | string
  }

  export type ReceiptCreateWithoutLinesInput = {
    id: string
    receiptNo: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonNullValueInput | InputJsonValue
    receiptDate: string
    note?: string | null
    attachmentRefs: JsonNullValueInput | InputJsonValue
    lineCount: number
    postedAt?: Date | string | null
    cancelledAt?: Date | string | null
    cancelReason?: string | null
    postComment?: string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptUncheckedCreateWithoutLinesInput = {
    id: string
    receiptNo: string
    tenantId: string
    orgId?: string | null
    warehouseId: string
    status: $Enums.WmsReceiptStatus
    receiptSourceType: $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds: JsonNullValueInput | InputJsonValue
    receiptDate: string
    note?: string | null
    attachmentRefs: JsonNullValueInput | InputJsonValue
    lineCount: number
    postedAt?: Date | string | null
    cancelledAt?: Date | string | null
    cancelReason?: string | null
    postComment?: string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptCreateOrConnectWithoutLinesInput = {
    where: ReceiptWhereUniqueInput
    create: XOR<ReceiptCreateWithoutLinesInput, ReceiptUncheckedCreateWithoutLinesInput>
  }

  export type ReceiptUpsertWithoutLinesInput = {
    update: XOR<ReceiptUpdateWithoutLinesInput, ReceiptUncheckedUpdateWithoutLinesInput>
    create: XOR<ReceiptCreateWithoutLinesInput, ReceiptUncheckedCreateWithoutLinesInput>
    where?: ReceiptWhereInput
  }

  export type ReceiptUpdateToOneWithWhereWithoutLinesInput = {
    where?: ReceiptWhereInput
    data: XOR<ReceiptUpdateWithoutLinesInput, ReceiptUncheckedUpdateWithoutLinesInput>
  }

  export type ReceiptUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    receiptNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    warehouseId?: StringFieldUpdateOperationsInput | string
    status?: EnumWmsReceiptStatusFieldUpdateOperationsInput | $Enums.WmsReceiptStatus
    receiptSourceType?: EnumWmsReceiptSourceTypeFieldUpdateOperationsInput | $Enums.WmsReceiptSourceType
    referencedReceivingExpectationIds?: JsonNullValueInput | InputJsonValue
    receiptDate?: StringFieldUpdateOperationsInput | string
    note?: NullableStringFieldUpdateOperationsInput | string | null
    attachmentRefs?: JsonNullValueInput | InputJsonValue
    lineCount?: IntFieldUpdateOperationsInput | number
    postedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    postComment?: NullableStringFieldUpdateOperationsInput | string | null
    procurementReceiptSummary?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineCreateManyReceiptInput = {
    id: string
    tenantId: string
    lineNo: number
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    receivingExpectationId?: string | null
    targetLocationId: string
    confirmedQuantity: string
    uom: string
    inventoryStatus: $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds: JsonNullValueInput | InputJsonValue
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceiptLineUpdateWithoutReceiptInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineUncheckedUpdateWithoutReceiptInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceiptLineUncheckedUpdateManyWithoutReceiptInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectationId?: NullableStringFieldUpdateOperationsInput | string | null
    targetLocationId?: StringFieldUpdateOperationsInput | string
    confirmedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    inventoryStatus?: EnumWmsInventoryStatusFieldUpdateOperationsInput | $Enums.WmsInventoryStatus
    restrictedReason?: NullableJsonNullValueInput | InputJsonValue
    trackingRefs?: JsonNullValueInput | InputJsonValue
    physicalDiscrepancy?: NullableJsonNullValueInput | InputJsonValue
    evidenceAttachmentRefs?: JsonNullValueInput | InputJsonValue
    postedStockLedgerEntryIds?: JsonNullValueInput | InputJsonValue
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