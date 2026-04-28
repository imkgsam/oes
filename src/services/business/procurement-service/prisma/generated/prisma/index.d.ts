
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
 * Model ProcurementSequenceCounter
 * 
 */
export type ProcurementSequenceCounter = $Result.DefaultSelection<Prisma.$ProcurementSequenceCounterPayload>
/**
 * Model PurchaseRequest
 * 
 */
export type PurchaseRequest = $Result.DefaultSelection<Prisma.$PurchaseRequestPayload>
/**
 * Model PurchaseRequestLine
 * 
 */
export type PurchaseRequestLine = $Result.DefaultSelection<Prisma.$PurchaseRequestLinePayload>
/**
 * Model PurchaseRequestApprovalSnapshot
 * 
 */
export type PurchaseRequestApprovalSnapshot = $Result.DefaultSelection<Prisma.$PurchaseRequestApprovalSnapshotPayload>
/**
 * Model PurchaseOrder
 * 
 */
export type PurchaseOrder = $Result.DefaultSelection<Prisma.$PurchaseOrderPayload>
/**
 * Model PurchaseOrderLine
 * 
 */
export type PurchaseOrderLine = $Result.DefaultSelection<Prisma.$PurchaseOrderLinePayload>
/**
 * Model PurchaseOrderLineAllocation
 * 
 */
export type PurchaseOrderLineAllocation = $Result.DefaultSelection<Prisma.$PurchaseOrderLineAllocationPayload>
/**
 * Model PurchaseOrderChange
 * 
 */
export type PurchaseOrderChange = $Result.DefaultSelection<Prisma.$PurchaseOrderChangePayload>
/**
 * Model ReceivingExpectation
 * 
 */
export type ReceivingExpectation = $Result.DefaultSelection<Prisma.$ReceivingExpectationPayload>
/**
 * Model ReceivingDiscrepancy
 * 
 */
export type ReceivingDiscrepancy = $Result.DefaultSelection<Prisma.$ReceivingDiscrepancyPayload>
/**
 * Model ProcurementAuditEnvelope
 * 
 */
export type ProcurementAuditEnvelope = $Result.DefaultSelection<Prisma.$ProcurementAuditEnvelopePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ProcurementPurchaseRequestType: {
  DEPARTMENTAL: 'DEPARTMENTAL',
  SALES_DEDICATED: 'SALES_DEDICATED',
  PRODUCTION_PACKAGING: 'PRODUCTION_PACKAGING',
  MAINTENANCE: 'MAINTENANCE',
  SAMPLE: 'SAMPLE'
};

export type ProcurementPurchaseRequestType = (typeof ProcurementPurchaseRequestType)[keyof typeof ProcurementPurchaseRequestType]


export const ProcurementPurchaseRequestStatus: {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

export type ProcurementPurchaseRequestStatus = (typeof ProcurementPurchaseRequestStatus)[keyof typeof ProcurementPurchaseRequestStatus]


export const ProcurementPurchaseRequestLineType: {
  STANDARD_ITEM: 'STANDARD_ITEM',
  TEXT: 'TEXT'
};

export type ProcurementPurchaseRequestLineType = (typeof ProcurementPurchaseRequestLineType)[keyof typeof ProcurementPurchaseRequestLineType]


export const ProcurementPurchaseRequestDecision: {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

export type ProcurementPurchaseRequestDecision = (typeof ProcurementPurchaseRequestDecision)[keyof typeof ProcurementPurchaseRequestDecision]


export const ProcurementPurchaseOrderStatus: {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  CANCELLED: 'CANCELLED'
};

export type ProcurementPurchaseOrderStatus = (typeof ProcurementPurchaseOrderStatus)[keyof typeof ProcurementPurchaseOrderStatus]


export const ProcurementPurchaseOrderLineAllocationType: {
  SALES_ORDER_LINE: 'SALES_ORDER_LINE',
  FULFILLMENT_DEMAND: 'FULFILLMENT_DEMAND',
  GENERAL_STOCK: 'GENERAL_STOCK'
};

export type ProcurementPurchaseOrderLineAllocationType = (typeof ProcurementPurchaseOrderLineAllocationType)[keyof typeof ProcurementPurchaseOrderLineAllocationType]


export const ProcurementSupplierAcknowledgementStatus: {
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED'
};

export type ProcurementSupplierAcknowledgementStatus = (typeof ProcurementSupplierAcknowledgementStatus)[keyof typeof ProcurementSupplierAcknowledgementStatus]


export const ProcurementPurchaseOrderChangeStatus: {
  APPLIED: 'APPLIED'
};

export type ProcurementPurchaseOrderChangeStatus = (typeof ProcurementPurchaseOrderChangeStatus)[keyof typeof ProcurementPurchaseOrderChangeStatus]


export const ProcurementReceivingExpectationStatus: {
  OPEN: 'OPEN',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

export type ProcurementReceivingExpectationStatus = (typeof ProcurementReceivingExpectationStatus)[keyof typeof ProcurementReceivingExpectationStatus]


export const ProcurementReceivingDiscrepancyType: {
  SHORT_RECEIPT: 'SHORT_RECEIPT',
  OVER_RECEIPT: 'OVER_RECEIPT',
  DAMAGED: 'DAMAGED',
  RESTRICTED: 'RESTRICTED',
  OTHER: 'OTHER'
};

export type ProcurementReceivingDiscrepancyType = (typeof ProcurementReceivingDiscrepancyType)[keyof typeof ProcurementReceivingDiscrepancyType]


export const ProcurementReceivingDiscrepancyStatus: {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED'
};

export type ProcurementReceivingDiscrepancyStatus = (typeof ProcurementReceivingDiscrepancyStatus)[keyof typeof ProcurementReceivingDiscrepancyStatus]


export const ProcurementReceivingResolutionCode: {
  WAIT_REDELIVERY: 'WAIT_REDELIVERY',
  ACCEPT_SHORT_CLOSE: 'ACCEPT_SHORT_CLOSE',
  RETURN_OR_REJECT_EXCESS: 'RETURN_OR_REJECT_EXCESS',
  MANUAL_FOLLOW_UP: 'MANUAL_FOLLOW_UP'
};

export type ProcurementReceivingResolutionCode = (typeof ProcurementReceivingResolutionCode)[keyof typeof ProcurementReceivingResolutionCode]

}

export type ProcurementPurchaseRequestType = $Enums.ProcurementPurchaseRequestType

export const ProcurementPurchaseRequestType: typeof $Enums.ProcurementPurchaseRequestType

export type ProcurementPurchaseRequestStatus = $Enums.ProcurementPurchaseRequestStatus

export const ProcurementPurchaseRequestStatus: typeof $Enums.ProcurementPurchaseRequestStatus

export type ProcurementPurchaseRequestLineType = $Enums.ProcurementPurchaseRequestLineType

export const ProcurementPurchaseRequestLineType: typeof $Enums.ProcurementPurchaseRequestLineType

export type ProcurementPurchaseRequestDecision = $Enums.ProcurementPurchaseRequestDecision

export const ProcurementPurchaseRequestDecision: typeof $Enums.ProcurementPurchaseRequestDecision

export type ProcurementPurchaseOrderStatus = $Enums.ProcurementPurchaseOrderStatus

export const ProcurementPurchaseOrderStatus: typeof $Enums.ProcurementPurchaseOrderStatus

export type ProcurementPurchaseOrderLineAllocationType = $Enums.ProcurementPurchaseOrderLineAllocationType

export const ProcurementPurchaseOrderLineAllocationType: typeof $Enums.ProcurementPurchaseOrderLineAllocationType

export type ProcurementSupplierAcknowledgementStatus = $Enums.ProcurementSupplierAcknowledgementStatus

export const ProcurementSupplierAcknowledgementStatus: typeof $Enums.ProcurementSupplierAcknowledgementStatus

export type ProcurementPurchaseOrderChangeStatus = $Enums.ProcurementPurchaseOrderChangeStatus

export const ProcurementPurchaseOrderChangeStatus: typeof $Enums.ProcurementPurchaseOrderChangeStatus

export type ProcurementReceivingExpectationStatus = $Enums.ProcurementReceivingExpectationStatus

export const ProcurementReceivingExpectationStatus: typeof $Enums.ProcurementReceivingExpectationStatus

export type ProcurementReceivingDiscrepancyType = $Enums.ProcurementReceivingDiscrepancyType

export const ProcurementReceivingDiscrepancyType: typeof $Enums.ProcurementReceivingDiscrepancyType

export type ProcurementReceivingDiscrepancyStatus = $Enums.ProcurementReceivingDiscrepancyStatus

export const ProcurementReceivingDiscrepancyStatus: typeof $Enums.ProcurementReceivingDiscrepancyStatus

export type ProcurementReceivingResolutionCode = $Enums.ProcurementReceivingResolutionCode

export const ProcurementReceivingResolutionCode: typeof $Enums.ProcurementReceivingResolutionCode

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ProcurementSequenceCounters
 * const procurementSequenceCounters = await prisma.procurementSequenceCounter.findMany()
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
   * // Fetch zero or more ProcurementSequenceCounters
   * const procurementSequenceCounters = await prisma.procurementSequenceCounter.findMany()
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
   * `prisma.procurementSequenceCounter`: Exposes CRUD operations for the **ProcurementSequenceCounter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProcurementSequenceCounters
    * const procurementSequenceCounters = await prisma.procurementSequenceCounter.findMany()
    * ```
    */
  get procurementSequenceCounter(): Prisma.ProcurementSequenceCounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseRequest`: Exposes CRUD operations for the **PurchaseRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseRequests
    * const purchaseRequests = await prisma.purchaseRequest.findMany()
    * ```
    */
  get purchaseRequest(): Prisma.PurchaseRequestDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseRequestLine`: Exposes CRUD operations for the **PurchaseRequestLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseRequestLines
    * const purchaseRequestLines = await prisma.purchaseRequestLine.findMany()
    * ```
    */
  get purchaseRequestLine(): Prisma.PurchaseRequestLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseRequestApprovalSnapshot`: Exposes CRUD operations for the **PurchaseRequestApprovalSnapshot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseRequestApprovalSnapshots
    * const purchaseRequestApprovalSnapshots = await prisma.purchaseRequestApprovalSnapshot.findMany()
    * ```
    */
  get purchaseRequestApprovalSnapshot(): Prisma.PurchaseRequestApprovalSnapshotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseOrder`: Exposes CRUD operations for the **PurchaseOrder** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseOrders
    * const purchaseOrders = await prisma.purchaseOrder.findMany()
    * ```
    */
  get purchaseOrder(): Prisma.PurchaseOrderDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseOrderLine`: Exposes CRUD operations for the **PurchaseOrderLine** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseOrderLines
    * const purchaseOrderLines = await prisma.purchaseOrderLine.findMany()
    * ```
    */
  get purchaseOrderLine(): Prisma.PurchaseOrderLineDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseOrderLineAllocation`: Exposes CRUD operations for the **PurchaseOrderLineAllocation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseOrderLineAllocations
    * const purchaseOrderLineAllocations = await prisma.purchaseOrderLineAllocation.findMany()
    * ```
    */
  get purchaseOrderLineAllocation(): Prisma.PurchaseOrderLineAllocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.purchaseOrderChange`: Exposes CRUD operations for the **PurchaseOrderChange** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PurchaseOrderChanges
    * const purchaseOrderChanges = await prisma.purchaseOrderChange.findMany()
    * ```
    */
  get purchaseOrderChange(): Prisma.PurchaseOrderChangeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.receivingExpectation`: Exposes CRUD operations for the **ReceivingExpectation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReceivingExpectations
    * const receivingExpectations = await prisma.receivingExpectation.findMany()
    * ```
    */
  get receivingExpectation(): Prisma.ReceivingExpectationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.receivingDiscrepancy`: Exposes CRUD operations for the **ReceivingDiscrepancy** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReceivingDiscrepancies
    * const receivingDiscrepancies = await prisma.receivingDiscrepancy.findMany()
    * ```
    */
  get receivingDiscrepancy(): Prisma.ReceivingDiscrepancyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.procurementAuditEnvelope`: Exposes CRUD operations for the **ProcurementAuditEnvelope** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ProcurementAuditEnvelopes
    * const procurementAuditEnvelopes = await prisma.procurementAuditEnvelope.findMany()
    * ```
    */
  get procurementAuditEnvelope(): Prisma.ProcurementAuditEnvelopeDelegate<ExtArgs, ClientOptions>;
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
    ProcurementSequenceCounter: 'ProcurementSequenceCounter',
    PurchaseRequest: 'PurchaseRequest',
    PurchaseRequestLine: 'PurchaseRequestLine',
    PurchaseRequestApprovalSnapshot: 'PurchaseRequestApprovalSnapshot',
    PurchaseOrder: 'PurchaseOrder',
    PurchaseOrderLine: 'PurchaseOrderLine',
    PurchaseOrderLineAllocation: 'PurchaseOrderLineAllocation',
    PurchaseOrderChange: 'PurchaseOrderChange',
    ReceivingExpectation: 'ReceivingExpectation',
    ReceivingDiscrepancy: 'ReceivingDiscrepancy',
    ProcurementAuditEnvelope: 'ProcurementAuditEnvelope'
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
      modelProps: "procurementSequenceCounter" | "purchaseRequest" | "purchaseRequestLine" | "purchaseRequestApprovalSnapshot" | "purchaseOrder" | "purchaseOrderLine" | "purchaseOrderLineAllocation" | "purchaseOrderChange" | "receivingExpectation" | "receivingDiscrepancy" | "procurementAuditEnvelope"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ProcurementSequenceCounter: {
        payload: Prisma.$ProcurementSequenceCounterPayload<ExtArgs>
        fields: Prisma.ProcurementSequenceCounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProcurementSequenceCounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProcurementSequenceCounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          findFirst: {
            args: Prisma.ProcurementSequenceCounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProcurementSequenceCounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          findMany: {
            args: Prisma.ProcurementSequenceCounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>[]
          }
          create: {
            args: Prisma.ProcurementSequenceCounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          createMany: {
            args: Prisma.ProcurementSequenceCounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProcurementSequenceCounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>[]
          }
          delete: {
            args: Prisma.ProcurementSequenceCounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          update: {
            args: Prisma.ProcurementSequenceCounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          deleteMany: {
            args: Prisma.ProcurementSequenceCounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProcurementSequenceCounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProcurementSequenceCounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>[]
          }
          upsert: {
            args: Prisma.ProcurementSequenceCounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementSequenceCounterPayload>
          }
          aggregate: {
            args: Prisma.ProcurementSequenceCounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProcurementSequenceCounter>
          }
          groupBy: {
            args: Prisma.ProcurementSequenceCounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProcurementSequenceCounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProcurementSequenceCounterCountArgs<ExtArgs>
            result: $Utils.Optional<ProcurementSequenceCounterCountAggregateOutputType> | number
          }
        }
      }
      PurchaseRequest: {
        payload: Prisma.$PurchaseRequestPayload<ExtArgs>
        fields: Prisma.PurchaseRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          findFirst: {
            args: Prisma.PurchaseRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          findMany: {
            args: Prisma.PurchaseRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>[]
          }
          create: {
            args: Prisma.PurchaseRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          createMany: {
            args: Prisma.PurchaseRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>[]
          }
          delete: {
            args: Prisma.PurchaseRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          update: {
            args: Prisma.PurchaseRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          deleteMany: {
            args: Prisma.PurchaseRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseRequestUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>[]
          }
          upsert: {
            args: Prisma.PurchaseRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestPayload>
          }
          aggregate: {
            args: Prisma.PurchaseRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseRequest>
          }
          groupBy: {
            args: Prisma.PurchaseRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseRequestCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestCountAggregateOutputType> | number
          }
        }
      }
      PurchaseRequestLine: {
        payload: Prisma.$PurchaseRequestLinePayload<ExtArgs>
        fields: Prisma.PurchaseRequestLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseRequestLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseRequestLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          findFirst: {
            args: Prisma.PurchaseRequestLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseRequestLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          findMany: {
            args: Prisma.PurchaseRequestLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>[]
          }
          create: {
            args: Prisma.PurchaseRequestLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          createMany: {
            args: Prisma.PurchaseRequestLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseRequestLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>[]
          }
          delete: {
            args: Prisma.PurchaseRequestLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          update: {
            args: Prisma.PurchaseRequestLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          deleteMany: {
            args: Prisma.PurchaseRequestLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseRequestLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseRequestLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>[]
          }
          upsert: {
            args: Prisma.PurchaseRequestLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestLinePayload>
          }
          aggregate: {
            args: Prisma.PurchaseRequestLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseRequestLine>
          }
          groupBy: {
            args: Prisma.PurchaseRequestLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseRequestLineCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestLineCountAggregateOutputType> | number
          }
        }
      }
      PurchaseRequestApprovalSnapshot: {
        payload: Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>
        fields: Prisma.PurchaseRequestApprovalSnapshotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseRequestApprovalSnapshotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseRequestApprovalSnapshotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          findFirst: {
            args: Prisma.PurchaseRequestApprovalSnapshotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseRequestApprovalSnapshotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          findMany: {
            args: Prisma.PurchaseRequestApprovalSnapshotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>[]
          }
          create: {
            args: Prisma.PurchaseRequestApprovalSnapshotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          createMany: {
            args: Prisma.PurchaseRequestApprovalSnapshotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseRequestApprovalSnapshotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>[]
          }
          delete: {
            args: Prisma.PurchaseRequestApprovalSnapshotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          update: {
            args: Prisma.PurchaseRequestApprovalSnapshotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          deleteMany: {
            args: Prisma.PurchaseRequestApprovalSnapshotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseRequestApprovalSnapshotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseRequestApprovalSnapshotUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>[]
          }
          upsert: {
            args: Prisma.PurchaseRequestApprovalSnapshotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseRequestApprovalSnapshotPayload>
          }
          aggregate: {
            args: Prisma.PurchaseRequestApprovalSnapshotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseRequestApprovalSnapshot>
          }
          groupBy: {
            args: Prisma.PurchaseRequestApprovalSnapshotGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestApprovalSnapshotGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseRequestApprovalSnapshotCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseRequestApprovalSnapshotCountAggregateOutputType> | number
          }
        }
      }
      PurchaseOrder: {
        payload: Prisma.$PurchaseOrderPayload<ExtArgs>
        fields: Prisma.PurchaseOrderFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseOrderFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseOrderFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          findFirst: {
            args: Prisma.PurchaseOrderFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseOrderFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          findMany: {
            args: Prisma.PurchaseOrderFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>[]
          }
          create: {
            args: Prisma.PurchaseOrderCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          createMany: {
            args: Prisma.PurchaseOrderCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseOrderCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>[]
          }
          delete: {
            args: Prisma.PurchaseOrderDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          update: {
            args: Prisma.PurchaseOrderUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          deleteMany: {
            args: Prisma.PurchaseOrderDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseOrderUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseOrderUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>[]
          }
          upsert: {
            args: Prisma.PurchaseOrderUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderPayload>
          }
          aggregate: {
            args: Prisma.PurchaseOrderAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseOrder>
          }
          groupBy: {
            args: Prisma.PurchaseOrderGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseOrderCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderCountAggregateOutputType> | number
          }
        }
      }
      PurchaseOrderLine: {
        payload: Prisma.$PurchaseOrderLinePayload<ExtArgs>
        fields: Prisma.PurchaseOrderLineFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseOrderLineFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseOrderLineFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          findFirst: {
            args: Prisma.PurchaseOrderLineFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseOrderLineFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          findMany: {
            args: Prisma.PurchaseOrderLineFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>[]
          }
          create: {
            args: Prisma.PurchaseOrderLineCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          createMany: {
            args: Prisma.PurchaseOrderLineCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseOrderLineCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>[]
          }
          delete: {
            args: Prisma.PurchaseOrderLineDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          update: {
            args: Prisma.PurchaseOrderLineUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          deleteMany: {
            args: Prisma.PurchaseOrderLineDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseOrderLineUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseOrderLineUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>[]
          }
          upsert: {
            args: Prisma.PurchaseOrderLineUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLinePayload>
          }
          aggregate: {
            args: Prisma.PurchaseOrderLineAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseOrderLine>
          }
          groupBy: {
            args: Prisma.PurchaseOrderLineGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderLineGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseOrderLineCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderLineCountAggregateOutputType> | number
          }
        }
      }
      PurchaseOrderLineAllocation: {
        payload: Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>
        fields: Prisma.PurchaseOrderLineAllocationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseOrderLineAllocationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseOrderLineAllocationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          findFirst: {
            args: Prisma.PurchaseOrderLineAllocationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseOrderLineAllocationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          findMany: {
            args: Prisma.PurchaseOrderLineAllocationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>[]
          }
          create: {
            args: Prisma.PurchaseOrderLineAllocationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          createMany: {
            args: Prisma.PurchaseOrderLineAllocationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseOrderLineAllocationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>[]
          }
          delete: {
            args: Prisma.PurchaseOrderLineAllocationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          update: {
            args: Prisma.PurchaseOrderLineAllocationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          deleteMany: {
            args: Prisma.PurchaseOrderLineAllocationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseOrderLineAllocationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseOrderLineAllocationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>[]
          }
          upsert: {
            args: Prisma.PurchaseOrderLineAllocationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderLineAllocationPayload>
          }
          aggregate: {
            args: Prisma.PurchaseOrderLineAllocationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseOrderLineAllocation>
          }
          groupBy: {
            args: Prisma.PurchaseOrderLineAllocationGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderLineAllocationGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseOrderLineAllocationCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderLineAllocationCountAggregateOutputType> | number
          }
        }
      }
      PurchaseOrderChange: {
        payload: Prisma.$PurchaseOrderChangePayload<ExtArgs>
        fields: Prisma.PurchaseOrderChangeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PurchaseOrderChangeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PurchaseOrderChangeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          findFirst: {
            args: Prisma.PurchaseOrderChangeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PurchaseOrderChangeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          findMany: {
            args: Prisma.PurchaseOrderChangeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>[]
          }
          create: {
            args: Prisma.PurchaseOrderChangeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          createMany: {
            args: Prisma.PurchaseOrderChangeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PurchaseOrderChangeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>[]
          }
          delete: {
            args: Prisma.PurchaseOrderChangeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          update: {
            args: Prisma.PurchaseOrderChangeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          deleteMany: {
            args: Prisma.PurchaseOrderChangeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PurchaseOrderChangeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PurchaseOrderChangeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>[]
          }
          upsert: {
            args: Prisma.PurchaseOrderChangeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PurchaseOrderChangePayload>
          }
          aggregate: {
            args: Prisma.PurchaseOrderChangeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePurchaseOrderChange>
          }
          groupBy: {
            args: Prisma.PurchaseOrderChangeGroupByArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderChangeGroupByOutputType>[]
          }
          count: {
            args: Prisma.PurchaseOrderChangeCountArgs<ExtArgs>
            result: $Utils.Optional<PurchaseOrderChangeCountAggregateOutputType> | number
          }
        }
      }
      ReceivingExpectation: {
        payload: Prisma.$ReceivingExpectationPayload<ExtArgs>
        fields: Prisma.ReceivingExpectationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReceivingExpectationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReceivingExpectationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          findFirst: {
            args: Prisma.ReceivingExpectationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReceivingExpectationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          findMany: {
            args: Prisma.ReceivingExpectationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>[]
          }
          create: {
            args: Prisma.ReceivingExpectationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          createMany: {
            args: Prisma.ReceivingExpectationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReceivingExpectationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>[]
          }
          delete: {
            args: Prisma.ReceivingExpectationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          update: {
            args: Prisma.ReceivingExpectationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          deleteMany: {
            args: Prisma.ReceivingExpectationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReceivingExpectationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReceivingExpectationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>[]
          }
          upsert: {
            args: Prisma.ReceivingExpectationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingExpectationPayload>
          }
          aggregate: {
            args: Prisma.ReceivingExpectationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReceivingExpectation>
          }
          groupBy: {
            args: Prisma.ReceivingExpectationGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReceivingExpectationGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReceivingExpectationCountArgs<ExtArgs>
            result: $Utils.Optional<ReceivingExpectationCountAggregateOutputType> | number
          }
        }
      }
      ReceivingDiscrepancy: {
        payload: Prisma.$ReceivingDiscrepancyPayload<ExtArgs>
        fields: Prisma.ReceivingDiscrepancyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReceivingDiscrepancyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReceivingDiscrepancyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          findFirst: {
            args: Prisma.ReceivingDiscrepancyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReceivingDiscrepancyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          findMany: {
            args: Prisma.ReceivingDiscrepancyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>[]
          }
          create: {
            args: Prisma.ReceivingDiscrepancyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          createMany: {
            args: Prisma.ReceivingDiscrepancyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReceivingDiscrepancyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>[]
          }
          delete: {
            args: Prisma.ReceivingDiscrepancyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          update: {
            args: Prisma.ReceivingDiscrepancyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          deleteMany: {
            args: Prisma.ReceivingDiscrepancyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReceivingDiscrepancyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReceivingDiscrepancyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>[]
          }
          upsert: {
            args: Prisma.ReceivingDiscrepancyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivingDiscrepancyPayload>
          }
          aggregate: {
            args: Prisma.ReceivingDiscrepancyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReceivingDiscrepancy>
          }
          groupBy: {
            args: Prisma.ReceivingDiscrepancyGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReceivingDiscrepancyGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReceivingDiscrepancyCountArgs<ExtArgs>
            result: $Utils.Optional<ReceivingDiscrepancyCountAggregateOutputType> | number
          }
        }
      }
      ProcurementAuditEnvelope: {
        payload: Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>
        fields: Prisma.ProcurementAuditEnvelopeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProcurementAuditEnvelopeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProcurementAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          findFirst: {
            args: Prisma.ProcurementAuditEnvelopeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProcurementAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          findMany: {
            args: Prisma.ProcurementAuditEnvelopeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>[]
          }
          create: {
            args: Prisma.ProcurementAuditEnvelopeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          createMany: {
            args: Prisma.ProcurementAuditEnvelopeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProcurementAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>[]
          }
          delete: {
            args: Prisma.ProcurementAuditEnvelopeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          update: {
            args: Prisma.ProcurementAuditEnvelopeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          deleteMany: {
            args: Prisma.ProcurementAuditEnvelopeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProcurementAuditEnvelopeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProcurementAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>[]
          }
          upsert: {
            args: Prisma.ProcurementAuditEnvelopeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProcurementAuditEnvelopePayload>
          }
          aggregate: {
            args: Prisma.ProcurementAuditEnvelopeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProcurementAuditEnvelope>
          }
          groupBy: {
            args: Prisma.ProcurementAuditEnvelopeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProcurementAuditEnvelopeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProcurementAuditEnvelopeCountArgs<ExtArgs>
            result: $Utils.Optional<ProcurementAuditEnvelopeCountAggregateOutputType> | number
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
    procurementSequenceCounter?: ProcurementSequenceCounterOmit
    purchaseRequest?: PurchaseRequestOmit
    purchaseRequestLine?: PurchaseRequestLineOmit
    purchaseRequestApprovalSnapshot?: PurchaseRequestApprovalSnapshotOmit
    purchaseOrder?: PurchaseOrderOmit
    purchaseOrderLine?: PurchaseOrderLineOmit
    purchaseOrderLineAllocation?: PurchaseOrderLineAllocationOmit
    purchaseOrderChange?: PurchaseOrderChangeOmit
    receivingExpectation?: ReceivingExpectationOmit
    receivingDiscrepancy?: ReceivingDiscrepancyOmit
    procurementAuditEnvelope?: ProcurementAuditEnvelopeOmit
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
   * Count Type PurchaseRequestCountOutputType
   */

  export type PurchaseRequestCountOutputType = {
    lines: number
  }

  export type PurchaseRequestCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | PurchaseRequestCountOutputTypeCountLinesArgs
  }

  // Custom InputTypes
  /**
   * PurchaseRequestCountOutputType without action
   */
  export type PurchaseRequestCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestCountOutputType
     */
    select?: PurchaseRequestCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PurchaseRequestCountOutputType without action
   */
  export type PurchaseRequestCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseRequestLineWhereInput
  }


  /**
   * Count Type PurchaseOrderCountOutputType
   */

  export type PurchaseOrderCountOutputType = {
    lines: number
    changes: number
    receivingExpectations: number
  }

  export type PurchaseOrderCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | PurchaseOrderCountOutputTypeCountLinesArgs
    changes?: boolean | PurchaseOrderCountOutputTypeCountChangesArgs
    receivingExpectations?: boolean | PurchaseOrderCountOutputTypeCountReceivingExpectationsArgs
  }

  // Custom InputTypes
  /**
   * PurchaseOrderCountOutputType without action
   */
  export type PurchaseOrderCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderCountOutputType
     */
    select?: PurchaseOrderCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PurchaseOrderCountOutputType without action
   */
  export type PurchaseOrderCountOutputTypeCountLinesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderLineWhereInput
  }

  /**
   * PurchaseOrderCountOutputType without action
   */
  export type PurchaseOrderCountOutputTypeCountChangesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderChangeWhereInput
  }

  /**
   * PurchaseOrderCountOutputType without action
   */
  export type PurchaseOrderCountOutputTypeCountReceivingExpectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceivingExpectationWhereInput
  }


  /**
   * Count Type PurchaseOrderLineCountOutputType
   */

  export type PurchaseOrderLineCountOutputType = {
    allocations: number
    receivingExpectations: number
  }

  export type PurchaseOrderLineCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    allocations?: boolean | PurchaseOrderLineCountOutputTypeCountAllocationsArgs
    receivingExpectations?: boolean | PurchaseOrderLineCountOutputTypeCountReceivingExpectationsArgs
  }

  // Custom InputTypes
  /**
   * PurchaseOrderLineCountOutputType without action
   */
  export type PurchaseOrderLineCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineCountOutputType
     */
    select?: PurchaseOrderLineCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PurchaseOrderLineCountOutputType without action
   */
  export type PurchaseOrderLineCountOutputTypeCountAllocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderLineAllocationWhereInput
  }

  /**
   * PurchaseOrderLineCountOutputType without action
   */
  export type PurchaseOrderLineCountOutputTypeCountReceivingExpectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceivingExpectationWhereInput
  }


  /**
   * Models
   */

  /**
   * Model ProcurementSequenceCounter
   */

  export type AggregateProcurementSequenceCounter = {
    _count: ProcurementSequenceCounterCountAggregateOutputType | null
    _avg: ProcurementSequenceCounterAvgAggregateOutputType | null
    _sum: ProcurementSequenceCounterSumAggregateOutputType | null
    _min: ProcurementSequenceCounterMinAggregateOutputType | null
    _max: ProcurementSequenceCounterMaxAggregateOutputType | null
  }

  export type ProcurementSequenceCounterAvgAggregateOutputType = {
    nextPurchaseRequestNo: number | null
    nextPurchaseOrderNo: number | null
    nextReceivingExpectationNo: number | null
  }

  export type ProcurementSequenceCounterSumAggregateOutputType = {
    nextPurchaseRequestNo: number | null
    nextPurchaseOrderNo: number | null
    nextReceivingExpectationNo: number | null
  }

  export type ProcurementSequenceCounterMinAggregateOutputType = {
    tenantId: string | null
    nextPurchaseRequestNo: number | null
    nextPurchaseOrderNo: number | null
    nextReceivingExpectationNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProcurementSequenceCounterMaxAggregateOutputType = {
    tenantId: string | null
    nextPurchaseRequestNo: number | null
    nextPurchaseOrderNo: number | null
    nextReceivingExpectationNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ProcurementSequenceCounterCountAggregateOutputType = {
    tenantId: number
    nextPurchaseRequestNo: number
    nextPurchaseOrderNo: number
    nextReceivingExpectationNo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ProcurementSequenceCounterAvgAggregateInputType = {
    nextPurchaseRequestNo?: true
    nextPurchaseOrderNo?: true
    nextReceivingExpectationNo?: true
  }

  export type ProcurementSequenceCounterSumAggregateInputType = {
    nextPurchaseRequestNo?: true
    nextPurchaseOrderNo?: true
    nextReceivingExpectationNo?: true
  }

  export type ProcurementSequenceCounterMinAggregateInputType = {
    tenantId?: true
    nextPurchaseRequestNo?: true
    nextPurchaseOrderNo?: true
    nextReceivingExpectationNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProcurementSequenceCounterMaxAggregateInputType = {
    tenantId?: true
    nextPurchaseRequestNo?: true
    nextPurchaseOrderNo?: true
    nextReceivingExpectationNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ProcurementSequenceCounterCountAggregateInputType = {
    tenantId?: true
    nextPurchaseRequestNo?: true
    nextPurchaseOrderNo?: true
    nextReceivingExpectationNo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ProcurementSequenceCounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProcurementSequenceCounter to aggregate.
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementSequenceCounters to fetch.
     */
    orderBy?: ProcurementSequenceCounterOrderByWithRelationInput | ProcurementSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProcurementSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProcurementSequenceCounters
    **/
    _count?: true | ProcurementSequenceCounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProcurementSequenceCounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProcurementSequenceCounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProcurementSequenceCounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProcurementSequenceCounterMaxAggregateInputType
  }

  export type GetProcurementSequenceCounterAggregateType<T extends ProcurementSequenceCounterAggregateArgs> = {
        [P in keyof T & keyof AggregateProcurementSequenceCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProcurementSequenceCounter[P]>
      : GetScalarType<T[P], AggregateProcurementSequenceCounter[P]>
  }




  export type ProcurementSequenceCounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProcurementSequenceCounterWhereInput
    orderBy?: ProcurementSequenceCounterOrderByWithAggregationInput | ProcurementSequenceCounterOrderByWithAggregationInput[]
    by: ProcurementSequenceCounterScalarFieldEnum[] | ProcurementSequenceCounterScalarFieldEnum
    having?: ProcurementSequenceCounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProcurementSequenceCounterCountAggregateInputType | true
    _avg?: ProcurementSequenceCounterAvgAggregateInputType
    _sum?: ProcurementSequenceCounterSumAggregateInputType
    _min?: ProcurementSequenceCounterMinAggregateInputType
    _max?: ProcurementSequenceCounterMaxAggregateInputType
  }

  export type ProcurementSequenceCounterGroupByOutputType = {
    tenantId: string
    nextPurchaseRequestNo: number
    nextPurchaseOrderNo: number
    nextReceivingExpectationNo: number
    createdAt: Date
    updatedAt: Date
    _count: ProcurementSequenceCounterCountAggregateOutputType | null
    _avg: ProcurementSequenceCounterAvgAggregateOutputType | null
    _sum: ProcurementSequenceCounterSumAggregateOutputType | null
    _min: ProcurementSequenceCounterMinAggregateOutputType | null
    _max: ProcurementSequenceCounterMaxAggregateOutputType | null
  }

  type GetProcurementSequenceCounterGroupByPayload<T extends ProcurementSequenceCounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProcurementSequenceCounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProcurementSequenceCounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProcurementSequenceCounterGroupByOutputType[P]>
            : GetScalarType<T[P], ProcurementSequenceCounterGroupByOutputType[P]>
        }
      >
    >


  export type ProcurementSequenceCounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextPurchaseRequestNo?: boolean
    nextPurchaseOrderNo?: boolean
    nextReceivingExpectationNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["procurementSequenceCounter"]>

  export type ProcurementSequenceCounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextPurchaseRequestNo?: boolean
    nextPurchaseOrderNo?: boolean
    nextReceivingExpectationNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["procurementSequenceCounter"]>

  export type ProcurementSequenceCounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextPurchaseRequestNo?: boolean
    nextPurchaseOrderNo?: boolean
    nextReceivingExpectationNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["procurementSequenceCounter"]>

  export type ProcurementSequenceCounterSelectScalar = {
    tenantId?: boolean
    nextPurchaseRequestNo?: boolean
    nextPurchaseOrderNo?: boolean
    nextReceivingExpectationNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ProcurementSequenceCounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenantId" | "nextPurchaseRequestNo" | "nextPurchaseOrderNo" | "nextReceivingExpectationNo" | "createdAt" | "updatedAt", ExtArgs["result"]["procurementSequenceCounter"]>

  export type $ProcurementSequenceCounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProcurementSequenceCounter"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenantId: string
      nextPurchaseRequestNo: number
      nextPurchaseOrderNo: number
      nextReceivingExpectationNo: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["procurementSequenceCounter"]>
    composites: {}
  }

  type ProcurementSequenceCounterGetPayload<S extends boolean | null | undefined | ProcurementSequenceCounterDefaultArgs> = $Result.GetResult<Prisma.$ProcurementSequenceCounterPayload, S>

  type ProcurementSequenceCounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProcurementSequenceCounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProcurementSequenceCounterCountAggregateInputType | true
    }

  export interface ProcurementSequenceCounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProcurementSequenceCounter'], meta: { name: 'ProcurementSequenceCounter' } }
    /**
     * Find zero or one ProcurementSequenceCounter that matches the filter.
     * @param {ProcurementSequenceCounterFindUniqueArgs} args - Arguments to find a ProcurementSequenceCounter
     * @example
     * // Get one ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProcurementSequenceCounterFindUniqueArgs>(args: SelectSubset<T, ProcurementSequenceCounterFindUniqueArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ProcurementSequenceCounter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProcurementSequenceCounterFindUniqueOrThrowArgs} args - Arguments to find a ProcurementSequenceCounter
     * @example
     * // Get one ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProcurementSequenceCounterFindUniqueOrThrowArgs>(args: SelectSubset<T, ProcurementSequenceCounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ProcurementSequenceCounter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterFindFirstArgs} args - Arguments to find a ProcurementSequenceCounter
     * @example
     * // Get one ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProcurementSequenceCounterFindFirstArgs>(args?: SelectSubset<T, ProcurementSequenceCounterFindFirstArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ProcurementSequenceCounter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterFindFirstOrThrowArgs} args - Arguments to find a ProcurementSequenceCounter
     * @example
     * // Get one ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProcurementSequenceCounterFindFirstOrThrowArgs>(args?: SelectSubset<T, ProcurementSequenceCounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ProcurementSequenceCounters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProcurementSequenceCounters
     * const procurementSequenceCounters = await prisma.procurementSequenceCounter.findMany()
     * 
     * // Get first 10 ProcurementSequenceCounters
     * const procurementSequenceCounters = await prisma.procurementSequenceCounter.findMany({ take: 10 })
     * 
     * // Only select the `tenantId`
     * const procurementSequenceCounterWithTenantIdOnly = await prisma.procurementSequenceCounter.findMany({ select: { tenantId: true } })
     * 
     */
    findMany<T extends ProcurementSequenceCounterFindManyArgs>(args?: SelectSubset<T, ProcurementSequenceCounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ProcurementSequenceCounter.
     * @param {ProcurementSequenceCounterCreateArgs} args - Arguments to create a ProcurementSequenceCounter.
     * @example
     * // Create one ProcurementSequenceCounter
     * const ProcurementSequenceCounter = await prisma.procurementSequenceCounter.create({
     *   data: {
     *     // ... data to create a ProcurementSequenceCounter
     *   }
     * })
     * 
     */
    create<T extends ProcurementSequenceCounterCreateArgs>(args: SelectSubset<T, ProcurementSequenceCounterCreateArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ProcurementSequenceCounters.
     * @param {ProcurementSequenceCounterCreateManyArgs} args - Arguments to create many ProcurementSequenceCounters.
     * @example
     * // Create many ProcurementSequenceCounters
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProcurementSequenceCounterCreateManyArgs>(args?: SelectSubset<T, ProcurementSequenceCounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProcurementSequenceCounters and returns the data saved in the database.
     * @param {ProcurementSequenceCounterCreateManyAndReturnArgs} args - Arguments to create many ProcurementSequenceCounters.
     * @example
     * // Create many ProcurementSequenceCounters
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProcurementSequenceCounters and only return the `tenantId`
     * const procurementSequenceCounterWithTenantIdOnly = await prisma.procurementSequenceCounter.createManyAndReturn({
     *   select: { tenantId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProcurementSequenceCounterCreateManyAndReturnArgs>(args?: SelectSubset<T, ProcurementSequenceCounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ProcurementSequenceCounter.
     * @param {ProcurementSequenceCounterDeleteArgs} args - Arguments to delete one ProcurementSequenceCounter.
     * @example
     * // Delete one ProcurementSequenceCounter
     * const ProcurementSequenceCounter = await prisma.procurementSequenceCounter.delete({
     *   where: {
     *     // ... filter to delete one ProcurementSequenceCounter
     *   }
     * })
     * 
     */
    delete<T extends ProcurementSequenceCounterDeleteArgs>(args: SelectSubset<T, ProcurementSequenceCounterDeleteArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ProcurementSequenceCounter.
     * @param {ProcurementSequenceCounterUpdateArgs} args - Arguments to update one ProcurementSequenceCounter.
     * @example
     * // Update one ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProcurementSequenceCounterUpdateArgs>(args: SelectSubset<T, ProcurementSequenceCounterUpdateArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ProcurementSequenceCounters.
     * @param {ProcurementSequenceCounterDeleteManyArgs} args - Arguments to filter ProcurementSequenceCounters to delete.
     * @example
     * // Delete a few ProcurementSequenceCounters
     * const { count } = await prisma.procurementSequenceCounter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProcurementSequenceCounterDeleteManyArgs>(args?: SelectSubset<T, ProcurementSequenceCounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProcurementSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProcurementSequenceCounters
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProcurementSequenceCounterUpdateManyArgs>(args: SelectSubset<T, ProcurementSequenceCounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProcurementSequenceCounters and returns the data updated in the database.
     * @param {ProcurementSequenceCounterUpdateManyAndReturnArgs} args - Arguments to update many ProcurementSequenceCounters.
     * @example
     * // Update many ProcurementSequenceCounters
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProcurementSequenceCounters and only return the `tenantId`
     * const procurementSequenceCounterWithTenantIdOnly = await prisma.procurementSequenceCounter.updateManyAndReturn({
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
    updateManyAndReturn<T extends ProcurementSequenceCounterUpdateManyAndReturnArgs>(args: SelectSubset<T, ProcurementSequenceCounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ProcurementSequenceCounter.
     * @param {ProcurementSequenceCounterUpsertArgs} args - Arguments to update or create a ProcurementSequenceCounter.
     * @example
     * // Update or create a ProcurementSequenceCounter
     * const procurementSequenceCounter = await prisma.procurementSequenceCounter.upsert({
     *   create: {
     *     // ... data to create a ProcurementSequenceCounter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProcurementSequenceCounter we want to update
     *   }
     * })
     */
    upsert<T extends ProcurementSequenceCounterUpsertArgs>(args: SelectSubset<T, ProcurementSequenceCounterUpsertArgs<ExtArgs>>): Prisma__ProcurementSequenceCounterClient<$Result.GetResult<Prisma.$ProcurementSequenceCounterPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ProcurementSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterCountArgs} args - Arguments to filter ProcurementSequenceCounters to count.
     * @example
     * // Count the number of ProcurementSequenceCounters
     * const count = await prisma.procurementSequenceCounter.count({
     *   where: {
     *     // ... the filter for the ProcurementSequenceCounters we want to count
     *   }
     * })
    **/
    count<T extends ProcurementSequenceCounterCountArgs>(
      args?: Subset<T, ProcurementSequenceCounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProcurementSequenceCounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProcurementSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ProcurementSequenceCounterAggregateArgs>(args: Subset<T, ProcurementSequenceCounterAggregateArgs>): Prisma.PrismaPromise<GetProcurementSequenceCounterAggregateType<T>>

    /**
     * Group by ProcurementSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementSequenceCounterGroupByArgs} args - Group by arguments.
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
      T extends ProcurementSequenceCounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProcurementSequenceCounterGroupByArgs['orderBy'] }
        : { orderBy?: ProcurementSequenceCounterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ProcurementSequenceCounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProcurementSequenceCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProcurementSequenceCounter model
   */
  readonly fields: ProcurementSequenceCounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProcurementSequenceCounter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProcurementSequenceCounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ProcurementSequenceCounter model
   */ 
  interface ProcurementSequenceCounterFieldRefs {
    readonly tenantId: FieldRef<"ProcurementSequenceCounter", 'String'>
    readonly nextPurchaseRequestNo: FieldRef<"ProcurementSequenceCounter", 'Int'>
    readonly nextPurchaseOrderNo: FieldRef<"ProcurementSequenceCounter", 'Int'>
    readonly nextReceivingExpectationNo: FieldRef<"ProcurementSequenceCounter", 'Int'>
    readonly createdAt: FieldRef<"ProcurementSequenceCounter", 'DateTime'>
    readonly updatedAt: FieldRef<"ProcurementSequenceCounter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProcurementSequenceCounter findUnique
   */
  export type ProcurementSequenceCounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementSequenceCounter to fetch.
     */
    where: ProcurementSequenceCounterWhereUniqueInput
  }

  /**
   * ProcurementSequenceCounter findUniqueOrThrow
   */
  export type ProcurementSequenceCounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementSequenceCounter to fetch.
     */
    where: ProcurementSequenceCounterWhereUniqueInput
  }

  /**
   * ProcurementSequenceCounter findFirst
   */
  export type ProcurementSequenceCounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementSequenceCounter to fetch.
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementSequenceCounters to fetch.
     */
    orderBy?: ProcurementSequenceCounterOrderByWithRelationInput | ProcurementSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProcurementSequenceCounters.
     */
    cursor?: ProcurementSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProcurementSequenceCounters.
     */
    distinct?: ProcurementSequenceCounterScalarFieldEnum | ProcurementSequenceCounterScalarFieldEnum[]
  }

  /**
   * ProcurementSequenceCounter findFirstOrThrow
   */
  export type ProcurementSequenceCounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementSequenceCounter to fetch.
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementSequenceCounters to fetch.
     */
    orderBy?: ProcurementSequenceCounterOrderByWithRelationInput | ProcurementSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProcurementSequenceCounters.
     */
    cursor?: ProcurementSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProcurementSequenceCounters.
     */
    distinct?: ProcurementSequenceCounterScalarFieldEnum | ProcurementSequenceCounterScalarFieldEnum[]
  }

  /**
   * ProcurementSequenceCounter findMany
   */
  export type ProcurementSequenceCounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementSequenceCounters to fetch.
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementSequenceCounters to fetch.
     */
    orderBy?: ProcurementSequenceCounterOrderByWithRelationInput | ProcurementSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProcurementSequenceCounters.
     */
    cursor?: ProcurementSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementSequenceCounters.
     */
    skip?: number
    distinct?: ProcurementSequenceCounterScalarFieldEnum | ProcurementSequenceCounterScalarFieldEnum[]
  }

  /**
   * ProcurementSequenceCounter create
   */
  export type ProcurementSequenceCounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to create a ProcurementSequenceCounter.
     */
    data: XOR<ProcurementSequenceCounterCreateInput, ProcurementSequenceCounterUncheckedCreateInput>
  }

  /**
   * ProcurementSequenceCounter createMany
   */
  export type ProcurementSequenceCounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProcurementSequenceCounters.
     */
    data: ProcurementSequenceCounterCreateManyInput | ProcurementSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProcurementSequenceCounter createManyAndReturn
   */
  export type ProcurementSequenceCounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to create many ProcurementSequenceCounters.
     */
    data: ProcurementSequenceCounterCreateManyInput | ProcurementSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProcurementSequenceCounter update
   */
  export type ProcurementSequenceCounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to update a ProcurementSequenceCounter.
     */
    data: XOR<ProcurementSequenceCounterUpdateInput, ProcurementSequenceCounterUncheckedUpdateInput>
    /**
     * Choose, which ProcurementSequenceCounter to update.
     */
    where: ProcurementSequenceCounterWhereUniqueInput
  }

  /**
   * ProcurementSequenceCounter updateMany
   */
  export type ProcurementSequenceCounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProcurementSequenceCounters.
     */
    data: XOR<ProcurementSequenceCounterUpdateManyMutationInput, ProcurementSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which ProcurementSequenceCounters to update
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * Limit how many ProcurementSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * ProcurementSequenceCounter updateManyAndReturn
   */
  export type ProcurementSequenceCounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to update ProcurementSequenceCounters.
     */
    data: XOR<ProcurementSequenceCounterUpdateManyMutationInput, ProcurementSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which ProcurementSequenceCounters to update
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * Limit how many ProcurementSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * ProcurementSequenceCounter upsert
   */
  export type ProcurementSequenceCounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * The filter to search for the ProcurementSequenceCounter to update in case it exists.
     */
    where: ProcurementSequenceCounterWhereUniqueInput
    /**
     * In case the ProcurementSequenceCounter found by the `where` argument doesn't exist, create a new ProcurementSequenceCounter with this data.
     */
    create: XOR<ProcurementSequenceCounterCreateInput, ProcurementSequenceCounterUncheckedCreateInput>
    /**
     * In case the ProcurementSequenceCounter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProcurementSequenceCounterUpdateInput, ProcurementSequenceCounterUncheckedUpdateInput>
  }

  /**
   * ProcurementSequenceCounter delete
   */
  export type ProcurementSequenceCounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter which ProcurementSequenceCounter to delete.
     */
    where: ProcurementSequenceCounterWhereUniqueInput
  }

  /**
   * ProcurementSequenceCounter deleteMany
   */
  export type ProcurementSequenceCounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProcurementSequenceCounters to delete
     */
    where?: ProcurementSequenceCounterWhereInput
    /**
     * Limit how many ProcurementSequenceCounters to delete.
     */
    limit?: number
  }

  /**
   * ProcurementSequenceCounter without action
   */
  export type ProcurementSequenceCounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementSequenceCounter
     */
    select?: ProcurementSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementSequenceCounter
     */
    omit?: ProcurementSequenceCounterOmit<ExtArgs> | null
  }


  /**
   * Model PurchaseRequest
   */

  export type AggregatePurchaseRequest = {
    _count: PurchaseRequestCountAggregateOutputType | null
    _min: PurchaseRequestMinAggregateOutputType | null
    _max: PurchaseRequestMaxAggregateOutputType | null
  }

  export type PurchaseRequestMinAggregateOutputType = {
    id: string | null
    requestNo: string | null
    tenantId: string | null
    orgId: string | null
    requestType: $Enums.ProcurementPurchaseRequestType | null
    status: $Enums.ProcurementPurchaseRequestStatus | null
    requesterOperatorId: string | null
    requesterDisplayName: string | null
    title: string | null
    reason: string | null
    submissionComment: string | null
    cancelReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    submittedAt: Date | null
    decidedAt: Date | null
    cancelledAt: Date | null
  }

  export type PurchaseRequestMaxAggregateOutputType = {
    id: string | null
    requestNo: string | null
    tenantId: string | null
    orgId: string | null
    requestType: $Enums.ProcurementPurchaseRequestType | null
    status: $Enums.ProcurementPurchaseRequestStatus | null
    requesterOperatorId: string | null
    requesterDisplayName: string | null
    title: string | null
    reason: string | null
    submissionComment: string | null
    cancelReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    submittedAt: Date | null
    decidedAt: Date | null
    cancelledAt: Date | null
  }

  export type PurchaseRequestCountAggregateOutputType = {
    id: number
    requestNo: number
    tenantId: number
    orgId: number
    requestType: number
    status: number
    requesterOperatorId: number
    requesterDisplayName: number
    title: number
    reason: number
    submissionComment: number
    cancelReason: number
    createdAt: number
    updatedAt: number
    submittedAt: number
    decidedAt: number
    cancelledAt: number
    _all: number
  }


  export type PurchaseRequestMinAggregateInputType = {
    id?: true
    requestNo?: true
    tenantId?: true
    orgId?: true
    requestType?: true
    status?: true
    requesterOperatorId?: true
    requesterDisplayName?: true
    title?: true
    reason?: true
    submissionComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    submittedAt?: true
    decidedAt?: true
    cancelledAt?: true
  }

  export type PurchaseRequestMaxAggregateInputType = {
    id?: true
    requestNo?: true
    tenantId?: true
    orgId?: true
    requestType?: true
    status?: true
    requesterOperatorId?: true
    requesterDisplayName?: true
    title?: true
    reason?: true
    submissionComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    submittedAt?: true
    decidedAt?: true
    cancelledAt?: true
  }

  export type PurchaseRequestCountAggregateInputType = {
    id?: true
    requestNo?: true
    tenantId?: true
    orgId?: true
    requestType?: true
    status?: true
    requesterOperatorId?: true
    requesterDisplayName?: true
    title?: true
    reason?: true
    submissionComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    submittedAt?: true
    decidedAt?: true
    cancelledAt?: true
    _all?: true
  }

  export type PurchaseRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequest to aggregate.
     */
    where?: PurchaseRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequests to fetch.
     */
    orderBy?: PurchaseRequestOrderByWithRelationInput | PurchaseRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseRequests
    **/
    _count?: true | PurchaseRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseRequestMaxAggregateInputType
  }

  export type GetPurchaseRequestAggregateType<T extends PurchaseRequestAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseRequest[P]>
      : GetScalarType<T[P], AggregatePurchaseRequest[P]>
  }




  export type PurchaseRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseRequestWhereInput
    orderBy?: PurchaseRequestOrderByWithAggregationInput | PurchaseRequestOrderByWithAggregationInput[]
    by: PurchaseRequestScalarFieldEnum[] | PurchaseRequestScalarFieldEnum
    having?: PurchaseRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseRequestCountAggregateInputType | true
    _min?: PurchaseRequestMinAggregateInputType
    _max?: PurchaseRequestMaxAggregateInputType
  }

  export type PurchaseRequestGroupByOutputType = {
    id: string
    requestNo: string
    tenantId: string
    orgId: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title: string | null
    reason: string | null
    submissionComment: string | null
    cancelReason: string | null
    createdAt: Date
    updatedAt: Date
    submittedAt: Date | null
    decidedAt: Date | null
    cancelledAt: Date | null
    _count: PurchaseRequestCountAggregateOutputType | null
    _min: PurchaseRequestMinAggregateOutputType | null
    _max: PurchaseRequestMaxAggregateOutputType | null
  }

  type GetPurchaseRequestGroupByPayload<T extends PurchaseRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseRequestGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseRequestGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    requestType?: boolean
    status?: boolean
    requesterOperatorId?: boolean
    requesterDisplayName?: boolean
    title?: boolean
    reason?: boolean
    submissionComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    submittedAt?: boolean
    decidedAt?: boolean
    cancelledAt?: boolean
    lines?: boolean | PurchaseRequest$linesArgs<ExtArgs>
    approvalSnapshot?: boolean | PurchaseRequest$approvalSnapshotArgs<ExtArgs>
    _count?: boolean | PurchaseRequestCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequest"]>

  export type PurchaseRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    requestType?: boolean
    status?: boolean
    requesterOperatorId?: boolean
    requesterDisplayName?: boolean
    title?: boolean
    reason?: boolean
    submissionComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    submittedAt?: boolean
    decidedAt?: boolean
    cancelledAt?: boolean
  }, ExtArgs["result"]["purchaseRequest"]>

  export type PurchaseRequestSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    requestType?: boolean
    status?: boolean
    requesterOperatorId?: boolean
    requesterDisplayName?: boolean
    title?: boolean
    reason?: boolean
    submissionComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    submittedAt?: boolean
    decidedAt?: boolean
    cancelledAt?: boolean
  }, ExtArgs["result"]["purchaseRequest"]>

  export type PurchaseRequestSelectScalar = {
    id?: boolean
    requestNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    requestType?: boolean
    status?: boolean
    requesterOperatorId?: boolean
    requesterDisplayName?: boolean
    title?: boolean
    reason?: boolean
    submissionComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    submittedAt?: boolean
    decidedAt?: boolean
    cancelledAt?: boolean
  }

  export type PurchaseRequestOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "requestNo" | "tenantId" | "orgId" | "requestType" | "status" | "requesterOperatorId" | "requesterDisplayName" | "title" | "reason" | "submissionComment" | "cancelReason" | "createdAt" | "updatedAt" | "submittedAt" | "decidedAt" | "cancelledAt", ExtArgs["result"]["purchaseRequest"]>
  export type PurchaseRequestInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | PurchaseRequest$linesArgs<ExtArgs>
    approvalSnapshot?: boolean | PurchaseRequest$approvalSnapshotArgs<ExtArgs>
    _count?: boolean | PurchaseRequestCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PurchaseRequestIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PurchaseRequestIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PurchaseRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseRequest"
    objects: {
      lines: Prisma.$PurchaseRequestLinePayload<ExtArgs>[]
      approvalSnapshot: Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      requestNo: string
      tenantId: string
      orgId: string | null
      requestType: $Enums.ProcurementPurchaseRequestType
      status: $Enums.ProcurementPurchaseRequestStatus
      requesterOperatorId: string
      requesterDisplayName: string
      title: string | null
      reason: string | null
      submissionComment: string | null
      cancelReason: string | null
      createdAt: Date
      updatedAt: Date
      submittedAt: Date | null
      decidedAt: Date | null
      cancelledAt: Date | null
    }, ExtArgs["result"]["purchaseRequest"]>
    composites: {}
  }

  type PurchaseRequestGetPayload<S extends boolean | null | undefined | PurchaseRequestDefaultArgs> = $Result.GetResult<Prisma.$PurchaseRequestPayload, S>

  type PurchaseRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseRequestCountAggregateInputType | true
    }

  export interface PurchaseRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseRequest'], meta: { name: 'PurchaseRequest' } }
    /**
     * Find zero or one PurchaseRequest that matches the filter.
     * @param {PurchaseRequestFindUniqueArgs} args - Arguments to find a PurchaseRequest
     * @example
     * // Get one PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseRequestFindUniqueArgs>(args: SelectSubset<T, PurchaseRequestFindUniqueArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseRequest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseRequestFindUniqueOrThrowArgs} args - Arguments to find a PurchaseRequest
     * @example
     * // Get one PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestFindFirstArgs} args - Arguments to find a PurchaseRequest
     * @example
     * // Get one PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseRequestFindFirstArgs>(args?: SelectSubset<T, PurchaseRequestFindFirstArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestFindFirstOrThrowArgs} args - Arguments to find a PurchaseRequest
     * @example
     * // Get one PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseRequests
     * const purchaseRequests = await prisma.purchaseRequest.findMany()
     * 
     * // Get first 10 PurchaseRequests
     * const purchaseRequests = await prisma.purchaseRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseRequestWithIdOnly = await prisma.purchaseRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseRequestFindManyArgs>(args?: SelectSubset<T, PurchaseRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseRequest.
     * @param {PurchaseRequestCreateArgs} args - Arguments to create a PurchaseRequest.
     * @example
     * // Create one PurchaseRequest
     * const PurchaseRequest = await prisma.purchaseRequest.create({
     *   data: {
     *     // ... data to create a PurchaseRequest
     *   }
     * })
     * 
     */
    create<T extends PurchaseRequestCreateArgs>(args: SelectSubset<T, PurchaseRequestCreateArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseRequests.
     * @param {PurchaseRequestCreateManyArgs} args - Arguments to create many PurchaseRequests.
     * @example
     * // Create many PurchaseRequests
     * const purchaseRequest = await prisma.purchaseRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseRequestCreateManyArgs>(args?: SelectSubset<T, PurchaseRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseRequests and returns the data saved in the database.
     * @param {PurchaseRequestCreateManyAndReturnArgs} args - Arguments to create many PurchaseRequests.
     * @example
     * // Create many PurchaseRequests
     * const purchaseRequest = await prisma.purchaseRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseRequests and only return the `id`
     * const purchaseRequestWithIdOnly = await prisma.purchaseRequest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseRequest.
     * @param {PurchaseRequestDeleteArgs} args - Arguments to delete one PurchaseRequest.
     * @example
     * // Delete one PurchaseRequest
     * const PurchaseRequest = await prisma.purchaseRequest.delete({
     *   where: {
     *     // ... filter to delete one PurchaseRequest
     *   }
     * })
     * 
     */
    delete<T extends PurchaseRequestDeleteArgs>(args: SelectSubset<T, PurchaseRequestDeleteArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseRequest.
     * @param {PurchaseRequestUpdateArgs} args - Arguments to update one PurchaseRequest.
     * @example
     * // Update one PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseRequestUpdateArgs>(args: SelectSubset<T, PurchaseRequestUpdateArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseRequests.
     * @param {PurchaseRequestDeleteManyArgs} args - Arguments to filter PurchaseRequests to delete.
     * @example
     * // Delete a few PurchaseRequests
     * const { count } = await prisma.purchaseRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseRequestDeleteManyArgs>(args?: SelectSubset<T, PurchaseRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseRequests
     * const purchaseRequest = await prisma.purchaseRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseRequestUpdateManyArgs>(args: SelectSubset<T, PurchaseRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequests and returns the data updated in the database.
     * @param {PurchaseRequestUpdateManyAndReturnArgs} args - Arguments to update many PurchaseRequests.
     * @example
     * // Update many PurchaseRequests
     * const purchaseRequest = await prisma.purchaseRequest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseRequests and only return the `id`
     * const purchaseRequestWithIdOnly = await prisma.purchaseRequest.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseRequestUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseRequest.
     * @param {PurchaseRequestUpsertArgs} args - Arguments to update or create a PurchaseRequest.
     * @example
     * // Update or create a PurchaseRequest
     * const purchaseRequest = await prisma.purchaseRequest.upsert({
     *   create: {
     *     // ... data to create a PurchaseRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseRequest we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseRequestUpsertArgs>(args: SelectSubset<T, PurchaseRequestUpsertArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestCountArgs} args - Arguments to filter PurchaseRequests to count.
     * @example
     * // Count the number of PurchaseRequests
     * const count = await prisma.purchaseRequest.count({
     *   where: {
     *     // ... the filter for the PurchaseRequests we want to count
     *   }
     * })
    **/
    count<T extends PurchaseRequestCountArgs>(
      args?: Subset<T, PurchaseRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseRequestAggregateArgs>(args: Subset<T, PurchaseRequestAggregateArgs>): Prisma.PrismaPromise<GetPurchaseRequestAggregateType<T>>

    /**
     * Group by PurchaseRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestGroupByArgs} args - Group by arguments.
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
      T extends PurchaseRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseRequestGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseRequestGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseRequest model
   */
  readonly fields: PurchaseRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends PurchaseRequest$linesArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseRequest$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    approvalSnapshot<T extends PurchaseRequest$approvalSnapshotArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseRequest$approvalSnapshotArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseRequest model
   */ 
  interface PurchaseRequestFieldRefs {
    readonly id: FieldRef<"PurchaseRequest", 'String'>
    readonly requestNo: FieldRef<"PurchaseRequest", 'String'>
    readonly tenantId: FieldRef<"PurchaseRequest", 'String'>
    readonly orgId: FieldRef<"PurchaseRequest", 'String'>
    readonly requestType: FieldRef<"PurchaseRequest", 'ProcurementPurchaseRequestType'>
    readonly status: FieldRef<"PurchaseRequest", 'ProcurementPurchaseRequestStatus'>
    readonly requesterOperatorId: FieldRef<"PurchaseRequest", 'String'>
    readonly requesterDisplayName: FieldRef<"PurchaseRequest", 'String'>
    readonly title: FieldRef<"PurchaseRequest", 'String'>
    readonly reason: FieldRef<"PurchaseRequest", 'String'>
    readonly submissionComment: FieldRef<"PurchaseRequest", 'String'>
    readonly cancelReason: FieldRef<"PurchaseRequest", 'String'>
    readonly createdAt: FieldRef<"PurchaseRequest", 'DateTime'>
    readonly updatedAt: FieldRef<"PurchaseRequest", 'DateTime'>
    readonly submittedAt: FieldRef<"PurchaseRequest", 'DateTime'>
    readonly decidedAt: FieldRef<"PurchaseRequest", 'DateTime'>
    readonly cancelledAt: FieldRef<"PurchaseRequest", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseRequest findUnique
   */
  export type PurchaseRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequest to fetch.
     */
    where: PurchaseRequestWhereUniqueInput
  }

  /**
   * PurchaseRequest findUniqueOrThrow
   */
  export type PurchaseRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequest to fetch.
     */
    where: PurchaseRequestWhereUniqueInput
  }

  /**
   * PurchaseRequest findFirst
   */
  export type PurchaseRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequest to fetch.
     */
    where?: PurchaseRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequests to fetch.
     */
    orderBy?: PurchaseRequestOrderByWithRelationInput | PurchaseRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequests.
     */
    cursor?: PurchaseRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequests.
     */
    distinct?: PurchaseRequestScalarFieldEnum | PurchaseRequestScalarFieldEnum[]
  }

  /**
   * PurchaseRequest findFirstOrThrow
   */
  export type PurchaseRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequest to fetch.
     */
    where?: PurchaseRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequests to fetch.
     */
    orderBy?: PurchaseRequestOrderByWithRelationInput | PurchaseRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequests.
     */
    cursor?: PurchaseRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequests.
     */
    distinct?: PurchaseRequestScalarFieldEnum | PurchaseRequestScalarFieldEnum[]
  }

  /**
   * PurchaseRequest findMany
   */
  export type PurchaseRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequests to fetch.
     */
    where?: PurchaseRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequests to fetch.
     */
    orderBy?: PurchaseRequestOrderByWithRelationInput | PurchaseRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseRequests.
     */
    cursor?: PurchaseRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequests.
     */
    skip?: number
    distinct?: PurchaseRequestScalarFieldEnum | PurchaseRequestScalarFieldEnum[]
  }

  /**
   * PurchaseRequest create
   */
  export type PurchaseRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseRequest.
     */
    data: XOR<PurchaseRequestCreateInput, PurchaseRequestUncheckedCreateInput>
  }

  /**
   * PurchaseRequest createMany
   */
  export type PurchaseRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseRequests.
     */
    data: PurchaseRequestCreateManyInput | PurchaseRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseRequest createManyAndReturn
   */
  export type PurchaseRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseRequests.
     */
    data: PurchaseRequestCreateManyInput | PurchaseRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseRequest update
   */
  export type PurchaseRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseRequest.
     */
    data: XOR<PurchaseRequestUpdateInput, PurchaseRequestUncheckedUpdateInput>
    /**
     * Choose, which PurchaseRequest to update.
     */
    where: PurchaseRequestWhereUniqueInput
  }

  /**
   * PurchaseRequest updateMany
   */
  export type PurchaseRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseRequests.
     */
    data: XOR<PurchaseRequestUpdateManyMutationInput, PurchaseRequestUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequests to update
     */
    where?: PurchaseRequestWhereInput
    /**
     * Limit how many PurchaseRequests to update.
     */
    limit?: number
  }

  /**
   * PurchaseRequest updateManyAndReturn
   */
  export type PurchaseRequestUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseRequests.
     */
    data: XOR<PurchaseRequestUpdateManyMutationInput, PurchaseRequestUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequests to update
     */
    where?: PurchaseRequestWhereInput
    /**
     * Limit how many PurchaseRequests to update.
     */
    limit?: number
  }

  /**
   * PurchaseRequest upsert
   */
  export type PurchaseRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseRequest to update in case it exists.
     */
    where: PurchaseRequestWhereUniqueInput
    /**
     * In case the PurchaseRequest found by the `where` argument doesn't exist, create a new PurchaseRequest with this data.
     */
    create: XOR<PurchaseRequestCreateInput, PurchaseRequestUncheckedCreateInput>
    /**
     * In case the PurchaseRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseRequestUpdateInput, PurchaseRequestUncheckedUpdateInput>
  }

  /**
   * PurchaseRequest delete
   */
  export type PurchaseRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
    /**
     * Filter which PurchaseRequest to delete.
     */
    where: PurchaseRequestWhereUniqueInput
  }

  /**
   * PurchaseRequest deleteMany
   */
  export type PurchaseRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequests to delete
     */
    where?: PurchaseRequestWhereInput
    /**
     * Limit how many PurchaseRequests to delete.
     */
    limit?: number
  }

  /**
   * PurchaseRequest.lines
   */
  export type PurchaseRequest$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    where?: PurchaseRequestLineWhereInput
    orderBy?: PurchaseRequestLineOrderByWithRelationInput | PurchaseRequestLineOrderByWithRelationInput[]
    cursor?: PurchaseRequestLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PurchaseRequestLineScalarFieldEnum | PurchaseRequestLineScalarFieldEnum[]
  }

  /**
   * PurchaseRequest.approvalSnapshot
   */
  export type PurchaseRequest$approvalSnapshotArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    where?: PurchaseRequestApprovalSnapshotWhereInput
  }

  /**
   * PurchaseRequest without action
   */
  export type PurchaseRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequest
     */
    select?: PurchaseRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequest
     */
    omit?: PurchaseRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseRequestLine
   */

  export type AggregatePurchaseRequestLine = {
    _count: PurchaseRequestLineCountAggregateOutputType | null
    _avg: PurchaseRequestLineAvgAggregateOutputType | null
    _sum: PurchaseRequestLineSumAggregateOutputType | null
    _min: PurchaseRequestLineMinAggregateOutputType | null
    _max: PurchaseRequestLineMaxAggregateOutputType | null
  }

  export type PurchaseRequestLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type PurchaseRequestLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type PurchaseRequestLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseRequestId: string | null
    lineNo: number | null
    lineType: $Enums.ProcurementPurchaseRequestLineType | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string | null
    requestedQuantity: string | null
    uom: string | null
    neededByDate: string | null
    demandReferenceType: string | null
    demandReferenceId: string | null
  }

  export type PurchaseRequestLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseRequestId: string | null
    lineNo: number | null
    lineType: $Enums.ProcurementPurchaseRequestLineType | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string | null
    requestedQuantity: string | null
    uom: string | null
    neededByDate: string | null
    demandReferenceType: string | null
    demandReferenceId: string | null
  }

  export type PurchaseRequestLineCountAggregateOutputType = {
    id: number
    tenantId: number
    purchaseRequestId: number
    lineNo: number
    lineType: number
    itemId: number
    itemCode: number
    itemName: number
    description: number
    requestedQuantity: number
    uom: number
    neededByDate: number
    demandReferenceType: number
    demandReferenceId: number
    _all: number
  }


  export type PurchaseRequestLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type PurchaseRequestLineSumAggregateInputType = {
    lineNo?: true
  }

  export type PurchaseRequestLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    requestedQuantity?: true
    uom?: true
    neededByDate?: true
    demandReferenceType?: true
    demandReferenceId?: true
  }

  export type PurchaseRequestLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    requestedQuantity?: true
    uom?: true
    neededByDate?: true
    demandReferenceType?: true
    demandReferenceId?: true
  }

  export type PurchaseRequestLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    requestedQuantity?: true
    uom?: true
    neededByDate?: true
    demandReferenceType?: true
    demandReferenceId?: true
    _all?: true
  }

  export type PurchaseRequestLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequestLine to aggregate.
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestLines to fetch.
     */
    orderBy?: PurchaseRequestLineOrderByWithRelationInput | PurchaseRequestLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseRequestLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseRequestLines
    **/
    _count?: true | PurchaseRequestLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PurchaseRequestLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PurchaseRequestLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseRequestLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseRequestLineMaxAggregateInputType
  }

  export type GetPurchaseRequestLineAggregateType<T extends PurchaseRequestLineAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseRequestLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseRequestLine[P]>
      : GetScalarType<T[P], AggregatePurchaseRequestLine[P]>
  }




  export type PurchaseRequestLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseRequestLineWhereInput
    orderBy?: PurchaseRequestLineOrderByWithAggregationInput | PurchaseRequestLineOrderByWithAggregationInput[]
    by: PurchaseRequestLineScalarFieldEnum[] | PurchaseRequestLineScalarFieldEnum
    having?: PurchaseRequestLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseRequestLineCountAggregateInputType | true
    _avg?: PurchaseRequestLineAvgAggregateInputType
    _sum?: PurchaseRequestLineSumAggregateInputType
    _min?: PurchaseRequestLineMinAggregateInputType
    _max?: PurchaseRequestLineMaxAggregateInputType
  }

  export type PurchaseRequestLineGroupByOutputType = {
    id: string
    tenantId: string
    purchaseRequestId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate: string | null
    demandReferenceType: string | null
    demandReferenceId: string | null
    _count: PurchaseRequestLineCountAggregateOutputType | null
    _avg: PurchaseRequestLineAvgAggregateOutputType | null
    _sum: PurchaseRequestLineSumAggregateOutputType | null
    _min: PurchaseRequestLineMinAggregateOutputType | null
    _max: PurchaseRequestLineMaxAggregateOutputType | null
  }

  type GetPurchaseRequestLineGroupByPayload<T extends PurchaseRequestLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseRequestLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseRequestLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseRequestLineGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseRequestLineGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseRequestLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    requestedQuantity?: boolean
    uom?: boolean
    neededByDate?: boolean
    demandReferenceType?: boolean
    demandReferenceId?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestLine"]>

  export type PurchaseRequestLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    requestedQuantity?: boolean
    uom?: boolean
    neededByDate?: boolean
    demandReferenceType?: boolean
    demandReferenceId?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestLine"]>

  export type PurchaseRequestLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    requestedQuantity?: boolean
    uom?: boolean
    neededByDate?: boolean
    demandReferenceType?: boolean
    demandReferenceId?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestLine"]>

  export type PurchaseRequestLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    requestedQuantity?: boolean
    uom?: boolean
    neededByDate?: boolean
    demandReferenceType?: boolean
    demandReferenceId?: boolean
  }

  export type PurchaseRequestLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "purchaseRequestId" | "lineNo" | "lineType" | "itemId" | "itemCode" | "itemName" | "description" | "requestedQuantity" | "uom" | "neededByDate" | "demandReferenceType" | "demandReferenceId", ExtArgs["result"]["purchaseRequestLine"]>
  export type PurchaseRequestLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }
  export type PurchaseRequestLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }
  export type PurchaseRequestLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }

  export type $PurchaseRequestLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseRequestLine"
    objects: {
      purchaseRequest: Prisma.$PurchaseRequestPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      purchaseRequestId: string
      lineNo: number
      lineType: $Enums.ProcurementPurchaseRequestLineType
      itemId: string | null
      itemCode: string | null
      itemName: string | null
      description: string
      requestedQuantity: string
      uom: string
      neededByDate: string | null
      demandReferenceType: string | null
      demandReferenceId: string | null
    }, ExtArgs["result"]["purchaseRequestLine"]>
    composites: {}
  }

  type PurchaseRequestLineGetPayload<S extends boolean | null | undefined | PurchaseRequestLineDefaultArgs> = $Result.GetResult<Prisma.$PurchaseRequestLinePayload, S>

  type PurchaseRequestLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseRequestLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseRequestLineCountAggregateInputType | true
    }

  export interface PurchaseRequestLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseRequestLine'], meta: { name: 'PurchaseRequestLine' } }
    /**
     * Find zero or one PurchaseRequestLine that matches the filter.
     * @param {PurchaseRequestLineFindUniqueArgs} args - Arguments to find a PurchaseRequestLine
     * @example
     * // Get one PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseRequestLineFindUniqueArgs>(args: SelectSubset<T, PurchaseRequestLineFindUniqueArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseRequestLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseRequestLineFindUniqueOrThrowArgs} args - Arguments to find a PurchaseRequestLine
     * @example
     * // Get one PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseRequestLineFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseRequestLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequestLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineFindFirstArgs} args - Arguments to find a PurchaseRequestLine
     * @example
     * // Get one PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseRequestLineFindFirstArgs>(args?: SelectSubset<T, PurchaseRequestLineFindFirstArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequestLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineFindFirstOrThrowArgs} args - Arguments to find a PurchaseRequestLine
     * @example
     * // Get one PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseRequestLineFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseRequestLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseRequestLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseRequestLines
     * const purchaseRequestLines = await prisma.purchaseRequestLine.findMany()
     * 
     * // Get first 10 PurchaseRequestLines
     * const purchaseRequestLines = await prisma.purchaseRequestLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseRequestLineWithIdOnly = await prisma.purchaseRequestLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseRequestLineFindManyArgs>(args?: SelectSubset<T, PurchaseRequestLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseRequestLine.
     * @param {PurchaseRequestLineCreateArgs} args - Arguments to create a PurchaseRequestLine.
     * @example
     * // Create one PurchaseRequestLine
     * const PurchaseRequestLine = await prisma.purchaseRequestLine.create({
     *   data: {
     *     // ... data to create a PurchaseRequestLine
     *   }
     * })
     * 
     */
    create<T extends PurchaseRequestLineCreateArgs>(args: SelectSubset<T, PurchaseRequestLineCreateArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseRequestLines.
     * @param {PurchaseRequestLineCreateManyArgs} args - Arguments to create many PurchaseRequestLines.
     * @example
     * // Create many PurchaseRequestLines
     * const purchaseRequestLine = await prisma.purchaseRequestLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseRequestLineCreateManyArgs>(args?: SelectSubset<T, PurchaseRequestLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseRequestLines and returns the data saved in the database.
     * @param {PurchaseRequestLineCreateManyAndReturnArgs} args - Arguments to create many PurchaseRequestLines.
     * @example
     * // Create many PurchaseRequestLines
     * const purchaseRequestLine = await prisma.purchaseRequestLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseRequestLines and only return the `id`
     * const purchaseRequestLineWithIdOnly = await prisma.purchaseRequestLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseRequestLineCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseRequestLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseRequestLine.
     * @param {PurchaseRequestLineDeleteArgs} args - Arguments to delete one PurchaseRequestLine.
     * @example
     * // Delete one PurchaseRequestLine
     * const PurchaseRequestLine = await prisma.purchaseRequestLine.delete({
     *   where: {
     *     // ... filter to delete one PurchaseRequestLine
     *   }
     * })
     * 
     */
    delete<T extends PurchaseRequestLineDeleteArgs>(args: SelectSubset<T, PurchaseRequestLineDeleteArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseRequestLine.
     * @param {PurchaseRequestLineUpdateArgs} args - Arguments to update one PurchaseRequestLine.
     * @example
     * // Update one PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseRequestLineUpdateArgs>(args: SelectSubset<T, PurchaseRequestLineUpdateArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseRequestLines.
     * @param {PurchaseRequestLineDeleteManyArgs} args - Arguments to filter PurchaseRequestLines to delete.
     * @example
     * // Delete a few PurchaseRequestLines
     * const { count } = await prisma.purchaseRequestLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseRequestLineDeleteManyArgs>(args?: SelectSubset<T, PurchaseRequestLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequestLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseRequestLines
     * const purchaseRequestLine = await prisma.purchaseRequestLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseRequestLineUpdateManyArgs>(args: SelectSubset<T, PurchaseRequestLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequestLines and returns the data updated in the database.
     * @param {PurchaseRequestLineUpdateManyAndReturnArgs} args - Arguments to update many PurchaseRequestLines.
     * @example
     * // Update many PurchaseRequestLines
     * const purchaseRequestLine = await prisma.purchaseRequestLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseRequestLines and only return the `id`
     * const purchaseRequestLineWithIdOnly = await prisma.purchaseRequestLine.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseRequestLineUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseRequestLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseRequestLine.
     * @param {PurchaseRequestLineUpsertArgs} args - Arguments to update or create a PurchaseRequestLine.
     * @example
     * // Update or create a PurchaseRequestLine
     * const purchaseRequestLine = await prisma.purchaseRequestLine.upsert({
     *   create: {
     *     // ... data to create a PurchaseRequestLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseRequestLine we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseRequestLineUpsertArgs>(args: SelectSubset<T, PurchaseRequestLineUpsertArgs<ExtArgs>>): Prisma__PurchaseRequestLineClient<$Result.GetResult<Prisma.$PurchaseRequestLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseRequestLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineCountArgs} args - Arguments to filter PurchaseRequestLines to count.
     * @example
     * // Count the number of PurchaseRequestLines
     * const count = await prisma.purchaseRequestLine.count({
     *   where: {
     *     // ... the filter for the PurchaseRequestLines we want to count
     *   }
     * })
    **/
    count<T extends PurchaseRequestLineCountArgs>(
      args?: Subset<T, PurchaseRequestLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseRequestLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseRequestLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseRequestLineAggregateArgs>(args: Subset<T, PurchaseRequestLineAggregateArgs>): Prisma.PrismaPromise<GetPurchaseRequestLineAggregateType<T>>

    /**
     * Group by PurchaseRequestLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestLineGroupByArgs} args - Group by arguments.
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
      T extends PurchaseRequestLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseRequestLineGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseRequestLineGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseRequestLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseRequestLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseRequestLine model
   */
  readonly fields: PurchaseRequestLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseRequestLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseRequestLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    purchaseRequest<T extends PurchaseRequestDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseRequestDefaultArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseRequestLine model
   */ 
  interface PurchaseRequestLineFieldRefs {
    readonly id: FieldRef<"PurchaseRequestLine", 'String'>
    readonly tenantId: FieldRef<"PurchaseRequestLine", 'String'>
    readonly purchaseRequestId: FieldRef<"PurchaseRequestLine", 'String'>
    readonly lineNo: FieldRef<"PurchaseRequestLine", 'Int'>
    readonly lineType: FieldRef<"PurchaseRequestLine", 'ProcurementPurchaseRequestLineType'>
    readonly itemId: FieldRef<"PurchaseRequestLine", 'String'>
    readonly itemCode: FieldRef<"PurchaseRequestLine", 'String'>
    readonly itemName: FieldRef<"PurchaseRequestLine", 'String'>
    readonly description: FieldRef<"PurchaseRequestLine", 'String'>
    readonly requestedQuantity: FieldRef<"PurchaseRequestLine", 'String'>
    readonly uom: FieldRef<"PurchaseRequestLine", 'String'>
    readonly neededByDate: FieldRef<"PurchaseRequestLine", 'String'>
    readonly demandReferenceType: FieldRef<"PurchaseRequestLine", 'String'>
    readonly demandReferenceId: FieldRef<"PurchaseRequestLine", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseRequestLine findUnique
   */
  export type PurchaseRequestLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestLine to fetch.
     */
    where: PurchaseRequestLineWhereUniqueInput
  }

  /**
   * PurchaseRequestLine findUniqueOrThrow
   */
  export type PurchaseRequestLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestLine to fetch.
     */
    where: PurchaseRequestLineWhereUniqueInput
  }

  /**
   * PurchaseRequestLine findFirst
   */
  export type PurchaseRequestLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestLine to fetch.
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestLines to fetch.
     */
    orderBy?: PurchaseRequestLineOrderByWithRelationInput | PurchaseRequestLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequestLines.
     */
    cursor?: PurchaseRequestLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequestLines.
     */
    distinct?: PurchaseRequestLineScalarFieldEnum | PurchaseRequestLineScalarFieldEnum[]
  }

  /**
   * PurchaseRequestLine findFirstOrThrow
   */
  export type PurchaseRequestLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestLine to fetch.
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestLines to fetch.
     */
    orderBy?: PurchaseRequestLineOrderByWithRelationInput | PurchaseRequestLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequestLines.
     */
    cursor?: PurchaseRequestLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequestLines.
     */
    distinct?: PurchaseRequestLineScalarFieldEnum | PurchaseRequestLineScalarFieldEnum[]
  }

  /**
   * PurchaseRequestLine findMany
   */
  export type PurchaseRequestLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestLines to fetch.
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestLines to fetch.
     */
    orderBy?: PurchaseRequestLineOrderByWithRelationInput | PurchaseRequestLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseRequestLines.
     */
    cursor?: PurchaseRequestLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestLines.
     */
    skip?: number
    distinct?: PurchaseRequestLineScalarFieldEnum | PurchaseRequestLineScalarFieldEnum[]
  }

  /**
   * PurchaseRequestLine create
   */
  export type PurchaseRequestLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseRequestLine.
     */
    data: XOR<PurchaseRequestLineCreateInput, PurchaseRequestLineUncheckedCreateInput>
  }

  /**
   * PurchaseRequestLine createMany
   */
  export type PurchaseRequestLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseRequestLines.
     */
    data: PurchaseRequestLineCreateManyInput | PurchaseRequestLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseRequestLine createManyAndReturn
   */
  export type PurchaseRequestLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseRequestLines.
     */
    data: PurchaseRequestLineCreateManyInput | PurchaseRequestLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseRequestLine update
   */
  export type PurchaseRequestLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseRequestLine.
     */
    data: XOR<PurchaseRequestLineUpdateInput, PurchaseRequestLineUncheckedUpdateInput>
    /**
     * Choose, which PurchaseRequestLine to update.
     */
    where: PurchaseRequestLineWhereUniqueInput
  }

  /**
   * PurchaseRequestLine updateMany
   */
  export type PurchaseRequestLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseRequestLines.
     */
    data: XOR<PurchaseRequestLineUpdateManyMutationInput, PurchaseRequestLineUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequestLines to update
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * Limit how many PurchaseRequestLines to update.
     */
    limit?: number
  }

  /**
   * PurchaseRequestLine updateManyAndReturn
   */
  export type PurchaseRequestLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseRequestLines.
     */
    data: XOR<PurchaseRequestLineUpdateManyMutationInput, PurchaseRequestLineUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequestLines to update
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * Limit how many PurchaseRequestLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseRequestLine upsert
   */
  export type PurchaseRequestLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseRequestLine to update in case it exists.
     */
    where: PurchaseRequestLineWhereUniqueInput
    /**
     * In case the PurchaseRequestLine found by the `where` argument doesn't exist, create a new PurchaseRequestLine with this data.
     */
    create: XOR<PurchaseRequestLineCreateInput, PurchaseRequestLineUncheckedCreateInput>
    /**
     * In case the PurchaseRequestLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseRequestLineUpdateInput, PurchaseRequestLineUncheckedUpdateInput>
  }

  /**
   * PurchaseRequestLine delete
   */
  export type PurchaseRequestLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
    /**
     * Filter which PurchaseRequestLine to delete.
     */
    where: PurchaseRequestLineWhereUniqueInput
  }

  /**
   * PurchaseRequestLine deleteMany
   */
  export type PurchaseRequestLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequestLines to delete
     */
    where?: PurchaseRequestLineWhereInput
    /**
     * Limit how many PurchaseRequestLines to delete.
     */
    limit?: number
  }

  /**
   * PurchaseRequestLine without action
   */
  export type PurchaseRequestLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestLine
     */
    select?: PurchaseRequestLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestLine
     */
    omit?: PurchaseRequestLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestLineInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseRequestApprovalSnapshot
   */

  export type AggregatePurchaseRequestApprovalSnapshot = {
    _count: PurchaseRequestApprovalSnapshotCountAggregateOutputType | null
    _min: PurchaseRequestApprovalSnapshotMinAggregateOutputType | null
    _max: PurchaseRequestApprovalSnapshotMaxAggregateOutputType | null
  }

  export type PurchaseRequestApprovalSnapshotMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseRequestId: string | null
    decision: $Enums.ProcurementPurchaseRequestDecision | null
    decidedByOperatorId: string | null
    decidedByDisplayName: string | null
    decidedAt: Date | null
    comment: string | null
    approvalReference: string | null
  }

  export type PurchaseRequestApprovalSnapshotMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseRequestId: string | null
    decision: $Enums.ProcurementPurchaseRequestDecision | null
    decidedByOperatorId: string | null
    decidedByDisplayName: string | null
    decidedAt: Date | null
    comment: string | null
    approvalReference: string | null
  }

  export type PurchaseRequestApprovalSnapshotCountAggregateOutputType = {
    id: number
    tenantId: number
    purchaseRequestId: number
    decision: number
    decidedByOperatorId: number
    decidedByDisplayName: number
    decidedAt: number
    comment: number
    approvalReference: number
    _all: number
  }


  export type PurchaseRequestApprovalSnapshotMinAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    decision?: true
    decidedByOperatorId?: true
    decidedByDisplayName?: true
    decidedAt?: true
    comment?: true
    approvalReference?: true
  }

  export type PurchaseRequestApprovalSnapshotMaxAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    decision?: true
    decidedByOperatorId?: true
    decidedByDisplayName?: true
    decidedAt?: true
    comment?: true
    approvalReference?: true
  }

  export type PurchaseRequestApprovalSnapshotCountAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseRequestId?: true
    decision?: true
    decidedByOperatorId?: true
    decidedByDisplayName?: true
    decidedAt?: true
    comment?: true
    approvalReference?: true
    _all?: true
  }

  export type PurchaseRequestApprovalSnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequestApprovalSnapshot to aggregate.
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestApprovalSnapshots to fetch.
     */
    orderBy?: PurchaseRequestApprovalSnapshotOrderByWithRelationInput | PurchaseRequestApprovalSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestApprovalSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestApprovalSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseRequestApprovalSnapshots
    **/
    _count?: true | PurchaseRequestApprovalSnapshotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseRequestApprovalSnapshotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseRequestApprovalSnapshotMaxAggregateInputType
  }

  export type GetPurchaseRequestApprovalSnapshotAggregateType<T extends PurchaseRequestApprovalSnapshotAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseRequestApprovalSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseRequestApprovalSnapshot[P]>
      : GetScalarType<T[P], AggregatePurchaseRequestApprovalSnapshot[P]>
  }




  export type PurchaseRequestApprovalSnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseRequestApprovalSnapshotWhereInput
    orderBy?: PurchaseRequestApprovalSnapshotOrderByWithAggregationInput | PurchaseRequestApprovalSnapshotOrderByWithAggregationInput[]
    by: PurchaseRequestApprovalSnapshotScalarFieldEnum[] | PurchaseRequestApprovalSnapshotScalarFieldEnum
    having?: PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseRequestApprovalSnapshotCountAggregateInputType | true
    _min?: PurchaseRequestApprovalSnapshotMinAggregateInputType
    _max?: PurchaseRequestApprovalSnapshotMaxAggregateInputType
  }

  export type PurchaseRequestApprovalSnapshotGroupByOutputType = {
    id: string
    tenantId: string
    purchaseRequestId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date
    comment: string | null
    approvalReference: string | null
    _count: PurchaseRequestApprovalSnapshotCountAggregateOutputType | null
    _min: PurchaseRequestApprovalSnapshotMinAggregateOutputType | null
    _max: PurchaseRequestApprovalSnapshotMaxAggregateOutputType | null
  }

  type GetPurchaseRequestApprovalSnapshotGroupByPayload<T extends PurchaseRequestApprovalSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseRequestApprovalSnapshotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseRequestApprovalSnapshotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseRequestApprovalSnapshotGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseRequestApprovalSnapshotGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseRequestApprovalSnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    decision?: boolean
    decidedByOperatorId?: boolean
    decidedByDisplayName?: boolean
    decidedAt?: boolean
    comment?: boolean
    approvalReference?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestApprovalSnapshot"]>

  export type PurchaseRequestApprovalSnapshotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    decision?: boolean
    decidedByOperatorId?: boolean
    decidedByDisplayName?: boolean
    decidedAt?: boolean
    comment?: boolean
    approvalReference?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestApprovalSnapshot"]>

  export type PurchaseRequestApprovalSnapshotSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    decision?: boolean
    decidedByOperatorId?: boolean
    decidedByDisplayName?: boolean
    decidedAt?: boolean
    comment?: boolean
    approvalReference?: boolean
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseRequestApprovalSnapshot"]>

  export type PurchaseRequestApprovalSnapshotSelectScalar = {
    id?: boolean
    tenantId?: boolean
    purchaseRequestId?: boolean
    decision?: boolean
    decidedByOperatorId?: boolean
    decidedByDisplayName?: boolean
    decidedAt?: boolean
    comment?: boolean
    approvalReference?: boolean
  }

  export type PurchaseRequestApprovalSnapshotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "purchaseRequestId" | "decision" | "decidedByOperatorId" | "decidedByDisplayName" | "decidedAt" | "comment" | "approvalReference", ExtArgs["result"]["purchaseRequestApprovalSnapshot"]>
  export type PurchaseRequestApprovalSnapshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }
  export type PurchaseRequestApprovalSnapshotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }
  export type PurchaseRequestApprovalSnapshotIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseRequest?: boolean | PurchaseRequestDefaultArgs<ExtArgs>
  }

  export type $PurchaseRequestApprovalSnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseRequestApprovalSnapshot"
    objects: {
      purchaseRequest: Prisma.$PurchaseRequestPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      purchaseRequestId: string
      decision: $Enums.ProcurementPurchaseRequestDecision
      decidedByOperatorId: string
      decidedByDisplayName: string
      decidedAt: Date
      comment: string | null
      approvalReference: string | null
    }, ExtArgs["result"]["purchaseRequestApprovalSnapshot"]>
    composites: {}
  }

  type PurchaseRequestApprovalSnapshotGetPayload<S extends boolean | null | undefined | PurchaseRequestApprovalSnapshotDefaultArgs> = $Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload, S>

  type PurchaseRequestApprovalSnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseRequestApprovalSnapshotFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseRequestApprovalSnapshotCountAggregateInputType | true
    }

  export interface PurchaseRequestApprovalSnapshotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseRequestApprovalSnapshot'], meta: { name: 'PurchaseRequestApprovalSnapshot' } }
    /**
     * Find zero or one PurchaseRequestApprovalSnapshot that matches the filter.
     * @param {PurchaseRequestApprovalSnapshotFindUniqueArgs} args - Arguments to find a PurchaseRequestApprovalSnapshot
     * @example
     * // Get one PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseRequestApprovalSnapshotFindUniqueArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotFindUniqueArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseRequestApprovalSnapshot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseRequestApprovalSnapshotFindUniqueOrThrowArgs} args - Arguments to find a PurchaseRequestApprovalSnapshot
     * @example
     * // Get one PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseRequestApprovalSnapshotFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequestApprovalSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotFindFirstArgs} args - Arguments to find a PurchaseRequestApprovalSnapshot
     * @example
     * // Get one PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseRequestApprovalSnapshotFindFirstArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotFindFirstArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseRequestApprovalSnapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotFindFirstOrThrowArgs} args - Arguments to find a PurchaseRequestApprovalSnapshot
     * @example
     * // Get one PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseRequestApprovalSnapshotFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseRequestApprovalSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshots = await prisma.purchaseRequestApprovalSnapshot.findMany()
     * 
     * // Get first 10 PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshots = await prisma.purchaseRequestApprovalSnapshot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseRequestApprovalSnapshotWithIdOnly = await prisma.purchaseRequestApprovalSnapshot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseRequestApprovalSnapshotFindManyArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseRequestApprovalSnapshot.
     * @param {PurchaseRequestApprovalSnapshotCreateArgs} args - Arguments to create a PurchaseRequestApprovalSnapshot.
     * @example
     * // Create one PurchaseRequestApprovalSnapshot
     * const PurchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.create({
     *   data: {
     *     // ... data to create a PurchaseRequestApprovalSnapshot
     *   }
     * })
     * 
     */
    create<T extends PurchaseRequestApprovalSnapshotCreateArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotCreateArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseRequestApprovalSnapshots.
     * @param {PurchaseRequestApprovalSnapshotCreateManyArgs} args - Arguments to create many PurchaseRequestApprovalSnapshots.
     * @example
     * // Create many PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseRequestApprovalSnapshotCreateManyArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseRequestApprovalSnapshots and returns the data saved in the database.
     * @param {PurchaseRequestApprovalSnapshotCreateManyAndReturnArgs} args - Arguments to create many PurchaseRequestApprovalSnapshots.
     * @example
     * // Create many PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseRequestApprovalSnapshots and only return the `id`
     * const purchaseRequestApprovalSnapshotWithIdOnly = await prisma.purchaseRequestApprovalSnapshot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseRequestApprovalSnapshotCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseRequestApprovalSnapshot.
     * @param {PurchaseRequestApprovalSnapshotDeleteArgs} args - Arguments to delete one PurchaseRequestApprovalSnapshot.
     * @example
     * // Delete one PurchaseRequestApprovalSnapshot
     * const PurchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.delete({
     *   where: {
     *     // ... filter to delete one PurchaseRequestApprovalSnapshot
     *   }
     * })
     * 
     */
    delete<T extends PurchaseRequestApprovalSnapshotDeleteArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotDeleteArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseRequestApprovalSnapshot.
     * @param {PurchaseRequestApprovalSnapshotUpdateArgs} args - Arguments to update one PurchaseRequestApprovalSnapshot.
     * @example
     * // Update one PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseRequestApprovalSnapshotUpdateArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotUpdateArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseRequestApprovalSnapshots.
     * @param {PurchaseRequestApprovalSnapshotDeleteManyArgs} args - Arguments to filter PurchaseRequestApprovalSnapshots to delete.
     * @example
     * // Delete a few PurchaseRequestApprovalSnapshots
     * const { count } = await prisma.purchaseRequestApprovalSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseRequestApprovalSnapshotDeleteManyArgs>(args?: SelectSubset<T, PurchaseRequestApprovalSnapshotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequestApprovalSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseRequestApprovalSnapshotUpdateManyArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseRequestApprovalSnapshots and returns the data updated in the database.
     * @param {PurchaseRequestApprovalSnapshotUpdateManyAndReturnArgs} args - Arguments to update many PurchaseRequestApprovalSnapshots.
     * @example
     * // Update many PurchaseRequestApprovalSnapshots
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseRequestApprovalSnapshots and only return the `id`
     * const purchaseRequestApprovalSnapshotWithIdOnly = await prisma.purchaseRequestApprovalSnapshot.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseRequestApprovalSnapshotUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseRequestApprovalSnapshot.
     * @param {PurchaseRequestApprovalSnapshotUpsertArgs} args - Arguments to update or create a PurchaseRequestApprovalSnapshot.
     * @example
     * // Update or create a PurchaseRequestApprovalSnapshot
     * const purchaseRequestApprovalSnapshot = await prisma.purchaseRequestApprovalSnapshot.upsert({
     *   create: {
     *     // ... data to create a PurchaseRequestApprovalSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseRequestApprovalSnapshot we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseRequestApprovalSnapshotUpsertArgs>(args: SelectSubset<T, PurchaseRequestApprovalSnapshotUpsertArgs<ExtArgs>>): Prisma__PurchaseRequestApprovalSnapshotClient<$Result.GetResult<Prisma.$PurchaseRequestApprovalSnapshotPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseRequestApprovalSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotCountArgs} args - Arguments to filter PurchaseRequestApprovalSnapshots to count.
     * @example
     * // Count the number of PurchaseRequestApprovalSnapshots
     * const count = await prisma.purchaseRequestApprovalSnapshot.count({
     *   where: {
     *     // ... the filter for the PurchaseRequestApprovalSnapshots we want to count
     *   }
     * })
    **/
    count<T extends PurchaseRequestApprovalSnapshotCountArgs>(
      args?: Subset<T, PurchaseRequestApprovalSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseRequestApprovalSnapshotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseRequestApprovalSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseRequestApprovalSnapshotAggregateArgs>(args: Subset<T, PurchaseRequestApprovalSnapshotAggregateArgs>): Prisma.PrismaPromise<GetPurchaseRequestApprovalSnapshotAggregateType<T>>

    /**
     * Group by PurchaseRequestApprovalSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseRequestApprovalSnapshotGroupByArgs} args - Group by arguments.
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
      T extends PurchaseRequestApprovalSnapshotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseRequestApprovalSnapshotGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseRequestApprovalSnapshotGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseRequestApprovalSnapshotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseRequestApprovalSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseRequestApprovalSnapshot model
   */
  readonly fields: PurchaseRequestApprovalSnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseRequestApprovalSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseRequestApprovalSnapshotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    purchaseRequest<T extends PurchaseRequestDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseRequestDefaultArgs<ExtArgs>>): Prisma__PurchaseRequestClient<$Result.GetResult<Prisma.$PurchaseRequestPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseRequestApprovalSnapshot model
   */ 
  interface PurchaseRequestApprovalSnapshotFieldRefs {
    readonly id: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly tenantId: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly purchaseRequestId: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly decision: FieldRef<"PurchaseRequestApprovalSnapshot", 'ProcurementPurchaseRequestDecision'>
    readonly decidedByOperatorId: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly decidedByDisplayName: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly decidedAt: FieldRef<"PurchaseRequestApprovalSnapshot", 'DateTime'>
    readonly comment: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
    readonly approvalReference: FieldRef<"PurchaseRequestApprovalSnapshot", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseRequestApprovalSnapshot findUnique
   */
  export type PurchaseRequestApprovalSnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestApprovalSnapshot to fetch.
     */
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  /**
   * PurchaseRequestApprovalSnapshot findUniqueOrThrow
   */
  export type PurchaseRequestApprovalSnapshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestApprovalSnapshot to fetch.
     */
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  /**
   * PurchaseRequestApprovalSnapshot findFirst
   */
  export type PurchaseRequestApprovalSnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestApprovalSnapshot to fetch.
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestApprovalSnapshots to fetch.
     */
    orderBy?: PurchaseRequestApprovalSnapshotOrderByWithRelationInput | PurchaseRequestApprovalSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequestApprovalSnapshots.
     */
    cursor?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestApprovalSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestApprovalSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequestApprovalSnapshots.
     */
    distinct?: PurchaseRequestApprovalSnapshotScalarFieldEnum | PurchaseRequestApprovalSnapshotScalarFieldEnum[]
  }

  /**
   * PurchaseRequestApprovalSnapshot findFirstOrThrow
   */
  export type PurchaseRequestApprovalSnapshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestApprovalSnapshot to fetch.
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestApprovalSnapshots to fetch.
     */
    orderBy?: PurchaseRequestApprovalSnapshotOrderByWithRelationInput | PurchaseRequestApprovalSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseRequestApprovalSnapshots.
     */
    cursor?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestApprovalSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestApprovalSnapshots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseRequestApprovalSnapshots.
     */
    distinct?: PurchaseRequestApprovalSnapshotScalarFieldEnum | PurchaseRequestApprovalSnapshotScalarFieldEnum[]
  }

  /**
   * PurchaseRequestApprovalSnapshot findMany
   */
  export type PurchaseRequestApprovalSnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseRequestApprovalSnapshots to fetch.
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseRequestApprovalSnapshots to fetch.
     */
    orderBy?: PurchaseRequestApprovalSnapshotOrderByWithRelationInput | PurchaseRequestApprovalSnapshotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseRequestApprovalSnapshots.
     */
    cursor?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseRequestApprovalSnapshots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseRequestApprovalSnapshots.
     */
    skip?: number
    distinct?: PurchaseRequestApprovalSnapshotScalarFieldEnum | PurchaseRequestApprovalSnapshotScalarFieldEnum[]
  }

  /**
   * PurchaseRequestApprovalSnapshot create
   */
  export type PurchaseRequestApprovalSnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseRequestApprovalSnapshot.
     */
    data: XOR<PurchaseRequestApprovalSnapshotCreateInput, PurchaseRequestApprovalSnapshotUncheckedCreateInput>
  }

  /**
   * PurchaseRequestApprovalSnapshot createMany
   */
  export type PurchaseRequestApprovalSnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseRequestApprovalSnapshots.
     */
    data: PurchaseRequestApprovalSnapshotCreateManyInput | PurchaseRequestApprovalSnapshotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseRequestApprovalSnapshot createManyAndReturn
   */
  export type PurchaseRequestApprovalSnapshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseRequestApprovalSnapshots.
     */
    data: PurchaseRequestApprovalSnapshotCreateManyInput | PurchaseRequestApprovalSnapshotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseRequestApprovalSnapshot update
   */
  export type PurchaseRequestApprovalSnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseRequestApprovalSnapshot.
     */
    data: XOR<PurchaseRequestApprovalSnapshotUpdateInput, PurchaseRequestApprovalSnapshotUncheckedUpdateInput>
    /**
     * Choose, which PurchaseRequestApprovalSnapshot to update.
     */
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  /**
   * PurchaseRequestApprovalSnapshot updateMany
   */
  export type PurchaseRequestApprovalSnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseRequestApprovalSnapshots.
     */
    data: XOR<PurchaseRequestApprovalSnapshotUpdateManyMutationInput, PurchaseRequestApprovalSnapshotUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequestApprovalSnapshots to update
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * Limit how many PurchaseRequestApprovalSnapshots to update.
     */
    limit?: number
  }

  /**
   * PurchaseRequestApprovalSnapshot updateManyAndReturn
   */
  export type PurchaseRequestApprovalSnapshotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseRequestApprovalSnapshots.
     */
    data: XOR<PurchaseRequestApprovalSnapshotUpdateManyMutationInput, PurchaseRequestApprovalSnapshotUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseRequestApprovalSnapshots to update
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * Limit how many PurchaseRequestApprovalSnapshots to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseRequestApprovalSnapshot upsert
   */
  export type PurchaseRequestApprovalSnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseRequestApprovalSnapshot to update in case it exists.
     */
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
    /**
     * In case the PurchaseRequestApprovalSnapshot found by the `where` argument doesn't exist, create a new PurchaseRequestApprovalSnapshot with this data.
     */
    create: XOR<PurchaseRequestApprovalSnapshotCreateInput, PurchaseRequestApprovalSnapshotUncheckedCreateInput>
    /**
     * In case the PurchaseRequestApprovalSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseRequestApprovalSnapshotUpdateInput, PurchaseRequestApprovalSnapshotUncheckedUpdateInput>
  }

  /**
   * PurchaseRequestApprovalSnapshot delete
   */
  export type PurchaseRequestApprovalSnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
    /**
     * Filter which PurchaseRequestApprovalSnapshot to delete.
     */
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  /**
   * PurchaseRequestApprovalSnapshot deleteMany
   */
  export type PurchaseRequestApprovalSnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseRequestApprovalSnapshots to delete
     */
    where?: PurchaseRequestApprovalSnapshotWhereInput
    /**
     * Limit how many PurchaseRequestApprovalSnapshots to delete.
     */
    limit?: number
  }

  /**
   * PurchaseRequestApprovalSnapshot without action
   */
  export type PurchaseRequestApprovalSnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseRequestApprovalSnapshot
     */
    select?: PurchaseRequestApprovalSnapshotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseRequestApprovalSnapshot
     */
    omit?: PurchaseRequestApprovalSnapshotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseRequestApprovalSnapshotInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseOrder
   */

  export type AggregatePurchaseOrder = {
    _count: PurchaseOrderCountAggregateOutputType | null
    _min: PurchaseOrderMinAggregateOutputType | null
    _max: PurchaseOrderMaxAggregateOutputType | null
  }

  export type PurchaseOrderMinAggregateOutputType = {
    id: string | null
    orderNo: string | null
    tenantId: string | null
    orgId: string | null
    status: $Enums.ProcurementPurchaseOrderStatus | null
    currencyCode: string | null
    supplierId: string | null
    supplierDisplayName: string | null
    supplierStatusAtIssue: string | null
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus | null
    acknowledgedAt: Date | null
    acknowledgementExternalReference: string | null
    acknowledgementComment: string | null
    issueComment: string | null
    cancelReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    issuedAt: Date | null
    cancelledAt: Date | null
  }

  export type PurchaseOrderMaxAggregateOutputType = {
    id: string | null
    orderNo: string | null
    tenantId: string | null
    orgId: string | null
    status: $Enums.ProcurementPurchaseOrderStatus | null
    currencyCode: string | null
    supplierId: string | null
    supplierDisplayName: string | null
    supplierStatusAtIssue: string | null
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus | null
    acknowledgedAt: Date | null
    acknowledgementExternalReference: string | null
    acknowledgementComment: string | null
    issueComment: string | null
    cancelReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    issuedAt: Date | null
    cancelledAt: Date | null
  }

  export type PurchaseOrderCountAggregateOutputType = {
    id: number
    orderNo: number
    tenantId: number
    orgId: number
    status: number
    currencyCode: number
    supplierId: number
    supplierDisplayName: number
    supplierStatusAtIssue: number
    sourcePurchaseRequestIds: number
    sourcePurchaseRequestNos: number
    acknowledgementStatus: number
    acknowledgedAt: number
    acknowledgementExternalReference: number
    acknowledgementComment: number
    issueComment: number
    cancelReason: number
    createdAt: number
    updatedAt: number
    issuedAt: number
    cancelledAt: number
    _all: number
  }


  export type PurchaseOrderMinAggregateInputType = {
    id?: true
    orderNo?: true
    tenantId?: true
    orgId?: true
    status?: true
    currencyCode?: true
    supplierId?: true
    supplierDisplayName?: true
    supplierStatusAtIssue?: true
    acknowledgementStatus?: true
    acknowledgedAt?: true
    acknowledgementExternalReference?: true
    acknowledgementComment?: true
    issueComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    issuedAt?: true
    cancelledAt?: true
  }

  export type PurchaseOrderMaxAggregateInputType = {
    id?: true
    orderNo?: true
    tenantId?: true
    orgId?: true
    status?: true
    currencyCode?: true
    supplierId?: true
    supplierDisplayName?: true
    supplierStatusAtIssue?: true
    acknowledgementStatus?: true
    acknowledgedAt?: true
    acknowledgementExternalReference?: true
    acknowledgementComment?: true
    issueComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    issuedAt?: true
    cancelledAt?: true
  }

  export type PurchaseOrderCountAggregateInputType = {
    id?: true
    orderNo?: true
    tenantId?: true
    orgId?: true
    status?: true
    currencyCode?: true
    supplierId?: true
    supplierDisplayName?: true
    supplierStatusAtIssue?: true
    sourcePurchaseRequestIds?: true
    sourcePurchaseRequestNos?: true
    acknowledgementStatus?: true
    acknowledgedAt?: true
    acknowledgementExternalReference?: true
    acknowledgementComment?: true
    issueComment?: true
    cancelReason?: true
    createdAt?: true
    updatedAt?: true
    issuedAt?: true
    cancelledAt?: true
    _all?: true
  }

  export type PurchaseOrderAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrder to aggregate.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseOrders
    **/
    _count?: true | PurchaseOrderCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseOrderMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseOrderMaxAggregateInputType
  }

  export type GetPurchaseOrderAggregateType<T extends PurchaseOrderAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseOrder]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseOrder[P]>
      : GetScalarType<T[P], AggregatePurchaseOrder[P]>
  }




  export type PurchaseOrderGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderWhereInput
    orderBy?: PurchaseOrderOrderByWithAggregationInput | PurchaseOrderOrderByWithAggregationInput[]
    by: PurchaseOrderScalarFieldEnum[] | PurchaseOrderScalarFieldEnum
    having?: PurchaseOrderScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseOrderCountAggregateInputType | true
    _min?: PurchaseOrderMinAggregateInputType
    _max?: PurchaseOrderMaxAggregateInputType
  }

  export type PurchaseOrderGroupByOutputType = {
    id: string
    orderNo: string
    tenantId: string
    orgId: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue: string | null
    sourcePurchaseRequestIds: JsonValue
    sourcePurchaseRequestNos: JsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt: Date | null
    acknowledgementExternalReference: string | null
    acknowledgementComment: string | null
    issueComment: string | null
    cancelReason: string | null
    createdAt: Date
    updatedAt: Date
    issuedAt: Date | null
    cancelledAt: Date | null
    _count: PurchaseOrderCountAggregateOutputType | null
    _min: PurchaseOrderMinAggregateOutputType | null
    _max: PurchaseOrderMaxAggregateOutputType | null
  }

  type GetPurchaseOrderGroupByPayload<T extends PurchaseOrderGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseOrderGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseOrderGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseOrderGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseOrderGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseOrderSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    status?: boolean
    currencyCode?: boolean
    supplierId?: boolean
    supplierDisplayName?: boolean
    supplierStatusAtIssue?: boolean
    sourcePurchaseRequestIds?: boolean
    sourcePurchaseRequestNos?: boolean
    acknowledgementStatus?: boolean
    acknowledgedAt?: boolean
    acknowledgementExternalReference?: boolean
    acknowledgementComment?: boolean
    issueComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuedAt?: boolean
    cancelledAt?: boolean
    lines?: boolean | PurchaseOrder$linesArgs<ExtArgs>
    changes?: boolean | PurchaseOrder$changesArgs<ExtArgs>
    receivingExpectations?: boolean | PurchaseOrder$receivingExpectationsArgs<ExtArgs>
    _count?: boolean | PurchaseOrderCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrder"]>

  export type PurchaseOrderSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    status?: boolean
    currencyCode?: boolean
    supplierId?: boolean
    supplierDisplayName?: boolean
    supplierStatusAtIssue?: boolean
    sourcePurchaseRequestIds?: boolean
    sourcePurchaseRequestNos?: boolean
    acknowledgementStatus?: boolean
    acknowledgedAt?: boolean
    acknowledgementExternalReference?: boolean
    acknowledgementComment?: boolean
    issueComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuedAt?: boolean
    cancelledAt?: boolean
  }, ExtArgs["result"]["purchaseOrder"]>

  export type PurchaseOrderSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    orderNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    status?: boolean
    currencyCode?: boolean
    supplierId?: boolean
    supplierDisplayName?: boolean
    supplierStatusAtIssue?: boolean
    sourcePurchaseRequestIds?: boolean
    sourcePurchaseRequestNos?: boolean
    acknowledgementStatus?: boolean
    acknowledgedAt?: boolean
    acknowledgementExternalReference?: boolean
    acknowledgementComment?: boolean
    issueComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuedAt?: boolean
    cancelledAt?: boolean
  }, ExtArgs["result"]["purchaseOrder"]>

  export type PurchaseOrderSelectScalar = {
    id?: boolean
    orderNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    status?: boolean
    currencyCode?: boolean
    supplierId?: boolean
    supplierDisplayName?: boolean
    supplierStatusAtIssue?: boolean
    sourcePurchaseRequestIds?: boolean
    sourcePurchaseRequestNos?: boolean
    acknowledgementStatus?: boolean
    acknowledgedAt?: boolean
    acknowledgementExternalReference?: boolean
    acknowledgementComment?: boolean
    issueComment?: boolean
    cancelReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    issuedAt?: boolean
    cancelledAt?: boolean
  }

  export type PurchaseOrderOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "orderNo" | "tenantId" | "orgId" | "status" | "currencyCode" | "supplierId" | "supplierDisplayName" | "supplierStatusAtIssue" | "sourcePurchaseRequestIds" | "sourcePurchaseRequestNos" | "acknowledgementStatus" | "acknowledgedAt" | "acknowledgementExternalReference" | "acknowledgementComment" | "issueComment" | "cancelReason" | "createdAt" | "updatedAt" | "issuedAt" | "cancelledAt", ExtArgs["result"]["purchaseOrder"]>
  export type PurchaseOrderInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lines?: boolean | PurchaseOrder$linesArgs<ExtArgs>
    changes?: boolean | PurchaseOrder$changesArgs<ExtArgs>
    receivingExpectations?: boolean | PurchaseOrder$receivingExpectationsArgs<ExtArgs>
    _count?: boolean | PurchaseOrderCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PurchaseOrderIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PurchaseOrderPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseOrder"
    objects: {
      lines: Prisma.$PurchaseOrderLinePayload<ExtArgs>[]
      changes: Prisma.$PurchaseOrderChangePayload<ExtArgs>[]
      receivingExpectations: Prisma.$ReceivingExpectationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      orderNo: string
      tenantId: string
      orgId: string | null
      status: $Enums.ProcurementPurchaseOrderStatus
      currencyCode: string
      supplierId: string
      supplierDisplayName: string
      supplierStatusAtIssue: string | null
      sourcePurchaseRequestIds: Prisma.JsonValue
      sourcePurchaseRequestNos: Prisma.JsonValue
      acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
      acknowledgedAt: Date | null
      acknowledgementExternalReference: string | null
      acknowledgementComment: string | null
      issueComment: string | null
      cancelReason: string | null
      createdAt: Date
      updatedAt: Date
      issuedAt: Date | null
      cancelledAt: Date | null
    }, ExtArgs["result"]["purchaseOrder"]>
    composites: {}
  }

  type PurchaseOrderGetPayload<S extends boolean | null | undefined | PurchaseOrderDefaultArgs> = $Result.GetResult<Prisma.$PurchaseOrderPayload, S>

  type PurchaseOrderCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseOrderFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseOrderCountAggregateInputType | true
    }

  export interface PurchaseOrderDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseOrder'], meta: { name: 'PurchaseOrder' } }
    /**
     * Find zero or one PurchaseOrder that matches the filter.
     * @param {PurchaseOrderFindUniqueArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseOrderFindUniqueArgs>(args: SelectSubset<T, PurchaseOrderFindUniqueArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseOrder that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseOrderFindUniqueOrThrowArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseOrderFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseOrderFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrder that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindFirstArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseOrderFindFirstArgs>(args?: SelectSubset<T, PurchaseOrderFindFirstArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrder that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindFirstOrThrowArgs} args - Arguments to find a PurchaseOrder
     * @example
     * // Get one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseOrderFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseOrderFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseOrders that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseOrders
     * const purchaseOrders = await prisma.purchaseOrder.findMany()
     * 
     * // Get first 10 PurchaseOrders
     * const purchaseOrders = await prisma.purchaseOrder.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseOrderWithIdOnly = await prisma.purchaseOrder.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseOrderFindManyArgs>(args?: SelectSubset<T, PurchaseOrderFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseOrder.
     * @param {PurchaseOrderCreateArgs} args - Arguments to create a PurchaseOrder.
     * @example
     * // Create one PurchaseOrder
     * const PurchaseOrder = await prisma.purchaseOrder.create({
     *   data: {
     *     // ... data to create a PurchaseOrder
     *   }
     * })
     * 
     */
    create<T extends PurchaseOrderCreateArgs>(args: SelectSubset<T, PurchaseOrderCreateArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseOrders.
     * @param {PurchaseOrderCreateManyArgs} args - Arguments to create many PurchaseOrders.
     * @example
     * // Create many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseOrderCreateManyArgs>(args?: SelectSubset<T, PurchaseOrderCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseOrders and returns the data saved in the database.
     * @param {PurchaseOrderCreateManyAndReturnArgs} args - Arguments to create many PurchaseOrders.
     * @example
     * // Create many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseOrders and only return the `id`
     * const purchaseOrderWithIdOnly = await prisma.purchaseOrder.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseOrderCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseOrderCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseOrder.
     * @param {PurchaseOrderDeleteArgs} args - Arguments to delete one PurchaseOrder.
     * @example
     * // Delete one PurchaseOrder
     * const PurchaseOrder = await prisma.purchaseOrder.delete({
     *   where: {
     *     // ... filter to delete one PurchaseOrder
     *   }
     * })
     * 
     */
    delete<T extends PurchaseOrderDeleteArgs>(args: SelectSubset<T, PurchaseOrderDeleteArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseOrder.
     * @param {PurchaseOrderUpdateArgs} args - Arguments to update one PurchaseOrder.
     * @example
     * // Update one PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseOrderUpdateArgs>(args: SelectSubset<T, PurchaseOrderUpdateArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseOrders.
     * @param {PurchaseOrderDeleteManyArgs} args - Arguments to filter PurchaseOrders to delete.
     * @example
     * // Delete a few PurchaseOrders
     * const { count } = await prisma.purchaseOrder.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseOrderDeleteManyArgs>(args?: SelectSubset<T, PurchaseOrderDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseOrderUpdateManyArgs>(args: SelectSubset<T, PurchaseOrderUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrders and returns the data updated in the database.
     * @param {PurchaseOrderUpdateManyAndReturnArgs} args - Arguments to update many PurchaseOrders.
     * @example
     * // Update many PurchaseOrders
     * const purchaseOrder = await prisma.purchaseOrder.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseOrders and only return the `id`
     * const purchaseOrderWithIdOnly = await prisma.purchaseOrder.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseOrderUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseOrderUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseOrder.
     * @param {PurchaseOrderUpsertArgs} args - Arguments to update or create a PurchaseOrder.
     * @example
     * // Update or create a PurchaseOrder
     * const purchaseOrder = await prisma.purchaseOrder.upsert({
     *   create: {
     *     // ... data to create a PurchaseOrder
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseOrder we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseOrderUpsertArgs>(args: SelectSubset<T, PurchaseOrderUpsertArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseOrders.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderCountArgs} args - Arguments to filter PurchaseOrders to count.
     * @example
     * // Count the number of PurchaseOrders
     * const count = await prisma.purchaseOrder.count({
     *   where: {
     *     // ... the filter for the PurchaseOrders we want to count
     *   }
     * })
    **/
    count<T extends PurchaseOrderCountArgs>(
      args?: Subset<T, PurchaseOrderCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseOrderCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseOrderAggregateArgs>(args: Subset<T, PurchaseOrderAggregateArgs>): Prisma.PrismaPromise<GetPurchaseOrderAggregateType<T>>

    /**
     * Group by PurchaseOrder.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderGroupByArgs} args - Group by arguments.
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
      T extends PurchaseOrderGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseOrderGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseOrderGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseOrderGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseOrderGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseOrder model
   */
  readonly fields: PurchaseOrderFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseOrder.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseOrderClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lines<T extends PurchaseOrder$linesArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrder$linesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    changes<T extends PurchaseOrder$changesArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrder$changesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    receivingExpectations<T extends PurchaseOrder$receivingExpectationsArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrder$receivingExpectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
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
   * Fields of the PurchaseOrder model
   */ 
  interface PurchaseOrderFieldRefs {
    readonly id: FieldRef<"PurchaseOrder", 'String'>
    readonly orderNo: FieldRef<"PurchaseOrder", 'String'>
    readonly tenantId: FieldRef<"PurchaseOrder", 'String'>
    readonly orgId: FieldRef<"PurchaseOrder", 'String'>
    readonly status: FieldRef<"PurchaseOrder", 'ProcurementPurchaseOrderStatus'>
    readonly currencyCode: FieldRef<"PurchaseOrder", 'String'>
    readonly supplierId: FieldRef<"PurchaseOrder", 'String'>
    readonly supplierDisplayName: FieldRef<"PurchaseOrder", 'String'>
    readonly supplierStatusAtIssue: FieldRef<"PurchaseOrder", 'String'>
    readonly sourcePurchaseRequestIds: FieldRef<"PurchaseOrder", 'Json'>
    readonly sourcePurchaseRequestNos: FieldRef<"PurchaseOrder", 'Json'>
    readonly acknowledgementStatus: FieldRef<"PurchaseOrder", 'ProcurementSupplierAcknowledgementStatus'>
    readonly acknowledgedAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly acknowledgementExternalReference: FieldRef<"PurchaseOrder", 'String'>
    readonly acknowledgementComment: FieldRef<"PurchaseOrder", 'String'>
    readonly issueComment: FieldRef<"PurchaseOrder", 'String'>
    readonly cancelReason: FieldRef<"PurchaseOrder", 'String'>
    readonly createdAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly updatedAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly issuedAt: FieldRef<"PurchaseOrder", 'DateTime'>
    readonly cancelledAt: FieldRef<"PurchaseOrder", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseOrder findUnique
   */
  export type PurchaseOrderFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder findUniqueOrThrow
   */
  export type PurchaseOrderFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder findFirst
   */
  export type PurchaseOrderFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrders.
     */
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder findFirstOrThrow
   */
  export type PurchaseOrderFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrder to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrders.
     */
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder findMany
   */
  export type PurchaseOrderFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrders to fetch.
     */
    where?: PurchaseOrderWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrders to fetch.
     */
    orderBy?: PurchaseOrderOrderByWithRelationInput | PurchaseOrderOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseOrders.
     */
    cursor?: PurchaseOrderWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrders from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrders.
     */
    skip?: number
    distinct?: PurchaseOrderScalarFieldEnum | PurchaseOrderScalarFieldEnum[]
  }

  /**
   * PurchaseOrder create
   */
  export type PurchaseOrderCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseOrder.
     */
    data: XOR<PurchaseOrderCreateInput, PurchaseOrderUncheckedCreateInput>
  }

  /**
   * PurchaseOrder createMany
   */
  export type PurchaseOrderCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseOrders.
     */
    data: PurchaseOrderCreateManyInput | PurchaseOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrder createManyAndReturn
   */
  export type PurchaseOrderCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseOrders.
     */
    data: PurchaseOrderCreateManyInput | PurchaseOrderCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrder update
   */
  export type PurchaseOrderUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseOrder.
     */
    data: XOR<PurchaseOrderUpdateInput, PurchaseOrderUncheckedUpdateInput>
    /**
     * Choose, which PurchaseOrder to update.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder updateMany
   */
  export type PurchaseOrderUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseOrders.
     */
    data: XOR<PurchaseOrderUpdateManyMutationInput, PurchaseOrderUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrders to update
     */
    where?: PurchaseOrderWhereInput
    /**
     * Limit how many PurchaseOrders to update.
     */
    limit?: number
  }

  /**
   * PurchaseOrder updateManyAndReturn
   */
  export type PurchaseOrderUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseOrders.
     */
    data: XOR<PurchaseOrderUpdateManyMutationInput, PurchaseOrderUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrders to update
     */
    where?: PurchaseOrderWhereInput
    /**
     * Limit how many PurchaseOrders to update.
     */
    limit?: number
  }

  /**
   * PurchaseOrder upsert
   */
  export type PurchaseOrderUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseOrder to update in case it exists.
     */
    where: PurchaseOrderWhereUniqueInput
    /**
     * In case the PurchaseOrder found by the `where` argument doesn't exist, create a new PurchaseOrder with this data.
     */
    create: XOR<PurchaseOrderCreateInput, PurchaseOrderUncheckedCreateInput>
    /**
     * In case the PurchaseOrder was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseOrderUpdateInput, PurchaseOrderUncheckedUpdateInput>
  }

  /**
   * PurchaseOrder delete
   */
  export type PurchaseOrderDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
    /**
     * Filter which PurchaseOrder to delete.
     */
    where: PurchaseOrderWhereUniqueInput
  }

  /**
   * PurchaseOrder deleteMany
   */
  export type PurchaseOrderDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrders to delete
     */
    where?: PurchaseOrderWhereInput
    /**
     * Limit how many PurchaseOrders to delete.
     */
    limit?: number
  }

  /**
   * PurchaseOrder.lines
   */
  export type PurchaseOrder$linesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    where?: PurchaseOrderLineWhereInput
    orderBy?: PurchaseOrderLineOrderByWithRelationInput | PurchaseOrderLineOrderByWithRelationInput[]
    cursor?: PurchaseOrderLineWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PurchaseOrderLineScalarFieldEnum | PurchaseOrderLineScalarFieldEnum[]
  }

  /**
   * PurchaseOrder.changes
   */
  export type PurchaseOrder$changesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    where?: PurchaseOrderChangeWhereInput
    orderBy?: PurchaseOrderChangeOrderByWithRelationInput | PurchaseOrderChangeOrderByWithRelationInput[]
    cursor?: PurchaseOrderChangeWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PurchaseOrderChangeScalarFieldEnum | PurchaseOrderChangeScalarFieldEnum[]
  }

  /**
   * PurchaseOrder.receivingExpectations
   */
  export type PurchaseOrder$receivingExpectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    where?: ReceivingExpectationWhereInput
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    cursor?: ReceivingExpectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReceivingExpectationScalarFieldEnum | ReceivingExpectationScalarFieldEnum[]
  }

  /**
   * PurchaseOrder without action
   */
  export type PurchaseOrderDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrder
     */
    select?: PurchaseOrderSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrder
     */
    omit?: PurchaseOrderOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseOrderLine
   */

  export type AggregatePurchaseOrderLine = {
    _count: PurchaseOrderLineCountAggregateOutputType | null
    _avg: PurchaseOrderLineAvgAggregateOutputType | null
    _sum: PurchaseOrderLineSumAggregateOutputType | null
    _min: PurchaseOrderLineMinAggregateOutputType | null
    _max: PurchaseOrderLineMaxAggregateOutputType | null
  }

  export type PurchaseOrderLineAvgAggregateOutputType = {
    lineNo: number | null
  }

  export type PurchaseOrderLineSumAggregateOutputType = {
    lineNo: number | null
  }

  export type PurchaseOrderLineMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderId: string | null
    lineNo: number | null
    lineType: $Enums.ProcurementPurchaseRequestLineType | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string | null
    supplierOfferingId: string | null
    orderedQuantity: string | null
    uom: string | null
    orderedUnitPrice: string | null
    sourcePurchaseRequestLineId: string | null
    sourceRequestedQuantity: string | null
    generalStockExcessReason: string | null
  }

  export type PurchaseOrderLineMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderId: string | null
    lineNo: number | null
    lineType: $Enums.ProcurementPurchaseRequestLineType | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string | null
    supplierOfferingId: string | null
    orderedQuantity: string | null
    uom: string | null
    orderedUnitPrice: string | null
    sourcePurchaseRequestLineId: string | null
    sourceRequestedQuantity: string | null
    generalStockExcessReason: string | null
  }

  export type PurchaseOrderLineCountAggregateOutputType = {
    id: number
    tenantId: number
    purchaseOrderId: number
    lineNo: number
    lineType: number
    itemId: number
    itemCode: number
    itemName: number
    description: number
    supplierOfferingId: number
    orderedQuantity: number
    uom: number
    orderedUnitPrice: number
    sourcePurchaseRequestLineId: number
    sourceRequestedQuantity: number
    generalStockExcessReason: number
    _all: number
  }


  export type PurchaseOrderLineAvgAggregateInputType = {
    lineNo?: true
  }

  export type PurchaseOrderLineSumAggregateInputType = {
    lineNo?: true
  }

  export type PurchaseOrderLineMinAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    supplierOfferingId?: true
    orderedQuantity?: true
    uom?: true
    orderedUnitPrice?: true
    sourcePurchaseRequestLineId?: true
    sourceRequestedQuantity?: true
    generalStockExcessReason?: true
  }

  export type PurchaseOrderLineMaxAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    supplierOfferingId?: true
    orderedQuantity?: true
    uom?: true
    orderedUnitPrice?: true
    sourcePurchaseRequestLineId?: true
    sourceRequestedQuantity?: true
    generalStockExcessReason?: true
  }

  export type PurchaseOrderLineCountAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    lineNo?: true
    lineType?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    description?: true
    supplierOfferingId?: true
    orderedQuantity?: true
    uom?: true
    orderedUnitPrice?: true
    sourcePurchaseRequestLineId?: true
    sourceRequestedQuantity?: true
    generalStockExcessReason?: true
    _all?: true
  }

  export type PurchaseOrderLineAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderLine to aggregate.
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLines to fetch.
     */
    orderBy?: PurchaseOrderLineOrderByWithRelationInput | PurchaseOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseOrderLines
    **/
    _count?: true | PurchaseOrderLineCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PurchaseOrderLineAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PurchaseOrderLineSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseOrderLineMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseOrderLineMaxAggregateInputType
  }

  export type GetPurchaseOrderLineAggregateType<T extends PurchaseOrderLineAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseOrderLine]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseOrderLine[P]>
      : GetScalarType<T[P], AggregatePurchaseOrderLine[P]>
  }




  export type PurchaseOrderLineGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderLineWhereInput
    orderBy?: PurchaseOrderLineOrderByWithAggregationInput | PurchaseOrderLineOrderByWithAggregationInput[]
    by: PurchaseOrderLineScalarFieldEnum[] | PurchaseOrderLineScalarFieldEnum
    having?: PurchaseOrderLineScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseOrderLineCountAggregateInputType | true
    _avg?: PurchaseOrderLineAvgAggregateInputType
    _sum?: PurchaseOrderLineSumAggregateInputType
    _min?: PurchaseOrderLineMinAggregateInputType
    _max?: PurchaseOrderLineMaxAggregateInputType
  }

  export type PurchaseOrderLineGroupByOutputType = {
    id: string
    tenantId: string
    purchaseOrderId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    description: string
    supplierOfferingId: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice: string | null
    sourcePurchaseRequestLineId: string | null
    sourceRequestedQuantity: string | null
    generalStockExcessReason: string | null
    _count: PurchaseOrderLineCountAggregateOutputType | null
    _avg: PurchaseOrderLineAvgAggregateOutputType | null
    _sum: PurchaseOrderLineSumAggregateOutputType | null
    _min: PurchaseOrderLineMinAggregateOutputType | null
    _max: PurchaseOrderLineMaxAggregateOutputType | null
  }

  type GetPurchaseOrderLineGroupByPayload<T extends PurchaseOrderLineGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseOrderLineGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseOrderLineGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseOrderLineGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseOrderLineGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseOrderLineSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    supplierOfferingId?: boolean
    orderedQuantity?: boolean
    uom?: boolean
    orderedUnitPrice?: boolean
    sourcePurchaseRequestLineId?: boolean
    sourceRequestedQuantity?: boolean
    generalStockExcessReason?: boolean
    allocations?: boolean | PurchaseOrderLine$allocationsArgs<ExtArgs>
    receivingExpectations?: boolean | PurchaseOrderLine$receivingExpectationsArgs<ExtArgs>
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    _count?: boolean | PurchaseOrderLineCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLine"]>

  export type PurchaseOrderLineSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    supplierOfferingId?: boolean
    orderedQuantity?: boolean
    uom?: boolean
    orderedUnitPrice?: boolean
    sourcePurchaseRequestLineId?: boolean
    sourceRequestedQuantity?: boolean
    generalStockExcessReason?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLine"]>

  export type PurchaseOrderLineSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    supplierOfferingId?: boolean
    orderedQuantity?: boolean
    uom?: boolean
    orderedUnitPrice?: boolean
    sourcePurchaseRequestLineId?: boolean
    sourceRequestedQuantity?: boolean
    generalStockExcessReason?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLine"]>

  export type PurchaseOrderLineSelectScalar = {
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    lineNo?: boolean
    lineType?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    description?: boolean
    supplierOfferingId?: boolean
    orderedQuantity?: boolean
    uom?: boolean
    orderedUnitPrice?: boolean
    sourcePurchaseRequestLineId?: boolean
    sourceRequestedQuantity?: boolean
    generalStockExcessReason?: boolean
  }

  export type PurchaseOrderLineOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "purchaseOrderId" | "lineNo" | "lineType" | "itemId" | "itemCode" | "itemName" | "description" | "supplierOfferingId" | "orderedQuantity" | "uom" | "orderedUnitPrice" | "sourcePurchaseRequestLineId" | "sourceRequestedQuantity" | "generalStockExcessReason", ExtArgs["result"]["purchaseOrderLine"]>
  export type PurchaseOrderLineInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    allocations?: boolean | PurchaseOrderLine$allocationsArgs<ExtArgs>
    receivingExpectations?: boolean | PurchaseOrderLine$receivingExpectationsArgs<ExtArgs>
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    _count?: boolean | PurchaseOrderLineCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderLineIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderLineIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }

  export type $PurchaseOrderLinePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseOrderLine"
    objects: {
      allocations: Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>[]
      receivingExpectations: Prisma.$ReceivingExpectationPayload<ExtArgs>[]
      purchaseOrder: Prisma.$PurchaseOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      purchaseOrderId: string
      lineNo: number
      lineType: $Enums.ProcurementPurchaseRequestLineType
      itemId: string | null
      itemCode: string | null
      itemName: string | null
      description: string
      supplierOfferingId: string | null
      orderedQuantity: string
      uom: string
      orderedUnitPrice: string | null
      sourcePurchaseRequestLineId: string | null
      sourceRequestedQuantity: string | null
      generalStockExcessReason: string | null
    }, ExtArgs["result"]["purchaseOrderLine"]>
    composites: {}
  }

  type PurchaseOrderLineGetPayload<S extends boolean | null | undefined | PurchaseOrderLineDefaultArgs> = $Result.GetResult<Prisma.$PurchaseOrderLinePayload, S>

  type PurchaseOrderLineCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseOrderLineFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseOrderLineCountAggregateInputType | true
    }

  export interface PurchaseOrderLineDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseOrderLine'], meta: { name: 'PurchaseOrderLine' } }
    /**
     * Find zero or one PurchaseOrderLine that matches the filter.
     * @param {PurchaseOrderLineFindUniqueArgs} args - Arguments to find a PurchaseOrderLine
     * @example
     * // Get one PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseOrderLineFindUniqueArgs>(args: SelectSubset<T, PurchaseOrderLineFindUniqueArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseOrderLine that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseOrderLineFindUniqueOrThrowArgs} args - Arguments to find a PurchaseOrderLine
     * @example
     * // Get one PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseOrderLineFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseOrderLineFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderLine that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineFindFirstArgs} args - Arguments to find a PurchaseOrderLine
     * @example
     * // Get one PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseOrderLineFindFirstArgs>(args?: SelectSubset<T, PurchaseOrderLineFindFirstArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderLine that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineFindFirstOrThrowArgs} args - Arguments to find a PurchaseOrderLine
     * @example
     * // Get one PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseOrderLineFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseOrderLineFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseOrderLines that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseOrderLines
     * const purchaseOrderLines = await prisma.purchaseOrderLine.findMany()
     * 
     * // Get first 10 PurchaseOrderLines
     * const purchaseOrderLines = await prisma.purchaseOrderLine.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseOrderLineWithIdOnly = await prisma.purchaseOrderLine.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseOrderLineFindManyArgs>(args?: SelectSubset<T, PurchaseOrderLineFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseOrderLine.
     * @param {PurchaseOrderLineCreateArgs} args - Arguments to create a PurchaseOrderLine.
     * @example
     * // Create one PurchaseOrderLine
     * const PurchaseOrderLine = await prisma.purchaseOrderLine.create({
     *   data: {
     *     // ... data to create a PurchaseOrderLine
     *   }
     * })
     * 
     */
    create<T extends PurchaseOrderLineCreateArgs>(args: SelectSubset<T, PurchaseOrderLineCreateArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseOrderLines.
     * @param {PurchaseOrderLineCreateManyArgs} args - Arguments to create many PurchaseOrderLines.
     * @example
     * // Create many PurchaseOrderLines
     * const purchaseOrderLine = await prisma.purchaseOrderLine.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseOrderLineCreateManyArgs>(args?: SelectSubset<T, PurchaseOrderLineCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseOrderLines and returns the data saved in the database.
     * @param {PurchaseOrderLineCreateManyAndReturnArgs} args - Arguments to create many PurchaseOrderLines.
     * @example
     * // Create many PurchaseOrderLines
     * const purchaseOrderLine = await prisma.purchaseOrderLine.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseOrderLines and only return the `id`
     * const purchaseOrderLineWithIdOnly = await prisma.purchaseOrderLine.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseOrderLineCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseOrderLineCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseOrderLine.
     * @param {PurchaseOrderLineDeleteArgs} args - Arguments to delete one PurchaseOrderLine.
     * @example
     * // Delete one PurchaseOrderLine
     * const PurchaseOrderLine = await prisma.purchaseOrderLine.delete({
     *   where: {
     *     // ... filter to delete one PurchaseOrderLine
     *   }
     * })
     * 
     */
    delete<T extends PurchaseOrderLineDeleteArgs>(args: SelectSubset<T, PurchaseOrderLineDeleteArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseOrderLine.
     * @param {PurchaseOrderLineUpdateArgs} args - Arguments to update one PurchaseOrderLine.
     * @example
     * // Update one PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseOrderLineUpdateArgs>(args: SelectSubset<T, PurchaseOrderLineUpdateArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseOrderLines.
     * @param {PurchaseOrderLineDeleteManyArgs} args - Arguments to filter PurchaseOrderLines to delete.
     * @example
     * // Delete a few PurchaseOrderLines
     * const { count } = await prisma.purchaseOrderLine.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseOrderLineDeleteManyArgs>(args?: SelectSubset<T, PurchaseOrderLineDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseOrderLines
     * const purchaseOrderLine = await prisma.purchaseOrderLine.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseOrderLineUpdateManyArgs>(args: SelectSubset<T, PurchaseOrderLineUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderLines and returns the data updated in the database.
     * @param {PurchaseOrderLineUpdateManyAndReturnArgs} args - Arguments to update many PurchaseOrderLines.
     * @example
     * // Update many PurchaseOrderLines
     * const purchaseOrderLine = await prisma.purchaseOrderLine.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseOrderLines and only return the `id`
     * const purchaseOrderLineWithIdOnly = await prisma.purchaseOrderLine.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseOrderLineUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseOrderLineUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseOrderLine.
     * @param {PurchaseOrderLineUpsertArgs} args - Arguments to update or create a PurchaseOrderLine.
     * @example
     * // Update or create a PurchaseOrderLine
     * const purchaseOrderLine = await prisma.purchaseOrderLine.upsert({
     *   create: {
     *     // ... data to create a PurchaseOrderLine
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseOrderLine we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseOrderLineUpsertArgs>(args: SelectSubset<T, PurchaseOrderLineUpsertArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseOrderLines.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineCountArgs} args - Arguments to filter PurchaseOrderLines to count.
     * @example
     * // Count the number of PurchaseOrderLines
     * const count = await prisma.purchaseOrderLine.count({
     *   where: {
     *     // ... the filter for the PurchaseOrderLines we want to count
     *   }
     * })
    **/
    count<T extends PurchaseOrderLineCountArgs>(
      args?: Subset<T, PurchaseOrderLineCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseOrderLineCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseOrderLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseOrderLineAggregateArgs>(args: Subset<T, PurchaseOrderLineAggregateArgs>): Prisma.PrismaPromise<GetPurchaseOrderLineAggregateType<T>>

    /**
     * Group by PurchaseOrderLine.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineGroupByArgs} args - Group by arguments.
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
      T extends PurchaseOrderLineGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseOrderLineGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseOrderLineGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseOrderLineGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseOrderLineGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseOrderLine model
   */
  readonly fields: PurchaseOrderLineFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseOrderLine.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseOrderLineClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    allocations<T extends PurchaseOrderLine$allocationsArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderLine$allocationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    receivingExpectations<T extends PurchaseOrderLine$receivingExpectationsArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderLine$receivingExpectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    purchaseOrder<T extends PurchaseOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderDefaultArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseOrderLine model
   */ 
  interface PurchaseOrderLineFieldRefs {
    readonly id: FieldRef<"PurchaseOrderLine", 'String'>
    readonly tenantId: FieldRef<"PurchaseOrderLine", 'String'>
    readonly purchaseOrderId: FieldRef<"PurchaseOrderLine", 'String'>
    readonly lineNo: FieldRef<"PurchaseOrderLine", 'Int'>
    readonly lineType: FieldRef<"PurchaseOrderLine", 'ProcurementPurchaseRequestLineType'>
    readonly itemId: FieldRef<"PurchaseOrderLine", 'String'>
    readonly itemCode: FieldRef<"PurchaseOrderLine", 'String'>
    readonly itemName: FieldRef<"PurchaseOrderLine", 'String'>
    readonly description: FieldRef<"PurchaseOrderLine", 'String'>
    readonly supplierOfferingId: FieldRef<"PurchaseOrderLine", 'String'>
    readonly orderedQuantity: FieldRef<"PurchaseOrderLine", 'String'>
    readonly uom: FieldRef<"PurchaseOrderLine", 'String'>
    readonly orderedUnitPrice: FieldRef<"PurchaseOrderLine", 'String'>
    readonly sourcePurchaseRequestLineId: FieldRef<"PurchaseOrderLine", 'String'>
    readonly sourceRequestedQuantity: FieldRef<"PurchaseOrderLine", 'String'>
    readonly generalStockExcessReason: FieldRef<"PurchaseOrderLine", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseOrderLine findUnique
   */
  export type PurchaseOrderLineFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLine to fetch.
     */
    where: PurchaseOrderLineWhereUniqueInput
  }

  /**
   * PurchaseOrderLine findUniqueOrThrow
   */
  export type PurchaseOrderLineFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLine to fetch.
     */
    where: PurchaseOrderLineWhereUniqueInput
  }

  /**
   * PurchaseOrderLine findFirst
   */
  export type PurchaseOrderLineFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLine to fetch.
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLines to fetch.
     */
    orderBy?: PurchaseOrderLineOrderByWithRelationInput | PurchaseOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderLines.
     */
    cursor?: PurchaseOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderLines.
     */
    distinct?: PurchaseOrderLineScalarFieldEnum | PurchaseOrderLineScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLine findFirstOrThrow
   */
  export type PurchaseOrderLineFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLine to fetch.
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLines to fetch.
     */
    orderBy?: PurchaseOrderLineOrderByWithRelationInput | PurchaseOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderLines.
     */
    cursor?: PurchaseOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLines.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderLines.
     */
    distinct?: PurchaseOrderLineScalarFieldEnum | PurchaseOrderLineScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLine findMany
   */
  export type PurchaseOrderLineFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLines to fetch.
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLines to fetch.
     */
    orderBy?: PurchaseOrderLineOrderByWithRelationInput | PurchaseOrderLineOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseOrderLines.
     */
    cursor?: PurchaseOrderLineWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLines from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLines.
     */
    skip?: number
    distinct?: PurchaseOrderLineScalarFieldEnum | PurchaseOrderLineScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLine create
   */
  export type PurchaseOrderLineCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseOrderLine.
     */
    data: XOR<PurchaseOrderLineCreateInput, PurchaseOrderLineUncheckedCreateInput>
  }

  /**
   * PurchaseOrderLine createMany
   */
  export type PurchaseOrderLineCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseOrderLines.
     */
    data: PurchaseOrderLineCreateManyInput | PurchaseOrderLineCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrderLine createManyAndReturn
   */
  export type PurchaseOrderLineCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseOrderLines.
     */
    data: PurchaseOrderLineCreateManyInput | PurchaseOrderLineCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderLine update
   */
  export type PurchaseOrderLineUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseOrderLine.
     */
    data: XOR<PurchaseOrderLineUpdateInput, PurchaseOrderLineUncheckedUpdateInput>
    /**
     * Choose, which PurchaseOrderLine to update.
     */
    where: PurchaseOrderLineWhereUniqueInput
  }

  /**
   * PurchaseOrderLine updateMany
   */
  export type PurchaseOrderLineUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseOrderLines.
     */
    data: XOR<PurchaseOrderLineUpdateManyMutationInput, PurchaseOrderLineUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderLines to update
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * Limit how many PurchaseOrderLines to update.
     */
    limit?: number
  }

  /**
   * PurchaseOrderLine updateManyAndReturn
   */
  export type PurchaseOrderLineUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseOrderLines.
     */
    data: XOR<PurchaseOrderLineUpdateManyMutationInput, PurchaseOrderLineUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderLines to update
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * Limit how many PurchaseOrderLines to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderLine upsert
   */
  export type PurchaseOrderLineUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseOrderLine to update in case it exists.
     */
    where: PurchaseOrderLineWhereUniqueInput
    /**
     * In case the PurchaseOrderLine found by the `where` argument doesn't exist, create a new PurchaseOrderLine with this data.
     */
    create: XOR<PurchaseOrderLineCreateInput, PurchaseOrderLineUncheckedCreateInput>
    /**
     * In case the PurchaseOrderLine was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseOrderLineUpdateInput, PurchaseOrderLineUncheckedUpdateInput>
  }

  /**
   * PurchaseOrderLine delete
   */
  export type PurchaseOrderLineDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
    /**
     * Filter which PurchaseOrderLine to delete.
     */
    where: PurchaseOrderLineWhereUniqueInput
  }

  /**
   * PurchaseOrderLine deleteMany
   */
  export type PurchaseOrderLineDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderLines to delete
     */
    where?: PurchaseOrderLineWhereInput
    /**
     * Limit how many PurchaseOrderLines to delete.
     */
    limit?: number
  }

  /**
   * PurchaseOrderLine.allocations
   */
  export type PurchaseOrderLine$allocationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    where?: PurchaseOrderLineAllocationWhereInput
    orderBy?: PurchaseOrderLineAllocationOrderByWithRelationInput | PurchaseOrderLineAllocationOrderByWithRelationInput[]
    cursor?: PurchaseOrderLineAllocationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PurchaseOrderLineAllocationScalarFieldEnum | PurchaseOrderLineAllocationScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLine.receivingExpectations
   */
  export type PurchaseOrderLine$receivingExpectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    where?: ReceivingExpectationWhereInput
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    cursor?: ReceivingExpectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReceivingExpectationScalarFieldEnum | ReceivingExpectationScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLine without action
   */
  export type PurchaseOrderLineDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLine
     */
    select?: PurchaseOrderLineSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLine
     */
    omit?: PurchaseOrderLineOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseOrderLineAllocation
   */

  export type AggregatePurchaseOrderLineAllocation = {
    _count: PurchaseOrderLineAllocationCountAggregateOutputType | null
    _min: PurchaseOrderLineAllocationMinAggregateOutputType | null
    _max: PurchaseOrderLineAllocationMaxAggregateOutputType | null
  }

  export type PurchaseOrderLineAllocationMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderLineId: string | null
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType | null
    referenceId: string | null
    quantity: string | null
    reason: string | null
  }

  export type PurchaseOrderLineAllocationMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderLineId: string | null
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType | null
    referenceId: string | null
    quantity: string | null
    reason: string | null
  }

  export type PurchaseOrderLineAllocationCountAggregateOutputType = {
    id: number
    tenantId: number
    purchaseOrderLineId: number
    allocationType: number
    referenceId: number
    quantity: number
    reason: number
    _all: number
  }


  export type PurchaseOrderLineAllocationMinAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderLineId?: true
    allocationType?: true
    referenceId?: true
    quantity?: true
    reason?: true
  }

  export type PurchaseOrderLineAllocationMaxAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderLineId?: true
    allocationType?: true
    referenceId?: true
    quantity?: true
    reason?: true
  }

  export type PurchaseOrderLineAllocationCountAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderLineId?: true
    allocationType?: true
    referenceId?: true
    quantity?: true
    reason?: true
    _all?: true
  }

  export type PurchaseOrderLineAllocationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderLineAllocation to aggregate.
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLineAllocations to fetch.
     */
    orderBy?: PurchaseOrderLineAllocationOrderByWithRelationInput | PurchaseOrderLineAllocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseOrderLineAllocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLineAllocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLineAllocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseOrderLineAllocations
    **/
    _count?: true | PurchaseOrderLineAllocationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseOrderLineAllocationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseOrderLineAllocationMaxAggregateInputType
  }

  export type GetPurchaseOrderLineAllocationAggregateType<T extends PurchaseOrderLineAllocationAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseOrderLineAllocation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseOrderLineAllocation[P]>
      : GetScalarType<T[P], AggregatePurchaseOrderLineAllocation[P]>
  }




  export type PurchaseOrderLineAllocationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderLineAllocationWhereInput
    orderBy?: PurchaseOrderLineAllocationOrderByWithAggregationInput | PurchaseOrderLineAllocationOrderByWithAggregationInput[]
    by: PurchaseOrderLineAllocationScalarFieldEnum[] | PurchaseOrderLineAllocationScalarFieldEnum
    having?: PurchaseOrderLineAllocationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseOrderLineAllocationCountAggregateInputType | true
    _min?: PurchaseOrderLineAllocationMinAggregateInputType
    _max?: PurchaseOrderLineAllocationMaxAggregateInputType
  }

  export type PurchaseOrderLineAllocationGroupByOutputType = {
    id: string
    tenantId: string
    purchaseOrderLineId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId: string | null
    quantity: string
    reason: string | null
    _count: PurchaseOrderLineAllocationCountAggregateOutputType | null
    _min: PurchaseOrderLineAllocationMinAggregateOutputType | null
    _max: PurchaseOrderLineAllocationMaxAggregateOutputType | null
  }

  type GetPurchaseOrderLineAllocationGroupByPayload<T extends PurchaseOrderLineAllocationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseOrderLineAllocationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseOrderLineAllocationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseOrderLineAllocationGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseOrderLineAllocationGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseOrderLineAllocationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderLineId?: boolean
    allocationType?: boolean
    referenceId?: boolean
    quantity?: boolean
    reason?: boolean
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLineAllocation"]>

  export type PurchaseOrderLineAllocationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderLineId?: boolean
    allocationType?: boolean
    referenceId?: boolean
    quantity?: boolean
    reason?: boolean
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLineAllocation"]>

  export type PurchaseOrderLineAllocationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderLineId?: boolean
    allocationType?: boolean
    referenceId?: boolean
    quantity?: boolean
    reason?: boolean
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderLineAllocation"]>

  export type PurchaseOrderLineAllocationSelectScalar = {
    id?: boolean
    tenantId?: boolean
    purchaseOrderLineId?: boolean
    allocationType?: boolean
    referenceId?: boolean
    quantity?: boolean
    reason?: boolean
  }

  export type PurchaseOrderLineAllocationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "purchaseOrderLineId" | "allocationType" | "referenceId" | "quantity" | "reason", ExtArgs["result"]["purchaseOrderLineAllocation"]>
  export type PurchaseOrderLineAllocationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderLineAllocationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderLineAllocationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }

  export type $PurchaseOrderLineAllocationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseOrderLineAllocation"
    objects: {
      purchaseOrderLine: Prisma.$PurchaseOrderLinePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      purchaseOrderLineId: string
      allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
      referenceId: string | null
      quantity: string
      reason: string | null
    }, ExtArgs["result"]["purchaseOrderLineAllocation"]>
    composites: {}
  }

  type PurchaseOrderLineAllocationGetPayload<S extends boolean | null | undefined | PurchaseOrderLineAllocationDefaultArgs> = $Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload, S>

  type PurchaseOrderLineAllocationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseOrderLineAllocationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseOrderLineAllocationCountAggregateInputType | true
    }

  export interface PurchaseOrderLineAllocationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseOrderLineAllocation'], meta: { name: 'PurchaseOrderLineAllocation' } }
    /**
     * Find zero or one PurchaseOrderLineAllocation that matches the filter.
     * @param {PurchaseOrderLineAllocationFindUniqueArgs} args - Arguments to find a PurchaseOrderLineAllocation
     * @example
     * // Get one PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseOrderLineAllocationFindUniqueArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationFindUniqueArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseOrderLineAllocation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseOrderLineAllocationFindUniqueOrThrowArgs} args - Arguments to find a PurchaseOrderLineAllocation
     * @example
     * // Get one PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseOrderLineAllocationFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderLineAllocation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationFindFirstArgs} args - Arguments to find a PurchaseOrderLineAllocation
     * @example
     * // Get one PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseOrderLineAllocationFindFirstArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationFindFirstArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderLineAllocation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationFindFirstOrThrowArgs} args - Arguments to find a PurchaseOrderLineAllocation
     * @example
     * // Get one PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseOrderLineAllocationFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseOrderLineAllocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocations = await prisma.purchaseOrderLineAllocation.findMany()
     * 
     * // Get first 10 PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocations = await prisma.purchaseOrderLineAllocation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseOrderLineAllocationWithIdOnly = await prisma.purchaseOrderLineAllocation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseOrderLineAllocationFindManyArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseOrderLineAllocation.
     * @param {PurchaseOrderLineAllocationCreateArgs} args - Arguments to create a PurchaseOrderLineAllocation.
     * @example
     * // Create one PurchaseOrderLineAllocation
     * const PurchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.create({
     *   data: {
     *     // ... data to create a PurchaseOrderLineAllocation
     *   }
     * })
     * 
     */
    create<T extends PurchaseOrderLineAllocationCreateArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationCreateArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseOrderLineAllocations.
     * @param {PurchaseOrderLineAllocationCreateManyArgs} args - Arguments to create many PurchaseOrderLineAllocations.
     * @example
     * // Create many PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseOrderLineAllocationCreateManyArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseOrderLineAllocations and returns the data saved in the database.
     * @param {PurchaseOrderLineAllocationCreateManyAndReturnArgs} args - Arguments to create many PurchaseOrderLineAllocations.
     * @example
     * // Create many PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseOrderLineAllocations and only return the `id`
     * const purchaseOrderLineAllocationWithIdOnly = await prisma.purchaseOrderLineAllocation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseOrderLineAllocationCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseOrderLineAllocation.
     * @param {PurchaseOrderLineAllocationDeleteArgs} args - Arguments to delete one PurchaseOrderLineAllocation.
     * @example
     * // Delete one PurchaseOrderLineAllocation
     * const PurchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.delete({
     *   where: {
     *     // ... filter to delete one PurchaseOrderLineAllocation
     *   }
     * })
     * 
     */
    delete<T extends PurchaseOrderLineAllocationDeleteArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationDeleteArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseOrderLineAllocation.
     * @param {PurchaseOrderLineAllocationUpdateArgs} args - Arguments to update one PurchaseOrderLineAllocation.
     * @example
     * // Update one PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseOrderLineAllocationUpdateArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationUpdateArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseOrderLineAllocations.
     * @param {PurchaseOrderLineAllocationDeleteManyArgs} args - Arguments to filter PurchaseOrderLineAllocations to delete.
     * @example
     * // Delete a few PurchaseOrderLineAllocations
     * const { count } = await prisma.purchaseOrderLineAllocation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseOrderLineAllocationDeleteManyArgs>(args?: SelectSubset<T, PurchaseOrderLineAllocationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderLineAllocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseOrderLineAllocationUpdateManyArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderLineAllocations and returns the data updated in the database.
     * @param {PurchaseOrderLineAllocationUpdateManyAndReturnArgs} args - Arguments to update many PurchaseOrderLineAllocations.
     * @example
     * // Update many PurchaseOrderLineAllocations
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseOrderLineAllocations and only return the `id`
     * const purchaseOrderLineAllocationWithIdOnly = await prisma.purchaseOrderLineAllocation.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseOrderLineAllocationUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseOrderLineAllocation.
     * @param {PurchaseOrderLineAllocationUpsertArgs} args - Arguments to update or create a PurchaseOrderLineAllocation.
     * @example
     * // Update or create a PurchaseOrderLineAllocation
     * const purchaseOrderLineAllocation = await prisma.purchaseOrderLineAllocation.upsert({
     *   create: {
     *     // ... data to create a PurchaseOrderLineAllocation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseOrderLineAllocation we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseOrderLineAllocationUpsertArgs>(args: SelectSubset<T, PurchaseOrderLineAllocationUpsertArgs<ExtArgs>>): Prisma__PurchaseOrderLineAllocationClient<$Result.GetResult<Prisma.$PurchaseOrderLineAllocationPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseOrderLineAllocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationCountArgs} args - Arguments to filter PurchaseOrderLineAllocations to count.
     * @example
     * // Count the number of PurchaseOrderLineAllocations
     * const count = await prisma.purchaseOrderLineAllocation.count({
     *   where: {
     *     // ... the filter for the PurchaseOrderLineAllocations we want to count
     *   }
     * })
    **/
    count<T extends PurchaseOrderLineAllocationCountArgs>(
      args?: Subset<T, PurchaseOrderLineAllocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseOrderLineAllocationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseOrderLineAllocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseOrderLineAllocationAggregateArgs>(args: Subset<T, PurchaseOrderLineAllocationAggregateArgs>): Prisma.PrismaPromise<GetPurchaseOrderLineAllocationAggregateType<T>>

    /**
     * Group by PurchaseOrderLineAllocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderLineAllocationGroupByArgs} args - Group by arguments.
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
      T extends PurchaseOrderLineAllocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseOrderLineAllocationGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseOrderLineAllocationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseOrderLineAllocationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseOrderLineAllocationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseOrderLineAllocation model
   */
  readonly fields: PurchaseOrderLineAllocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseOrderLineAllocation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseOrderLineAllocationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    purchaseOrderLine<T extends PurchaseOrderLineDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderLineDefaultArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseOrderLineAllocation model
   */ 
  interface PurchaseOrderLineAllocationFieldRefs {
    readonly id: FieldRef<"PurchaseOrderLineAllocation", 'String'>
    readonly tenantId: FieldRef<"PurchaseOrderLineAllocation", 'String'>
    readonly purchaseOrderLineId: FieldRef<"PurchaseOrderLineAllocation", 'String'>
    readonly allocationType: FieldRef<"PurchaseOrderLineAllocation", 'ProcurementPurchaseOrderLineAllocationType'>
    readonly referenceId: FieldRef<"PurchaseOrderLineAllocation", 'String'>
    readonly quantity: FieldRef<"PurchaseOrderLineAllocation", 'String'>
    readonly reason: FieldRef<"PurchaseOrderLineAllocation", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseOrderLineAllocation findUnique
   */
  export type PurchaseOrderLineAllocationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLineAllocation to fetch.
     */
    where: PurchaseOrderLineAllocationWhereUniqueInput
  }

  /**
   * PurchaseOrderLineAllocation findUniqueOrThrow
   */
  export type PurchaseOrderLineAllocationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLineAllocation to fetch.
     */
    where: PurchaseOrderLineAllocationWhereUniqueInput
  }

  /**
   * PurchaseOrderLineAllocation findFirst
   */
  export type PurchaseOrderLineAllocationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLineAllocation to fetch.
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLineAllocations to fetch.
     */
    orderBy?: PurchaseOrderLineAllocationOrderByWithRelationInput | PurchaseOrderLineAllocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderLineAllocations.
     */
    cursor?: PurchaseOrderLineAllocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLineAllocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLineAllocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderLineAllocations.
     */
    distinct?: PurchaseOrderLineAllocationScalarFieldEnum | PurchaseOrderLineAllocationScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLineAllocation findFirstOrThrow
   */
  export type PurchaseOrderLineAllocationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLineAllocation to fetch.
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLineAllocations to fetch.
     */
    orderBy?: PurchaseOrderLineAllocationOrderByWithRelationInput | PurchaseOrderLineAllocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderLineAllocations.
     */
    cursor?: PurchaseOrderLineAllocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLineAllocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLineAllocations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderLineAllocations.
     */
    distinct?: PurchaseOrderLineAllocationScalarFieldEnum | PurchaseOrderLineAllocationScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLineAllocation findMany
   */
  export type PurchaseOrderLineAllocationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderLineAllocations to fetch.
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderLineAllocations to fetch.
     */
    orderBy?: PurchaseOrderLineAllocationOrderByWithRelationInput | PurchaseOrderLineAllocationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseOrderLineAllocations.
     */
    cursor?: PurchaseOrderLineAllocationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderLineAllocations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderLineAllocations.
     */
    skip?: number
    distinct?: PurchaseOrderLineAllocationScalarFieldEnum | PurchaseOrderLineAllocationScalarFieldEnum[]
  }

  /**
   * PurchaseOrderLineAllocation create
   */
  export type PurchaseOrderLineAllocationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseOrderLineAllocation.
     */
    data: XOR<PurchaseOrderLineAllocationCreateInput, PurchaseOrderLineAllocationUncheckedCreateInput>
  }

  /**
   * PurchaseOrderLineAllocation createMany
   */
  export type PurchaseOrderLineAllocationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseOrderLineAllocations.
     */
    data: PurchaseOrderLineAllocationCreateManyInput | PurchaseOrderLineAllocationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrderLineAllocation createManyAndReturn
   */
  export type PurchaseOrderLineAllocationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseOrderLineAllocations.
     */
    data: PurchaseOrderLineAllocationCreateManyInput | PurchaseOrderLineAllocationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderLineAllocation update
   */
  export type PurchaseOrderLineAllocationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseOrderLineAllocation.
     */
    data: XOR<PurchaseOrderLineAllocationUpdateInput, PurchaseOrderLineAllocationUncheckedUpdateInput>
    /**
     * Choose, which PurchaseOrderLineAllocation to update.
     */
    where: PurchaseOrderLineAllocationWhereUniqueInput
  }

  /**
   * PurchaseOrderLineAllocation updateMany
   */
  export type PurchaseOrderLineAllocationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseOrderLineAllocations.
     */
    data: XOR<PurchaseOrderLineAllocationUpdateManyMutationInput, PurchaseOrderLineAllocationUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderLineAllocations to update
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * Limit how many PurchaseOrderLineAllocations to update.
     */
    limit?: number
  }

  /**
   * PurchaseOrderLineAllocation updateManyAndReturn
   */
  export type PurchaseOrderLineAllocationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseOrderLineAllocations.
     */
    data: XOR<PurchaseOrderLineAllocationUpdateManyMutationInput, PurchaseOrderLineAllocationUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderLineAllocations to update
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * Limit how many PurchaseOrderLineAllocations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderLineAllocation upsert
   */
  export type PurchaseOrderLineAllocationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseOrderLineAllocation to update in case it exists.
     */
    where: PurchaseOrderLineAllocationWhereUniqueInput
    /**
     * In case the PurchaseOrderLineAllocation found by the `where` argument doesn't exist, create a new PurchaseOrderLineAllocation with this data.
     */
    create: XOR<PurchaseOrderLineAllocationCreateInput, PurchaseOrderLineAllocationUncheckedCreateInput>
    /**
     * In case the PurchaseOrderLineAllocation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseOrderLineAllocationUpdateInput, PurchaseOrderLineAllocationUncheckedUpdateInput>
  }

  /**
   * PurchaseOrderLineAllocation delete
   */
  export type PurchaseOrderLineAllocationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
    /**
     * Filter which PurchaseOrderLineAllocation to delete.
     */
    where: PurchaseOrderLineAllocationWhereUniqueInput
  }

  /**
   * PurchaseOrderLineAllocation deleteMany
   */
  export type PurchaseOrderLineAllocationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderLineAllocations to delete
     */
    where?: PurchaseOrderLineAllocationWhereInput
    /**
     * Limit how many PurchaseOrderLineAllocations to delete.
     */
    limit?: number
  }

  /**
   * PurchaseOrderLineAllocation without action
   */
  export type PurchaseOrderLineAllocationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderLineAllocation
     */
    select?: PurchaseOrderLineAllocationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderLineAllocation
     */
    omit?: PurchaseOrderLineAllocationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderLineAllocationInclude<ExtArgs> | null
  }


  /**
   * Model PurchaseOrderChange
   */

  export type AggregatePurchaseOrderChange = {
    _count: PurchaseOrderChangeCountAggregateOutputType | null
    _min: PurchaseOrderChangeMinAggregateOutputType | null
    _max: PurchaseOrderChangeMaxAggregateOutputType | null
  }

  export type PurchaseOrderChangeMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderId: string | null
    changeType: string | null
    changeSummary: string | null
    changeReason: string | null
    appliedByOperatorId: string | null
    appliedByDisplayName: string | null
    appliedAt: Date | null
    status: $Enums.ProcurementPurchaseOrderChangeStatus | null
  }

  export type PurchaseOrderChangeMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    purchaseOrderId: string | null
    changeType: string | null
    changeSummary: string | null
    changeReason: string | null
    appliedByOperatorId: string | null
    appliedByDisplayName: string | null
    appliedAt: Date | null
    status: $Enums.ProcurementPurchaseOrderChangeStatus | null
  }

  export type PurchaseOrderChangeCountAggregateOutputType = {
    id: number
    tenantId: number
    purchaseOrderId: number
    changeType: number
    changeSummary: number
    changeReason: number
    appliedByOperatorId: number
    appliedByDisplayName: number
    appliedAt: number
    status: number
    _all: number
  }


  export type PurchaseOrderChangeMinAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    changeType?: true
    changeSummary?: true
    changeReason?: true
    appliedByOperatorId?: true
    appliedByDisplayName?: true
    appliedAt?: true
    status?: true
  }

  export type PurchaseOrderChangeMaxAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    changeType?: true
    changeSummary?: true
    changeReason?: true
    appliedByOperatorId?: true
    appliedByDisplayName?: true
    appliedAt?: true
    status?: true
  }

  export type PurchaseOrderChangeCountAggregateInputType = {
    id?: true
    tenantId?: true
    purchaseOrderId?: true
    changeType?: true
    changeSummary?: true
    changeReason?: true
    appliedByOperatorId?: true
    appliedByDisplayName?: true
    appliedAt?: true
    status?: true
    _all?: true
  }

  export type PurchaseOrderChangeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderChange to aggregate.
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderChanges to fetch.
     */
    orderBy?: PurchaseOrderChangeOrderByWithRelationInput | PurchaseOrderChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PurchaseOrderChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PurchaseOrderChanges
    **/
    _count?: true | PurchaseOrderChangeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PurchaseOrderChangeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PurchaseOrderChangeMaxAggregateInputType
  }

  export type GetPurchaseOrderChangeAggregateType<T extends PurchaseOrderChangeAggregateArgs> = {
        [P in keyof T & keyof AggregatePurchaseOrderChange]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePurchaseOrderChange[P]>
      : GetScalarType<T[P], AggregatePurchaseOrderChange[P]>
  }




  export type PurchaseOrderChangeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PurchaseOrderChangeWhereInput
    orderBy?: PurchaseOrderChangeOrderByWithAggregationInput | PurchaseOrderChangeOrderByWithAggregationInput[]
    by: PurchaseOrderChangeScalarFieldEnum[] | PurchaseOrderChangeScalarFieldEnum
    having?: PurchaseOrderChangeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PurchaseOrderChangeCountAggregateInputType | true
    _min?: PurchaseOrderChangeMinAggregateInputType
    _max?: PurchaseOrderChangeMaxAggregateInputType
  }

  export type PurchaseOrderChangeGroupByOutputType = {
    id: string
    tenantId: string
    purchaseOrderId: string
    changeType: string
    changeSummary: string
    changeReason: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date
    status: $Enums.ProcurementPurchaseOrderChangeStatus
    _count: PurchaseOrderChangeCountAggregateOutputType | null
    _min: PurchaseOrderChangeMinAggregateOutputType | null
    _max: PurchaseOrderChangeMaxAggregateOutputType | null
  }

  type GetPurchaseOrderChangeGroupByPayload<T extends PurchaseOrderChangeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PurchaseOrderChangeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PurchaseOrderChangeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PurchaseOrderChangeGroupByOutputType[P]>
            : GetScalarType<T[P], PurchaseOrderChangeGroupByOutputType[P]>
        }
      >
    >


  export type PurchaseOrderChangeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    changeType?: boolean
    changeSummary?: boolean
    changeReason?: boolean
    appliedByOperatorId?: boolean
    appliedByDisplayName?: boolean
    appliedAt?: boolean
    status?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderChange"]>

  export type PurchaseOrderChangeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    changeType?: boolean
    changeSummary?: boolean
    changeReason?: boolean
    appliedByOperatorId?: boolean
    appliedByDisplayName?: boolean
    appliedAt?: boolean
    status?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderChange"]>

  export type PurchaseOrderChangeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    changeType?: boolean
    changeSummary?: boolean
    changeReason?: boolean
    appliedByOperatorId?: boolean
    appliedByDisplayName?: boolean
    appliedAt?: boolean
    status?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["purchaseOrderChange"]>

  export type PurchaseOrderChangeSelectScalar = {
    id?: boolean
    tenantId?: boolean
    purchaseOrderId?: boolean
    changeType?: boolean
    changeSummary?: boolean
    changeReason?: boolean
    appliedByOperatorId?: boolean
    appliedByDisplayName?: boolean
    appliedAt?: boolean
    status?: boolean
  }

  export type PurchaseOrderChangeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "purchaseOrderId" | "changeType" | "changeSummary" | "changeReason" | "appliedByOperatorId" | "appliedByDisplayName" | "appliedAt" | "status", ExtArgs["result"]["purchaseOrderChange"]>
  export type PurchaseOrderChangeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderChangeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }
  export type PurchaseOrderChangeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
  }

  export type $PurchaseOrderChangePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PurchaseOrderChange"
    objects: {
      purchaseOrder: Prisma.$PurchaseOrderPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      purchaseOrderId: string
      changeType: string
      changeSummary: string
      changeReason: string | null
      appliedByOperatorId: string
      appliedByDisplayName: string
      appliedAt: Date
      status: $Enums.ProcurementPurchaseOrderChangeStatus
    }, ExtArgs["result"]["purchaseOrderChange"]>
    composites: {}
  }

  type PurchaseOrderChangeGetPayload<S extends boolean | null | undefined | PurchaseOrderChangeDefaultArgs> = $Result.GetResult<Prisma.$PurchaseOrderChangePayload, S>

  type PurchaseOrderChangeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PurchaseOrderChangeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PurchaseOrderChangeCountAggregateInputType | true
    }

  export interface PurchaseOrderChangeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PurchaseOrderChange'], meta: { name: 'PurchaseOrderChange' } }
    /**
     * Find zero or one PurchaseOrderChange that matches the filter.
     * @param {PurchaseOrderChangeFindUniqueArgs} args - Arguments to find a PurchaseOrderChange
     * @example
     * // Get one PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PurchaseOrderChangeFindUniqueArgs>(args: SelectSubset<T, PurchaseOrderChangeFindUniqueArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one PurchaseOrderChange that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PurchaseOrderChangeFindUniqueOrThrowArgs} args - Arguments to find a PurchaseOrderChange
     * @example
     * // Get one PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PurchaseOrderChangeFindUniqueOrThrowArgs>(args: SelectSubset<T, PurchaseOrderChangeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderChange that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeFindFirstArgs} args - Arguments to find a PurchaseOrderChange
     * @example
     * // Get one PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PurchaseOrderChangeFindFirstArgs>(args?: SelectSubset<T, PurchaseOrderChangeFindFirstArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first PurchaseOrderChange that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeFindFirstOrThrowArgs} args - Arguments to find a PurchaseOrderChange
     * @example
     * // Get one PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PurchaseOrderChangeFindFirstOrThrowArgs>(args?: SelectSubset<T, PurchaseOrderChangeFindFirstOrThrowArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more PurchaseOrderChanges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PurchaseOrderChanges
     * const purchaseOrderChanges = await prisma.purchaseOrderChange.findMany()
     * 
     * // Get first 10 PurchaseOrderChanges
     * const purchaseOrderChanges = await prisma.purchaseOrderChange.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const purchaseOrderChangeWithIdOnly = await prisma.purchaseOrderChange.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PurchaseOrderChangeFindManyArgs>(args?: SelectSubset<T, PurchaseOrderChangeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a PurchaseOrderChange.
     * @param {PurchaseOrderChangeCreateArgs} args - Arguments to create a PurchaseOrderChange.
     * @example
     * // Create one PurchaseOrderChange
     * const PurchaseOrderChange = await prisma.purchaseOrderChange.create({
     *   data: {
     *     // ... data to create a PurchaseOrderChange
     *   }
     * })
     * 
     */
    create<T extends PurchaseOrderChangeCreateArgs>(args: SelectSubset<T, PurchaseOrderChangeCreateArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many PurchaseOrderChanges.
     * @param {PurchaseOrderChangeCreateManyArgs} args - Arguments to create many PurchaseOrderChanges.
     * @example
     * // Create many PurchaseOrderChanges
     * const purchaseOrderChange = await prisma.purchaseOrderChange.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PurchaseOrderChangeCreateManyArgs>(args?: SelectSubset<T, PurchaseOrderChangeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PurchaseOrderChanges and returns the data saved in the database.
     * @param {PurchaseOrderChangeCreateManyAndReturnArgs} args - Arguments to create many PurchaseOrderChanges.
     * @example
     * // Create many PurchaseOrderChanges
     * const purchaseOrderChange = await prisma.purchaseOrderChange.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PurchaseOrderChanges and only return the `id`
     * const purchaseOrderChangeWithIdOnly = await prisma.purchaseOrderChange.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PurchaseOrderChangeCreateManyAndReturnArgs>(args?: SelectSubset<T, PurchaseOrderChangeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a PurchaseOrderChange.
     * @param {PurchaseOrderChangeDeleteArgs} args - Arguments to delete one PurchaseOrderChange.
     * @example
     * // Delete one PurchaseOrderChange
     * const PurchaseOrderChange = await prisma.purchaseOrderChange.delete({
     *   where: {
     *     // ... filter to delete one PurchaseOrderChange
     *   }
     * })
     * 
     */
    delete<T extends PurchaseOrderChangeDeleteArgs>(args: SelectSubset<T, PurchaseOrderChangeDeleteArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one PurchaseOrderChange.
     * @param {PurchaseOrderChangeUpdateArgs} args - Arguments to update one PurchaseOrderChange.
     * @example
     * // Update one PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PurchaseOrderChangeUpdateArgs>(args: SelectSubset<T, PurchaseOrderChangeUpdateArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more PurchaseOrderChanges.
     * @param {PurchaseOrderChangeDeleteManyArgs} args - Arguments to filter PurchaseOrderChanges to delete.
     * @example
     * // Delete a few PurchaseOrderChanges
     * const { count } = await prisma.purchaseOrderChange.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PurchaseOrderChangeDeleteManyArgs>(args?: SelectSubset<T, PurchaseOrderChangeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderChanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PurchaseOrderChanges
     * const purchaseOrderChange = await prisma.purchaseOrderChange.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PurchaseOrderChangeUpdateManyArgs>(args: SelectSubset<T, PurchaseOrderChangeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PurchaseOrderChanges and returns the data updated in the database.
     * @param {PurchaseOrderChangeUpdateManyAndReturnArgs} args - Arguments to update many PurchaseOrderChanges.
     * @example
     * // Update many PurchaseOrderChanges
     * const purchaseOrderChange = await prisma.purchaseOrderChange.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PurchaseOrderChanges and only return the `id`
     * const purchaseOrderChangeWithIdOnly = await prisma.purchaseOrderChange.updateManyAndReturn({
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
    updateManyAndReturn<T extends PurchaseOrderChangeUpdateManyAndReturnArgs>(args: SelectSubset<T, PurchaseOrderChangeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one PurchaseOrderChange.
     * @param {PurchaseOrderChangeUpsertArgs} args - Arguments to update or create a PurchaseOrderChange.
     * @example
     * // Update or create a PurchaseOrderChange
     * const purchaseOrderChange = await prisma.purchaseOrderChange.upsert({
     *   create: {
     *     // ... data to create a PurchaseOrderChange
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PurchaseOrderChange we want to update
     *   }
     * })
     */
    upsert<T extends PurchaseOrderChangeUpsertArgs>(args: SelectSubset<T, PurchaseOrderChangeUpsertArgs<ExtArgs>>): Prisma__PurchaseOrderChangeClient<$Result.GetResult<Prisma.$PurchaseOrderChangePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of PurchaseOrderChanges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeCountArgs} args - Arguments to filter PurchaseOrderChanges to count.
     * @example
     * // Count the number of PurchaseOrderChanges
     * const count = await prisma.purchaseOrderChange.count({
     *   where: {
     *     // ... the filter for the PurchaseOrderChanges we want to count
     *   }
     * })
    **/
    count<T extends PurchaseOrderChangeCountArgs>(
      args?: Subset<T, PurchaseOrderChangeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PurchaseOrderChangeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PurchaseOrderChange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PurchaseOrderChangeAggregateArgs>(args: Subset<T, PurchaseOrderChangeAggregateArgs>): Prisma.PrismaPromise<GetPurchaseOrderChangeAggregateType<T>>

    /**
     * Group by PurchaseOrderChange.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PurchaseOrderChangeGroupByArgs} args - Group by arguments.
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
      T extends PurchaseOrderChangeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PurchaseOrderChangeGroupByArgs['orderBy'] }
        : { orderBy?: PurchaseOrderChangeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PurchaseOrderChangeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPurchaseOrderChangeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PurchaseOrderChange model
   */
  readonly fields: PurchaseOrderChangeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PurchaseOrderChange.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PurchaseOrderChangeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    purchaseOrder<T extends PurchaseOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderDefaultArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the PurchaseOrderChange model
   */ 
  interface PurchaseOrderChangeFieldRefs {
    readonly id: FieldRef<"PurchaseOrderChange", 'String'>
    readonly tenantId: FieldRef<"PurchaseOrderChange", 'String'>
    readonly purchaseOrderId: FieldRef<"PurchaseOrderChange", 'String'>
    readonly changeType: FieldRef<"PurchaseOrderChange", 'String'>
    readonly changeSummary: FieldRef<"PurchaseOrderChange", 'String'>
    readonly changeReason: FieldRef<"PurchaseOrderChange", 'String'>
    readonly appliedByOperatorId: FieldRef<"PurchaseOrderChange", 'String'>
    readonly appliedByDisplayName: FieldRef<"PurchaseOrderChange", 'String'>
    readonly appliedAt: FieldRef<"PurchaseOrderChange", 'DateTime'>
    readonly status: FieldRef<"PurchaseOrderChange", 'ProcurementPurchaseOrderChangeStatus'>
  }
    

  // Custom InputTypes
  /**
   * PurchaseOrderChange findUnique
   */
  export type PurchaseOrderChangeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderChange to fetch.
     */
    where: PurchaseOrderChangeWhereUniqueInput
  }

  /**
   * PurchaseOrderChange findUniqueOrThrow
   */
  export type PurchaseOrderChangeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderChange to fetch.
     */
    where: PurchaseOrderChangeWhereUniqueInput
  }

  /**
   * PurchaseOrderChange findFirst
   */
  export type PurchaseOrderChangeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderChange to fetch.
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderChanges to fetch.
     */
    orderBy?: PurchaseOrderChangeOrderByWithRelationInput | PurchaseOrderChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderChanges.
     */
    cursor?: PurchaseOrderChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderChanges.
     */
    distinct?: PurchaseOrderChangeScalarFieldEnum | PurchaseOrderChangeScalarFieldEnum[]
  }

  /**
   * PurchaseOrderChange findFirstOrThrow
   */
  export type PurchaseOrderChangeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderChange to fetch.
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderChanges to fetch.
     */
    orderBy?: PurchaseOrderChangeOrderByWithRelationInput | PurchaseOrderChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PurchaseOrderChanges.
     */
    cursor?: PurchaseOrderChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderChanges.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PurchaseOrderChanges.
     */
    distinct?: PurchaseOrderChangeScalarFieldEnum | PurchaseOrderChangeScalarFieldEnum[]
  }

  /**
   * PurchaseOrderChange findMany
   */
  export type PurchaseOrderChangeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter, which PurchaseOrderChanges to fetch.
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PurchaseOrderChanges to fetch.
     */
    orderBy?: PurchaseOrderChangeOrderByWithRelationInput | PurchaseOrderChangeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PurchaseOrderChanges.
     */
    cursor?: PurchaseOrderChangeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PurchaseOrderChanges from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PurchaseOrderChanges.
     */
    skip?: number
    distinct?: PurchaseOrderChangeScalarFieldEnum | PurchaseOrderChangeScalarFieldEnum[]
  }

  /**
   * PurchaseOrderChange create
   */
  export type PurchaseOrderChangeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * The data needed to create a PurchaseOrderChange.
     */
    data: XOR<PurchaseOrderChangeCreateInput, PurchaseOrderChangeUncheckedCreateInput>
  }

  /**
   * PurchaseOrderChange createMany
   */
  export type PurchaseOrderChangeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PurchaseOrderChanges.
     */
    data: PurchaseOrderChangeCreateManyInput | PurchaseOrderChangeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PurchaseOrderChange createManyAndReturn
   */
  export type PurchaseOrderChangeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * The data used to create many PurchaseOrderChanges.
     */
    data: PurchaseOrderChangeCreateManyInput | PurchaseOrderChangeCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderChange update
   */
  export type PurchaseOrderChangeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * The data needed to update a PurchaseOrderChange.
     */
    data: XOR<PurchaseOrderChangeUpdateInput, PurchaseOrderChangeUncheckedUpdateInput>
    /**
     * Choose, which PurchaseOrderChange to update.
     */
    where: PurchaseOrderChangeWhereUniqueInput
  }

  /**
   * PurchaseOrderChange updateMany
   */
  export type PurchaseOrderChangeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PurchaseOrderChanges.
     */
    data: XOR<PurchaseOrderChangeUpdateManyMutationInput, PurchaseOrderChangeUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderChanges to update
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * Limit how many PurchaseOrderChanges to update.
     */
    limit?: number
  }

  /**
   * PurchaseOrderChange updateManyAndReturn
   */
  export type PurchaseOrderChangeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * The data used to update PurchaseOrderChanges.
     */
    data: XOR<PurchaseOrderChangeUpdateManyMutationInput, PurchaseOrderChangeUncheckedUpdateManyInput>
    /**
     * Filter which PurchaseOrderChanges to update
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * Limit how many PurchaseOrderChanges to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PurchaseOrderChange upsert
   */
  export type PurchaseOrderChangeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * The filter to search for the PurchaseOrderChange to update in case it exists.
     */
    where: PurchaseOrderChangeWhereUniqueInput
    /**
     * In case the PurchaseOrderChange found by the `where` argument doesn't exist, create a new PurchaseOrderChange with this data.
     */
    create: XOR<PurchaseOrderChangeCreateInput, PurchaseOrderChangeUncheckedCreateInput>
    /**
     * In case the PurchaseOrderChange was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PurchaseOrderChangeUpdateInput, PurchaseOrderChangeUncheckedUpdateInput>
  }

  /**
   * PurchaseOrderChange delete
   */
  export type PurchaseOrderChangeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
    /**
     * Filter which PurchaseOrderChange to delete.
     */
    where: PurchaseOrderChangeWhereUniqueInput
  }

  /**
   * PurchaseOrderChange deleteMany
   */
  export type PurchaseOrderChangeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PurchaseOrderChanges to delete
     */
    where?: PurchaseOrderChangeWhereInput
    /**
     * Limit how many PurchaseOrderChanges to delete.
     */
    limit?: number
  }

  /**
   * PurchaseOrderChange without action
   */
  export type PurchaseOrderChangeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PurchaseOrderChange
     */
    select?: PurchaseOrderChangeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PurchaseOrderChange
     */
    omit?: PurchaseOrderChangeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PurchaseOrderChangeInclude<ExtArgs> | null
  }


  /**
   * Model ReceivingExpectation
   */

  export type AggregateReceivingExpectation = {
    _count: ReceivingExpectationCountAggregateOutputType | null
    _min: ReceivingExpectationMinAggregateOutputType | null
    _max: ReceivingExpectationMaxAggregateOutputType | null
  }

  export type ReceivingExpectationMinAggregateOutputType = {
    id: string | null
    expectationNo: string | null
    tenantId: string | null
    orgId: string | null
    purchaseOrderId: string | null
    purchaseOrderLineId: string | null
    supplierId: string | null
    expectedQuantity: string | null
    receivedQuantitySummary: string | null
    openQuantity: string | null
    expectedReceiptDate: string | null
    status: $Enums.ProcurementReceivingExpectationStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceivingExpectationMaxAggregateOutputType = {
    id: string | null
    expectationNo: string | null
    tenantId: string | null
    orgId: string | null
    purchaseOrderId: string | null
    purchaseOrderLineId: string | null
    supplierId: string | null
    expectedQuantity: string | null
    receivedQuantitySummary: string | null
    openQuantity: string | null
    expectedReceiptDate: string | null
    status: $Enums.ProcurementReceivingExpectationStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReceivingExpectationCountAggregateOutputType = {
    id: number
    expectationNo: number
    tenantId: number
    orgId: number
    purchaseOrderId: number
    purchaseOrderLineId: number
    supplierId: number
    expectedQuantity: number
    receivedQuantitySummary: number
    openQuantity: number
    expectedReceiptDate: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReceivingExpectationMinAggregateInputType = {
    id?: true
    expectationNo?: true
    tenantId?: true
    orgId?: true
    purchaseOrderId?: true
    purchaseOrderLineId?: true
    supplierId?: true
    expectedQuantity?: true
    receivedQuantitySummary?: true
    openQuantity?: true
    expectedReceiptDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceivingExpectationMaxAggregateInputType = {
    id?: true
    expectationNo?: true
    tenantId?: true
    orgId?: true
    purchaseOrderId?: true
    purchaseOrderLineId?: true
    supplierId?: true
    expectedQuantity?: true
    receivedQuantitySummary?: true
    openQuantity?: true
    expectedReceiptDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReceivingExpectationCountAggregateInputType = {
    id?: true
    expectationNo?: true
    tenantId?: true
    orgId?: true
    purchaseOrderId?: true
    purchaseOrderLineId?: true
    supplierId?: true
    expectedQuantity?: true
    receivedQuantitySummary?: true
    openQuantity?: true
    expectedReceiptDate?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReceivingExpectationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivingExpectation to aggregate.
     */
    where?: ReceivingExpectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingExpectations to fetch.
     */
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReceivingExpectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingExpectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingExpectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReceivingExpectations
    **/
    _count?: true | ReceivingExpectationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReceivingExpectationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReceivingExpectationMaxAggregateInputType
  }

  export type GetReceivingExpectationAggregateType<T extends ReceivingExpectationAggregateArgs> = {
        [P in keyof T & keyof AggregateReceivingExpectation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReceivingExpectation[P]>
      : GetScalarType<T[P], AggregateReceivingExpectation[P]>
  }




  export type ReceivingExpectationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceivingExpectationWhereInput
    orderBy?: ReceivingExpectationOrderByWithAggregationInput | ReceivingExpectationOrderByWithAggregationInput[]
    by: ReceivingExpectationScalarFieldEnum[] | ReceivingExpectationScalarFieldEnum
    having?: ReceivingExpectationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReceivingExpectationCountAggregateInputType | true
    _min?: ReceivingExpectationMinAggregateInputType
    _max?: ReceivingExpectationMaxAggregateInputType
  }

  export type ReceivingExpectationGroupByOutputType = {
    id: string
    expectationNo: string
    tenantId: string
    orgId: string | null
    purchaseOrderId: string
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date
    updatedAt: Date
    _count: ReceivingExpectationCountAggregateOutputType | null
    _min: ReceivingExpectationMinAggregateOutputType | null
    _max: ReceivingExpectationMaxAggregateOutputType | null
  }

  type GetReceivingExpectationGroupByPayload<T extends ReceivingExpectationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReceivingExpectationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReceivingExpectationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReceivingExpectationGroupByOutputType[P]>
            : GetScalarType<T[P], ReceivingExpectationGroupByOutputType[P]>
        }
      >
    >


  export type ReceivingExpectationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    expectationNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    purchaseOrderId?: boolean
    purchaseOrderLineId?: boolean
    supplierId?: boolean
    expectedQuantity?: boolean
    receivedQuantitySummary?: boolean
    openQuantity?: boolean
    expectedReceiptDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    discrepancy?: boolean | ReceivingExpectation$discrepancyArgs<ExtArgs>
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingExpectation"]>

  export type ReceivingExpectationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    expectationNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    purchaseOrderId?: boolean
    purchaseOrderLineId?: boolean
    supplierId?: boolean
    expectedQuantity?: boolean
    receivedQuantitySummary?: boolean
    openQuantity?: boolean
    expectedReceiptDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingExpectation"]>

  export type ReceivingExpectationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    expectationNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    purchaseOrderId?: boolean
    purchaseOrderLineId?: boolean
    supplierId?: boolean
    expectedQuantity?: boolean
    receivedQuantitySummary?: boolean
    openQuantity?: boolean
    expectedReceiptDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingExpectation"]>

  export type ReceivingExpectationSelectScalar = {
    id?: boolean
    expectationNo?: boolean
    tenantId?: boolean
    orgId?: boolean
    purchaseOrderId?: boolean
    purchaseOrderLineId?: boolean
    supplierId?: boolean
    expectedQuantity?: boolean
    receivedQuantitySummary?: boolean
    openQuantity?: boolean
    expectedReceiptDate?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReceivingExpectationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "expectationNo" | "tenantId" | "orgId" | "purchaseOrderId" | "purchaseOrderLineId" | "supplierId" | "expectedQuantity" | "receivedQuantitySummary" | "openQuantity" | "expectedReceiptDate" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["receivingExpectation"]>
  export type ReceivingExpectationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    discrepancy?: boolean | ReceivingExpectation$discrepancyArgs<ExtArgs>
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }
  export type ReceivingExpectationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }
  export type ReceivingExpectationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    purchaseOrder?: boolean | PurchaseOrderDefaultArgs<ExtArgs>
    purchaseOrderLine?: boolean | PurchaseOrderLineDefaultArgs<ExtArgs>
  }

  export type $ReceivingExpectationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReceivingExpectation"
    objects: {
      discrepancy: Prisma.$ReceivingDiscrepancyPayload<ExtArgs> | null
      purchaseOrder: Prisma.$PurchaseOrderPayload<ExtArgs>
      purchaseOrderLine: Prisma.$PurchaseOrderLinePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      expectationNo: string
      tenantId: string
      orgId: string | null
      purchaseOrderId: string
      purchaseOrderLineId: string
      supplierId: string
      expectedQuantity: string
      receivedQuantitySummary: string
      openQuantity: string
      expectedReceiptDate: string | null
      status: $Enums.ProcurementReceivingExpectationStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["receivingExpectation"]>
    composites: {}
  }

  type ReceivingExpectationGetPayload<S extends boolean | null | undefined | ReceivingExpectationDefaultArgs> = $Result.GetResult<Prisma.$ReceivingExpectationPayload, S>

  type ReceivingExpectationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReceivingExpectationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReceivingExpectationCountAggregateInputType | true
    }

  export interface ReceivingExpectationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReceivingExpectation'], meta: { name: 'ReceivingExpectation' } }
    /**
     * Find zero or one ReceivingExpectation that matches the filter.
     * @param {ReceivingExpectationFindUniqueArgs} args - Arguments to find a ReceivingExpectation
     * @example
     * // Get one ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReceivingExpectationFindUniqueArgs>(args: SelectSubset<T, ReceivingExpectationFindUniqueArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ReceivingExpectation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReceivingExpectationFindUniqueOrThrowArgs} args - Arguments to find a ReceivingExpectation
     * @example
     * // Get one ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReceivingExpectationFindUniqueOrThrowArgs>(args: SelectSubset<T, ReceivingExpectationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ReceivingExpectation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationFindFirstArgs} args - Arguments to find a ReceivingExpectation
     * @example
     * // Get one ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReceivingExpectationFindFirstArgs>(args?: SelectSubset<T, ReceivingExpectationFindFirstArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ReceivingExpectation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationFindFirstOrThrowArgs} args - Arguments to find a ReceivingExpectation
     * @example
     * // Get one ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReceivingExpectationFindFirstOrThrowArgs>(args?: SelectSubset<T, ReceivingExpectationFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ReceivingExpectations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReceivingExpectations
     * const receivingExpectations = await prisma.receivingExpectation.findMany()
     * 
     * // Get first 10 ReceivingExpectations
     * const receivingExpectations = await prisma.receivingExpectation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const receivingExpectationWithIdOnly = await prisma.receivingExpectation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReceivingExpectationFindManyArgs>(args?: SelectSubset<T, ReceivingExpectationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ReceivingExpectation.
     * @param {ReceivingExpectationCreateArgs} args - Arguments to create a ReceivingExpectation.
     * @example
     * // Create one ReceivingExpectation
     * const ReceivingExpectation = await prisma.receivingExpectation.create({
     *   data: {
     *     // ... data to create a ReceivingExpectation
     *   }
     * })
     * 
     */
    create<T extends ReceivingExpectationCreateArgs>(args: SelectSubset<T, ReceivingExpectationCreateArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ReceivingExpectations.
     * @param {ReceivingExpectationCreateManyArgs} args - Arguments to create many ReceivingExpectations.
     * @example
     * // Create many ReceivingExpectations
     * const receivingExpectation = await prisma.receivingExpectation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReceivingExpectationCreateManyArgs>(args?: SelectSubset<T, ReceivingExpectationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReceivingExpectations and returns the data saved in the database.
     * @param {ReceivingExpectationCreateManyAndReturnArgs} args - Arguments to create many ReceivingExpectations.
     * @example
     * // Create many ReceivingExpectations
     * const receivingExpectation = await prisma.receivingExpectation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReceivingExpectations and only return the `id`
     * const receivingExpectationWithIdOnly = await prisma.receivingExpectation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReceivingExpectationCreateManyAndReturnArgs>(args?: SelectSubset<T, ReceivingExpectationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ReceivingExpectation.
     * @param {ReceivingExpectationDeleteArgs} args - Arguments to delete one ReceivingExpectation.
     * @example
     * // Delete one ReceivingExpectation
     * const ReceivingExpectation = await prisma.receivingExpectation.delete({
     *   where: {
     *     // ... filter to delete one ReceivingExpectation
     *   }
     * })
     * 
     */
    delete<T extends ReceivingExpectationDeleteArgs>(args: SelectSubset<T, ReceivingExpectationDeleteArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ReceivingExpectation.
     * @param {ReceivingExpectationUpdateArgs} args - Arguments to update one ReceivingExpectation.
     * @example
     * // Update one ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReceivingExpectationUpdateArgs>(args: SelectSubset<T, ReceivingExpectationUpdateArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ReceivingExpectations.
     * @param {ReceivingExpectationDeleteManyArgs} args - Arguments to filter ReceivingExpectations to delete.
     * @example
     * // Delete a few ReceivingExpectations
     * const { count } = await prisma.receivingExpectation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReceivingExpectationDeleteManyArgs>(args?: SelectSubset<T, ReceivingExpectationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivingExpectations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReceivingExpectations
     * const receivingExpectation = await prisma.receivingExpectation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReceivingExpectationUpdateManyArgs>(args: SelectSubset<T, ReceivingExpectationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivingExpectations and returns the data updated in the database.
     * @param {ReceivingExpectationUpdateManyAndReturnArgs} args - Arguments to update many ReceivingExpectations.
     * @example
     * // Update many ReceivingExpectations
     * const receivingExpectation = await prisma.receivingExpectation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ReceivingExpectations and only return the `id`
     * const receivingExpectationWithIdOnly = await prisma.receivingExpectation.updateManyAndReturn({
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
    updateManyAndReturn<T extends ReceivingExpectationUpdateManyAndReturnArgs>(args: SelectSubset<T, ReceivingExpectationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ReceivingExpectation.
     * @param {ReceivingExpectationUpsertArgs} args - Arguments to update or create a ReceivingExpectation.
     * @example
     * // Update or create a ReceivingExpectation
     * const receivingExpectation = await prisma.receivingExpectation.upsert({
     *   create: {
     *     // ... data to create a ReceivingExpectation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReceivingExpectation we want to update
     *   }
     * })
     */
    upsert<T extends ReceivingExpectationUpsertArgs>(args: SelectSubset<T, ReceivingExpectationUpsertArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ReceivingExpectations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationCountArgs} args - Arguments to filter ReceivingExpectations to count.
     * @example
     * // Count the number of ReceivingExpectations
     * const count = await prisma.receivingExpectation.count({
     *   where: {
     *     // ... the filter for the ReceivingExpectations we want to count
     *   }
     * })
    **/
    count<T extends ReceivingExpectationCountArgs>(
      args?: Subset<T, ReceivingExpectationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReceivingExpectationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReceivingExpectation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReceivingExpectationAggregateArgs>(args: Subset<T, ReceivingExpectationAggregateArgs>): Prisma.PrismaPromise<GetReceivingExpectationAggregateType<T>>

    /**
     * Group by ReceivingExpectation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingExpectationGroupByArgs} args - Group by arguments.
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
      T extends ReceivingExpectationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReceivingExpectationGroupByArgs['orderBy'] }
        : { orderBy?: ReceivingExpectationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReceivingExpectationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReceivingExpectationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReceivingExpectation model
   */
  readonly fields: ReceivingExpectationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReceivingExpectation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReceivingExpectationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    discrepancy<T extends ReceivingExpectation$discrepancyArgs<ExtArgs> = {}>(args?: Subset<T, ReceivingExpectation$discrepancyArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    purchaseOrder<T extends PurchaseOrderDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderDefaultArgs<ExtArgs>>): Prisma__PurchaseOrderClient<$Result.GetResult<Prisma.$PurchaseOrderPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    purchaseOrderLine<T extends PurchaseOrderLineDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PurchaseOrderLineDefaultArgs<ExtArgs>>): Prisma__PurchaseOrderLineClient<$Result.GetResult<Prisma.$PurchaseOrderLinePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the ReceivingExpectation model
   */ 
  interface ReceivingExpectationFieldRefs {
    readonly id: FieldRef<"ReceivingExpectation", 'String'>
    readonly expectationNo: FieldRef<"ReceivingExpectation", 'String'>
    readonly tenantId: FieldRef<"ReceivingExpectation", 'String'>
    readonly orgId: FieldRef<"ReceivingExpectation", 'String'>
    readonly purchaseOrderId: FieldRef<"ReceivingExpectation", 'String'>
    readonly purchaseOrderLineId: FieldRef<"ReceivingExpectation", 'String'>
    readonly supplierId: FieldRef<"ReceivingExpectation", 'String'>
    readonly expectedQuantity: FieldRef<"ReceivingExpectation", 'String'>
    readonly receivedQuantitySummary: FieldRef<"ReceivingExpectation", 'String'>
    readonly openQuantity: FieldRef<"ReceivingExpectation", 'String'>
    readonly expectedReceiptDate: FieldRef<"ReceivingExpectation", 'String'>
    readonly status: FieldRef<"ReceivingExpectation", 'ProcurementReceivingExpectationStatus'>
    readonly createdAt: FieldRef<"ReceivingExpectation", 'DateTime'>
    readonly updatedAt: FieldRef<"ReceivingExpectation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReceivingExpectation findUnique
   */
  export type ReceivingExpectationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingExpectation to fetch.
     */
    where: ReceivingExpectationWhereUniqueInput
  }

  /**
   * ReceivingExpectation findUniqueOrThrow
   */
  export type ReceivingExpectationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingExpectation to fetch.
     */
    where: ReceivingExpectationWhereUniqueInput
  }

  /**
   * ReceivingExpectation findFirst
   */
  export type ReceivingExpectationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingExpectation to fetch.
     */
    where?: ReceivingExpectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingExpectations to fetch.
     */
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivingExpectations.
     */
    cursor?: ReceivingExpectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingExpectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingExpectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivingExpectations.
     */
    distinct?: ReceivingExpectationScalarFieldEnum | ReceivingExpectationScalarFieldEnum[]
  }

  /**
   * ReceivingExpectation findFirstOrThrow
   */
  export type ReceivingExpectationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingExpectation to fetch.
     */
    where?: ReceivingExpectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingExpectations to fetch.
     */
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivingExpectations.
     */
    cursor?: ReceivingExpectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingExpectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingExpectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivingExpectations.
     */
    distinct?: ReceivingExpectationScalarFieldEnum | ReceivingExpectationScalarFieldEnum[]
  }

  /**
   * ReceivingExpectation findMany
   */
  export type ReceivingExpectationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingExpectations to fetch.
     */
    where?: ReceivingExpectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingExpectations to fetch.
     */
    orderBy?: ReceivingExpectationOrderByWithRelationInput | ReceivingExpectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReceivingExpectations.
     */
    cursor?: ReceivingExpectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingExpectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingExpectations.
     */
    skip?: number
    distinct?: ReceivingExpectationScalarFieldEnum | ReceivingExpectationScalarFieldEnum[]
  }

  /**
   * ReceivingExpectation create
   */
  export type ReceivingExpectationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * The data needed to create a ReceivingExpectation.
     */
    data: XOR<ReceivingExpectationCreateInput, ReceivingExpectationUncheckedCreateInput>
  }

  /**
   * ReceivingExpectation createMany
   */
  export type ReceivingExpectationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReceivingExpectations.
     */
    data: ReceivingExpectationCreateManyInput | ReceivingExpectationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReceivingExpectation createManyAndReturn
   */
  export type ReceivingExpectationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * The data used to create many ReceivingExpectations.
     */
    data: ReceivingExpectationCreateManyInput | ReceivingExpectationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceivingExpectation update
   */
  export type ReceivingExpectationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * The data needed to update a ReceivingExpectation.
     */
    data: XOR<ReceivingExpectationUpdateInput, ReceivingExpectationUncheckedUpdateInput>
    /**
     * Choose, which ReceivingExpectation to update.
     */
    where: ReceivingExpectationWhereUniqueInput
  }

  /**
   * ReceivingExpectation updateMany
   */
  export type ReceivingExpectationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReceivingExpectations.
     */
    data: XOR<ReceivingExpectationUpdateManyMutationInput, ReceivingExpectationUncheckedUpdateManyInput>
    /**
     * Filter which ReceivingExpectations to update
     */
    where?: ReceivingExpectationWhereInput
    /**
     * Limit how many ReceivingExpectations to update.
     */
    limit?: number
  }

  /**
   * ReceivingExpectation updateManyAndReturn
   */
  export type ReceivingExpectationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * The data used to update ReceivingExpectations.
     */
    data: XOR<ReceivingExpectationUpdateManyMutationInput, ReceivingExpectationUncheckedUpdateManyInput>
    /**
     * Filter which ReceivingExpectations to update
     */
    where?: ReceivingExpectationWhereInput
    /**
     * Limit how many ReceivingExpectations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceivingExpectation upsert
   */
  export type ReceivingExpectationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * The filter to search for the ReceivingExpectation to update in case it exists.
     */
    where: ReceivingExpectationWhereUniqueInput
    /**
     * In case the ReceivingExpectation found by the `where` argument doesn't exist, create a new ReceivingExpectation with this data.
     */
    create: XOR<ReceivingExpectationCreateInput, ReceivingExpectationUncheckedCreateInput>
    /**
     * In case the ReceivingExpectation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReceivingExpectationUpdateInput, ReceivingExpectationUncheckedUpdateInput>
  }

  /**
   * ReceivingExpectation delete
   */
  export type ReceivingExpectationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
    /**
     * Filter which ReceivingExpectation to delete.
     */
    where: ReceivingExpectationWhereUniqueInput
  }

  /**
   * ReceivingExpectation deleteMany
   */
  export type ReceivingExpectationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivingExpectations to delete
     */
    where?: ReceivingExpectationWhereInput
    /**
     * Limit how many ReceivingExpectations to delete.
     */
    limit?: number
  }

  /**
   * ReceivingExpectation.discrepancy
   */
  export type ReceivingExpectation$discrepancyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    where?: ReceivingDiscrepancyWhereInput
  }

  /**
   * ReceivingExpectation without action
   */
  export type ReceivingExpectationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingExpectation
     */
    select?: ReceivingExpectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingExpectation
     */
    omit?: ReceivingExpectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingExpectationInclude<ExtArgs> | null
  }


  /**
   * Model ReceivingDiscrepancy
   */

  export type AggregateReceivingDiscrepancy = {
    _count: ReceivingDiscrepancyCountAggregateOutputType | null
    _min: ReceivingDiscrepancyMinAggregateOutputType | null
    _max: ReceivingDiscrepancyMaxAggregateOutputType | null
  }

  export type ReceivingDiscrepancyMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    receivingExpectationId: string | null
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType | null
    summary: string | null
    status: $Enums.ProcurementReceivingDiscrepancyStatus | null
    resolutionCode: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote: string | null
    resolvedAt: Date | null
  }

  export type ReceivingDiscrepancyMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    receivingExpectationId: string | null
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType | null
    summary: string | null
    status: $Enums.ProcurementReceivingDiscrepancyStatus | null
    resolutionCode: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote: string | null
    resolvedAt: Date | null
  }

  export type ReceivingDiscrepancyCountAggregateOutputType = {
    id: number
    tenantId: number
    receivingExpectationId: number
    discrepancyType: number
    summary: number
    status: number
    resolutionCode: number
    resolutionNote: number
    resolvedAt: number
    _all: number
  }


  export type ReceivingDiscrepancyMinAggregateInputType = {
    id?: true
    tenantId?: true
    receivingExpectationId?: true
    discrepancyType?: true
    summary?: true
    status?: true
    resolutionCode?: true
    resolutionNote?: true
    resolvedAt?: true
  }

  export type ReceivingDiscrepancyMaxAggregateInputType = {
    id?: true
    tenantId?: true
    receivingExpectationId?: true
    discrepancyType?: true
    summary?: true
    status?: true
    resolutionCode?: true
    resolutionNote?: true
    resolvedAt?: true
  }

  export type ReceivingDiscrepancyCountAggregateInputType = {
    id?: true
    tenantId?: true
    receivingExpectationId?: true
    discrepancyType?: true
    summary?: true
    status?: true
    resolutionCode?: true
    resolutionNote?: true
    resolvedAt?: true
    _all?: true
  }

  export type ReceivingDiscrepancyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivingDiscrepancy to aggregate.
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingDiscrepancies to fetch.
     */
    orderBy?: ReceivingDiscrepancyOrderByWithRelationInput | ReceivingDiscrepancyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReceivingDiscrepancyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingDiscrepancies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingDiscrepancies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReceivingDiscrepancies
    **/
    _count?: true | ReceivingDiscrepancyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReceivingDiscrepancyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReceivingDiscrepancyMaxAggregateInputType
  }

  export type GetReceivingDiscrepancyAggregateType<T extends ReceivingDiscrepancyAggregateArgs> = {
        [P in keyof T & keyof AggregateReceivingDiscrepancy]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReceivingDiscrepancy[P]>
      : GetScalarType<T[P], AggregateReceivingDiscrepancy[P]>
  }




  export type ReceivingDiscrepancyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceivingDiscrepancyWhereInput
    orderBy?: ReceivingDiscrepancyOrderByWithAggregationInput | ReceivingDiscrepancyOrderByWithAggregationInput[]
    by: ReceivingDiscrepancyScalarFieldEnum[] | ReceivingDiscrepancyScalarFieldEnum
    having?: ReceivingDiscrepancyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReceivingDiscrepancyCountAggregateInputType | true
    _min?: ReceivingDiscrepancyMinAggregateInputType
    _max?: ReceivingDiscrepancyMaxAggregateInputType
  }

  export type ReceivingDiscrepancyGroupByOutputType = {
    id: string
    tenantId: string
    receivingExpectationId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote: string | null
    resolvedAt: Date | null
    _count: ReceivingDiscrepancyCountAggregateOutputType | null
    _min: ReceivingDiscrepancyMinAggregateOutputType | null
    _max: ReceivingDiscrepancyMaxAggregateOutputType | null
  }

  type GetReceivingDiscrepancyGroupByPayload<T extends ReceivingDiscrepancyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReceivingDiscrepancyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReceivingDiscrepancyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReceivingDiscrepancyGroupByOutputType[P]>
            : GetScalarType<T[P], ReceivingDiscrepancyGroupByOutputType[P]>
        }
      >
    >


  export type ReceivingDiscrepancySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receivingExpectationId?: boolean
    discrepancyType?: boolean
    summary?: boolean
    status?: boolean
    resolutionCode?: boolean
    resolutionNote?: boolean
    resolvedAt?: boolean
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingDiscrepancy"]>

  export type ReceivingDiscrepancySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receivingExpectationId?: boolean
    discrepancyType?: boolean
    summary?: boolean
    status?: boolean
    resolutionCode?: boolean
    resolutionNote?: boolean
    resolvedAt?: boolean
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingDiscrepancy"]>

  export type ReceivingDiscrepancySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    receivingExpectationId?: boolean
    discrepancyType?: boolean
    summary?: boolean
    status?: boolean
    resolutionCode?: boolean
    resolutionNote?: boolean
    resolvedAt?: boolean
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["receivingDiscrepancy"]>

  export type ReceivingDiscrepancySelectScalar = {
    id?: boolean
    tenantId?: boolean
    receivingExpectationId?: boolean
    discrepancyType?: boolean
    summary?: boolean
    status?: boolean
    resolutionCode?: boolean
    resolutionNote?: boolean
    resolvedAt?: boolean
  }

  export type ReceivingDiscrepancyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "receivingExpectationId" | "discrepancyType" | "summary" | "status" | "resolutionCode" | "resolutionNote" | "resolvedAt", ExtArgs["result"]["receivingDiscrepancy"]>
  export type ReceivingDiscrepancyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }
  export type ReceivingDiscrepancyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }
  export type ReceivingDiscrepancyIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    receivingExpectation?: boolean | ReceivingExpectationDefaultArgs<ExtArgs>
  }

  export type $ReceivingDiscrepancyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReceivingDiscrepancy"
    objects: {
      receivingExpectation: Prisma.$ReceivingExpectationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      receivingExpectationId: string
      discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
      summary: string
      status: $Enums.ProcurementReceivingDiscrepancyStatus
      resolutionCode: $Enums.ProcurementReceivingResolutionCode | null
      resolutionNote: string | null
      resolvedAt: Date | null
    }, ExtArgs["result"]["receivingDiscrepancy"]>
    composites: {}
  }

  type ReceivingDiscrepancyGetPayload<S extends boolean | null | undefined | ReceivingDiscrepancyDefaultArgs> = $Result.GetResult<Prisma.$ReceivingDiscrepancyPayload, S>

  type ReceivingDiscrepancyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReceivingDiscrepancyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReceivingDiscrepancyCountAggregateInputType | true
    }

  export interface ReceivingDiscrepancyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReceivingDiscrepancy'], meta: { name: 'ReceivingDiscrepancy' } }
    /**
     * Find zero or one ReceivingDiscrepancy that matches the filter.
     * @param {ReceivingDiscrepancyFindUniqueArgs} args - Arguments to find a ReceivingDiscrepancy
     * @example
     * // Get one ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReceivingDiscrepancyFindUniqueArgs>(args: SelectSubset<T, ReceivingDiscrepancyFindUniqueArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ReceivingDiscrepancy that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReceivingDiscrepancyFindUniqueOrThrowArgs} args - Arguments to find a ReceivingDiscrepancy
     * @example
     * // Get one ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReceivingDiscrepancyFindUniqueOrThrowArgs>(args: SelectSubset<T, ReceivingDiscrepancyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ReceivingDiscrepancy that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyFindFirstArgs} args - Arguments to find a ReceivingDiscrepancy
     * @example
     * // Get one ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReceivingDiscrepancyFindFirstArgs>(args?: SelectSubset<T, ReceivingDiscrepancyFindFirstArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ReceivingDiscrepancy that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyFindFirstOrThrowArgs} args - Arguments to find a ReceivingDiscrepancy
     * @example
     * // Get one ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReceivingDiscrepancyFindFirstOrThrowArgs>(args?: SelectSubset<T, ReceivingDiscrepancyFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ReceivingDiscrepancies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReceivingDiscrepancies
     * const receivingDiscrepancies = await prisma.receivingDiscrepancy.findMany()
     * 
     * // Get first 10 ReceivingDiscrepancies
     * const receivingDiscrepancies = await prisma.receivingDiscrepancy.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const receivingDiscrepancyWithIdOnly = await prisma.receivingDiscrepancy.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReceivingDiscrepancyFindManyArgs>(args?: SelectSubset<T, ReceivingDiscrepancyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ReceivingDiscrepancy.
     * @param {ReceivingDiscrepancyCreateArgs} args - Arguments to create a ReceivingDiscrepancy.
     * @example
     * // Create one ReceivingDiscrepancy
     * const ReceivingDiscrepancy = await prisma.receivingDiscrepancy.create({
     *   data: {
     *     // ... data to create a ReceivingDiscrepancy
     *   }
     * })
     * 
     */
    create<T extends ReceivingDiscrepancyCreateArgs>(args: SelectSubset<T, ReceivingDiscrepancyCreateArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ReceivingDiscrepancies.
     * @param {ReceivingDiscrepancyCreateManyArgs} args - Arguments to create many ReceivingDiscrepancies.
     * @example
     * // Create many ReceivingDiscrepancies
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReceivingDiscrepancyCreateManyArgs>(args?: SelectSubset<T, ReceivingDiscrepancyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReceivingDiscrepancies and returns the data saved in the database.
     * @param {ReceivingDiscrepancyCreateManyAndReturnArgs} args - Arguments to create many ReceivingDiscrepancies.
     * @example
     * // Create many ReceivingDiscrepancies
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReceivingDiscrepancies and only return the `id`
     * const receivingDiscrepancyWithIdOnly = await prisma.receivingDiscrepancy.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReceivingDiscrepancyCreateManyAndReturnArgs>(args?: SelectSubset<T, ReceivingDiscrepancyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ReceivingDiscrepancy.
     * @param {ReceivingDiscrepancyDeleteArgs} args - Arguments to delete one ReceivingDiscrepancy.
     * @example
     * // Delete one ReceivingDiscrepancy
     * const ReceivingDiscrepancy = await prisma.receivingDiscrepancy.delete({
     *   where: {
     *     // ... filter to delete one ReceivingDiscrepancy
     *   }
     * })
     * 
     */
    delete<T extends ReceivingDiscrepancyDeleteArgs>(args: SelectSubset<T, ReceivingDiscrepancyDeleteArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ReceivingDiscrepancy.
     * @param {ReceivingDiscrepancyUpdateArgs} args - Arguments to update one ReceivingDiscrepancy.
     * @example
     * // Update one ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReceivingDiscrepancyUpdateArgs>(args: SelectSubset<T, ReceivingDiscrepancyUpdateArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ReceivingDiscrepancies.
     * @param {ReceivingDiscrepancyDeleteManyArgs} args - Arguments to filter ReceivingDiscrepancies to delete.
     * @example
     * // Delete a few ReceivingDiscrepancies
     * const { count } = await prisma.receivingDiscrepancy.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReceivingDiscrepancyDeleteManyArgs>(args?: SelectSubset<T, ReceivingDiscrepancyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivingDiscrepancies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReceivingDiscrepancies
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReceivingDiscrepancyUpdateManyArgs>(args: SelectSubset<T, ReceivingDiscrepancyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivingDiscrepancies and returns the data updated in the database.
     * @param {ReceivingDiscrepancyUpdateManyAndReturnArgs} args - Arguments to update many ReceivingDiscrepancies.
     * @example
     * // Update many ReceivingDiscrepancies
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ReceivingDiscrepancies and only return the `id`
     * const receivingDiscrepancyWithIdOnly = await prisma.receivingDiscrepancy.updateManyAndReturn({
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
    updateManyAndReturn<T extends ReceivingDiscrepancyUpdateManyAndReturnArgs>(args: SelectSubset<T, ReceivingDiscrepancyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ReceivingDiscrepancy.
     * @param {ReceivingDiscrepancyUpsertArgs} args - Arguments to update or create a ReceivingDiscrepancy.
     * @example
     * // Update or create a ReceivingDiscrepancy
     * const receivingDiscrepancy = await prisma.receivingDiscrepancy.upsert({
     *   create: {
     *     // ... data to create a ReceivingDiscrepancy
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReceivingDiscrepancy we want to update
     *   }
     * })
     */
    upsert<T extends ReceivingDiscrepancyUpsertArgs>(args: SelectSubset<T, ReceivingDiscrepancyUpsertArgs<ExtArgs>>): Prisma__ReceivingDiscrepancyClient<$Result.GetResult<Prisma.$ReceivingDiscrepancyPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ReceivingDiscrepancies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyCountArgs} args - Arguments to filter ReceivingDiscrepancies to count.
     * @example
     * // Count the number of ReceivingDiscrepancies
     * const count = await prisma.receivingDiscrepancy.count({
     *   where: {
     *     // ... the filter for the ReceivingDiscrepancies we want to count
     *   }
     * })
    **/
    count<T extends ReceivingDiscrepancyCountArgs>(
      args?: Subset<T, ReceivingDiscrepancyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReceivingDiscrepancyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReceivingDiscrepancy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ReceivingDiscrepancyAggregateArgs>(args: Subset<T, ReceivingDiscrepancyAggregateArgs>): Prisma.PrismaPromise<GetReceivingDiscrepancyAggregateType<T>>

    /**
     * Group by ReceivingDiscrepancy.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivingDiscrepancyGroupByArgs} args - Group by arguments.
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
      T extends ReceivingDiscrepancyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReceivingDiscrepancyGroupByArgs['orderBy'] }
        : { orderBy?: ReceivingDiscrepancyGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ReceivingDiscrepancyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReceivingDiscrepancyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReceivingDiscrepancy model
   */
  readonly fields: ReceivingDiscrepancyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReceivingDiscrepancy.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReceivingDiscrepancyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    receivingExpectation<T extends ReceivingExpectationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ReceivingExpectationDefaultArgs<ExtArgs>>): Prisma__ReceivingExpectationClient<$Result.GetResult<Prisma.$ReceivingExpectationPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the ReceivingDiscrepancy model
   */ 
  interface ReceivingDiscrepancyFieldRefs {
    readonly id: FieldRef<"ReceivingDiscrepancy", 'String'>
    readonly tenantId: FieldRef<"ReceivingDiscrepancy", 'String'>
    readonly receivingExpectationId: FieldRef<"ReceivingDiscrepancy", 'String'>
    readonly discrepancyType: FieldRef<"ReceivingDiscrepancy", 'ProcurementReceivingDiscrepancyType'>
    readonly summary: FieldRef<"ReceivingDiscrepancy", 'String'>
    readonly status: FieldRef<"ReceivingDiscrepancy", 'ProcurementReceivingDiscrepancyStatus'>
    readonly resolutionCode: FieldRef<"ReceivingDiscrepancy", 'ProcurementReceivingResolutionCode'>
    readonly resolutionNote: FieldRef<"ReceivingDiscrepancy", 'String'>
    readonly resolvedAt: FieldRef<"ReceivingDiscrepancy", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReceivingDiscrepancy findUnique
   */
  export type ReceivingDiscrepancyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingDiscrepancy to fetch.
     */
    where: ReceivingDiscrepancyWhereUniqueInput
  }

  /**
   * ReceivingDiscrepancy findUniqueOrThrow
   */
  export type ReceivingDiscrepancyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingDiscrepancy to fetch.
     */
    where: ReceivingDiscrepancyWhereUniqueInput
  }

  /**
   * ReceivingDiscrepancy findFirst
   */
  export type ReceivingDiscrepancyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingDiscrepancy to fetch.
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingDiscrepancies to fetch.
     */
    orderBy?: ReceivingDiscrepancyOrderByWithRelationInput | ReceivingDiscrepancyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivingDiscrepancies.
     */
    cursor?: ReceivingDiscrepancyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingDiscrepancies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingDiscrepancies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivingDiscrepancies.
     */
    distinct?: ReceivingDiscrepancyScalarFieldEnum | ReceivingDiscrepancyScalarFieldEnum[]
  }

  /**
   * ReceivingDiscrepancy findFirstOrThrow
   */
  export type ReceivingDiscrepancyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingDiscrepancy to fetch.
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingDiscrepancies to fetch.
     */
    orderBy?: ReceivingDiscrepancyOrderByWithRelationInput | ReceivingDiscrepancyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivingDiscrepancies.
     */
    cursor?: ReceivingDiscrepancyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingDiscrepancies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingDiscrepancies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivingDiscrepancies.
     */
    distinct?: ReceivingDiscrepancyScalarFieldEnum | ReceivingDiscrepancyScalarFieldEnum[]
  }

  /**
   * ReceivingDiscrepancy findMany
   */
  export type ReceivingDiscrepancyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter, which ReceivingDiscrepancies to fetch.
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivingDiscrepancies to fetch.
     */
    orderBy?: ReceivingDiscrepancyOrderByWithRelationInput | ReceivingDiscrepancyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReceivingDiscrepancies.
     */
    cursor?: ReceivingDiscrepancyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivingDiscrepancies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivingDiscrepancies.
     */
    skip?: number
    distinct?: ReceivingDiscrepancyScalarFieldEnum | ReceivingDiscrepancyScalarFieldEnum[]
  }

  /**
   * ReceivingDiscrepancy create
   */
  export type ReceivingDiscrepancyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * The data needed to create a ReceivingDiscrepancy.
     */
    data: XOR<ReceivingDiscrepancyCreateInput, ReceivingDiscrepancyUncheckedCreateInput>
  }

  /**
   * ReceivingDiscrepancy createMany
   */
  export type ReceivingDiscrepancyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReceivingDiscrepancies.
     */
    data: ReceivingDiscrepancyCreateManyInput | ReceivingDiscrepancyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReceivingDiscrepancy createManyAndReturn
   */
  export type ReceivingDiscrepancyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * The data used to create many ReceivingDiscrepancies.
     */
    data: ReceivingDiscrepancyCreateManyInput | ReceivingDiscrepancyCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceivingDiscrepancy update
   */
  export type ReceivingDiscrepancyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * The data needed to update a ReceivingDiscrepancy.
     */
    data: XOR<ReceivingDiscrepancyUpdateInput, ReceivingDiscrepancyUncheckedUpdateInput>
    /**
     * Choose, which ReceivingDiscrepancy to update.
     */
    where: ReceivingDiscrepancyWhereUniqueInput
  }

  /**
   * ReceivingDiscrepancy updateMany
   */
  export type ReceivingDiscrepancyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReceivingDiscrepancies.
     */
    data: XOR<ReceivingDiscrepancyUpdateManyMutationInput, ReceivingDiscrepancyUncheckedUpdateManyInput>
    /**
     * Filter which ReceivingDiscrepancies to update
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * Limit how many ReceivingDiscrepancies to update.
     */
    limit?: number
  }

  /**
   * ReceivingDiscrepancy updateManyAndReturn
   */
  export type ReceivingDiscrepancyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * The data used to update ReceivingDiscrepancies.
     */
    data: XOR<ReceivingDiscrepancyUpdateManyMutationInput, ReceivingDiscrepancyUncheckedUpdateManyInput>
    /**
     * Filter which ReceivingDiscrepancies to update
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * Limit how many ReceivingDiscrepancies to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ReceivingDiscrepancy upsert
   */
  export type ReceivingDiscrepancyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * The filter to search for the ReceivingDiscrepancy to update in case it exists.
     */
    where: ReceivingDiscrepancyWhereUniqueInput
    /**
     * In case the ReceivingDiscrepancy found by the `where` argument doesn't exist, create a new ReceivingDiscrepancy with this data.
     */
    create: XOR<ReceivingDiscrepancyCreateInput, ReceivingDiscrepancyUncheckedCreateInput>
    /**
     * In case the ReceivingDiscrepancy was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReceivingDiscrepancyUpdateInput, ReceivingDiscrepancyUncheckedUpdateInput>
  }

  /**
   * ReceivingDiscrepancy delete
   */
  export type ReceivingDiscrepancyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
    /**
     * Filter which ReceivingDiscrepancy to delete.
     */
    where: ReceivingDiscrepancyWhereUniqueInput
  }

  /**
   * ReceivingDiscrepancy deleteMany
   */
  export type ReceivingDiscrepancyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivingDiscrepancies to delete
     */
    where?: ReceivingDiscrepancyWhereInput
    /**
     * Limit how many ReceivingDiscrepancies to delete.
     */
    limit?: number
  }

  /**
   * ReceivingDiscrepancy without action
   */
  export type ReceivingDiscrepancyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivingDiscrepancy
     */
    select?: ReceivingDiscrepancySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivingDiscrepancy
     */
    omit?: ReceivingDiscrepancyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReceivingDiscrepancyInclude<ExtArgs> | null
  }


  /**
   * Model ProcurementAuditEnvelope
   */

  export type AggregateProcurementAuditEnvelope = {
    _count: ProcurementAuditEnvelopeCountAggregateOutputType | null
    _min: ProcurementAuditEnvelopeMinAggregateOutputType | null
    _max: ProcurementAuditEnvelopeMaxAggregateOutputType | null
  }

  export type ProcurementAuditEnvelopeMinAggregateOutputType = {
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

  export type ProcurementAuditEnvelopeMaxAggregateOutputType = {
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

  export type ProcurementAuditEnvelopeCountAggregateOutputType = {
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


  export type ProcurementAuditEnvelopeMinAggregateInputType = {
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

  export type ProcurementAuditEnvelopeMaxAggregateInputType = {
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

  export type ProcurementAuditEnvelopeCountAggregateInputType = {
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

  export type ProcurementAuditEnvelopeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProcurementAuditEnvelope to aggregate.
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementAuditEnvelopes to fetch.
     */
    orderBy?: ProcurementAuditEnvelopeOrderByWithRelationInput | ProcurementAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProcurementAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ProcurementAuditEnvelopes
    **/
    _count?: true | ProcurementAuditEnvelopeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProcurementAuditEnvelopeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProcurementAuditEnvelopeMaxAggregateInputType
  }

  export type GetProcurementAuditEnvelopeAggregateType<T extends ProcurementAuditEnvelopeAggregateArgs> = {
        [P in keyof T & keyof AggregateProcurementAuditEnvelope]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProcurementAuditEnvelope[P]>
      : GetScalarType<T[P], AggregateProcurementAuditEnvelope[P]>
  }




  export type ProcurementAuditEnvelopeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProcurementAuditEnvelopeWhereInput
    orderBy?: ProcurementAuditEnvelopeOrderByWithAggregationInput | ProcurementAuditEnvelopeOrderByWithAggregationInput[]
    by: ProcurementAuditEnvelopeScalarFieldEnum[] | ProcurementAuditEnvelopeScalarFieldEnum
    having?: ProcurementAuditEnvelopeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProcurementAuditEnvelopeCountAggregateInputType | true
    _min?: ProcurementAuditEnvelopeMinAggregateInputType
    _max?: ProcurementAuditEnvelopeMaxAggregateInputType
  }

  export type ProcurementAuditEnvelopeGroupByOutputType = {
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
    _count: ProcurementAuditEnvelopeCountAggregateOutputType | null
    _min: ProcurementAuditEnvelopeMinAggregateOutputType | null
    _max: ProcurementAuditEnvelopeMaxAggregateOutputType | null
  }

  type GetProcurementAuditEnvelopeGroupByPayload<T extends ProcurementAuditEnvelopeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProcurementAuditEnvelopeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProcurementAuditEnvelopeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProcurementAuditEnvelopeGroupByOutputType[P]>
            : GetScalarType<T[P], ProcurementAuditEnvelopeGroupByOutputType[P]>
        }
      >
    >


  export type ProcurementAuditEnvelopeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["procurementAuditEnvelope"]>

  export type ProcurementAuditEnvelopeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["procurementAuditEnvelope"]>

  export type ProcurementAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["procurementAuditEnvelope"]>

  export type ProcurementAuditEnvelopeSelectScalar = {
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

  export type ProcurementAuditEnvelopeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["procurementAuditEnvelope"]>

  export type $ProcurementAuditEnvelopePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ProcurementAuditEnvelope"
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
    }, ExtArgs["result"]["procurementAuditEnvelope"]>
    composites: {}
  }

  type ProcurementAuditEnvelopeGetPayload<S extends boolean | null | undefined | ProcurementAuditEnvelopeDefaultArgs> = $Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload, S>

  type ProcurementAuditEnvelopeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProcurementAuditEnvelopeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProcurementAuditEnvelopeCountAggregateInputType | true
    }

  export interface ProcurementAuditEnvelopeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ProcurementAuditEnvelope'], meta: { name: 'ProcurementAuditEnvelope' } }
    /**
     * Find zero or one ProcurementAuditEnvelope that matches the filter.
     * @param {ProcurementAuditEnvelopeFindUniqueArgs} args - Arguments to find a ProcurementAuditEnvelope
     * @example
     * // Get one ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProcurementAuditEnvelopeFindUniqueArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeFindUniqueArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ProcurementAuditEnvelope that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProcurementAuditEnvelopeFindUniqueOrThrowArgs} args - Arguments to find a ProcurementAuditEnvelope
     * @example
     * // Get one ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProcurementAuditEnvelopeFindUniqueOrThrowArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ProcurementAuditEnvelope that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeFindFirstArgs} args - Arguments to find a ProcurementAuditEnvelope
     * @example
     * // Get one ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProcurementAuditEnvelopeFindFirstArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeFindFirstArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ProcurementAuditEnvelope that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeFindFirstOrThrowArgs} args - Arguments to find a ProcurementAuditEnvelope
     * @example
     * // Get one ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProcurementAuditEnvelopeFindFirstOrThrowArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ProcurementAuditEnvelopes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ProcurementAuditEnvelopes
     * const procurementAuditEnvelopes = await prisma.procurementAuditEnvelope.findMany()
     * 
     * // Get first 10 ProcurementAuditEnvelopes
     * const procurementAuditEnvelopes = await prisma.procurementAuditEnvelope.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const procurementAuditEnvelopeWithIdOnly = await prisma.procurementAuditEnvelope.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProcurementAuditEnvelopeFindManyArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ProcurementAuditEnvelope.
     * @param {ProcurementAuditEnvelopeCreateArgs} args - Arguments to create a ProcurementAuditEnvelope.
     * @example
     * // Create one ProcurementAuditEnvelope
     * const ProcurementAuditEnvelope = await prisma.procurementAuditEnvelope.create({
     *   data: {
     *     // ... data to create a ProcurementAuditEnvelope
     *   }
     * })
     * 
     */
    create<T extends ProcurementAuditEnvelopeCreateArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeCreateArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ProcurementAuditEnvelopes.
     * @param {ProcurementAuditEnvelopeCreateManyArgs} args - Arguments to create many ProcurementAuditEnvelopes.
     * @example
     * // Create many ProcurementAuditEnvelopes
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProcurementAuditEnvelopeCreateManyArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ProcurementAuditEnvelopes and returns the data saved in the database.
     * @param {ProcurementAuditEnvelopeCreateManyAndReturnArgs} args - Arguments to create many ProcurementAuditEnvelopes.
     * @example
     * // Create many ProcurementAuditEnvelopes
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ProcurementAuditEnvelopes and only return the `id`
     * const procurementAuditEnvelopeWithIdOnly = await prisma.procurementAuditEnvelope.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProcurementAuditEnvelopeCreateManyAndReturnArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ProcurementAuditEnvelope.
     * @param {ProcurementAuditEnvelopeDeleteArgs} args - Arguments to delete one ProcurementAuditEnvelope.
     * @example
     * // Delete one ProcurementAuditEnvelope
     * const ProcurementAuditEnvelope = await prisma.procurementAuditEnvelope.delete({
     *   where: {
     *     // ... filter to delete one ProcurementAuditEnvelope
     *   }
     * })
     * 
     */
    delete<T extends ProcurementAuditEnvelopeDeleteArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeDeleteArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ProcurementAuditEnvelope.
     * @param {ProcurementAuditEnvelopeUpdateArgs} args - Arguments to update one ProcurementAuditEnvelope.
     * @example
     * // Update one ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProcurementAuditEnvelopeUpdateArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeUpdateArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ProcurementAuditEnvelopes.
     * @param {ProcurementAuditEnvelopeDeleteManyArgs} args - Arguments to filter ProcurementAuditEnvelopes to delete.
     * @example
     * // Delete a few ProcurementAuditEnvelopes
     * const { count } = await prisma.procurementAuditEnvelope.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProcurementAuditEnvelopeDeleteManyArgs>(args?: SelectSubset<T, ProcurementAuditEnvelopeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProcurementAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ProcurementAuditEnvelopes
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProcurementAuditEnvelopeUpdateManyArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ProcurementAuditEnvelopes and returns the data updated in the database.
     * @param {ProcurementAuditEnvelopeUpdateManyAndReturnArgs} args - Arguments to update many ProcurementAuditEnvelopes.
     * @example
     * // Update many ProcurementAuditEnvelopes
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ProcurementAuditEnvelopes and only return the `id`
     * const procurementAuditEnvelopeWithIdOnly = await prisma.procurementAuditEnvelope.updateManyAndReturn({
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
    updateManyAndReturn<T extends ProcurementAuditEnvelopeUpdateManyAndReturnArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ProcurementAuditEnvelope.
     * @param {ProcurementAuditEnvelopeUpsertArgs} args - Arguments to update or create a ProcurementAuditEnvelope.
     * @example
     * // Update or create a ProcurementAuditEnvelope
     * const procurementAuditEnvelope = await prisma.procurementAuditEnvelope.upsert({
     *   create: {
     *     // ... data to create a ProcurementAuditEnvelope
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ProcurementAuditEnvelope we want to update
     *   }
     * })
     */
    upsert<T extends ProcurementAuditEnvelopeUpsertArgs>(args: SelectSubset<T, ProcurementAuditEnvelopeUpsertArgs<ExtArgs>>): Prisma__ProcurementAuditEnvelopeClient<$Result.GetResult<Prisma.$ProcurementAuditEnvelopePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ProcurementAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeCountArgs} args - Arguments to filter ProcurementAuditEnvelopes to count.
     * @example
     * // Count the number of ProcurementAuditEnvelopes
     * const count = await prisma.procurementAuditEnvelope.count({
     *   where: {
     *     // ... the filter for the ProcurementAuditEnvelopes we want to count
     *   }
     * })
    **/
    count<T extends ProcurementAuditEnvelopeCountArgs>(
      args?: Subset<T, ProcurementAuditEnvelopeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProcurementAuditEnvelopeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ProcurementAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ProcurementAuditEnvelopeAggregateArgs>(args: Subset<T, ProcurementAuditEnvelopeAggregateArgs>): Prisma.PrismaPromise<GetProcurementAuditEnvelopeAggregateType<T>>

    /**
     * Group by ProcurementAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProcurementAuditEnvelopeGroupByArgs} args - Group by arguments.
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
      T extends ProcurementAuditEnvelopeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProcurementAuditEnvelopeGroupByArgs['orderBy'] }
        : { orderBy?: ProcurementAuditEnvelopeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ProcurementAuditEnvelopeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProcurementAuditEnvelopeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ProcurementAuditEnvelope model
   */
  readonly fields: ProcurementAuditEnvelopeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ProcurementAuditEnvelope.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProcurementAuditEnvelopeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ProcurementAuditEnvelope model
   */ 
  interface ProcurementAuditEnvelopeFieldRefs {
    readonly id: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly service: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly module: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly eventType: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly occurredAt: FieldRef<"ProcurementAuditEnvelope", 'DateTime'>
    readonly result: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly operatorId: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly operatorType: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly tenantId: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly orgId: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly traceId: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly resourceType: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly resourceId: FieldRef<"ProcurementAuditEnvelope", 'String'>
    readonly details: FieldRef<"ProcurementAuditEnvelope", 'Json'>
    readonly createdAt: FieldRef<"ProcurementAuditEnvelope", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ProcurementAuditEnvelope findUnique
   */
  export type ProcurementAuditEnvelopeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementAuditEnvelope to fetch.
     */
    where: ProcurementAuditEnvelopeWhereUniqueInput
  }

  /**
   * ProcurementAuditEnvelope findUniqueOrThrow
   */
  export type ProcurementAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementAuditEnvelope to fetch.
     */
    where: ProcurementAuditEnvelopeWhereUniqueInput
  }

  /**
   * ProcurementAuditEnvelope findFirst
   */
  export type ProcurementAuditEnvelopeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementAuditEnvelope to fetch.
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementAuditEnvelopes to fetch.
     */
    orderBy?: ProcurementAuditEnvelopeOrderByWithRelationInput | ProcurementAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProcurementAuditEnvelopes.
     */
    cursor?: ProcurementAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProcurementAuditEnvelopes.
     */
    distinct?: ProcurementAuditEnvelopeScalarFieldEnum | ProcurementAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * ProcurementAuditEnvelope findFirstOrThrow
   */
  export type ProcurementAuditEnvelopeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementAuditEnvelope to fetch.
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementAuditEnvelopes to fetch.
     */
    orderBy?: ProcurementAuditEnvelopeOrderByWithRelationInput | ProcurementAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ProcurementAuditEnvelopes.
     */
    cursor?: ProcurementAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ProcurementAuditEnvelopes.
     */
    distinct?: ProcurementAuditEnvelopeScalarFieldEnum | ProcurementAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * ProcurementAuditEnvelope findMany
   */
  export type ProcurementAuditEnvelopeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which ProcurementAuditEnvelopes to fetch.
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ProcurementAuditEnvelopes to fetch.
     */
    orderBy?: ProcurementAuditEnvelopeOrderByWithRelationInput | ProcurementAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ProcurementAuditEnvelopes.
     */
    cursor?: ProcurementAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ProcurementAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ProcurementAuditEnvelopes.
     */
    skip?: number
    distinct?: ProcurementAuditEnvelopeScalarFieldEnum | ProcurementAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * ProcurementAuditEnvelope create
   */
  export type ProcurementAuditEnvelopeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to create a ProcurementAuditEnvelope.
     */
    data: XOR<ProcurementAuditEnvelopeCreateInput, ProcurementAuditEnvelopeUncheckedCreateInput>
  }

  /**
   * ProcurementAuditEnvelope createMany
   */
  export type ProcurementAuditEnvelopeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ProcurementAuditEnvelopes.
     */
    data: ProcurementAuditEnvelopeCreateManyInput | ProcurementAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProcurementAuditEnvelope createManyAndReturn
   */
  export type ProcurementAuditEnvelopeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to create many ProcurementAuditEnvelopes.
     */
    data: ProcurementAuditEnvelopeCreateManyInput | ProcurementAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ProcurementAuditEnvelope update
   */
  export type ProcurementAuditEnvelopeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to update a ProcurementAuditEnvelope.
     */
    data: XOR<ProcurementAuditEnvelopeUpdateInput, ProcurementAuditEnvelopeUncheckedUpdateInput>
    /**
     * Choose, which ProcurementAuditEnvelope to update.
     */
    where: ProcurementAuditEnvelopeWhereUniqueInput
  }

  /**
   * ProcurementAuditEnvelope updateMany
   */
  export type ProcurementAuditEnvelopeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ProcurementAuditEnvelopes.
     */
    data: XOR<ProcurementAuditEnvelopeUpdateManyMutationInput, ProcurementAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which ProcurementAuditEnvelopes to update
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * Limit how many ProcurementAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * ProcurementAuditEnvelope updateManyAndReturn
   */
  export type ProcurementAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to update ProcurementAuditEnvelopes.
     */
    data: XOR<ProcurementAuditEnvelopeUpdateManyMutationInput, ProcurementAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which ProcurementAuditEnvelopes to update
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * Limit how many ProcurementAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * ProcurementAuditEnvelope upsert
   */
  export type ProcurementAuditEnvelopeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The filter to search for the ProcurementAuditEnvelope to update in case it exists.
     */
    where: ProcurementAuditEnvelopeWhereUniqueInput
    /**
     * In case the ProcurementAuditEnvelope found by the `where` argument doesn't exist, create a new ProcurementAuditEnvelope with this data.
     */
    create: XOR<ProcurementAuditEnvelopeCreateInput, ProcurementAuditEnvelopeUncheckedCreateInput>
    /**
     * In case the ProcurementAuditEnvelope was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProcurementAuditEnvelopeUpdateInput, ProcurementAuditEnvelopeUncheckedUpdateInput>
  }

  /**
   * ProcurementAuditEnvelope delete
   */
  export type ProcurementAuditEnvelopeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter which ProcurementAuditEnvelope to delete.
     */
    where: ProcurementAuditEnvelopeWhereUniqueInput
  }

  /**
   * ProcurementAuditEnvelope deleteMany
   */
  export type ProcurementAuditEnvelopeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ProcurementAuditEnvelopes to delete
     */
    where?: ProcurementAuditEnvelopeWhereInput
    /**
     * Limit how many ProcurementAuditEnvelopes to delete.
     */
    limit?: number
  }

  /**
   * ProcurementAuditEnvelope without action
   */
  export type ProcurementAuditEnvelopeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProcurementAuditEnvelope
     */
    select?: ProcurementAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ProcurementAuditEnvelope
     */
    omit?: ProcurementAuditEnvelopeOmit<ExtArgs> | null
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


  export const ProcurementSequenceCounterScalarFieldEnum: {
    tenantId: 'tenantId',
    nextPurchaseRequestNo: 'nextPurchaseRequestNo',
    nextPurchaseOrderNo: 'nextPurchaseOrderNo',
    nextReceivingExpectationNo: 'nextReceivingExpectationNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ProcurementSequenceCounterScalarFieldEnum = (typeof ProcurementSequenceCounterScalarFieldEnum)[keyof typeof ProcurementSequenceCounterScalarFieldEnum]


  export const PurchaseRequestScalarFieldEnum: {
    id: 'id',
    requestNo: 'requestNo',
    tenantId: 'tenantId',
    orgId: 'orgId',
    requestType: 'requestType',
    status: 'status',
    requesterOperatorId: 'requesterOperatorId',
    requesterDisplayName: 'requesterDisplayName',
    title: 'title',
    reason: 'reason',
    submissionComment: 'submissionComment',
    cancelReason: 'cancelReason',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    submittedAt: 'submittedAt',
    decidedAt: 'decidedAt',
    cancelledAt: 'cancelledAt'
  };

  export type PurchaseRequestScalarFieldEnum = (typeof PurchaseRequestScalarFieldEnum)[keyof typeof PurchaseRequestScalarFieldEnum]


  export const PurchaseRequestLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    purchaseRequestId: 'purchaseRequestId',
    lineNo: 'lineNo',
    lineType: 'lineType',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    description: 'description',
    requestedQuantity: 'requestedQuantity',
    uom: 'uom',
    neededByDate: 'neededByDate',
    demandReferenceType: 'demandReferenceType',
    demandReferenceId: 'demandReferenceId'
  };

  export type PurchaseRequestLineScalarFieldEnum = (typeof PurchaseRequestLineScalarFieldEnum)[keyof typeof PurchaseRequestLineScalarFieldEnum]


  export const PurchaseRequestApprovalSnapshotScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    purchaseRequestId: 'purchaseRequestId',
    decision: 'decision',
    decidedByOperatorId: 'decidedByOperatorId',
    decidedByDisplayName: 'decidedByDisplayName',
    decidedAt: 'decidedAt',
    comment: 'comment',
    approvalReference: 'approvalReference'
  };

  export type PurchaseRequestApprovalSnapshotScalarFieldEnum = (typeof PurchaseRequestApprovalSnapshotScalarFieldEnum)[keyof typeof PurchaseRequestApprovalSnapshotScalarFieldEnum]


  export const PurchaseOrderScalarFieldEnum: {
    id: 'id',
    orderNo: 'orderNo',
    tenantId: 'tenantId',
    orgId: 'orgId',
    status: 'status',
    currencyCode: 'currencyCode',
    supplierId: 'supplierId',
    supplierDisplayName: 'supplierDisplayName',
    supplierStatusAtIssue: 'supplierStatusAtIssue',
    sourcePurchaseRequestIds: 'sourcePurchaseRequestIds',
    sourcePurchaseRequestNos: 'sourcePurchaseRequestNos',
    acknowledgementStatus: 'acknowledgementStatus',
    acknowledgedAt: 'acknowledgedAt',
    acknowledgementExternalReference: 'acknowledgementExternalReference',
    acknowledgementComment: 'acknowledgementComment',
    issueComment: 'issueComment',
    cancelReason: 'cancelReason',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    issuedAt: 'issuedAt',
    cancelledAt: 'cancelledAt'
  };

  export type PurchaseOrderScalarFieldEnum = (typeof PurchaseOrderScalarFieldEnum)[keyof typeof PurchaseOrderScalarFieldEnum]


  export const PurchaseOrderLineScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    purchaseOrderId: 'purchaseOrderId',
    lineNo: 'lineNo',
    lineType: 'lineType',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    description: 'description',
    supplierOfferingId: 'supplierOfferingId',
    orderedQuantity: 'orderedQuantity',
    uom: 'uom',
    orderedUnitPrice: 'orderedUnitPrice',
    sourcePurchaseRequestLineId: 'sourcePurchaseRequestLineId',
    sourceRequestedQuantity: 'sourceRequestedQuantity',
    generalStockExcessReason: 'generalStockExcessReason'
  };

  export type PurchaseOrderLineScalarFieldEnum = (typeof PurchaseOrderLineScalarFieldEnum)[keyof typeof PurchaseOrderLineScalarFieldEnum]


  export const PurchaseOrderLineAllocationScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    purchaseOrderLineId: 'purchaseOrderLineId',
    allocationType: 'allocationType',
    referenceId: 'referenceId',
    quantity: 'quantity',
    reason: 'reason'
  };

  export type PurchaseOrderLineAllocationScalarFieldEnum = (typeof PurchaseOrderLineAllocationScalarFieldEnum)[keyof typeof PurchaseOrderLineAllocationScalarFieldEnum]


  export const PurchaseOrderChangeScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    purchaseOrderId: 'purchaseOrderId',
    changeType: 'changeType',
    changeSummary: 'changeSummary',
    changeReason: 'changeReason',
    appliedByOperatorId: 'appliedByOperatorId',
    appliedByDisplayName: 'appliedByDisplayName',
    appliedAt: 'appliedAt',
    status: 'status'
  };

  export type PurchaseOrderChangeScalarFieldEnum = (typeof PurchaseOrderChangeScalarFieldEnum)[keyof typeof PurchaseOrderChangeScalarFieldEnum]


  export const ReceivingExpectationScalarFieldEnum: {
    id: 'id',
    expectationNo: 'expectationNo',
    tenantId: 'tenantId',
    orgId: 'orgId',
    purchaseOrderId: 'purchaseOrderId',
    purchaseOrderLineId: 'purchaseOrderLineId',
    supplierId: 'supplierId',
    expectedQuantity: 'expectedQuantity',
    receivedQuantitySummary: 'receivedQuantitySummary',
    openQuantity: 'openQuantity',
    expectedReceiptDate: 'expectedReceiptDate',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReceivingExpectationScalarFieldEnum = (typeof ReceivingExpectationScalarFieldEnum)[keyof typeof ReceivingExpectationScalarFieldEnum]


  export const ReceivingDiscrepancyScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    receivingExpectationId: 'receivingExpectationId',
    discrepancyType: 'discrepancyType',
    summary: 'summary',
    status: 'status',
    resolutionCode: 'resolutionCode',
    resolutionNote: 'resolutionNote',
    resolvedAt: 'resolvedAt'
  };

  export type ReceivingDiscrepancyScalarFieldEnum = (typeof ReceivingDiscrepancyScalarFieldEnum)[keyof typeof ReceivingDiscrepancyScalarFieldEnum]


  export const ProcurementAuditEnvelopeScalarFieldEnum: {
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

  export type ProcurementAuditEnvelopeScalarFieldEnum = (typeof ProcurementAuditEnvelopeScalarFieldEnum)[keyof typeof ProcurementAuditEnvelopeScalarFieldEnum]


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
   * Reference to a field of type 'ProcurementPurchaseRequestType'
   */
  export type EnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestType'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestType[]'
   */
  export type ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestType[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestStatus'
   */
  export type EnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestStatus'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestStatus[]'
   */
  export type ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestStatus[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestLineType'
   */
  export type EnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestLineType'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestLineType[]'
   */
  export type ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestLineType[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestDecision'
   */
  export type EnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestDecision'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseRequestDecision[]'
   */
  export type ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseRequestDecision[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderStatus'
   */
  export type EnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderStatus'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderStatus[]'
   */
  export type ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'ProcurementSupplierAcknowledgementStatus'
   */
  export type EnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementSupplierAcknowledgementStatus'>
    


  /**
   * Reference to a field of type 'ProcurementSupplierAcknowledgementStatus[]'
   */
  export type ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementSupplierAcknowledgementStatus[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderLineAllocationType'
   */
  export type EnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderLineAllocationType'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderLineAllocationType[]'
   */
  export type ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderLineAllocationType[]'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderChangeStatus'
   */
  export type EnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderChangeStatus'>
    


  /**
   * Reference to a field of type 'ProcurementPurchaseOrderChangeStatus[]'
   */
  export type ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementPurchaseOrderChangeStatus[]'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingExpectationStatus'
   */
  export type EnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingExpectationStatus'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingExpectationStatus[]'
   */
  export type ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingExpectationStatus[]'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingDiscrepancyType'
   */
  export type EnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingDiscrepancyType'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingDiscrepancyType[]'
   */
  export type ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingDiscrepancyType[]'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingDiscrepancyStatus'
   */
  export type EnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingDiscrepancyStatus'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingDiscrepancyStatus[]'
   */
  export type ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingDiscrepancyStatus[]'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingResolutionCode'
   */
  export type EnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingResolutionCode'>
    


  /**
   * Reference to a field of type 'ProcurementReceivingResolutionCode[]'
   */
  export type ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ProcurementReceivingResolutionCode[]'>
    


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


  export type ProcurementSequenceCounterWhereInput = {
    AND?: ProcurementSequenceCounterWhereInput | ProcurementSequenceCounterWhereInput[]
    OR?: ProcurementSequenceCounterWhereInput[]
    NOT?: ProcurementSequenceCounterWhereInput | ProcurementSequenceCounterWhereInput[]
    tenantId?: StringFilter<"ProcurementSequenceCounter"> | string
    nextPurchaseRequestNo?: IntFilter<"ProcurementSequenceCounter"> | number
    nextPurchaseOrderNo?: IntFilter<"ProcurementSequenceCounter"> | number
    nextReceivingExpectationNo?: IntFilter<"ProcurementSequenceCounter"> | number
    createdAt?: DateTimeFilter<"ProcurementSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"ProcurementSequenceCounter"> | Date | string
  }

  export type ProcurementSequenceCounterOrderByWithRelationInput = {
    tenantId?: SortOrder
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProcurementSequenceCounterWhereUniqueInput = Prisma.AtLeast<{
    tenantId?: string
    AND?: ProcurementSequenceCounterWhereInput | ProcurementSequenceCounterWhereInput[]
    OR?: ProcurementSequenceCounterWhereInput[]
    NOT?: ProcurementSequenceCounterWhereInput | ProcurementSequenceCounterWhereInput[]
    nextPurchaseRequestNo?: IntFilter<"ProcurementSequenceCounter"> | number
    nextPurchaseOrderNo?: IntFilter<"ProcurementSequenceCounter"> | number
    nextReceivingExpectationNo?: IntFilter<"ProcurementSequenceCounter"> | number
    createdAt?: DateTimeFilter<"ProcurementSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"ProcurementSequenceCounter"> | Date | string
  }, "tenantId">

  export type ProcurementSequenceCounterOrderByWithAggregationInput = {
    tenantId?: SortOrder
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ProcurementSequenceCounterCountOrderByAggregateInput
    _avg?: ProcurementSequenceCounterAvgOrderByAggregateInput
    _max?: ProcurementSequenceCounterMaxOrderByAggregateInput
    _min?: ProcurementSequenceCounterMinOrderByAggregateInput
    _sum?: ProcurementSequenceCounterSumOrderByAggregateInput
  }

  export type ProcurementSequenceCounterScalarWhereWithAggregatesInput = {
    AND?: ProcurementSequenceCounterScalarWhereWithAggregatesInput | ProcurementSequenceCounterScalarWhereWithAggregatesInput[]
    OR?: ProcurementSequenceCounterScalarWhereWithAggregatesInput[]
    NOT?: ProcurementSequenceCounterScalarWhereWithAggregatesInput | ProcurementSequenceCounterScalarWhereWithAggregatesInput[]
    tenantId?: StringWithAggregatesFilter<"ProcurementSequenceCounter"> | string
    nextPurchaseRequestNo?: IntWithAggregatesFilter<"ProcurementSequenceCounter"> | number
    nextPurchaseOrderNo?: IntWithAggregatesFilter<"ProcurementSequenceCounter"> | number
    nextReceivingExpectationNo?: IntWithAggregatesFilter<"ProcurementSequenceCounter"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ProcurementSequenceCounter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ProcurementSequenceCounter"> | Date | string
  }

  export type PurchaseRequestWhereInput = {
    AND?: PurchaseRequestWhereInput | PurchaseRequestWhereInput[]
    OR?: PurchaseRequestWhereInput[]
    NOT?: PurchaseRequestWhereInput | PurchaseRequestWhereInput[]
    id?: UuidFilter<"PurchaseRequest"> | string
    requestNo?: StringFilter<"PurchaseRequest"> | string
    tenantId?: StringFilter<"PurchaseRequest"> | string
    orgId?: StringNullableFilter<"PurchaseRequest"> | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFilter<"PurchaseRequest"> | string
    requesterDisplayName?: StringFilter<"PurchaseRequest"> | string
    title?: StringNullableFilter<"PurchaseRequest"> | string | null
    reason?: StringNullableFilter<"PurchaseRequest"> | string | null
    submissionComment?: StringNullableFilter<"PurchaseRequest"> | string | null
    cancelReason?: StringNullableFilter<"PurchaseRequest"> | string | null
    createdAt?: DateTimeFilter<"PurchaseRequest"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseRequest"> | Date | string
    submittedAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    decidedAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    lines?: PurchaseRequestLineListRelationFilter
    approvalSnapshot?: XOR<PurchaseRequestApprovalSnapshotNullableScalarRelationFilter, PurchaseRequestApprovalSnapshotWhereInput> | null
  }

  export type PurchaseRequestOrderByWithRelationInput = {
    id?: SortOrder
    requestNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    requestType?: SortOrder
    status?: SortOrder
    requesterOperatorId?: SortOrder
    requesterDisplayName?: SortOrder
    title?: SortOrderInput | SortOrder
    reason?: SortOrderInput | SortOrder
    submissionComment?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    lines?: PurchaseRequestLineOrderByRelationAggregateInput
    approvalSnapshot?: PurchaseRequestApprovalSnapshotOrderByWithRelationInput
  }

  export type PurchaseRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    requestNo?: string
    AND?: PurchaseRequestWhereInput | PurchaseRequestWhereInput[]
    OR?: PurchaseRequestWhereInput[]
    NOT?: PurchaseRequestWhereInput | PurchaseRequestWhereInput[]
    tenantId?: StringFilter<"PurchaseRequest"> | string
    orgId?: StringNullableFilter<"PurchaseRequest"> | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFilter<"PurchaseRequest"> | string
    requesterDisplayName?: StringFilter<"PurchaseRequest"> | string
    title?: StringNullableFilter<"PurchaseRequest"> | string | null
    reason?: StringNullableFilter<"PurchaseRequest"> | string | null
    submissionComment?: StringNullableFilter<"PurchaseRequest"> | string | null
    cancelReason?: StringNullableFilter<"PurchaseRequest"> | string | null
    createdAt?: DateTimeFilter<"PurchaseRequest"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseRequest"> | Date | string
    submittedAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    decidedAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"PurchaseRequest"> | Date | string | null
    lines?: PurchaseRequestLineListRelationFilter
    approvalSnapshot?: XOR<PurchaseRequestApprovalSnapshotNullableScalarRelationFilter, PurchaseRequestApprovalSnapshotWhereInput> | null
  }, "id" | "requestNo">

  export type PurchaseRequestOrderByWithAggregationInput = {
    id?: SortOrder
    requestNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    requestType?: SortOrder
    status?: SortOrder
    requesterOperatorId?: SortOrder
    requesterDisplayName?: SortOrder
    title?: SortOrderInput | SortOrder
    reason?: SortOrderInput | SortOrder
    submissionComment?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    submittedAt?: SortOrderInput | SortOrder
    decidedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    _count?: PurchaseRequestCountOrderByAggregateInput
    _max?: PurchaseRequestMaxOrderByAggregateInput
    _min?: PurchaseRequestMinOrderByAggregateInput
  }

  export type PurchaseRequestScalarWhereWithAggregatesInput = {
    AND?: PurchaseRequestScalarWhereWithAggregatesInput | PurchaseRequestScalarWhereWithAggregatesInput[]
    OR?: PurchaseRequestScalarWhereWithAggregatesInput[]
    NOT?: PurchaseRequestScalarWhereWithAggregatesInput | PurchaseRequestScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseRequest"> | string
    requestNo?: StringWithAggregatesFilter<"PurchaseRequest"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseRequest"> | string
    orgId?: StringNullableWithAggregatesFilter<"PurchaseRequest"> | string | null
    requestType?: EnumProcurementPurchaseRequestTypeWithAggregatesFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusWithAggregatesFilter<"PurchaseRequest"> | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringWithAggregatesFilter<"PurchaseRequest"> | string
    requesterDisplayName?: StringWithAggregatesFilter<"PurchaseRequest"> | string
    title?: StringNullableWithAggregatesFilter<"PurchaseRequest"> | string | null
    reason?: StringNullableWithAggregatesFilter<"PurchaseRequest"> | string | null
    submissionComment?: StringNullableWithAggregatesFilter<"PurchaseRequest"> | string | null
    cancelReason?: StringNullableWithAggregatesFilter<"PurchaseRequest"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PurchaseRequest"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PurchaseRequest"> | Date | string
    submittedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseRequest"> | Date | string | null
    decidedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseRequest"> | Date | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"PurchaseRequest"> | Date | string | null
  }

  export type PurchaseRequestLineWhereInput = {
    AND?: PurchaseRequestLineWhereInput | PurchaseRequestLineWhereInput[]
    OR?: PurchaseRequestLineWhereInput[]
    NOT?: PurchaseRequestLineWhereInput | PurchaseRequestLineWhereInput[]
    id?: UuidFilter<"PurchaseRequestLine"> | string
    tenantId?: StringFilter<"PurchaseRequestLine"> | string
    purchaseRequestId?: UuidFilter<"PurchaseRequestLine"> | string
    lineNo?: IntFilter<"PurchaseRequestLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseRequestLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    description?: StringFilter<"PurchaseRequestLine"> | string
    requestedQuantity?: StringFilter<"PurchaseRequestLine"> | string
    uom?: StringFilter<"PurchaseRequestLine"> | string
    neededByDate?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceType?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    purchaseRequest?: XOR<PurchaseRequestScalarRelationFilter, PurchaseRequestWhereInput>
  }

  export type PurchaseRequestLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    description?: SortOrder
    requestedQuantity?: SortOrder
    uom?: SortOrder
    neededByDate?: SortOrderInput | SortOrder
    demandReferenceType?: SortOrderInput | SortOrder
    demandReferenceId?: SortOrderInput | SortOrder
    purchaseRequest?: PurchaseRequestOrderByWithRelationInput
  }

  export type PurchaseRequestLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    purchaseRequestId_lineNo?: PurchaseRequestLinePurchaseRequestIdLineNoCompoundUniqueInput
    AND?: PurchaseRequestLineWhereInput | PurchaseRequestLineWhereInput[]
    OR?: PurchaseRequestLineWhereInput[]
    NOT?: PurchaseRequestLineWhereInput | PurchaseRequestLineWhereInput[]
    tenantId?: StringFilter<"PurchaseRequestLine"> | string
    purchaseRequestId?: UuidFilter<"PurchaseRequestLine"> | string
    lineNo?: IntFilter<"PurchaseRequestLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseRequestLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    description?: StringFilter<"PurchaseRequestLine"> | string
    requestedQuantity?: StringFilter<"PurchaseRequestLine"> | string
    uom?: StringFilter<"PurchaseRequestLine"> | string
    neededByDate?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceType?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    purchaseRequest?: XOR<PurchaseRequestScalarRelationFilter, PurchaseRequestWhereInput>
  }, "id" | "purchaseRequestId_lineNo">

  export type PurchaseRequestLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    description?: SortOrder
    requestedQuantity?: SortOrder
    uom?: SortOrder
    neededByDate?: SortOrderInput | SortOrder
    demandReferenceType?: SortOrderInput | SortOrder
    demandReferenceId?: SortOrderInput | SortOrder
    _count?: PurchaseRequestLineCountOrderByAggregateInput
    _avg?: PurchaseRequestLineAvgOrderByAggregateInput
    _max?: PurchaseRequestLineMaxOrderByAggregateInput
    _min?: PurchaseRequestLineMinOrderByAggregateInput
    _sum?: PurchaseRequestLineSumOrderByAggregateInput
  }

  export type PurchaseRequestLineScalarWhereWithAggregatesInput = {
    AND?: PurchaseRequestLineScalarWhereWithAggregatesInput | PurchaseRequestLineScalarWhereWithAggregatesInput[]
    OR?: PurchaseRequestLineScalarWhereWithAggregatesInput[]
    NOT?: PurchaseRequestLineScalarWhereWithAggregatesInput | PurchaseRequestLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseRequestLine"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseRequestLine"> | string
    purchaseRequestId?: UuidWithAggregatesFilter<"PurchaseRequestLine"> | string
    lineNo?: IntWithAggregatesFilter<"PurchaseRequestLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<"PurchaseRequestLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
    itemCode?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
    description?: StringWithAggregatesFilter<"PurchaseRequestLine"> | string
    requestedQuantity?: StringWithAggregatesFilter<"PurchaseRequestLine"> | string
    uom?: StringWithAggregatesFilter<"PurchaseRequestLine"> | string
    neededByDate?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
    demandReferenceType?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
    demandReferenceId?: StringNullableWithAggregatesFilter<"PurchaseRequestLine"> | string | null
  }

  export type PurchaseRequestApprovalSnapshotWhereInput = {
    AND?: PurchaseRequestApprovalSnapshotWhereInput | PurchaseRequestApprovalSnapshotWhereInput[]
    OR?: PurchaseRequestApprovalSnapshotWhereInput[]
    NOT?: PurchaseRequestApprovalSnapshotWhereInput | PurchaseRequestApprovalSnapshotWhereInput[]
    id?: UuidFilter<"PurchaseRequestApprovalSnapshot"> | string
    tenantId?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    purchaseRequestId?: UuidFilter<"PurchaseRequestApprovalSnapshot"> | string
    decision?: EnumProcurementPurchaseRequestDecisionFilter<"PurchaseRequestApprovalSnapshot"> | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedByDisplayName?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedAt?: DateTimeFilter<"PurchaseRequestApprovalSnapshot"> | Date | string
    comment?: StringNullableFilter<"PurchaseRequestApprovalSnapshot"> | string | null
    approvalReference?: StringNullableFilter<"PurchaseRequestApprovalSnapshot"> | string | null
    purchaseRequest?: XOR<PurchaseRequestScalarRelationFilter, PurchaseRequestWhereInput>
  }

  export type PurchaseRequestApprovalSnapshotOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    decision?: SortOrder
    decidedByOperatorId?: SortOrder
    decidedByDisplayName?: SortOrder
    decidedAt?: SortOrder
    comment?: SortOrderInput | SortOrder
    approvalReference?: SortOrderInput | SortOrder
    purchaseRequest?: PurchaseRequestOrderByWithRelationInput
  }

  export type PurchaseRequestApprovalSnapshotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    purchaseRequestId?: string
    AND?: PurchaseRequestApprovalSnapshotWhereInput | PurchaseRequestApprovalSnapshotWhereInput[]
    OR?: PurchaseRequestApprovalSnapshotWhereInput[]
    NOT?: PurchaseRequestApprovalSnapshotWhereInput | PurchaseRequestApprovalSnapshotWhereInput[]
    tenantId?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    decision?: EnumProcurementPurchaseRequestDecisionFilter<"PurchaseRequestApprovalSnapshot"> | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedByDisplayName?: StringFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedAt?: DateTimeFilter<"PurchaseRequestApprovalSnapshot"> | Date | string
    comment?: StringNullableFilter<"PurchaseRequestApprovalSnapshot"> | string | null
    approvalReference?: StringNullableFilter<"PurchaseRequestApprovalSnapshot"> | string | null
    purchaseRequest?: XOR<PurchaseRequestScalarRelationFilter, PurchaseRequestWhereInput>
  }, "id" | "purchaseRequestId">

  export type PurchaseRequestApprovalSnapshotOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    decision?: SortOrder
    decidedByOperatorId?: SortOrder
    decidedByDisplayName?: SortOrder
    decidedAt?: SortOrder
    comment?: SortOrderInput | SortOrder
    approvalReference?: SortOrderInput | SortOrder
    _count?: PurchaseRequestApprovalSnapshotCountOrderByAggregateInput
    _max?: PurchaseRequestApprovalSnapshotMaxOrderByAggregateInput
    _min?: PurchaseRequestApprovalSnapshotMinOrderByAggregateInput
  }

  export type PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput = {
    AND?: PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput | PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput[]
    OR?: PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput[]
    NOT?: PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput | PurchaseRequestApprovalSnapshotScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string
    purchaseRequestId?: UuidWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string
    decision?: EnumProcurementPurchaseRequestDecisionWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedByDisplayName?: StringWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string
    decidedAt?: DateTimeWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | Date | string
    comment?: StringNullableWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string | null
    approvalReference?: StringNullableWithAggregatesFilter<"PurchaseRequestApprovalSnapshot"> | string | null
  }

  export type PurchaseOrderWhereInput = {
    AND?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    OR?: PurchaseOrderWhereInput[]
    NOT?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    id?: UuidFilter<"PurchaseOrder"> | string
    orderNo?: StringFilter<"PurchaseOrder"> | string
    tenantId?: StringFilter<"PurchaseOrder"> | string
    orgId?: StringNullableFilter<"PurchaseOrder"> | string | null
    status?: EnumProcurementPurchaseOrderStatusFilter<"PurchaseOrder"> | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFilter<"PurchaseOrder"> | string
    supplierId?: StringFilter<"PurchaseOrder"> | string
    supplierDisplayName?: StringFilter<"PurchaseOrder"> | string
    supplierStatusAtIssue?: StringNullableFilter<"PurchaseOrder"> | string | null
    sourcePurchaseRequestIds?: JsonFilter<"PurchaseOrder">
    sourcePurchaseRequestNos?: JsonFilter<"PurchaseOrder">
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFilter<"PurchaseOrder"> | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    acknowledgementExternalReference?: StringNullableFilter<"PurchaseOrder"> | string | null
    acknowledgementComment?: StringNullableFilter<"PurchaseOrder"> | string | null
    issueComment?: StringNullableFilter<"PurchaseOrder"> | string | null
    cancelReason?: StringNullableFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    issuedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    lines?: PurchaseOrderLineListRelationFilter
    changes?: PurchaseOrderChangeListRelationFilter
    receivingExpectations?: ReceivingExpectationListRelationFilter
  }

  export type PurchaseOrderOrderByWithRelationInput = {
    id?: SortOrder
    orderNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    supplierId?: SortOrder
    supplierDisplayName?: SortOrder
    supplierStatusAtIssue?: SortOrderInput | SortOrder
    sourcePurchaseRequestIds?: SortOrder
    sourcePurchaseRequestNos?: SortOrder
    acknowledgementStatus?: SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    acknowledgementExternalReference?: SortOrderInput | SortOrder
    acknowledgementComment?: SortOrderInput | SortOrder
    issueComment?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    lines?: PurchaseOrderLineOrderByRelationAggregateInput
    changes?: PurchaseOrderChangeOrderByRelationAggregateInput
    receivingExpectations?: ReceivingExpectationOrderByRelationAggregateInput
  }

  export type PurchaseOrderWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    orderNo?: string
    AND?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    OR?: PurchaseOrderWhereInput[]
    NOT?: PurchaseOrderWhereInput | PurchaseOrderWhereInput[]
    tenantId?: StringFilter<"PurchaseOrder"> | string
    orgId?: StringNullableFilter<"PurchaseOrder"> | string | null
    status?: EnumProcurementPurchaseOrderStatusFilter<"PurchaseOrder"> | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFilter<"PurchaseOrder"> | string
    supplierId?: StringFilter<"PurchaseOrder"> | string
    supplierDisplayName?: StringFilter<"PurchaseOrder"> | string
    supplierStatusAtIssue?: StringNullableFilter<"PurchaseOrder"> | string | null
    sourcePurchaseRequestIds?: JsonFilter<"PurchaseOrder">
    sourcePurchaseRequestNos?: JsonFilter<"PurchaseOrder">
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFilter<"PurchaseOrder"> | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    acknowledgementExternalReference?: StringNullableFilter<"PurchaseOrder"> | string | null
    acknowledgementComment?: StringNullableFilter<"PurchaseOrder"> | string | null
    issueComment?: StringNullableFilter<"PurchaseOrder"> | string | null
    cancelReason?: StringNullableFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeFilter<"PurchaseOrder"> | Date | string
    issuedAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"PurchaseOrder"> | Date | string | null
    lines?: PurchaseOrderLineListRelationFilter
    changes?: PurchaseOrderChangeListRelationFilter
    receivingExpectations?: ReceivingExpectationListRelationFilter
  }, "id" | "orderNo">

  export type PurchaseOrderOrderByWithAggregationInput = {
    id?: SortOrder
    orderNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    supplierId?: SortOrder
    supplierDisplayName?: SortOrder
    supplierStatusAtIssue?: SortOrderInput | SortOrder
    sourcePurchaseRequestIds?: SortOrder
    sourcePurchaseRequestNos?: SortOrder
    acknowledgementStatus?: SortOrder
    acknowledgedAt?: SortOrderInput | SortOrder
    acknowledgementExternalReference?: SortOrderInput | SortOrder
    acknowledgementComment?: SortOrderInput | SortOrder
    issueComment?: SortOrderInput | SortOrder
    cancelReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    _count?: PurchaseOrderCountOrderByAggregateInput
    _max?: PurchaseOrderMaxOrderByAggregateInput
    _min?: PurchaseOrderMinOrderByAggregateInput
  }

  export type PurchaseOrderScalarWhereWithAggregatesInput = {
    AND?: PurchaseOrderScalarWhereWithAggregatesInput | PurchaseOrderScalarWhereWithAggregatesInput[]
    OR?: PurchaseOrderScalarWhereWithAggregatesInput[]
    NOT?: PurchaseOrderScalarWhereWithAggregatesInput | PurchaseOrderScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseOrder"> | string
    orderNo?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    orgId?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    status?: EnumProcurementPurchaseOrderStatusWithAggregatesFilter<"PurchaseOrder"> | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    supplierId?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    supplierDisplayName?: StringWithAggregatesFilter<"PurchaseOrder"> | string
    supplierStatusAtIssue?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    sourcePurchaseRequestIds?: JsonWithAggregatesFilter<"PurchaseOrder">
    sourcePurchaseRequestNos?: JsonWithAggregatesFilter<"PurchaseOrder">
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusWithAggregatesFilter<"PurchaseOrder"> | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseOrder"> | Date | string | null
    acknowledgementExternalReference?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    acknowledgementComment?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    issueComment?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    cancelReason?: StringNullableWithAggregatesFilter<"PurchaseOrder"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PurchaseOrder"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PurchaseOrder"> | Date | string
    issuedAt?: DateTimeNullableWithAggregatesFilter<"PurchaseOrder"> | Date | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"PurchaseOrder"> | Date | string | null
  }

  export type PurchaseOrderLineWhereInput = {
    AND?: PurchaseOrderLineWhereInput | PurchaseOrderLineWhereInput[]
    OR?: PurchaseOrderLineWhereInput[]
    NOT?: PurchaseOrderLineWhereInput | PurchaseOrderLineWhereInput[]
    id?: UuidFilter<"PurchaseOrderLine"> | string
    tenantId?: StringFilter<"PurchaseOrderLine"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderLine"> | string
    lineNo?: IntFilter<"PurchaseOrderLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseOrderLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    description?: StringFilter<"PurchaseOrderLine"> | string
    supplierOfferingId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    orderedQuantity?: StringFilter<"PurchaseOrderLine"> | string
    uom?: StringFilter<"PurchaseOrderLine"> | string
    orderedUnitPrice?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourcePurchaseRequestLineId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourceRequestedQuantity?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    generalStockExcessReason?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    allocations?: PurchaseOrderLineAllocationListRelationFilter
    receivingExpectations?: ReceivingExpectationListRelationFilter
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
  }

  export type PurchaseOrderLineOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    description?: SortOrder
    supplierOfferingId?: SortOrderInput | SortOrder
    orderedQuantity?: SortOrder
    uom?: SortOrder
    orderedUnitPrice?: SortOrderInput | SortOrder
    sourcePurchaseRequestLineId?: SortOrderInput | SortOrder
    sourceRequestedQuantity?: SortOrderInput | SortOrder
    generalStockExcessReason?: SortOrderInput | SortOrder
    allocations?: PurchaseOrderLineAllocationOrderByRelationAggregateInput
    receivingExpectations?: ReceivingExpectationOrderByRelationAggregateInput
    purchaseOrder?: PurchaseOrderOrderByWithRelationInput
  }

  export type PurchaseOrderLineWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    purchaseOrderId_lineNo?: PurchaseOrderLinePurchaseOrderIdLineNoCompoundUniqueInput
    AND?: PurchaseOrderLineWhereInput | PurchaseOrderLineWhereInput[]
    OR?: PurchaseOrderLineWhereInput[]
    NOT?: PurchaseOrderLineWhereInput | PurchaseOrderLineWhereInput[]
    tenantId?: StringFilter<"PurchaseOrderLine"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderLine"> | string
    lineNo?: IntFilter<"PurchaseOrderLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseOrderLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    description?: StringFilter<"PurchaseOrderLine"> | string
    supplierOfferingId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    orderedQuantity?: StringFilter<"PurchaseOrderLine"> | string
    uom?: StringFilter<"PurchaseOrderLine"> | string
    orderedUnitPrice?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourcePurchaseRequestLineId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourceRequestedQuantity?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    generalStockExcessReason?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    allocations?: PurchaseOrderLineAllocationListRelationFilter
    receivingExpectations?: ReceivingExpectationListRelationFilter
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
  }, "id" | "purchaseOrderId_lineNo">

  export type PurchaseOrderLineOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrderInput | SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    description?: SortOrder
    supplierOfferingId?: SortOrderInput | SortOrder
    orderedQuantity?: SortOrder
    uom?: SortOrder
    orderedUnitPrice?: SortOrderInput | SortOrder
    sourcePurchaseRequestLineId?: SortOrderInput | SortOrder
    sourceRequestedQuantity?: SortOrderInput | SortOrder
    generalStockExcessReason?: SortOrderInput | SortOrder
    _count?: PurchaseOrderLineCountOrderByAggregateInput
    _avg?: PurchaseOrderLineAvgOrderByAggregateInput
    _max?: PurchaseOrderLineMaxOrderByAggregateInput
    _min?: PurchaseOrderLineMinOrderByAggregateInput
    _sum?: PurchaseOrderLineSumOrderByAggregateInput
  }

  export type PurchaseOrderLineScalarWhereWithAggregatesInput = {
    AND?: PurchaseOrderLineScalarWhereWithAggregatesInput | PurchaseOrderLineScalarWhereWithAggregatesInput[]
    OR?: PurchaseOrderLineScalarWhereWithAggregatesInput[]
    NOT?: PurchaseOrderLineScalarWhereWithAggregatesInput | PurchaseOrderLineScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseOrderLine"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseOrderLine"> | string
    purchaseOrderId?: UuidWithAggregatesFilter<"PurchaseOrderLine"> | string
    lineNo?: IntWithAggregatesFilter<"PurchaseOrderLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<"PurchaseOrderLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    itemCode?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    description?: StringWithAggregatesFilter<"PurchaseOrderLine"> | string
    supplierOfferingId?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    orderedQuantity?: StringWithAggregatesFilter<"PurchaseOrderLine"> | string
    uom?: StringWithAggregatesFilter<"PurchaseOrderLine"> | string
    orderedUnitPrice?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    sourcePurchaseRequestLineId?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    sourceRequestedQuantity?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
    generalStockExcessReason?: StringNullableWithAggregatesFilter<"PurchaseOrderLine"> | string | null
  }

  export type PurchaseOrderLineAllocationWhereInput = {
    AND?: PurchaseOrderLineAllocationWhereInput | PurchaseOrderLineAllocationWhereInput[]
    OR?: PurchaseOrderLineAllocationWhereInput[]
    NOT?: PurchaseOrderLineAllocationWhereInput | PurchaseOrderLineAllocationWhereInput[]
    id?: UuidFilter<"PurchaseOrderLineAllocation"> | string
    tenantId?: StringFilter<"PurchaseOrderLineAllocation"> | string
    purchaseOrderLineId?: UuidFilter<"PurchaseOrderLineAllocation"> | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFilter<"PurchaseOrderLineAllocation"> | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
    quantity?: StringFilter<"PurchaseOrderLineAllocation"> | string
    reason?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
    purchaseOrderLine?: XOR<PurchaseOrderLineScalarRelationFilter, PurchaseOrderLineWhereInput>
  }

  export type PurchaseOrderLineAllocationOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderLineId?: SortOrder
    allocationType?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    quantity?: SortOrder
    reason?: SortOrderInput | SortOrder
    purchaseOrderLine?: PurchaseOrderLineOrderByWithRelationInput
  }

  export type PurchaseOrderLineAllocationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PurchaseOrderLineAllocationWhereInput | PurchaseOrderLineAllocationWhereInput[]
    OR?: PurchaseOrderLineAllocationWhereInput[]
    NOT?: PurchaseOrderLineAllocationWhereInput | PurchaseOrderLineAllocationWhereInput[]
    tenantId?: StringFilter<"PurchaseOrderLineAllocation"> | string
    purchaseOrderLineId?: UuidFilter<"PurchaseOrderLineAllocation"> | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFilter<"PurchaseOrderLineAllocation"> | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
    quantity?: StringFilter<"PurchaseOrderLineAllocation"> | string
    reason?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
    purchaseOrderLine?: XOR<PurchaseOrderLineScalarRelationFilter, PurchaseOrderLineWhereInput>
  }, "id">

  export type PurchaseOrderLineAllocationOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderLineId?: SortOrder
    allocationType?: SortOrder
    referenceId?: SortOrderInput | SortOrder
    quantity?: SortOrder
    reason?: SortOrderInput | SortOrder
    _count?: PurchaseOrderLineAllocationCountOrderByAggregateInput
    _max?: PurchaseOrderLineAllocationMaxOrderByAggregateInput
    _min?: PurchaseOrderLineAllocationMinOrderByAggregateInput
  }

  export type PurchaseOrderLineAllocationScalarWhereWithAggregatesInput = {
    AND?: PurchaseOrderLineAllocationScalarWhereWithAggregatesInput | PurchaseOrderLineAllocationScalarWhereWithAggregatesInput[]
    OR?: PurchaseOrderLineAllocationScalarWhereWithAggregatesInput[]
    NOT?: PurchaseOrderLineAllocationScalarWhereWithAggregatesInput | PurchaseOrderLineAllocationScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string
    purchaseOrderLineId?: UuidWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeWithAggregatesFilter<"PurchaseOrderLineAllocation"> | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: StringNullableWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string | null
    quantity?: StringWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string
    reason?: StringNullableWithAggregatesFilter<"PurchaseOrderLineAllocation"> | string | null
  }

  export type PurchaseOrderChangeWhereInput = {
    AND?: PurchaseOrderChangeWhereInput | PurchaseOrderChangeWhereInput[]
    OR?: PurchaseOrderChangeWhereInput[]
    NOT?: PurchaseOrderChangeWhereInput | PurchaseOrderChangeWhereInput[]
    id?: UuidFilter<"PurchaseOrderChange"> | string
    tenantId?: StringFilter<"PurchaseOrderChange"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderChange"> | string
    changeType?: StringFilter<"PurchaseOrderChange"> | string
    changeSummary?: StringFilter<"PurchaseOrderChange"> | string
    changeReason?: StringNullableFilter<"PurchaseOrderChange"> | string | null
    appliedByOperatorId?: StringFilter<"PurchaseOrderChange"> | string
    appliedByDisplayName?: StringFilter<"PurchaseOrderChange"> | string
    appliedAt?: DateTimeFilter<"PurchaseOrderChange"> | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFilter<"PurchaseOrderChange"> | $Enums.ProcurementPurchaseOrderChangeStatus
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
  }

  export type PurchaseOrderChangeOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    changeType?: SortOrder
    changeSummary?: SortOrder
    changeReason?: SortOrderInput | SortOrder
    appliedByOperatorId?: SortOrder
    appliedByDisplayName?: SortOrder
    appliedAt?: SortOrder
    status?: SortOrder
    purchaseOrder?: PurchaseOrderOrderByWithRelationInput
  }

  export type PurchaseOrderChangeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PurchaseOrderChangeWhereInput | PurchaseOrderChangeWhereInput[]
    OR?: PurchaseOrderChangeWhereInput[]
    NOT?: PurchaseOrderChangeWhereInput | PurchaseOrderChangeWhereInput[]
    tenantId?: StringFilter<"PurchaseOrderChange"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderChange"> | string
    changeType?: StringFilter<"PurchaseOrderChange"> | string
    changeSummary?: StringFilter<"PurchaseOrderChange"> | string
    changeReason?: StringNullableFilter<"PurchaseOrderChange"> | string | null
    appliedByOperatorId?: StringFilter<"PurchaseOrderChange"> | string
    appliedByDisplayName?: StringFilter<"PurchaseOrderChange"> | string
    appliedAt?: DateTimeFilter<"PurchaseOrderChange"> | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFilter<"PurchaseOrderChange"> | $Enums.ProcurementPurchaseOrderChangeStatus
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
  }, "id">

  export type PurchaseOrderChangeOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    changeType?: SortOrder
    changeSummary?: SortOrder
    changeReason?: SortOrderInput | SortOrder
    appliedByOperatorId?: SortOrder
    appliedByDisplayName?: SortOrder
    appliedAt?: SortOrder
    status?: SortOrder
    _count?: PurchaseOrderChangeCountOrderByAggregateInput
    _max?: PurchaseOrderChangeMaxOrderByAggregateInput
    _min?: PurchaseOrderChangeMinOrderByAggregateInput
  }

  export type PurchaseOrderChangeScalarWhereWithAggregatesInput = {
    AND?: PurchaseOrderChangeScalarWhereWithAggregatesInput | PurchaseOrderChangeScalarWhereWithAggregatesInput[]
    OR?: PurchaseOrderChangeScalarWhereWithAggregatesInput[]
    NOT?: PurchaseOrderChangeScalarWhereWithAggregatesInput | PurchaseOrderChangeScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PurchaseOrderChange"> | string
    tenantId?: StringWithAggregatesFilter<"PurchaseOrderChange"> | string
    purchaseOrderId?: UuidWithAggregatesFilter<"PurchaseOrderChange"> | string
    changeType?: StringWithAggregatesFilter<"PurchaseOrderChange"> | string
    changeSummary?: StringWithAggregatesFilter<"PurchaseOrderChange"> | string
    changeReason?: StringNullableWithAggregatesFilter<"PurchaseOrderChange"> | string | null
    appliedByOperatorId?: StringWithAggregatesFilter<"PurchaseOrderChange"> | string
    appliedByDisplayName?: StringWithAggregatesFilter<"PurchaseOrderChange"> | string
    appliedAt?: DateTimeWithAggregatesFilter<"PurchaseOrderChange"> | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusWithAggregatesFilter<"PurchaseOrderChange"> | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type ReceivingExpectationWhereInput = {
    AND?: ReceivingExpectationWhereInput | ReceivingExpectationWhereInput[]
    OR?: ReceivingExpectationWhereInput[]
    NOT?: ReceivingExpectationWhereInput | ReceivingExpectationWhereInput[]
    id?: UuidFilter<"ReceivingExpectation"> | string
    expectationNo?: StringFilter<"ReceivingExpectation"> | string
    tenantId?: StringFilter<"ReceivingExpectation"> | string
    orgId?: StringNullableFilter<"ReceivingExpectation"> | string | null
    purchaseOrderId?: UuidFilter<"ReceivingExpectation"> | string
    purchaseOrderLineId?: UuidFilter<"ReceivingExpectation"> | string
    supplierId?: StringFilter<"ReceivingExpectation"> | string
    expectedQuantity?: StringFilter<"ReceivingExpectation"> | string
    receivedQuantitySummary?: StringFilter<"ReceivingExpectation"> | string
    openQuantity?: StringFilter<"ReceivingExpectation"> | string
    expectedReceiptDate?: StringNullableFilter<"ReceivingExpectation"> | string | null
    status?: EnumProcurementReceivingExpectationStatusFilter<"ReceivingExpectation"> | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
    updatedAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
    discrepancy?: XOR<ReceivingDiscrepancyNullableScalarRelationFilter, ReceivingDiscrepancyWhereInput> | null
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
    purchaseOrderLine?: XOR<PurchaseOrderLineScalarRelationFilter, PurchaseOrderLineWhereInput>
  }

  export type ReceivingExpectationOrderByWithRelationInput = {
    id?: SortOrder
    expectationNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    purchaseOrderId?: SortOrder
    purchaseOrderLineId?: SortOrder
    supplierId?: SortOrder
    expectedQuantity?: SortOrder
    receivedQuantitySummary?: SortOrder
    openQuantity?: SortOrder
    expectedReceiptDate?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    discrepancy?: ReceivingDiscrepancyOrderByWithRelationInput
    purchaseOrder?: PurchaseOrderOrderByWithRelationInput
    purchaseOrderLine?: PurchaseOrderLineOrderByWithRelationInput
  }

  export type ReceivingExpectationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    expectationNo?: string
    tenantId_purchaseOrderLineId?: ReceivingExpectationTenantIdPurchaseOrderLineIdCompoundUniqueInput
    AND?: ReceivingExpectationWhereInput | ReceivingExpectationWhereInput[]
    OR?: ReceivingExpectationWhereInput[]
    NOT?: ReceivingExpectationWhereInput | ReceivingExpectationWhereInput[]
    tenantId?: StringFilter<"ReceivingExpectation"> | string
    orgId?: StringNullableFilter<"ReceivingExpectation"> | string | null
    purchaseOrderId?: UuidFilter<"ReceivingExpectation"> | string
    purchaseOrderLineId?: UuidFilter<"ReceivingExpectation"> | string
    supplierId?: StringFilter<"ReceivingExpectation"> | string
    expectedQuantity?: StringFilter<"ReceivingExpectation"> | string
    receivedQuantitySummary?: StringFilter<"ReceivingExpectation"> | string
    openQuantity?: StringFilter<"ReceivingExpectation"> | string
    expectedReceiptDate?: StringNullableFilter<"ReceivingExpectation"> | string | null
    status?: EnumProcurementReceivingExpectationStatusFilter<"ReceivingExpectation"> | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
    updatedAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
    discrepancy?: XOR<ReceivingDiscrepancyNullableScalarRelationFilter, ReceivingDiscrepancyWhereInput> | null
    purchaseOrder?: XOR<PurchaseOrderScalarRelationFilter, PurchaseOrderWhereInput>
    purchaseOrderLine?: XOR<PurchaseOrderLineScalarRelationFilter, PurchaseOrderLineWhereInput>
  }, "id" | "expectationNo" | "tenantId_purchaseOrderLineId">

  export type ReceivingExpectationOrderByWithAggregationInput = {
    id?: SortOrder
    expectationNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrderInput | SortOrder
    purchaseOrderId?: SortOrder
    purchaseOrderLineId?: SortOrder
    supplierId?: SortOrder
    expectedQuantity?: SortOrder
    receivedQuantitySummary?: SortOrder
    openQuantity?: SortOrder
    expectedReceiptDate?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReceivingExpectationCountOrderByAggregateInput
    _max?: ReceivingExpectationMaxOrderByAggregateInput
    _min?: ReceivingExpectationMinOrderByAggregateInput
  }

  export type ReceivingExpectationScalarWhereWithAggregatesInput = {
    AND?: ReceivingExpectationScalarWhereWithAggregatesInput | ReceivingExpectationScalarWhereWithAggregatesInput[]
    OR?: ReceivingExpectationScalarWhereWithAggregatesInput[]
    NOT?: ReceivingExpectationScalarWhereWithAggregatesInput | ReceivingExpectationScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"ReceivingExpectation"> | string
    expectationNo?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    tenantId?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    orgId?: StringNullableWithAggregatesFilter<"ReceivingExpectation"> | string | null
    purchaseOrderId?: UuidWithAggregatesFilter<"ReceivingExpectation"> | string
    purchaseOrderLineId?: UuidWithAggregatesFilter<"ReceivingExpectation"> | string
    supplierId?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    expectedQuantity?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    receivedQuantitySummary?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    openQuantity?: StringWithAggregatesFilter<"ReceivingExpectation"> | string
    expectedReceiptDate?: StringNullableWithAggregatesFilter<"ReceivingExpectation"> | string | null
    status?: EnumProcurementReceivingExpectationStatusWithAggregatesFilter<"ReceivingExpectation"> | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeWithAggregatesFilter<"ReceivingExpectation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReceivingExpectation"> | Date | string
  }

  export type ReceivingDiscrepancyWhereInput = {
    AND?: ReceivingDiscrepancyWhereInput | ReceivingDiscrepancyWhereInput[]
    OR?: ReceivingDiscrepancyWhereInput[]
    NOT?: ReceivingDiscrepancyWhereInput | ReceivingDiscrepancyWhereInput[]
    id?: UuidFilter<"ReceivingDiscrepancy"> | string
    tenantId?: StringFilter<"ReceivingDiscrepancy"> | string
    receivingExpectationId?: UuidFilter<"ReceivingDiscrepancy"> | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFilter<"ReceivingDiscrepancy"> | string
    status?: EnumProcurementReceivingDiscrepancyStatusFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: EnumProcurementReceivingResolutionCodeNullableFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: StringNullableFilter<"ReceivingDiscrepancy"> | string | null
    resolvedAt?: DateTimeNullableFilter<"ReceivingDiscrepancy"> | Date | string | null
    receivingExpectation?: XOR<ReceivingExpectationScalarRelationFilter, ReceivingExpectationWhereInput>
  }

  export type ReceivingDiscrepancyOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receivingExpectationId?: SortOrder
    discrepancyType?: SortOrder
    summary?: SortOrder
    status?: SortOrder
    resolutionCode?: SortOrderInput | SortOrder
    resolutionNote?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    receivingExpectation?: ReceivingExpectationOrderByWithRelationInput
  }

  export type ReceivingDiscrepancyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    receivingExpectationId?: string
    AND?: ReceivingDiscrepancyWhereInput | ReceivingDiscrepancyWhereInput[]
    OR?: ReceivingDiscrepancyWhereInput[]
    NOT?: ReceivingDiscrepancyWhereInput | ReceivingDiscrepancyWhereInput[]
    tenantId?: StringFilter<"ReceivingDiscrepancy"> | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFilter<"ReceivingDiscrepancy"> | string
    status?: EnumProcurementReceivingDiscrepancyStatusFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: EnumProcurementReceivingResolutionCodeNullableFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: StringNullableFilter<"ReceivingDiscrepancy"> | string | null
    resolvedAt?: DateTimeNullableFilter<"ReceivingDiscrepancy"> | Date | string | null
    receivingExpectation?: XOR<ReceivingExpectationScalarRelationFilter, ReceivingExpectationWhereInput>
  }, "id" | "receivingExpectationId">

  export type ReceivingDiscrepancyOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receivingExpectationId?: SortOrder
    discrepancyType?: SortOrder
    summary?: SortOrder
    status?: SortOrder
    resolutionCode?: SortOrderInput | SortOrder
    resolutionNote?: SortOrderInput | SortOrder
    resolvedAt?: SortOrderInput | SortOrder
    _count?: ReceivingDiscrepancyCountOrderByAggregateInput
    _max?: ReceivingDiscrepancyMaxOrderByAggregateInput
    _min?: ReceivingDiscrepancyMinOrderByAggregateInput
  }

  export type ReceivingDiscrepancyScalarWhereWithAggregatesInput = {
    AND?: ReceivingDiscrepancyScalarWhereWithAggregatesInput | ReceivingDiscrepancyScalarWhereWithAggregatesInput[]
    OR?: ReceivingDiscrepancyScalarWhereWithAggregatesInput[]
    NOT?: ReceivingDiscrepancyScalarWhereWithAggregatesInput | ReceivingDiscrepancyScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"ReceivingDiscrepancy"> | string
    tenantId?: StringWithAggregatesFilter<"ReceivingDiscrepancy"> | string
    receivingExpectationId?: UuidWithAggregatesFilter<"ReceivingDiscrepancy"> | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeWithAggregatesFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringWithAggregatesFilter<"ReceivingDiscrepancy"> | string
    status?: EnumProcurementReceivingDiscrepancyStatusWithAggregatesFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: EnumProcurementReceivingResolutionCodeNullableWithAggregatesFilter<"ReceivingDiscrepancy"> | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: StringNullableWithAggregatesFilter<"ReceivingDiscrepancy"> | string | null
    resolvedAt?: DateTimeNullableWithAggregatesFilter<"ReceivingDiscrepancy"> | Date | string | null
  }

  export type ProcurementAuditEnvelopeWhereInput = {
    AND?: ProcurementAuditEnvelopeWhereInput | ProcurementAuditEnvelopeWhereInput[]
    OR?: ProcurementAuditEnvelopeWhereInput[]
    NOT?: ProcurementAuditEnvelopeWhereInput | ProcurementAuditEnvelopeWhereInput[]
    id?: StringFilter<"ProcurementAuditEnvelope"> | string
    service?: StringFilter<"ProcurementAuditEnvelope"> | string
    module?: StringFilter<"ProcurementAuditEnvelope"> | string
    eventType?: StringFilter<"ProcurementAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"ProcurementAuditEnvelope"> | Date | string
    result?: StringFilter<"ProcurementAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    operatorType?: StringFilter<"ProcurementAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    resourceType?: StringFilter<"ProcurementAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    details?: JsonFilter<"ProcurementAuditEnvelope">
    createdAt?: DateTimeFilter<"ProcurementAuditEnvelope"> | Date | string
  }

  export type ProcurementAuditEnvelopeOrderByWithRelationInput = {
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

  export type ProcurementAuditEnvelopeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ProcurementAuditEnvelopeWhereInput | ProcurementAuditEnvelopeWhereInput[]
    OR?: ProcurementAuditEnvelopeWhereInput[]
    NOT?: ProcurementAuditEnvelopeWhereInput | ProcurementAuditEnvelopeWhereInput[]
    service?: StringFilter<"ProcurementAuditEnvelope"> | string
    module?: StringFilter<"ProcurementAuditEnvelope"> | string
    eventType?: StringFilter<"ProcurementAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"ProcurementAuditEnvelope"> | Date | string
    result?: StringFilter<"ProcurementAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    operatorType?: StringFilter<"ProcurementAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    resourceType?: StringFilter<"ProcurementAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"ProcurementAuditEnvelope"> | string | null
    details?: JsonFilter<"ProcurementAuditEnvelope">
    createdAt?: DateTimeFilter<"ProcurementAuditEnvelope"> | Date | string
  }, "id">

  export type ProcurementAuditEnvelopeOrderByWithAggregationInput = {
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
    _count?: ProcurementAuditEnvelopeCountOrderByAggregateInput
    _max?: ProcurementAuditEnvelopeMaxOrderByAggregateInput
    _min?: ProcurementAuditEnvelopeMinOrderByAggregateInput
  }

  export type ProcurementAuditEnvelopeScalarWhereWithAggregatesInput = {
    AND?: ProcurementAuditEnvelopeScalarWhereWithAggregatesInput | ProcurementAuditEnvelopeScalarWhereWithAggregatesInput[]
    OR?: ProcurementAuditEnvelopeScalarWhereWithAggregatesInput[]
    NOT?: ProcurementAuditEnvelopeScalarWhereWithAggregatesInput | ProcurementAuditEnvelopeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    service?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    module?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    eventType?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"ProcurementAuditEnvelope"> | Date | string
    result?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    operatorId?: StringNullableWithAggregatesFilter<"ProcurementAuditEnvelope"> | string | null
    operatorType?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    tenantId?: StringNullableWithAggregatesFilter<"ProcurementAuditEnvelope"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"ProcurementAuditEnvelope"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"ProcurementAuditEnvelope"> | string | null
    resourceType?: StringWithAggregatesFilter<"ProcurementAuditEnvelope"> | string
    resourceId?: StringNullableWithAggregatesFilter<"ProcurementAuditEnvelope"> | string | null
    details?: JsonWithAggregatesFilter<"ProcurementAuditEnvelope">
    createdAt?: DateTimeWithAggregatesFilter<"ProcurementAuditEnvelope"> | Date | string
  }

  export type ProcurementSequenceCounterCreateInput = {
    tenantId: string
    nextPurchaseRequestNo?: number
    nextPurchaseOrderNo?: number
    nextReceivingExpectationNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProcurementSequenceCounterUncheckedCreateInput = {
    tenantId: string
    nextPurchaseRequestNo?: number
    nextPurchaseOrderNo?: number
    nextReceivingExpectationNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProcurementSequenceCounterUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextPurchaseRequestNo?: IntFieldUpdateOperationsInput | number
    nextPurchaseOrderNo?: IntFieldUpdateOperationsInput | number
    nextReceivingExpectationNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProcurementSequenceCounterUncheckedUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextPurchaseRequestNo?: IntFieldUpdateOperationsInput | number
    nextPurchaseOrderNo?: IntFieldUpdateOperationsInput | number
    nextReceivingExpectationNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProcurementSequenceCounterCreateManyInput = {
    tenantId: string
    nextPurchaseRequestNo?: number
    nextPurchaseOrderNo?: number
    nextReceivingExpectationNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ProcurementSequenceCounterUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextPurchaseRequestNo?: IntFieldUpdateOperationsInput | number
    nextPurchaseOrderNo?: IntFieldUpdateOperationsInput | number
    nextReceivingExpectationNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProcurementSequenceCounterUncheckedUpdateManyInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextPurchaseRequestNo?: IntFieldUpdateOperationsInput | number
    nextPurchaseOrderNo?: IntFieldUpdateOperationsInput | number
    nextReceivingExpectationNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseRequestCreateInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseRequestLineCreateNestedManyWithoutPurchaseRequestInput
    approvalSnapshot?: PurchaseRequestApprovalSnapshotCreateNestedOneWithoutPurchaseRequestInput
  }

  export type PurchaseRequestUncheckedCreateInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseRequestLineUncheckedCreateNestedManyWithoutPurchaseRequestInput
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUncheckedCreateNestedOneWithoutPurchaseRequestInput
  }

  export type PurchaseRequestUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseRequestLineUpdateManyWithoutPurchaseRequestNestedInput
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUpdateOneWithoutPurchaseRequestNestedInput
  }

  export type PurchaseRequestUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseRequestLineUncheckedUpdateManyWithoutPurchaseRequestNestedInput
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUncheckedUpdateOneWithoutPurchaseRequestNestedInput
  }

  export type PurchaseRequestCreateManyInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
  }

  export type PurchaseRequestUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PurchaseRequestUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PurchaseRequestLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
    purchaseRequest: PurchaseRequestCreateNestedOneWithoutLinesInput
  }

  export type PurchaseRequestLineUncheckedCreateInput = {
    id: string
    tenantId: string
    purchaseRequestId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
  }

  export type PurchaseRequestLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseRequest?: PurchaseRequestUpdateOneRequiredWithoutLinesNestedInput
  }

  export type PurchaseRequestLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseRequestId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestLineCreateManyInput = {
    id: string
    tenantId: string
    purchaseRequestId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
  }

  export type PurchaseRequestLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseRequestId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestApprovalSnapshotCreateInput = {
    id: string
    tenantId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date | string
    comment?: string | null
    approvalReference?: string | null
    purchaseRequest: PurchaseRequestCreateNestedOneWithoutApprovalSnapshotInput
  }

  export type PurchaseRequestApprovalSnapshotUncheckedCreateInput = {
    id: string
    tenantId: string
    purchaseRequestId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date | string
    comment?: string | null
    approvalReference?: string | null
  }

  export type PurchaseRequestApprovalSnapshotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseRequest?: PurchaseRequestUpdateOneRequiredWithoutApprovalSnapshotNestedInput
  }

  export type PurchaseRequestApprovalSnapshotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseRequestId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestApprovalSnapshotCreateManyInput = {
    id: string
    tenantId: string
    purchaseRequestId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date | string
    comment?: string | null
    approvalReference?: string | null
  }

  export type PurchaseRequestApprovalSnapshotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestApprovalSnapshotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseRequestId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderCreateInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineCreateNestedManyWithoutPurchaseOrderInput
    changes?: PurchaseOrderChangeCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderUncheckedCreateInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineUncheckedCreateNestedManyWithoutPurchaseOrderInput
    changes?: PurchaseOrderChangeUncheckedCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUpdateManyWithoutPurchaseOrderNestedInput
    changes?: PurchaseOrderChangeUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderNestedInput
    changes?: PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderCreateManyInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
  }

  export type PurchaseOrderUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PurchaseOrderUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PurchaseOrderLineCreateInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationCreateNestedManyWithoutPurchaseOrderLineInput
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderLineInput
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutLinesInput
  }

  export type PurchaseOrderLineUncheckedCreateInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
  }

  export type PurchaseOrderLineUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUpdateManyWithoutPurchaseOrderLineNestedInput
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderLineNestedInput
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutLinesNestedInput
  }

  export type PurchaseOrderLineUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
  }

  export type PurchaseOrderLineCreateManyInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
  }

  export type PurchaseOrderLineUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineAllocationCreateInput = {
    id: string
    tenantId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
    purchaseOrderLine: PurchaseOrderLineCreateNestedOneWithoutAllocationsInput
  }

  export type PurchaseOrderLineAllocationUncheckedCreateInput = {
    id: string
    tenantId: string
    purchaseOrderLineId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
  }

  export type PurchaseOrderLineAllocationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderLine?: PurchaseOrderLineUpdateOneRequiredWithoutAllocationsNestedInput
  }

  export type PurchaseOrderLineAllocationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineAllocationCreateManyInput = {
    id: string
    tenantId: string
    purchaseOrderLineId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
  }

  export type PurchaseOrderLineAllocationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineAllocationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderChangeCreateInput = {
    id: string
    tenantId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutChangesInput
  }

  export type PurchaseOrderChangeUncheckedCreateInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutChangesNestedInput
  }

  export type PurchaseOrderChangeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeCreateManyInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type ReceivingExpectationCreateInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyCreateNestedOneWithoutReceivingExpectationInput
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutReceivingExpectationsInput
    purchaseOrderLine: PurchaseOrderLineCreateNestedOneWithoutReceivingExpectationsInput
  }

  export type ReceivingExpectationUncheckedCreateInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderId: string
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedCreateNestedOneWithoutReceivingExpectationInput
  }

  export type ReceivingExpectationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUpdateOneWithoutReceivingExpectationNestedInput
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutReceivingExpectationsNestedInput
    purchaseOrderLine?: PurchaseOrderLineUpdateOneRequiredWithoutReceivingExpectationsNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedUpdateOneWithoutReceivingExpectationNestedInput
  }

  export type ReceivingExpectationCreateManyInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderId: string
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceivingExpectationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivingExpectationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivingDiscrepancyCreateInput = {
    id: string
    tenantId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: string | null
    resolvedAt?: Date | string | null
    receivingExpectation: ReceivingExpectationCreateNestedOneWithoutDiscrepancyInput
  }

  export type ReceivingDiscrepancyUncheckedCreateInput = {
    id: string
    tenantId: string
    receivingExpectationId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: string | null
    resolvedAt?: Date | string | null
  }

  export type ReceivingDiscrepancyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    receivingExpectation?: ReceivingExpectationUpdateOneRequiredWithoutDiscrepancyNestedInput
  }

  export type ReceivingDiscrepancyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReceivingDiscrepancyCreateManyInput = {
    id: string
    tenantId: string
    receivingExpectationId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: string | null
    resolvedAt?: Date | string | null
  }

  export type ReceivingDiscrepancyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReceivingDiscrepancyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    receivingExpectationId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ProcurementAuditEnvelopeCreateInput = {
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

  export type ProcurementAuditEnvelopeUncheckedCreateInput = {
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

  export type ProcurementAuditEnvelopeUpdateInput = {
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

  export type ProcurementAuditEnvelopeUncheckedUpdateInput = {
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

  export type ProcurementAuditEnvelopeCreateManyInput = {
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

  export type ProcurementAuditEnvelopeUpdateManyMutationInput = {
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

  export type ProcurementAuditEnvelopeUncheckedUpdateManyInput = {
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

  export type ProcurementSequenceCounterCountOrderByAggregateInput = {
    tenantId?: SortOrder
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProcurementSequenceCounterAvgOrderByAggregateInput = {
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
  }

  export type ProcurementSequenceCounterMaxOrderByAggregateInput = {
    tenantId?: SortOrder
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProcurementSequenceCounterMinOrderByAggregateInput = {
    tenantId?: SortOrder
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ProcurementSequenceCounterSumOrderByAggregateInput = {
    nextPurchaseRequestNo?: SortOrder
    nextPurchaseOrderNo?: SortOrder
    nextReceivingExpectationNo?: SortOrder
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

  export type EnumProcurementPurchaseRequestTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestType | EnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestType
  }

  export type EnumProcurementPurchaseRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestStatus | EnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestStatus
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

  export type PurchaseRequestLineListRelationFilter = {
    every?: PurchaseRequestLineWhereInput
    some?: PurchaseRequestLineWhereInput
    none?: PurchaseRequestLineWhereInput
  }

  export type PurchaseRequestApprovalSnapshotNullableScalarRelationFilter = {
    is?: PurchaseRequestApprovalSnapshotWhereInput | null
    isNot?: PurchaseRequestApprovalSnapshotWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PurchaseRequestLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PurchaseRequestCountOrderByAggregateInput = {
    id?: SortOrder
    requestNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    requestType?: SortOrder
    status?: SortOrder
    requesterOperatorId?: SortOrder
    requesterDisplayName?: SortOrder
    title?: SortOrder
    reason?: SortOrder
    submissionComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    submittedAt?: SortOrder
    decidedAt?: SortOrder
    cancelledAt?: SortOrder
  }

  export type PurchaseRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    requestNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    requestType?: SortOrder
    status?: SortOrder
    requesterOperatorId?: SortOrder
    requesterDisplayName?: SortOrder
    title?: SortOrder
    reason?: SortOrder
    submissionComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    submittedAt?: SortOrder
    decidedAt?: SortOrder
    cancelledAt?: SortOrder
  }

  export type PurchaseRequestMinOrderByAggregateInput = {
    id?: SortOrder
    requestNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    requestType?: SortOrder
    status?: SortOrder
    requesterOperatorId?: SortOrder
    requesterDisplayName?: SortOrder
    title?: SortOrder
    reason?: SortOrder
    submissionComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    submittedAt?: SortOrder
    decidedAt?: SortOrder
    cancelledAt?: SortOrder
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

  export type EnumProcurementPurchaseRequestTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestType | EnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel>
  }

  export type EnumProcurementPurchaseRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestStatus | EnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel>
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

  export type EnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestLineType | EnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestLineType
  }

  export type PurchaseRequestScalarRelationFilter = {
    is?: PurchaseRequestWhereInput
    isNot?: PurchaseRequestWhereInput
  }

  export type PurchaseRequestLinePurchaseRequestIdLineNoCompoundUniqueInput = {
    purchaseRequestId: string
    lineNo: number
  }

  export type PurchaseRequestLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    requestedQuantity?: SortOrder
    uom?: SortOrder
    neededByDate?: SortOrder
    demandReferenceType?: SortOrder
    demandReferenceId?: SortOrder
  }

  export type PurchaseRequestLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type PurchaseRequestLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    requestedQuantity?: SortOrder
    uom?: SortOrder
    neededByDate?: SortOrder
    demandReferenceType?: SortOrder
    demandReferenceId?: SortOrder
  }

  export type PurchaseRequestLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    requestedQuantity?: SortOrder
    uom?: SortOrder
    neededByDate?: SortOrder
    demandReferenceType?: SortOrder
    demandReferenceId?: SortOrder
  }

  export type PurchaseRequestLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type EnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestLineType | EnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestLineType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel>
  }

  export type EnumProcurementPurchaseRequestDecisionFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestDecision | EnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestDecision
  }

  export type PurchaseRequestApprovalSnapshotCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    decision?: SortOrder
    decidedByOperatorId?: SortOrder
    decidedByDisplayName?: SortOrder
    decidedAt?: SortOrder
    comment?: SortOrder
    approvalReference?: SortOrder
  }

  export type PurchaseRequestApprovalSnapshotMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    decision?: SortOrder
    decidedByOperatorId?: SortOrder
    decidedByDisplayName?: SortOrder
    decidedAt?: SortOrder
    comment?: SortOrder
    approvalReference?: SortOrder
  }

  export type PurchaseRequestApprovalSnapshotMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseRequestId?: SortOrder
    decision?: SortOrder
    decidedByOperatorId?: SortOrder
    decidedByDisplayName?: SortOrder
    decidedAt?: SortOrder
    comment?: SortOrder
    approvalReference?: SortOrder
  }

  export type EnumProcurementPurchaseRequestDecisionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestDecision | EnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestDecisionWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestDecision
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel>
  }

  export type EnumProcurementPurchaseOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderStatus | EnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderStatus
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

  export type EnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementSupplierAcknowledgementStatus | EnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel> | $Enums.ProcurementSupplierAcknowledgementStatus
  }

  export type PurchaseOrderLineListRelationFilter = {
    every?: PurchaseOrderLineWhereInput
    some?: PurchaseOrderLineWhereInput
    none?: PurchaseOrderLineWhereInput
  }

  export type PurchaseOrderChangeListRelationFilter = {
    every?: PurchaseOrderChangeWhereInput
    some?: PurchaseOrderChangeWhereInput
    none?: PurchaseOrderChangeWhereInput
  }

  export type ReceivingExpectationListRelationFilter = {
    every?: ReceivingExpectationWhereInput
    some?: ReceivingExpectationWhereInput
    none?: ReceivingExpectationWhereInput
  }

  export type PurchaseOrderLineOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PurchaseOrderChangeOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ReceivingExpectationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PurchaseOrderCountOrderByAggregateInput = {
    id?: SortOrder
    orderNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    supplierId?: SortOrder
    supplierDisplayName?: SortOrder
    supplierStatusAtIssue?: SortOrder
    sourcePurchaseRequestIds?: SortOrder
    sourcePurchaseRequestNos?: SortOrder
    acknowledgementStatus?: SortOrder
    acknowledgedAt?: SortOrder
    acknowledgementExternalReference?: SortOrder
    acknowledgementComment?: SortOrder
    issueComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuedAt?: SortOrder
    cancelledAt?: SortOrder
  }

  export type PurchaseOrderMaxOrderByAggregateInput = {
    id?: SortOrder
    orderNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    supplierId?: SortOrder
    supplierDisplayName?: SortOrder
    supplierStatusAtIssue?: SortOrder
    acknowledgementStatus?: SortOrder
    acknowledgedAt?: SortOrder
    acknowledgementExternalReference?: SortOrder
    acknowledgementComment?: SortOrder
    issueComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuedAt?: SortOrder
    cancelledAt?: SortOrder
  }

  export type PurchaseOrderMinOrderByAggregateInput = {
    id?: SortOrder
    orderNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    status?: SortOrder
    currencyCode?: SortOrder
    supplierId?: SortOrder
    supplierDisplayName?: SortOrder
    supplierStatusAtIssue?: SortOrder
    acknowledgementStatus?: SortOrder
    acknowledgedAt?: SortOrder
    acknowledgementExternalReference?: SortOrder
    acknowledgementComment?: SortOrder
    issueComment?: SortOrder
    cancelReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    issuedAt?: SortOrder
    cancelledAt?: SortOrder
  }

  export type EnumProcurementPurchaseOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderStatus | EnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel>
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

  export type EnumProcurementSupplierAcknowledgementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementSupplierAcknowledgementStatus | EnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementSupplierAcknowledgementStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementSupplierAcknowledgementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel>
  }

  export type PurchaseOrderLineAllocationListRelationFilter = {
    every?: PurchaseOrderLineAllocationWhereInput
    some?: PurchaseOrderLineAllocationWhereInput
    none?: PurchaseOrderLineAllocationWhereInput
  }

  export type PurchaseOrderScalarRelationFilter = {
    is?: PurchaseOrderWhereInput
    isNot?: PurchaseOrderWhereInput
  }

  export type PurchaseOrderLineAllocationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PurchaseOrderLinePurchaseOrderIdLineNoCompoundUniqueInput = {
    purchaseOrderId: string
    lineNo: number
  }

  export type PurchaseOrderLineCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    supplierOfferingId?: SortOrder
    orderedQuantity?: SortOrder
    uom?: SortOrder
    orderedUnitPrice?: SortOrder
    sourcePurchaseRequestLineId?: SortOrder
    sourceRequestedQuantity?: SortOrder
    generalStockExcessReason?: SortOrder
  }

  export type PurchaseOrderLineAvgOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type PurchaseOrderLineMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    supplierOfferingId?: SortOrder
    orderedQuantity?: SortOrder
    uom?: SortOrder
    orderedUnitPrice?: SortOrder
    sourcePurchaseRequestLineId?: SortOrder
    sourceRequestedQuantity?: SortOrder
    generalStockExcessReason?: SortOrder
  }

  export type PurchaseOrderLineMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    lineNo?: SortOrder
    lineType?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    description?: SortOrder
    supplierOfferingId?: SortOrder
    orderedQuantity?: SortOrder
    uom?: SortOrder
    orderedUnitPrice?: SortOrder
    sourcePurchaseRequestLineId?: SortOrder
    sourceRequestedQuantity?: SortOrder
    generalStockExcessReason?: SortOrder
  }

  export type PurchaseOrderLineSumOrderByAggregateInput = {
    lineNo?: SortOrder
  }

  export type EnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderLineAllocationType | EnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderLineAllocationType
  }

  export type PurchaseOrderLineScalarRelationFilter = {
    is?: PurchaseOrderLineWhereInput
    isNot?: PurchaseOrderLineWhereInput
  }

  export type PurchaseOrderLineAllocationCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderLineId?: SortOrder
    allocationType?: SortOrder
    referenceId?: SortOrder
    quantity?: SortOrder
    reason?: SortOrder
  }

  export type PurchaseOrderLineAllocationMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderLineId?: SortOrder
    allocationType?: SortOrder
    referenceId?: SortOrder
    quantity?: SortOrder
    reason?: SortOrder
  }

  export type PurchaseOrderLineAllocationMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderLineId?: SortOrder
    allocationType?: SortOrder
    referenceId?: SortOrder
    quantity?: SortOrder
    reason?: SortOrder
  }

  export type EnumProcurementPurchaseOrderLineAllocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderLineAllocationType | EnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderLineAllocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderLineAllocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel>
  }

  export type EnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderChangeStatus | EnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    changeType?: SortOrder
    changeSummary?: SortOrder
    changeReason?: SortOrder
    appliedByOperatorId?: SortOrder
    appliedByDisplayName?: SortOrder
    appliedAt?: SortOrder
    status?: SortOrder
  }

  export type PurchaseOrderChangeMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    changeType?: SortOrder
    changeSummary?: SortOrder
    changeReason?: SortOrder
    appliedByOperatorId?: SortOrder
    appliedByDisplayName?: SortOrder
    appliedAt?: SortOrder
    status?: SortOrder
  }

  export type PurchaseOrderChangeMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    purchaseOrderId?: SortOrder
    changeType?: SortOrder
    changeSummary?: SortOrder
    changeReason?: SortOrder
    appliedByOperatorId?: SortOrder
    appliedByDisplayName?: SortOrder
    appliedAt?: SortOrder
    status?: SortOrder
  }

  export type EnumProcurementPurchaseOrderChangeStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderChangeStatus | EnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderChangeStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderChangeStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel>
  }

  export type EnumProcurementReceivingExpectationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingExpectationStatus | EnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel> | $Enums.ProcurementReceivingExpectationStatus
  }

  export type ReceivingDiscrepancyNullableScalarRelationFilter = {
    is?: ReceivingDiscrepancyWhereInput | null
    isNot?: ReceivingDiscrepancyWhereInput | null
  }

  export type ReceivingExpectationTenantIdPurchaseOrderLineIdCompoundUniqueInput = {
    tenantId: string
    purchaseOrderLineId: string
  }

  export type ReceivingExpectationCountOrderByAggregateInput = {
    id?: SortOrder
    expectationNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    purchaseOrderId?: SortOrder
    purchaseOrderLineId?: SortOrder
    supplierId?: SortOrder
    expectedQuantity?: SortOrder
    receivedQuantitySummary?: SortOrder
    openQuantity?: SortOrder
    expectedReceiptDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceivingExpectationMaxOrderByAggregateInput = {
    id?: SortOrder
    expectationNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    purchaseOrderId?: SortOrder
    purchaseOrderLineId?: SortOrder
    supplierId?: SortOrder
    expectedQuantity?: SortOrder
    receivedQuantitySummary?: SortOrder
    openQuantity?: SortOrder
    expectedReceiptDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReceivingExpectationMinOrderByAggregateInput = {
    id?: SortOrder
    expectationNo?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    purchaseOrderId?: SortOrder
    purchaseOrderLineId?: SortOrder
    supplierId?: SortOrder
    expectedQuantity?: SortOrder
    receivedQuantitySummary?: SortOrder
    openQuantity?: SortOrder
    expectedReceiptDate?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumProcurementReceivingExpectationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingExpectationStatus | EnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingExpectationStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingExpectationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel>
  }

  export type EnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyType | EnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyType
  }

  export type EnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyStatus | EnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyStatus
  }

  export type EnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingResolutionCode | EnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel> | $Enums.ProcurementReceivingResolutionCode | null
  }

  export type ReceivingExpectationScalarRelationFilter = {
    is?: ReceivingExpectationWhereInput
    isNot?: ReceivingExpectationWhereInput
  }

  export type ReceivingDiscrepancyCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receivingExpectationId?: SortOrder
    discrepancyType?: SortOrder
    summary?: SortOrder
    status?: SortOrder
    resolutionCode?: SortOrder
    resolutionNote?: SortOrder
    resolvedAt?: SortOrder
  }

  export type ReceivingDiscrepancyMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receivingExpectationId?: SortOrder
    discrepancyType?: SortOrder
    summary?: SortOrder
    status?: SortOrder
    resolutionCode?: SortOrder
    resolutionNote?: SortOrder
    resolvedAt?: SortOrder
  }

  export type ReceivingDiscrepancyMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    receivingExpectationId?: SortOrder
    discrepancyType?: SortOrder
    summary?: SortOrder
    status?: SortOrder
    resolutionCode?: SortOrder
    resolutionNote?: SortOrder
    resolvedAt?: SortOrder
  }

  export type EnumProcurementReceivingDiscrepancyTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyType | EnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel>
  }

  export type EnumProcurementReceivingDiscrepancyStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyStatus | EnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel>
  }

  export type EnumProcurementReceivingResolutionCodeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingResolutionCode | EnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumProcurementReceivingResolutionCodeNullableWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingResolutionCode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel>
  }

  export type ProcurementAuditEnvelopeCountOrderByAggregateInput = {
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

  export type ProcurementAuditEnvelopeMaxOrderByAggregateInput = {
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

  export type ProcurementAuditEnvelopeMinOrderByAggregateInput = {
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

  export type PurchaseRequestLineCreateNestedManyWithoutPurchaseRequestInput = {
    create?: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput> | PurchaseRequestLineCreateWithoutPurchaseRequestInput[] | PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput[]
    connectOrCreate?: PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput | PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput[]
    createMany?: PurchaseRequestLineCreateManyPurchaseRequestInputEnvelope
    connect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
  }

  export type PurchaseRequestApprovalSnapshotCreateNestedOneWithoutPurchaseRequestInput = {
    create?: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
    connectOrCreate?: PurchaseRequestApprovalSnapshotCreateOrConnectWithoutPurchaseRequestInput
    connect?: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  export type PurchaseRequestLineUncheckedCreateNestedManyWithoutPurchaseRequestInput = {
    create?: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput> | PurchaseRequestLineCreateWithoutPurchaseRequestInput[] | PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput[]
    connectOrCreate?: PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput | PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput[]
    createMany?: PurchaseRequestLineCreateManyPurchaseRequestInputEnvelope
    connect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
  }

  export type PurchaseRequestApprovalSnapshotUncheckedCreateNestedOneWithoutPurchaseRequestInput = {
    create?: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
    connectOrCreate?: PurchaseRequestApprovalSnapshotCreateOrConnectWithoutPurchaseRequestInput
    connect?: PurchaseRequestApprovalSnapshotWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseRequestType
  }

  export type EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseRequestStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type PurchaseRequestLineUpdateManyWithoutPurchaseRequestNestedInput = {
    create?: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput> | PurchaseRequestLineCreateWithoutPurchaseRequestInput[] | PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput[]
    connectOrCreate?: PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput | PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput[]
    upsert?: PurchaseRequestLineUpsertWithWhereUniqueWithoutPurchaseRequestInput | PurchaseRequestLineUpsertWithWhereUniqueWithoutPurchaseRequestInput[]
    createMany?: PurchaseRequestLineCreateManyPurchaseRequestInputEnvelope
    set?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    disconnect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    delete?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    connect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    update?: PurchaseRequestLineUpdateWithWhereUniqueWithoutPurchaseRequestInput | PurchaseRequestLineUpdateWithWhereUniqueWithoutPurchaseRequestInput[]
    updateMany?: PurchaseRequestLineUpdateManyWithWhereWithoutPurchaseRequestInput | PurchaseRequestLineUpdateManyWithWhereWithoutPurchaseRequestInput[]
    deleteMany?: PurchaseRequestLineScalarWhereInput | PurchaseRequestLineScalarWhereInput[]
  }

  export type PurchaseRequestApprovalSnapshotUpdateOneWithoutPurchaseRequestNestedInput = {
    create?: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
    connectOrCreate?: PurchaseRequestApprovalSnapshotCreateOrConnectWithoutPurchaseRequestInput
    upsert?: PurchaseRequestApprovalSnapshotUpsertWithoutPurchaseRequestInput
    disconnect?: PurchaseRequestApprovalSnapshotWhereInput | boolean
    delete?: PurchaseRequestApprovalSnapshotWhereInput | boolean
    connect?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    update?: XOR<XOR<PurchaseRequestApprovalSnapshotUpdateToOneWithWhereWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUpdateWithoutPurchaseRequestInput>, PurchaseRequestApprovalSnapshotUncheckedUpdateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineUncheckedUpdateManyWithoutPurchaseRequestNestedInput = {
    create?: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput> | PurchaseRequestLineCreateWithoutPurchaseRequestInput[] | PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput[]
    connectOrCreate?: PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput | PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput[]
    upsert?: PurchaseRequestLineUpsertWithWhereUniqueWithoutPurchaseRequestInput | PurchaseRequestLineUpsertWithWhereUniqueWithoutPurchaseRequestInput[]
    createMany?: PurchaseRequestLineCreateManyPurchaseRequestInputEnvelope
    set?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    disconnect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    delete?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    connect?: PurchaseRequestLineWhereUniqueInput | PurchaseRequestLineWhereUniqueInput[]
    update?: PurchaseRequestLineUpdateWithWhereUniqueWithoutPurchaseRequestInput | PurchaseRequestLineUpdateWithWhereUniqueWithoutPurchaseRequestInput[]
    updateMany?: PurchaseRequestLineUpdateManyWithWhereWithoutPurchaseRequestInput | PurchaseRequestLineUpdateManyWithWhereWithoutPurchaseRequestInput[]
    deleteMany?: PurchaseRequestLineScalarWhereInput | PurchaseRequestLineScalarWhereInput[]
  }

  export type PurchaseRequestApprovalSnapshotUncheckedUpdateOneWithoutPurchaseRequestNestedInput = {
    create?: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
    connectOrCreate?: PurchaseRequestApprovalSnapshotCreateOrConnectWithoutPurchaseRequestInput
    upsert?: PurchaseRequestApprovalSnapshotUpsertWithoutPurchaseRequestInput
    disconnect?: PurchaseRequestApprovalSnapshotWhereInput | boolean
    delete?: PurchaseRequestApprovalSnapshotWhereInput | boolean
    connect?: PurchaseRequestApprovalSnapshotWhereUniqueInput
    update?: XOR<XOR<PurchaseRequestApprovalSnapshotUpdateToOneWithWhereWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUpdateWithoutPurchaseRequestInput>, PurchaseRequestApprovalSnapshotUncheckedUpdateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestCreateNestedOneWithoutLinesInput = {
    create?: XOR<PurchaseRequestCreateWithoutLinesInput, PurchaseRequestUncheckedCreateWithoutLinesInput>
    connectOrCreate?: PurchaseRequestCreateOrConnectWithoutLinesInput
    connect?: PurchaseRequestWhereUniqueInput
  }

  export type EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseRequestLineType
  }

  export type PurchaseRequestUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<PurchaseRequestCreateWithoutLinesInput, PurchaseRequestUncheckedCreateWithoutLinesInput>
    connectOrCreate?: PurchaseRequestCreateOrConnectWithoutLinesInput
    upsert?: PurchaseRequestUpsertWithoutLinesInput
    connect?: PurchaseRequestWhereUniqueInput
    update?: XOR<XOR<PurchaseRequestUpdateToOneWithWhereWithoutLinesInput, PurchaseRequestUpdateWithoutLinesInput>, PurchaseRequestUncheckedUpdateWithoutLinesInput>
  }

  export type PurchaseRequestCreateNestedOneWithoutApprovalSnapshotInput = {
    create?: XOR<PurchaseRequestCreateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedCreateWithoutApprovalSnapshotInput>
    connectOrCreate?: PurchaseRequestCreateOrConnectWithoutApprovalSnapshotInput
    connect?: PurchaseRequestWhereUniqueInput
  }

  export type EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseRequestDecision
  }

  export type PurchaseRequestUpdateOneRequiredWithoutApprovalSnapshotNestedInput = {
    create?: XOR<PurchaseRequestCreateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedCreateWithoutApprovalSnapshotInput>
    connectOrCreate?: PurchaseRequestCreateOrConnectWithoutApprovalSnapshotInput
    upsert?: PurchaseRequestUpsertWithoutApprovalSnapshotInput
    connect?: PurchaseRequestWhereUniqueInput
    update?: XOR<XOR<PurchaseRequestUpdateToOneWithWhereWithoutApprovalSnapshotInput, PurchaseRequestUpdateWithoutApprovalSnapshotInput>, PurchaseRequestUncheckedUpdateWithoutApprovalSnapshotInput>
  }

  export type PurchaseOrderLineCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderLineCreateWithoutPurchaseOrderInput[] | PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderLineCreateManyPurchaseOrderInputEnvelope
    connect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
  }

  export type PurchaseOrderChangeCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderChangeCreateWithoutPurchaseOrderInput[] | PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderChangeCreateManyPurchaseOrderInputEnvelope
    connect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
  }

  export type ReceivingExpectationCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput> | ReceivingExpectationCreateWithoutPurchaseOrderInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderInputEnvelope
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
  }

  export type PurchaseOrderLineUncheckedCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderLineCreateWithoutPurchaseOrderInput[] | PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderLineCreateManyPurchaseOrderInputEnvelope
    connect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
  }

  export type PurchaseOrderChangeUncheckedCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderChangeCreateWithoutPurchaseOrderInput[] | PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderChangeCreateManyPurchaseOrderInputEnvelope
    connect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
  }

  export type ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput> | ReceivingExpectationCreateWithoutPurchaseOrderInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderInputEnvelope
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
  }

  export type EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseOrderStatus
  }

  export type EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementSupplierAcknowledgementStatus
  }

  export type PurchaseOrderLineUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderLineCreateWithoutPurchaseOrderInput[] | PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: PurchaseOrderLineUpsertWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderLineUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderLineCreateManyPurchaseOrderInputEnvelope
    set?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    disconnect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    delete?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    connect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    update?: PurchaseOrderLineUpdateWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderLineUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: PurchaseOrderLineUpdateManyWithWhereWithoutPurchaseOrderInput | PurchaseOrderLineUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: PurchaseOrderLineScalarWhereInput | PurchaseOrderLineScalarWhereInput[]
  }

  export type PurchaseOrderChangeUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderChangeCreateWithoutPurchaseOrderInput[] | PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: PurchaseOrderChangeUpsertWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderChangeUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderChangeCreateManyPurchaseOrderInputEnvelope
    set?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    disconnect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    delete?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    connect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    update?: PurchaseOrderChangeUpdateWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderChangeUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: PurchaseOrderChangeUpdateManyWithWhereWithoutPurchaseOrderInput | PurchaseOrderChangeUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: PurchaseOrderChangeScalarWhereInput | PurchaseOrderChangeScalarWhereInput[]
  }

  export type ReceivingExpectationUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput> | ReceivingExpectationCreateWithoutPurchaseOrderInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderInput | ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderInputEnvelope
    set?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    disconnect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    delete?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    update?: ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderInput | ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderInput | ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
  }

  export type PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderLineCreateWithoutPurchaseOrderInput[] | PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: PurchaseOrderLineUpsertWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderLineUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderLineCreateManyPurchaseOrderInputEnvelope
    set?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    disconnect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    delete?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    connect?: PurchaseOrderLineWhereUniqueInput | PurchaseOrderLineWhereUniqueInput[]
    update?: PurchaseOrderLineUpdateWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderLineUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: PurchaseOrderLineUpdateManyWithWhereWithoutPurchaseOrderInput | PurchaseOrderLineUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: PurchaseOrderLineScalarWhereInput | PurchaseOrderLineScalarWhereInput[]
  }

  export type PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput> | PurchaseOrderChangeCreateWithoutPurchaseOrderInput[] | PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput | PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: PurchaseOrderChangeUpsertWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderChangeUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: PurchaseOrderChangeCreateManyPurchaseOrderInputEnvelope
    set?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    disconnect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    delete?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    connect?: PurchaseOrderChangeWhereUniqueInput | PurchaseOrderChangeWhereUniqueInput[]
    update?: PurchaseOrderChangeUpdateWithWhereUniqueWithoutPurchaseOrderInput | PurchaseOrderChangeUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: PurchaseOrderChangeUpdateManyWithWhereWithoutPurchaseOrderInput | PurchaseOrderChangeUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: PurchaseOrderChangeScalarWhereInput | PurchaseOrderChangeScalarWhereInput[]
  }

  export type ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderNestedInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput> | ReceivingExpectationCreateWithoutPurchaseOrderInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput[]
    upsert?: ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderInput | ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderInputEnvelope
    set?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    disconnect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    delete?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    update?: ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderInput | ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderInput[]
    updateMany?: ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderInput | ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderInput[]
    deleteMany?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
  }

  export type PurchaseOrderLineAllocationCreateNestedManyWithoutPurchaseOrderLineInput = {
    create?: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput> | PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput[] | PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput[]
    createMany?: PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInputEnvelope
    connect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
  }

  export type ReceivingExpectationCreateNestedManyWithoutPurchaseOrderLineInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput> | ReceivingExpectationCreateWithoutPurchaseOrderLineInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderLineInputEnvelope
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
  }

  export type PurchaseOrderCreateNestedOneWithoutLinesInput = {
    create?: XOR<PurchaseOrderCreateWithoutLinesInput, PurchaseOrderUncheckedCreateWithoutLinesInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutLinesInput
    connect?: PurchaseOrderWhereUniqueInput
  }

  export type PurchaseOrderLineAllocationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput = {
    create?: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput> | PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput[] | PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput[]
    createMany?: PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInputEnvelope
    connect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
  }

  export type ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput> | ReceivingExpectationCreateWithoutPurchaseOrderLineInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderLineInputEnvelope
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
  }

  export type PurchaseOrderLineAllocationUpdateManyWithoutPurchaseOrderLineNestedInput = {
    create?: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput> | PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput[] | PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput[]
    upsert?: PurchaseOrderLineAllocationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput[]
    createMany?: PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInputEnvelope
    set?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    disconnect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    delete?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    connect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    update?: PurchaseOrderLineAllocationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput[]
    updateMany?: PurchaseOrderLineAllocationUpdateManyWithWhereWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpdateManyWithWhereWithoutPurchaseOrderLineInput[]
    deleteMany?: PurchaseOrderLineAllocationScalarWhereInput | PurchaseOrderLineAllocationScalarWhereInput[]
  }

  export type ReceivingExpectationUpdateManyWithoutPurchaseOrderLineNestedInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput> | ReceivingExpectationCreateWithoutPurchaseOrderLineInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput[]
    upsert?: ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput | ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderLineInputEnvelope
    set?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    disconnect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    delete?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    update?: ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput | ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput[]
    updateMany?: ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderLineInput | ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderLineInput[]
    deleteMany?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
  }

  export type PurchaseOrderUpdateOneRequiredWithoutLinesNestedInput = {
    create?: XOR<PurchaseOrderCreateWithoutLinesInput, PurchaseOrderUncheckedCreateWithoutLinesInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutLinesInput
    upsert?: PurchaseOrderUpsertWithoutLinesInput
    connect?: PurchaseOrderWhereUniqueInput
    update?: XOR<XOR<PurchaseOrderUpdateToOneWithWhereWithoutLinesInput, PurchaseOrderUpdateWithoutLinesInput>, PurchaseOrderUncheckedUpdateWithoutLinesInput>
  }

  export type PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput = {
    create?: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput> | PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput[] | PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput[]
    upsert?: PurchaseOrderLineAllocationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput[]
    createMany?: PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInputEnvelope
    set?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    disconnect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    delete?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    connect?: PurchaseOrderLineAllocationWhereUniqueInput | PurchaseOrderLineAllocationWhereUniqueInput[]
    update?: PurchaseOrderLineAllocationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput[]
    updateMany?: PurchaseOrderLineAllocationUpdateManyWithWhereWithoutPurchaseOrderLineInput | PurchaseOrderLineAllocationUpdateManyWithWhereWithoutPurchaseOrderLineInput[]
    deleteMany?: PurchaseOrderLineAllocationScalarWhereInput | PurchaseOrderLineAllocationScalarWhereInput[]
  }

  export type ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput = {
    create?: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput> | ReceivingExpectationCreateWithoutPurchaseOrderLineInput[] | ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput[]
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput | ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput[]
    upsert?: ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput | ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput[]
    createMany?: ReceivingExpectationCreateManyPurchaseOrderLineInputEnvelope
    set?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    disconnect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    delete?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    connect?: ReceivingExpectationWhereUniqueInput | ReceivingExpectationWhereUniqueInput[]
    update?: ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput | ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput[]
    updateMany?: ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderLineInput | ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderLineInput[]
    deleteMany?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
  }

  export type PurchaseOrderLineCreateNestedOneWithoutAllocationsInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutAllocationsInput, PurchaseOrderLineUncheckedCreateWithoutAllocationsInput>
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutAllocationsInput
    connect?: PurchaseOrderLineWhereUniqueInput
  }

  export type EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseOrderLineAllocationType
  }

  export type PurchaseOrderLineUpdateOneRequiredWithoutAllocationsNestedInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutAllocationsInput, PurchaseOrderLineUncheckedCreateWithoutAllocationsInput>
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutAllocationsInput
    upsert?: PurchaseOrderLineUpsertWithoutAllocationsInput
    connect?: PurchaseOrderLineWhereUniqueInput
    update?: XOR<XOR<PurchaseOrderLineUpdateToOneWithWhereWithoutAllocationsInput, PurchaseOrderLineUpdateWithoutAllocationsInput>, PurchaseOrderLineUncheckedUpdateWithoutAllocationsInput>
  }

  export type PurchaseOrderCreateNestedOneWithoutChangesInput = {
    create?: XOR<PurchaseOrderCreateWithoutChangesInput, PurchaseOrderUncheckedCreateWithoutChangesInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutChangesInput
    connect?: PurchaseOrderWhereUniqueInput
  }

  export type EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderUpdateOneRequiredWithoutChangesNestedInput = {
    create?: XOR<PurchaseOrderCreateWithoutChangesInput, PurchaseOrderUncheckedCreateWithoutChangesInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutChangesInput
    upsert?: PurchaseOrderUpsertWithoutChangesInput
    connect?: PurchaseOrderWhereUniqueInput
    update?: XOR<XOR<PurchaseOrderUpdateToOneWithWhereWithoutChangesInput, PurchaseOrderUpdateWithoutChangesInput>, PurchaseOrderUncheckedUpdateWithoutChangesInput>
  }

  export type ReceivingDiscrepancyCreateNestedOneWithoutReceivingExpectationInput = {
    create?: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
    connectOrCreate?: ReceivingDiscrepancyCreateOrConnectWithoutReceivingExpectationInput
    connect?: ReceivingDiscrepancyWhereUniqueInput
  }

  export type PurchaseOrderCreateNestedOneWithoutReceivingExpectationsInput = {
    create?: XOR<PurchaseOrderCreateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedCreateWithoutReceivingExpectationsInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutReceivingExpectationsInput
    connect?: PurchaseOrderWhereUniqueInput
  }

  export type PurchaseOrderLineCreateNestedOneWithoutReceivingExpectationsInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedCreateWithoutReceivingExpectationsInput>
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutReceivingExpectationsInput
    connect?: PurchaseOrderLineWhereUniqueInput
  }

  export type ReceivingDiscrepancyUncheckedCreateNestedOneWithoutReceivingExpectationInput = {
    create?: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
    connectOrCreate?: ReceivingDiscrepancyCreateOrConnectWithoutReceivingExpectationInput
    connect?: ReceivingDiscrepancyWhereUniqueInput
  }

  export type EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementReceivingExpectationStatus
  }

  export type ReceivingDiscrepancyUpdateOneWithoutReceivingExpectationNestedInput = {
    create?: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
    connectOrCreate?: ReceivingDiscrepancyCreateOrConnectWithoutReceivingExpectationInput
    upsert?: ReceivingDiscrepancyUpsertWithoutReceivingExpectationInput
    disconnect?: ReceivingDiscrepancyWhereInput | boolean
    delete?: ReceivingDiscrepancyWhereInput | boolean
    connect?: ReceivingDiscrepancyWhereUniqueInput
    update?: XOR<XOR<ReceivingDiscrepancyUpdateToOneWithWhereWithoutReceivingExpectationInput, ReceivingDiscrepancyUpdateWithoutReceivingExpectationInput>, ReceivingDiscrepancyUncheckedUpdateWithoutReceivingExpectationInput>
  }

  export type PurchaseOrderUpdateOneRequiredWithoutReceivingExpectationsNestedInput = {
    create?: XOR<PurchaseOrderCreateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedCreateWithoutReceivingExpectationsInput>
    connectOrCreate?: PurchaseOrderCreateOrConnectWithoutReceivingExpectationsInput
    upsert?: PurchaseOrderUpsertWithoutReceivingExpectationsInput
    connect?: PurchaseOrderWhereUniqueInput
    update?: XOR<XOR<PurchaseOrderUpdateToOneWithWhereWithoutReceivingExpectationsInput, PurchaseOrderUpdateWithoutReceivingExpectationsInput>, PurchaseOrderUncheckedUpdateWithoutReceivingExpectationsInput>
  }

  export type PurchaseOrderLineUpdateOneRequiredWithoutReceivingExpectationsNestedInput = {
    create?: XOR<PurchaseOrderLineCreateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedCreateWithoutReceivingExpectationsInput>
    connectOrCreate?: PurchaseOrderLineCreateOrConnectWithoutReceivingExpectationsInput
    upsert?: PurchaseOrderLineUpsertWithoutReceivingExpectationsInput
    connect?: PurchaseOrderLineWhereUniqueInput
    update?: XOR<XOR<PurchaseOrderLineUpdateToOneWithWhereWithoutReceivingExpectationsInput, PurchaseOrderLineUpdateWithoutReceivingExpectationsInput>, PurchaseOrderLineUncheckedUpdateWithoutReceivingExpectationsInput>
  }

  export type ReceivingDiscrepancyUncheckedUpdateOneWithoutReceivingExpectationNestedInput = {
    create?: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
    connectOrCreate?: ReceivingDiscrepancyCreateOrConnectWithoutReceivingExpectationInput
    upsert?: ReceivingDiscrepancyUpsertWithoutReceivingExpectationInput
    disconnect?: ReceivingDiscrepancyWhereInput | boolean
    delete?: ReceivingDiscrepancyWhereInput | boolean
    connect?: ReceivingDiscrepancyWhereUniqueInput
    update?: XOR<XOR<ReceivingDiscrepancyUpdateToOneWithWhereWithoutReceivingExpectationInput, ReceivingDiscrepancyUpdateWithoutReceivingExpectationInput>, ReceivingDiscrepancyUncheckedUpdateWithoutReceivingExpectationInput>
  }

  export type ReceivingExpectationCreateNestedOneWithoutDiscrepancyInput = {
    create?: XOR<ReceivingExpectationCreateWithoutDiscrepancyInput, ReceivingExpectationUncheckedCreateWithoutDiscrepancyInput>
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutDiscrepancyInput
    connect?: ReceivingExpectationWhereUniqueInput
  }

  export type EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementReceivingDiscrepancyType
  }

  export type EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementReceivingDiscrepancyStatus
  }

  export type NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput = {
    set?: $Enums.ProcurementReceivingResolutionCode | null
  }

  export type ReceivingExpectationUpdateOneRequiredWithoutDiscrepancyNestedInput = {
    create?: XOR<ReceivingExpectationCreateWithoutDiscrepancyInput, ReceivingExpectationUncheckedCreateWithoutDiscrepancyInput>
    connectOrCreate?: ReceivingExpectationCreateOrConnectWithoutDiscrepancyInput
    upsert?: ReceivingExpectationUpsertWithoutDiscrepancyInput
    connect?: ReceivingExpectationWhereUniqueInput
    update?: XOR<XOR<ReceivingExpectationUpdateToOneWithWhereWithoutDiscrepancyInput, ReceivingExpectationUpdateWithoutDiscrepancyInput>, ReceivingExpectationUncheckedUpdateWithoutDiscrepancyInput>
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

  export type NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestType | EnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestType
  }

  export type NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestStatus | EnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestStatus
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

  export type NestedEnumProcurementPurchaseRequestTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestType | EnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestType[] | ListEnumProcurementPurchaseRequestTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestTypeFilter<$PrismaModel>
  }

  export type NestedEnumProcurementPurchaseRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestStatus | EnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestStatus[] | ListEnumProcurementPurchaseRequestStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestStatusFilter<$PrismaModel>
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

  export type NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestLineType | EnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestLineType
  }

  export type NestedEnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestLineType | EnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestLineType[] | ListEnumProcurementPurchaseRequestLineTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestLineTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestLineType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestLineTypeFilter<$PrismaModel>
  }

  export type NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestDecision | EnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestDecision
  }

  export type NestedEnumProcurementPurchaseRequestDecisionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseRequestDecision | EnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseRequestDecision[] | ListEnumProcurementPurchaseRequestDecisionFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseRequestDecisionWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseRequestDecision
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseRequestDecisionFilter<$PrismaModel>
  }

  export type NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderStatus | EnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderStatus
  }

  export type NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementSupplierAcknowledgementStatus | EnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel> | $Enums.ProcurementSupplierAcknowledgementStatus
  }

  export type NestedEnumProcurementPurchaseOrderStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderStatus | EnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderStatus[] | ListEnumProcurementPurchaseOrderStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderStatusFilter<$PrismaModel>
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

  export type NestedEnumProcurementSupplierAcknowledgementStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementSupplierAcknowledgementStatus | EnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementSupplierAcknowledgementStatus[] | ListEnumProcurementSupplierAcknowledgementStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementSupplierAcknowledgementStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementSupplierAcknowledgementStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementSupplierAcknowledgementStatusFilter<$PrismaModel>
  }

  export type NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderLineAllocationType | EnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderLineAllocationType
  }

  export type NestedEnumProcurementPurchaseOrderLineAllocationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderLineAllocationType | EnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderLineAllocationType[] | ListEnumProcurementPurchaseOrderLineAllocationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderLineAllocationTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderLineAllocationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderLineAllocationTypeFilter<$PrismaModel>
  }

  export type NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderChangeStatus | EnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type NestedEnumProcurementPurchaseOrderChangeStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementPurchaseOrderChangeStatus | EnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementPurchaseOrderChangeStatus[] | ListEnumProcurementPurchaseOrderChangeStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementPurchaseOrderChangeStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementPurchaseOrderChangeStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementPurchaseOrderChangeStatusFilter<$PrismaModel>
  }

  export type NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingExpectationStatus | EnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel> | $Enums.ProcurementReceivingExpectationStatus
  }

  export type NestedEnumProcurementReceivingExpectationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingExpectationStatus | EnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingExpectationStatus[] | ListEnumProcurementReceivingExpectationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingExpectationStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingExpectationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingExpectationStatusFilter<$PrismaModel>
  }

  export type NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyType | EnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyType
  }

  export type NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyStatus | EnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyStatus
  }

  export type NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingResolutionCode | EnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel> | $Enums.ProcurementReceivingResolutionCode | null
  }

  export type NestedEnumProcurementReceivingDiscrepancyTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyType | EnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyType[] | ListEnumProcurementReceivingDiscrepancyTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyTypeWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingDiscrepancyTypeFilter<$PrismaModel>
  }

  export type NestedEnumProcurementReceivingDiscrepancyStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingDiscrepancyStatus | EnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ProcurementReceivingDiscrepancyStatus[] | ListEnumProcurementReceivingDiscrepancyStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumProcurementReceivingDiscrepancyStatusWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingDiscrepancyStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingDiscrepancyStatusFilter<$PrismaModel>
  }

  export type NestedEnumProcurementReceivingResolutionCodeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ProcurementReceivingResolutionCode | EnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    in?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    notIn?: $Enums.ProcurementReceivingResolutionCode[] | ListEnumProcurementReceivingResolutionCodeFieldRefInput<$PrismaModel> | null
    not?: NestedEnumProcurementReceivingResolutionCodeNullableWithAggregatesFilter<$PrismaModel> | $Enums.ProcurementReceivingResolutionCode | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel>
    _max?: NestedEnumProcurementReceivingResolutionCodeNullableFilter<$PrismaModel>
  }

  export type PurchaseRequestLineCreateWithoutPurchaseRequestInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
  }

  export type PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
  }

  export type PurchaseRequestLineCreateOrConnectWithoutPurchaseRequestInput = {
    where: PurchaseRequestLineWhereUniqueInput
    create: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineCreateManyPurchaseRequestInputEnvelope = {
    data: PurchaseRequestLineCreateManyPurchaseRequestInput | PurchaseRequestLineCreateManyPurchaseRequestInput[]
    skipDuplicates?: boolean
  }

  export type PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput = {
    id: string
    tenantId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date | string
    comment?: string | null
    approvalReference?: string | null
  }

  export type PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput = {
    id: string
    tenantId: string
    decision: $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId: string
    decidedByDisplayName: string
    decidedAt: Date | string
    comment?: string | null
    approvalReference?: string | null
  }

  export type PurchaseRequestApprovalSnapshotCreateOrConnectWithoutPurchaseRequestInput = {
    where: PurchaseRequestApprovalSnapshotWhereUniqueInput
    create: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineUpsertWithWhereUniqueWithoutPurchaseRequestInput = {
    where: PurchaseRequestLineWhereUniqueInput
    update: XOR<PurchaseRequestLineUpdateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedUpdateWithoutPurchaseRequestInput>
    create: XOR<PurchaseRequestLineCreateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedCreateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineUpdateWithWhereUniqueWithoutPurchaseRequestInput = {
    where: PurchaseRequestLineWhereUniqueInput
    data: XOR<PurchaseRequestLineUpdateWithoutPurchaseRequestInput, PurchaseRequestLineUncheckedUpdateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineUpdateManyWithWhereWithoutPurchaseRequestInput = {
    where: PurchaseRequestLineScalarWhereInput
    data: XOR<PurchaseRequestLineUpdateManyMutationInput, PurchaseRequestLineUncheckedUpdateManyWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestLineScalarWhereInput = {
    AND?: PurchaseRequestLineScalarWhereInput | PurchaseRequestLineScalarWhereInput[]
    OR?: PurchaseRequestLineScalarWhereInput[]
    NOT?: PurchaseRequestLineScalarWhereInput | PurchaseRequestLineScalarWhereInput[]
    id?: UuidFilter<"PurchaseRequestLine"> | string
    tenantId?: StringFilter<"PurchaseRequestLine"> | string
    purchaseRequestId?: UuidFilter<"PurchaseRequestLine"> | string
    lineNo?: IntFilter<"PurchaseRequestLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseRequestLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    description?: StringFilter<"PurchaseRequestLine"> | string
    requestedQuantity?: StringFilter<"PurchaseRequestLine"> | string
    uom?: StringFilter<"PurchaseRequestLine"> | string
    neededByDate?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceType?: StringNullableFilter<"PurchaseRequestLine"> | string | null
    demandReferenceId?: StringNullableFilter<"PurchaseRequestLine"> | string | null
  }

  export type PurchaseRequestApprovalSnapshotUpsertWithoutPurchaseRequestInput = {
    update: XOR<PurchaseRequestApprovalSnapshotUpdateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedUpdateWithoutPurchaseRequestInput>
    create: XOR<PurchaseRequestApprovalSnapshotCreateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedCreateWithoutPurchaseRequestInput>
    where?: PurchaseRequestApprovalSnapshotWhereInput
  }

  export type PurchaseRequestApprovalSnapshotUpdateToOneWithWhereWithoutPurchaseRequestInput = {
    where?: PurchaseRequestApprovalSnapshotWhereInput
    data: XOR<PurchaseRequestApprovalSnapshotUpdateWithoutPurchaseRequestInput, PurchaseRequestApprovalSnapshotUncheckedUpdateWithoutPurchaseRequestInput>
  }

  export type PurchaseRequestApprovalSnapshotUpdateWithoutPurchaseRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestApprovalSnapshotUncheckedUpdateWithoutPurchaseRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    decision?: EnumProcurementPurchaseRequestDecisionFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestDecision
    decidedByOperatorId?: StringFieldUpdateOperationsInput | string
    decidedByDisplayName?: StringFieldUpdateOperationsInput | string
    decidedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    approvalReference?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestCreateWithoutLinesInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    approvalSnapshot?: PurchaseRequestApprovalSnapshotCreateNestedOneWithoutPurchaseRequestInput
  }

  export type PurchaseRequestUncheckedCreateWithoutLinesInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUncheckedCreateNestedOneWithoutPurchaseRequestInput
  }

  export type PurchaseRequestCreateOrConnectWithoutLinesInput = {
    where: PurchaseRequestWhereUniqueInput
    create: XOR<PurchaseRequestCreateWithoutLinesInput, PurchaseRequestUncheckedCreateWithoutLinesInput>
  }

  export type PurchaseRequestUpsertWithoutLinesInput = {
    update: XOR<PurchaseRequestUpdateWithoutLinesInput, PurchaseRequestUncheckedUpdateWithoutLinesInput>
    create: XOR<PurchaseRequestCreateWithoutLinesInput, PurchaseRequestUncheckedCreateWithoutLinesInput>
    where?: PurchaseRequestWhereInput
  }

  export type PurchaseRequestUpdateToOneWithWhereWithoutLinesInput = {
    where?: PurchaseRequestWhereInput
    data: XOR<PurchaseRequestUpdateWithoutLinesInput, PurchaseRequestUncheckedUpdateWithoutLinesInput>
  }

  export type PurchaseRequestUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUpdateOneWithoutPurchaseRequestNestedInput
  }

  export type PurchaseRequestUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    approvalSnapshot?: PurchaseRequestApprovalSnapshotUncheckedUpdateOneWithoutPurchaseRequestNestedInput
  }

  export type PurchaseRequestCreateWithoutApprovalSnapshotInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseRequestLineCreateNestedManyWithoutPurchaseRequestInput
  }

  export type PurchaseRequestUncheckedCreateWithoutApprovalSnapshotInput = {
    id: string
    requestNo: string
    tenantId: string
    orgId?: string | null
    requestType: $Enums.ProcurementPurchaseRequestType
    status: $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId: string
    requesterDisplayName: string
    title?: string | null
    reason?: string | null
    submissionComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    submittedAt?: Date | string | null
    decidedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseRequestLineUncheckedCreateNestedManyWithoutPurchaseRequestInput
  }

  export type PurchaseRequestCreateOrConnectWithoutApprovalSnapshotInput = {
    where: PurchaseRequestWhereUniqueInput
    create: XOR<PurchaseRequestCreateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedCreateWithoutApprovalSnapshotInput>
  }

  export type PurchaseRequestUpsertWithoutApprovalSnapshotInput = {
    update: XOR<PurchaseRequestUpdateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedUpdateWithoutApprovalSnapshotInput>
    create: XOR<PurchaseRequestCreateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedCreateWithoutApprovalSnapshotInput>
    where?: PurchaseRequestWhereInput
  }

  export type PurchaseRequestUpdateToOneWithWhereWithoutApprovalSnapshotInput = {
    where?: PurchaseRequestWhereInput
    data: XOR<PurchaseRequestUpdateWithoutApprovalSnapshotInput, PurchaseRequestUncheckedUpdateWithoutApprovalSnapshotInput>
  }

  export type PurchaseRequestUpdateWithoutApprovalSnapshotInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseRequestLineUpdateManyWithoutPurchaseRequestNestedInput
  }

  export type PurchaseRequestUncheckedUpdateWithoutApprovalSnapshotInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    requestType?: EnumProcurementPurchaseRequestTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestType
    status?: EnumProcurementPurchaseRequestStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestStatus
    requesterOperatorId?: StringFieldUpdateOperationsInput | string
    requesterDisplayName?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    submissionComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    submittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    decidedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseRequestLineUncheckedUpdateManyWithoutPurchaseRequestNestedInput
  }

  export type PurchaseOrderLineCreateWithoutPurchaseOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationCreateNestedManyWithoutPurchaseOrderLineInput
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderLineInput
  }

  export type PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
  }

  export type PurchaseOrderLineCreateOrConnectWithoutPurchaseOrderInput = {
    where: PurchaseOrderLineWhereUniqueInput
    create: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderLineCreateManyPurchaseOrderInputEnvelope = {
    data: PurchaseOrderLineCreateManyPurchaseOrderInput | PurchaseOrderLineCreateManyPurchaseOrderInput[]
    skipDuplicates?: boolean
  }

  export type PurchaseOrderChangeCreateWithoutPurchaseOrderInput = {
    id: string
    tenantId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput = {
    id: string
    tenantId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeCreateOrConnectWithoutPurchaseOrderInput = {
    where: PurchaseOrderChangeWhereUniqueInput
    create: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderChangeCreateManyPurchaseOrderInputEnvelope = {
    data: PurchaseOrderChangeCreateManyPurchaseOrderInput | PurchaseOrderChangeCreateManyPurchaseOrderInput[]
    skipDuplicates?: boolean
  }

  export type ReceivingExpectationCreateWithoutPurchaseOrderInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyCreateNestedOneWithoutReceivingExpectationInput
    purchaseOrderLine: PurchaseOrderLineCreateNestedOneWithoutReceivingExpectationsInput
  }

  export type ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedCreateNestedOneWithoutReceivingExpectationInput
  }

  export type ReceivingExpectationCreateOrConnectWithoutPurchaseOrderInput = {
    where: ReceivingExpectationWhereUniqueInput
    create: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type ReceivingExpectationCreateManyPurchaseOrderInputEnvelope = {
    data: ReceivingExpectationCreateManyPurchaseOrderInput | ReceivingExpectationCreateManyPurchaseOrderInput[]
    skipDuplicates?: boolean
  }

  export type PurchaseOrderLineUpsertWithWhereUniqueWithoutPurchaseOrderInput = {
    where: PurchaseOrderLineWhereUniqueInput
    update: XOR<PurchaseOrderLineUpdateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedUpdateWithoutPurchaseOrderInput>
    create: XOR<PurchaseOrderLineCreateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderLineUpdateWithWhereUniqueWithoutPurchaseOrderInput = {
    where: PurchaseOrderLineWhereUniqueInput
    data: XOR<PurchaseOrderLineUpdateWithoutPurchaseOrderInput, PurchaseOrderLineUncheckedUpdateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderLineUpdateManyWithWhereWithoutPurchaseOrderInput = {
    where: PurchaseOrderLineScalarWhereInput
    data: XOR<PurchaseOrderLineUpdateManyMutationInput, PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderLineScalarWhereInput = {
    AND?: PurchaseOrderLineScalarWhereInput | PurchaseOrderLineScalarWhereInput[]
    OR?: PurchaseOrderLineScalarWhereInput[]
    NOT?: PurchaseOrderLineScalarWhereInput | PurchaseOrderLineScalarWhereInput[]
    id?: UuidFilter<"PurchaseOrderLine"> | string
    tenantId?: StringFilter<"PurchaseOrderLine"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderLine"> | string
    lineNo?: IntFilter<"PurchaseOrderLine"> | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFilter<"PurchaseOrderLine"> | $Enums.ProcurementPurchaseRequestLineType
    itemId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemCode?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    itemName?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    description?: StringFilter<"PurchaseOrderLine"> | string
    supplierOfferingId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    orderedQuantity?: StringFilter<"PurchaseOrderLine"> | string
    uom?: StringFilter<"PurchaseOrderLine"> | string
    orderedUnitPrice?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourcePurchaseRequestLineId?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    sourceRequestedQuantity?: StringNullableFilter<"PurchaseOrderLine"> | string | null
    generalStockExcessReason?: StringNullableFilter<"PurchaseOrderLine"> | string | null
  }

  export type PurchaseOrderChangeUpsertWithWhereUniqueWithoutPurchaseOrderInput = {
    where: PurchaseOrderChangeWhereUniqueInput
    update: XOR<PurchaseOrderChangeUpdateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedUpdateWithoutPurchaseOrderInput>
    create: XOR<PurchaseOrderChangeCreateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderChangeUpdateWithWhereUniqueWithoutPurchaseOrderInput = {
    where: PurchaseOrderChangeWhereUniqueInput
    data: XOR<PurchaseOrderChangeUpdateWithoutPurchaseOrderInput, PurchaseOrderChangeUncheckedUpdateWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderChangeUpdateManyWithWhereWithoutPurchaseOrderInput = {
    where: PurchaseOrderChangeScalarWhereInput
    data: XOR<PurchaseOrderChangeUpdateManyMutationInput, PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderInput>
  }

  export type PurchaseOrderChangeScalarWhereInput = {
    AND?: PurchaseOrderChangeScalarWhereInput | PurchaseOrderChangeScalarWhereInput[]
    OR?: PurchaseOrderChangeScalarWhereInput[]
    NOT?: PurchaseOrderChangeScalarWhereInput | PurchaseOrderChangeScalarWhereInput[]
    id?: UuidFilter<"PurchaseOrderChange"> | string
    tenantId?: StringFilter<"PurchaseOrderChange"> | string
    purchaseOrderId?: UuidFilter<"PurchaseOrderChange"> | string
    changeType?: StringFilter<"PurchaseOrderChange"> | string
    changeSummary?: StringFilter<"PurchaseOrderChange"> | string
    changeReason?: StringNullableFilter<"PurchaseOrderChange"> | string | null
    appliedByOperatorId?: StringFilter<"PurchaseOrderChange"> | string
    appliedByDisplayName?: StringFilter<"PurchaseOrderChange"> | string
    appliedAt?: DateTimeFilter<"PurchaseOrderChange"> | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFilter<"PurchaseOrderChange"> | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderInput = {
    where: ReceivingExpectationWhereUniqueInput
    update: XOR<ReceivingExpectationUpdateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderInput>
    create: XOR<ReceivingExpectationCreateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderInput>
  }

  export type ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderInput = {
    where: ReceivingExpectationWhereUniqueInput
    data: XOR<ReceivingExpectationUpdateWithoutPurchaseOrderInput, ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderInput>
  }

  export type ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderInput = {
    where: ReceivingExpectationScalarWhereInput
    data: XOR<ReceivingExpectationUpdateManyMutationInput, ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderInput>
  }

  export type ReceivingExpectationScalarWhereInput = {
    AND?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
    OR?: ReceivingExpectationScalarWhereInput[]
    NOT?: ReceivingExpectationScalarWhereInput | ReceivingExpectationScalarWhereInput[]
    id?: UuidFilter<"ReceivingExpectation"> | string
    expectationNo?: StringFilter<"ReceivingExpectation"> | string
    tenantId?: StringFilter<"ReceivingExpectation"> | string
    orgId?: StringNullableFilter<"ReceivingExpectation"> | string | null
    purchaseOrderId?: UuidFilter<"ReceivingExpectation"> | string
    purchaseOrderLineId?: UuidFilter<"ReceivingExpectation"> | string
    supplierId?: StringFilter<"ReceivingExpectation"> | string
    expectedQuantity?: StringFilter<"ReceivingExpectation"> | string
    receivedQuantitySummary?: StringFilter<"ReceivingExpectation"> | string
    openQuantity?: StringFilter<"ReceivingExpectation"> | string
    expectedReceiptDate?: StringNullableFilter<"ReceivingExpectation"> | string | null
    status?: EnumProcurementReceivingExpectationStatusFilter<"ReceivingExpectation"> | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
    updatedAt?: DateTimeFilter<"ReceivingExpectation"> | Date | string
  }

  export type PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput = {
    id: string
    tenantId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
  }

  export type PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput = {
    id: string
    tenantId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
  }

  export type PurchaseOrderLineAllocationCreateOrConnectWithoutPurchaseOrderLineInput = {
    where: PurchaseOrderLineAllocationWhereUniqueInput
    create: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput>
  }

  export type PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInputEnvelope = {
    data: PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInput | PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInput[]
    skipDuplicates?: boolean
  }

  export type ReceivingExpectationCreateWithoutPurchaseOrderLineInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyCreateNestedOneWithoutReceivingExpectationInput
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutReceivingExpectationsInput
  }

  export type ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedCreateNestedOneWithoutReceivingExpectationInput
  }

  export type ReceivingExpectationCreateOrConnectWithoutPurchaseOrderLineInput = {
    where: ReceivingExpectationWhereUniqueInput
    create: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput>
  }

  export type ReceivingExpectationCreateManyPurchaseOrderLineInputEnvelope = {
    data: ReceivingExpectationCreateManyPurchaseOrderLineInput | ReceivingExpectationCreateManyPurchaseOrderLineInput[]
    skipDuplicates?: boolean
  }

  export type PurchaseOrderCreateWithoutLinesInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    changes?: PurchaseOrderChangeCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderUncheckedCreateWithoutLinesInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    changes?: PurchaseOrderChangeUncheckedCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderCreateOrConnectWithoutLinesInput = {
    where: PurchaseOrderWhereUniqueInput
    create: XOR<PurchaseOrderCreateWithoutLinesInput, PurchaseOrderUncheckedCreateWithoutLinesInput>
  }

  export type PurchaseOrderLineAllocationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput = {
    where: PurchaseOrderLineAllocationWhereUniqueInput
    update: XOR<PurchaseOrderLineAllocationUpdateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedUpdateWithoutPurchaseOrderLineInput>
    create: XOR<PurchaseOrderLineAllocationCreateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedCreateWithoutPurchaseOrderLineInput>
  }

  export type PurchaseOrderLineAllocationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput = {
    where: PurchaseOrderLineAllocationWhereUniqueInput
    data: XOR<PurchaseOrderLineAllocationUpdateWithoutPurchaseOrderLineInput, PurchaseOrderLineAllocationUncheckedUpdateWithoutPurchaseOrderLineInput>
  }

  export type PurchaseOrderLineAllocationUpdateManyWithWhereWithoutPurchaseOrderLineInput = {
    where: PurchaseOrderLineAllocationScalarWhereInput
    data: XOR<PurchaseOrderLineAllocationUpdateManyMutationInput, PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineInput>
  }

  export type PurchaseOrderLineAllocationScalarWhereInput = {
    AND?: PurchaseOrderLineAllocationScalarWhereInput | PurchaseOrderLineAllocationScalarWhereInput[]
    OR?: PurchaseOrderLineAllocationScalarWhereInput[]
    NOT?: PurchaseOrderLineAllocationScalarWhereInput | PurchaseOrderLineAllocationScalarWhereInput[]
    id?: UuidFilter<"PurchaseOrderLineAllocation"> | string
    tenantId?: StringFilter<"PurchaseOrderLineAllocation"> | string
    purchaseOrderLineId?: UuidFilter<"PurchaseOrderLineAllocation"> | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFilter<"PurchaseOrderLineAllocation"> | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
    quantity?: StringFilter<"PurchaseOrderLineAllocation"> | string
    reason?: StringNullableFilter<"PurchaseOrderLineAllocation"> | string | null
  }

  export type ReceivingExpectationUpsertWithWhereUniqueWithoutPurchaseOrderLineInput = {
    where: ReceivingExpectationWhereUniqueInput
    update: XOR<ReceivingExpectationUpdateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderLineInput>
    create: XOR<ReceivingExpectationCreateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedCreateWithoutPurchaseOrderLineInput>
  }

  export type ReceivingExpectationUpdateWithWhereUniqueWithoutPurchaseOrderLineInput = {
    where: ReceivingExpectationWhereUniqueInput
    data: XOR<ReceivingExpectationUpdateWithoutPurchaseOrderLineInput, ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderLineInput>
  }

  export type ReceivingExpectationUpdateManyWithWhereWithoutPurchaseOrderLineInput = {
    where: ReceivingExpectationScalarWhereInput
    data: XOR<ReceivingExpectationUpdateManyMutationInput, ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineInput>
  }

  export type PurchaseOrderUpsertWithoutLinesInput = {
    update: XOR<PurchaseOrderUpdateWithoutLinesInput, PurchaseOrderUncheckedUpdateWithoutLinesInput>
    create: XOR<PurchaseOrderCreateWithoutLinesInput, PurchaseOrderUncheckedCreateWithoutLinesInput>
    where?: PurchaseOrderWhereInput
  }

  export type PurchaseOrderUpdateToOneWithWhereWithoutLinesInput = {
    where?: PurchaseOrderWhereInput
    data: XOR<PurchaseOrderUpdateWithoutLinesInput, PurchaseOrderUncheckedUpdateWithoutLinesInput>
  }

  export type PurchaseOrderUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    changes?: PurchaseOrderChangeUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderUncheckedUpdateWithoutLinesInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    changes?: PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderLineCreateWithoutAllocationsInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderLineInput
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutLinesInput
  }

  export type PurchaseOrderLineUncheckedCreateWithoutAllocationsInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
  }

  export type PurchaseOrderLineCreateOrConnectWithoutAllocationsInput = {
    where: PurchaseOrderLineWhereUniqueInput
    create: XOR<PurchaseOrderLineCreateWithoutAllocationsInput, PurchaseOrderLineUncheckedCreateWithoutAllocationsInput>
  }

  export type PurchaseOrderLineUpsertWithoutAllocationsInput = {
    update: XOR<PurchaseOrderLineUpdateWithoutAllocationsInput, PurchaseOrderLineUncheckedUpdateWithoutAllocationsInput>
    create: XOR<PurchaseOrderLineCreateWithoutAllocationsInput, PurchaseOrderLineUncheckedCreateWithoutAllocationsInput>
    where?: PurchaseOrderLineWhereInput
  }

  export type PurchaseOrderLineUpdateToOneWithWhereWithoutAllocationsInput = {
    where?: PurchaseOrderLineWhereInput
    data: XOR<PurchaseOrderLineUpdateWithoutAllocationsInput, PurchaseOrderLineUncheckedUpdateWithoutAllocationsInput>
  }

  export type PurchaseOrderLineUpdateWithoutAllocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderLineNestedInput
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutLinesNestedInput
  }

  export type PurchaseOrderLineUncheckedUpdateWithoutAllocationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
  }

  export type PurchaseOrderCreateWithoutChangesInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderUncheckedCreateWithoutChangesInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineUncheckedCreateNestedManyWithoutPurchaseOrderInput
    receivingExpectations?: ReceivingExpectationUncheckedCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderCreateOrConnectWithoutChangesInput = {
    where: PurchaseOrderWhereUniqueInput
    create: XOR<PurchaseOrderCreateWithoutChangesInput, PurchaseOrderUncheckedCreateWithoutChangesInput>
  }

  export type PurchaseOrderUpsertWithoutChangesInput = {
    update: XOR<PurchaseOrderUpdateWithoutChangesInput, PurchaseOrderUncheckedUpdateWithoutChangesInput>
    create: XOR<PurchaseOrderCreateWithoutChangesInput, PurchaseOrderUncheckedCreateWithoutChangesInput>
    where?: PurchaseOrderWhereInput
  }

  export type PurchaseOrderUpdateToOneWithWhereWithoutChangesInput = {
    where?: PurchaseOrderWhereInput
    data: XOR<PurchaseOrderUpdateWithoutChangesInput, PurchaseOrderUncheckedUpdateWithoutChangesInput>
  }

  export type PurchaseOrderUpdateWithoutChangesInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderUncheckedUpdateWithoutChangesInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderNestedInput
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type ReceivingDiscrepancyCreateWithoutReceivingExpectationInput = {
    id: string
    tenantId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: string | null
    resolvedAt?: Date | string | null
  }

  export type ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput = {
    id: string
    tenantId: string
    discrepancyType: $Enums.ProcurementReceivingDiscrepancyType
    summary: string
    status: $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: string | null
    resolvedAt?: Date | string | null
  }

  export type ReceivingDiscrepancyCreateOrConnectWithoutReceivingExpectationInput = {
    where: ReceivingDiscrepancyWhereUniqueInput
    create: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
  }

  export type PurchaseOrderCreateWithoutReceivingExpectationsInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineCreateNestedManyWithoutPurchaseOrderInput
    changes?: PurchaseOrderChangeCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderUncheckedCreateWithoutReceivingExpectationsInput = {
    id: string
    orderNo: string
    tenantId: string
    orgId?: string | null
    status: $Enums.ProcurementPurchaseOrderStatus
    currencyCode: string
    supplierId: string
    supplierDisplayName: string
    supplierStatusAtIssue?: string | null
    sourcePurchaseRequestIds: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos: JsonNullValueInput | InputJsonValue
    acknowledgementStatus: $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: Date | string | null
    acknowledgementExternalReference?: string | null
    acknowledgementComment?: string | null
    issueComment?: string | null
    cancelReason?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    issuedAt?: Date | string | null
    cancelledAt?: Date | string | null
    lines?: PurchaseOrderLineUncheckedCreateNestedManyWithoutPurchaseOrderInput
    changes?: PurchaseOrderChangeUncheckedCreateNestedManyWithoutPurchaseOrderInput
  }

  export type PurchaseOrderCreateOrConnectWithoutReceivingExpectationsInput = {
    where: PurchaseOrderWhereUniqueInput
    create: XOR<PurchaseOrderCreateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedCreateWithoutReceivingExpectationsInput>
  }

  export type PurchaseOrderLineCreateWithoutReceivingExpectationsInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationCreateNestedManyWithoutPurchaseOrderLineInput
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutLinesInput
  }

  export type PurchaseOrderLineUncheckedCreateWithoutReceivingExpectationsInput = {
    id: string
    tenantId: string
    purchaseOrderId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
    allocations?: PurchaseOrderLineAllocationUncheckedCreateNestedManyWithoutPurchaseOrderLineInput
  }

  export type PurchaseOrderLineCreateOrConnectWithoutReceivingExpectationsInput = {
    where: PurchaseOrderLineWhereUniqueInput
    create: XOR<PurchaseOrderLineCreateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedCreateWithoutReceivingExpectationsInput>
  }

  export type ReceivingDiscrepancyUpsertWithoutReceivingExpectationInput = {
    update: XOR<ReceivingDiscrepancyUpdateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedUpdateWithoutReceivingExpectationInput>
    create: XOR<ReceivingDiscrepancyCreateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedCreateWithoutReceivingExpectationInput>
    where?: ReceivingDiscrepancyWhereInput
  }

  export type ReceivingDiscrepancyUpdateToOneWithWhereWithoutReceivingExpectationInput = {
    where?: ReceivingDiscrepancyWhereInput
    data: XOR<ReceivingDiscrepancyUpdateWithoutReceivingExpectationInput, ReceivingDiscrepancyUncheckedUpdateWithoutReceivingExpectationInput>
  }

  export type ReceivingDiscrepancyUpdateWithoutReceivingExpectationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReceivingDiscrepancyUncheckedUpdateWithoutReceivingExpectationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    discrepancyType?: EnumProcurementReceivingDiscrepancyTypeFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyType
    summary?: StringFieldUpdateOperationsInput | string
    status?: EnumProcurementReceivingDiscrepancyStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingDiscrepancyStatus
    resolutionCode?: NullableEnumProcurementReceivingResolutionCodeFieldUpdateOperationsInput | $Enums.ProcurementReceivingResolutionCode | null
    resolutionNote?: NullableStringFieldUpdateOperationsInput | string | null
    resolvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type PurchaseOrderUpsertWithoutReceivingExpectationsInput = {
    update: XOR<PurchaseOrderUpdateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedUpdateWithoutReceivingExpectationsInput>
    create: XOR<PurchaseOrderCreateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedCreateWithoutReceivingExpectationsInput>
    where?: PurchaseOrderWhereInput
  }

  export type PurchaseOrderUpdateToOneWithWhereWithoutReceivingExpectationsInput = {
    where?: PurchaseOrderWhereInput
    data: XOR<PurchaseOrderUpdateWithoutReceivingExpectationsInput, PurchaseOrderUncheckedUpdateWithoutReceivingExpectationsInput>
  }

  export type PurchaseOrderUpdateWithoutReceivingExpectationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUpdateManyWithoutPurchaseOrderNestedInput
    changes?: PurchaseOrderChangeUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderUncheckedUpdateWithoutReceivingExpectationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    orderNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementPurchaseOrderStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderStatus
    currencyCode?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierDisplayName?: StringFieldUpdateOperationsInput | string
    supplierStatusAtIssue?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestIds?: JsonNullValueInput | InputJsonValue
    sourcePurchaseRequestNos?: JsonNullValueInput | InputJsonValue
    acknowledgementStatus?: EnumProcurementSupplierAcknowledgementStatusFieldUpdateOperationsInput | $Enums.ProcurementSupplierAcknowledgementStatus
    acknowledgedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    acknowledgementExternalReference?: NullableStringFieldUpdateOperationsInput | string | null
    acknowledgementComment?: NullableStringFieldUpdateOperationsInput | string | null
    issueComment?: NullableStringFieldUpdateOperationsInput | string | null
    cancelReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    issuedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lines?: PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderNestedInput
    changes?: PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderNestedInput
  }

  export type PurchaseOrderLineUpsertWithoutReceivingExpectationsInput = {
    update: XOR<PurchaseOrderLineUpdateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedUpdateWithoutReceivingExpectationsInput>
    create: XOR<PurchaseOrderLineCreateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedCreateWithoutReceivingExpectationsInput>
    where?: PurchaseOrderLineWhereInput
  }

  export type PurchaseOrderLineUpdateToOneWithWhereWithoutReceivingExpectationsInput = {
    where?: PurchaseOrderLineWhereInput
    data: XOR<PurchaseOrderLineUpdateWithoutReceivingExpectationsInput, PurchaseOrderLineUncheckedUpdateWithoutReceivingExpectationsInput>
  }

  export type PurchaseOrderLineUpdateWithoutReceivingExpectationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUpdateManyWithoutPurchaseOrderLineNestedInput
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutLinesNestedInput
  }

  export type PurchaseOrderLineUncheckedUpdateWithoutReceivingExpectationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
  }

  export type ReceivingExpectationCreateWithoutDiscrepancyInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
    purchaseOrder: PurchaseOrderCreateNestedOneWithoutReceivingExpectationsInput
    purchaseOrderLine: PurchaseOrderLineCreateNestedOneWithoutReceivingExpectationsInput
  }

  export type ReceivingExpectationUncheckedCreateWithoutDiscrepancyInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderId: string
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type ReceivingExpectationCreateOrConnectWithoutDiscrepancyInput = {
    where: ReceivingExpectationWhereUniqueInput
    create: XOR<ReceivingExpectationCreateWithoutDiscrepancyInput, ReceivingExpectationUncheckedCreateWithoutDiscrepancyInput>
  }

  export type ReceivingExpectationUpsertWithoutDiscrepancyInput = {
    update: XOR<ReceivingExpectationUpdateWithoutDiscrepancyInput, ReceivingExpectationUncheckedUpdateWithoutDiscrepancyInput>
    create: XOR<ReceivingExpectationCreateWithoutDiscrepancyInput, ReceivingExpectationUncheckedCreateWithoutDiscrepancyInput>
    where?: ReceivingExpectationWhereInput
  }

  export type ReceivingExpectationUpdateToOneWithWhereWithoutDiscrepancyInput = {
    where?: ReceivingExpectationWhereInput
    data: XOR<ReceivingExpectationUpdateWithoutDiscrepancyInput, ReceivingExpectationUncheckedUpdateWithoutDiscrepancyInput>
  }

  export type ReceivingExpectationUpdateWithoutDiscrepancyInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutReceivingExpectationsNestedInput
    purchaseOrderLine?: PurchaseOrderLineUpdateOneRequiredWithoutReceivingExpectationsNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateWithoutDiscrepancyInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseRequestLineCreateManyPurchaseRequestInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    requestedQuantity: string
    uom: string
    neededByDate?: string | null
    demandReferenceType?: string | null
    demandReferenceId?: string | null
  }

  export type PurchaseRequestLineUpdateWithoutPurchaseRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestLineUncheckedUpdateWithoutPurchaseRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseRequestLineUncheckedUpdateManyWithoutPurchaseRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    requestedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    neededByDate?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceType?: NullableStringFieldUpdateOperationsInput | string | null
    demandReferenceId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineCreateManyPurchaseOrderInput = {
    id: string
    tenantId: string
    lineNo: number
    lineType: $Enums.ProcurementPurchaseRequestLineType
    itemId?: string | null
    itemCode?: string | null
    itemName?: string | null
    description: string
    supplierOfferingId?: string | null
    orderedQuantity: string
    uom: string
    orderedUnitPrice?: string | null
    sourcePurchaseRequestLineId?: string | null
    sourceRequestedQuantity?: string | null
    generalStockExcessReason?: string | null
  }

  export type PurchaseOrderChangeCreateManyPurchaseOrderInput = {
    id: string
    tenantId: string
    changeType: string
    changeSummary: string
    changeReason?: string | null
    appliedByOperatorId: string
    appliedByDisplayName: string
    appliedAt: Date | string
    status: $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type ReceivingExpectationCreateManyPurchaseOrderInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderLineId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type PurchaseOrderLineUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUpdateManyWithoutPurchaseOrderLineNestedInput
    receivingExpectations?: ReceivingExpectationUpdateManyWithoutPurchaseOrderLineNestedInput
  }

  export type PurchaseOrderLineUncheckedUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
    allocations?: PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
    receivingExpectations?: ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineNestedInput
  }

  export type PurchaseOrderLineUncheckedUpdateManyWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    lineNo?: IntFieldUpdateOperationsInput | number
    lineType?: EnumProcurementPurchaseRequestLineTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseRequestLineType
    itemId?: NullableStringFieldUpdateOperationsInput | string | null
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    description?: StringFieldUpdateOperationsInput | string
    supplierOfferingId?: NullableStringFieldUpdateOperationsInput | string | null
    orderedQuantity?: StringFieldUpdateOperationsInput | string
    uom?: StringFieldUpdateOperationsInput | string
    orderedUnitPrice?: NullableStringFieldUpdateOperationsInput | string | null
    sourcePurchaseRequestLineId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceRequestedQuantity?: NullableStringFieldUpdateOperationsInput | string | null
    generalStockExcessReason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderChangeUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUncheckedUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type PurchaseOrderChangeUncheckedUpdateManyWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    changeType?: StringFieldUpdateOperationsInput | string
    changeSummary?: StringFieldUpdateOperationsInput | string
    changeReason?: NullableStringFieldUpdateOperationsInput | string | null
    appliedByOperatorId?: StringFieldUpdateOperationsInput | string
    appliedByDisplayName?: StringFieldUpdateOperationsInput | string
    appliedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumProcurementPurchaseOrderChangeStatusFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderChangeStatus
  }

  export type ReceivingExpectationUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUpdateOneWithoutReceivingExpectationNestedInput
    purchaseOrderLine?: PurchaseOrderLineUpdateOneRequiredWithoutReceivingExpectationsNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedUpdateOneWithoutReceivingExpectationNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderLineId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PurchaseOrderLineAllocationCreateManyPurchaseOrderLineInput = {
    id: string
    tenantId: string
    allocationType: $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: string | null
    quantity: string
    reason?: string | null
  }

  export type ReceivingExpectationCreateManyPurchaseOrderLineInput = {
    id: string
    expectationNo: string
    tenantId: string
    orgId?: string | null
    purchaseOrderId: string
    supplierId: string
    expectedQuantity: string
    receivedQuantitySummary: string
    openQuantity: string
    expectedReceiptDate?: string | null
    status: $Enums.ProcurementReceivingExpectationStatus
    createdAt: Date | string
    updatedAt: Date | string
  }

  export type PurchaseOrderLineAllocationUpdateWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineAllocationUncheckedUpdateWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PurchaseOrderLineAllocationUncheckedUpdateManyWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    allocationType?: EnumProcurementPurchaseOrderLineAllocationTypeFieldUpdateOperationsInput | $Enums.ProcurementPurchaseOrderLineAllocationType
    referenceId?: NullableStringFieldUpdateOperationsInput | string | null
    quantity?: StringFieldUpdateOperationsInput | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ReceivingExpectationUpdateWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUpdateOneWithoutReceivingExpectationNestedInput
    purchaseOrder?: PurchaseOrderUpdateOneRequiredWithoutReceivingExpectationsNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    discrepancy?: ReceivingDiscrepancyUncheckedUpdateOneWithoutReceivingExpectationNestedInput
  }

  export type ReceivingExpectationUncheckedUpdateManyWithoutPurchaseOrderLineInput = {
    id?: StringFieldUpdateOperationsInput | string
    expectationNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    purchaseOrderId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    expectedQuantity?: StringFieldUpdateOperationsInput | string
    receivedQuantitySummary?: StringFieldUpdateOperationsInput | string
    openQuantity?: StringFieldUpdateOperationsInput | string
    expectedReceiptDate?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumProcurementReceivingExpectationStatusFieldUpdateOperationsInput | $Enums.ProcurementReceivingExpectationStatus
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