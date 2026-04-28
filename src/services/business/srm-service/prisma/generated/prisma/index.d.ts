
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
 * Model SrmSequenceCounter
 * 
 */
export type SrmSequenceCounter = $Result.DefaultSelection<Prisma.$SrmSequenceCounterPayload>
/**
 * Model SupplierProfile
 * 
 */
export type SupplierProfile = $Result.DefaultSelection<Prisma.$SupplierProfilePayload>
/**
 * Model SupplierPartyBinding
 * 
 */
export type SupplierPartyBinding = $Result.DefaultSelection<Prisma.$SupplierPartyBindingPayload>
/**
 * Model SupplierContact
 * 
 */
export type SupplierContact = $Result.DefaultSelection<Prisma.$SupplierContactPayload>
/**
 * Model SupplierAddress
 * 
 */
export type SupplierAddress = $Result.DefaultSelection<Prisma.$SupplierAddressPayload>
/**
 * Model SupplierOffering
 * 
 */
export type SupplierOffering = $Result.DefaultSelection<Prisma.$SupplierOfferingPayload>
/**
 * Model SrmAuditEnvelope
 * 
 */
export type SrmAuditEnvelope = $Result.DefaultSelection<Prisma.$SrmAuditEnvelopePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const SrmSupplierStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type SrmSupplierStatus = (typeof SrmSupplierStatus)[keyof typeof SrmSupplierStatus]


export const SrmSupplierPartyBindingStatus: {
  ACTIVE: 'ACTIVE'
};

export type SrmSupplierPartyBindingStatus = (typeof SrmSupplierPartyBindingStatus)[keyof typeof SrmSupplierPartyBindingStatus]


export const SrmSupplierOfferingStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type SrmSupplierOfferingStatus = (typeof SrmSupplierOfferingStatus)[keyof typeof SrmSupplierOfferingStatus]

}

export type SrmSupplierStatus = $Enums.SrmSupplierStatus

export const SrmSupplierStatus: typeof $Enums.SrmSupplierStatus

export type SrmSupplierPartyBindingStatus = $Enums.SrmSupplierPartyBindingStatus

export const SrmSupplierPartyBindingStatus: typeof $Enums.SrmSupplierPartyBindingStatus

export type SrmSupplierOfferingStatus = $Enums.SrmSupplierOfferingStatus

export const SrmSupplierOfferingStatus: typeof $Enums.SrmSupplierOfferingStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more SrmSequenceCounters
 * const srmSequenceCounters = await prisma.srmSequenceCounter.findMany()
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
   * // Fetch zero or more SrmSequenceCounters
   * const srmSequenceCounters = await prisma.srmSequenceCounter.findMany()
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
   * `prisma.srmSequenceCounter`: Exposes CRUD operations for the **SrmSequenceCounter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SrmSequenceCounters
    * const srmSequenceCounters = await prisma.srmSequenceCounter.findMany()
    * ```
    */
  get srmSequenceCounter(): Prisma.SrmSequenceCounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierProfile`: Exposes CRUD operations for the **SupplierProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierProfiles
    * const supplierProfiles = await prisma.supplierProfile.findMany()
    * ```
    */
  get supplierProfile(): Prisma.SupplierProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierPartyBinding`: Exposes CRUD operations for the **SupplierPartyBinding** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierPartyBindings
    * const supplierPartyBindings = await prisma.supplierPartyBinding.findMany()
    * ```
    */
  get supplierPartyBinding(): Prisma.SupplierPartyBindingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierContact`: Exposes CRUD operations for the **SupplierContact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierContacts
    * const supplierContacts = await prisma.supplierContact.findMany()
    * ```
    */
  get supplierContact(): Prisma.SupplierContactDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierAddress`: Exposes CRUD operations for the **SupplierAddress** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierAddresses
    * const supplierAddresses = await prisma.supplierAddress.findMany()
    * ```
    */
  get supplierAddress(): Prisma.SupplierAddressDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierOffering`: Exposes CRUD operations for the **SupplierOffering** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierOfferings
    * const supplierOfferings = await prisma.supplierOffering.findMany()
    * ```
    */
  get supplierOffering(): Prisma.SupplierOfferingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.srmAuditEnvelope`: Exposes CRUD operations for the **SrmAuditEnvelope** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SrmAuditEnvelopes
    * const srmAuditEnvelopes = await prisma.srmAuditEnvelope.findMany()
    * ```
    */
  get srmAuditEnvelope(): Prisma.SrmAuditEnvelopeDelegate<ExtArgs, ClientOptions>;
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
    SrmSequenceCounter: 'SrmSequenceCounter',
    SupplierProfile: 'SupplierProfile',
    SupplierPartyBinding: 'SupplierPartyBinding',
    SupplierContact: 'SupplierContact',
    SupplierAddress: 'SupplierAddress',
    SupplierOffering: 'SupplierOffering',
    SrmAuditEnvelope: 'SrmAuditEnvelope'
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
      modelProps: "srmSequenceCounter" | "supplierProfile" | "supplierPartyBinding" | "supplierContact" | "supplierAddress" | "supplierOffering" | "srmAuditEnvelope"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      SrmSequenceCounter: {
        payload: Prisma.$SrmSequenceCounterPayload<ExtArgs>
        fields: Prisma.SrmSequenceCounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SrmSequenceCounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          findFirst: {
            args: Prisma.SrmSequenceCounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SrmSequenceCounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          findMany: {
            args: Prisma.SrmSequenceCounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>[]
          }
          create: {
            args: Prisma.SrmSequenceCounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          createMany: {
            args: Prisma.SrmSequenceCounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SrmSequenceCounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>[]
          }
          delete: {
            args: Prisma.SrmSequenceCounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          update: {
            args: Prisma.SrmSequenceCounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          deleteMany: {
            args: Prisma.SrmSequenceCounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SrmSequenceCounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>[]
          }
          upsert: {
            args: Prisma.SrmSequenceCounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmSequenceCounterPayload>
          }
          aggregate: {
            args: Prisma.SrmSequenceCounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSrmSequenceCounter>
          }
          groupBy: {
            args: Prisma.SrmSequenceCounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<SrmSequenceCounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.SrmSequenceCounterCountArgs<ExtArgs>
            result: $Utils.Optional<SrmSequenceCounterCountAggregateOutputType> | number
          }
        }
      }
      SupplierProfile: {
        payload: Prisma.$SupplierProfilePayload<ExtArgs>
        fields: Prisma.SupplierProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          findFirst: {
            args: Prisma.SupplierProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          findMany: {
            args: Prisma.SupplierProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>[]
          }
          create: {
            args: Prisma.SupplierProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          createMany: {
            args: Prisma.SupplierProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>[]
          }
          delete: {
            args: Prisma.SupplierProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          update: {
            args: Prisma.SupplierProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          deleteMany: {
            args: Prisma.SupplierProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>[]
          }
          upsert: {
            args: Prisma.SupplierProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierProfilePayload>
          }
          aggregate: {
            args: Prisma.SupplierProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierProfile>
          }
          groupBy: {
            args: Prisma.SupplierProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierProfileCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierProfileCountAggregateOutputType> | number
          }
        }
      }
      SupplierPartyBinding: {
        payload: Prisma.$SupplierPartyBindingPayload<ExtArgs>
        fields: Prisma.SupplierPartyBindingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierPartyBindingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierPartyBindingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          findFirst: {
            args: Prisma.SupplierPartyBindingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierPartyBindingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          findMany: {
            args: Prisma.SupplierPartyBindingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>[]
          }
          create: {
            args: Prisma.SupplierPartyBindingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          createMany: {
            args: Prisma.SupplierPartyBindingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierPartyBindingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>[]
          }
          delete: {
            args: Prisma.SupplierPartyBindingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          update: {
            args: Prisma.SupplierPartyBindingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          deleteMany: {
            args: Prisma.SupplierPartyBindingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierPartyBindingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierPartyBindingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>[]
          }
          upsert: {
            args: Prisma.SupplierPartyBindingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierPartyBindingPayload>
          }
          aggregate: {
            args: Prisma.SupplierPartyBindingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierPartyBinding>
          }
          groupBy: {
            args: Prisma.SupplierPartyBindingGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierPartyBindingGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierPartyBindingCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierPartyBindingCountAggregateOutputType> | number
          }
        }
      }
      SupplierContact: {
        payload: Prisma.$SupplierContactPayload<ExtArgs>
        fields: Prisma.SupplierContactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierContactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierContactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          findFirst: {
            args: Prisma.SupplierContactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierContactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          findMany: {
            args: Prisma.SupplierContactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>[]
          }
          create: {
            args: Prisma.SupplierContactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          createMany: {
            args: Prisma.SupplierContactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierContactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>[]
          }
          delete: {
            args: Prisma.SupplierContactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          update: {
            args: Prisma.SupplierContactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          deleteMany: {
            args: Prisma.SupplierContactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierContactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierContactUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>[]
          }
          upsert: {
            args: Prisma.SupplierContactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierContactPayload>
          }
          aggregate: {
            args: Prisma.SupplierContactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierContact>
          }
          groupBy: {
            args: Prisma.SupplierContactGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierContactGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierContactCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierContactCountAggregateOutputType> | number
          }
        }
      }
      SupplierAddress: {
        payload: Prisma.$SupplierAddressPayload<ExtArgs>
        fields: Prisma.SupplierAddressFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierAddressFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierAddressFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          findFirst: {
            args: Prisma.SupplierAddressFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierAddressFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          findMany: {
            args: Prisma.SupplierAddressFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>[]
          }
          create: {
            args: Prisma.SupplierAddressCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          createMany: {
            args: Prisma.SupplierAddressCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierAddressCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>[]
          }
          delete: {
            args: Prisma.SupplierAddressDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          update: {
            args: Prisma.SupplierAddressUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          deleteMany: {
            args: Prisma.SupplierAddressDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierAddressUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierAddressUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>[]
          }
          upsert: {
            args: Prisma.SupplierAddressUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierAddressPayload>
          }
          aggregate: {
            args: Prisma.SupplierAddressAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierAddress>
          }
          groupBy: {
            args: Prisma.SupplierAddressGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierAddressGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierAddressCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierAddressCountAggregateOutputType> | number
          }
        }
      }
      SupplierOffering: {
        payload: Prisma.$SupplierOfferingPayload<ExtArgs>
        fields: Prisma.SupplierOfferingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierOfferingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierOfferingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          findFirst: {
            args: Prisma.SupplierOfferingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierOfferingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          findMany: {
            args: Prisma.SupplierOfferingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>[]
          }
          create: {
            args: Prisma.SupplierOfferingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          createMany: {
            args: Prisma.SupplierOfferingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierOfferingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>[]
          }
          delete: {
            args: Prisma.SupplierOfferingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          update: {
            args: Prisma.SupplierOfferingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          deleteMany: {
            args: Prisma.SupplierOfferingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierOfferingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierOfferingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>[]
          }
          upsert: {
            args: Prisma.SupplierOfferingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierOfferingPayload>
          }
          aggregate: {
            args: Prisma.SupplierOfferingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierOffering>
          }
          groupBy: {
            args: Prisma.SupplierOfferingGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierOfferingGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierOfferingCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierOfferingCountAggregateOutputType> | number
          }
        }
      }
      SrmAuditEnvelope: {
        payload: Prisma.$SrmAuditEnvelopePayload<ExtArgs>
        fields: Prisma.SrmAuditEnvelopeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SrmAuditEnvelopeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          findFirst: {
            args: Prisma.SrmAuditEnvelopeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          findMany: {
            args: Prisma.SrmAuditEnvelopeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>[]
          }
          create: {
            args: Prisma.SrmAuditEnvelopeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          createMany: {
            args: Prisma.SrmAuditEnvelopeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>[]
          }
          delete: {
            args: Prisma.SrmAuditEnvelopeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          update: {
            args: Prisma.SrmAuditEnvelopeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          deleteMany: {
            args: Prisma.SrmAuditEnvelopeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SrmAuditEnvelopeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>[]
          }
          upsert: {
            args: Prisma.SrmAuditEnvelopeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SrmAuditEnvelopePayload>
          }
          aggregate: {
            args: Prisma.SrmAuditEnvelopeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSrmAuditEnvelope>
          }
          groupBy: {
            args: Prisma.SrmAuditEnvelopeGroupByArgs<ExtArgs>
            result: $Utils.Optional<SrmAuditEnvelopeGroupByOutputType>[]
          }
          count: {
            args: Prisma.SrmAuditEnvelopeCountArgs<ExtArgs>
            result: $Utils.Optional<SrmAuditEnvelopeCountAggregateOutputType> | number
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
    srmSequenceCounter?: SrmSequenceCounterOmit
    supplierProfile?: SupplierProfileOmit
    supplierPartyBinding?: SupplierPartyBindingOmit
    supplierContact?: SupplierContactOmit
    supplierAddress?: SupplierAddressOmit
    supplierOffering?: SupplierOfferingOmit
    srmAuditEnvelope?: SrmAuditEnvelopeOmit
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
   * Count Type SupplierProfileCountOutputType
   */

  export type SupplierProfileCountOutputType = {
    contacts: number
    addresses: number
    offerings: number
  }

  export type SupplierProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contacts?: boolean | SupplierProfileCountOutputTypeCountContactsArgs
    addresses?: boolean | SupplierProfileCountOutputTypeCountAddressesArgs
    offerings?: boolean | SupplierProfileCountOutputTypeCountOfferingsArgs
  }

  // Custom InputTypes
  /**
   * SupplierProfileCountOutputType without action
   */
  export type SupplierProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfileCountOutputType
     */
    select?: SupplierProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SupplierProfileCountOutputType without action
   */
  export type SupplierProfileCountOutputTypeCountContactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierContactWhereInput
  }

  /**
   * SupplierProfileCountOutputType without action
   */
  export type SupplierProfileCountOutputTypeCountAddressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierAddressWhereInput
  }

  /**
   * SupplierProfileCountOutputType without action
   */
  export type SupplierProfileCountOutputTypeCountOfferingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierOfferingWhereInput
  }


  /**
   * Models
   */

  /**
   * Model SrmSequenceCounter
   */

  export type AggregateSrmSequenceCounter = {
    _count: SrmSequenceCounterCountAggregateOutputType | null
    _avg: SrmSequenceCounterAvgAggregateOutputType | null
    _sum: SrmSequenceCounterSumAggregateOutputType | null
    _min: SrmSequenceCounterMinAggregateOutputType | null
    _max: SrmSequenceCounterMaxAggregateOutputType | null
  }

  export type SrmSequenceCounterAvgAggregateOutputType = {
    nextSupplierProfileNo: number | null
  }

  export type SrmSequenceCounterSumAggregateOutputType = {
    nextSupplierProfileNo: number | null
  }

  export type SrmSequenceCounterMinAggregateOutputType = {
    tenantId: string | null
    nextSupplierProfileNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SrmSequenceCounterMaxAggregateOutputType = {
    tenantId: string | null
    nextSupplierProfileNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SrmSequenceCounterCountAggregateOutputType = {
    tenantId: number
    nextSupplierProfileNo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SrmSequenceCounterAvgAggregateInputType = {
    nextSupplierProfileNo?: true
  }

  export type SrmSequenceCounterSumAggregateInputType = {
    nextSupplierProfileNo?: true
  }

  export type SrmSequenceCounterMinAggregateInputType = {
    tenantId?: true
    nextSupplierProfileNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SrmSequenceCounterMaxAggregateInputType = {
    tenantId?: true
    nextSupplierProfileNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SrmSequenceCounterCountAggregateInputType = {
    tenantId?: true
    nextSupplierProfileNo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SrmSequenceCounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SrmSequenceCounter to aggregate.
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmSequenceCounters to fetch.
     */
    orderBy?: SrmSequenceCounterOrderByWithRelationInput | SrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SrmSequenceCounters
    **/
    _count?: true | SrmSequenceCounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SrmSequenceCounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SrmSequenceCounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SrmSequenceCounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SrmSequenceCounterMaxAggregateInputType
  }

  export type GetSrmSequenceCounterAggregateType<T extends SrmSequenceCounterAggregateArgs> = {
        [P in keyof T & keyof AggregateSrmSequenceCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSrmSequenceCounter[P]>
      : GetScalarType<T[P], AggregateSrmSequenceCounter[P]>
  }




  export type SrmSequenceCounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SrmSequenceCounterWhereInput
    orderBy?: SrmSequenceCounterOrderByWithAggregationInput | SrmSequenceCounterOrderByWithAggregationInput[]
    by: SrmSequenceCounterScalarFieldEnum[] | SrmSequenceCounterScalarFieldEnum
    having?: SrmSequenceCounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SrmSequenceCounterCountAggregateInputType | true
    _avg?: SrmSequenceCounterAvgAggregateInputType
    _sum?: SrmSequenceCounterSumAggregateInputType
    _min?: SrmSequenceCounterMinAggregateInputType
    _max?: SrmSequenceCounterMaxAggregateInputType
  }

  export type SrmSequenceCounterGroupByOutputType = {
    tenantId: string
    nextSupplierProfileNo: number
    createdAt: Date
    updatedAt: Date
    _count: SrmSequenceCounterCountAggregateOutputType | null
    _avg: SrmSequenceCounterAvgAggregateOutputType | null
    _sum: SrmSequenceCounterSumAggregateOutputType | null
    _min: SrmSequenceCounterMinAggregateOutputType | null
    _max: SrmSequenceCounterMaxAggregateOutputType | null
  }

  type GetSrmSequenceCounterGroupByPayload<T extends SrmSequenceCounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SrmSequenceCounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SrmSequenceCounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SrmSequenceCounterGroupByOutputType[P]>
            : GetScalarType<T[P], SrmSequenceCounterGroupByOutputType[P]>
        }
      >
    >


  export type SrmSequenceCounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextSupplierProfileNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["srmSequenceCounter"]>

  export type SrmSequenceCounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextSupplierProfileNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["srmSequenceCounter"]>

  export type SrmSequenceCounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextSupplierProfileNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["srmSequenceCounter"]>

  export type SrmSequenceCounterSelectScalar = {
    tenantId?: boolean
    nextSupplierProfileNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SrmSequenceCounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenantId" | "nextSupplierProfileNo" | "createdAt" | "updatedAt", ExtArgs["result"]["srmSequenceCounter"]>

  export type $SrmSequenceCounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SrmSequenceCounter"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenantId: string
      nextSupplierProfileNo: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["srmSequenceCounter"]>
    composites: {}
  }

  type SrmSequenceCounterGetPayload<S extends boolean | null | undefined | SrmSequenceCounterDefaultArgs> = $Result.GetResult<Prisma.$SrmSequenceCounterPayload, S>

  type SrmSequenceCounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SrmSequenceCounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SrmSequenceCounterCountAggregateInputType | true
    }

  export interface SrmSequenceCounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SrmSequenceCounter'], meta: { name: 'SrmSequenceCounter' } }
    /**
     * Find zero or one SrmSequenceCounter that matches the filter.
     * @param {SrmSequenceCounterFindUniqueArgs} args - Arguments to find a SrmSequenceCounter
     * @example
     * // Get one SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SrmSequenceCounterFindUniqueArgs>(args: SelectSubset<T, SrmSequenceCounterFindUniqueArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SrmSequenceCounter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SrmSequenceCounterFindUniqueOrThrowArgs} args - Arguments to find a SrmSequenceCounter
     * @example
     * // Get one SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SrmSequenceCounterFindUniqueOrThrowArgs>(args: SelectSubset<T, SrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SrmSequenceCounter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterFindFirstArgs} args - Arguments to find a SrmSequenceCounter
     * @example
     * // Get one SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SrmSequenceCounterFindFirstArgs>(args?: SelectSubset<T, SrmSequenceCounterFindFirstArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SrmSequenceCounter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterFindFirstOrThrowArgs} args - Arguments to find a SrmSequenceCounter
     * @example
     * // Get one SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SrmSequenceCounterFindFirstOrThrowArgs>(args?: SelectSubset<T, SrmSequenceCounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SrmSequenceCounters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SrmSequenceCounters
     * const srmSequenceCounters = await prisma.srmSequenceCounter.findMany()
     * 
     * // Get first 10 SrmSequenceCounters
     * const srmSequenceCounters = await prisma.srmSequenceCounter.findMany({ take: 10 })
     * 
     * // Only select the `tenantId`
     * const srmSequenceCounterWithTenantIdOnly = await prisma.srmSequenceCounter.findMany({ select: { tenantId: true } })
     * 
     */
    findMany<T extends SrmSequenceCounterFindManyArgs>(args?: SelectSubset<T, SrmSequenceCounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SrmSequenceCounter.
     * @param {SrmSequenceCounterCreateArgs} args - Arguments to create a SrmSequenceCounter.
     * @example
     * // Create one SrmSequenceCounter
     * const SrmSequenceCounter = await prisma.srmSequenceCounter.create({
     *   data: {
     *     // ... data to create a SrmSequenceCounter
     *   }
     * })
     * 
     */
    create<T extends SrmSequenceCounterCreateArgs>(args: SelectSubset<T, SrmSequenceCounterCreateArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SrmSequenceCounters.
     * @param {SrmSequenceCounterCreateManyArgs} args - Arguments to create many SrmSequenceCounters.
     * @example
     * // Create many SrmSequenceCounters
     * const srmSequenceCounter = await prisma.srmSequenceCounter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SrmSequenceCounterCreateManyArgs>(args?: SelectSubset<T, SrmSequenceCounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SrmSequenceCounters and returns the data saved in the database.
     * @param {SrmSequenceCounterCreateManyAndReturnArgs} args - Arguments to create many SrmSequenceCounters.
     * @example
     * // Create many SrmSequenceCounters
     * const srmSequenceCounter = await prisma.srmSequenceCounter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SrmSequenceCounters and only return the `tenantId`
     * const srmSequenceCounterWithTenantIdOnly = await prisma.srmSequenceCounter.createManyAndReturn({
     *   select: { tenantId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SrmSequenceCounterCreateManyAndReturnArgs>(args?: SelectSubset<T, SrmSequenceCounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SrmSequenceCounter.
     * @param {SrmSequenceCounterDeleteArgs} args - Arguments to delete one SrmSequenceCounter.
     * @example
     * // Delete one SrmSequenceCounter
     * const SrmSequenceCounter = await prisma.srmSequenceCounter.delete({
     *   where: {
     *     // ... filter to delete one SrmSequenceCounter
     *   }
     * })
     * 
     */
    delete<T extends SrmSequenceCounterDeleteArgs>(args: SelectSubset<T, SrmSequenceCounterDeleteArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SrmSequenceCounter.
     * @param {SrmSequenceCounterUpdateArgs} args - Arguments to update one SrmSequenceCounter.
     * @example
     * // Update one SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SrmSequenceCounterUpdateArgs>(args: SelectSubset<T, SrmSequenceCounterUpdateArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SrmSequenceCounters.
     * @param {SrmSequenceCounterDeleteManyArgs} args - Arguments to filter SrmSequenceCounters to delete.
     * @example
     * // Delete a few SrmSequenceCounters
     * const { count } = await prisma.srmSequenceCounter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SrmSequenceCounterDeleteManyArgs>(args?: SelectSubset<T, SrmSequenceCounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SrmSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SrmSequenceCounters
     * const srmSequenceCounter = await prisma.srmSequenceCounter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SrmSequenceCounterUpdateManyArgs>(args: SelectSubset<T, SrmSequenceCounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SrmSequenceCounters and returns the data updated in the database.
     * @param {SrmSequenceCounterUpdateManyAndReturnArgs} args - Arguments to update many SrmSequenceCounters.
     * @example
     * // Update many SrmSequenceCounters
     * const srmSequenceCounter = await prisma.srmSequenceCounter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SrmSequenceCounters and only return the `tenantId`
     * const srmSequenceCounterWithTenantIdOnly = await prisma.srmSequenceCounter.updateManyAndReturn({
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
    updateManyAndReturn<T extends SrmSequenceCounterUpdateManyAndReturnArgs>(args: SelectSubset<T, SrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SrmSequenceCounter.
     * @param {SrmSequenceCounterUpsertArgs} args - Arguments to update or create a SrmSequenceCounter.
     * @example
     * // Update or create a SrmSequenceCounter
     * const srmSequenceCounter = await prisma.srmSequenceCounter.upsert({
     *   create: {
     *     // ... data to create a SrmSequenceCounter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SrmSequenceCounter we want to update
     *   }
     * })
     */
    upsert<T extends SrmSequenceCounterUpsertArgs>(args: SelectSubset<T, SrmSequenceCounterUpsertArgs<ExtArgs>>): Prisma__SrmSequenceCounterClient<$Result.GetResult<Prisma.$SrmSequenceCounterPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SrmSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterCountArgs} args - Arguments to filter SrmSequenceCounters to count.
     * @example
     * // Count the number of SrmSequenceCounters
     * const count = await prisma.srmSequenceCounter.count({
     *   where: {
     *     // ... the filter for the SrmSequenceCounters we want to count
     *   }
     * })
    **/
    count<T extends SrmSequenceCounterCountArgs>(
      args?: Subset<T, SrmSequenceCounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SrmSequenceCounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SrmSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SrmSequenceCounterAggregateArgs>(args: Subset<T, SrmSequenceCounterAggregateArgs>): Prisma.PrismaPromise<GetSrmSequenceCounterAggregateType<T>>

    /**
     * Group by SrmSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmSequenceCounterGroupByArgs} args - Group by arguments.
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
      T extends SrmSequenceCounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SrmSequenceCounterGroupByArgs['orderBy'] }
        : { orderBy?: SrmSequenceCounterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SrmSequenceCounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSrmSequenceCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SrmSequenceCounter model
   */
  readonly fields: SrmSequenceCounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SrmSequenceCounter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SrmSequenceCounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the SrmSequenceCounter model
   */ 
  interface SrmSequenceCounterFieldRefs {
    readonly tenantId: FieldRef<"SrmSequenceCounter", 'String'>
    readonly nextSupplierProfileNo: FieldRef<"SrmSequenceCounter", 'Int'>
    readonly createdAt: FieldRef<"SrmSequenceCounter", 'DateTime'>
    readonly updatedAt: FieldRef<"SrmSequenceCounter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SrmSequenceCounter findUnique
   */
  export type SrmSequenceCounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SrmSequenceCounter to fetch.
     */
    where: SrmSequenceCounterWhereUniqueInput
  }

  /**
   * SrmSequenceCounter findUniqueOrThrow
   */
  export type SrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SrmSequenceCounter to fetch.
     */
    where: SrmSequenceCounterWhereUniqueInput
  }

  /**
   * SrmSequenceCounter findFirst
   */
  export type SrmSequenceCounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SrmSequenceCounter to fetch.
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmSequenceCounters to fetch.
     */
    orderBy?: SrmSequenceCounterOrderByWithRelationInput | SrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SrmSequenceCounters.
     */
    cursor?: SrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SrmSequenceCounters.
     */
    distinct?: SrmSequenceCounterScalarFieldEnum | SrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * SrmSequenceCounter findFirstOrThrow
   */
  export type SrmSequenceCounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SrmSequenceCounter to fetch.
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmSequenceCounters to fetch.
     */
    orderBy?: SrmSequenceCounterOrderByWithRelationInput | SrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SrmSequenceCounters.
     */
    cursor?: SrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SrmSequenceCounters.
     */
    distinct?: SrmSequenceCounterScalarFieldEnum | SrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * SrmSequenceCounter findMany
   */
  export type SrmSequenceCounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which SrmSequenceCounters to fetch.
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmSequenceCounters to fetch.
     */
    orderBy?: SrmSequenceCounterOrderByWithRelationInput | SrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SrmSequenceCounters.
     */
    cursor?: SrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmSequenceCounters.
     */
    skip?: number
    distinct?: SrmSequenceCounterScalarFieldEnum | SrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * SrmSequenceCounter create
   */
  export type SrmSequenceCounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to create a SrmSequenceCounter.
     */
    data: XOR<SrmSequenceCounterCreateInput, SrmSequenceCounterUncheckedCreateInput>
  }

  /**
   * SrmSequenceCounter createMany
   */
  export type SrmSequenceCounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SrmSequenceCounters.
     */
    data: SrmSequenceCounterCreateManyInput | SrmSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SrmSequenceCounter createManyAndReturn
   */
  export type SrmSequenceCounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to create many SrmSequenceCounters.
     */
    data: SrmSequenceCounterCreateManyInput | SrmSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SrmSequenceCounter update
   */
  export type SrmSequenceCounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to update a SrmSequenceCounter.
     */
    data: XOR<SrmSequenceCounterUpdateInput, SrmSequenceCounterUncheckedUpdateInput>
    /**
     * Choose, which SrmSequenceCounter to update.
     */
    where: SrmSequenceCounterWhereUniqueInput
  }

  /**
   * SrmSequenceCounter updateMany
   */
  export type SrmSequenceCounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SrmSequenceCounters.
     */
    data: XOR<SrmSequenceCounterUpdateManyMutationInput, SrmSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which SrmSequenceCounters to update
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * Limit how many SrmSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * SrmSequenceCounter updateManyAndReturn
   */
  export type SrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to update SrmSequenceCounters.
     */
    data: XOR<SrmSequenceCounterUpdateManyMutationInput, SrmSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which SrmSequenceCounters to update
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * Limit how many SrmSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * SrmSequenceCounter upsert
   */
  export type SrmSequenceCounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The filter to search for the SrmSequenceCounter to update in case it exists.
     */
    where: SrmSequenceCounterWhereUniqueInput
    /**
     * In case the SrmSequenceCounter found by the `where` argument doesn't exist, create a new SrmSequenceCounter with this data.
     */
    create: XOR<SrmSequenceCounterCreateInput, SrmSequenceCounterUncheckedCreateInput>
    /**
     * In case the SrmSequenceCounter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SrmSequenceCounterUpdateInput, SrmSequenceCounterUncheckedUpdateInput>
  }

  /**
   * SrmSequenceCounter delete
   */
  export type SrmSequenceCounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter which SrmSequenceCounter to delete.
     */
    where: SrmSequenceCounterWhereUniqueInput
  }

  /**
   * SrmSequenceCounter deleteMany
   */
  export type SrmSequenceCounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SrmSequenceCounters to delete
     */
    where?: SrmSequenceCounterWhereInput
    /**
     * Limit how many SrmSequenceCounters to delete.
     */
    limit?: number
  }

  /**
   * SrmSequenceCounter without action
   */
  export type SrmSequenceCounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmSequenceCounter
     */
    select?: SrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmSequenceCounter
     */
    omit?: SrmSequenceCounterOmit<ExtArgs> | null
  }


  /**
   * Model SupplierProfile
   */

  export type AggregateSupplierProfile = {
    _count: SupplierProfileCountAggregateOutputType | null
    _min: SupplierProfileMinAggregateOutputType | null
    _max: SupplierProfileMaxAggregateOutputType | null
  }

  export type SupplierProfileMinAggregateOutputType = {
    id: string | null
    supplierNo: string | null
    tenantId: string | null
    displayName: string | null
    status: $Enums.SrmSupplierStatus | null
    supplierCategory: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierProfileMaxAggregateOutputType = {
    id: string | null
    supplierNo: string | null
    tenantId: string | null
    displayName: string | null
    status: $Enums.SrmSupplierStatus | null
    supplierCategory: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierProfileCountAggregateOutputType = {
    id: number
    supplierNo: number
    tenantId: number
    displayName: number
    status: number
    supplierCategory: number
    tags: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierProfileMinAggregateInputType = {
    id?: true
    supplierNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    supplierCategory?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierProfileMaxAggregateInputType = {
    id?: true
    supplierNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    supplierCategory?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierProfileCountAggregateInputType = {
    id?: true
    supplierNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    supplierCategory?: true
    tags?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierProfile to aggregate.
     */
    where?: SupplierProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierProfiles to fetch.
     */
    orderBy?: SupplierProfileOrderByWithRelationInput | SupplierProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierProfiles
    **/
    _count?: true | SupplierProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierProfileMaxAggregateInputType
  }

  export type GetSupplierProfileAggregateType<T extends SupplierProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierProfile[P]>
      : GetScalarType<T[P], AggregateSupplierProfile[P]>
  }




  export type SupplierProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierProfileWhereInput
    orderBy?: SupplierProfileOrderByWithAggregationInput | SupplierProfileOrderByWithAggregationInput[]
    by: SupplierProfileScalarFieldEnum[] | SupplierProfileScalarFieldEnum
    having?: SupplierProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierProfileCountAggregateInputType | true
    _min?: SupplierProfileMinAggregateInputType
    _max?: SupplierProfileMaxAggregateInputType
  }

  export type SupplierProfileGroupByOutputType = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory: string | null
    tags: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: SupplierProfileCountAggregateOutputType | null
    _min: SupplierProfileMinAggregateOutputType | null
    _max: SupplierProfileMaxAggregateOutputType | null
  }

  type GetSupplierProfileGroupByPayload<T extends SupplierProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierProfileGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierProfileGroupByOutputType[P]>
        }
      >
    >


  export type SupplierProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supplierNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    supplierCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    partyBinding?: boolean | SupplierProfile$partyBindingArgs<ExtArgs>
    contacts?: boolean | SupplierProfile$contactsArgs<ExtArgs>
    addresses?: boolean | SupplierProfile$addressesArgs<ExtArgs>
    offerings?: boolean | SupplierProfile$offeringsArgs<ExtArgs>
    _count?: boolean | SupplierProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierProfile"]>

  export type SupplierProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supplierNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    supplierCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["supplierProfile"]>

  export type SupplierProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    supplierNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    supplierCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["supplierProfile"]>

  export type SupplierProfileSelectScalar = {
    id?: boolean
    supplierNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    supplierCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "supplierNo" | "tenantId" | "displayName" | "status" | "supplierCategory" | "tags" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierProfile"]>
  export type SupplierProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    partyBinding?: boolean | SupplierProfile$partyBindingArgs<ExtArgs>
    contacts?: boolean | SupplierProfile$contactsArgs<ExtArgs>
    addresses?: boolean | SupplierProfile$addressesArgs<ExtArgs>
    offerings?: boolean | SupplierProfile$offeringsArgs<ExtArgs>
    _count?: boolean | SupplierProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SupplierProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SupplierProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SupplierProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierProfile"
    objects: {
      partyBinding: Prisma.$SupplierPartyBindingPayload<ExtArgs> | null
      contacts: Prisma.$SupplierContactPayload<ExtArgs>[]
      addresses: Prisma.$SupplierAddressPayload<ExtArgs>[]
      offerings: Prisma.$SupplierOfferingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      supplierNo: string
      tenantId: string
      displayName: string
      status: $Enums.SrmSupplierStatus
      supplierCategory: string | null
      tags: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierProfile"]>
    composites: {}
  }

  type SupplierProfileGetPayload<S extends boolean | null | undefined | SupplierProfileDefaultArgs> = $Result.GetResult<Prisma.$SupplierProfilePayload, S>

  type SupplierProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierProfileCountAggregateInputType | true
    }

  export interface SupplierProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierProfile'], meta: { name: 'SupplierProfile' } }
    /**
     * Find zero or one SupplierProfile that matches the filter.
     * @param {SupplierProfileFindUniqueArgs} args - Arguments to find a SupplierProfile
     * @example
     * // Get one SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierProfileFindUniqueArgs>(args: SelectSubset<T, SupplierProfileFindUniqueArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierProfileFindUniqueOrThrowArgs} args - Arguments to find a SupplierProfile
     * @example
     * // Get one SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileFindFirstArgs} args - Arguments to find a SupplierProfile
     * @example
     * // Get one SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierProfileFindFirstArgs>(args?: SelectSubset<T, SupplierProfileFindFirstArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileFindFirstOrThrowArgs} args - Arguments to find a SupplierProfile
     * @example
     * // Get one SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierProfiles
     * const supplierProfiles = await prisma.supplierProfile.findMany()
     * 
     * // Get first 10 SupplierProfiles
     * const supplierProfiles = await prisma.supplierProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierProfileWithIdOnly = await prisma.supplierProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierProfileFindManyArgs>(args?: SelectSubset<T, SupplierProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierProfile.
     * @param {SupplierProfileCreateArgs} args - Arguments to create a SupplierProfile.
     * @example
     * // Create one SupplierProfile
     * const SupplierProfile = await prisma.supplierProfile.create({
     *   data: {
     *     // ... data to create a SupplierProfile
     *   }
     * })
     * 
     */
    create<T extends SupplierProfileCreateArgs>(args: SelectSubset<T, SupplierProfileCreateArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierProfiles.
     * @param {SupplierProfileCreateManyArgs} args - Arguments to create many SupplierProfiles.
     * @example
     * // Create many SupplierProfiles
     * const supplierProfile = await prisma.supplierProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierProfileCreateManyArgs>(args?: SelectSubset<T, SupplierProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierProfiles and returns the data saved in the database.
     * @param {SupplierProfileCreateManyAndReturnArgs} args - Arguments to create many SupplierProfiles.
     * @example
     * // Create many SupplierProfiles
     * const supplierProfile = await prisma.supplierProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierProfiles and only return the `id`
     * const supplierProfileWithIdOnly = await prisma.supplierProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierProfile.
     * @param {SupplierProfileDeleteArgs} args - Arguments to delete one SupplierProfile.
     * @example
     * // Delete one SupplierProfile
     * const SupplierProfile = await prisma.supplierProfile.delete({
     *   where: {
     *     // ... filter to delete one SupplierProfile
     *   }
     * })
     * 
     */
    delete<T extends SupplierProfileDeleteArgs>(args: SelectSubset<T, SupplierProfileDeleteArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierProfile.
     * @param {SupplierProfileUpdateArgs} args - Arguments to update one SupplierProfile.
     * @example
     * // Update one SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierProfileUpdateArgs>(args: SelectSubset<T, SupplierProfileUpdateArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierProfiles.
     * @param {SupplierProfileDeleteManyArgs} args - Arguments to filter SupplierProfiles to delete.
     * @example
     * // Delete a few SupplierProfiles
     * const { count } = await prisma.supplierProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierProfileDeleteManyArgs>(args?: SelectSubset<T, SupplierProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierProfiles
     * const supplierProfile = await prisma.supplierProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierProfileUpdateManyArgs>(args: SelectSubset<T, SupplierProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierProfiles and returns the data updated in the database.
     * @param {SupplierProfileUpdateManyAndReturnArgs} args - Arguments to update many SupplierProfiles.
     * @example
     * // Update many SupplierProfiles
     * const supplierProfile = await prisma.supplierProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierProfiles and only return the `id`
     * const supplierProfileWithIdOnly = await prisma.supplierProfile.updateManyAndReturn({
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
    updateManyAndReturn<T extends SupplierProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierProfile.
     * @param {SupplierProfileUpsertArgs} args - Arguments to update or create a SupplierProfile.
     * @example
     * // Update or create a SupplierProfile
     * const supplierProfile = await prisma.supplierProfile.upsert({
     *   create: {
     *     // ... data to create a SupplierProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierProfile we want to update
     *   }
     * })
     */
    upsert<T extends SupplierProfileUpsertArgs>(args: SelectSubset<T, SupplierProfileUpsertArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileCountArgs} args - Arguments to filter SupplierProfiles to count.
     * @example
     * // Count the number of SupplierProfiles
     * const count = await prisma.supplierProfile.count({
     *   where: {
     *     // ... the filter for the SupplierProfiles we want to count
     *   }
     * })
    **/
    count<T extends SupplierProfileCountArgs>(
      args?: Subset<T, SupplierProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SupplierProfileAggregateArgs>(args: Subset<T, SupplierProfileAggregateArgs>): Prisma.PrismaPromise<GetSupplierProfileAggregateType<T>>

    /**
     * Group by SupplierProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierProfileGroupByArgs} args - Group by arguments.
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
      T extends SupplierProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierProfileGroupByArgs['orderBy'] }
        : { orderBy?: SupplierProfileGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SupplierProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierProfile model
   */
  readonly fields: SupplierProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    partyBinding<T extends SupplierProfile$partyBindingArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfile$partyBindingArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    contacts<T extends SupplierProfile$contactsArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfile$contactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    addresses<T extends SupplierProfile$addressesArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfile$addressesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    offerings<T extends SupplierProfile$offeringsArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfile$offeringsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
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
   * Fields of the SupplierProfile model
   */ 
  interface SupplierProfileFieldRefs {
    readonly id: FieldRef<"SupplierProfile", 'String'>
    readonly supplierNo: FieldRef<"SupplierProfile", 'String'>
    readonly tenantId: FieldRef<"SupplierProfile", 'String'>
    readonly displayName: FieldRef<"SupplierProfile", 'String'>
    readonly status: FieldRef<"SupplierProfile", 'SrmSupplierStatus'>
    readonly supplierCategory: FieldRef<"SupplierProfile", 'String'>
    readonly tags: FieldRef<"SupplierProfile", 'Json'>
    readonly createdAt: FieldRef<"SupplierProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierProfile findUnique
   */
  export type SupplierProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter, which SupplierProfile to fetch.
     */
    where: SupplierProfileWhereUniqueInput
  }

  /**
   * SupplierProfile findUniqueOrThrow
   */
  export type SupplierProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter, which SupplierProfile to fetch.
     */
    where: SupplierProfileWhereUniqueInput
  }

  /**
   * SupplierProfile findFirst
   */
  export type SupplierProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter, which SupplierProfile to fetch.
     */
    where?: SupplierProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierProfiles to fetch.
     */
    orderBy?: SupplierProfileOrderByWithRelationInput | SupplierProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierProfiles.
     */
    cursor?: SupplierProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierProfiles.
     */
    distinct?: SupplierProfileScalarFieldEnum | SupplierProfileScalarFieldEnum[]
  }

  /**
   * SupplierProfile findFirstOrThrow
   */
  export type SupplierProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter, which SupplierProfile to fetch.
     */
    where?: SupplierProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierProfiles to fetch.
     */
    orderBy?: SupplierProfileOrderByWithRelationInput | SupplierProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierProfiles.
     */
    cursor?: SupplierProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierProfiles.
     */
    distinct?: SupplierProfileScalarFieldEnum | SupplierProfileScalarFieldEnum[]
  }

  /**
   * SupplierProfile findMany
   */
  export type SupplierProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter, which SupplierProfiles to fetch.
     */
    where?: SupplierProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierProfiles to fetch.
     */
    orderBy?: SupplierProfileOrderByWithRelationInput | SupplierProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierProfiles.
     */
    cursor?: SupplierProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierProfiles.
     */
    skip?: number
    distinct?: SupplierProfileScalarFieldEnum | SupplierProfileScalarFieldEnum[]
  }

  /**
   * SupplierProfile create
   */
  export type SupplierProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierProfile.
     */
    data: XOR<SupplierProfileCreateInput, SupplierProfileUncheckedCreateInput>
  }

  /**
   * SupplierProfile createMany
   */
  export type SupplierProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierProfiles.
     */
    data: SupplierProfileCreateManyInput | SupplierProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierProfile createManyAndReturn
   */
  export type SupplierProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierProfiles.
     */
    data: SupplierProfileCreateManyInput | SupplierProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierProfile update
   */
  export type SupplierProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierProfile.
     */
    data: XOR<SupplierProfileUpdateInput, SupplierProfileUncheckedUpdateInput>
    /**
     * Choose, which SupplierProfile to update.
     */
    where: SupplierProfileWhereUniqueInput
  }

  /**
   * SupplierProfile updateMany
   */
  export type SupplierProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierProfiles.
     */
    data: XOR<SupplierProfileUpdateManyMutationInput, SupplierProfileUncheckedUpdateManyInput>
    /**
     * Filter which SupplierProfiles to update
     */
    where?: SupplierProfileWhereInput
    /**
     * Limit how many SupplierProfiles to update.
     */
    limit?: number
  }

  /**
   * SupplierProfile updateManyAndReturn
   */
  export type SupplierProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * The data used to update SupplierProfiles.
     */
    data: XOR<SupplierProfileUpdateManyMutationInput, SupplierProfileUncheckedUpdateManyInput>
    /**
     * Filter which SupplierProfiles to update
     */
    where?: SupplierProfileWhereInput
    /**
     * Limit how many SupplierProfiles to update.
     */
    limit?: number
  }

  /**
   * SupplierProfile upsert
   */
  export type SupplierProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierProfile to update in case it exists.
     */
    where: SupplierProfileWhereUniqueInput
    /**
     * In case the SupplierProfile found by the `where` argument doesn't exist, create a new SupplierProfile with this data.
     */
    create: XOR<SupplierProfileCreateInput, SupplierProfileUncheckedCreateInput>
    /**
     * In case the SupplierProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierProfileUpdateInput, SupplierProfileUncheckedUpdateInput>
  }

  /**
   * SupplierProfile delete
   */
  export type SupplierProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
    /**
     * Filter which SupplierProfile to delete.
     */
    where: SupplierProfileWhereUniqueInput
  }

  /**
   * SupplierProfile deleteMany
   */
  export type SupplierProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierProfiles to delete
     */
    where?: SupplierProfileWhereInput
    /**
     * Limit how many SupplierProfiles to delete.
     */
    limit?: number
  }

  /**
   * SupplierProfile.partyBinding
   */
  export type SupplierProfile$partyBindingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    where?: SupplierPartyBindingWhereInput
  }

  /**
   * SupplierProfile.contacts
   */
  export type SupplierProfile$contactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    where?: SupplierContactWhereInput
    orderBy?: SupplierContactOrderByWithRelationInput | SupplierContactOrderByWithRelationInput[]
    cursor?: SupplierContactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SupplierContactScalarFieldEnum | SupplierContactScalarFieldEnum[]
  }

  /**
   * SupplierProfile.addresses
   */
  export type SupplierProfile$addressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    where?: SupplierAddressWhereInput
    orderBy?: SupplierAddressOrderByWithRelationInput | SupplierAddressOrderByWithRelationInput[]
    cursor?: SupplierAddressWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SupplierAddressScalarFieldEnum | SupplierAddressScalarFieldEnum[]
  }

  /**
   * SupplierProfile.offerings
   */
  export type SupplierProfile$offeringsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    where?: SupplierOfferingWhereInput
    orderBy?: SupplierOfferingOrderByWithRelationInput | SupplierOfferingOrderByWithRelationInput[]
    cursor?: SupplierOfferingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SupplierOfferingScalarFieldEnum | SupplierOfferingScalarFieldEnum[]
  }

  /**
   * SupplierProfile without action
   */
  export type SupplierProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierProfile
     */
    select?: SupplierProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierProfile
     */
    omit?: SupplierProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierProfileInclude<ExtArgs> | null
  }


  /**
   * Model SupplierPartyBinding
   */

  export type AggregateSupplierPartyBinding = {
    _count: SupplierPartyBindingCountAggregateOutputType | null
    _min: SupplierPartyBindingMinAggregateOutputType | null
    _max: SupplierPartyBindingMaxAggregateOutputType | null
  }

  export type SupplierPartyBindingMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    tenantPartyId: string | null
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus | null
    partyDisplayName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierPartyBindingMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    tenantPartyId: string | null
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus | null
    partyDisplayName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierPartyBindingCountAggregateOutputType = {
    id: number
    tenantId: number
    supplierId: number
    tenantPartyId: number
    bindingStatus: number
    partyDisplayName: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierPartyBindingMinAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierPartyBindingMaxAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierPartyBindingCountAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierPartyBindingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierPartyBinding to aggregate.
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierPartyBindings to fetch.
     */
    orderBy?: SupplierPartyBindingOrderByWithRelationInput | SupplierPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierPartyBindings
    **/
    _count?: true | SupplierPartyBindingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierPartyBindingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierPartyBindingMaxAggregateInputType
  }

  export type GetSupplierPartyBindingAggregateType<T extends SupplierPartyBindingAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierPartyBinding]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierPartyBinding[P]>
      : GetScalarType<T[P], AggregateSupplierPartyBinding[P]>
  }




  export type SupplierPartyBindingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierPartyBindingWhereInput
    orderBy?: SupplierPartyBindingOrderByWithAggregationInput | SupplierPartyBindingOrderByWithAggregationInput[]
    by: SupplierPartyBindingScalarFieldEnum[] | SupplierPartyBindingScalarFieldEnum
    having?: SupplierPartyBindingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierPartyBindingCountAggregateInputType | true
    _min?: SupplierPartyBindingMinAggregateInputType
    _max?: SupplierPartyBindingMaxAggregateInputType
  }

  export type SupplierPartyBindingGroupByOutputType = {
    id: string
    tenantId: string
    supplierId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName: string | null
    createdAt: Date
    updatedAt: Date
    _count: SupplierPartyBindingCountAggregateOutputType | null
    _min: SupplierPartyBindingMinAggregateOutputType | null
    _max: SupplierPartyBindingMaxAggregateOutputType | null
  }

  type GetSupplierPartyBindingGroupByPayload<T extends SupplierPartyBindingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierPartyBindingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierPartyBindingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierPartyBindingGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierPartyBindingGroupByOutputType[P]>
        }
      >
    >


  export type SupplierPartyBindingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierPartyBinding"]>

  export type SupplierPartyBindingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierPartyBinding"]>

  export type SupplierPartyBindingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierPartyBinding"]>

  export type SupplierPartyBindingSelectScalar = {
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierPartyBindingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "supplierId" | "tenantPartyId" | "bindingStatus" | "partyDisplayName" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierPartyBinding"]>
  export type SupplierPartyBindingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierPartyBindingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierPartyBindingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }

  export type $SupplierPartyBindingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierPartyBinding"
    objects: {
      supplierProfile: Prisma.$SupplierProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      supplierId: string
      tenantPartyId: string
      bindingStatus: $Enums.SrmSupplierPartyBindingStatus
      partyDisplayName: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierPartyBinding"]>
    composites: {}
  }

  type SupplierPartyBindingGetPayload<S extends boolean | null | undefined | SupplierPartyBindingDefaultArgs> = $Result.GetResult<Prisma.$SupplierPartyBindingPayload, S>

  type SupplierPartyBindingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierPartyBindingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierPartyBindingCountAggregateInputType | true
    }

  export interface SupplierPartyBindingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierPartyBinding'], meta: { name: 'SupplierPartyBinding' } }
    /**
     * Find zero or one SupplierPartyBinding that matches the filter.
     * @param {SupplierPartyBindingFindUniqueArgs} args - Arguments to find a SupplierPartyBinding
     * @example
     * // Get one SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierPartyBindingFindUniqueArgs>(args: SelectSubset<T, SupplierPartyBindingFindUniqueArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierPartyBinding that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierPartyBindingFindUniqueOrThrowArgs} args - Arguments to find a SupplierPartyBinding
     * @example
     * // Get one SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierPartyBindingFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierPartyBindingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierPartyBinding that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingFindFirstArgs} args - Arguments to find a SupplierPartyBinding
     * @example
     * // Get one SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierPartyBindingFindFirstArgs>(args?: SelectSubset<T, SupplierPartyBindingFindFirstArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierPartyBinding that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingFindFirstOrThrowArgs} args - Arguments to find a SupplierPartyBinding
     * @example
     * // Get one SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierPartyBindingFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierPartyBindingFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierPartyBindings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierPartyBindings
     * const supplierPartyBindings = await prisma.supplierPartyBinding.findMany()
     * 
     * // Get first 10 SupplierPartyBindings
     * const supplierPartyBindings = await prisma.supplierPartyBinding.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierPartyBindingWithIdOnly = await prisma.supplierPartyBinding.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierPartyBindingFindManyArgs>(args?: SelectSubset<T, SupplierPartyBindingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierPartyBinding.
     * @param {SupplierPartyBindingCreateArgs} args - Arguments to create a SupplierPartyBinding.
     * @example
     * // Create one SupplierPartyBinding
     * const SupplierPartyBinding = await prisma.supplierPartyBinding.create({
     *   data: {
     *     // ... data to create a SupplierPartyBinding
     *   }
     * })
     * 
     */
    create<T extends SupplierPartyBindingCreateArgs>(args: SelectSubset<T, SupplierPartyBindingCreateArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierPartyBindings.
     * @param {SupplierPartyBindingCreateManyArgs} args - Arguments to create many SupplierPartyBindings.
     * @example
     * // Create many SupplierPartyBindings
     * const supplierPartyBinding = await prisma.supplierPartyBinding.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierPartyBindingCreateManyArgs>(args?: SelectSubset<T, SupplierPartyBindingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierPartyBindings and returns the data saved in the database.
     * @param {SupplierPartyBindingCreateManyAndReturnArgs} args - Arguments to create many SupplierPartyBindings.
     * @example
     * // Create many SupplierPartyBindings
     * const supplierPartyBinding = await prisma.supplierPartyBinding.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierPartyBindings and only return the `id`
     * const supplierPartyBindingWithIdOnly = await prisma.supplierPartyBinding.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierPartyBindingCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierPartyBindingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierPartyBinding.
     * @param {SupplierPartyBindingDeleteArgs} args - Arguments to delete one SupplierPartyBinding.
     * @example
     * // Delete one SupplierPartyBinding
     * const SupplierPartyBinding = await prisma.supplierPartyBinding.delete({
     *   where: {
     *     // ... filter to delete one SupplierPartyBinding
     *   }
     * })
     * 
     */
    delete<T extends SupplierPartyBindingDeleteArgs>(args: SelectSubset<T, SupplierPartyBindingDeleteArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierPartyBinding.
     * @param {SupplierPartyBindingUpdateArgs} args - Arguments to update one SupplierPartyBinding.
     * @example
     * // Update one SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierPartyBindingUpdateArgs>(args: SelectSubset<T, SupplierPartyBindingUpdateArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierPartyBindings.
     * @param {SupplierPartyBindingDeleteManyArgs} args - Arguments to filter SupplierPartyBindings to delete.
     * @example
     * // Delete a few SupplierPartyBindings
     * const { count } = await prisma.supplierPartyBinding.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierPartyBindingDeleteManyArgs>(args?: SelectSubset<T, SupplierPartyBindingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierPartyBindings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierPartyBindings
     * const supplierPartyBinding = await prisma.supplierPartyBinding.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierPartyBindingUpdateManyArgs>(args: SelectSubset<T, SupplierPartyBindingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierPartyBindings and returns the data updated in the database.
     * @param {SupplierPartyBindingUpdateManyAndReturnArgs} args - Arguments to update many SupplierPartyBindings.
     * @example
     * // Update many SupplierPartyBindings
     * const supplierPartyBinding = await prisma.supplierPartyBinding.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierPartyBindings and only return the `id`
     * const supplierPartyBindingWithIdOnly = await prisma.supplierPartyBinding.updateManyAndReturn({
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
    updateManyAndReturn<T extends SupplierPartyBindingUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierPartyBindingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierPartyBinding.
     * @param {SupplierPartyBindingUpsertArgs} args - Arguments to update or create a SupplierPartyBinding.
     * @example
     * // Update or create a SupplierPartyBinding
     * const supplierPartyBinding = await prisma.supplierPartyBinding.upsert({
     *   create: {
     *     // ... data to create a SupplierPartyBinding
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierPartyBinding we want to update
     *   }
     * })
     */
    upsert<T extends SupplierPartyBindingUpsertArgs>(args: SelectSubset<T, SupplierPartyBindingUpsertArgs<ExtArgs>>): Prisma__SupplierPartyBindingClient<$Result.GetResult<Prisma.$SupplierPartyBindingPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierPartyBindings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingCountArgs} args - Arguments to filter SupplierPartyBindings to count.
     * @example
     * // Count the number of SupplierPartyBindings
     * const count = await prisma.supplierPartyBinding.count({
     *   where: {
     *     // ... the filter for the SupplierPartyBindings we want to count
     *   }
     * })
    **/
    count<T extends SupplierPartyBindingCountArgs>(
      args?: Subset<T, SupplierPartyBindingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierPartyBindingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierPartyBinding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SupplierPartyBindingAggregateArgs>(args: Subset<T, SupplierPartyBindingAggregateArgs>): Prisma.PrismaPromise<GetSupplierPartyBindingAggregateType<T>>

    /**
     * Group by SupplierPartyBinding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierPartyBindingGroupByArgs} args - Group by arguments.
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
      T extends SupplierPartyBindingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierPartyBindingGroupByArgs['orderBy'] }
        : { orderBy?: SupplierPartyBindingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SupplierPartyBindingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierPartyBindingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierPartyBinding model
   */
  readonly fields: SupplierPartyBindingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierPartyBinding.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierPartyBindingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    supplierProfile<T extends SupplierProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfileDefaultArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the SupplierPartyBinding model
   */ 
  interface SupplierPartyBindingFieldRefs {
    readonly id: FieldRef<"SupplierPartyBinding", 'String'>
    readonly tenantId: FieldRef<"SupplierPartyBinding", 'String'>
    readonly supplierId: FieldRef<"SupplierPartyBinding", 'String'>
    readonly tenantPartyId: FieldRef<"SupplierPartyBinding", 'String'>
    readonly bindingStatus: FieldRef<"SupplierPartyBinding", 'SrmSupplierPartyBindingStatus'>
    readonly partyDisplayName: FieldRef<"SupplierPartyBinding", 'String'>
    readonly createdAt: FieldRef<"SupplierPartyBinding", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierPartyBinding", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierPartyBinding findUnique
   */
  export type SupplierPartyBindingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierPartyBinding to fetch.
     */
    where: SupplierPartyBindingWhereUniqueInput
  }

  /**
   * SupplierPartyBinding findUniqueOrThrow
   */
  export type SupplierPartyBindingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierPartyBinding to fetch.
     */
    where: SupplierPartyBindingWhereUniqueInput
  }

  /**
   * SupplierPartyBinding findFirst
   */
  export type SupplierPartyBindingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierPartyBinding to fetch.
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierPartyBindings to fetch.
     */
    orderBy?: SupplierPartyBindingOrderByWithRelationInput | SupplierPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierPartyBindings.
     */
    cursor?: SupplierPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierPartyBindings.
     */
    distinct?: SupplierPartyBindingScalarFieldEnum | SupplierPartyBindingScalarFieldEnum[]
  }

  /**
   * SupplierPartyBinding findFirstOrThrow
   */
  export type SupplierPartyBindingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierPartyBinding to fetch.
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierPartyBindings to fetch.
     */
    orderBy?: SupplierPartyBindingOrderByWithRelationInput | SupplierPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierPartyBindings.
     */
    cursor?: SupplierPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierPartyBindings.
     */
    distinct?: SupplierPartyBindingScalarFieldEnum | SupplierPartyBindingScalarFieldEnum[]
  }

  /**
   * SupplierPartyBinding findMany
   */
  export type SupplierPartyBindingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierPartyBindings to fetch.
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierPartyBindings to fetch.
     */
    orderBy?: SupplierPartyBindingOrderByWithRelationInput | SupplierPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierPartyBindings.
     */
    cursor?: SupplierPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierPartyBindings.
     */
    skip?: number
    distinct?: SupplierPartyBindingScalarFieldEnum | SupplierPartyBindingScalarFieldEnum[]
  }

  /**
   * SupplierPartyBinding create
   */
  export type SupplierPartyBindingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierPartyBinding.
     */
    data: XOR<SupplierPartyBindingCreateInput, SupplierPartyBindingUncheckedCreateInput>
  }

  /**
   * SupplierPartyBinding createMany
   */
  export type SupplierPartyBindingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierPartyBindings.
     */
    data: SupplierPartyBindingCreateManyInput | SupplierPartyBindingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierPartyBinding createManyAndReturn
   */
  export type SupplierPartyBindingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierPartyBindings.
     */
    data: SupplierPartyBindingCreateManyInput | SupplierPartyBindingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierPartyBinding update
   */
  export type SupplierPartyBindingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierPartyBinding.
     */
    data: XOR<SupplierPartyBindingUpdateInput, SupplierPartyBindingUncheckedUpdateInput>
    /**
     * Choose, which SupplierPartyBinding to update.
     */
    where: SupplierPartyBindingWhereUniqueInput
  }

  /**
   * SupplierPartyBinding updateMany
   */
  export type SupplierPartyBindingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierPartyBindings.
     */
    data: XOR<SupplierPartyBindingUpdateManyMutationInput, SupplierPartyBindingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierPartyBindings to update
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * Limit how many SupplierPartyBindings to update.
     */
    limit?: number
  }

  /**
   * SupplierPartyBinding updateManyAndReturn
   */
  export type SupplierPartyBindingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * The data used to update SupplierPartyBindings.
     */
    data: XOR<SupplierPartyBindingUpdateManyMutationInput, SupplierPartyBindingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierPartyBindings to update
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * Limit how many SupplierPartyBindings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierPartyBinding upsert
   */
  export type SupplierPartyBindingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierPartyBinding to update in case it exists.
     */
    where: SupplierPartyBindingWhereUniqueInput
    /**
     * In case the SupplierPartyBinding found by the `where` argument doesn't exist, create a new SupplierPartyBinding with this data.
     */
    create: XOR<SupplierPartyBindingCreateInput, SupplierPartyBindingUncheckedCreateInput>
    /**
     * In case the SupplierPartyBinding was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierPartyBindingUpdateInput, SupplierPartyBindingUncheckedUpdateInput>
  }

  /**
   * SupplierPartyBinding delete
   */
  export type SupplierPartyBindingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
    /**
     * Filter which SupplierPartyBinding to delete.
     */
    where: SupplierPartyBindingWhereUniqueInput
  }

  /**
   * SupplierPartyBinding deleteMany
   */
  export type SupplierPartyBindingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierPartyBindings to delete
     */
    where?: SupplierPartyBindingWhereInput
    /**
     * Limit how many SupplierPartyBindings to delete.
     */
    limit?: number
  }

  /**
   * SupplierPartyBinding without action
   */
  export type SupplierPartyBindingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierPartyBinding
     */
    select?: SupplierPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierPartyBinding
     */
    omit?: SupplierPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierPartyBindingInclude<ExtArgs> | null
  }


  /**
   * Model SupplierContact
   */

  export type AggregateSupplierContact = {
    _count: SupplierContactCountAggregateOutputType | null
    _min: SupplierContactMinAggregateOutputType | null
    _max: SupplierContactMaxAggregateOutputType | null
  }

  export type SupplierContactMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    displayName: string | null
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierContactMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    displayName: string | null
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierContactCountAggregateOutputType = {
    id: number
    tenantId: number
    supplierId: number
    displayName: number
    roleTitle: number
    email: number
    phone: number
    isPrimaryContact: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierContactMinAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierContactMaxAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierContactCountAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierContactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierContact to aggregate.
     */
    where?: SupplierContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierContacts to fetch.
     */
    orderBy?: SupplierContactOrderByWithRelationInput | SupplierContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierContacts
    **/
    _count?: true | SupplierContactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierContactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierContactMaxAggregateInputType
  }

  export type GetSupplierContactAggregateType<T extends SupplierContactAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierContact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierContact[P]>
      : GetScalarType<T[P], AggregateSupplierContact[P]>
  }




  export type SupplierContactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierContactWhereInput
    orderBy?: SupplierContactOrderByWithAggregationInput | SupplierContactOrderByWithAggregationInput[]
    by: SupplierContactScalarFieldEnum[] | SupplierContactScalarFieldEnum
    having?: SupplierContactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierContactCountAggregateInputType | true
    _min?: SupplierContactMinAggregateInputType
    _max?: SupplierContactMaxAggregateInputType
  }

  export type SupplierContactGroupByOutputType = {
    id: string
    tenantId: string
    supplierId: string
    displayName: string
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: SupplierContactCountAggregateOutputType | null
    _min: SupplierContactMinAggregateOutputType | null
    _max: SupplierContactMaxAggregateOutputType | null
  }

  type GetSupplierContactGroupByPayload<T extends SupplierContactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierContactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierContactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierContactGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierContactGroupByOutputType[P]>
        }
      >
    >


  export type SupplierContactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierContact"]>

  export type SupplierContactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierContact"]>

  export type SupplierContactSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierContact"]>

  export type SupplierContactSelectScalar = {
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierContactOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "supplierId" | "displayName" | "roleTitle" | "email" | "phone" | "isPrimaryContact" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierContact"]>
  export type SupplierContactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierContactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierContactIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }

  export type $SupplierContactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierContact"
    objects: {
      supplierProfile: Prisma.$SupplierProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      supplierId: string
      displayName: string
      roleTitle: string | null
      email: string | null
      phone: string | null
      isPrimaryContact: boolean
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierContact"]>
    composites: {}
  }

  type SupplierContactGetPayload<S extends boolean | null | undefined | SupplierContactDefaultArgs> = $Result.GetResult<Prisma.$SupplierContactPayload, S>

  type SupplierContactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierContactFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierContactCountAggregateInputType | true
    }

  export interface SupplierContactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierContact'], meta: { name: 'SupplierContact' } }
    /**
     * Find zero or one SupplierContact that matches the filter.
     * @param {SupplierContactFindUniqueArgs} args - Arguments to find a SupplierContact
     * @example
     * // Get one SupplierContact
     * const supplierContact = await prisma.supplierContact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierContactFindUniqueArgs>(args: SelectSubset<T, SupplierContactFindUniqueArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierContact that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierContactFindUniqueOrThrowArgs} args - Arguments to find a SupplierContact
     * @example
     * // Get one SupplierContact
     * const supplierContact = await prisma.supplierContact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierContactFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierContactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierContact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactFindFirstArgs} args - Arguments to find a SupplierContact
     * @example
     * // Get one SupplierContact
     * const supplierContact = await prisma.supplierContact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierContactFindFirstArgs>(args?: SelectSubset<T, SupplierContactFindFirstArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierContact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactFindFirstOrThrowArgs} args - Arguments to find a SupplierContact
     * @example
     * // Get one SupplierContact
     * const supplierContact = await prisma.supplierContact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierContactFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierContactFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierContacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierContacts
     * const supplierContacts = await prisma.supplierContact.findMany()
     * 
     * // Get first 10 SupplierContacts
     * const supplierContacts = await prisma.supplierContact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierContactWithIdOnly = await prisma.supplierContact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierContactFindManyArgs>(args?: SelectSubset<T, SupplierContactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierContact.
     * @param {SupplierContactCreateArgs} args - Arguments to create a SupplierContact.
     * @example
     * // Create one SupplierContact
     * const SupplierContact = await prisma.supplierContact.create({
     *   data: {
     *     // ... data to create a SupplierContact
     *   }
     * })
     * 
     */
    create<T extends SupplierContactCreateArgs>(args: SelectSubset<T, SupplierContactCreateArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierContacts.
     * @param {SupplierContactCreateManyArgs} args - Arguments to create many SupplierContacts.
     * @example
     * // Create many SupplierContacts
     * const supplierContact = await prisma.supplierContact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierContactCreateManyArgs>(args?: SelectSubset<T, SupplierContactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierContacts and returns the data saved in the database.
     * @param {SupplierContactCreateManyAndReturnArgs} args - Arguments to create many SupplierContacts.
     * @example
     * // Create many SupplierContacts
     * const supplierContact = await prisma.supplierContact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierContacts and only return the `id`
     * const supplierContactWithIdOnly = await prisma.supplierContact.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierContactCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierContactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierContact.
     * @param {SupplierContactDeleteArgs} args - Arguments to delete one SupplierContact.
     * @example
     * // Delete one SupplierContact
     * const SupplierContact = await prisma.supplierContact.delete({
     *   where: {
     *     // ... filter to delete one SupplierContact
     *   }
     * })
     * 
     */
    delete<T extends SupplierContactDeleteArgs>(args: SelectSubset<T, SupplierContactDeleteArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierContact.
     * @param {SupplierContactUpdateArgs} args - Arguments to update one SupplierContact.
     * @example
     * // Update one SupplierContact
     * const supplierContact = await prisma.supplierContact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierContactUpdateArgs>(args: SelectSubset<T, SupplierContactUpdateArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierContacts.
     * @param {SupplierContactDeleteManyArgs} args - Arguments to filter SupplierContacts to delete.
     * @example
     * // Delete a few SupplierContacts
     * const { count } = await prisma.supplierContact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierContactDeleteManyArgs>(args?: SelectSubset<T, SupplierContactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierContacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierContacts
     * const supplierContact = await prisma.supplierContact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierContactUpdateManyArgs>(args: SelectSubset<T, SupplierContactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierContacts and returns the data updated in the database.
     * @param {SupplierContactUpdateManyAndReturnArgs} args - Arguments to update many SupplierContacts.
     * @example
     * // Update many SupplierContacts
     * const supplierContact = await prisma.supplierContact.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierContacts and only return the `id`
     * const supplierContactWithIdOnly = await prisma.supplierContact.updateManyAndReturn({
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
    updateManyAndReturn<T extends SupplierContactUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierContactUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierContact.
     * @param {SupplierContactUpsertArgs} args - Arguments to update or create a SupplierContact.
     * @example
     * // Update or create a SupplierContact
     * const supplierContact = await prisma.supplierContact.upsert({
     *   create: {
     *     // ... data to create a SupplierContact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierContact we want to update
     *   }
     * })
     */
    upsert<T extends SupplierContactUpsertArgs>(args: SelectSubset<T, SupplierContactUpsertArgs<ExtArgs>>): Prisma__SupplierContactClient<$Result.GetResult<Prisma.$SupplierContactPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierContacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactCountArgs} args - Arguments to filter SupplierContacts to count.
     * @example
     * // Count the number of SupplierContacts
     * const count = await prisma.supplierContact.count({
     *   where: {
     *     // ... the filter for the SupplierContacts we want to count
     *   }
     * })
    **/
    count<T extends SupplierContactCountArgs>(
      args?: Subset<T, SupplierContactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierContactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierContact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SupplierContactAggregateArgs>(args: Subset<T, SupplierContactAggregateArgs>): Prisma.PrismaPromise<GetSupplierContactAggregateType<T>>

    /**
     * Group by SupplierContact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierContactGroupByArgs} args - Group by arguments.
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
      T extends SupplierContactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierContactGroupByArgs['orderBy'] }
        : { orderBy?: SupplierContactGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SupplierContactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierContactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierContact model
   */
  readonly fields: SupplierContactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierContact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierContactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    supplierProfile<T extends SupplierProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfileDefaultArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the SupplierContact model
   */ 
  interface SupplierContactFieldRefs {
    readonly id: FieldRef<"SupplierContact", 'String'>
    readonly tenantId: FieldRef<"SupplierContact", 'String'>
    readonly supplierId: FieldRef<"SupplierContact", 'String'>
    readonly displayName: FieldRef<"SupplierContact", 'String'>
    readonly roleTitle: FieldRef<"SupplierContact", 'String'>
    readonly email: FieldRef<"SupplierContact", 'String'>
    readonly phone: FieldRef<"SupplierContact", 'String'>
    readonly isPrimaryContact: FieldRef<"SupplierContact", 'Boolean'>
    readonly isActive: FieldRef<"SupplierContact", 'Boolean'>
    readonly createdAt: FieldRef<"SupplierContact", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierContact", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierContact findUnique
   */
  export type SupplierContactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter, which SupplierContact to fetch.
     */
    where: SupplierContactWhereUniqueInput
  }

  /**
   * SupplierContact findUniqueOrThrow
   */
  export type SupplierContactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter, which SupplierContact to fetch.
     */
    where: SupplierContactWhereUniqueInput
  }

  /**
   * SupplierContact findFirst
   */
  export type SupplierContactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter, which SupplierContact to fetch.
     */
    where?: SupplierContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierContacts to fetch.
     */
    orderBy?: SupplierContactOrderByWithRelationInput | SupplierContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierContacts.
     */
    cursor?: SupplierContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierContacts.
     */
    distinct?: SupplierContactScalarFieldEnum | SupplierContactScalarFieldEnum[]
  }

  /**
   * SupplierContact findFirstOrThrow
   */
  export type SupplierContactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter, which SupplierContact to fetch.
     */
    where?: SupplierContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierContacts to fetch.
     */
    orderBy?: SupplierContactOrderByWithRelationInput | SupplierContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierContacts.
     */
    cursor?: SupplierContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierContacts.
     */
    distinct?: SupplierContactScalarFieldEnum | SupplierContactScalarFieldEnum[]
  }

  /**
   * SupplierContact findMany
   */
  export type SupplierContactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter, which SupplierContacts to fetch.
     */
    where?: SupplierContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierContacts to fetch.
     */
    orderBy?: SupplierContactOrderByWithRelationInput | SupplierContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierContacts.
     */
    cursor?: SupplierContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierContacts.
     */
    skip?: number
    distinct?: SupplierContactScalarFieldEnum | SupplierContactScalarFieldEnum[]
  }

  /**
   * SupplierContact create
   */
  export type SupplierContactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierContact.
     */
    data: XOR<SupplierContactCreateInput, SupplierContactUncheckedCreateInput>
  }

  /**
   * SupplierContact createMany
   */
  export type SupplierContactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierContacts.
     */
    data: SupplierContactCreateManyInput | SupplierContactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierContact createManyAndReturn
   */
  export type SupplierContactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierContacts.
     */
    data: SupplierContactCreateManyInput | SupplierContactCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierContact update
   */
  export type SupplierContactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierContact.
     */
    data: XOR<SupplierContactUpdateInput, SupplierContactUncheckedUpdateInput>
    /**
     * Choose, which SupplierContact to update.
     */
    where: SupplierContactWhereUniqueInput
  }

  /**
   * SupplierContact updateMany
   */
  export type SupplierContactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierContacts.
     */
    data: XOR<SupplierContactUpdateManyMutationInput, SupplierContactUncheckedUpdateManyInput>
    /**
     * Filter which SupplierContacts to update
     */
    where?: SupplierContactWhereInput
    /**
     * Limit how many SupplierContacts to update.
     */
    limit?: number
  }

  /**
   * SupplierContact updateManyAndReturn
   */
  export type SupplierContactUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * The data used to update SupplierContacts.
     */
    data: XOR<SupplierContactUpdateManyMutationInput, SupplierContactUncheckedUpdateManyInput>
    /**
     * Filter which SupplierContacts to update
     */
    where?: SupplierContactWhereInput
    /**
     * Limit how many SupplierContacts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierContact upsert
   */
  export type SupplierContactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierContact to update in case it exists.
     */
    where: SupplierContactWhereUniqueInput
    /**
     * In case the SupplierContact found by the `where` argument doesn't exist, create a new SupplierContact with this data.
     */
    create: XOR<SupplierContactCreateInput, SupplierContactUncheckedCreateInput>
    /**
     * In case the SupplierContact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierContactUpdateInput, SupplierContactUncheckedUpdateInput>
  }

  /**
   * SupplierContact delete
   */
  export type SupplierContactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
    /**
     * Filter which SupplierContact to delete.
     */
    where: SupplierContactWhereUniqueInput
  }

  /**
   * SupplierContact deleteMany
   */
  export type SupplierContactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierContacts to delete
     */
    where?: SupplierContactWhereInput
    /**
     * Limit how many SupplierContacts to delete.
     */
    limit?: number
  }

  /**
   * SupplierContact without action
   */
  export type SupplierContactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierContact
     */
    select?: SupplierContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierContact
     */
    omit?: SupplierContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierContactInclude<ExtArgs> | null
  }


  /**
   * Model SupplierAddress
   */

  export type AggregateSupplierAddress = {
    _count: SupplierAddressCountAggregateOutputType | null
    _min: SupplierAddressMinAggregateOutputType | null
    _max: SupplierAddressMaxAggregateOutputType | null
  }

  export type SupplierAddressMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    label: string | null
    countryCode: string | null
    region: string | null
    locality: string | null
    addressLine1: string | null
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierAddressMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    label: string | null
    countryCode: string | null
    region: string | null
    locality: string | null
    addressLine1: string | null
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierAddressCountAggregateOutputType = {
    id: number
    tenantId: number
    supplierId: number
    label: number
    countryCode: number
    region: number
    locality: number
    addressLine1: number
    addressLine2: number
    postalCode: number
    isPrimaryAddress: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierAddressMinAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierAddressMaxAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierAddressCountAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierAddressAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierAddress to aggregate.
     */
    where?: SupplierAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierAddresses to fetch.
     */
    orderBy?: SupplierAddressOrderByWithRelationInput | SupplierAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierAddresses
    **/
    _count?: true | SupplierAddressCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierAddressMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierAddressMaxAggregateInputType
  }

  export type GetSupplierAddressAggregateType<T extends SupplierAddressAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierAddress]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierAddress[P]>
      : GetScalarType<T[P], AggregateSupplierAddress[P]>
  }




  export type SupplierAddressGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierAddressWhereInput
    orderBy?: SupplierAddressOrderByWithAggregationInput | SupplierAddressOrderByWithAggregationInput[]
    by: SupplierAddressScalarFieldEnum[] | SupplierAddressScalarFieldEnum
    having?: SupplierAddressScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierAddressCountAggregateInputType | true
    _min?: SupplierAddressMinAggregateInputType
    _max?: SupplierAddressMaxAggregateInputType
  }

  export type SupplierAddressGroupByOutputType = {
    id: string
    tenantId: string
    supplierId: string
    label: string
    countryCode: string
    region: string | null
    locality: string | null
    addressLine1: string
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: SupplierAddressCountAggregateOutputType | null
    _min: SupplierAddressMinAggregateOutputType | null
    _max: SupplierAddressMaxAggregateOutputType | null
  }

  type GetSupplierAddressGroupByPayload<T extends SupplierAddressGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierAddressGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierAddressGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierAddressGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierAddressGroupByOutputType[P]>
        }
      >
    >


  export type SupplierAddressSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierAddress"]>

  export type SupplierAddressSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierAddress"]>

  export type SupplierAddressSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierAddress"]>

  export type SupplierAddressSelectScalar = {
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierAddressOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "supplierId" | "label" | "countryCode" | "region" | "locality" | "addressLine1" | "addressLine2" | "postalCode" | "isPrimaryAddress" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierAddress"]>
  export type SupplierAddressInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierAddressIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierAddressIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }

  export type $SupplierAddressPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierAddress"
    objects: {
      supplierProfile: Prisma.$SupplierProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      supplierId: string
      label: string
      countryCode: string
      region: string | null
      locality: string | null
      addressLine1: string
      addressLine2: string | null
      postalCode: string | null
      isPrimaryAddress: boolean
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierAddress"]>
    composites: {}
  }

  type SupplierAddressGetPayload<S extends boolean | null | undefined | SupplierAddressDefaultArgs> = $Result.GetResult<Prisma.$SupplierAddressPayload, S>

  type SupplierAddressCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierAddressFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierAddressCountAggregateInputType | true
    }

  export interface SupplierAddressDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierAddress'], meta: { name: 'SupplierAddress' } }
    /**
     * Find zero or one SupplierAddress that matches the filter.
     * @param {SupplierAddressFindUniqueArgs} args - Arguments to find a SupplierAddress
     * @example
     * // Get one SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierAddressFindUniqueArgs>(args: SelectSubset<T, SupplierAddressFindUniqueArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierAddress that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierAddressFindUniqueOrThrowArgs} args - Arguments to find a SupplierAddress
     * @example
     * // Get one SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierAddressFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierAddressFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierAddress that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressFindFirstArgs} args - Arguments to find a SupplierAddress
     * @example
     * // Get one SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierAddressFindFirstArgs>(args?: SelectSubset<T, SupplierAddressFindFirstArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierAddress that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressFindFirstOrThrowArgs} args - Arguments to find a SupplierAddress
     * @example
     * // Get one SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierAddressFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierAddressFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierAddresses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierAddresses
     * const supplierAddresses = await prisma.supplierAddress.findMany()
     * 
     * // Get first 10 SupplierAddresses
     * const supplierAddresses = await prisma.supplierAddress.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierAddressWithIdOnly = await prisma.supplierAddress.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierAddressFindManyArgs>(args?: SelectSubset<T, SupplierAddressFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierAddress.
     * @param {SupplierAddressCreateArgs} args - Arguments to create a SupplierAddress.
     * @example
     * // Create one SupplierAddress
     * const SupplierAddress = await prisma.supplierAddress.create({
     *   data: {
     *     // ... data to create a SupplierAddress
     *   }
     * })
     * 
     */
    create<T extends SupplierAddressCreateArgs>(args: SelectSubset<T, SupplierAddressCreateArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierAddresses.
     * @param {SupplierAddressCreateManyArgs} args - Arguments to create many SupplierAddresses.
     * @example
     * // Create many SupplierAddresses
     * const supplierAddress = await prisma.supplierAddress.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierAddressCreateManyArgs>(args?: SelectSubset<T, SupplierAddressCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierAddresses and returns the data saved in the database.
     * @param {SupplierAddressCreateManyAndReturnArgs} args - Arguments to create many SupplierAddresses.
     * @example
     * // Create many SupplierAddresses
     * const supplierAddress = await prisma.supplierAddress.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierAddresses and only return the `id`
     * const supplierAddressWithIdOnly = await prisma.supplierAddress.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierAddressCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierAddressCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierAddress.
     * @param {SupplierAddressDeleteArgs} args - Arguments to delete one SupplierAddress.
     * @example
     * // Delete one SupplierAddress
     * const SupplierAddress = await prisma.supplierAddress.delete({
     *   where: {
     *     // ... filter to delete one SupplierAddress
     *   }
     * })
     * 
     */
    delete<T extends SupplierAddressDeleteArgs>(args: SelectSubset<T, SupplierAddressDeleteArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierAddress.
     * @param {SupplierAddressUpdateArgs} args - Arguments to update one SupplierAddress.
     * @example
     * // Update one SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierAddressUpdateArgs>(args: SelectSubset<T, SupplierAddressUpdateArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierAddresses.
     * @param {SupplierAddressDeleteManyArgs} args - Arguments to filter SupplierAddresses to delete.
     * @example
     * // Delete a few SupplierAddresses
     * const { count } = await prisma.supplierAddress.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierAddressDeleteManyArgs>(args?: SelectSubset<T, SupplierAddressDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierAddresses
     * const supplierAddress = await prisma.supplierAddress.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierAddressUpdateManyArgs>(args: SelectSubset<T, SupplierAddressUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierAddresses and returns the data updated in the database.
     * @param {SupplierAddressUpdateManyAndReturnArgs} args - Arguments to update many SupplierAddresses.
     * @example
     * // Update many SupplierAddresses
     * const supplierAddress = await prisma.supplierAddress.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierAddresses and only return the `id`
     * const supplierAddressWithIdOnly = await prisma.supplierAddress.updateManyAndReturn({
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
    updateManyAndReturn<T extends SupplierAddressUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierAddressUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierAddress.
     * @param {SupplierAddressUpsertArgs} args - Arguments to update or create a SupplierAddress.
     * @example
     * // Update or create a SupplierAddress
     * const supplierAddress = await prisma.supplierAddress.upsert({
     *   create: {
     *     // ... data to create a SupplierAddress
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierAddress we want to update
     *   }
     * })
     */
    upsert<T extends SupplierAddressUpsertArgs>(args: SelectSubset<T, SupplierAddressUpsertArgs<ExtArgs>>): Prisma__SupplierAddressClient<$Result.GetResult<Prisma.$SupplierAddressPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressCountArgs} args - Arguments to filter SupplierAddresses to count.
     * @example
     * // Count the number of SupplierAddresses
     * const count = await prisma.supplierAddress.count({
     *   where: {
     *     // ... the filter for the SupplierAddresses we want to count
     *   }
     * })
    **/
    count<T extends SupplierAddressCountArgs>(
      args?: Subset<T, SupplierAddressCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierAddressCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SupplierAddressAggregateArgs>(args: Subset<T, SupplierAddressAggregateArgs>): Prisma.PrismaPromise<GetSupplierAddressAggregateType<T>>

    /**
     * Group by SupplierAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierAddressGroupByArgs} args - Group by arguments.
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
      T extends SupplierAddressGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierAddressGroupByArgs['orderBy'] }
        : { orderBy?: SupplierAddressGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SupplierAddressGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierAddressGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierAddress model
   */
  readonly fields: SupplierAddressFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierAddress.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierAddressClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    supplierProfile<T extends SupplierProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfileDefaultArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the SupplierAddress model
   */ 
  interface SupplierAddressFieldRefs {
    readonly id: FieldRef<"SupplierAddress", 'String'>
    readonly tenantId: FieldRef<"SupplierAddress", 'String'>
    readonly supplierId: FieldRef<"SupplierAddress", 'String'>
    readonly label: FieldRef<"SupplierAddress", 'String'>
    readonly countryCode: FieldRef<"SupplierAddress", 'String'>
    readonly region: FieldRef<"SupplierAddress", 'String'>
    readonly locality: FieldRef<"SupplierAddress", 'String'>
    readonly addressLine1: FieldRef<"SupplierAddress", 'String'>
    readonly addressLine2: FieldRef<"SupplierAddress", 'String'>
    readonly postalCode: FieldRef<"SupplierAddress", 'String'>
    readonly isPrimaryAddress: FieldRef<"SupplierAddress", 'Boolean'>
    readonly isActive: FieldRef<"SupplierAddress", 'Boolean'>
    readonly createdAt: FieldRef<"SupplierAddress", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierAddress", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierAddress findUnique
   */
  export type SupplierAddressFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter, which SupplierAddress to fetch.
     */
    where: SupplierAddressWhereUniqueInput
  }

  /**
   * SupplierAddress findUniqueOrThrow
   */
  export type SupplierAddressFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter, which SupplierAddress to fetch.
     */
    where: SupplierAddressWhereUniqueInput
  }

  /**
   * SupplierAddress findFirst
   */
  export type SupplierAddressFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter, which SupplierAddress to fetch.
     */
    where?: SupplierAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierAddresses to fetch.
     */
    orderBy?: SupplierAddressOrderByWithRelationInput | SupplierAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierAddresses.
     */
    cursor?: SupplierAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierAddresses.
     */
    distinct?: SupplierAddressScalarFieldEnum | SupplierAddressScalarFieldEnum[]
  }

  /**
   * SupplierAddress findFirstOrThrow
   */
  export type SupplierAddressFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter, which SupplierAddress to fetch.
     */
    where?: SupplierAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierAddresses to fetch.
     */
    orderBy?: SupplierAddressOrderByWithRelationInput | SupplierAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierAddresses.
     */
    cursor?: SupplierAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierAddresses.
     */
    distinct?: SupplierAddressScalarFieldEnum | SupplierAddressScalarFieldEnum[]
  }

  /**
   * SupplierAddress findMany
   */
  export type SupplierAddressFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter, which SupplierAddresses to fetch.
     */
    where?: SupplierAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierAddresses to fetch.
     */
    orderBy?: SupplierAddressOrderByWithRelationInput | SupplierAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierAddresses.
     */
    cursor?: SupplierAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierAddresses.
     */
    skip?: number
    distinct?: SupplierAddressScalarFieldEnum | SupplierAddressScalarFieldEnum[]
  }

  /**
   * SupplierAddress create
   */
  export type SupplierAddressCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierAddress.
     */
    data: XOR<SupplierAddressCreateInput, SupplierAddressUncheckedCreateInput>
  }

  /**
   * SupplierAddress createMany
   */
  export type SupplierAddressCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierAddresses.
     */
    data: SupplierAddressCreateManyInput | SupplierAddressCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierAddress createManyAndReturn
   */
  export type SupplierAddressCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierAddresses.
     */
    data: SupplierAddressCreateManyInput | SupplierAddressCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierAddress update
   */
  export type SupplierAddressUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierAddress.
     */
    data: XOR<SupplierAddressUpdateInput, SupplierAddressUncheckedUpdateInput>
    /**
     * Choose, which SupplierAddress to update.
     */
    where: SupplierAddressWhereUniqueInput
  }

  /**
   * SupplierAddress updateMany
   */
  export type SupplierAddressUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierAddresses.
     */
    data: XOR<SupplierAddressUpdateManyMutationInput, SupplierAddressUncheckedUpdateManyInput>
    /**
     * Filter which SupplierAddresses to update
     */
    where?: SupplierAddressWhereInput
    /**
     * Limit how many SupplierAddresses to update.
     */
    limit?: number
  }

  /**
   * SupplierAddress updateManyAndReturn
   */
  export type SupplierAddressUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * The data used to update SupplierAddresses.
     */
    data: XOR<SupplierAddressUpdateManyMutationInput, SupplierAddressUncheckedUpdateManyInput>
    /**
     * Filter which SupplierAddresses to update
     */
    where?: SupplierAddressWhereInput
    /**
     * Limit how many SupplierAddresses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierAddress upsert
   */
  export type SupplierAddressUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierAddress to update in case it exists.
     */
    where: SupplierAddressWhereUniqueInput
    /**
     * In case the SupplierAddress found by the `where` argument doesn't exist, create a new SupplierAddress with this data.
     */
    create: XOR<SupplierAddressCreateInput, SupplierAddressUncheckedCreateInput>
    /**
     * In case the SupplierAddress was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierAddressUpdateInput, SupplierAddressUncheckedUpdateInput>
  }

  /**
   * SupplierAddress delete
   */
  export type SupplierAddressDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
    /**
     * Filter which SupplierAddress to delete.
     */
    where: SupplierAddressWhereUniqueInput
  }

  /**
   * SupplierAddress deleteMany
   */
  export type SupplierAddressDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierAddresses to delete
     */
    where?: SupplierAddressWhereInput
    /**
     * Limit how many SupplierAddresses to delete.
     */
    limit?: number
  }

  /**
   * SupplierAddress without action
   */
  export type SupplierAddressDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierAddress
     */
    select?: SupplierAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierAddress
     */
    omit?: SupplierAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierAddressInclude<ExtArgs> | null
  }


  /**
   * Model SupplierOffering
   */

  export type AggregateSupplierOffering = {
    _count: SupplierOfferingCountAggregateOutputType | null
    _min: SupplierOfferingMinAggregateOutputType | null
    _max: SupplierOfferingMaxAggregateOutputType | null
  }

  export type SupplierOfferingMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    status: $Enums.SrmSupplierOfferingStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierOfferingMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    itemId: string | null
    itemCode: string | null
    itemName: string | null
    status: $Enums.SrmSupplierOfferingStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierOfferingCountAggregateOutputType = {
    id: number
    tenantId: number
    supplierId: number
    itemId: number
    itemCode: number
    itemName: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierOfferingMinAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierOfferingMaxAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierOfferingCountAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    itemId?: true
    itemCode?: true
    itemName?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierOfferingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierOffering to aggregate.
     */
    where?: SupplierOfferingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierOfferings to fetch.
     */
    orderBy?: SupplierOfferingOrderByWithRelationInput | SupplierOfferingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierOfferingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierOfferings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierOfferings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierOfferings
    **/
    _count?: true | SupplierOfferingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierOfferingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierOfferingMaxAggregateInputType
  }

  export type GetSupplierOfferingAggregateType<T extends SupplierOfferingAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierOffering]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierOffering[P]>
      : GetScalarType<T[P], AggregateSupplierOffering[P]>
  }




  export type SupplierOfferingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierOfferingWhereInput
    orderBy?: SupplierOfferingOrderByWithAggregationInput | SupplierOfferingOrderByWithAggregationInput[]
    by: SupplierOfferingScalarFieldEnum[] | SupplierOfferingScalarFieldEnum
    having?: SupplierOfferingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierOfferingCountAggregateInputType | true
    _min?: SupplierOfferingMinAggregateInputType
    _max?: SupplierOfferingMaxAggregateInputType
  }

  export type SupplierOfferingGroupByOutputType = {
    id: string
    tenantId: string
    supplierId: string
    itemId: string
    itemCode: string | null
    itemName: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt: Date
    updatedAt: Date
    _count: SupplierOfferingCountAggregateOutputType | null
    _min: SupplierOfferingMinAggregateOutputType | null
    _max: SupplierOfferingMaxAggregateOutputType | null
  }

  type GetSupplierOfferingGroupByPayload<T extends SupplierOfferingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierOfferingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierOfferingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierOfferingGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierOfferingGroupByOutputType[P]>
        }
      >
    >


  export type SupplierOfferingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierOffering"]>

  export type SupplierOfferingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierOffering"]>

  export type SupplierOfferingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierOffering"]>

  export type SupplierOfferingSelectScalar = {
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    itemId?: boolean
    itemCode?: boolean
    itemName?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierOfferingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "supplierId" | "itemId" | "itemCode" | "itemName" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierOffering"]>
  export type SupplierOfferingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierOfferingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }
  export type SupplierOfferingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    supplierProfile?: boolean | SupplierProfileDefaultArgs<ExtArgs>
  }

  export type $SupplierOfferingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierOffering"
    objects: {
      supplierProfile: Prisma.$SupplierProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      supplierId: string
      itemId: string
      itemCode: string | null
      itemName: string | null
      status: $Enums.SrmSupplierOfferingStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierOffering"]>
    composites: {}
  }

  type SupplierOfferingGetPayload<S extends boolean | null | undefined | SupplierOfferingDefaultArgs> = $Result.GetResult<Prisma.$SupplierOfferingPayload, S>

  type SupplierOfferingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierOfferingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierOfferingCountAggregateInputType | true
    }

  export interface SupplierOfferingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierOffering'], meta: { name: 'SupplierOffering' } }
    /**
     * Find zero or one SupplierOffering that matches the filter.
     * @param {SupplierOfferingFindUniqueArgs} args - Arguments to find a SupplierOffering
     * @example
     * // Get one SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierOfferingFindUniqueArgs>(args: SelectSubset<T, SupplierOfferingFindUniqueArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierOffering that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierOfferingFindUniqueOrThrowArgs} args - Arguments to find a SupplierOffering
     * @example
     * // Get one SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierOfferingFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierOfferingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierOffering that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingFindFirstArgs} args - Arguments to find a SupplierOffering
     * @example
     * // Get one SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierOfferingFindFirstArgs>(args?: SelectSubset<T, SupplierOfferingFindFirstArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierOffering that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingFindFirstOrThrowArgs} args - Arguments to find a SupplierOffering
     * @example
     * // Get one SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierOfferingFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierOfferingFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierOfferings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierOfferings
     * const supplierOfferings = await prisma.supplierOffering.findMany()
     * 
     * // Get first 10 SupplierOfferings
     * const supplierOfferings = await prisma.supplierOffering.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierOfferingWithIdOnly = await prisma.supplierOffering.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierOfferingFindManyArgs>(args?: SelectSubset<T, SupplierOfferingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierOffering.
     * @param {SupplierOfferingCreateArgs} args - Arguments to create a SupplierOffering.
     * @example
     * // Create one SupplierOffering
     * const SupplierOffering = await prisma.supplierOffering.create({
     *   data: {
     *     // ... data to create a SupplierOffering
     *   }
     * })
     * 
     */
    create<T extends SupplierOfferingCreateArgs>(args: SelectSubset<T, SupplierOfferingCreateArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierOfferings.
     * @param {SupplierOfferingCreateManyArgs} args - Arguments to create many SupplierOfferings.
     * @example
     * // Create many SupplierOfferings
     * const supplierOffering = await prisma.supplierOffering.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierOfferingCreateManyArgs>(args?: SelectSubset<T, SupplierOfferingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierOfferings and returns the data saved in the database.
     * @param {SupplierOfferingCreateManyAndReturnArgs} args - Arguments to create many SupplierOfferings.
     * @example
     * // Create many SupplierOfferings
     * const supplierOffering = await prisma.supplierOffering.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierOfferings and only return the `id`
     * const supplierOfferingWithIdOnly = await prisma.supplierOffering.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierOfferingCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierOfferingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierOffering.
     * @param {SupplierOfferingDeleteArgs} args - Arguments to delete one SupplierOffering.
     * @example
     * // Delete one SupplierOffering
     * const SupplierOffering = await prisma.supplierOffering.delete({
     *   where: {
     *     // ... filter to delete one SupplierOffering
     *   }
     * })
     * 
     */
    delete<T extends SupplierOfferingDeleteArgs>(args: SelectSubset<T, SupplierOfferingDeleteArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierOffering.
     * @param {SupplierOfferingUpdateArgs} args - Arguments to update one SupplierOffering.
     * @example
     * // Update one SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierOfferingUpdateArgs>(args: SelectSubset<T, SupplierOfferingUpdateArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierOfferings.
     * @param {SupplierOfferingDeleteManyArgs} args - Arguments to filter SupplierOfferings to delete.
     * @example
     * // Delete a few SupplierOfferings
     * const { count } = await prisma.supplierOffering.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierOfferingDeleteManyArgs>(args?: SelectSubset<T, SupplierOfferingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierOfferings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierOfferings
     * const supplierOffering = await prisma.supplierOffering.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierOfferingUpdateManyArgs>(args: SelectSubset<T, SupplierOfferingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierOfferings and returns the data updated in the database.
     * @param {SupplierOfferingUpdateManyAndReturnArgs} args - Arguments to update many SupplierOfferings.
     * @example
     * // Update many SupplierOfferings
     * const supplierOffering = await prisma.supplierOffering.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierOfferings and only return the `id`
     * const supplierOfferingWithIdOnly = await prisma.supplierOffering.updateManyAndReturn({
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
    updateManyAndReturn<T extends SupplierOfferingUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierOfferingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierOffering.
     * @param {SupplierOfferingUpsertArgs} args - Arguments to update or create a SupplierOffering.
     * @example
     * // Update or create a SupplierOffering
     * const supplierOffering = await prisma.supplierOffering.upsert({
     *   create: {
     *     // ... data to create a SupplierOffering
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierOffering we want to update
     *   }
     * })
     */
    upsert<T extends SupplierOfferingUpsertArgs>(args: SelectSubset<T, SupplierOfferingUpsertArgs<ExtArgs>>): Prisma__SupplierOfferingClient<$Result.GetResult<Prisma.$SupplierOfferingPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierOfferings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingCountArgs} args - Arguments to filter SupplierOfferings to count.
     * @example
     * // Count the number of SupplierOfferings
     * const count = await prisma.supplierOffering.count({
     *   where: {
     *     // ... the filter for the SupplierOfferings we want to count
     *   }
     * })
    **/
    count<T extends SupplierOfferingCountArgs>(
      args?: Subset<T, SupplierOfferingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierOfferingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierOffering.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SupplierOfferingAggregateArgs>(args: Subset<T, SupplierOfferingAggregateArgs>): Prisma.PrismaPromise<GetSupplierOfferingAggregateType<T>>

    /**
     * Group by SupplierOffering.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierOfferingGroupByArgs} args - Group by arguments.
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
      T extends SupplierOfferingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierOfferingGroupByArgs['orderBy'] }
        : { orderBy?: SupplierOfferingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SupplierOfferingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierOfferingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierOffering model
   */
  readonly fields: SupplierOfferingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierOffering.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierOfferingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    supplierProfile<T extends SupplierProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SupplierProfileDefaultArgs<ExtArgs>>): Prisma__SupplierProfileClient<$Result.GetResult<Prisma.$SupplierProfilePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the SupplierOffering model
   */ 
  interface SupplierOfferingFieldRefs {
    readonly id: FieldRef<"SupplierOffering", 'String'>
    readonly tenantId: FieldRef<"SupplierOffering", 'String'>
    readonly supplierId: FieldRef<"SupplierOffering", 'String'>
    readonly itemId: FieldRef<"SupplierOffering", 'String'>
    readonly itemCode: FieldRef<"SupplierOffering", 'String'>
    readonly itemName: FieldRef<"SupplierOffering", 'String'>
    readonly status: FieldRef<"SupplierOffering", 'SrmSupplierOfferingStatus'>
    readonly createdAt: FieldRef<"SupplierOffering", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierOffering", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierOffering findUnique
   */
  export type SupplierOfferingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierOffering to fetch.
     */
    where: SupplierOfferingWhereUniqueInput
  }

  /**
   * SupplierOffering findUniqueOrThrow
   */
  export type SupplierOfferingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierOffering to fetch.
     */
    where: SupplierOfferingWhereUniqueInput
  }

  /**
   * SupplierOffering findFirst
   */
  export type SupplierOfferingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierOffering to fetch.
     */
    where?: SupplierOfferingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierOfferings to fetch.
     */
    orderBy?: SupplierOfferingOrderByWithRelationInput | SupplierOfferingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierOfferings.
     */
    cursor?: SupplierOfferingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierOfferings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierOfferings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierOfferings.
     */
    distinct?: SupplierOfferingScalarFieldEnum | SupplierOfferingScalarFieldEnum[]
  }

  /**
   * SupplierOffering findFirstOrThrow
   */
  export type SupplierOfferingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierOffering to fetch.
     */
    where?: SupplierOfferingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierOfferings to fetch.
     */
    orderBy?: SupplierOfferingOrderByWithRelationInput | SupplierOfferingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierOfferings.
     */
    cursor?: SupplierOfferingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierOfferings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierOfferings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierOfferings.
     */
    distinct?: SupplierOfferingScalarFieldEnum | SupplierOfferingScalarFieldEnum[]
  }

  /**
   * SupplierOffering findMany
   */
  export type SupplierOfferingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierOfferings to fetch.
     */
    where?: SupplierOfferingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierOfferings to fetch.
     */
    orderBy?: SupplierOfferingOrderByWithRelationInput | SupplierOfferingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierOfferings.
     */
    cursor?: SupplierOfferingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierOfferings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierOfferings.
     */
    skip?: number
    distinct?: SupplierOfferingScalarFieldEnum | SupplierOfferingScalarFieldEnum[]
  }

  /**
   * SupplierOffering create
   */
  export type SupplierOfferingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierOffering.
     */
    data: XOR<SupplierOfferingCreateInput, SupplierOfferingUncheckedCreateInput>
  }

  /**
   * SupplierOffering createMany
   */
  export type SupplierOfferingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierOfferings.
     */
    data: SupplierOfferingCreateManyInput | SupplierOfferingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierOffering createManyAndReturn
   */
  export type SupplierOfferingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierOfferings.
     */
    data: SupplierOfferingCreateManyInput | SupplierOfferingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierOffering update
   */
  export type SupplierOfferingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierOffering.
     */
    data: XOR<SupplierOfferingUpdateInput, SupplierOfferingUncheckedUpdateInput>
    /**
     * Choose, which SupplierOffering to update.
     */
    where: SupplierOfferingWhereUniqueInput
  }

  /**
   * SupplierOffering updateMany
   */
  export type SupplierOfferingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierOfferings.
     */
    data: XOR<SupplierOfferingUpdateManyMutationInput, SupplierOfferingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierOfferings to update
     */
    where?: SupplierOfferingWhereInput
    /**
     * Limit how many SupplierOfferings to update.
     */
    limit?: number
  }

  /**
   * SupplierOffering updateManyAndReturn
   */
  export type SupplierOfferingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * The data used to update SupplierOfferings.
     */
    data: XOR<SupplierOfferingUpdateManyMutationInput, SupplierOfferingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierOfferings to update
     */
    where?: SupplierOfferingWhereInput
    /**
     * Limit how many SupplierOfferings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierOffering upsert
   */
  export type SupplierOfferingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierOffering to update in case it exists.
     */
    where: SupplierOfferingWhereUniqueInput
    /**
     * In case the SupplierOffering found by the `where` argument doesn't exist, create a new SupplierOffering with this data.
     */
    create: XOR<SupplierOfferingCreateInput, SupplierOfferingUncheckedCreateInput>
    /**
     * In case the SupplierOffering was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierOfferingUpdateInput, SupplierOfferingUncheckedUpdateInput>
  }

  /**
   * SupplierOffering delete
   */
  export type SupplierOfferingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
    /**
     * Filter which SupplierOffering to delete.
     */
    where: SupplierOfferingWhereUniqueInput
  }

  /**
   * SupplierOffering deleteMany
   */
  export type SupplierOfferingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierOfferings to delete
     */
    where?: SupplierOfferingWhereInput
    /**
     * Limit how many SupplierOfferings to delete.
     */
    limit?: number
  }

  /**
   * SupplierOffering without action
   */
  export type SupplierOfferingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierOffering
     */
    select?: SupplierOfferingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierOffering
     */
    omit?: SupplierOfferingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierOfferingInclude<ExtArgs> | null
  }


  /**
   * Model SrmAuditEnvelope
   */

  export type AggregateSrmAuditEnvelope = {
    _count: SrmAuditEnvelopeCountAggregateOutputType | null
    _min: SrmAuditEnvelopeMinAggregateOutputType | null
    _max: SrmAuditEnvelopeMaxAggregateOutputType | null
  }

  export type SrmAuditEnvelopeMinAggregateOutputType = {
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

  export type SrmAuditEnvelopeMaxAggregateOutputType = {
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

  export type SrmAuditEnvelopeCountAggregateOutputType = {
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


  export type SrmAuditEnvelopeMinAggregateInputType = {
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

  export type SrmAuditEnvelopeMaxAggregateInputType = {
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

  export type SrmAuditEnvelopeCountAggregateInputType = {
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

  export type SrmAuditEnvelopeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SrmAuditEnvelope to aggregate.
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmAuditEnvelopes to fetch.
     */
    orderBy?: SrmAuditEnvelopeOrderByWithRelationInput | SrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SrmAuditEnvelopes
    **/
    _count?: true | SrmAuditEnvelopeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SrmAuditEnvelopeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SrmAuditEnvelopeMaxAggregateInputType
  }

  export type GetSrmAuditEnvelopeAggregateType<T extends SrmAuditEnvelopeAggregateArgs> = {
        [P in keyof T & keyof AggregateSrmAuditEnvelope]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSrmAuditEnvelope[P]>
      : GetScalarType<T[P], AggregateSrmAuditEnvelope[P]>
  }




  export type SrmAuditEnvelopeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SrmAuditEnvelopeWhereInput
    orderBy?: SrmAuditEnvelopeOrderByWithAggregationInput | SrmAuditEnvelopeOrderByWithAggregationInput[]
    by: SrmAuditEnvelopeScalarFieldEnum[] | SrmAuditEnvelopeScalarFieldEnum
    having?: SrmAuditEnvelopeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SrmAuditEnvelopeCountAggregateInputType | true
    _min?: SrmAuditEnvelopeMinAggregateInputType
    _max?: SrmAuditEnvelopeMaxAggregateInputType
  }

  export type SrmAuditEnvelopeGroupByOutputType = {
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
    _count: SrmAuditEnvelopeCountAggregateOutputType | null
    _min: SrmAuditEnvelopeMinAggregateOutputType | null
    _max: SrmAuditEnvelopeMaxAggregateOutputType | null
  }

  type GetSrmAuditEnvelopeGroupByPayload<T extends SrmAuditEnvelopeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SrmAuditEnvelopeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SrmAuditEnvelopeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SrmAuditEnvelopeGroupByOutputType[P]>
            : GetScalarType<T[P], SrmAuditEnvelopeGroupByOutputType[P]>
        }
      >
    >


  export type SrmAuditEnvelopeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["srmAuditEnvelope"]>

  export type SrmAuditEnvelopeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["srmAuditEnvelope"]>

  export type SrmAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["srmAuditEnvelope"]>

  export type SrmAuditEnvelopeSelectScalar = {
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

  export type SrmAuditEnvelopeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["srmAuditEnvelope"]>

  export type $SrmAuditEnvelopePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SrmAuditEnvelope"
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
    }, ExtArgs["result"]["srmAuditEnvelope"]>
    composites: {}
  }

  type SrmAuditEnvelopeGetPayload<S extends boolean | null | undefined | SrmAuditEnvelopeDefaultArgs> = $Result.GetResult<Prisma.$SrmAuditEnvelopePayload, S>

  type SrmAuditEnvelopeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SrmAuditEnvelopeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SrmAuditEnvelopeCountAggregateInputType | true
    }

  export interface SrmAuditEnvelopeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SrmAuditEnvelope'], meta: { name: 'SrmAuditEnvelope' } }
    /**
     * Find zero or one SrmAuditEnvelope that matches the filter.
     * @param {SrmAuditEnvelopeFindUniqueArgs} args - Arguments to find a SrmAuditEnvelope
     * @example
     * // Get one SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SrmAuditEnvelopeFindUniqueArgs>(args: SelectSubset<T, SrmAuditEnvelopeFindUniqueArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SrmAuditEnvelope that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SrmAuditEnvelopeFindUniqueOrThrowArgs} args - Arguments to find a SrmAuditEnvelope
     * @example
     * // Get one SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SrmAuditEnvelopeFindUniqueOrThrowArgs>(args: SelectSubset<T, SrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SrmAuditEnvelope that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeFindFirstArgs} args - Arguments to find a SrmAuditEnvelope
     * @example
     * // Get one SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SrmAuditEnvelopeFindFirstArgs>(args?: SelectSubset<T, SrmAuditEnvelopeFindFirstArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SrmAuditEnvelope that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeFindFirstOrThrowArgs} args - Arguments to find a SrmAuditEnvelope
     * @example
     * // Get one SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SrmAuditEnvelopeFindFirstOrThrowArgs>(args?: SelectSubset<T, SrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SrmAuditEnvelopes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SrmAuditEnvelopes
     * const srmAuditEnvelopes = await prisma.srmAuditEnvelope.findMany()
     * 
     * // Get first 10 SrmAuditEnvelopes
     * const srmAuditEnvelopes = await prisma.srmAuditEnvelope.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const srmAuditEnvelopeWithIdOnly = await prisma.srmAuditEnvelope.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SrmAuditEnvelopeFindManyArgs>(args?: SelectSubset<T, SrmAuditEnvelopeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SrmAuditEnvelope.
     * @param {SrmAuditEnvelopeCreateArgs} args - Arguments to create a SrmAuditEnvelope.
     * @example
     * // Create one SrmAuditEnvelope
     * const SrmAuditEnvelope = await prisma.srmAuditEnvelope.create({
     *   data: {
     *     // ... data to create a SrmAuditEnvelope
     *   }
     * })
     * 
     */
    create<T extends SrmAuditEnvelopeCreateArgs>(args: SelectSubset<T, SrmAuditEnvelopeCreateArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SrmAuditEnvelopes.
     * @param {SrmAuditEnvelopeCreateManyArgs} args - Arguments to create many SrmAuditEnvelopes.
     * @example
     * // Create many SrmAuditEnvelopes
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SrmAuditEnvelopeCreateManyArgs>(args?: SelectSubset<T, SrmAuditEnvelopeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SrmAuditEnvelopes and returns the data saved in the database.
     * @param {SrmAuditEnvelopeCreateManyAndReturnArgs} args - Arguments to create many SrmAuditEnvelopes.
     * @example
     * // Create many SrmAuditEnvelopes
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SrmAuditEnvelopes and only return the `id`
     * const srmAuditEnvelopeWithIdOnly = await prisma.srmAuditEnvelope.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SrmAuditEnvelopeCreateManyAndReturnArgs>(args?: SelectSubset<T, SrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SrmAuditEnvelope.
     * @param {SrmAuditEnvelopeDeleteArgs} args - Arguments to delete one SrmAuditEnvelope.
     * @example
     * // Delete one SrmAuditEnvelope
     * const SrmAuditEnvelope = await prisma.srmAuditEnvelope.delete({
     *   where: {
     *     // ... filter to delete one SrmAuditEnvelope
     *   }
     * })
     * 
     */
    delete<T extends SrmAuditEnvelopeDeleteArgs>(args: SelectSubset<T, SrmAuditEnvelopeDeleteArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SrmAuditEnvelope.
     * @param {SrmAuditEnvelopeUpdateArgs} args - Arguments to update one SrmAuditEnvelope.
     * @example
     * // Update one SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SrmAuditEnvelopeUpdateArgs>(args: SelectSubset<T, SrmAuditEnvelopeUpdateArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SrmAuditEnvelopes.
     * @param {SrmAuditEnvelopeDeleteManyArgs} args - Arguments to filter SrmAuditEnvelopes to delete.
     * @example
     * // Delete a few SrmAuditEnvelopes
     * const { count } = await prisma.srmAuditEnvelope.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SrmAuditEnvelopeDeleteManyArgs>(args?: SelectSubset<T, SrmAuditEnvelopeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SrmAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SrmAuditEnvelopes
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SrmAuditEnvelopeUpdateManyArgs>(args: SelectSubset<T, SrmAuditEnvelopeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SrmAuditEnvelopes and returns the data updated in the database.
     * @param {SrmAuditEnvelopeUpdateManyAndReturnArgs} args - Arguments to update many SrmAuditEnvelopes.
     * @example
     * // Update many SrmAuditEnvelopes
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SrmAuditEnvelopes and only return the `id`
     * const srmAuditEnvelopeWithIdOnly = await prisma.srmAuditEnvelope.updateManyAndReturn({
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
    updateManyAndReturn<T extends SrmAuditEnvelopeUpdateManyAndReturnArgs>(args: SelectSubset<T, SrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SrmAuditEnvelope.
     * @param {SrmAuditEnvelopeUpsertArgs} args - Arguments to update or create a SrmAuditEnvelope.
     * @example
     * // Update or create a SrmAuditEnvelope
     * const srmAuditEnvelope = await prisma.srmAuditEnvelope.upsert({
     *   create: {
     *     // ... data to create a SrmAuditEnvelope
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SrmAuditEnvelope we want to update
     *   }
     * })
     */
    upsert<T extends SrmAuditEnvelopeUpsertArgs>(args: SelectSubset<T, SrmAuditEnvelopeUpsertArgs<ExtArgs>>): Prisma__SrmAuditEnvelopeClient<$Result.GetResult<Prisma.$SrmAuditEnvelopePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SrmAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeCountArgs} args - Arguments to filter SrmAuditEnvelopes to count.
     * @example
     * // Count the number of SrmAuditEnvelopes
     * const count = await prisma.srmAuditEnvelope.count({
     *   where: {
     *     // ... the filter for the SrmAuditEnvelopes we want to count
     *   }
     * })
    **/
    count<T extends SrmAuditEnvelopeCountArgs>(
      args?: Subset<T, SrmAuditEnvelopeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SrmAuditEnvelopeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SrmAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends SrmAuditEnvelopeAggregateArgs>(args: Subset<T, SrmAuditEnvelopeAggregateArgs>): Prisma.PrismaPromise<GetSrmAuditEnvelopeAggregateType<T>>

    /**
     * Group by SrmAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SrmAuditEnvelopeGroupByArgs} args - Group by arguments.
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
      T extends SrmAuditEnvelopeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SrmAuditEnvelopeGroupByArgs['orderBy'] }
        : { orderBy?: SrmAuditEnvelopeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, SrmAuditEnvelopeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSrmAuditEnvelopeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SrmAuditEnvelope model
   */
  readonly fields: SrmAuditEnvelopeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SrmAuditEnvelope.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SrmAuditEnvelopeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the SrmAuditEnvelope model
   */ 
  interface SrmAuditEnvelopeFieldRefs {
    readonly id: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly service: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly module: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly eventType: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly occurredAt: FieldRef<"SrmAuditEnvelope", 'DateTime'>
    readonly result: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly operatorId: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly operatorType: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly tenantId: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly orgId: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly traceId: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly resourceType: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly resourceId: FieldRef<"SrmAuditEnvelope", 'String'>
    readonly details: FieldRef<"SrmAuditEnvelope", 'Json'>
    readonly createdAt: FieldRef<"SrmAuditEnvelope", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SrmAuditEnvelope findUnique
   */
  export type SrmAuditEnvelopeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SrmAuditEnvelope to fetch.
     */
    where: SrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * SrmAuditEnvelope findUniqueOrThrow
   */
  export type SrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SrmAuditEnvelope to fetch.
     */
    where: SrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * SrmAuditEnvelope findFirst
   */
  export type SrmAuditEnvelopeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SrmAuditEnvelope to fetch.
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmAuditEnvelopes to fetch.
     */
    orderBy?: SrmAuditEnvelopeOrderByWithRelationInput | SrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SrmAuditEnvelopes.
     */
    cursor?: SrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SrmAuditEnvelopes.
     */
    distinct?: SrmAuditEnvelopeScalarFieldEnum | SrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SrmAuditEnvelope findFirstOrThrow
   */
  export type SrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SrmAuditEnvelope to fetch.
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmAuditEnvelopes to fetch.
     */
    orderBy?: SrmAuditEnvelopeOrderByWithRelationInput | SrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SrmAuditEnvelopes.
     */
    cursor?: SrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SrmAuditEnvelopes.
     */
    distinct?: SrmAuditEnvelopeScalarFieldEnum | SrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SrmAuditEnvelope findMany
   */
  export type SrmAuditEnvelopeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which SrmAuditEnvelopes to fetch.
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SrmAuditEnvelopes to fetch.
     */
    orderBy?: SrmAuditEnvelopeOrderByWithRelationInput | SrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SrmAuditEnvelopes.
     */
    cursor?: SrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SrmAuditEnvelopes.
     */
    skip?: number
    distinct?: SrmAuditEnvelopeScalarFieldEnum | SrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * SrmAuditEnvelope create
   */
  export type SrmAuditEnvelopeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to create a SrmAuditEnvelope.
     */
    data: XOR<SrmAuditEnvelopeCreateInput, SrmAuditEnvelopeUncheckedCreateInput>
  }

  /**
   * SrmAuditEnvelope createMany
   */
  export type SrmAuditEnvelopeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SrmAuditEnvelopes.
     */
    data: SrmAuditEnvelopeCreateManyInput | SrmAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SrmAuditEnvelope createManyAndReturn
   */
  export type SrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to create many SrmAuditEnvelopes.
     */
    data: SrmAuditEnvelopeCreateManyInput | SrmAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SrmAuditEnvelope update
   */
  export type SrmAuditEnvelopeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to update a SrmAuditEnvelope.
     */
    data: XOR<SrmAuditEnvelopeUpdateInput, SrmAuditEnvelopeUncheckedUpdateInput>
    /**
     * Choose, which SrmAuditEnvelope to update.
     */
    where: SrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * SrmAuditEnvelope updateMany
   */
  export type SrmAuditEnvelopeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SrmAuditEnvelopes.
     */
    data: XOR<SrmAuditEnvelopeUpdateManyMutationInput, SrmAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which SrmAuditEnvelopes to update
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * Limit how many SrmAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * SrmAuditEnvelope updateManyAndReturn
   */
  export type SrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to update SrmAuditEnvelopes.
     */
    data: XOR<SrmAuditEnvelopeUpdateManyMutationInput, SrmAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which SrmAuditEnvelopes to update
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * Limit how many SrmAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * SrmAuditEnvelope upsert
   */
  export type SrmAuditEnvelopeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The filter to search for the SrmAuditEnvelope to update in case it exists.
     */
    where: SrmAuditEnvelopeWhereUniqueInput
    /**
     * In case the SrmAuditEnvelope found by the `where` argument doesn't exist, create a new SrmAuditEnvelope with this data.
     */
    create: XOR<SrmAuditEnvelopeCreateInput, SrmAuditEnvelopeUncheckedCreateInput>
    /**
     * In case the SrmAuditEnvelope was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SrmAuditEnvelopeUpdateInput, SrmAuditEnvelopeUncheckedUpdateInput>
  }

  /**
   * SrmAuditEnvelope delete
   */
  export type SrmAuditEnvelopeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter which SrmAuditEnvelope to delete.
     */
    where: SrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * SrmAuditEnvelope deleteMany
   */
  export type SrmAuditEnvelopeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SrmAuditEnvelopes to delete
     */
    where?: SrmAuditEnvelopeWhereInput
    /**
     * Limit how many SrmAuditEnvelopes to delete.
     */
    limit?: number
  }

  /**
   * SrmAuditEnvelope without action
   */
  export type SrmAuditEnvelopeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SrmAuditEnvelope
     */
    select?: SrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SrmAuditEnvelope
     */
    omit?: SrmAuditEnvelopeOmit<ExtArgs> | null
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


  export const SrmSequenceCounterScalarFieldEnum: {
    tenantId: 'tenantId',
    nextSupplierProfileNo: 'nextSupplierProfileNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SrmSequenceCounterScalarFieldEnum = (typeof SrmSequenceCounterScalarFieldEnum)[keyof typeof SrmSequenceCounterScalarFieldEnum]


  export const SupplierProfileScalarFieldEnum: {
    id: 'id',
    supplierNo: 'supplierNo',
    tenantId: 'tenantId',
    displayName: 'displayName',
    status: 'status',
    supplierCategory: 'supplierCategory',
    tags: 'tags',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierProfileScalarFieldEnum = (typeof SupplierProfileScalarFieldEnum)[keyof typeof SupplierProfileScalarFieldEnum]


  export const SupplierPartyBindingScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    supplierId: 'supplierId',
    tenantPartyId: 'tenantPartyId',
    bindingStatus: 'bindingStatus',
    partyDisplayName: 'partyDisplayName',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierPartyBindingScalarFieldEnum = (typeof SupplierPartyBindingScalarFieldEnum)[keyof typeof SupplierPartyBindingScalarFieldEnum]


  export const SupplierContactScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    supplierId: 'supplierId',
    displayName: 'displayName',
    roleTitle: 'roleTitle',
    email: 'email',
    phone: 'phone',
    isPrimaryContact: 'isPrimaryContact',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierContactScalarFieldEnum = (typeof SupplierContactScalarFieldEnum)[keyof typeof SupplierContactScalarFieldEnum]


  export const SupplierAddressScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    supplierId: 'supplierId',
    label: 'label',
    countryCode: 'countryCode',
    region: 'region',
    locality: 'locality',
    addressLine1: 'addressLine1',
    addressLine2: 'addressLine2',
    postalCode: 'postalCode',
    isPrimaryAddress: 'isPrimaryAddress',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierAddressScalarFieldEnum = (typeof SupplierAddressScalarFieldEnum)[keyof typeof SupplierAddressScalarFieldEnum]


  export const SupplierOfferingScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    supplierId: 'supplierId',
    itemId: 'itemId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierOfferingScalarFieldEnum = (typeof SupplierOfferingScalarFieldEnum)[keyof typeof SupplierOfferingScalarFieldEnum]


  export const SrmAuditEnvelopeScalarFieldEnum: {
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

  export type SrmAuditEnvelopeScalarFieldEnum = (typeof SrmAuditEnvelopeScalarFieldEnum)[keyof typeof SrmAuditEnvelopeScalarFieldEnum]


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


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


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
   * Reference to a field of type 'SrmSupplierStatus'
   */
  export type EnumSrmSupplierStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierStatus'>
    


  /**
   * Reference to a field of type 'SrmSupplierStatus[]'
   */
  export type ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'SrmSupplierPartyBindingStatus'
   */
  export type EnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierPartyBindingStatus'>
    


  /**
   * Reference to a field of type 'SrmSupplierPartyBindingStatus[]'
   */
  export type ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierPartyBindingStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'SrmSupplierOfferingStatus'
   */
  export type EnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierOfferingStatus'>
    


  /**
   * Reference to a field of type 'SrmSupplierOfferingStatus[]'
   */
  export type ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SrmSupplierOfferingStatus[]'>
    


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


  export type SrmSequenceCounterWhereInput = {
    AND?: SrmSequenceCounterWhereInput | SrmSequenceCounterWhereInput[]
    OR?: SrmSequenceCounterWhereInput[]
    NOT?: SrmSequenceCounterWhereInput | SrmSequenceCounterWhereInput[]
    tenantId?: StringFilter<"SrmSequenceCounter"> | string
    nextSupplierProfileNo?: IntFilter<"SrmSequenceCounter"> | number
    createdAt?: DateTimeFilter<"SrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"SrmSequenceCounter"> | Date | string
  }

  export type SrmSequenceCounterOrderByWithRelationInput = {
    tenantId?: SortOrder
    nextSupplierProfileNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SrmSequenceCounterWhereUniqueInput = Prisma.AtLeast<{
    tenantId?: string
    AND?: SrmSequenceCounterWhereInput | SrmSequenceCounterWhereInput[]
    OR?: SrmSequenceCounterWhereInput[]
    NOT?: SrmSequenceCounterWhereInput | SrmSequenceCounterWhereInput[]
    nextSupplierProfileNo?: IntFilter<"SrmSequenceCounter"> | number
    createdAt?: DateTimeFilter<"SrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"SrmSequenceCounter"> | Date | string
  }, "tenantId">

  export type SrmSequenceCounterOrderByWithAggregationInput = {
    tenantId?: SortOrder
    nextSupplierProfileNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SrmSequenceCounterCountOrderByAggregateInput
    _avg?: SrmSequenceCounterAvgOrderByAggregateInput
    _max?: SrmSequenceCounterMaxOrderByAggregateInput
    _min?: SrmSequenceCounterMinOrderByAggregateInput
    _sum?: SrmSequenceCounterSumOrderByAggregateInput
  }

  export type SrmSequenceCounterScalarWhereWithAggregatesInput = {
    AND?: SrmSequenceCounterScalarWhereWithAggregatesInput | SrmSequenceCounterScalarWhereWithAggregatesInput[]
    OR?: SrmSequenceCounterScalarWhereWithAggregatesInput[]
    NOT?: SrmSequenceCounterScalarWhereWithAggregatesInput | SrmSequenceCounterScalarWhereWithAggregatesInput[]
    tenantId?: StringWithAggregatesFilter<"SrmSequenceCounter"> | string
    nextSupplierProfileNo?: IntWithAggregatesFilter<"SrmSequenceCounter"> | number
    createdAt?: DateTimeWithAggregatesFilter<"SrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SrmSequenceCounter"> | Date | string
  }

  export type SupplierProfileWhereInput = {
    AND?: SupplierProfileWhereInput | SupplierProfileWhereInput[]
    OR?: SupplierProfileWhereInput[]
    NOT?: SupplierProfileWhereInput | SupplierProfileWhereInput[]
    id?: UuidFilter<"SupplierProfile"> | string
    supplierNo?: StringFilter<"SupplierProfile"> | string
    tenantId?: StringFilter<"SupplierProfile"> | string
    displayName?: StringFilter<"SupplierProfile"> | string
    status?: EnumSrmSupplierStatusFilter<"SupplierProfile"> | $Enums.SrmSupplierStatus
    supplierCategory?: StringNullableFilter<"SupplierProfile"> | string | null
    tags?: JsonFilter<"SupplierProfile">
    createdAt?: DateTimeFilter<"SupplierProfile"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierProfile"> | Date | string
    partyBinding?: XOR<SupplierPartyBindingNullableScalarRelationFilter, SupplierPartyBindingWhereInput> | null
    contacts?: SupplierContactListRelationFilter
    addresses?: SupplierAddressListRelationFilter
    offerings?: SupplierOfferingListRelationFilter
  }

  export type SupplierProfileOrderByWithRelationInput = {
    id?: SortOrder
    supplierNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    supplierCategory?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    partyBinding?: SupplierPartyBindingOrderByWithRelationInput
    contacts?: SupplierContactOrderByRelationAggregateInput
    addresses?: SupplierAddressOrderByRelationAggregateInput
    offerings?: SupplierOfferingOrderByRelationAggregateInput
  }

  export type SupplierProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    supplierNo?: string
    AND?: SupplierProfileWhereInput | SupplierProfileWhereInput[]
    OR?: SupplierProfileWhereInput[]
    NOT?: SupplierProfileWhereInput | SupplierProfileWhereInput[]
    tenantId?: StringFilter<"SupplierProfile"> | string
    displayName?: StringFilter<"SupplierProfile"> | string
    status?: EnumSrmSupplierStatusFilter<"SupplierProfile"> | $Enums.SrmSupplierStatus
    supplierCategory?: StringNullableFilter<"SupplierProfile"> | string | null
    tags?: JsonFilter<"SupplierProfile">
    createdAt?: DateTimeFilter<"SupplierProfile"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierProfile"> | Date | string
    partyBinding?: XOR<SupplierPartyBindingNullableScalarRelationFilter, SupplierPartyBindingWhereInput> | null
    contacts?: SupplierContactListRelationFilter
    addresses?: SupplierAddressListRelationFilter
    offerings?: SupplierOfferingListRelationFilter
  }, "id" | "supplierNo">

  export type SupplierProfileOrderByWithAggregationInput = {
    id?: SortOrder
    supplierNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    supplierCategory?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierProfileCountOrderByAggregateInput
    _max?: SupplierProfileMaxOrderByAggregateInput
    _min?: SupplierProfileMinOrderByAggregateInput
  }

  export type SupplierProfileScalarWhereWithAggregatesInput = {
    AND?: SupplierProfileScalarWhereWithAggregatesInput | SupplierProfileScalarWhereWithAggregatesInput[]
    OR?: SupplierProfileScalarWhereWithAggregatesInput[]
    NOT?: SupplierProfileScalarWhereWithAggregatesInput | SupplierProfileScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierProfile"> | string
    supplierNo?: StringWithAggregatesFilter<"SupplierProfile"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierProfile"> | string
    displayName?: StringWithAggregatesFilter<"SupplierProfile"> | string
    status?: EnumSrmSupplierStatusWithAggregatesFilter<"SupplierProfile"> | $Enums.SrmSupplierStatus
    supplierCategory?: StringNullableWithAggregatesFilter<"SupplierProfile"> | string | null
    tags?: JsonWithAggregatesFilter<"SupplierProfile">
    createdAt?: DateTimeWithAggregatesFilter<"SupplierProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierProfile"> | Date | string
  }

  export type SupplierPartyBindingWhereInput = {
    AND?: SupplierPartyBindingWhereInput | SupplierPartyBindingWhereInput[]
    OR?: SupplierPartyBindingWhereInput[]
    NOT?: SupplierPartyBindingWhereInput | SupplierPartyBindingWhereInput[]
    id?: UuidFilter<"SupplierPartyBinding"> | string
    tenantId?: StringFilter<"SupplierPartyBinding"> | string
    supplierId?: UuidFilter<"SupplierPartyBinding"> | string
    tenantPartyId?: StringFilter<"SupplierPartyBinding"> | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFilter<"SupplierPartyBinding"> | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: StringNullableFilter<"SupplierPartyBinding"> | string | null
    createdAt?: DateTimeFilter<"SupplierPartyBinding"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierPartyBinding"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }

  export type SupplierPartyBindingOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    supplierProfile?: SupplierProfileOrderByWithRelationInput
  }

  export type SupplierPartyBindingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    supplierId?: string
    tenantId_tenantPartyId?: SupplierPartyBindingTenantIdTenantPartyIdCompoundUniqueInput
    AND?: SupplierPartyBindingWhereInput | SupplierPartyBindingWhereInput[]
    OR?: SupplierPartyBindingWhereInput[]
    NOT?: SupplierPartyBindingWhereInput | SupplierPartyBindingWhereInput[]
    tenantId?: StringFilter<"SupplierPartyBinding"> | string
    tenantPartyId?: StringFilter<"SupplierPartyBinding"> | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFilter<"SupplierPartyBinding"> | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: StringNullableFilter<"SupplierPartyBinding"> | string | null
    createdAt?: DateTimeFilter<"SupplierPartyBinding"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierPartyBinding"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }, "id" | "supplierId" | "tenantId_tenantPartyId">

  export type SupplierPartyBindingOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierPartyBindingCountOrderByAggregateInput
    _max?: SupplierPartyBindingMaxOrderByAggregateInput
    _min?: SupplierPartyBindingMinOrderByAggregateInput
  }

  export type SupplierPartyBindingScalarWhereWithAggregatesInput = {
    AND?: SupplierPartyBindingScalarWhereWithAggregatesInput | SupplierPartyBindingScalarWhereWithAggregatesInput[]
    OR?: SupplierPartyBindingScalarWhereWithAggregatesInput[]
    NOT?: SupplierPartyBindingScalarWhereWithAggregatesInput | SupplierPartyBindingScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierPartyBinding"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierPartyBinding"> | string
    supplierId?: UuidWithAggregatesFilter<"SupplierPartyBinding"> | string
    tenantPartyId?: StringWithAggregatesFilter<"SupplierPartyBinding"> | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusWithAggregatesFilter<"SupplierPartyBinding"> | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: StringNullableWithAggregatesFilter<"SupplierPartyBinding"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SupplierPartyBinding"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierPartyBinding"> | Date | string
  }

  export type SupplierContactWhereInput = {
    AND?: SupplierContactWhereInput | SupplierContactWhereInput[]
    OR?: SupplierContactWhereInput[]
    NOT?: SupplierContactWhereInput | SupplierContactWhereInput[]
    id?: UuidFilter<"SupplierContact"> | string
    tenantId?: StringFilter<"SupplierContact"> | string
    supplierId?: UuidFilter<"SupplierContact"> | string
    displayName?: StringFilter<"SupplierContact"> | string
    roleTitle?: StringNullableFilter<"SupplierContact"> | string | null
    email?: StringNullableFilter<"SupplierContact"> | string | null
    phone?: StringNullableFilter<"SupplierContact"> | string | null
    isPrimaryContact?: BoolFilter<"SupplierContact"> | boolean
    isActive?: BoolFilter<"SupplierContact"> | boolean
    createdAt?: DateTimeFilter<"SupplierContact"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierContact"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }

  export type SupplierContactOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    supplierProfile?: SupplierProfileOrderByWithRelationInput
  }

  export type SupplierContactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SupplierContactWhereInput | SupplierContactWhereInput[]
    OR?: SupplierContactWhereInput[]
    NOT?: SupplierContactWhereInput | SupplierContactWhereInput[]
    tenantId?: StringFilter<"SupplierContact"> | string
    supplierId?: UuidFilter<"SupplierContact"> | string
    displayName?: StringFilter<"SupplierContact"> | string
    roleTitle?: StringNullableFilter<"SupplierContact"> | string | null
    email?: StringNullableFilter<"SupplierContact"> | string | null
    phone?: StringNullableFilter<"SupplierContact"> | string | null
    isPrimaryContact?: BoolFilter<"SupplierContact"> | boolean
    isActive?: BoolFilter<"SupplierContact"> | boolean
    createdAt?: DateTimeFilter<"SupplierContact"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierContact"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }, "id">

  export type SupplierContactOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierContactCountOrderByAggregateInput
    _max?: SupplierContactMaxOrderByAggregateInput
    _min?: SupplierContactMinOrderByAggregateInput
  }

  export type SupplierContactScalarWhereWithAggregatesInput = {
    AND?: SupplierContactScalarWhereWithAggregatesInput | SupplierContactScalarWhereWithAggregatesInput[]
    OR?: SupplierContactScalarWhereWithAggregatesInput[]
    NOT?: SupplierContactScalarWhereWithAggregatesInput | SupplierContactScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierContact"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierContact"> | string
    supplierId?: UuidWithAggregatesFilter<"SupplierContact"> | string
    displayName?: StringWithAggregatesFilter<"SupplierContact"> | string
    roleTitle?: StringNullableWithAggregatesFilter<"SupplierContact"> | string | null
    email?: StringNullableWithAggregatesFilter<"SupplierContact"> | string | null
    phone?: StringNullableWithAggregatesFilter<"SupplierContact"> | string | null
    isPrimaryContact?: BoolWithAggregatesFilter<"SupplierContact"> | boolean
    isActive?: BoolWithAggregatesFilter<"SupplierContact"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"SupplierContact"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierContact"> | Date | string
  }

  export type SupplierAddressWhereInput = {
    AND?: SupplierAddressWhereInput | SupplierAddressWhereInput[]
    OR?: SupplierAddressWhereInput[]
    NOT?: SupplierAddressWhereInput | SupplierAddressWhereInput[]
    id?: UuidFilter<"SupplierAddress"> | string
    tenantId?: StringFilter<"SupplierAddress"> | string
    supplierId?: UuidFilter<"SupplierAddress"> | string
    label?: StringFilter<"SupplierAddress"> | string
    countryCode?: StringFilter<"SupplierAddress"> | string
    region?: StringNullableFilter<"SupplierAddress"> | string | null
    locality?: StringNullableFilter<"SupplierAddress"> | string | null
    addressLine1?: StringFilter<"SupplierAddress"> | string
    addressLine2?: StringNullableFilter<"SupplierAddress"> | string | null
    postalCode?: StringNullableFilter<"SupplierAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"SupplierAddress"> | boolean
    isActive?: BoolFilter<"SupplierAddress"> | boolean
    createdAt?: DateTimeFilter<"SupplierAddress"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierAddress"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }

  export type SupplierAddressOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrderInput | SortOrder
    locality?: SortOrderInput | SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    supplierProfile?: SupplierProfileOrderByWithRelationInput
  }

  export type SupplierAddressWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SupplierAddressWhereInput | SupplierAddressWhereInput[]
    OR?: SupplierAddressWhereInput[]
    NOT?: SupplierAddressWhereInput | SupplierAddressWhereInput[]
    tenantId?: StringFilter<"SupplierAddress"> | string
    supplierId?: UuidFilter<"SupplierAddress"> | string
    label?: StringFilter<"SupplierAddress"> | string
    countryCode?: StringFilter<"SupplierAddress"> | string
    region?: StringNullableFilter<"SupplierAddress"> | string | null
    locality?: StringNullableFilter<"SupplierAddress"> | string | null
    addressLine1?: StringFilter<"SupplierAddress"> | string
    addressLine2?: StringNullableFilter<"SupplierAddress"> | string | null
    postalCode?: StringNullableFilter<"SupplierAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"SupplierAddress"> | boolean
    isActive?: BoolFilter<"SupplierAddress"> | boolean
    createdAt?: DateTimeFilter<"SupplierAddress"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierAddress"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }, "id">

  export type SupplierAddressOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrderInput | SortOrder
    locality?: SortOrderInput | SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierAddressCountOrderByAggregateInput
    _max?: SupplierAddressMaxOrderByAggregateInput
    _min?: SupplierAddressMinOrderByAggregateInput
  }

  export type SupplierAddressScalarWhereWithAggregatesInput = {
    AND?: SupplierAddressScalarWhereWithAggregatesInput | SupplierAddressScalarWhereWithAggregatesInput[]
    OR?: SupplierAddressScalarWhereWithAggregatesInput[]
    NOT?: SupplierAddressScalarWhereWithAggregatesInput | SupplierAddressScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierAddress"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierAddress"> | string
    supplierId?: UuidWithAggregatesFilter<"SupplierAddress"> | string
    label?: StringWithAggregatesFilter<"SupplierAddress"> | string
    countryCode?: StringWithAggregatesFilter<"SupplierAddress"> | string
    region?: StringNullableWithAggregatesFilter<"SupplierAddress"> | string | null
    locality?: StringNullableWithAggregatesFilter<"SupplierAddress"> | string | null
    addressLine1?: StringWithAggregatesFilter<"SupplierAddress"> | string
    addressLine2?: StringNullableWithAggregatesFilter<"SupplierAddress"> | string | null
    postalCode?: StringNullableWithAggregatesFilter<"SupplierAddress"> | string | null
    isPrimaryAddress?: BoolWithAggregatesFilter<"SupplierAddress"> | boolean
    isActive?: BoolWithAggregatesFilter<"SupplierAddress"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"SupplierAddress"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierAddress"> | Date | string
  }

  export type SupplierOfferingWhereInput = {
    AND?: SupplierOfferingWhereInput | SupplierOfferingWhereInput[]
    OR?: SupplierOfferingWhereInput[]
    NOT?: SupplierOfferingWhereInput | SupplierOfferingWhereInput[]
    id?: UuidFilter<"SupplierOffering"> | string
    tenantId?: StringFilter<"SupplierOffering"> | string
    supplierId?: UuidFilter<"SupplierOffering"> | string
    itemId?: UuidFilter<"SupplierOffering"> | string
    itemCode?: StringNullableFilter<"SupplierOffering"> | string | null
    itemName?: StringNullableFilter<"SupplierOffering"> | string | null
    status?: EnumSrmSupplierOfferingStatusFilter<"SupplierOffering"> | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFilter<"SupplierOffering"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierOffering"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }

  export type SupplierOfferingOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    supplierProfile?: SupplierProfileOrderByWithRelationInput
  }

  export type SupplierOfferingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_supplierId_itemId?: SupplierOfferingTenantIdSupplierIdItemIdCompoundUniqueInput
    AND?: SupplierOfferingWhereInput | SupplierOfferingWhereInput[]
    OR?: SupplierOfferingWhereInput[]
    NOT?: SupplierOfferingWhereInput | SupplierOfferingWhereInput[]
    tenantId?: StringFilter<"SupplierOffering"> | string
    supplierId?: UuidFilter<"SupplierOffering"> | string
    itemId?: UuidFilter<"SupplierOffering"> | string
    itemCode?: StringNullableFilter<"SupplierOffering"> | string | null
    itemName?: StringNullableFilter<"SupplierOffering"> | string | null
    status?: EnumSrmSupplierOfferingStatusFilter<"SupplierOffering"> | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFilter<"SupplierOffering"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierOffering"> | Date | string
    supplierProfile?: XOR<SupplierProfileScalarRelationFilter, SupplierProfileWhereInput>
  }, "id" | "tenantId_supplierId_itemId">

  export type SupplierOfferingOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrderInput | SortOrder
    itemName?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierOfferingCountOrderByAggregateInput
    _max?: SupplierOfferingMaxOrderByAggregateInput
    _min?: SupplierOfferingMinOrderByAggregateInput
  }

  export type SupplierOfferingScalarWhereWithAggregatesInput = {
    AND?: SupplierOfferingScalarWhereWithAggregatesInput | SupplierOfferingScalarWhereWithAggregatesInput[]
    OR?: SupplierOfferingScalarWhereWithAggregatesInput[]
    NOT?: SupplierOfferingScalarWhereWithAggregatesInput | SupplierOfferingScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierOffering"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierOffering"> | string
    supplierId?: UuidWithAggregatesFilter<"SupplierOffering"> | string
    itemId?: UuidWithAggregatesFilter<"SupplierOffering"> | string
    itemCode?: StringNullableWithAggregatesFilter<"SupplierOffering"> | string | null
    itemName?: StringNullableWithAggregatesFilter<"SupplierOffering"> | string | null
    status?: EnumSrmSupplierOfferingStatusWithAggregatesFilter<"SupplierOffering"> | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeWithAggregatesFilter<"SupplierOffering"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierOffering"> | Date | string
  }

  export type SrmAuditEnvelopeWhereInput = {
    AND?: SrmAuditEnvelopeWhereInput | SrmAuditEnvelopeWhereInput[]
    OR?: SrmAuditEnvelopeWhereInput[]
    NOT?: SrmAuditEnvelopeWhereInput | SrmAuditEnvelopeWhereInput[]
    id?: StringFilter<"SrmAuditEnvelope"> | string
    service?: StringFilter<"SrmAuditEnvelope"> | string
    module?: StringFilter<"SrmAuditEnvelope"> | string
    eventType?: StringFilter<"SrmAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"SrmAuditEnvelope"> | Date | string
    result?: StringFilter<"SrmAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    operatorType?: StringFilter<"SrmAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    resourceType?: StringFilter<"SrmAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    details?: JsonFilter<"SrmAuditEnvelope">
    createdAt?: DateTimeFilter<"SrmAuditEnvelope"> | Date | string
  }

  export type SrmAuditEnvelopeOrderByWithRelationInput = {
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

  export type SrmAuditEnvelopeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SrmAuditEnvelopeWhereInput | SrmAuditEnvelopeWhereInput[]
    OR?: SrmAuditEnvelopeWhereInput[]
    NOT?: SrmAuditEnvelopeWhereInput | SrmAuditEnvelopeWhereInput[]
    service?: StringFilter<"SrmAuditEnvelope"> | string
    module?: StringFilter<"SrmAuditEnvelope"> | string
    eventType?: StringFilter<"SrmAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"SrmAuditEnvelope"> | Date | string
    result?: StringFilter<"SrmAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    operatorType?: StringFilter<"SrmAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    resourceType?: StringFilter<"SrmAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"SrmAuditEnvelope"> | string | null
    details?: JsonFilter<"SrmAuditEnvelope">
    createdAt?: DateTimeFilter<"SrmAuditEnvelope"> | Date | string
  }, "id">

  export type SrmAuditEnvelopeOrderByWithAggregationInput = {
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
    _count?: SrmAuditEnvelopeCountOrderByAggregateInput
    _max?: SrmAuditEnvelopeMaxOrderByAggregateInput
    _min?: SrmAuditEnvelopeMinOrderByAggregateInput
  }

  export type SrmAuditEnvelopeScalarWhereWithAggregatesInput = {
    AND?: SrmAuditEnvelopeScalarWhereWithAggregatesInput | SrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    OR?: SrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    NOT?: SrmAuditEnvelopeScalarWhereWithAggregatesInput | SrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    service?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    module?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    eventType?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"SrmAuditEnvelope"> | Date | string
    result?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    operatorId?: StringNullableWithAggregatesFilter<"SrmAuditEnvelope"> | string | null
    operatorType?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    tenantId?: StringNullableWithAggregatesFilter<"SrmAuditEnvelope"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"SrmAuditEnvelope"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"SrmAuditEnvelope"> | string | null
    resourceType?: StringWithAggregatesFilter<"SrmAuditEnvelope"> | string
    resourceId?: StringNullableWithAggregatesFilter<"SrmAuditEnvelope"> | string | null
    details?: JsonWithAggregatesFilter<"SrmAuditEnvelope">
    createdAt?: DateTimeWithAggregatesFilter<"SrmAuditEnvelope"> | Date | string
  }

  export type SrmSequenceCounterCreateInput = {
    tenantId: string
    nextSupplierProfileNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SrmSequenceCounterUncheckedCreateInput = {
    tenantId: string
    nextSupplierProfileNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SrmSequenceCounterUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextSupplierProfileNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SrmSequenceCounterUncheckedUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextSupplierProfileNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SrmSequenceCounterCreateManyInput = {
    tenantId: string
    nextSupplierProfileNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SrmSequenceCounterUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextSupplierProfileNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SrmSequenceCounterUncheckedUpdateManyInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextSupplierProfileNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierProfileCreateInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUncheckedCreateInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingUncheckedCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactUncheckedCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressUncheckedCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingUncheckedCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUncheckedUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUncheckedUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUncheckedUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileCreateManyInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierPartyBindingCreateInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    supplierProfile: SupplierProfileCreateNestedOneWithoutPartyBindingInput
  }

  export type SupplierPartyBindingUncheckedCreateInput = {
    id: string
    tenantId: string
    supplierId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierPartyBindingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    supplierProfile?: SupplierProfileUpdateOneRequiredWithoutPartyBindingNestedInput
  }

  export type SupplierPartyBindingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierPartyBindingCreateManyInput = {
    id: string
    tenantId: string
    supplierId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierPartyBindingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierPartyBindingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactCreateInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    supplierProfile: SupplierProfileCreateNestedOneWithoutContactsInput
  }

  export type SupplierContactUncheckedCreateInput = {
    id: string
    tenantId: string
    supplierId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierContactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    supplierProfile?: SupplierProfileUpdateOneRequiredWithoutContactsNestedInput
  }

  export type SupplierContactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactCreateManyInput = {
    id: string
    tenantId: string
    supplierId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierContactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressCreateInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    supplierProfile: SupplierProfileCreateNestedOneWithoutAddressesInput
  }

  export type SupplierAddressUncheckedCreateInput = {
    id: string
    tenantId: string
    supplierId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierAddressUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    supplierProfile?: SupplierProfileUpdateOneRequiredWithoutAddressesNestedInput
  }

  export type SupplierAddressUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressCreateManyInput = {
    id: string
    tenantId: string
    supplierId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierAddressUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingCreateInput = {
    id: string
    tenantId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    supplierProfile: SupplierProfileCreateNestedOneWithoutOfferingsInput
  }

  export type SupplierOfferingUncheckedCreateInput = {
    id: string
    tenantId: string
    supplierId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierOfferingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    supplierProfile?: SupplierProfileUpdateOneRequiredWithoutOfferingsNestedInput
  }

  export type SupplierOfferingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingCreateManyInput = {
    id: string
    tenantId: string
    supplierId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierOfferingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SrmAuditEnvelopeCreateInput = {
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

  export type SrmAuditEnvelopeUncheckedCreateInput = {
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

  export type SrmAuditEnvelopeUpdateInput = {
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

  export type SrmAuditEnvelopeUncheckedUpdateInput = {
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

  export type SrmAuditEnvelopeCreateManyInput = {
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

  export type SrmAuditEnvelopeUpdateManyMutationInput = {
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

  export type SrmAuditEnvelopeUncheckedUpdateManyInput = {
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

  export type SrmSequenceCounterCountOrderByAggregateInput = {
    tenantId?: SortOrder
    nextSupplierProfileNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SrmSequenceCounterAvgOrderByAggregateInput = {
    nextSupplierProfileNo?: SortOrder
  }

  export type SrmSequenceCounterMaxOrderByAggregateInput = {
    tenantId?: SortOrder
    nextSupplierProfileNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SrmSequenceCounterMinOrderByAggregateInput = {
    tenantId?: SortOrder
    nextSupplierProfileNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SrmSequenceCounterSumOrderByAggregateInput = {
    nextSupplierProfileNo?: SortOrder
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

  export type EnumSrmSupplierStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierStatus | EnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierStatusFilter<$PrismaModel> | $Enums.SrmSupplierStatus
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

  export type SupplierPartyBindingNullableScalarRelationFilter = {
    is?: SupplierPartyBindingWhereInput | null
    isNot?: SupplierPartyBindingWhereInput | null
  }

  export type SupplierContactListRelationFilter = {
    every?: SupplierContactWhereInput
    some?: SupplierContactWhereInput
    none?: SupplierContactWhereInput
  }

  export type SupplierAddressListRelationFilter = {
    every?: SupplierAddressWhereInput
    some?: SupplierAddressWhereInput
    none?: SupplierAddressWhereInput
  }

  export type SupplierOfferingListRelationFilter = {
    every?: SupplierOfferingWhereInput
    some?: SupplierOfferingWhereInput
    none?: SupplierOfferingWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SupplierContactOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SupplierAddressOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SupplierOfferingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SupplierProfileCountOrderByAggregateInput = {
    id?: SortOrder
    supplierNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    supplierCategory?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    supplierNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    supplierCategory?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierProfileMinOrderByAggregateInput = {
    id?: SortOrder
    supplierNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    supplierCategory?: SortOrder
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

  export type EnumSrmSupplierStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierStatus | EnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierStatusFilter<$PrismaModel>
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

  export type EnumSrmSupplierPartyBindingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierPartyBindingStatus | EnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel> | $Enums.SrmSupplierPartyBindingStatus
  }

  export type SupplierProfileScalarRelationFilter = {
    is?: SupplierProfileWhereInput
    isNot?: SupplierProfileWhereInput
  }

  export type SupplierPartyBindingTenantIdTenantPartyIdCompoundUniqueInput = {
    tenantId: string
    tenantPartyId: string
  }

  export type SupplierPartyBindingCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierPartyBindingMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierPartyBindingMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSrmSupplierPartyBindingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierPartyBindingStatus | EnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierPartyBindingStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierPartyBindingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type SupplierContactCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierContactMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierContactMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
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

  export type SupplierAddressCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierAddressMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierAddressMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSrmSupplierOfferingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierOfferingStatus | EnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel> | $Enums.SrmSupplierOfferingStatus
  }

  export type SupplierOfferingTenantIdSupplierIdItemIdCompoundUniqueInput = {
    tenantId: string
    supplierId: string
    itemId: string
  }

  export type SupplierOfferingCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierOfferingMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierOfferingMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    itemId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSrmSupplierOfferingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierOfferingStatus | EnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierOfferingStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierOfferingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel>
  }

  export type SrmAuditEnvelopeCountOrderByAggregateInput = {
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

  export type SrmAuditEnvelopeMaxOrderByAggregateInput = {
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

  export type SrmAuditEnvelopeMinOrderByAggregateInput = {
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

  export type SupplierPartyBindingCreateNestedOneWithoutSupplierProfileInput = {
    create?: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
    connectOrCreate?: SupplierPartyBindingCreateOrConnectWithoutSupplierProfileInput
    connect?: SupplierPartyBindingWhereUniqueInput
  }

  export type SupplierContactCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput> | SupplierContactCreateWithoutSupplierProfileInput[] | SupplierContactUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierContactCreateOrConnectWithoutSupplierProfileInput | SupplierContactCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierContactCreateManySupplierProfileInputEnvelope
    connect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
  }

  export type SupplierAddressCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput> | SupplierAddressCreateWithoutSupplierProfileInput[] | SupplierAddressUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierAddressCreateOrConnectWithoutSupplierProfileInput | SupplierAddressCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierAddressCreateManySupplierProfileInputEnvelope
    connect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
  }

  export type SupplierOfferingCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput> | SupplierOfferingCreateWithoutSupplierProfileInput[] | SupplierOfferingUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierOfferingCreateOrConnectWithoutSupplierProfileInput | SupplierOfferingCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierOfferingCreateManySupplierProfileInputEnvelope
    connect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
  }

  export type SupplierPartyBindingUncheckedCreateNestedOneWithoutSupplierProfileInput = {
    create?: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
    connectOrCreate?: SupplierPartyBindingCreateOrConnectWithoutSupplierProfileInput
    connect?: SupplierPartyBindingWhereUniqueInput
  }

  export type SupplierContactUncheckedCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput> | SupplierContactCreateWithoutSupplierProfileInput[] | SupplierContactUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierContactCreateOrConnectWithoutSupplierProfileInput | SupplierContactCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierContactCreateManySupplierProfileInputEnvelope
    connect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
  }

  export type SupplierAddressUncheckedCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput> | SupplierAddressCreateWithoutSupplierProfileInput[] | SupplierAddressUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierAddressCreateOrConnectWithoutSupplierProfileInput | SupplierAddressCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierAddressCreateManySupplierProfileInputEnvelope
    connect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
  }

  export type SupplierOfferingUncheckedCreateNestedManyWithoutSupplierProfileInput = {
    create?: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput> | SupplierOfferingCreateWithoutSupplierProfileInput[] | SupplierOfferingUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierOfferingCreateOrConnectWithoutSupplierProfileInput | SupplierOfferingCreateOrConnectWithoutSupplierProfileInput[]
    createMany?: SupplierOfferingCreateManySupplierProfileInputEnvelope
    connect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
  }

  export type EnumSrmSupplierStatusFieldUpdateOperationsInput = {
    set?: $Enums.SrmSupplierStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type SupplierPartyBindingUpdateOneWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
    connectOrCreate?: SupplierPartyBindingCreateOrConnectWithoutSupplierProfileInput
    upsert?: SupplierPartyBindingUpsertWithoutSupplierProfileInput
    disconnect?: SupplierPartyBindingWhereInput | boolean
    delete?: SupplierPartyBindingWhereInput | boolean
    connect?: SupplierPartyBindingWhereUniqueInput
    update?: XOR<XOR<SupplierPartyBindingUpdateToOneWithWhereWithoutSupplierProfileInput, SupplierPartyBindingUpdateWithoutSupplierProfileInput>, SupplierPartyBindingUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierContactUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput> | SupplierContactCreateWithoutSupplierProfileInput[] | SupplierContactUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierContactCreateOrConnectWithoutSupplierProfileInput | SupplierContactCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierContactUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierContactUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierContactCreateManySupplierProfileInputEnvelope
    set?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    disconnect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    delete?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    connect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    update?: SupplierContactUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierContactUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierContactUpdateManyWithWhereWithoutSupplierProfileInput | SupplierContactUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierContactScalarWhereInput | SupplierContactScalarWhereInput[]
  }

  export type SupplierAddressUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput> | SupplierAddressCreateWithoutSupplierProfileInput[] | SupplierAddressUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierAddressCreateOrConnectWithoutSupplierProfileInput | SupplierAddressCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierAddressUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierAddressUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierAddressCreateManySupplierProfileInputEnvelope
    set?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    disconnect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    delete?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    connect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    update?: SupplierAddressUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierAddressUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierAddressUpdateManyWithWhereWithoutSupplierProfileInput | SupplierAddressUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierAddressScalarWhereInput | SupplierAddressScalarWhereInput[]
  }

  export type SupplierOfferingUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput> | SupplierOfferingCreateWithoutSupplierProfileInput[] | SupplierOfferingUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierOfferingCreateOrConnectWithoutSupplierProfileInput | SupplierOfferingCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierOfferingUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierOfferingUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierOfferingCreateManySupplierProfileInputEnvelope
    set?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    disconnect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    delete?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    connect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    update?: SupplierOfferingUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierOfferingUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierOfferingUpdateManyWithWhereWithoutSupplierProfileInput | SupplierOfferingUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierOfferingScalarWhereInput | SupplierOfferingScalarWhereInput[]
  }

  export type SupplierPartyBindingUncheckedUpdateOneWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
    connectOrCreate?: SupplierPartyBindingCreateOrConnectWithoutSupplierProfileInput
    upsert?: SupplierPartyBindingUpsertWithoutSupplierProfileInput
    disconnect?: SupplierPartyBindingWhereInput | boolean
    delete?: SupplierPartyBindingWhereInput | boolean
    connect?: SupplierPartyBindingWhereUniqueInput
    update?: XOR<XOR<SupplierPartyBindingUpdateToOneWithWhereWithoutSupplierProfileInput, SupplierPartyBindingUpdateWithoutSupplierProfileInput>, SupplierPartyBindingUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierContactUncheckedUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput> | SupplierContactCreateWithoutSupplierProfileInput[] | SupplierContactUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierContactCreateOrConnectWithoutSupplierProfileInput | SupplierContactCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierContactUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierContactUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierContactCreateManySupplierProfileInputEnvelope
    set?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    disconnect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    delete?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    connect?: SupplierContactWhereUniqueInput | SupplierContactWhereUniqueInput[]
    update?: SupplierContactUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierContactUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierContactUpdateManyWithWhereWithoutSupplierProfileInput | SupplierContactUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierContactScalarWhereInput | SupplierContactScalarWhereInput[]
  }

  export type SupplierAddressUncheckedUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput> | SupplierAddressCreateWithoutSupplierProfileInput[] | SupplierAddressUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierAddressCreateOrConnectWithoutSupplierProfileInput | SupplierAddressCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierAddressUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierAddressUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierAddressCreateManySupplierProfileInputEnvelope
    set?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    disconnect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    delete?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    connect?: SupplierAddressWhereUniqueInput | SupplierAddressWhereUniqueInput[]
    update?: SupplierAddressUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierAddressUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierAddressUpdateManyWithWhereWithoutSupplierProfileInput | SupplierAddressUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierAddressScalarWhereInput | SupplierAddressScalarWhereInput[]
  }

  export type SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileNestedInput = {
    create?: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput> | SupplierOfferingCreateWithoutSupplierProfileInput[] | SupplierOfferingUncheckedCreateWithoutSupplierProfileInput[]
    connectOrCreate?: SupplierOfferingCreateOrConnectWithoutSupplierProfileInput | SupplierOfferingCreateOrConnectWithoutSupplierProfileInput[]
    upsert?: SupplierOfferingUpsertWithWhereUniqueWithoutSupplierProfileInput | SupplierOfferingUpsertWithWhereUniqueWithoutSupplierProfileInput[]
    createMany?: SupplierOfferingCreateManySupplierProfileInputEnvelope
    set?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    disconnect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    delete?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    connect?: SupplierOfferingWhereUniqueInput | SupplierOfferingWhereUniqueInput[]
    update?: SupplierOfferingUpdateWithWhereUniqueWithoutSupplierProfileInput | SupplierOfferingUpdateWithWhereUniqueWithoutSupplierProfileInput[]
    updateMany?: SupplierOfferingUpdateManyWithWhereWithoutSupplierProfileInput | SupplierOfferingUpdateManyWithWhereWithoutSupplierProfileInput[]
    deleteMany?: SupplierOfferingScalarWhereInput | SupplierOfferingScalarWhereInput[]
  }

  export type SupplierProfileCreateNestedOneWithoutPartyBindingInput = {
    create?: XOR<SupplierProfileCreateWithoutPartyBindingInput, SupplierProfileUncheckedCreateWithoutPartyBindingInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutPartyBindingInput
    connect?: SupplierProfileWhereUniqueInput
  }

  export type EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput = {
    set?: $Enums.SrmSupplierPartyBindingStatus
  }

  export type SupplierProfileUpdateOneRequiredWithoutPartyBindingNestedInput = {
    create?: XOR<SupplierProfileCreateWithoutPartyBindingInput, SupplierProfileUncheckedCreateWithoutPartyBindingInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutPartyBindingInput
    upsert?: SupplierProfileUpsertWithoutPartyBindingInput
    connect?: SupplierProfileWhereUniqueInput
    update?: XOR<XOR<SupplierProfileUpdateToOneWithWhereWithoutPartyBindingInput, SupplierProfileUpdateWithoutPartyBindingInput>, SupplierProfileUncheckedUpdateWithoutPartyBindingInput>
  }

  export type SupplierProfileCreateNestedOneWithoutContactsInput = {
    create?: XOR<SupplierProfileCreateWithoutContactsInput, SupplierProfileUncheckedCreateWithoutContactsInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutContactsInput
    connect?: SupplierProfileWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type SupplierProfileUpdateOneRequiredWithoutContactsNestedInput = {
    create?: XOR<SupplierProfileCreateWithoutContactsInput, SupplierProfileUncheckedCreateWithoutContactsInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutContactsInput
    upsert?: SupplierProfileUpsertWithoutContactsInput
    connect?: SupplierProfileWhereUniqueInput
    update?: XOR<XOR<SupplierProfileUpdateToOneWithWhereWithoutContactsInput, SupplierProfileUpdateWithoutContactsInput>, SupplierProfileUncheckedUpdateWithoutContactsInput>
  }

  export type SupplierProfileCreateNestedOneWithoutAddressesInput = {
    create?: XOR<SupplierProfileCreateWithoutAddressesInput, SupplierProfileUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutAddressesInput
    connect?: SupplierProfileWhereUniqueInput
  }

  export type SupplierProfileUpdateOneRequiredWithoutAddressesNestedInput = {
    create?: XOR<SupplierProfileCreateWithoutAddressesInput, SupplierProfileUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutAddressesInput
    upsert?: SupplierProfileUpsertWithoutAddressesInput
    connect?: SupplierProfileWhereUniqueInput
    update?: XOR<XOR<SupplierProfileUpdateToOneWithWhereWithoutAddressesInput, SupplierProfileUpdateWithoutAddressesInput>, SupplierProfileUncheckedUpdateWithoutAddressesInput>
  }

  export type SupplierProfileCreateNestedOneWithoutOfferingsInput = {
    create?: XOR<SupplierProfileCreateWithoutOfferingsInput, SupplierProfileUncheckedCreateWithoutOfferingsInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutOfferingsInput
    connect?: SupplierProfileWhereUniqueInput
  }

  export type EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput = {
    set?: $Enums.SrmSupplierOfferingStatus
  }

  export type SupplierProfileUpdateOneRequiredWithoutOfferingsNestedInput = {
    create?: XOR<SupplierProfileCreateWithoutOfferingsInput, SupplierProfileUncheckedCreateWithoutOfferingsInput>
    connectOrCreate?: SupplierProfileCreateOrConnectWithoutOfferingsInput
    upsert?: SupplierProfileUpsertWithoutOfferingsInput
    connect?: SupplierProfileWhereUniqueInput
    update?: XOR<XOR<SupplierProfileUpdateToOneWithWhereWithoutOfferingsInput, SupplierProfileUpdateWithoutOfferingsInput>, SupplierProfileUncheckedUpdateWithoutOfferingsInput>
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

  export type NestedEnumSrmSupplierStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierStatus | EnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierStatusFilter<$PrismaModel> | $Enums.SrmSupplierStatus
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

  export type NestedEnumSrmSupplierStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierStatus | EnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierStatus[] | ListEnumSrmSupplierStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierStatusFilter<$PrismaModel>
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

  export type NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierPartyBindingStatus | EnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel> | $Enums.SrmSupplierPartyBindingStatus
  }

  export type NestedEnumSrmSupplierPartyBindingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierPartyBindingStatus | EnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierPartyBindingStatus[] | ListEnumSrmSupplierPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierPartyBindingStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierPartyBindingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierPartyBindingStatusFilter<$PrismaModel>
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

  export type NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierOfferingStatus | EnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel> | $Enums.SrmSupplierOfferingStatus
  }

  export type NestedEnumSrmSupplierOfferingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SrmSupplierOfferingStatus | EnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SrmSupplierOfferingStatus[] | ListEnumSrmSupplierOfferingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSrmSupplierOfferingStatusWithAggregatesFilter<$PrismaModel> | $Enums.SrmSupplierOfferingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel>
    _max?: NestedEnumSrmSupplierOfferingStatusFilter<$PrismaModel>
  }

  export type SupplierPartyBindingCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierPartyBindingCreateOrConnectWithoutSupplierProfileInput = {
    where: SupplierPartyBindingWhereUniqueInput
    create: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierContactCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierContactUncheckedCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierContactCreateOrConnectWithoutSupplierProfileInput = {
    where: SupplierContactWhereUniqueInput
    create: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierContactCreateManySupplierProfileInputEnvelope = {
    data: SupplierContactCreateManySupplierProfileInput | SupplierContactCreateManySupplierProfileInput[]
    skipDuplicates?: boolean
  }

  export type SupplierAddressCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierAddressUncheckedCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierAddressCreateOrConnectWithoutSupplierProfileInput = {
    where: SupplierAddressWhereUniqueInput
    create: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierAddressCreateManySupplierProfileInputEnvelope = {
    data: SupplierAddressCreateManySupplierProfileInput | SupplierAddressCreateManySupplierProfileInput[]
    skipDuplicates?: boolean
  }

  export type SupplierOfferingCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierOfferingUncheckedCreateWithoutSupplierProfileInput = {
    id: string
    tenantId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierOfferingCreateOrConnectWithoutSupplierProfileInput = {
    where: SupplierOfferingWhereUniqueInput
    create: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierOfferingCreateManySupplierProfileInputEnvelope = {
    data: SupplierOfferingCreateManySupplierProfileInput | SupplierOfferingCreateManySupplierProfileInput[]
    skipDuplicates?: boolean
  }

  export type SupplierPartyBindingUpsertWithoutSupplierProfileInput = {
    update: XOR<SupplierPartyBindingUpdateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedUpdateWithoutSupplierProfileInput>
    create: XOR<SupplierPartyBindingCreateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedCreateWithoutSupplierProfileInput>
    where?: SupplierPartyBindingWhereInput
  }

  export type SupplierPartyBindingUpdateToOneWithWhereWithoutSupplierProfileInput = {
    where?: SupplierPartyBindingWhereInput
    data: XOR<SupplierPartyBindingUpdateWithoutSupplierProfileInput, SupplierPartyBindingUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierPartyBindingUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierPartyBindingUncheckedUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumSrmSupplierPartyBindingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactUpsertWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierContactWhereUniqueInput
    update: XOR<SupplierContactUpdateWithoutSupplierProfileInput, SupplierContactUncheckedUpdateWithoutSupplierProfileInput>
    create: XOR<SupplierContactCreateWithoutSupplierProfileInput, SupplierContactUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierContactUpdateWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierContactWhereUniqueInput
    data: XOR<SupplierContactUpdateWithoutSupplierProfileInput, SupplierContactUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierContactUpdateManyWithWhereWithoutSupplierProfileInput = {
    where: SupplierContactScalarWhereInput
    data: XOR<SupplierContactUpdateManyMutationInput, SupplierContactUncheckedUpdateManyWithoutSupplierProfileInput>
  }

  export type SupplierContactScalarWhereInput = {
    AND?: SupplierContactScalarWhereInput | SupplierContactScalarWhereInput[]
    OR?: SupplierContactScalarWhereInput[]
    NOT?: SupplierContactScalarWhereInput | SupplierContactScalarWhereInput[]
    id?: UuidFilter<"SupplierContact"> | string
    tenantId?: StringFilter<"SupplierContact"> | string
    supplierId?: UuidFilter<"SupplierContact"> | string
    displayName?: StringFilter<"SupplierContact"> | string
    roleTitle?: StringNullableFilter<"SupplierContact"> | string | null
    email?: StringNullableFilter<"SupplierContact"> | string | null
    phone?: StringNullableFilter<"SupplierContact"> | string | null
    isPrimaryContact?: BoolFilter<"SupplierContact"> | boolean
    isActive?: BoolFilter<"SupplierContact"> | boolean
    createdAt?: DateTimeFilter<"SupplierContact"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierContact"> | Date | string
  }

  export type SupplierAddressUpsertWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierAddressWhereUniqueInput
    update: XOR<SupplierAddressUpdateWithoutSupplierProfileInput, SupplierAddressUncheckedUpdateWithoutSupplierProfileInput>
    create: XOR<SupplierAddressCreateWithoutSupplierProfileInput, SupplierAddressUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierAddressUpdateWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierAddressWhereUniqueInput
    data: XOR<SupplierAddressUpdateWithoutSupplierProfileInput, SupplierAddressUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierAddressUpdateManyWithWhereWithoutSupplierProfileInput = {
    where: SupplierAddressScalarWhereInput
    data: XOR<SupplierAddressUpdateManyMutationInput, SupplierAddressUncheckedUpdateManyWithoutSupplierProfileInput>
  }

  export type SupplierAddressScalarWhereInput = {
    AND?: SupplierAddressScalarWhereInput | SupplierAddressScalarWhereInput[]
    OR?: SupplierAddressScalarWhereInput[]
    NOT?: SupplierAddressScalarWhereInput | SupplierAddressScalarWhereInput[]
    id?: UuidFilter<"SupplierAddress"> | string
    tenantId?: StringFilter<"SupplierAddress"> | string
    supplierId?: UuidFilter<"SupplierAddress"> | string
    label?: StringFilter<"SupplierAddress"> | string
    countryCode?: StringFilter<"SupplierAddress"> | string
    region?: StringNullableFilter<"SupplierAddress"> | string | null
    locality?: StringNullableFilter<"SupplierAddress"> | string | null
    addressLine1?: StringFilter<"SupplierAddress"> | string
    addressLine2?: StringNullableFilter<"SupplierAddress"> | string | null
    postalCode?: StringNullableFilter<"SupplierAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"SupplierAddress"> | boolean
    isActive?: BoolFilter<"SupplierAddress"> | boolean
    createdAt?: DateTimeFilter<"SupplierAddress"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierAddress"> | Date | string
  }

  export type SupplierOfferingUpsertWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierOfferingWhereUniqueInput
    update: XOR<SupplierOfferingUpdateWithoutSupplierProfileInput, SupplierOfferingUncheckedUpdateWithoutSupplierProfileInput>
    create: XOR<SupplierOfferingCreateWithoutSupplierProfileInput, SupplierOfferingUncheckedCreateWithoutSupplierProfileInput>
  }

  export type SupplierOfferingUpdateWithWhereUniqueWithoutSupplierProfileInput = {
    where: SupplierOfferingWhereUniqueInput
    data: XOR<SupplierOfferingUpdateWithoutSupplierProfileInput, SupplierOfferingUncheckedUpdateWithoutSupplierProfileInput>
  }

  export type SupplierOfferingUpdateManyWithWhereWithoutSupplierProfileInput = {
    where: SupplierOfferingScalarWhereInput
    data: XOR<SupplierOfferingUpdateManyMutationInput, SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileInput>
  }

  export type SupplierOfferingScalarWhereInput = {
    AND?: SupplierOfferingScalarWhereInput | SupplierOfferingScalarWhereInput[]
    OR?: SupplierOfferingScalarWhereInput[]
    NOT?: SupplierOfferingScalarWhereInput | SupplierOfferingScalarWhereInput[]
    id?: UuidFilter<"SupplierOffering"> | string
    tenantId?: StringFilter<"SupplierOffering"> | string
    supplierId?: UuidFilter<"SupplierOffering"> | string
    itemId?: UuidFilter<"SupplierOffering"> | string
    itemCode?: StringNullableFilter<"SupplierOffering"> | string | null
    itemName?: StringNullableFilter<"SupplierOffering"> | string | null
    status?: EnumSrmSupplierOfferingStatusFilter<"SupplierOffering"> | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFilter<"SupplierOffering"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierOffering"> | Date | string
  }

  export type SupplierProfileCreateWithoutPartyBindingInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    contacts?: SupplierContactCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUncheckedCreateWithoutPartyBindingInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    contacts?: SupplierContactUncheckedCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressUncheckedCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingUncheckedCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileCreateOrConnectWithoutPartyBindingInput = {
    where: SupplierProfileWhereUniqueInput
    create: XOR<SupplierProfileCreateWithoutPartyBindingInput, SupplierProfileUncheckedCreateWithoutPartyBindingInput>
  }

  export type SupplierProfileUpsertWithoutPartyBindingInput = {
    update: XOR<SupplierProfileUpdateWithoutPartyBindingInput, SupplierProfileUncheckedUpdateWithoutPartyBindingInput>
    create: XOR<SupplierProfileCreateWithoutPartyBindingInput, SupplierProfileUncheckedCreateWithoutPartyBindingInput>
    where?: SupplierProfileWhereInput
  }

  export type SupplierProfileUpdateToOneWithWhereWithoutPartyBindingInput = {
    where?: SupplierProfileWhereInput
    data: XOR<SupplierProfileUpdateWithoutPartyBindingInput, SupplierProfileUncheckedUpdateWithoutPartyBindingInput>
  }

  export type SupplierProfileUpdateWithoutPartyBindingInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contacts?: SupplierContactUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileUncheckedUpdateWithoutPartyBindingInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contacts?: SupplierContactUncheckedUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUncheckedUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileCreateWithoutContactsInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingCreateNestedOneWithoutSupplierProfileInput
    addresses?: SupplierAddressCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUncheckedCreateWithoutContactsInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingUncheckedCreateNestedOneWithoutSupplierProfileInput
    addresses?: SupplierAddressUncheckedCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingUncheckedCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileCreateOrConnectWithoutContactsInput = {
    where: SupplierProfileWhereUniqueInput
    create: XOR<SupplierProfileCreateWithoutContactsInput, SupplierProfileUncheckedCreateWithoutContactsInput>
  }

  export type SupplierProfileUpsertWithoutContactsInput = {
    update: XOR<SupplierProfileUpdateWithoutContactsInput, SupplierProfileUncheckedUpdateWithoutContactsInput>
    create: XOR<SupplierProfileCreateWithoutContactsInput, SupplierProfileUncheckedCreateWithoutContactsInput>
    where?: SupplierProfileWhereInput
  }

  export type SupplierProfileUpdateToOneWithWhereWithoutContactsInput = {
    where?: SupplierProfileWhereInput
    data: XOR<SupplierProfileUpdateWithoutContactsInput, SupplierProfileUncheckedUpdateWithoutContactsInput>
  }

  export type SupplierProfileUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUpdateOneWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileUncheckedUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUncheckedUpdateOneWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUncheckedUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileCreateWithoutAddressesInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUncheckedCreateWithoutAddressesInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingUncheckedCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactUncheckedCreateNestedManyWithoutSupplierProfileInput
    offerings?: SupplierOfferingUncheckedCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileCreateOrConnectWithoutAddressesInput = {
    where: SupplierProfileWhereUniqueInput
    create: XOR<SupplierProfileCreateWithoutAddressesInput, SupplierProfileUncheckedCreateWithoutAddressesInput>
  }

  export type SupplierProfileUpsertWithoutAddressesInput = {
    update: XOR<SupplierProfileUpdateWithoutAddressesInput, SupplierProfileUncheckedUpdateWithoutAddressesInput>
    create: XOR<SupplierProfileCreateWithoutAddressesInput, SupplierProfileUncheckedCreateWithoutAddressesInput>
    where?: SupplierProfileWhereInput
  }

  export type SupplierProfileUpdateToOneWithWhereWithoutAddressesInput = {
    where?: SupplierProfileWhereInput
    data: XOR<SupplierProfileUpdateWithoutAddressesInput, SupplierProfileUncheckedUpdateWithoutAddressesInput>
  }

  export type SupplierProfileUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileUncheckedUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUncheckedUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUncheckedUpdateManyWithoutSupplierProfileNestedInput
    offerings?: SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileCreateWithoutOfferingsInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileUncheckedCreateWithoutOfferingsInput = {
    id: string
    supplierNo: string
    tenantId: string
    displayName: string
    status: $Enums.SrmSupplierStatus
    supplierCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    partyBinding?: SupplierPartyBindingUncheckedCreateNestedOneWithoutSupplierProfileInput
    contacts?: SupplierContactUncheckedCreateNestedManyWithoutSupplierProfileInput
    addresses?: SupplierAddressUncheckedCreateNestedManyWithoutSupplierProfileInput
  }

  export type SupplierProfileCreateOrConnectWithoutOfferingsInput = {
    where: SupplierProfileWhereUniqueInput
    create: XOR<SupplierProfileCreateWithoutOfferingsInput, SupplierProfileUncheckedCreateWithoutOfferingsInput>
  }

  export type SupplierProfileUpsertWithoutOfferingsInput = {
    update: XOR<SupplierProfileUpdateWithoutOfferingsInput, SupplierProfileUncheckedUpdateWithoutOfferingsInput>
    create: XOR<SupplierProfileCreateWithoutOfferingsInput, SupplierProfileUncheckedCreateWithoutOfferingsInput>
    where?: SupplierProfileWhereInput
  }

  export type SupplierProfileUpdateToOneWithWhereWithoutOfferingsInput = {
    where?: SupplierProfileWhereInput
    data: XOR<SupplierProfileUpdateWithoutOfferingsInput, SupplierProfileUncheckedUpdateWithoutOfferingsInput>
  }

  export type SupplierProfileUpdateWithoutOfferingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierProfileUncheckedUpdateWithoutOfferingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    supplierNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumSrmSupplierStatusFieldUpdateOperationsInput | $Enums.SrmSupplierStatus
    supplierCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    partyBinding?: SupplierPartyBindingUncheckedUpdateOneWithoutSupplierProfileNestedInput
    contacts?: SupplierContactUncheckedUpdateManyWithoutSupplierProfileNestedInput
    addresses?: SupplierAddressUncheckedUpdateManyWithoutSupplierProfileNestedInput
  }

  export type SupplierContactCreateManySupplierProfileInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierAddressCreateManySupplierProfileInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierOfferingCreateManySupplierProfileInput = {
    id: string
    tenantId: string
    itemId: string
    itemCode?: string | null
    itemName?: string | null
    status: $Enums.SrmSupplierOfferingStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierContactUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactUncheckedUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierContactUncheckedUpdateManyWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressUncheckedUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierAddressUncheckedUpdateManyWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingUncheckedUpdateWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierOfferingUncheckedUpdateManyWithoutSupplierProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemId?: StringFieldUpdateOperationsInput | string
    itemCode?: NullableStringFieldUpdateOperationsInput | string | null
    itemName?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumSrmSupplierOfferingStatusFieldUpdateOperationsInput | $Enums.SrmSupplierOfferingStatus
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